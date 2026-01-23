<?php
/**
 * Get User Badges
 * Returns all badges earned by the user
 */

require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

header('Content-Type: application/json');

// Verify authentication
$user = authenticateUser();

if (!$user) {
    sendErrorResponse('Unauthorized', 401);
    exit;
}

$user_id = $user['id'];

try {
    $conn = getDBConnection();
    
    // Get all badges
    $stmt = $conn->prepare("
        SELECT 
            id,
            reward_identifier,
            reward_name,
            reward_description,
            category,
            metadata,
            earned_date
        FROM user_rewards
        WHERE user_id = ? AND reward_type = 'badge'
        ORDER BY earned_date DESC
    ");
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $badges = [];
    while ($row = $result->fetch_assoc()) {
        if ($row['metadata']) {
            $row['metadata'] = json_decode($row['metadata'], true);
        }
        $badges[] = $row;
    }
    
    sendSuccessResponse(['badges' => $badges], 'Badges retrieved successfully');
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendErrorResponse('Failed to retrieve badges: ' . $e->getMessage(), 500);
}
