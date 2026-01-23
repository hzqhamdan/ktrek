<?php
// iSCMS Admin Panel - User Detail API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendResponse(false, [], 'Method not allowed');
}

$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$userId) {
    sendResponse(false, [], 'User ID is required');
}

try {
    // Get user basic info
    $userQuery = "
        SELECT 
            user_id, full_name, email, phone_number, date_of_birth, age, gender,
            health_status, height_cm, current_weight_kg, target_weight_kg, bmi,
            daily_sugar_limit_g, daily_calorie_limit, state, city,
            is_active, is_premium, premium_until, device_type, app_version,
            registration_date, last_active
        FROM users
        WHERE user_id = ?
    ";
    $stmt = $conn->prepare($userQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        $conn->close();
        sendResponse(false, [], 'User not found');
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Get sugar intake summary (last 7 days)
    $sugarQuery = "
        SELECT 
            log_date,
            total_sugar_g,
            compliance_status,
            limit_exceeded
        FROM sugar_intake_logs
        WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ORDER BY log_date DESC
    ";
    $stmt = $conn->prepare($sugarQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $sugarLogs = [];
    $totalSugar = 0;
    $daysCompliant = 0;
    while ($row = $result->fetch_assoc()) {
        $sugarLogs[] = $row;
        $totalSugar += $row['total_sugar_g'];
        if ($row['compliance_status'] === 'Within Limit') {
            $daysCompliant++;
        }
    }
    $avgSugar = count($sugarLogs) > 0 ? round($totalSugar / count($sugarLogs), 1) : 0;
    $complianceRate = count($sugarLogs) > 0 ? round(($daysCompliant / count($sugarLogs)) * 100, 1) : 0;
    $stmt->close();
    
    // Get recent food entries (last 10)
    $foodQuery = "
        SELECT 
            entry_id, food_name, meal_type, sugar_content_g, 
            calories, recognition_method, entry_datetime
        FROM food_entries
        WHERE user_id = ?
        ORDER BY entry_datetime DESC
        LIMIT 10
    ";
    $stmt = $conn->prepare($foodQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $foodEntries = [];
    while ($row = $result->fetch_assoc()) {
        $foodEntries[] = $row;
    }
    $stmt->close();
    
    // Get glucose readings summary
    $glucoseQuery = "
        SELECT 
            reading_datetime, glucose_level, unit, status
        FROM glucose_readings
        WHERE user_id = ?
        ORDER BY reading_datetime DESC
        LIMIT 20
    ";
    $stmt = $conn->prepare($glucoseQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $glucoseReadings = [];
    while ($row = $result->fetch_assoc()) {
        $glucoseReadings[] = $row;
    }
    $stmt->close();
    
    // Get weight logs (last 10)
    $weightQuery = "
        SELECT 
            log_date, weight_kg, bmi
        FROM weight_logs
        WHERE user_id = ?
        ORDER BY log_date DESC
        LIMIT 10
    ";
    $stmt = $conn->prepare($weightQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $weightLogs = [];
    while ($row = $result->fetch_assoc()) {
        $weightLogs[] = $row;
    }
    $stmt->close();
    
    // Get connected CGM devices with enhanced info
    $cgmQuery = "
        SELECT 
            device_id, device_name, device_model, serial_number, connection_status,
            last_sync, battery_level, firmware_version, sensor_expiry_date,
            sensor_days_remaining, is_active,
            TIMESTAMPDIFF(HOUR, last_sync, NOW()) as hours_since_sync
        FROM cgm_devices
        WHERE user_id = ?
        ORDER BY is_active DESC, created_at DESC
    ";
    $stmt = $conn->prepare($cgmQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $cgmDevices = [];
    while ($row = $result->fetch_assoc()) {
        $cgmDevices[] = $row;
    }
    $stmt->close();
    
    // Get smart scale devices
    $scaleQuery = "
        SELECT 
            device_id, device_name, device_model, serial_number, connection_status,
            last_sync, battery_level, firmware_version, is_active,
            TIMESTAMPDIFF(HOUR, last_sync, NOW()) as hours_since_sync
        FROM smart_scale_devices
        WHERE user_id = ?
        ORDER BY is_active DESC, created_at DESC
    ";
    $stmt = $conn->prepare($scaleQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $scaleDevices = [];
    while ($row = $result->fetch_assoc()) {
        $scaleDevices[] = $row;
    }
    $stmt->close();
    
    // Get recent alerts (last 10)
    $alertsQuery = "
        SELECT 
            alert_id, alert_type, severity, title, message,
            alert_datetime, is_read
        FROM user_alerts
        WHERE user_id = ?
        ORDER BY alert_datetime DESC
        LIMIT 10
    ";
    $stmt = $conn->prepare($alertsQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $alerts = [];
    while ($row = $result->fetch_assoc()) {
        $alerts[] = $row;
    }
    $stmt->close();
    
    // Get linked healthcare providers
    $providerQuery = "
        SELECT 
            ppl.link_id, ppl.consent_given, ppl.access_level,
            hp.provider_id, hp.full_name, hp.specialization, hp.hospital_clinic
        FROM patient_provider_links ppl
        JOIN healthcare_providers hp ON ppl.provider_id = hp.provider_id
        WHERE ppl.user_id = ? AND ppl.is_active = 1
    ";
    $stmt = $conn->prepare($providerQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $providers = [];
    while ($row = $result->fetch_assoc()) {
        $providers[] = $row;
    }
    $stmt->close();
    
    // Check if user is high-risk
    $riskQuery = "
        SELECT risk_level, consecutive_violations, flagged_date
        FROM high_risk_users
        WHERE user_id = ? AND is_resolved = 0
        ORDER BY flagged_date DESC
        LIMIT 1
    ";
    $stmt = $conn->prepare($riskQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $riskInfo = $result->num_rows > 0 ? $result->fetch_assoc() : null;
    $stmt->close();
    
    // Get today's activity timeline (without exercise_logs)
    $todayQuery = "
        SELECT 'food' as activity_type, entry_datetime as activity_time, 
               food_name as description, meal_type as category, sugar_content_g as value
        FROM food_entries
        WHERE user_id = ? AND DATE(entry_datetime) = CURDATE()
        
        UNION ALL
        
        SELECT 'glucose' as activity_type, reading_datetime as activity_time,
               CONCAT(glucose_level, ' ', unit) as description, status as category, glucose_level as value
        FROM glucose_readings
        WHERE user_id = ? AND DATE(reading_datetime) = CURDATE()
        
        UNION ALL
        
        SELECT 'weight' as activity_type, log_date as activity_time,
               CONCAT(weight_kg, ' kg') as description, 'Weight Log' as category, weight_kg as value
        FROM weight_logs
        WHERE user_id = ? AND log_date = CURDATE()
        
        ORDER BY activity_time DESC
    ";
    $stmt = $conn->prepare($todayQuery);
    $stmt->bind_param("iii", $userId, $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $todayActivity = [];
    while ($row = $result->fetch_assoc()) {
        $todayActivity[] = $row;
    }
    $stmt->close();
    
    // Get weekly glucose trend (last 7 days)
    $weeklyGlucoseQuery = "
        SELECT 
            DATE(reading_datetime) as reading_date,
            AVG(glucose_level) as avg_glucose,
            MIN(glucose_level) as min_glucose,
            MAX(glucose_level) as max_glucose,
            COUNT(*) as reading_count
        FROM glucose_readings
        WHERE user_id = ? AND reading_datetime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(reading_datetime)
        ORDER BY reading_date ASC
    ";
    $stmt = $conn->prepare($weeklyGlucoseQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $weeklyGlucose = [];
    while ($row = $result->fetch_assoc()) {
        $weeklyGlucose[] = $row;
    }
    $stmt->close();
    
    // Get weekly weight trend (last 7 days)
    $weeklyWeightQuery = "
        SELECT 
            log_date,
            weight_kg,
            bmi
        FROM weight_logs
        WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ORDER BY log_date ASC
    ";
    $stmt = $conn->prepare($weeklyWeightQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $weeklyWeight = [];
    while ($row = $result->fetch_assoc()) {
        $weeklyWeight[] = $row;
    }
    $stmt->close();
    
    // Get weekly sugar intake trend
    $weeklySugarQuery = "
        SELECT 
            log_date,
            total_sugar_g,
            compliance_status,
            limit_exceeded
        FROM sugar_intake_logs
        WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ORDER BY log_date ASC
    ";
    $stmt = $conn->prepare($weeklySugarQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $weeklySugar = [];
    while ($row = $result->fetch_assoc()) {
        $weeklySugar[] = $row;
    }
    $stmt->close();
    
    // Compile all data
    $userData = [
        'user' => $user,
        'sugar_summary' => [
            'logs' => $sugarLogs,
            'avg_daily_sugar' => $avgSugar,
            'compliance_rate' => $complianceRate
        ],
        'recent_food_entries' => $foodEntries,
        'glucose_readings' => $glucoseReadings,
        'weight_logs' => $weightLogs,
        'devices' => [
            'cgm_devices' => $cgmDevices,
            'scale_devices' => $scaleDevices,
            'total_devices' => count($cgmDevices) + count($scaleDevices)
        ],
        'recent_alerts' => $alerts,
        'healthcare_providers' => $providers,
        'risk_info' => $riskInfo,
        'today_activity' => $todayActivity,
        'weekly_trends' => [
            'glucose' => $weeklyGlucose,
            'weight' => $weeklyWeight,
            'sugar' => $weeklySugar
        ]
    ];
    
    logAudit($conn, 'View', 'users', $userId, 'Viewed user profile details');
    
    $conn->close();
    sendResponse(true, $userData, 'User details retrieved successfully');
    
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
?>
