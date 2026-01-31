<?php
/**
 * Set New Password After Reset API
 * Allows manager to set new password after superadmin approves reset request
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $newPassword = $data['new_password'] ?? '';
    $confirmPassword = $data['confirm_password'] ?? '';
    
    // Validate inputs
    if (empty($email) || empty($newPassword) || empty($confirmPassword)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
    
    if ($newPassword !== $confirmPassword) {
        echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
        exit;
    }
    
    // Password strength validation
    if (strlen($newPassword) < 8) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long']);
        exit;
    }
    
    if (!preg_match('/[A-Z]/', $newPassword)) {
        echo json_encode(['success' => false, 'message' => 'Password must contain at least one uppercase letter']);
        exit;
    }
    
    if (!preg_match('/[a-z]/', $newPassword)) {
        echo json_encode(['success' => false, 'message' => 'Password must contain at least one lowercase letter']);
        exit;
    }
    
    if (!preg_match('/[0-9]/', $newPassword)) {
        echo json_encode(['success' => false, 'message' => 'Password must contain at least one number']);
        exit;
    }
    
    try {
        $conn = getDBConnection();
        
        // Get admin by email
        $stmt = $conn->prepare("SELECT id FROM admin WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        $admin = $result->fetch_assoc();
        $adminId = $admin['id'];
        
        // Check if there's an approved password reset request for this user
        $stmt = $conn->prepare("SELECT id FROM admin_password_reset_requests WHERE admin_id = ? AND status = 'approved' ORDER BY processed_at DESC LIMIT 1");
        $stmt->bind_param("i", $adminId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'No approved password reset request found. Please contact administrator.']);
            exit;
        }
        
        $request = $result->fetch_assoc();
        $requestId = $request['id'];
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        
        // Update admin password and clear must_change_password flag
        $stmt = $conn->prepare("UPDATE admin SET password = ?, must_change_password = 0, last_password_reset = NOW() WHERE id = ?");
        $stmt->bind_param("si", $hashedPassword, $adminId);
        $stmt->execute();
        
        // Mark the request as completed
        $stmt = $conn->prepare("UPDATE admin_password_reset_requests SET status = 'completed', notes = 'Password set by user' WHERE id = ?");
        $stmt->bind_param("i", $requestId);
        $stmt->execute();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Password set successfully! You can now login with your new password.'
        ]);
        
        $conn->close();
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again later.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
