<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$data = json_decode(file_get_contents("php://input"), true);

$qr_code = isset($data['qr_code']) ? trim($data['qr_code']) : '';

if (empty($qr_code)) {
    Response::error("QR code is required", 400);
}

try {
    // Find task by QR code
    $query = "SELECT 
                t.*,
                a.name as attraction_name,
                CASE WHEN uts.id IS NOT NULL THEN 1 ELSE 0 END as is_completed
              FROM tasks t
              JOIN attractions a ON t.attraction_id = a.id
              LEFT JOIN user_task_submissions uts 
                ON t.id = uts.task_id AND uts.user_id = :user_id
              WHERE t.qr_code = :qr_code";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':qr_code', $qr_code);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        Response::error("Invalid QR code", 404);
    }

    $task = $stmt->fetch();

    if ($task['is_completed']) {
        Response::error("You have already completed this task", 400);
    }

    Response::success([
        'task' => $task,
        'message' => 'QR code verified! You can now start this mission.'
    ], "QR code verified");

} catch (PDOException $e) {
    error_log("Verify QR error: " . $e->getMessage());
    Response::serverError("Failed to verify QR code");
}
?>