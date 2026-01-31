<?php
/**
 * Reset Manager Password API
 * Allows superadmin to reset manager passwords
 */

session_start();
header('Content-Type: application/json');

require_once '../config.php';

// Check if user is superadmin
if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'superadmin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Only superadmin can reset passwords.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$adminId = $data['admin_id'] ?? null;
$requestId = $data['request_id'] ?? null; // Optional - if resetting via request approval
$action = $data['action'] ?? 'reset'; // 'reset' or 'approve_request'

if (!$adminId) {
    echo json_encode(['success' => false, 'message' => 'Admin ID is required']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Verify the admin exists and is a manager
    $stmt = $conn->prepare("SELECT id, email, full_name, role FROM admin WHERE id = ?");
    $stmt->bind_param("i", $adminId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Admin not found']);
        exit;
    }
    
    $admin = $result->fetch_assoc();
    
    // Prevent superadmin from resetting their own password this way
    if ($admin['role'] !== 'manager') {
        echo json_encode(['success' => false, 'message' => 'Can only reset passwords for managers']);
        exit;
    }
    
    // Just mark the request as approved - no temporary password needed
    // Manager will set their own password on next login
    
    if ($requestId) {
        // Update the password reset request to approved status
        $stmt = $conn->prepare("UPDATE admin_password_reset_requests SET status = 'approved', processed_at = NOW(), processed_by = ? WHERE id = ?");
        $stmt->bind_param("ii", $_SESSION['admin_id'], $requestId);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Request not found or already processed']);
            exit;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Request ID is required']);
        exit;
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Password reset request approved. Manager can now set their new password on login.',
        'manager_email' => $admin['email'],
        'manager_name' => $admin['full_name']
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error resetting password: ' . $e->getMessage()]);
}
