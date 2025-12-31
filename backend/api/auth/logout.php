<?php
// Use dynamic CORS configuration that supports any localhost port
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Verify authentication
$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

// Get token from header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
preg_match('/Bearer\s(\S+)/', $authHeader, $matches);
$token = $matches[1] ?? '';

if (empty($token)) {
    Response::error("Token not found in request", 401);
}

try {
    // Delete session
    // sessions table uses column name `token` (see schema)
    $query = "DELETE FROM sessions WHERE token = :token";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    Response::success(null, "Logout successful");

} catch (PDOException $e) {
    error_log("Logout error: " . $e->getMessage());
    Response::serverError("Logout failed");
}
?>