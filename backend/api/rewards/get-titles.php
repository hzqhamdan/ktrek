<?php
/**
 * Get User Titles
 * Returns all titles earned by the user
 */

require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

// Verify authentication
$user = AuthMiddleware::authenticate();
$user_id = $user['id'];

try {
    $conn = getDBConnection();
    
    // Get all titles from user_rewards table
    $stmt = $conn->prepare("
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
        WHERE user_id = ? AND reward_type = 'title'
        ORDER BY earned_date DESC
    ");
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $titles = [];
    $active_title = null;
    
    // Get active title from user settings (if you have a column for it)
    // For now, we'll mark the most recent as active
    $first = true;
    while ($row = $result->fetch_assoc()) {
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
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    Response::error('Failed to retrieve titles: ' . $e->getMessage(), 500);
}
