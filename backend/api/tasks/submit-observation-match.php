<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/reward-helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$data = json_decode(file_get_contents("php://input"), true);

$task_id = isset($data['task_id']) ? intval($data['task_id']) : 0;
$selected_answers = isset($data['selected_answers']) ? $data['selected_answers'] : [];

if ($task_id <= 0) {
    Response::error("Task ID is required", 400);
}

if (empty($selected_answers) || !is_array($selected_answers)) {
    Response::error("Please select at least one answer", 400);
}

try {
    $db->beginTransaction();

    // 1. Get task details
    $query = "SELECT t.*, a.name as attraction_name, a.id as attraction_id, a.category
              FROM tasks t
              JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'observation_match'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Observation Match task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Get all options from database
    // Check both is_correct column AND option_metadata for backwards compatibility
    $query = "SELECT qo.id as option_id, qo.option_text, qo.is_correct, qo.option_metadata
              FROM quiz_questions qq
              JOIN quiz_options qo ON qo.question_id = qq.id
              WHERE qq.task_id = :task_id
              ORDER BY qo.option_order";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $options = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build correct answers list
    $correctAnswerIds = [];
    $allOptionIds = [];
    
    foreach ($options as $option) {
        $allOptionIds[] = $option['option_id'];
        
        // Check is_correct column first (primary source)
        $isCorrect = (bool)$option['is_correct'];
        
        // If not set in column, check option_metadata as fallback
        if (!$isCorrect && !empty($option['option_metadata'])) {
            $metadata = $option['option_metadata'];
            if (is_string($metadata)) {
                $metadata = json_decode($metadata, true);
            }
            if ($metadata && isset($metadata['is_correct']) && $metadata['is_correct']) {
                $isCorrect = true;
            }
        }
        
        if ($isCorrect) {
            $correctAnswerIds[] = $option['option_id'];
        }
    }
    
    // Validate we have correct answers configured
    if (empty($correctAnswerIds)) {
        $db->rollBack();
        Response::error("Task configuration error: No correct answers found", 500);
    }

    // 3. Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("You have already submitted this task", 400);
    }

    // 4. Validate user selections
    // Convert selected_answers to integers for comparison
    $userSelections = array_map('intval', $selected_answers);
    
    // Count correct selections (user selected a correct answer)
    $correctSelections = array_intersect($userSelections, $correctAnswerIds);
    $correctCount = count($correctSelections);
    
    // Count wrong selections (user selected an incorrect answer)
    $wrongSelections = array_diff($userSelections, $correctAnswerIds);
    $wrongCount = count($wrongSelections);
    
    // Total correct answers required
    $totalCorrectAnswers = count($correctAnswerIds);
    
    // User is fully correct only if they selected ALL correct answers and NO wrong answers
    $is_correct = ($correctCount === $totalCorrectAnswers) && ($wrongCount === 0);
    
    // Calculate score: correct selections minus wrong selections, divided by total correct answers
    // Score cannot go below 0
    $score = max(0, (($correctCount - $wrongCount) / $totalCorrectAnswers) * 100);

    // 5. Store submission
    $answer_data = json_encode([
        'selected_answers' => $userSelections,
        'correct_answers' => $correctAnswerIds,
        'correct_count' => $correctCount,
        'wrong_count' => $wrongCount,
        'total_correct_answers' => $totalCorrectAnswers
    ]);

    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, answer, score, is_correct, submitted_at)
              VALUES (:user_id, :task_id, :answer, :score, :is_correct, NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':answer', $answer_data);
    $stmt->bindParam(':score', $score);
    $stmt->bindParam(':is_correct', $is_correct, PDO::PARAM_BOOL);
    $stmt->execute();

    $submission_id = $db->lastInsertId();

    // 6. Update progress
    $query = "INSERT INTO progress (user_id, attraction_id, task_id, completed_at)
              VALUES (:user_id, :attraction_id, :task_id, NOW())
              ON DUPLICATE KEY UPDATE completed_at = NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':attraction_id', $task['attraction_id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    $db->commit();

    // === REWARD SYSTEM INTEGRATION ===
    $rewards = null;
    try {
        if ($is_correct) {
            // Award rewards using RewardHelper class (works with PDO)
            $rewards = RewardHelper::awardTaskCompletion(
                $db,
                $user['id'],
                $task_id,
                $task['attraction_id'],
                $task['category'],
                'observation_match'
            );
        }
    } catch (Exception $e) {
        error_log("Observation match reward error: " . $e->getMessage());
        // Don't fail the submission if rewards fail
    }
    // === END REWARD INTEGRATION ===

    // 8. Return response
    Response::success([
        'submission_id' => $submission_id,
        'is_correct' => $is_correct,
        'score' => round($score, 2),
        'correct_count' => $correctCount,
        'total_correct_answers' => $totalCorrectAnswers,
        'wrong_count' => $wrongCount,
        'message' => $is_correct 
            ? "Perfect! You selected all the correct answers!" 
            : "You got {$correctCount} out of {$totalCorrectAnswers} correct" . ($wrongCount > 0 ? " with {$wrongCount} wrong selection(s)." : "."),
        'rewards' => $rewards,
        'attraction_id' => $task['attraction_id']
    ], "Observation match submitted successfully", 201);

} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Observation match submission fatal error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    Response::serverError("Failed to submit observation match: " . $e->getMessage());
}
?>
