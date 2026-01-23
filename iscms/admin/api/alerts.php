<?php
// iSCMS Admin Panel - Alerts API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get alerts
            $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : '';
            $severity = isset($_GET['severity']) ? sanitizeInput($_GET['severity']) : '';
            $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === 'true';
            
            // Check if user is Healthcare Provider
            $adminRole = $_SESSION['admin_role'] ?? '';
            $isHealthcareProvider = strcasecmp($adminRole, 'Healthcare Provider') === 0;
            
            $query = "
                SELECT 
                    ua.alert_id,
                    ua.user_id,
                    u.full_name,
                    ua.alert_type,
                    ua.severity,
                    ua.title,
                    ua.message,
                    ua.alert_datetime,
                    ua.is_read
                FROM user_alerts ua
                JOIN users u ON ua.user_id = u.user_id
            ";
            
            // If Healthcare Provider, only show alerts for their designated patients
            if ($isHealthcareProvider) {
                $providerId = getAdminProviderId();
                if (!$providerId) {
                    $conn->close();
                    sendResponse(true, [], 'No patients assigned to this provider');
                    break;
                }
                
                $query .= "
                    INNER JOIN patient_provider_links ppl 
                    ON ua.user_id = ppl.user_id 
                    WHERE ppl.provider_id = $providerId 
                    AND ppl.is_active = 1
                ";
            } else {
                $query .= " WHERE 1=1";
            }
            
            if ($type) {
                $query .= " AND ua.alert_type = '$type'";
            }
            if ($severity) {
                $query .= " AND ua.severity = '$severity'";
            }
            if ($unreadOnly) {
                $query .= " AND ua.is_read = 0";
            }
            
            $query .= " ORDER BY ua.alert_datetime DESC LIMIT 100";
            
            $result = $conn->query($query);
            $alerts = [];
            
            while ($row = $result->fetch_assoc()) {
                $alerts[] = $row;
            }
            
            $conn->close();
            sendResponse(true, $alerts, 'Alerts retrieved successfully');
            break;
            
        case 'PUT':
            // Mark alert as read
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['alert_id'])) {
                $conn->close();
                sendResponse(false, [], 'Alert ID is required');
            }
            
            $alertId = intval($input['alert_id']);
            
            $stmt = $conn->prepare("UPDATE user_alerts SET is_read = 1, read_at = NOW() WHERE alert_id = ?");
            $stmt->bind_param("i", $alertId);
            
            if ($stmt->execute()) {
                $stmt->close();
                $conn->close();
                sendResponse(true, [], 'Alert marked as read');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to update alert');
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
