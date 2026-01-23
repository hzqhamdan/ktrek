<?php
/**
 * Get User Photo Cards
 * Returns all photo cards collected by the user
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
    
    // Get all photo cards with attraction details
    $stmt = $conn->prepare("
        SELECT 
            pc.id,
            pc.attraction_id,
            pc.card_type,
            pc.photo_url,
            pc.visit_date,
            pc.quality_score,
            pc.is_featured,
            a.name as attraction_name,
            a.location as attraction_location,
            a.category as attraction_category
        FROM user_photo_cards pc
        JOIN attractions a ON pc.attraction_id = a.id
        WHERE pc.user_id = ?
        ORDER BY pc.visit_date DESC
    ");
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $photo_cards = [];
    while ($row = $result->fetch_assoc()) {
        $photo_cards[] = $row;
    }
    
    // Group by card type
    $grouped_cards = [
        'gold' => [],
        'silver' => [],
        'bronze' => []
    ];
    
    foreach ($photo_cards as $card) {
        $grouped_cards[$card['card_type']][] = $card;
    }
    
    sendSuccessResponse([
        'photo_cards' => $photo_cards,
        'grouped' => $grouped_cards,
        'total_count' => count($photo_cards),
        'gold_count' => count($grouped_cards['gold']),
        'silver_count' => count($grouped_cards['silver']),
        'bronze_count' => count($grouped_cards['bronze'])
    ], 'Photo cards retrieved successfully');
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendErrorResponse('Failed to retrieve photo cards: ' . $e->getMessage(), 500);
}
