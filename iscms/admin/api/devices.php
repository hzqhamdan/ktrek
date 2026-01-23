<?php
// Device Management API
// Handles CGM devices and Smart Scale monitoring

session_start();
require_once '../config.php';

// Check authentication
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            getAllDevices($pdo);
            break;
            
        case 'stats':
            getDeviceStats($pdo);
            break;
            
        case 'cgm_details':
            getCGMDetails($pdo);
            break;
            
        case 'scale_details':
            getScaleDetails($pdo);
            break;
            
        case 'user_devices':
            $userId = $_GET['user_id'] ?? null;
            getUserDevices($pdo, $userId);
            break;
            
        case 'sync_history':
            $deviceId = $_GET['device_id'] ?? null;
            $deviceType = $_GET['device_type'] ?? null;
            getSyncHistory($pdo, $deviceId, $deviceType);
            break;
            
        case 'alerts':
            getDeviceAlerts($pdo);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

// Get all devices with user information
function getAllDevices($pdo) {
    // Get CGM devices
    $cgmQuery = "
        SELECT 
            cd.device_id,
            'CGM' as device_type,
            cd.user_id,
            u.full_name,
            u.email,
            u.health_status,
            cd.device_name,
            cd.device_model,
            cd.serial_number,
            cd.connection_status,
            cd.last_sync,
            cd.battery_level,
            cd.sensor_expiry_date,
            cd.sensor_days_remaining,
            cd.firmware_version,
            cd.is_active,
            cd.created_at,
            cd.updated_at,
            CASE 
                WHEN cd.sensor_days_remaining IS NOT NULL AND cd.sensor_days_remaining <= 1 THEN 'Critical'
                WHEN cd.sensor_days_remaining IS NOT NULL AND cd.sensor_days_remaining <= 3 THEN 'Warning'
                WHEN cd.connection_status = 'Disconnected' THEN 'Warning'
                WHEN cd.battery_level IS NOT NULL AND cd.battery_level <= 20 THEN 'Warning'
                ELSE 'Normal'
            END as alert_status,
            TIMESTAMPDIFF(HOUR, cd.last_sync, NOW()) as hours_since_sync
        FROM cgm_devices cd
        INNER JOIN users u ON cd.user_id = u.user_id
        ORDER BY 
            CASE cd.connection_status 
                WHEN 'Error' THEN 1
                WHEN 'Disconnected' THEN 2
                WHEN 'Syncing' THEN 3
                WHEN 'Connected' THEN 4
            END,
            cd.sensor_days_remaining ASC,
            cd.battery_level ASC
    ";
    
    // Get Smart Scale devices
    $scaleQuery = "
        SELECT 
            sd.device_id,
            'Smart Scale' as device_type,
            sd.user_id,
            u.full_name,
            u.email,
            u.health_status,
            sd.device_name,
            sd.device_model,
            sd.serial_number,
            sd.connection_status,
            sd.last_sync,
            sd.battery_level,
            NULL as sensor_expiry_date,
            NULL as sensor_days_remaining,
            sd.firmware_version,
            sd.is_active,
            sd.created_at,
            sd.updated_at,
            CASE 
                WHEN sd.connection_status = 'Disconnected' THEN 'Warning'
                WHEN sd.battery_level IS NOT NULL AND sd.battery_level <= 20 THEN 'Warning'
                ELSE 'Normal'
            END as alert_status,
            TIMESTAMPDIFF(HOUR, sd.last_sync, NOW()) as hours_since_sync
        FROM smart_scale_devices sd
        INNER JOIN users u ON sd.user_id = u.user_id
        ORDER BY 
            CASE sd.connection_status 
                WHEN 'Error' THEN 1
                WHEN 'Disconnected' THEN 2
                WHEN 'Syncing' THEN 3
                WHEN 'Connected' THEN 4
            END,
            sd.battery_level ASC
    ";
    
    $cgmStmt = $pdo->query($cgmQuery);
    $scaleStmt = $pdo->query($scaleQuery);
    
    $devices = [
        'cgm_devices' => $cgmStmt->fetchAll(PDO::FETCH_ASSOC),
        'scale_devices' => $scaleStmt->fetchAll(PDO::FETCH_ASSOC),
        'total_devices' => $cgmStmt->rowCount() + $scaleStmt->rowCount()
    ];
    
    echo json_encode($devices);
}

