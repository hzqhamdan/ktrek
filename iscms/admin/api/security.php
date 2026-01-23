<?php
// iSCMS Admin Panel - Security & Compliance API
require_once '../config.php';

checkSuperadminAuth(); // Only superadmin can access security features

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : 'audit_logs';
            
            switch ($type) {
                case 'audit_logs':
                    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
                    $userType = isset($_GET['user_type']) ? sanitizeInput($_GET['user_type']) : '';
                    $actionType = isset($_GET['action_type']) ? sanitizeInput($_GET['action_type']) : '';
                    
                    $query = "
                        SELECT 
                            log_id,
                            user_type,
                            user_id,
                            action_type,
                            table_name,
                            record_id,
                            action_description,
                            ip_address,
                            created_at
                        FROM audit_logs
                        WHERE 1=1
                    ";
                    
                    if ($userType) {
                        $query .= " AND user_type = '$userType'";
                    }
                    if ($actionType) {
                        $query .= " AND action_type = '$actionType'";
                    }
                    
                    $query .= " ORDER BY created_at DESC LIMIT ?";
                    
                    $stmt = $conn->prepare($query);
                    $stmt->bind_param("i", $limit);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    $logs = [];
                    while ($row = $result->fetch_assoc()) {
                        $logs[] = $row;
                    }
                    
                    $stmt->close();
                    $conn->close();
                    sendResponse(true, $logs, 'Audit logs retrieved successfully');
                    break;
                    
                case 'security_incidents':
                    $query = "
                        SELECT 
                            incident_id,
                            incident_type,
                            severity,
                            description,
                            ip_address,
                            user_id,
                            detected_at,
                            status,
                            action_taken
                        FROM security_incidents
                        ORDER BY detected_at DESC
                        LIMIT 100
                    ";
                    
                    $result = $conn->query($query);
                    $incidents = [];
                    
                    while ($row = $result->fetch_assoc()) {
                        $incidents[] = $row;
                    }
                    
                    $conn->close();
                    sendResponse(true, $incidents, 'Security incidents retrieved successfully');
                    break;
                    
                case 'backups':
                    $query = "
                        SELECT 
                            backup_id,
                            backup_name,
                            backup_type,
                            file_size_mb,
                            backup_status,
                            backup_start,
                            backup_end,
                            created_by
                        FROM database_backups
                        ORDER BY backup_start DESC
                        LIMIT 50
                    ";
                    
                    $result = $conn->query($query);
                    $backups = [];
                    
                    while ($row = $result->fetch_assoc()) {
                        $backups[] = $row;
                    }
                    
                    $conn->close();
                    sendResponse(true, $backups, 'Backup history retrieved successfully');
                    break;
                    
                case 'data_deletion_requests':
                    $query = "
                        SELECT 
                            ddr.request_id,
                            ddr.user_id,
                            u.full_name,
                            u.email,
                            ddr.request_date,
                            ddr.reason,
                            ddr.status,
                            ddr.processed_by,
                            ddr.processed_date
                        FROM data_deletion_requests ddr
                        LEFT JOIN users u ON ddr.user_id = u.user_id
                        ORDER BY ddr.request_date DESC
                        LIMIT 100
                    ";
                    
                    $result = $conn->query($query);
                    $requests = [];
                    
                    while ($row = $result->fetch_assoc()) {
                        $requests[] = $row;
                    }
                    
                    $conn->close();
                    sendResponse(true, $requests, 'Data deletion requests retrieved successfully');
                    break;
                    
                default:
                    $conn->close();
                    sendResponse(false, [], 'Invalid type');
            }
            break;
            
        case 'POST':
            // Create manual backup
            $input = json_decode(file_get_contents('php://input'), true);
            
            if ($input['action'] === 'create_backup') {
                $backupName = 'manual_backup_' . date('Y-m-d_H-i-s');
                $backupType = 'Full';
                $createdBy = $_SESSION['admin_id'];
                
                $stmt = $conn->prepare("
                    INSERT INTO database_backups 
                    (backup_name, backup_type, backup_status, backup_start, created_by)
                    VALUES (?, ?, 'In Progress', NOW(), ?)
                ");
                
                $stmt->bind_param("ssi", $backupName, $backupType, $createdBy);
                
                if ($stmt->execute()) {
                    $backupId = $stmt->insert_id;
                    
                    // TODO: Implement actual backup logic here
                    
                    // Update backup as completed
                    $updateStmt = $conn->prepare("UPDATE database_backups SET backup_status = 'Completed', backup_end = NOW() WHERE backup_id = ?");
                    $updateStmt->bind_param("i", $backupId);
                    $updateStmt->execute();
                    $updateStmt->close();
                    
                    logAudit($conn, 'Create', 'database_backups', $backupId, 'Manual backup created');
                    
                    $stmt->close();
                    $conn->close();
                    sendResponse(true, ['backup_id' => $backupId], 'Backup created successfully');
                } else {
                    $stmt->close();
                    $conn->close();
                    sendResponse(false, [], 'Failed to create backup');
                }
            }
            break;
            
        case 'PUT':
            // Update security incident or data deletion request
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['incident_id'])) {
                // Update security incident
                $incidentId = intval($input['incident_id']);
                $status = sanitizeInput($input['status']);
                $actionTaken = isset($input['action_taken']) ? sanitizeInput($input['action_taken']) : null;
                
                $stmt = $conn->prepare("UPDATE security_incidents SET status = ?, action_taken = ?, resolved_at = NOW() WHERE incident_id = ?");
                $stmt->bind_param("ssi", $status, $actionTaken, $incidentId);
                
                if ($stmt->execute()) {
                    logAudit($conn, 'Update', 'security_incidents', $incidentId, 'Security incident updated');
                    $stmt->close();
                    $conn->close();
                    sendResponse(true, [], 'Security incident updated successfully');
                }
            } elseif (isset($input['request_id'])) {
                // Process data deletion request
                $requestId = intval($input['request_id']);
                $status = sanitizeInput($input['status']);
                $processedBy = $_SESSION['admin_id'];
                
                $stmt = $conn->prepare("UPDATE data_deletion_requests SET status = ?, processed_by = ?, processed_date = NOW() WHERE request_id = ?");
                $stmt->bind_param("sii", $status, $processedBy, $requestId);
                
                if ($stmt->execute()) {
                    logAudit($conn, 'Update', 'data_deletion_requests', $requestId, 'Data deletion request processed');
                    $stmt->close();
                    $conn->close();
                    sendResponse(true, [], 'Data deletion request processed successfully');
                }
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
