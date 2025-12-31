<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/constants.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['code'])) {
    Response::error("Email and code are required", 400);
}

$email = Security::sanitize($data['email']);
$code = Security::sanitize($data['code']);

// Validate inputs
if (!Security::validateEmail($email)) {
    Response::error("Invalid email format", 400);
}

if (strlen($code) !== 6 || !ctype_digit($code)) {
    Response::error("Invalid code format", 400);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    // Verify the code
    $query = "SELECT id, expires_at, is_used FROM verification_codes 
              WHERE email = :email AND code = :code 
              ORDER BY created_at DESC LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':code', $code);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        Response::error("Invalid verification code", 401);
    }

    $verification = $stmt->fetch();

    // Check if code is already used
    if ($verification['is_used']) {
        Response::error("Code has already been used", 400);
    }

    // Check if code has expired
    if (strtotime($verification['expires_at']) < time()) {
        Response::error("Verification code has expired", 400);
    }

    // Mark code as used
    $updateQuery = "UPDATE verification_codes SET is_used = TRUE WHERE id = :id";
    $stmt = $db->prepare($updateQuery);
    $stmt->bindParam(':id', $verification['id']);
    $stmt->execute();

    // Check if user already exists
    $userQuery = "SELECT id, username, email, phone_number, full_name, is_active, auth_provider 
                  FROM users WHERE email = :email";
    $stmt = $db->prepare($userQuery);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        // Existing user - log them in
        $user = $stmt->fetch();

        // Check if account is active
        if (!$user['is_active']) {
            Response::error("Account is deactivated", 403);
        }

        // Generate session token
        $session_token = Security::generateSessionToken();
        $expires_at = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);

        // Create session
        try {
            $sessionQuery = "INSERT INTO sessions (user_id, token, expires_at) 
                           VALUES (:user_id, :token, :expires)";
            
            $stmt = $db->prepare($sessionQuery);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->bindParam(':token', $session_token);
            $stmt->bindParam(':expires', $expires_at);
            $stmt->execute();
        } catch (PDOException $sessionError) {
            error_log("Session creation warning: " . $sessionError->getMessage());
        }

        // Update last login
        $updateLoginQuery = "UPDATE users SET updated_at = NOW() WHERE id = :user_id";
        $stmt = $db->prepare($updateLoginQuery);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();

        // Return user data
        Response::success([
            'token' => $session_token,
            'expires_at' => $expires_at,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'phone_number' => $user['phone_number'],
                'full_name' => $user['full_name'],
                'auth_provider' => $user['auth_provider']
            ],
            'is_new_user' => false
        ], "Verification successful");

    } else {
        // New user - return email for registration
        Response::success([
            'email' => $email,
            'is_new_user' => true,
            'message' => 'Email verified. Please complete registration.'
        ], "Email verified");
    }

} catch (PDOException $e) {
    error_log("Verify code error: " . $e->getMessage());
    Response::serverError("Verification failed");
}
?>
