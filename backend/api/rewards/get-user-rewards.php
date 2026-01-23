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
    // Updated query for new reward system structure
    $query = "SELECT 
                id,
                reward_type,
                reward_identifier,
                reward_name,
                reward_description,
                quantity,
                category,
                source_type,
                source_id,
                metadata,
                earned_date
              FROM user_rewards
              WHERE user_id = :user_id
              ORDER BY earned_date DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();

    $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Decode JSON metadata for each reward
    foreach ($rewards as &$reward) {
        if ($reward['metadata']) {
            $reward['metadata'] = json_decode($reward['metadata'], true);
        }
    }

    Response::success($rewards, "User rewards retrieved");

} catch (PDOException $e) {
    error_log("Get rewards error: " . $e->getMessage());
    Response::serverError("Failed to retrieve rewards");
}
?>