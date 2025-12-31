<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/response.php';
require_once '../../utils/qrcode.php';

// Allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : 0;
$allow_generate = isset($_GET['allow_generate']) && $_GET['allow_generate'] === 'true';

if ($task_id <= 0) {
    Response::error("Invalid task ID", 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Fetch task
    $query = "SELECT id, name, type, qr_code FROM tasks WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        Response::error("Task not found", 404);
    }
    
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Validate task type
    if ($task['type'] !== 'checkin') {
        Response::error("QR codes are only available for check-in tasks", 400);
    }
    
    $qr_code = $task['qr_code'];
    
    // Generate QR code if missing and allowed
    if (empty($qr_code) && $allow_generate) {
        $qr_code = QRCodeGenerator::generateToken(32);
        
        // Update task with new QR code
        $updateQuery = "UPDATE tasks SET qr_code = :qr_code WHERE id = :task_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':qr_code', $qr_code);
        $updateStmt->bindParam(':task_id', $task_id);
        $updateStmt->execute();
    }
    
    if (empty($qr_code)) {
        Response::error("No QR code available for this task. Generate one first.", 400);
    }
    
    // Stream QR code image
    QRCodeGenerator::streamImage($qr_code, 400);
    
} catch (PDOException $e) {
    error_log("Generate QR error: " . $e->getMessage());
    Response::serverError("Failed to generate QR code");
}
?>