// Get device statistics
function getDeviceStats($pdo) {
    // CGM Statistics
    $cgmStatsQuery = "
        SELECT 
            COUNT(*) as total_cgm,
            SUM(CASE WHEN connection_status = 'Connected' THEN 1 ELSE 0 END) as cgm_connected,
            SUM(CASE WHEN connection_status = 'Disconnected' THEN 1 ELSE 0 END) as cgm_disconnected,
            SUM(CASE WHEN connection_status = 'Error' THEN 1 ELSE 0 END) as cgm_error,
            SUM(CASE WHEN battery_level IS NOT NULL AND battery_level <= 20 THEN 1 ELSE 0 END) as cgm_low_battery,
            SUM(CASE WHEN sensor_days_remaining IS NOT NULL AND sensor_days_remaining <= 3 THEN 1 ELSE 0 END) as sensors_expiring_soon,
            SUM(CASE WHEN sensor_days_remaining IS NOT NULL AND sensor_days_remaining <= 0 THEN 1 ELSE 0 END) as sensors_expired,
            AVG(battery_level) as avg_battery_level
        FROM cgm_devices
        WHERE is_active = 1
    ";
    
    // Smart Scale Statistics
    $scaleStatsQuery = "
        SELECT 
            COUNT(*) as total_scales,
            SUM(CASE WHEN connection_status = 'Connected' THEN 1 ELSE 0 END) as scales_connected,
            SUM(CASE WHEN connection_status = 'Disconnected' THEN 1 ELSE 0 END) as scales_disconnected,
            SUM(CASE WHEN connection_status = 'Error' THEN 1 ELSE 0 END) as scales_error,
            SUM(CASE WHEN battery_level IS NOT NULL AND battery_level <= 20 THEN 1 ELSE 0 END) as scales_low_battery,
            AVG(battery_level) as avg_battery_level
        FROM smart_scale_devices
        WHERE is_active = 1
    ";
    
    $cgmStats = $pdo->query($cgmStatsQuery)->fetch(PDO::FETCH_ASSOC);
    $scaleStats = $pdo->query($scaleStatsQuery)->fetch(PDO::FETCH_ASSOC);
    
    // Sync statistics (optional - only if table exists)
    $syncStats = [];
    try {
        $syncStatsQuery = "
            SELECT 
                device_type,
                COUNT(*) as sync_count,
                SUM(CASE WHEN sync_status = 'Success' THEN 1 ELSE 0 END) as successful_syncs,
                SUM(CASE WHEN sync_status = 'Failed' THEN 1 ELSE 0 END) as failed_syncs,
                AVG(sync_duration_ms) as avg_sync_duration
            FROM device_sync_history
            WHERE sync_datetime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY device_type
        ";
        $syncStats = $pdo->query($syncStatsQuery)->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Table doesn't exist yet, skip
        $syncStats = [];
    }
    
    // Recent alerts (optional - only if table exists)
    $alertStats = [];
    try {
        $alertStatsQuery = "
            SELECT 
                device_type,
                alert_type,
                COUNT(*) as alert_count
            FROM device_alerts
            WHERE alert_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAYS)
            AND is_resolved = 0
            GROUP BY device_type, alert_type
        ";
        $alertStats = $pdo->query($alertStatsQuery)->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Table doesn't exist yet, skip
        $alertStats = [];
    }
    
    $stats = [
        'cgm_stats' => $cgmStats,
        'scale_stats' => $scaleStats,
        'sync_stats' => $syncStats,
        'alert_stats' => $alertStats,
        'total_devices' => ($cgmStats['total_cgm'] ?? 0) + ($scaleStats['total_scales'] ?? 0),
        'total_connected' => ($cgmStats['cgm_connected'] ?? 0) + ($scaleStats['scales_connected'] ?? 0),
        'total_disconnected' => ($cgmStats['cgm_disconnected'] ?? 0) + ($scaleStats['scales_disconnected'] ?? 0)
    ];
    
    echo json_encode($stats);
}

