<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$task_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($task_id <= 0) {
    Response::error("Invalid task ID", 400);
}

try {
    $query = "SELECT 
                t.*,
                CASE WHEN uts.id IS NOT NULL THEN 1 ELSE 0 END as is_completed
              FROM tasks t
              LEFT JOIN user_task_submissions uts 
                ON t.id = uts.task_id AND uts.user_id = :user_id
              WHERE t.id = :task_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        Response::notFound("Task not found");
    }

    $task = $stmt->fetch();
    
    // Add server time for time-based tasks (set to Malaysia timezone)
    date_default_timezone_set('Asia/Kuala_Lumpur');
    $task['server_time'] = date('H:i:s');

    Response::success($task, "Task details retrieved");

} catch (PDOException $e) {
    error_log("Get task error: " . $e->getMessage());
    Response::serverError("Failed to retrieve task");
}
?>