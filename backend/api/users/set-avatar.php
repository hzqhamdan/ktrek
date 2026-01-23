<?php
// Use dynamic CORS configuration that supports any localhost port
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);
$style = isset($data['style']) ? Security::sanitize($data['style']) : '';
$seed = isset($data['seed']) ? Security::sanitize($data['seed']) : '';

$allowedStyles = ['micah', 'adventurer', 'notionists'];
if (!in_array($style, $allowedStyles, true)) {
    Response::error("Invalid avatar style", 400);
}

if (empty($seed) || strlen($seed) > 128) {
    Response::error("Invalid avatar seed", 400);
}

$database = new Database();
$db = $database->getConnection();
if (!$db) {
    Response::serverError("Database connection failed");
}

$auth = new AuthMiddleware($db);
$user = $auth->requireAuth();

// Also store a computed URL into profile_picture for backward compatibility
$profile_picture = "https://api.dicebear.com/9.x/" . $style . "/svg?seed=" . rawurlencode($seed);

try {
    $query = "UPDATE users 
              SET avatar_style = :style, avatar_seed = :seed, profile_picture = :profile_picture
              WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':style', $style);
    $stmt->bindParam(':seed', $seed);
    $stmt->bindParam(':profile_picture', $profile_picture);
    $stmt->bindParam(':user_id', $user['id']);

    $stmt->execute();

    // Return updated user
    $query = "SELECT id, username, email, phone_number, full_name, date_of_birth, profile_picture, avatar_style, avatar_seed, auth_provider
              FROM users WHERE id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);

    Response::success([
        'user' => $updated
    ], "Avatar updated");

} catch (PDOException $e) {
    error_log("Set avatar error: " . $e->getMessage());
    Response::serverError("Failed to update avatar");
}
?>
