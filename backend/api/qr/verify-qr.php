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

$data = json_decode(file_get_contents("php://input"), true);

$qr_code = isset($data['qr_code']) ? trim($data['qr_code']) : '';

if (empty($qr_code)) {
    Response::error("QR code is required", 400);
}

// Try to get user if logged in (optional for QR verification)
$user_id = null;
try {
    $auth = new AuthMiddleware($db);
    $user = $auth->verifySession();
    $user_id = $user['id'];
} catch (Exception $e) {
    // User not logged in - that's okay for QR verification
    $user_id = null;
}

try {
    error_log("[VerifyQR] Verifying QR code: $qr_code for user_id: " . ($user_id ?? 'null'));
    
    // Find task by QR code
    // Check completion status only if user is logged in
    if ($user_id) {
        $query = "SELECT 
                    t.*,
                    a.name as attraction_name,
                    a.latitude,
                    a.longitude,
                    CASE WHEN uts.id IS NOT NULL THEN 1 ELSE 0 END as is_completed,
                    uts.id as submission_id
                  FROM tasks t
                  JOIN attractions a ON t.attraction_id = a.id
                  LEFT JOIN user_task_submissions uts 
                    ON t.id = uts.task_id AND uts.user_id = :user_id
                  WHERE t.qr_code = :qr_code";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':qr_code', $qr_code);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
    } else {
        // User not logged in - just verify QR code exists
        $query = "SELECT 
                    t.*,
                    a.name as attraction_name,
                    a.latitude,
                    a.longitude,
                    0 as is_completed,
                    NULL as submission_id
                  FROM tasks t
                  JOIN attractions a ON t.attraction_id = a.id
                  WHERE t.qr_code = :qr_code";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':qr_code', $qr_code);
        $stmt->execute();
    }

    if ($stmt->rowCount() == 0) {
        error_log("[VerifyQR] No task found with QR code: $qr_code");
        Response::error("Invalid QR code", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    error_log("[VerifyQR] Task found: ID={$task['id']}, Name={$task['name']}, is_completed={$task['is_completed']}, submission_id=" . ($task['submission_id'] ?? 'null'));

    if ($user_id && $task['is_completed']) {
        error_log("[VerifyQR] Task already completed! user_id=$user_id, task_id={$task['id']}, submission_id={$task['submission_id']}");
        Response::error("You have already completed this task", 400);
    }
    
    error_log("[VerifyQR] QR code verified successfully for user_id=" . ($user_id ?? 'null'));

    Response::success([
        'task' => $task,
        'message' => 'QR code verified! You can now start this mission.',
        'requires_login' => !$user_id
    ], "QR code verified");

} catch (PDOException $e) {
    error_log("Verify QR error: " . $e->getMessage());
    Response::serverError("Failed to verify QR code");
}
?>