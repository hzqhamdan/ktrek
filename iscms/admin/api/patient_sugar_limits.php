<?php
// iSCMS Admin Panel - Patient Sugar Limits API
// Healthcare Providers can set and manage patient sugar limits
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get sugar limits for a specific patient
            requirePermission('view_health_data');
            
            $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
            
            if (!$userId) {
                sendResponse(false, [], 'User ID is required');
            }
            
            // Check if admin can access this patient
            if (!canAccessPatient($userId)) {
                sendResponse(false, [], 'You do not have permission to view this patient');
            }
            
            // Get current limit
            $query = "
                SELECT psl.*, 
                       u.full_name as patient_name,
                       au.full_name as set_by_admin_name,
                       hp.full_name as set_by_provider_name
                FROM patient_sugar_limits psl
                LEFT JOIN users u ON psl.user_id = u.user_id
                LEFT JOIN admin_users au ON psl.set_by_admin_id = au.admin_id
                LEFT JOIN healthcare_providers hp ON psl.set_by_provider_id = hp.provider_id
                WHERE psl.user_id = ?
                ORDER BY psl.effective_from DESC
                LIMIT 1
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                $stmt->close();
                $conn->close();
                sendResponse(true, $row, 'Sugar limit retrieved successfully');
            } else {
                // Return default limit if none set
                $stmt->close();
                $conn->close();
                sendResponse(true, [
                    'user_id' => $userId,
                    'daily_limit_g' => 50.00,
                    'notes' => 'Default daily sugar limit'
                ], 'No custom limit set, using default');
            }
            break;
            
        case 'POST':
            // Set or update sugar limit for a patient
            requirePermission('set_patient_limits');
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!validateRequired($input, ['user_id', 'daily_limit_g'])) {
                sendResponse(false, [], 'User ID and daily limit are required');
            }
            
            $userId = intval($input['user_id']);
            $dailyLimitG = floatval($input['daily_limit_g']);
            $reason = isset($input['reason']) ? sanitizeInput($input['reason']) : null;
            $notes = isset($input['notes']) ? sanitizeInput($input['notes']) : null;
            $effectiveFrom = isset($input['effective_from']) ? sanitizeInput($input['effective_from']) : date('Y-m-d');
            
            // Validate limit range
            if ($dailyLimitG < 0 || $dailyLimitG > 200) {
                sendResponse(false, [], 'Daily limit must be between 0 and 200 grams');
            }
            
            // Check if admin can access this patient
            if (!canAccessPatient($userId)) {
                sendResponse(false, [], 'You do not have permission to modify this patient');
            }
            
            // Determine who is setting the limit
            $setByAdminId = null;
            $setByProviderId = null;
            
            $role = $_SESSION['admin_role'] ?? '';
            if ($role === 'Healthcare Provider') {
                $setByProviderId = getAdminProviderId();
            } else {
                $setByAdminId = $_SESSION['admin_id'];
            }
            
            // Insert new limit
            $stmt = $conn->prepare("
                INSERT INTO patient_sugar_limits 
                (user_id, daily_limit_g, set_by_admin_id, set_by_provider_id, reason, effective_from, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->bind_param(
                'idiisss',
                $userId,
                $dailyLimitG,
                $setByAdminId,
                $setByProviderId,
                $reason,
                $effectiveFrom,
                $notes
            );
            
            if ($stmt->execute()) {
                $limitId = $stmt->insert_id;
                
                // Log the action
                logAudit(
                    $conn,
                    'Create',
                    'patient_sugar_limits',
                    $limitId,
                    "Set sugar limit for user $userId to {$dailyLimitG}g"
                );
                
                $stmt->close();
                $conn->close();
                
                sendResponse(true, ['limit_id' => $limitId], 'Sugar limit set successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to set sugar limit');
            }
            break;
            
        default:
            $conn->close();
            sendResponse(false, [], 'Method not allowed');
    }
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
?>
