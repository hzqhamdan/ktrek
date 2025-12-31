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

$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : 0;

if ($task_id <= 0) {
    Response::error("Invalid task ID", 400);
}

try {
    $user_id = $user['id'];
    
    // Get task details
    $query = "SELECT t.*, a.id as attraction_id
              FROM tasks t
              JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        Response::error("Task not found", 404);
    }
    
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    $attraction_id = $task['attraction_id'];
    
    // Check if user has completed the check-in task for this attraction
    $query = "SELECT COUNT(*) as checkin_completed
              FROM user_task_submissions uts
              JOIN tasks t ON uts.task_id = t.id
              WHERE uts.user_id = :user_id 
              AND t.attraction_id = :attraction_id
              AND t.type = 'checkin'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':attraction_id', $attraction_id);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $checkin_completed = $result['checkin_completed'] > 0;
    
    // If current task is check-in type, allow access
    if ($task['type'] === 'checkin') {
        Response::success([
            'can_access' => true,
            'message' => 'Check-in task available'
        ]);
    }
    
    // For other task types, check-in must be completed first
    if (!$checkin_completed) {
        Response::success([
            'can_access' => false,
            'message' => 'You must complete the check-in task first',
            'requires_checkin' => true
        ], 'Check-in required');
    }
    
    Response::success([
        'can_access' => true,
        'message' => 'Task accessible'
    ]);
    
} catch (PDOException $e) {
    error_log("Check prerequisite error: " . $e->getMessage());
    Response::serverError("Failed to check task prerequisites");
}
?>
