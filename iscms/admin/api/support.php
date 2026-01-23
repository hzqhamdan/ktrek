<?php
// iSCMS Admin Panel - Support & Feedback API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : 'tickets';
            
            if ($type === 'tickets') {
                // Get support tickets
                $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : '';
                
                $query = "
                    SELECT 
                        st.ticket_id,
                        st.ticket_number,
                        st.user_id,
                        u.full_name as user_name,
                        st.subject,
                        st.category,
                        st.priority,
                        st.status,
                        st.assigned_to,
                        st.created_at,
                        st.updated_at
                    FROM support_tickets st
                    LEFT JOIN users u ON st.user_id = u.user_id
                    WHERE 1=1
                ";
                
                if ($status) {
                    $query .= " AND st.status = '$status'";
                }
                
                $query .= " ORDER BY 
                    CASE st.priority
                        WHEN 'Urgent' THEN 1
                        WHEN 'High' THEN 2
                        WHEN 'Normal' THEN 3
                        ELSE 4
                    END,
                    st.created_at DESC
                    LIMIT 100
                ";
                
                $result = $conn->query($query);
                $tickets = [];
                
                while ($row = $result->fetch_assoc()) {
                    $tickets[] = $row;
                }
                
                $conn->close();
                sendResponse(true, $tickets, 'Support tickets retrieved successfully');
                
            } elseif ($type === 'feedback') {
                // Get user feedback
                $feedbackStatus = isset($_GET['status']) ? sanitizeInput($_GET['status']) : '';
                
                $query = "
                    SELECT 
                        uf.feedback_id,
                        uf.user_id,
                        u.full_name as user_name,
                        uf.feedback_type,
                        uf.subject,
                        uf.severity,
                        uf.status,
                        uf.sentiment,
                        uf.submitted_at
                    FROM user_feedback uf
                    LEFT JOIN users u ON uf.user_id = u.user_id
                    WHERE 1=1
                ";
                
                if ($feedbackStatus) {
                    $query .= " AND uf.status = '$feedbackStatus'";
                }
                
                $query .= " ORDER BY uf.submitted_at DESC LIMIT 100";
                
                $result = $conn->query($query);
                $feedback = [];
                
                while ($row = $result->fetch_assoc()) {
                    $feedback[] = $row;
                }
                
                $conn->close();
                sendResponse(true, $feedback, 'User feedback retrieved successfully');
            }
            break;
            
        case 'PUT':
            // Update ticket/feedback status
            $input = json_decode(file_get_contents('php://input'), true);
            $type = isset($input['type']) ? $input['type'] : 'ticket';
            
            if ($type === 'ticket') {
                if (!isset($input['ticket_id'])) {
                    $conn->close();
                    sendResponse(false, [], 'Ticket ID is required');
                }
                
                $ticketId = intval($input['ticket_id']);
                $status = isset($input['status']) ? sanitizeInput($input['status']) : null;
                $assignedTo = isset($input['assigned_to']) ? intval($input['assigned_to']) : null;
                
                $updates = [];
                $types = "";
                $values = [];
                
                if ($status) {
                    $updates[] = "status = ?";
                    $types .= "s";
                    $values[] = $status;
                    
                    if ($status === 'Resolved' || $status === 'Closed') {
                        $updates[] = "resolved_at = NOW()";
                    }
                }
                
                if ($assignedTo) {
                    $updates[] = "assigned_to = ?";
                    $types .= "i";
                    $values[] = $assignedTo;
                }
                
                if (empty($updates)) {
                    $conn->close();
                    sendResponse(false, [], 'No fields to update');
                }
                
                $types .= "i";
                $values[] = $ticketId;
                
                $query = "UPDATE support_tickets SET " . implode(", ", $updates) . " WHERE ticket_id = ?";
                $stmt = $conn->prepare($query);
                $stmt->bind_param($types, ...$values);
                
                if ($stmt->execute()) {
                    logAudit($conn, 'Update', 'support_tickets', $ticketId, 'Support ticket updated');
                    $stmt->close();
                    $conn->close();
                    sendResponse(true, [], 'Support ticket updated successfully');
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
