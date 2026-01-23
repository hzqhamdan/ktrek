<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

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
$answers = isset($data['answers']) ? $data['answers'] : [];

if ($task_id <= 0 || empty($answers)) {
    Response::error("Task ID and answers are required", 400);
}

try {
    $db->beginTransaction();

    $user_id = $user['id']; // Fix: auth middleware returns 'id', not 'user_id'

    // Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("Quiz already submitted", 400);
    }

    // Validate answers and calculate score
    $total_questions = 0;
    $correct_answers = 0;

    foreach ($answers as $answer) {
        $question_id = $answer['question_id'];
        $selected_option_id = $answer['selected_option_id'];

        // Check if selected option is correct
        $query = "SELECT is_correct FROM quiz_options WHERE id = :option_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':option_id', $selected_option_id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $option = $stmt->fetch();
            if ($option['is_correct']) {
                $correct_answers++;
            }
            $total_questions++;
        }
    }

    $score = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100) : 0;
    $is_correct = $correct_answers == $total_questions; // All must be correct

    // Store submission
    $answer_json = json_encode($answers);
    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, answer, is_correct, score) 
              VALUES (:user_id, :task_id, :answer, :is_correct, :score)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':answer', $answer_json);
    $stmt->bindParam(':is_correct', $is_correct);
    $stmt->bindParam(':score', $score);
    $stmt->execute();

    // Update progress using stored procedure
    $query = "CALL update_user_progress(:user_id, :task_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    // Get current attraction_id (MOVED UP - needed for rewards)
    $query = "SELECT attraction_id FROM tasks WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $currentTask = $stmt->fetch(PDO::FETCH_ASSOC);
    $attraction_id = $currentTask['attraction_id'];

    $db->commit();
    
    // === REWARD SYSTEM INTEGRATION ===
    // Convert PDO connection to mysqli for reward functions
    $mysqli = new mysqli('localhost', 'root', '', 'ktrek_db');
    
    // Award task stamp
    awardTaskStamp($mysqli, $user_id, $task_id, $attraction_id, 'quiz');
    
    // Award XP based on score
    $xp_result = awardTaskXP($mysqli, $user_id, 'quiz', $task_id, $score);
    
    // Check if attraction is now complete
    $completion_result = checkAttractionCompletion($mysqli, $user_id, $attraction_id);
    
    // Get newly earned rewards
    $new_rewards = getNewlyEarnedRewards($mysqli, $user_id, 15);
    
    // Get updated user stats (includes XP and EP)
    $user_stats = getUserCurrentStats($mysqli, $user_id);
    
    // Get EP earned in this session
    $ep_earned = getRecentEP($mysqli, $user_id, 15);
    
    // Get category progress for the current attraction
    $category = getAttractionCategory($mysqli, $attraction_id);
    $category_progress = getCategoryProgress($mysqli, $user_id);
    $current_category_progress = isset($category_progress[$category]) ? $category_progress[$category] : null;
    
    $mysqli->close();
    // === END REWARD INTEGRATION ===

    // Get next task in the same attraction
    $query = "SELECT t.id
              FROM tasks t
              WHERE t.attraction_id = :attraction_id
              AND t.id NOT IN (
                  SELECT task_id FROM user_task_submissions 
                  WHERE user_id = :user_id
              )
              ORDER BY t.id ASC
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':attraction_id', $attraction_id);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $nextTask = $stmt->fetch(PDO::FETCH_ASSOC);

    Response::success([
        'score' => $score,
        'correct_answers' => $correct_answers,
        'total_questions' => $total_questions,
        'is_perfect' => $is_correct,
        'next_task_id' => $nextTask ? $nextTask['id'] : null,
        'attraction_id' => $attraction_id,
        // Enhanced reward data with EP and category progress
        'rewards' => [
            'xp_earned' => $xp_result['xp'],
            'ep_earned' => $ep_earned,
            'new_rewards' => $new_rewards,
            'user_stats' => $user_stats,
            'attraction_complete' => $completion_result['complete'],
            'completion_data' => $completion_result,
            'category_progress' => $current_category_progress
        ]
    ], "Quiz submitted successfully", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Submit quiz error: " . $e->getMessage());
    Response::serverError("Failed to submit quiz");
}
?>