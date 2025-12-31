<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

try {
    $query = "SELECT 
                r.*,
                a.name as attraction_name,
                ur.unlocked_at
              FROM user_rewards ur
              JOIN rewards r ON ur.reward_id = r.id
              JOIN attractions a ON r.attraction_id = a.id
              WHERE ur.user_id = :user_id
              ORDER BY ur.unlocked_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();

    $rewards = $stmt->fetchAll();

    Response::success($rewards, "User rewards retrieved");

} catch (PDOException $e) {
    error_log("Get rewards error: " . $e->getMessage());
    Response::serverError("Failed to retrieve rewards");
}
?>