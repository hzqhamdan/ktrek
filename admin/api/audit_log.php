<?php
// api/audit_log.php - API for logging and retrieving audit log entries
require_once '../config.php';

// Start session to get admin info
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['admin_id'])) {
    sendResponse(false, [], 'Unauthorized access');
}

// Check if audit log table exists
$conn_check = getDBConnection();
$check_table = $conn_check->query("SHOW TABLES LIKE 'admin_audit_log'");
if ($check_table->num_rows === 0) {
    sendResponse(false, [], 'Audit log table does not exist. Please run the create_audit_log_table.sql script first.');
}
$conn_check->close();

$admin_id = $_SESSION['admin_id'];
$admin_role = $_SESSION['admin_role'] ?? 'manager';

$conn = getDBConnection();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST' && isset($input['action'])) {
    
    // LOG ACTION - Store audit log entry
    if ($input['action'] === 'log') {
        // Validate required fields
        if (!isset($input['action_type'], $input['entity_type'], $input['entity_id'], $input['entity_name'])) {
            sendResponse(false, [], 'Missing required fields');
        }

        $action_type = $input['action_type']; // create, update, delete
        $entity_type = $input['entity_type']; // attraction, task, guide, reward
        $entity_id = $input['entity_id'];
        $entity_name = $input['entity_name'];
        $attraction_id = $input['attraction_id'] ?? null;
        $attraction_name = $input['attraction_name'] ?? null;
        $changes_summary = $input['changes_summary'] ?? null;

        // Get admin name
        $admin_stmt = $conn->prepare("SELECT full_name, role FROM admin WHERE id = ?");
        $admin_stmt->bind_param("i", $admin_id);
        $admin_stmt->execute();
        $admin_result = $admin_stmt->get_result();
        $admin_data = $admin_result->fetch_assoc();
        $admin_name = $admin_data['full_name'] ?? 'Unknown';
        $admin_role = $admin_data['role'] ?? 'manager';
        $admin_stmt->close();

        // Insert audit log entry
        $stmt = $conn->prepare("INSERT INTO admin_audit_log (admin_id, admin_name, admin_role, action_type, entity_type, entity_id, entity_name, attraction_id, attraction_name, changes_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issssisiss", $admin_id, $admin_name, $admin_role, $action_type, $entity_type, $entity_id, $entity_name, $attraction_id, $attraction_name, $changes_summary);
        
        if ($stmt->execute()) {
            sendResponse(true, ['log_id' => $conn->insert_id], 'Audit log entry created');
        } else {
            sendResponse(false, [], 'Failed to create audit log entry: ' . $stmt->error);
        }
        $stmt->close();
    }
    
    // GET RECENT CHANGES - Fetch recent changes for manager's attractions
    elseif ($input['action'] === 'get_recent_changes') {
        $limit = $input['limit'] ?? 20;
        
        if ($admin_role === 'superadmin') {
            // Superadmin can see all changes
            $stmt = $conn->prepare("
                SELECT * FROM admin_audit_log 
                ORDER BY created_at DESC 
                LIMIT ?
            ");
            $stmt->bind_param("i", $limit);
        } else {
            // Manager only sees changes to their attractions
            // First, get manager's attractions
            $manager_attractions_stmt = $conn->prepare("
                SELECT id FROM attractions WHERE created_by_admin_id = ?
            ");
            $manager_attractions_stmt->bind_param("i", $admin_id);
            $manager_attractions_stmt->execute();
            $manager_attractions_result = $manager_attractions_stmt->get_result();
            
            $manager_attraction_ids = [];
            while ($row = $manager_attractions_result->fetch_assoc()) {
                $manager_attraction_ids[] = $row['id'];
            }
            $manager_attractions_stmt->close();
            
            if (empty($manager_attraction_ids)) {
                // Manager has no attractions
                sendResponse(true, ['changes' => []], 'No attractions found for this manager');
            }
            
            // Build query with IN clause
            $placeholders = implode(',', array_fill(0, count($manager_attraction_ids), '?'));
            $query = "
                SELECT * FROM admin_audit_log 
                WHERE attraction_id IN ($placeholders)
                AND admin_role = 'superadmin'
                ORDER BY created_at DESC 
                LIMIT ?
            ";
            
            $stmt = $conn->prepare($query);
            
            // Bind parameters dynamically
            $types = str_repeat('i', count($manager_attraction_ids)) . 'i';
            $params = array_merge($manager_attraction_ids, [$limit]);
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $changes = [];
        while ($row = $result->fetch_assoc()) {
            $changes[] = $row;
        }
        
        $stmt->close();
        sendResponse(true, ['changes' => $changes], 'Recent changes retrieved');
    }
    
    else {
        sendResponse(false, [], 'Invalid action');
    }
    
} else {
    sendResponse(false, [], 'Invalid request method or missing action');
}

$conn->close();
?>
