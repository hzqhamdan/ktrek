<?php
/**
 * Reject Password Reset Request API
 * Allows superadmin to reject password reset requests
 */

session_start();
header('Content-Type: application/json');

require_once '../config.php';

// Check if user is superadmin
if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'superadmin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Only superadmin can reject requests.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$requestId = $data['request_id'] ?? null;
$reason = $data['reason'] ?? 'No reason provided';

if (!$requestId) {
    echo json_encode(['success' => false, 'message' => 'Request ID is required']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Update request status to rejected
    $stmt = $conn->prepare("UPDATE admin_password_reset_requests SET status = 'rejected', processed_at = NOW(), processed_by = ?, rejection_reason = ? WHERE id = ? AND status = 'pending'");
    $stmt->bind_param("isi", $_SESSION['admin_id'], $reason, $requestId);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Request not found or already processed']);
        exit;
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Password reset request rejected'
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error rejecting request: ' . $e->getMessage()]);
}
?>
