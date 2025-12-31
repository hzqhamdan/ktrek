<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['current_password']) || !isset($input['new_password'])) {
    Response::error('Current password and new password are required', 400);
}

$currentPassword = $input['current_password'];
$newPassword = $input['new_password'];

// Validate new password
if (strlen($newPassword) < 6) {
    Response::error('New password must be at least 6 characters long', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify authentication
    $auth = new AuthMiddleware($db);
    $user = $auth->verifySession();
    
    // Get user's current password hash
    $query = "SELECT password FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();
    
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$userData) {
        Response::error('User not found', 404);
    }
    
    // Verify current password
    if (!password_verify($currentPassword, $userData['password'])) {
        Response::error('Current password is incorrect', 401);
    }
    
    // Hash new password
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update password
    $updateQuery = "UPDATE users SET password = :password, updated_at = NOW() WHERE id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':password', $newPasswordHash);
    $updateStmt->bindParam(':user_id', $user['id']);
    
    if ($updateStmt->execute()) {
        Response::success([
            'message' => 'Password changed successfully'
        ], 'Password changed successfully');
    } else {
        Response::error('Failed to update password', 500);
    }
    
} catch (Exception $e) {
    error_log("Change password error: " . $e->getMessage());
    Response::error('An error occurred while changing password', 500);
}
