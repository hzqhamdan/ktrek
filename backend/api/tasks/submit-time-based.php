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

if ($task_id <= 0) {
    Response::error("Task ID is required", 400);
}

try {
    $db->beginTransaction();

    $query = "SELECT t.*, t.task_config, a.id as attraction_id, a.category
              FROM tasks t JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'time_based'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Time-based task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    $config = json_decode($task['task_config'], true);

    // Check current time is within window (Malaysia timezone)
    date_default_timezone_set('Asia/Kuala_Lumpur');
    $current_time = date('H:i:s');
    $start_time = $config['start_time'];
    $end_time = $config['end_time'];
    
    $is_correct = ($current_time >= $start_time && $current_time <= $end_time);

    if (!$is_correct) {
        $db->rollBack();
        Response::error("You can only complete this task between {$start_time} and {$end_time}", 400);
    }

    // Check if already submitted
    $query = "SELECT id FROM user_task_submissions WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("Already completed", 400);
    }

    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, answer, score, is_correct, submitted_at)
              VALUES (:user_id, :task_id, :answer, 100, 1, NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $answer = json_encode(['check_in_time' => $current_time]);
    $stmt->bindParam(':answer', $answer);
    $stmt->execute();

    $rewards = RewardHelper::awardTaskCompletion($db, $user['id'], $task_id, 
               $task['attraction_id'], $task['category'], 'time_based');

    $query = "INSERT INTO progress (user_id, attraction_id, task_id, completed_at)
              VALUES (:user_id, :attraction_id, :task_id, NOW())
              ON DUPLICATE KEY UPDATE completed_at = NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':attraction_id', $task['attraction_id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    $db->commit();

    Response::success([
        'is_correct' => true,
        'score' => 100,
        'check_in_time' => $current_time,
        'time_window' => "{$start_time} - {$end_time}",
        'message' => "Perfect timing! Task completed.",
        'rewards' => $rewards,
        'attraction_id' => $task['attraction_id']
    ], "Time-based task completed", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Time-based task error: " . $e->getMessage());
    Response::serverError("Failed to complete task");
}
?>
