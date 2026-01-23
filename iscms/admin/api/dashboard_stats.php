<?php
// iSCMS Admin Panel - Dashboard Statistics API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();

try {
    // Healthcare Provider view - show only linked patient stats
    $providerView = isset($_GET['provider_view']) ? true : false;
    $role = $_SESSION['admin_role'] ?? '';
    
    if ($role === 'Healthcare Provider' || $providerView) {
        $providerId = getAdminProviderId();
        if (!$providerId) {
            sendResponse(false, [], 'Provider ID not found');
        }
        
        // Get linked patients
        $linkedPatientsQuery = "
            SELECT COUNT(*) as count 
            FROM patient_provider_links 
            WHERE provider_id = ? AND is_active = 1
        ";
        $stmt = $conn->prepare($linkedPatientsQuery);
        $stmt->bind_param('i', $providerId);
        $stmt->execute();
        $linkedPatients = $stmt->get_result()->fetch_assoc()['count'];
        $stmt->close();
        
        // Get consented patients
        $consentedQuery = "
            SELECT COUNT(*) as count 
            FROM patient_provider_links 
            WHERE provider_id = ? AND is_active = 1 AND consent_given = 1
        ";
        $stmt = $conn->prepare($consentedQuery);
        $stmt->bind_param('i', $providerId);
        $stmt->execute();
        $consentedPatients = $stmt->get_result()->fetch_assoc()['count'];
        $stmt->close();
        
        // Get average patient sugar (last 7 days)
        $avgSugarQuery = "
            SELECT AVG(sil.total_sugar_g) as avg_sugar
            FROM sugar_intake_logs sil
            INNER JOIN patient_provider_links ppl ON sil.user_id = ppl.user_id
            WHERE ppl.provider_id = ? 
              AND ppl.is_active = 1 
              AND sil.log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ";
        $stmt = $conn->prepare($avgSugarQuery);
        $stmt->bind_param('i', $providerId);
        $stmt->execute();
        $avgSugarRow = $stmt->get_result()->fetch_assoc();
        $avgPatientSugar = $avgSugarRow['avg_sugar'] ? round($avgSugarRow['avg_sugar'], 1) : 0;
        $stmt->close();
        
        // Get glucose spikes (last 7 days)
        $spikesQuery = "
            SELECT COUNT(*) as count
            FROM glucose_readings gr
            INNER JOIN patient_provider_links ppl ON gr.user_id = ppl.user_id
            WHERE ppl.provider_id = ? 
              AND ppl.is_active = 1 
              AND gr.reading_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND gr.status IN ('High', 'Critical')
        ";
        $stmt = $conn->prepare($spikesQuery);
        $stmt->bind_param('i', $providerId);
        $stmt->execute();
        $glucoseSpikes = $stmt->get_result()->fetch_assoc()['count'];
        $stmt->close();
        
        $providerStats = [
            'linked_patients' => $linkedPatients,
            'consented_patients' => $consentedPatients,
            'avg_patient_sugar' => $avgPatientSugar,
            'glucose_spikes' => $glucoseSpikes
        ];
        
        $conn->close();
        sendResponse(true, $providerStats, 'Provider dashboard stats retrieved successfully');
    }
    
    // Total Active Users
    $totalUsersQuery = "SELECT COUNT(*) as count FROM users WHERE is_active = 1";
    $totalUsersResult = $conn->query($totalUsersQuery);
    $totalUsers = $totalUsersResult->fetch_assoc()['count'];
    
    // New Registrations Today
    $newRegsQuery = "SELECT COUNT(*) as count FROM users WHERE DATE(registration_date) = CURDATE()";
    $newRegsResult = $conn->query($newRegsQuery);
    $newRegistrations = $newRegsResult->fetch_assoc()['count'];
    
    // Average Sugar Intake (last 7 days)
    $avgSugarQuery = "SELECT AVG(total_sugar_g) as avg_sugar FROM sugar_intake_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $avgSugarResult = $conn->query($avgSugarQuery);
    $avgSugarRow = $avgSugarResult->fetch_assoc();
    $avgSugarIntake = $avgSugarRow['avg_sugar'] ? round($avgSugarRow['avg_sugar'], 1) : 0;
    
    // Users Exceeding Limits Today
    $exceedingQuery = "SELECT COUNT(*) as count FROM sugar_intake_logs WHERE log_date = CURDATE() AND limit_exceeded = 1";
    $exceedingResult = $conn->query($exceedingQuery);
    $exceedingCount = $exceedingResult->fetch_assoc()['count'];
    $exceedingPercent = $totalUsers > 0 ? round(($exceedingCount / $totalUsers) * 100, 1) : 0;
    
    // High-Risk Users
    $highRiskQuery = "SELECT COUNT(*) as count FROM high_risk_users WHERE is_resolved = 0 AND risk_level IN ('High', 'Critical')";
    $highRiskResult = $conn->query($highRiskQuery);
    $highRiskUsers = $highRiskResult->fetch_assoc()['count'];
    
    // Active Alerts (unread)
    $alertsQuery = "SELECT COUNT(*) as count FROM user_alerts WHERE is_read = 0 AND DATE(alert_datetime) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
    $alertsResult = $conn->query($alertsQuery);
    $activeAlerts = $alertsResult->fetch_assoc()['count'];
    
    // CGM Devices Connected
    $cgmQuery = "SELECT COUNT(*) as count FROM cgm_devices WHERE connection_status = 'Connected' AND is_active = 1";
    $cgmResult = $conn->query($cgmQuery);
    $cgmDevices = $cgmResult->fetch_assoc()['count'];
    
    // Goal Achievement Rate (users within limit in last 7 days)
    $achievementQuery = "
        SELECT 
            COUNT(DISTINCT user_id) as compliant_users
        FROM sugar_intake_logs 
        WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND compliance_status = 'Within Limit'
    ";
    $achievementResult = $conn->query($achievementQuery);
    $compliantUsers = $achievementResult->fetch_assoc()['compliant_users'];
    $goalAchievement = $totalUsers > 0 ? round(($compliantUsers / $totalUsers) * 100, 1) : 0;
    
    // Additional metrics
    
    // Food scans today
    $foodScansQuery = "SELECT COUNT(*) as count FROM food_entries WHERE DATE(entry_datetime) = CURDATE()";
    $foodScansResult = $conn->query($foodScansQuery);
    $foodScansToday = $foodScansResult->fetch_assoc()['count'];
    
    // Total food database items
    $foodItemsQuery = "SELECT COUNT(*) as count FROM food_database WHERE is_active = 1";
    $foodItemsResult = $conn->query($foodItemsQuery);
    $totalFoodItems = $foodItemsResult->fetch_assoc()['count'];
    
    // Users by health status
    $healthStatusQuery = "
        SELECT 
            health_status,
            COUNT(*) as count
        FROM users
        WHERE is_active = 1
        GROUP BY health_status
    ";
    $healthStatusResult = $conn->query($healthStatusQuery);
    $healthStatusBreakdown = [];
    while ($row = $healthStatusResult->fetch_assoc()) {
        $healthStatusBreakdown[$row['health_status']] = $row['count'];
    }
    
    // Glucose readings today
    $glucoseReadingsQuery = "SELECT COUNT(*) as count FROM glucose_readings WHERE DATE(reading_datetime) = CURDATE()";
    $glucoseReadingsResult = $conn->query($glucoseReadingsQuery);
    $glucoseReadingsToday = $glucoseReadingsResult->fetch_assoc()['count'];
    
    // Premium users
    $premiumUsersQuery = "SELECT COUNT(*) as count FROM users WHERE is_premium = 1 AND is_active = 1";
    $premiumUsersResult = $conn->query($premiumUsersQuery);
    $premiumUsers = $premiumUsersResult->fetch_assoc()['count'];
    
    $stats = [
        'total_users' => $totalUsers,
        'new_registrations' => $newRegistrations,
        'avg_sugar_intake' => $avgSugarIntake,
        'exceeding_users' => $exceedingPercent,
        'high_risk_users' => $highRiskUsers,
        'active_alerts' => $activeAlerts,
        'cgm_devices' => $cgmDevices,
        'goal_achievement' => $goalAchievement,
        'food_scans_today' => $foodScansToday,
        'total_food_items' => $totalFoodItems,
        'health_status_breakdown' => $healthStatusBreakdown,
        'glucose_readings_today' => $glucoseReadingsToday,
        'premium_users' => $premiumUsers
    ];
    
    $conn->close();
    sendResponse(true, $stats, 'Dashboard statistics retrieved successfully');
    
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error retrieving statistics: ' . $e->getMessage());
}
?>
