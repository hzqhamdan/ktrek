<?php
// iSCMS Admin Panel - Weight Population Analytics API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();

try {
    $days = isset($_GET['days']) ? max(1, min(90, intval($_GET['days']))) : 30;

    // Total logs
    $totalQuery = "
        SELECT COUNT(*) as total
        FROM weight_logs
        WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ";
    $stmt = $conn->prepare($totalQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $totalLogs = (int)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    // Average weight and BMI
    $avgQuery = "
        SELECT AVG(weight_kg) as avg_weight, AVG(bmi) as avg_bmi
        FROM weight_logs
        WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ";
    $stmt = $conn->prepare($avgQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $avgStats = $stmt->get_result()->fetch_assoc();
    $avgWeight = $avgStats['avg_weight'];
    $avgBMI = $avgStats['avg_bmi'];
    $stmt->close();

    // BMI Distribution (Based on latest log per user in the period)
    // Subquery gets the latest log for each user in the period
    $bmiDistQuery = "
        SELECT 
            CASE 
                WHEN bmi < 18.5 THEN 'Underweight'
                WHEN bmi BETWEEN 18.5 AND 24.9 THEN 'Normal'
                WHEN bmi BETWEEN 25 AND 29.9 THEN 'Overweight'
                WHEN bmi >= 30 THEN 'Obese'
                ELSE 'Unknown'
            END as category,
            COUNT(*) as count
        FROM (
            SELECT bmi 
            FROM weight_logs 
            WHERE (user_id, log_date) IN (
                SELECT user_id, MAX(log_date)
                FROM weight_logs
                WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY user_id
            )
        ) as latest_logs
        GROUP BY category
    ";
    $stmt = $conn->prepare($bmiDistQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $distResult = $stmt->get_result();
    $bmiDistribution = [];
    while ($row = $distResult->fetch_assoc()) {
        $bmiDistribution[] = $row;
    }
    $stmt->close();

    // Daily Average Trend
    $trendQuery = "
        SELECT log_date, AVG(weight_kg) as daily_avg
        FROM weight_logs
        WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY log_date
        ORDER BY log_date ASC
    ";
    $stmt = $conn->prepare($trendQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $trendResult = $stmt->get_result();
    $weightTrend = [];
    while ($row = $trendResult->fetch_assoc()) {
        $weightTrend[] = $row;
    }
    $stmt->close();

    // Recent Logs with User Info
    $recentQuery = "
        SELECT w.weight_log_id, w.user_id, u.full_name, w.weight_kg, w.bmi, w.log_date, w.source
        FROM weight_logs w
        JOIN users u ON w.user_id = u.user_id
        WHERE w.log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY w.log_date DESC, w.weight_log_id DESC
        LIMIT 10
    ";
    $stmt = $conn->prepare($recentQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $recentResult = $stmt->get_result();
    $recentLogs = [];
    while ($row = $recentResult->fetch_assoc()) {
        $recentLogs[] = $row;
    }
    $stmt->close();
    
    // Users with Weight Goals
    $goalsQuery = "SELECT COUNT(*) as count FROM users WHERE target_weight_kg IS NOT NULL AND is_active = 1";
    $usersWithGoals = (int)$conn->query($goalsQuery)->fetch_assoc()['count'];

    $data = [
        'period_days' => $days,
        'total_logs' => $totalLogs,
        'avg_weight' => $avgWeight ? round((float)$avgWeight, 1) : 0,
        'avg_bmi' => $avgBMI ? round((float)$avgBMI, 1) : 0,
        'bmi_distribution' => $bmiDistribution,
        'weight_trend' => $weightTrend,
        'recent_logs' => $recentLogs,
        'users_with_goals' => $usersWithGoals
    ];

    logAudit($conn, 'View', 'weight_logs', null, 'Viewed weight population analytics');

    $conn->close();
    sendResponse(true, $data, 'Weight analytics generated');
} catch (Exception $e) {
    if (isset($conn)) $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
