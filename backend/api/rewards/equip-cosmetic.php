<?php
/**
 * Equip/Unequip Cosmetic Item
 * Allows user to equip or unequip a cosmetic item
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

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['cosmetic_id'])) {
    sendErrorResponse('Cosmetic ID is required', 400);
    exit;
}

$user_id = $user['id'];
$cosmetic_id = $data['cosmetic_id'];
$equip = isset($data['equip']) ? $data['equip'] : true;

try {
    $conn = getDBConnection();
    
    // Verify ownership
    $verify_stmt = $conn->prepare("
        SELECT cosmetic_type FROM user_cosmetics 
        WHERE id = ? AND user_id = ?
    ");
    
    $verify_stmt->bind_param("ii", $cosmetic_id, $user_id);
    $verify_stmt->execute();
    $result = $verify_stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendErrorResponse('Cosmetic not found or not owned', 404);
        exit;
    }
    
    $cosmetic = $result->fetch_assoc();
    $cosmetic_type = $cosmetic['cosmetic_type'];
    
    if ($equip) {
        // Unequip all cosmetics of the same type
        $unequip_stmt = $conn->prepare("
            UPDATE user_cosmetics 
            SET is_equipped = FALSE 
            WHERE user_id = ? AND cosmetic_type = ?
        ");
        $unequip_stmt->bind_param("is", $user_id, $cosmetic_type);
        $unequip_stmt->execute();
        $unequip_stmt->close();
        
        // Equip the selected cosmetic
        $equip_stmt = $conn->prepare("
            UPDATE user_cosmetics 
            SET is_equipped = TRUE 
            WHERE id = ? AND user_id = ?
        ");
        $equip_stmt->bind_param("ii", $cosmetic_id, $user_id);
        $equip_stmt->execute();
        $equip_stmt->close();
        
        sendSuccessResponse(['equipped' => true], 'Cosmetic equipped successfully');
    } else {
        // Unequip the cosmetic
        $unequip_stmt = $conn->prepare("
            UPDATE user_cosmetics 
            SET is_equipped = FALSE 
            WHERE id = ? AND user_id = ?
        ");
        $unequip_stmt->bind_param("ii", $cosmetic_id, $user_id);
        $unequip_stmt->execute();
        $unequip_stmt->close();
        
        sendSuccessResponse(['equipped' => false], 'Cosmetic unequipped successfully');
    }
    
    $verify_stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendErrorResponse('Failed to equip cosmetic: ' . $e->getMessage(), 500);
}
