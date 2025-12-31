<?php
require_once '../../config/cors.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


// Use dynamic CORS configuration that supports any localhost port

require_once '../../config/database.php';
require_once '../../config/constants.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    Response::error("Email/phone and password are required", 400);
}

$identifier = Security::sanitize($data['email']); // Can be email or phone
$password = $data['password'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    // Determine if identifier is phone or email
    $isPhone = strpos($identifier, '+6') === 0;

    // Build query based on identifier type
    if ($isPhone) {
        $query = "SELECT id, username, email, phone_number, password, full_name, is_active, auth_provider 
                  FROM users WHERE phone_number = :identifier";
    } else {
        $query = "SELECT id, username, email, phone_number, password, full_name, is_active, auth_provider 
                  FROM users WHERE email = :identifier";
    }
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':identifier', $identifier);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        Response::error("Invalid credentials", 401);
    }

    $user = $stmt->fetch();

    // Check if account is active
    if (!$user['is_active']) {
        Response::error("Account is deactivated", 403);
    }

    // Verify password
    if (!Security::verifyPassword($password, $user['password'])) {
        Response::error("Invalid credentials", 401);
    }

    // Generate session token
    $session_token = Security::generateSessionToken();
    $expires_at = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);

    // Create session (if sessions table exists)
    try {
        $query = "INSERT INTO sessions (user_id, token, expires_at) 
                  VALUES (:user_id, :token, :expires)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':token', $session_token);
        $stmt->bindParam(':expires', $expires_at);
        $stmt->execute();
    } catch (PDOException $sessionError) {
        // Sessions table might not have these columns, continue anyway
        error_log("Session creation warning: " . $sessionError->getMessage());
    }

    // Update last login
    $query = "UPDATE users SET last_login = NOW() WHERE id = :user_id";
    $stmt = $db->prepare($query);
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
        ]
    ], "Login successful");

} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    Response::serverError("Login failed");
}
?>