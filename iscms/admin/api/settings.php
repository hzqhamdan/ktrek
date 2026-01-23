<?php
// iSCMS Admin Panel - System Settings API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : '';
            
            $query = "SELECT setting_id, setting_key, setting_value, setting_type, category, description, is_editable FROM system_settings WHERE 1=1";
            
            if ($category) {
                $query .= " AND category = '$category'";
            }
            
            $query .= " ORDER BY category ASC, setting_key ASC";
            
            $result = $conn->query($query);
            $settings = [];
            
            while ($row = $result->fetch_assoc()) {
                $settings[] = $row;
            }
            
            $conn->close();
            sendResponse(true, $settings, 'Settings retrieved successfully');
            break;
            
        case 'PUT':
            // Update setting
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!validateRequired($input, ['setting_key', 'setting_value'])) {
                $conn->close();
                sendResponse(false, [], 'Setting key and value are required');
            }
            
            $settingKey = sanitizeInput($input['setting_key']);
            $settingValue = sanitizeInput($input['setting_value']);
            $updatedBy = $_SESSION['admin_id'];
            
            // Check if setting is editable
            $checkStmt = $conn->prepare("SELECT is_editable FROM system_settings WHERE setting_key = ?");
            $checkStmt->bind_param("s", $settingKey);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows === 0) {
                $checkStmt->close();
                $conn->close();
                sendResponse(false, [], 'Setting not found');
            }
            
            $setting = $checkResult->fetch_assoc();
            $checkStmt->close();
            
            if (!$setting['is_editable']) {
                $conn->close();
                sendResponse(false, [], 'This setting cannot be modified');
            }
            
            // Update setting
            $stmt = $conn->prepare("UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?");
            $stmt->bind_param("sis", $settingValue, $updatedBy, $settingKey);
            
            if ($stmt->execute()) {
                logAudit($conn, 'Update', 'system_settings', null, "Setting updated: $settingKey = $settingValue");
                $stmt->close();
                $conn->close();
                sendResponse(true, [], 'Setting updated successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to update setting');
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
