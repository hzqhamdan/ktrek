<?php
// iSCMS Admin Panel - Health Data API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : 'sugar';

try {
    switch ($type) {
        case 'sugar':
            // Sugar intake statistics
            $avgDailySugar = "SELECT AVG(total_sugar_g) as avg_sugar FROM sugar_intake_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            $avgResult = $conn->query($avgDailySugar);
            $avgSugar = $avgResult->fetch_assoc()['avg_sugar'];
            
            $complianceQuery = "
                SELECT 
                    COUNT(CASE WHEN compliance_status = 'Within Limit' THEN 1 END) * 100.0 / COUNT(*) as rate
                FROM sugar_intake_logs 
                WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ";
            $complianceResult = $conn->query($complianceQuery);
            $complianceRate = $complianceResult->fetch_assoc()['rate'];
            
            $exceedingQuery = "SELECT COUNT(DISTINCT user_id) as count FROM sugar_intake_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND limit_exceeded = 1";
            $exceedingResult = $conn->query($exceedingQuery);
            $usersExceeding = $exceedingResult->fetch_assoc()['count'];
            
            $data = [
                'avg_daily_sugar' => round($avgSugar, 1),
                'compliance_rate' => round($complianceRate, 1),
                'users_exceeding' => $usersExceeding
            ];
            
            $conn->close();
            sendResponse(true, $data, 'Sugar intake data retrieved');
            break;
            
        case 'glucose':
            // Glucose level statistics
            $avgGlucoseQuery = "SELECT AVG(glucose_level) as avg_glucose FROM glucose_readings WHERE reading_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            $avgResult = $conn->query($avgGlucoseQuery);
            $avgGlucose = $avgResult->fetch_assoc()['avg_glucose'];
            
            $data = [
                'avg_glucose_level' => round($avgGlucose, 1),
                'unit' => 'mg/dL'
            ];
            
            $conn->close();
            sendResponse(true, $data, 'Glucose data retrieved');
            break;
            
        case 'weight':
            // Weight statistics
            $avgWeightQuery = "SELECT AVG(weight_kg) as avg_weight FROM weight_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            $avgResult = $conn->query($avgWeightQuery);
            $avgWeight = $avgResult->fetch_assoc()['avg_weight'];
            
            $data = [
                'avg_weight' => round($avgWeight, 1)
            ];
            
            $conn->close();
            sendResponse(true, $data, 'Weight data retrieved');
            break;
            
        default:
            $conn->close();
            sendResponse(false, [], 'Invalid data type');
    }
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
?>
