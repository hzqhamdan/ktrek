<?php
// iSCMS Admin Panel - Users Management API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all users
            $search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
            $healthStatus = isset($_GET['health_status']) ? sanitizeInput($_GET['health_status']) : '';
            $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : '';
            $linkedOnly = isset($_GET['linked_only']) ? true : false;
            
            // Healthcare Providers see only their linked patients
            $role = $_SESSION['admin_role'] ?? '';
            if ($role === 'Healthcare Provider' || $linkedOnly) {
                $providerId = getAdminProviderId();
                if (!$providerId) {
                    $conn->close();
                    sendResponse(false, [], 'Provider ID not found');
                }
                
                $query = "
                    SELECT DISTINCT u.user_id, u.full_name, u.email, u.phone_number, u.health_status, 
                           u.registration_date, u.is_active, u.is_premium, u.state, u.city,
                           ppl.consent_given, ppl.access_level
                    FROM users u
                    INNER JOIN patient_provider_links ppl ON u.user_id = ppl.user_id
                    WHERE ppl.provider_id = ? AND ppl.is_active = 1
                ";
                
                if ($search) {
                    $searchParam = "%$search%";
                    $query .= " AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)";
                }
                if ($healthStatus) {
                    $query .= " AND u.health_status = ?";
                }
                if ($status === 'active') {
                    $query .= " AND u.is_active = 1";
                } elseif ($status === 'inactive') {
                    $query .= " AND u.is_active = 0";
                }
                
                $query .= " ORDER BY u.registration_date DESC LIMIT 100";
                
                $stmt = $conn->prepare($query);
                
                if ($search && $healthStatus) {
                    $stmt->bind_param('issss', $providerId, $searchParam, $searchParam, $searchParam, $healthStatus);
                } elseif ($search) {
                    $stmt->bind_param('isss', $providerId, $searchParam, $searchParam, $searchParam);
                } elseif ($healthStatus) {
                    $stmt->bind_param('is', $providerId, $healthStatus);
                } else {
                    $stmt->bind_param('i', $providerId);
                }
                
                $stmt->execute();
                $result = $stmt->get_result();
                
                $users = [];
                while ($row = $result->fetch_assoc()) {
                    $users[] = $row;
                }
                
                logAudit($conn, 'View', 'users', null, 'Viewed linked patients list');
                $stmt->close();
                $conn->close();
                sendResponse(true, $users, 'Linked patients retrieved successfully');
            }
            
            $query = "SELECT user_id, full_name, email, phone_number, health_status, registration_date, is_active, is_premium, state, city FROM users WHERE 1=1";
            
            if ($search) {
                $query .= " AND (full_name LIKE '%$search%' OR email LIKE '%$search%' OR phone_number LIKE '%$search%')";
            }
            if ($healthStatus) {
                $query .= " AND health_status = '$healthStatus'";
            }
            if ($status === 'active') {
                $query .= " AND is_active = 1";
            } elseif ($status === 'inactive') {
                $query .= " AND is_active = 0";
            }
            
            $query .= " ORDER BY registration_date DESC LIMIT 100";
            
            $result = $conn->query($query);
            $users = [];
            
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
            
            logAudit($conn, 'View', 'users', null, 'Viewed users list');
            $conn->close();
            sendResponse(true, $users, 'Users retrieved successfully');
            break;
            
        case 'PUT':
            // Update user
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['user_id'])) {
                $conn->close();
                sendResponse(false, [], 'User ID is required');
            }
            
            $userId = intval($input['user_id']);
            
            if ($input['action'] === 'toggle_status') {
                $isActive = $input['is_active'] ? 1 : 0;
                $stmt = $conn->prepare("UPDATE users SET is_active = ? WHERE user_id = ?");
                $stmt->bind_param("ii", $isActive, $userId);
                $stmt->execute();
                
                logAudit($conn, 'Update', 'users', $userId, 'User status toggled to ' . ($isActive ? 'active' : 'inactive'));
                $stmt->close();
                $conn->close();
                sendResponse(true, [], 'User status updated successfully');
            }
            
            $conn->close();
            sendResponse(false, [], 'Invalid action');
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
