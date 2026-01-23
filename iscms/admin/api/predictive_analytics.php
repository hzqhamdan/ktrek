<?php
// Predictive Analytics API
// Provides pattern detection, predictions, and recommendations

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
    
    $action = $_GET['action'] ?? 'overview';
    
    switch ($action) {
        case 'overview':
            getPredictiveOverview($pdo);
            break;
            
        case 'patterns':
            getDetectedPatterns($pdo);
            break;
            
        case 'predictions':
            getHealthPredictions($pdo);
            break;
            
        case 'recommendations':
            getActiveRecommendations($pdo);
            break;
            
        case 'risk_trends':
            getRiskTrends($pdo);
            break;
            
        case 'user_insights':
            $userId = $_GET['user_id'] ?? null;
            getUserInsights($pdo, $userId);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

// Get predictive analytics overview
function getPredictiveOverview($pdo) {
    // Check if tables exist
    $tablesExist = checkTablesExist($pdo);
    
    if (!$tablesExist) {
        // Generate simulated predictive analytics
        echo json_encode(getSimulatedPredictiveData($pdo));
        return;
    }
    
    // Real data from tables
    $statsQuery = "
        SELECT 
            (SELECT COUNT(*) FROM user_health_patterns WHERE detection_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as patterns_detected,
            (SELECT COUNT(DISTINCT user_id) FROM user_health_patterns WHERE detection_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as users_with_patterns,
            (SELECT COUNT(*) FROM ai_recommendations WHERE status = 'Pending' OR status = 'Sent') as active_recommendations,
            (SELECT COUNT(*) FROM health_predictions WHERE target_date >= CURDATE()) as active_predictions,
            (SELECT COUNT(*) FROM user_health_patterns WHERE severity = 'High' OR severity = 'Critical') as high_severity_patterns,
            (SELECT COUNT(*) FROM risk_assessment_history WHERE risk_trend = 'Worsening' AND assessment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as worsening_trends
    ";
    
    $overview = $pdo->query($statsQuery)->fetch(PDO::FETCH_ASSOC);
    
    // Get pattern distribution
    $patternDistQuery = "
        SELECT 
            pattern_type,
            COUNT(*) as count,
            AVG(CASE 
                WHEN severity = 'Low' THEN 1
                WHEN severity = 'Medium' THEN 2
                WHEN severity = 'High' THEN 3
                WHEN severity = 'Critical' THEN 4
            END) as avg_severity
        FROM user_health_patterns
        WHERE detection_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY pattern_type
        ORDER BY count DESC
    ";
    
    $patternDist = $pdo->query($patternDistQuery)->fetchAll(PDO::FETCH_ASSOC);
    
    $overview['pattern_distribution'] = $patternDist;
    
    echo json_encode($overview);
}

// Generate simulated predictive data when tables don't exist
function getSimulatedPredictiveData($pdo) {
    // Get user count for realistic numbers
    $userCount = $pdo->query("SELECT COUNT(*) FROM users WHERE is_active = 1")->fetchColumn();
    
    // Simulate patterns detected
    $patternsDetected = round($userCount * 0.4); // 40% of users have patterns
    $usersWithPatterns = round($userCount * 0.35);
    
    return [
        'patterns_detected' => $patternsDetected,
        'users_with_patterns' => $usersWithPatterns,
        'active_recommendations' => round($patternsDetected * 0.6),
        'active_predictions' => $userCount,
        'high_severity_patterns' => round($patternsDetected * 0.15),
        'worsening_trends' => round($userCount * 0.08),
        'pattern_distribution' => [
            ['pattern_type' => 'Sugar Spike', 'count' => rand(15, 30), 'avg_severity' => 2.5],
            ['pattern_type' => 'Non-Compliance', 'count' => rand(10, 25), 'avg_severity' => 2.2],
            ['pattern_type' => 'Weight Gain', 'count' => rand(8, 20), 'avg_severity' => 2.0],
            ['pattern_type' => 'Low Glucose', 'count' => rand(5, 15), 'avg_severity' => 2.8],
            ['pattern_type' => 'Meal Skipping', 'count' => rand(5, 12), 'avg_severity' => 1.8]
        ],
        'simulated' => true
    ];
}

// Get detected patterns
function getDetectedPatterns($pdo) {
    $tablesExist = checkTablesExist($pdo);
    
    if (!$tablesExist) {
        // Simulated patterns
        echo json_encode(getSimulatedPatterns($pdo));
        return;
    }
    
    $query = "
        SELECT 
            p.*,
            u.full_name,
            u.email,
            u.health_status
        FROM user_health_patterns p
        INNER JOIN users u ON p.user_id = u.user_id
        WHERE p.detection_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY 
            CASE p.severity
                WHEN 'Critical' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                WHEN 'Low' THEN 4
            END,
            p.detection_date DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get simulated patterns
function getSimulatedPatterns($pdo) {
    $users = $pdo->query("SELECT user_id, full_name, email, health_status FROM users WHERE is_active = 1 ORDER BY user_id LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
    
    $patterns = [];
    $patternTypes = ['Sugar Spike', 'Low Glucose', 'Non-Compliance', 'Weight Gain', 'Meal Skipping'];
    $severities = ['Low', 'Medium', 'High', 'Critical'];
    $trends = ['Improving', 'Stable', 'Worsening'];
    
    foreach (array_slice($users, 0, 10) as $user) {
        $patterns[] = [
            'pattern_id' => count($patterns) + 1,
            'user_id' => $user['user_id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'health_status' => $user['health_status'],
            'pattern_type' => $patternTypes[array_rand($patternTypes)],
            'pattern_description' => 'Pattern detected through behavioral analysis',
            'detection_date' => date('Y-m-d', strtotime('-' . rand(1, 30) . ' days')),
            'frequency_count' => rand(1, 10),
            'severity' => $severities[array_rand($severities)],
            'trend_direction' => $trends[array_rand($trends)],
            'simulated' => true
        ];
    }
    
    return $patterns;
}

// Get health predictions
function getHealthPredictions($pdo) {
    $tablesExist = checkTablesExist($pdo);
    
    if (!$tablesExist) {
        echo json_encode(getSimulatedPredictions($pdo));
        return;
    }
    
    $query = "
        SELECT 
            p.*,
            u.full_name,
            u.email,
            u.health_status
        FROM health_predictions p
        INNER JOIN users u ON p.user_id = u.user_id
        WHERE p.target_date >= CURDATE()
        ORDER BY p.target_date ASC, p.confidence_score DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get simulated predictions
function getSimulatedPredictions($pdo) {
    $users = $pdo->query("SELECT user_id, full_name, email, health_status FROM users WHERE is_active = 1 ORDER BY user_id LIMIT 15")->fetchAll(PDO::FETCH_ASSOC);
    
    $predictions = [];
    $predictionTypes = ['Blood Sugar', 'Weight', 'HbA1c', 'Health Status'];
    $timeframes = ['1 Week', '2 Weeks', '1 Month'];
    
    foreach (array_slice($users, 0, 10) as $user) {
        $type = $predictionTypes[array_rand($predictionTypes)];
        $predictions[] = [
            'prediction_id' => count($predictions) + 1,
            'user_id' => $user['user_id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'health_status' => $user['health_status'],
            'prediction_type' => $type,
            'prediction_timeframe' => $timeframes[array_rand($timeframes)],
            'predicted_value' => $type === 'Blood Sugar' ? rand(90, 180) : ($type === 'Weight' ? rand(60, 90) : rand(5, 10)),
            'confidence_score' => rand(75, 95),
            'prediction_date' => date('Y-m-d'),
            'target_date' => date('Y-m-d', strtotime('+' . rand(7, 30) . ' days')),
            'simulated' => true
        ];
    }
    
    return $predictions;
}

// Get active recommendations
function getActiveRecommendations($pdo) {
    $tablesExist = checkTablesExist($pdo);
    
    if (!$tablesExist) {
        echo json_encode(getSimulatedRecommendations($pdo));
        return;
    }
    
    $query = "
        SELECT 
            r.*,
            u.full_name,
            u.email,
            u.health_status
        FROM ai_recommendations r
        INNER JOIN users u ON r.user_id = u.user_id
        WHERE r.is_active = 1 
        AND (r.status = 'Pending' OR r.status = 'Sent' OR r.status = 'Viewed')
        ORDER BY 
            CASE r.priority
                WHEN 'Urgent' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                WHEN 'Low' THEN 4
            END,
            r.created_at DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get simulated recommendations
function getSimulatedRecommendations($pdo) {
    $users = $pdo->query("SELECT user_id, full_name, email, health_status FROM users WHERE is_active = 1 ORDER BY user_id LIMIT 15")->fetchAll(PDO::FETCH_ASSOC);
    
    $recommendations = [];
    $types = ['Dietary', 'Exercise', 'Monitoring', 'Lifestyle'];
    $priorities = ['Low', 'Medium', 'High', 'Urgent'];
    $statuses = ['Pending', 'Sent', 'Viewed'];
    
    $sampleRecs = [
        'Dietary' => 'Reduce sugar intake during evening meals',
        'Exercise' => 'Increase physical activity to 30 minutes daily',
        'Monitoring' => 'Check blood glucose before and after meals',
        'Lifestyle' => 'Improve sleep schedule to reduce stress'
    ];
    
    foreach (array_slice($users, 0, 12) as $user) {
        $type = $types[array_rand($types)];
        $recommendations[] = [
            'recommendation_id' => count($recommendations) + 1,
            'user_id' => $user['user_id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'health_status' => $user['health_status'],
            'recommendation_type' => $type,
            'recommendation_title' => $sampleRecs[$type],
            'recommendation_text' => 'Based on your recent health patterns, we recommend: ' . $sampleRecs[$type],
            'priority' => $priorities[array_rand($priorities)],
            'expected_impact' => 'May improve health metrics by 15-20%',
            'status' => $statuses[array_rand($statuses)],
            'valid_from' => date('Y-m-d'),
            'simulated' => true
        ];
    }
    
    return $recommendations;
}

// Get risk trends
function getRiskTrends($pdo) {
    $tablesExist = checkTablesExist($pdo);
    
    if (!$tablesExist) {
        echo json_encode(getSimulatedRiskTrends($pdo));
        return;
    }
    
    $query = "
        SELECT 
            assessment_date,
            COUNT(*) as total_assessments,
            AVG(overall_risk_score) as avg_risk_score,
            SUM(CASE WHEN risk_trend = 'Improving' THEN 1 ELSE 0 END) as improving_count,
            SUM(CASE WHEN risk_trend = 'Worsening' THEN 1 ELSE 0 END) as worsening_count,
            SUM(CASE WHEN risk_category = 'High' OR risk_category = 'Very High' OR risk_category = 'Critical' THEN 1 ELSE 0 END) as high_risk_count
        FROM risk_assessment_history
        WHERE assessment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY assessment_date
        ORDER BY assessment_date ASC
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get simulated risk trends
function getSimulatedRiskTrends($pdo) {
    $trends = [];
    for ($i = 29; $i >= 0; $i--) {
        $trends[] = [
            'assessment_date' => date('Y-m-d', strtotime("-$i days")),
            'total_assessments' => rand(20, 50),
            'avg_risk_score' => rand(3500, 5500) / 100,
            'improving_count' => rand(5, 15),
            'worsening_count' => rand(2, 10),
            'high_risk_count' => rand(3, 12),
            'simulated' => true
        ];
    }
    return $trends;
}

// Get insights for specific user
function getUserInsights($pdo, $userId) {
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        return;
    }
    
    // This would return personalized insights for a specific user
    // For now, return placeholder
    echo json_encode([
        'user_id' => $userId,
        'patterns' => [],
        'predictions' => [],
        'recommendations' => [],
        'risk_trend' => 'Stable',
        'message' => 'User-specific insights not yet implemented'
    ]);
}

// Check if predictive analytics tables exist
function checkTablesExist($pdo) {
    try {
        $pdo->query("SELECT 1 FROM user_health_patterns LIMIT 1");
        return true;
    } catch (PDOException $e) {
        return false;
    }
}
