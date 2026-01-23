<?php
/**
 * Get User Cosmetics
 * Returns all cosmetic items owned by the user
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
    
    // Get all cosmetics
    $stmt = $conn->prepare("
        SELECT 
            id,
            cosmetic_type,
            cosmetic_identifier,
            cosmetic_name,
            cosmetic_data,
            is_equipped,
            category,
            unlocked_date
        FROM user_cosmetics
        WHERE user_id = ?
        ORDER BY cosmetic_type, unlocked_date DESC
    ");
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $cosmetics = [];
    while ($row = $result->fetch_assoc()) {
        if ($row['cosmetic_data']) {
            $row['cosmetic_data'] = json_decode($row['cosmetic_data'], true);
        }
        $cosmetics[] = $row;
    }
    
    // Group by type
    $grouped_cosmetics = [
        'avatar_frame' => [],
        'background' => [],
        'accessory' => [],
        'banner' => [],
        'border' => [],
        'effect' => []
    ];
    
    foreach ($cosmetics as $cosmetic) {
        $type = $cosmetic['cosmetic_type'];
        if (isset($grouped_cosmetics[$type])) {
            $grouped_cosmetics[$type][] = $cosmetic;
        }
    }
    
    sendSuccessResponse([
        'cosmetics' => $cosmetics,
        'grouped' => $grouped_cosmetics
    ], 'Cosmetics retrieved successfully');
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendErrorResponse('Failed to retrieve cosmetics: ' . $e->getMessage(), 500);
}
