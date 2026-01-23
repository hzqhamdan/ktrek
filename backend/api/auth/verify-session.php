<?php
// Use dynamic CORS configuration that supports any localhost port
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

// Only accept GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Verify authentication
$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

// Return user data
Response::success([
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'phone_number' => $user['phone_number'],
        'profile_picture' => $user['profile_picture'],
        'avatar_style' => $user['avatar_style'] ?? null,
        'avatar_seed' => $user['avatar_seed'] ?? null,
        'auth_provider' => $user['auth_provider']
    ]
], "Session valid");
?>