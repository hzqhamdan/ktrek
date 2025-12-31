<?php
// Generate QR token for a task
require_once '../config.php';

session_start();
if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'generate_token') {
        $task_id = isset($input['task_id']) ? intval($input['task_id']) : 0;
        
        if ($task_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid task ID']);
            exit();
        }
        
        // Generate secure random token
        $token = bin2hex(random_bytes(32));
        
        // Update task with new QR code
        $stmt = $conn->prepare("UPDATE tasks SET qr_code = ? WHERE id = ?");
        $stmt->bind_param("si", $token, $task_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'qr_code' => $token,
                'message' => 'QR token generated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to generate QR token'
            ]);
        }
        
        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>
