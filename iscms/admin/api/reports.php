<?php
// iSCMS Admin Panel - Reports API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $reportType = isset($_GET['report_type']) ? sanitizeInput($_GET['report_type']) : 'population_health';
            
            switch ($reportType) {
                case 'population_health':
                    // Population health summary
                    $data = [];
                    
                    // Total users by health status
                    $healthStatusQuery = "
                        SELECT health_status, COUNT(*) as count 
                        FROM users 
                        WHERE is_active = 1
                        GROUP BY health_status
                    ";
                    $result = $conn->query($healthStatusQuery);
                    $healthStatus = [];
                    while ($row = $result->fetch_assoc()) {
                        $healthStatus[] = $row;
                    }
                    $data['health_status_distribution'] = $healthStatus;
                    
                    // Average sugar intake by health status
                    $avgSugarQuery = "
                        SELECT 
                            u.health_status,
                            AVG(s.total_sugar_g) as avg_sugar
                        FROM users u
                        LEFT JOIN sugar_intake_logs s ON u.user_id = s.user_id
                        WHERE s.log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                        GROUP BY u.health_status
                    ";
                    $result = $conn->query($avgSugarQuery);
                    $avgSugar = [];
                    while ($row = $result->fetch_assoc()) {
                        $avgSugar[] = $row;
                    }
                    $data['avg_sugar_by_status'] = $avgSugar;
                    
                    // Geographic distribution
                    $geoQuery = "
                        SELECT state, COUNT(*) as count 
                        FROM users 
                        WHERE is_active = 1 AND state IS NOT NULL
                        GROUP BY state
                        ORDER BY count DESC
                    ";
                    $result = $conn->query($geoQuery);
                    $geographic = [];
                    while ($row = $result->fetch_assoc()) {
                        $geographic[] = $row;
                    }
                    $data['geographic_distribution'] = $geographic;
                    
                    logAudit($conn, 'View', 'reports', null, 'Generated population health report');
                    $conn->close();
                    sendResponse(true, $data, 'Population health report generated');
                    break;
                    
                case 'system_performance':
                    // System performance metrics
                    $data = [];
                    
                    // Total users and registrations
                    $userStatsQuery = "
                        SELECT 
                            COUNT(*) as total_users,
                            COUNT(CASE WHEN DATE(registration_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as weekly_registrations,
                            COUNT(CASE WHEN DATE(registration_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as monthly_registrations
                        FROM users
                    ";
                    $result = $conn->query($userStatsQuery);
                    $data['user_stats'] = $result->fetch_assoc();
                    
                    // Food database stats
                    $foodStatsQuery = "
                        SELECT 
                            COUNT(*) as total_foods,
                            COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_foods,
                            COUNT(CASE WHEN is_malaysian_food = 1 THEN 1 END) as malaysian_foods
                        FROM food_database
                        WHERE is_active = 1
                    ";
                    $result = $conn->query($foodStatsQuery);
                    $data['food_stats'] = $result->fetch_assoc();
                    
                    // CGM device stats
                    $cgmStatsQuery = "
                        SELECT 
                            COUNT(*) as total_devices,
                            COUNT(CASE WHEN connection_status = 'Connected' THEN 1 END) as connected_devices,
                            COUNT(CASE WHEN connection_status = 'Disconnected' THEN 1 END) as disconnected_devices
                        FROM cgm_devices
                        WHERE is_active = 1
                    ";
                    $result = $conn->query($cgmStatsQuery);
                    $data['cgm_stats'] = $result->fetch_assoc();
                    
                    logAudit($conn, 'View', 'reports', null, 'Generated system performance report');
                    $conn->close();
                    sendResponse(true, $data, 'System performance report generated');
                    break;
                    
                case 'high_risk_users':
                    // High-risk users report
                    $query = "
                        SELECT 
                            hr.risk_id,
                            hr.user_id,
                            u.full_name,
                            u.email,
                            u.health_status,
                            hr.risk_level,
                            hr.consecutive_violations,
                            hr.flagged_date,
                            hr.provider_notified
                        FROM high_risk_users hr
                        JOIN users u ON hr.user_id = u.user_id
                        WHERE hr.is_resolved = 0
                        ORDER BY 
                            CASE hr.risk_level
                                WHEN 'Critical' THEN 1
                                WHEN 'High' THEN 2
                                WHEN 'Medium' THEN 3
                                ELSE 4
                            END,
                            hr.flagged_date DESC
                    ";
                    
                    $result = $conn->query($query);
                    $highRiskUsers = [];
                    while ($row = $result->fetch_assoc()) {
                        $highRiskUsers[] = $row;
                    }
                    
                    logAudit($conn, 'View', 'reports', null, 'Generated high-risk users report');
                    $conn->close();
                    sendResponse(true, $highRiskUsers, 'High-risk users report generated');
                    break;
                    
                default:
                    $conn->close();
                    sendResponse(false, [], 'Invalid report type');
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
