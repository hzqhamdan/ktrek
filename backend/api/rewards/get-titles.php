<?php
/**
 * Get User Titles
 * Returns all titles earned by the user
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

header('Content-Type: application/json');

// Initialize database and auth
$database = new Database();
$db = $database->getConnection();
$auth = new AuthMiddleware($db);

// Verify authentication
$user = $auth->requireAuth();

if (!$user) {
    Response::error('Unauthorized', 401);
    exit;
}

$user_id = $user['id'];

try {
    // Get all titles from user_rewards table
    $stmt = $db->prepare("
        SELECT 
            id,
            reward_identifier as title_identifier,
            reward_name as title_text,
            'default' as title_color,
            category,
            0 as is_active,
            earned_date as unlocked_date,
            reward_description
        FROM user_rewards
        WHERE user_id = :user_id AND reward_type = 'title'
        ORDER BY earned_date DESC
    ");
    
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $titles = [];
    $active_title = null;
    
    // Mark the most recent as active
    $first = true;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($first) {
            $row['is_active'] = 1;
            $active_title = $row;
            $first = false;
        }
        $titles[] = $row;
    }
    
    Response::success([
        'titles' => $titles,
        'active_title' => $active_title
    ], 'Titles retrieved successfully');
    
} catch (Exception $e) {
    error_log('Get titles error: ' . $e->getMessage());
    Response::error('Failed to retrieve titles: ' . $e->getMessage(), 500);
}
