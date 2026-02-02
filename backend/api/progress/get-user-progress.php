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
    $user_id = $user['id']; // Fix: auth middleware returns 'id', not 'user_id'
    
    // Get progress for each attraction the user has started
    // Use DISTINCT to avoid duplicates and get the latest progress for each attraction
    $query = "SELECT DISTINCT
                p.attraction_id,
                a.name as attraction_name,
                a.image as attraction_image,
                p.completed_tasks,
                p.total_tasks,
                p.progress_percentage,
                p.is_unlocked as reward_unlocked,
                p.updated_at as last_activity
              FROM progress p
              JOIN attractions a ON p.attraction_id = a.id
              WHERE p.user_id = :user_id
              GROUP BY p.attraction_id
              ORDER BY p.updated_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $progress = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get overall statistics
    $totalAttractions = count($progress);
    $completedAttractions = 0;
    $totalTasksCompleted = 0;

    foreach ($progress as $item) {
        if ($item['progress_percentage'] >= 100) {
            $completedAttractions++;
        }
        $totalTasksCompleted += $item['completed_tasks'];
    }
    
    // Count total rewards (badges + titles) from user_rewards table
    $rewardCountQuery = "SELECT COUNT(*) as total_rewards 
                         FROM user_rewards 
                         WHERE user_id = :user_id 
                         AND reward_type IN ('badge', 'title')";
    $rewardStmt = $db->prepare($rewardCountQuery);
    $rewardStmt->bindParam(':user_id', $user_id);
    $rewardStmt->execute();
    $rewardResult = $rewardStmt->fetch(PDO::FETCH_ASSOC);
    $totalRewardsUnlocked = (int)$rewardResult['total_rewards'];

    $stats = [
        'total_attractions_started' => $totalAttractions,
        'attractions_completed' => $completedAttractions,
        'total_tasks_completed' => $totalTasksCompleted,
        'total_rewards_unlocked' => $totalRewardsUnlocked
    ];

    Response::success([
        'progress' => $progress,
        'statistics' => $stats
    ], "User progress retrieved");

} catch (PDOException $e) {
    error_log("Get progress error: " . $e->getMessage());
    Response::serverError("Failed to retrieve progress");
}
?>