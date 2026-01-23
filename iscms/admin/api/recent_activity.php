<?php
// iSCMS Admin Panel - Recent Activity API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();

try {
    // Get limit from query params (default 20)
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
    
    $activities = [];
    
    // Recent user registrations
    $regQuery = "
        SELECT 
            user_id,
            full_name,
            health_status,
            state,
            device_type,
            registration_date as timestamp,
            'registration' as activity_type
        FROM users
        WHERE DATE(registration_date) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY registration_date DESC
        LIMIT 5
    ";
    $regResult = $conn->query($regQuery);
    while ($row = $regResult->fetch_assoc()) {
        $activities[] = [
            'type' => 'registration',
            'description' => "New user registered: {$row['full_name']} ({$row['health_status']}) from {$row['state']} via {$row['device_type']}",
            'timestamp' => $row['timestamp'],
            'user_id' => $row['user_id']
        ];
    }
    
    // Recent food entries
    $foodQuery = "
        SELECT 
            fe.entry_id,
            fe.user_id,
            u.full_name,
            fe.food_name,
            fe.recognition_method,
            fe.entry_datetime as timestamp,
            'food_entry' as activity_type
        FROM food_entries fe
        JOIN users u ON fe.user_id = u.user_id
        WHERE DATE(fe.entry_datetime) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY fe.entry_datetime DESC
        LIMIT 5
    ";
    $foodResult = $conn->query($foodQuery);
    while ($row = $foodResult->fetch_assoc()) {
        $activities[] = [
            'type' => 'food_scan',
            'description' => "{$row['full_name']} scanned: {$row['food_name']} ({$row['recognition_method']})",
            'timestamp' => $row['timestamp'],
            'user_id' => $row['user_id']
        ];
    }
    
    // Recent alerts
    $alertQuery = "
        SELECT 
            ua.alert_id,
            ua.user_id,
            u.full_name,
            ua.alert_type,
            ua.severity,
            ua.alert_datetime as timestamp,
            'alert' as activity_type
        FROM user_alerts ua
        JOIN users u ON ua.user_id = u.user_id
        WHERE DATE(ua.alert_datetime) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY ua.alert_datetime DESC
        LIMIT 5
    ";
    $alertResult = $conn->query($alertQuery);
    while ($row = $alertResult->fetch_assoc()) {
        $activities[] = [
            'type' => 'alert',
            'description' => "Alert triggered: {$row['full_name']} - {$row['alert_type']} ({$row['severity']})",
            'timestamp' => $row['timestamp'],
            'user_id' => $row['user_id'],
            'severity' => $row['severity']
        ];
    }
    
    // Recent glucose readings
    $glucoseQuery = "
        SELECT 
            gr.reading_id,
            gr.user_id,
            u.full_name,
            gr.glucose_level,
            gr.status,
            gr.reading_datetime as timestamp,
            'glucose_reading' as activity_type
        FROM glucose_readings gr
        JOIN users u ON gr.user_id = u.user_id
        WHERE DATE(gr.reading_datetime) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND gr.status IN ('High', 'Critical')
        ORDER BY gr.reading_datetime DESC
        LIMIT 5
    ";
    $glucoseResult = $conn->query($glucoseQuery);
    while ($row = $glucoseResult->fetch_assoc()) {
        $activities[] = [
            'type' => 'glucose_spike',
            'description' => "Glucose spike: {$row['full_name']} - {$row['glucose_level']} mg/dL ({$row['status']})",
            'timestamp' => $row['timestamp'],
            'user_id' => $row['user_id'],
            'severity' => $row['status']
        ];
    }
    
    // Admin actions
    $adminQuery = "
        SELECT 
            action_description as description,
            created_at as timestamp,
            'admin_action' as activity_type
        FROM audit_logs
        WHERE user_type IN ('Admin', 'System')
        AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY created_at DESC
        LIMIT 5
    ";
    $adminResult = $conn->query($adminQuery);
    while ($row = $adminResult->fetch_assoc()) {
        $activities[] = [
            'type' => 'admin_action',
            'description' => $row['description'],
            'timestamp' => $row['timestamp']
        ];
    }
    
    // Sort all activities by timestamp
    usort($activities, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Limit to requested number
    $activities = array_slice($activities, 0, $limit);
    
    $conn->close();
    sendResponse(true, $activities, 'Recent activity retrieved successfully');
    
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error retrieving activity: ' . $e->getMessage());
}
?>
