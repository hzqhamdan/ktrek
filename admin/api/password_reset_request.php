<?php
/**
 * Password Reset Request API
 * Allows managers to request password reset from superadmin
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Handle POST - Manager requests password reset
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $message = $data['message'] ?? '';
    
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Email is required']);
        exit;
    }
    
    try {
        $conn = getDBConnection();
        
        // Check if admin exists with this email
        $stmt = $conn->prepare("SELECT id, role, full_name FROM admin WHERE email = ? AND is_active = 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            // Don't reveal if email exists (security)
            echo json_encode([
                'success' => true, 
                'message' => 'If your email is registered, a password reset request has been sent to the administrator.'
            ]);
            exit;
        }
        
        $admin = $result->fetch_assoc();
        
        // Only managers can request password reset (superadmin can reset their own via other means)
        if ($admin['role'] !== 'manager') {
            echo json_encode([
                'success' => true, 
                'message' => 'If your email is registered, a password reset request has been sent to the administrator.'
            ]);
            exit;
        }
        
        // Check if there's already a pending request
        // Once a request is approved/rejected/completed, user can submit a new one immediately
        $stmt = $conn->prepare("SELECT id, requested_at FROM admin_password_reset_requests WHERE admin_id = ? AND status = 'pending'");
        $stmt->bind_param("i", $admin['id']);
        $stmt->execute();
        $existing = $stmt->get_result();
        
        if ($existing->num_rows > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'You already have a pending password reset request. Please wait for administrator approval or contact 019-2590381 for urgent assistance.'
            ]);
            exit;
        }
        
        // Create password reset request
        $stmt = $conn->prepare("INSERT INTO admin_password_reset_requests (admin_id, requested_by_email, request_message) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $admin['id'], $email, $message);
        $stmt->execute();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Password reset request submitted successfully!',
            'instructions' => 'Please try logging in again after 1 hour. Your temporary password will be active by then.',
            'urgent_contact' => '019-2590381',
            'request_id' => $conn->insert_id
        ]);
        
        $conn->close();
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again later.']);
    }
}

// Handle GET - Get pending requests count (for notification badge)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    session_start();
    
    // Only superadmin can view pending requests
    if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'superadmin') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
    
    try {
        $conn = getDBConnection();
        
        // Get count of pending requests
        $result = $conn->query("SELECT COUNT(*) as count FROM admin_password_reset_requests WHERE status = 'pending'");
        $row = $result->fetch_assoc();
        
        echo json_encode([
            'success' => true, 
            'count' => (int)$row['count']
        ]);
        
        $conn->close();
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching requests']);
    }
}
