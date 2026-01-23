<?php
/**
 * Get User Titles
 * Returns all titles earned by the user
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
    
    // Get all titles
    $stmt = $conn->prepare("
        SELECT 
            id,
            title_identifier,
            title_text,
            title_color,
            category,
            is_active,
            unlocked_date
        FROM user_titles
        WHERE user_id = ?
        ORDER BY unlocked_date DESC
    ");
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $titles = [];
    $active_title = null;
    
    while ($row = $result->fetch_assoc()) {
        if ($row['is_active']) {
            $active_title = $row;
        }
        $titles[] = $row;
    }
    
    sendSuccessResponse([
        'titles' => $titles,
        'active_title' => $active_title
    ], 'Titles retrieved successfully');
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendErrorResponse('Failed to retrieve titles: ' . $e->getMessage(), 500);
}
