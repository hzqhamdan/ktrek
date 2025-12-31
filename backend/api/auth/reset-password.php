<?php

require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../config/email-config.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';
require_once '../../utils/email.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);

// Step 1: Request password reset (send email with token)
if (isset($data['action']) && $data['action'] === 'request') {
    $email = Security::sanitize($data['email']);
    
    if (!Security::validateEmail($email)) {
        Response::error("Invalid email format", 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        // Check if user exists
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            // Don't reveal if email exists or not (security)
            Response::success(null, "If the email exists, a reset link has been sent");
        }
        
        $user = $stmt->fetch();
        
        // Generate reset token
        $token = Security::generateToken(32);
        $expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiry
        
        // Delete any existing tokens for this user
        $query = "DELETE FROM password_reset_tokens WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        
        // Insert new token
        $query = "INSERT INTO password_reset_tokens (user_id, token, expires_at) 
                  VALUES (:user_id, :token, :expires_at)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expires_at', $expires_at);
        $stmt->execute();
        
        // Send password reset email
        $appUrl = defined('APP_URL') ? APP_URL : 'http://localhost:5173';
        $emailSent = Email::sendPasswordReset($email, $token, $appUrl);
        
        if (!$emailSent) {
            error_log("Failed to send password reset email to: " . $email);
            // Still return success for security (don't reveal if email exists)
        }
        
        Response::success(null, "If the email exists, a reset link has been sent");
        
    } catch (PDOException $e) {
        error_log("Password reset request error: " . $e->getMessage());
        Response::serverError("Failed to process request");
    }
}

// Step 2: Verify token and reset password
if (isset($data['action']) && $data['action'] === 'reset') {
    $token = Security::sanitize($data['token']);
    $new_password = $data['new_password'];
    
    if (strlen($new_password) < 8) {
        Response::error("Password must be at least 8 characters", 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        // Verify token
        $query = "SELECT user_id FROM password_reset_tokens 
                  WHERE token = :token 
                  AND expires_at > NOW() 
                  AND used = 0";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            Response::error("Invalid or expired reset token", 400);
        }
        
        $reset_token = $stmt->fetch();
        
        // Update password
        $password_hash = Security::hashPassword($new_password);
        $query = "UPDATE users SET password = :password WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':password', $password_hash);
        $stmt->bindParam(':user_id', $reset_token['user_id']);
        $stmt->execute();
        
        // Mark token as used
        $query = "UPDATE password_reset_tokens SET used = 1 WHERE token = :token";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        
        Response::success(null, "Password reset successfully");
        
    } catch (PDOException $e) {
        error_log("Password reset error: " . $e->getMessage());
        Response::serverError("Failed to reset password");
    }
}

Response::error("Invalid action", 400);
?>