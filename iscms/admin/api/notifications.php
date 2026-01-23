<?php
// iSCMS Admin Panel - Notifications API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get notification history
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            
            $query = "
                SELECT 
                    notification_id,
                    notification_type,
                    channel,
                    recipient_segment,
                    title,
                    message,
                    sent_datetime,
                    delivery_status
                FROM notification_history
                ORDER BY sent_datetime DESC
                LIMIT ?
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $notifications = [];
            while ($row = $result->fetch_assoc()) {
                $notifications[] = $row;
            }
            
            $stmt->close();
            $conn->close();
            sendResponse(true, $notifications, 'Notifications retrieved successfully');
            break;
            
        case 'POST':
            // Send broadcast notification
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!validateRequired($input, ['title', 'message'])) {
                $conn->close();
                sendResponse(false, [], 'Title and message are required');
            }
            
            $title = sanitizeInput($input['title']);
            $message = sanitizeInput($input['message']);
            $type = isset($input['type']) ? sanitizeInput($input['type']) : 'Broadcast';
            $channel = isset($input['channel']) ? sanitizeInput($input['channel']) : 'Push';
            $segment = isset($input['segment']) ? sanitizeInput($input['segment']) : 'All Users';
            
            // Insert into notification history
            $stmt = $conn->prepare("
                INSERT INTO notification_history 
                (notification_type, channel, recipient_segment, title, message, sent_datetime, delivery_status)
                VALUES (?, ?, ?, ?, ?, NOW(), 'Sent')
            ");
            
            $stmt->bind_param("sssss", $type, $channel, $segment, $title, $message);
            
            if ($stmt->execute()) {
                $notificationId = $stmt->insert_id;
                
                // TODO: Implement actual notification sending logic here
                // For now, we just log it
                
                logAudit($conn, 'Create', 'notification_history', $notificationId, 'Broadcast notification sent: ' . $title);
                
                $stmt->close();
                $conn->close();
                sendResponse(true, ['notification_id' => $notificationId], 'Notification sent successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to send notification');
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
