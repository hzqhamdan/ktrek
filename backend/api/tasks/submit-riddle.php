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
$selected_option_id = isset($data['selected_option_id']) ? intval($data['selected_option_id']) : 0;

if ($task_id <= 0) {
    Response::error("Task ID is required", 400);
}

if ($selected_option_id <= 0) {
    Response::error("Please select an answer", 400);
}

try {
    $db->beginTransaction();

    // 1. Get task details
    $query = "SELECT t.*, a.name as attraction_name, a.id as attraction_id, a.category
              FROM tasks t
              JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'riddle'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Riddle task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Get the riddle question and check answer
    $query = "SELECT qq.id as question_id, qq.question_text, 
              qo.id as option_id, qo.option_text, qo.is_correct
              FROM quiz_questions qq
              LEFT JOIN quiz_options qo ON qo.question_id = qq.id
              WHERE qq.task_id = :task_id AND qo.id = :selected_option_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':selected_option_id', $selected_option_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Invalid answer option", 400);
    }

    $answer = $stmt->fetch(PDO::FETCH_ASSOC);
    $is_correct = (bool)$answer['is_correct'];
    $score = $is_correct ? 100 : 0;

    // 3. Get all options for response
    $query = "SELECT qo.id as option_id, qo.option_text, qo.is_correct
              FROM quiz_questions qq
              LEFT JOIN quiz_options qo ON qo.question_id = qq.id
              WHERE qq.task_id = :task_id
              ORDER BY qo.option_order";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $all_options = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $correct_option = null;
    foreach ($all_options as $opt) {
        if ($opt['is_correct']) {
            $correct_option = $opt;
            break;
        }
    }

    // 4. Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("You have already submitted this riddle", 400);
    }

    // 5. Store submission
    $answer_data = json_encode([
        'selected_option_id' => $selected_option_id,
        'selected_text' => $answer['option_text'],
        'correct_option_id' => $correct_option ? $correct_option['option_id'] : null,
        'correct_text' => $correct_option ? $correct_option['option_text'] : null,
        'riddle_text' => $answer['question_text']
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

    // 6. Award rewards if correct
    $rewards = null;
    if ($is_correct) {
        $rewards = RewardHelper::awardTaskCompletion(
            $db,
            $user['id'],
            $task_id,
            $task['attraction_id'],
            $task['category'],
            'riddle'
        );
    }

    // 7. Update progress
    $query = "INSERT INTO progress (user_id, attraction_id, task_id, completed_at)
              VALUES (:user_id, :attraction_id, :task_id, NOW())
              ON DUPLICATE KEY UPDATE completed_at = NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':attraction_id', $task['attraction_id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    $db->commit();

    // 8. Return response
    Response::success([
        'submission_id' => $submission_id,
        'is_correct' => $is_correct,
        'score' => $score,
        'selected_option' => [
            'id' => $selected_option_id,
            'text' => $answer['option_text']
        ],
        'correct_option' => $correct_option ? [
            'id' => $correct_option['option_id'],
            'text' => $correct_option['option_text']
        ] : null,
        'riddle_text' => $answer['question_text'],
        'message' => $is_correct 
            ? "Correct! You solved the riddle!" 
            : "Not quite. The correct answer is: " . ($correct_option ? $correct_option['option_text'] : 'N/A'),
        'rewards' => $rewards,
        'attraction_id' => $task['attraction_id']
    ], "Riddle submitted successfully", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Riddle submission error: " . $e->getMessage());
    Response::serverError("Failed to submit riddle");
}
?>