// Get detailed CGM information
function getCGMDetails($pdo) {
    $query = "
        SELECT 
            cd.*,
            u.full_name,
            u.email,
            u.phone_number,
            u.health_status,
            u.state,
            u.city,
            (SELECT COUNT(*) FROM glucose_readings WHERE user_id = cd.user_id AND reading_datetime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as readings_24h
        FROM cgm_devices cd
        INNER JOIN users u ON cd.user_id = u.user_id
        WHERE cd.is_active = 1
        ORDER BY cd.connection_status, cd.sensor_days_remaining ASC
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get detailed Smart Scale information
function getScaleDetails($pdo) {
    $query = "
        SELECT 
            sd.*,
            u.full_name,
            u.email,
            u.phone_number,
            u.health_status,
            u.current_weight_kg,
            u.target_weight_kg,
            u.bmi,
            (SELECT COUNT(*) FROM weight_logs WHERE user_id = sd.user_id AND log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as logs_30d
        FROM smart_scale_devices sd
        INNER JOIN users u ON sd.user_id = u.user_id
        WHERE sd.is_active = 1
        ORDER BY sd.connection_status, sd.battery_level ASC
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get devices for a specific user
function getUserDevices($pdo, $userId) {
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        return;
    }
    
    // CGM devices
    $cgmQuery = "
        SELECT 
            cd.*,
            'CGM' as device_type,
            cs.sensor_serial,
            cs.installation_date,
            cs.expiry_date,
            cs.sensor_status
        FROM cgm_devices cd
        LEFT JOIN cgm_sensors cs ON cd.device_id = cs.device_id AND cs.sensor_status = 'Active'
        WHERE cd.user_id = ?
        ORDER BY cd.is_active DESC, cd.created_at DESC
    ";
    
    // Smart Scale devices
    $scaleQuery = "
        SELECT 
            *,
            'Smart Scale' as device_type
        FROM smart_scale_devices
        WHERE user_id = ?
        ORDER BY is_active DESC, created_at DESC
    ";
    
    $cgmStmt = $pdo->prepare($cgmQuery);
    $cgmStmt->execute([$userId]);
    
    $scaleStmt = $pdo->prepare($scaleQuery);
    $scaleStmt->execute([$userId]);
    
    $devices = [
        'cgm_devices' => $cgmStmt->fetchAll(PDO::FETCH_ASSOC),
        'scale_devices' => $scaleStmt->fetchAll(PDO::FETCH_ASSOC)
    ];
    
    echo json_encode($devices);
}

// Get sync history for a device
function getSyncHistory($pdo, $deviceId, $deviceType) {
    if (!$deviceId || !$deviceType) {
        http_response_code(400);
        echo json_encode(['error' => 'Device ID and type required']);
        return;
    }
    
    $query = "
        SELECT *
        FROM device_sync_history
        WHERE device_id = ? AND device_type = ?
        ORDER BY sync_datetime DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$deviceId, $deviceType]);
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get device alerts
function getDeviceAlerts($pdo) {
    // Check if device_alerts table exists
    try {
        $query = "
            SELECT 
                da.*,
                u.full_name,
                u.email,
                CASE 
                    WHEN da.device_type = 'CGM' THEN cd.device_name
                    WHEN da.device_type = 'Smart Scale' THEN sd.device_name
                END as device_name
            FROM device_alerts da
            INNER JOIN users u ON da.user_id = u.user_id
            LEFT JOIN cgm_devices cd ON da.device_id = cd.device_id AND da.device_type = 'CGM'
            LEFT JOIN smart_scale_devices sd ON da.device_id = sd.device_id AND da.device_type = 'Smart Scale'
            WHERE da.is_resolved = 0
            ORDER BY 
                CASE da.severity 
                    WHEN 'Critical' THEN 1
                    WHEN 'Warning' THEN 2
                    WHEN 'Info' THEN 3
                END,
                da.alert_datetime DESC
            LIMIT 100
        ";
        
        $stmt = $pdo->query($query);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        // Table doesn't exist yet, return empty array
        echo json_encode([]);
    }
}
