<?php
/**
 * Check Approved Reset API
 * Check if a user has an approved password reset request
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Email is required']);
        exit;
    }
    
    try {
        $conn = getDBConnection();
        
        // Check if admin exists
        $stmt = $conn->prepare("SELECT id FROM admin WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => true, 'has_approved_reset' => false]);
            exit;
        }
        
        $admin = $result->fetch_assoc();
        
        // Check for approved reset request
        $stmt = $conn->prepare("SELECT id, processed_at FROM admin_password_reset_requests WHERE admin_id = ? AND status = 'approved' ORDER BY processed_at DESC LIMIT 1");
        $stmt->bind_param("i", $admin['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $request = $result->fetch_assoc();
            echo json_encode([
                'success' => true,
                'has_approved_reset' => true,
                'processed_at' => $request['processed_at']
            ]);
        } else {
            echo json_encode(['success' => true, 'has_approved_reset' => false]);
        }
        
        $conn->close();
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error checking status']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
