<?php
/**
 * Set Active Title
 * Allows user to set their active display title
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

if (!isset($data['title_id'])) {
    sendErrorResponse('Title ID is required', 400);
    exit;
}

$user_id = $user['id'];
$title_id = $data['title_id'];

try {
    $conn = getDBConnection();
    
    // Verify ownership
    $verify_stmt = $conn->prepare("
        SELECT id FROM user_titles 
        WHERE id = ? AND user_id = ?
    ");
    
    $verify_stmt->bind_param("ii", $title_id, $user_id);
    $verify_stmt->execute();
    $result = $verify_stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendErrorResponse('Title not found or not owned', 404);
        exit;
    }
    
    // Deactivate all titles
    $deactivate_stmt = $conn->prepare("
        UPDATE user_titles 
        SET is_active = FALSE 
        WHERE user_id = ?
    ");
    $deactivate_stmt->bind_param("i", $user_id);
    $deactivate_stmt->execute();
    
    // Activate selected title
    $activate_stmt = $conn->prepare("
        UPDATE user_titles 
        SET is_active = TRUE 
        WHERE id = ? AND user_id = ?
    ");
    $activate_stmt->bind_param("ii", $title_id, $user_id);
    $activate_stmt->execute();
    
    sendSuccessResponse(['title_id' => $title_id], 'Title set as active successfully');
    
    $verify_stmt->close();
    $deactivate_stmt->close();
    $activate_stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendErrorResponse('Failed to set active title: ' . $e->getMessage(), 500);
}
