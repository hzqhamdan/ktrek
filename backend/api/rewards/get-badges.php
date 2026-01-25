<?php
/**
 * Get User Badges
 * Returns all badges earned by the user
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
    // Get all badges (includes rewards where reward_type is 'badge' or NULL/empty)
    $stmt = $db->prepare("
        SELECT 
            id,
            reward_identifier,
            reward_name,
            reward_description,
            category,
            metadata,
            earned_date,
            reward_type
        FROM user_rewards
        WHERE user_id = :user_id AND (reward_type = 'badge' OR reward_type IS NULL OR reward_type = '')
        ORDER BY earned_date DESC
    ");
    
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $badges = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['metadata']) {
            $row['metadata'] = json_decode($row['metadata'], true);
        }
        $badges[] = $row;
    }
    
    Response::success(['badges' => $badges], 'Badges retrieved successfully');
    
} catch (Exception $e) {
    error_log('Get badges error: ' . $e->getMessage());
    Response::serverError('Failed to retrieve badges: ' . $e->getMessage());
}
