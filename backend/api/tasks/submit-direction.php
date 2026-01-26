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
$selected_direction = isset($data['selected_direction']) ? trim($data['selected_direction']) : '';

if ($task_id <= 0) {
    Response::error("Task ID is required", 400);
}

if (empty($selected_direction)) {
    Response::error("Please select a direction", 400);
}

try {
    $db->beginTransaction();
    error_log("Direction task submission started for task_id: $task_id, user_id: {$user['id']}, direction: $selected_direction");

    // 1. Get task details
    $query = "SELECT t.*, a.name as attraction_name, a.id as attraction_id, a.category
              FROM tasks t
              JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'direction'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    error_log("Step 1: Query executed, row count: " . $stmt->rowCount());

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Direction task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    error_log("Step 1: Task found - " . $task['name']);

    // 2. Get the question and correct answer
    $query = "SELECT qq.id as question_id, qq.question_text, qo.option_text, qo.is_correct
              FROM quiz_questions qq
              LEFT JOIN quiz_options qo ON qo.question_id = qq.id
              WHERE qq.task_id = :task_id
              ORDER BY qq.question_order, qo.option_order";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    error_log("Step 2: Options query executed, row count: " . $stmt->rowCount());

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        error_log("Step 2 ERROR: No question configured");
        Response::error("Direction task has no question configured", 500);
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $question_text = $rows[0]['question_text'];
    $correct_direction = '';
    $all_options = [];

    foreach ($rows as $row) {
        $all_options[] = $row['option_text'];
        if ($row['is_correct']) {
            $correct_direction = $row['option_text'];
        }
    }
    error_log("Step 2: Found correct direction: $correct_direction");

    if (empty($correct_direction)) {
        $db->rollBack();
        error_log("Step 2 ERROR: No correct direction configured");
        Response::error("No correct direction configured", 500);
    }

    // 3. Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    error_log("Step 3: Checking if already submitted, found: " . $stmt->rowCount());

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        error_log("Step 3 ERROR: Already submitted");
        Response::error("You have already submitted this task", 400);
    }

    // 4. Check if direction is correct (case-insensitive)
    $is_correct = strcasecmp($selected_direction, $correct_direction) === 0;
    $score = $is_correct ? 100 : 0;

    // 5. Store submission
    $answer_data = json_encode([
        'selected_direction' => $selected_direction,
        'correct_direction' => $correct_direction,
        'question' => $question_text
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
            'direction'
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
        'selected_direction' => $selected_direction,
        'correct_direction' => $correct_direction,
        'question' => $question_text,
        'message' => $is_correct 
            ? "Correct! The direction is {$correct_direction}." 
            : "Not quite. The correct direction is {$correct_direction}.",
        'rewards' => $rewards,
        'attraction_id' => $task['attraction_id']
    ], "Task submitted successfully", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Direction task submission error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    Response::error("Database error: " . $e->getMessage(), 500);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Direction task error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    Response::error("Error: " . $e->getMessage(), 500);
}
?>
