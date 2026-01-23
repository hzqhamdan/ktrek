<?php
// AI Model Performance Analytics API
// Tracks food recognition accuracy and model performance

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
            getAIOverview($pdo);
            break;
            
        case 'accuracy_trends':
            getAccuracyTrends($pdo);
            break;
            
        case 'unrecognized_queue':
            getUnrecognizedQueue($pdo);
            break;
            
        case 'user_corrections':
            getUserCorrections($pdo);
            break;
            
        case 'model_performance':
            getModelPerformance($pdo);
            break;
            
        case 'recognition_methods':
            getRecognitionMethods($pdo);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

// Get AI Performance Overview
function getAIOverview($pdo) {
    // Check if AI tables exist, if not return simulated data based on food_entries
    $tableExists = false;
    try {
        $pdo->query("SELECT 1 FROM ai_recognition_logs LIMIT 1");
        $tableExists = true;
    } catch (PDOException $e) {
        $tableExists = false;
    }
    
    if (!$tableExists) {
        // Simulate AI metrics from food_entries table
        $overview = getSimulatedAIMetrics($pdo);
        echo json_encode($overview);
        return;
    }
    
    // Real AI metrics (if tables exist)
    $query = "
        SELECT 
            COUNT(*) as total_recognitions,
            SUM(CASE WHEN user_accepted = 1 THEN 1 ELSE 0 END) as accepted_count,
            SUM(CASE WHEN user_accepted = 0 THEN 1 ELSE 0 END) as rejected_count,
            SUM(CASE WHEN user_corrected_name IS NOT NULL THEN 1 ELSE 0 END) as corrected_count,
            AVG(confidence_score) as avg_confidence,
            AVG(processing_time_ms) as avg_processing_time,
            (SUM(CASE WHEN user_accepted = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100) as accuracy_rate
        FROM ai_recognition_logs
        WHERE recognition_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ";
    
    $overview = $pdo->query($query)->fetch(PDO::FETCH_ASSOC);
    
    // Get unrecognized items count
    $unrecognizedQuery = "SELECT COUNT(*) as count FROM unrecognized_items_queue WHERE reviewed = 0";
    $unrecognizedCount = $pdo->query($unrecognizedQuery)->fetchColumn();
    
    $overview['unrecognized_queue'] = $unrecognizedCount;
    
    echo json_encode($overview);
}

// Simulated AI metrics from food_entries (when AI tables don't exist)
function getSimulatedAIMetrics($pdo) {
    $query = "
        SELECT 
            COUNT(*) as total_entries,
            SUM(CASE WHEN recognition_method = 'AI Recognition' THEN 1 ELSE 0 END) as ai_recognitions,
            SUM(CASE WHEN recognition_method = 'Barcode Scan' THEN 1 ELSE 0 END) as barcode_scans,
            SUM(CASE WHEN recognition_method = 'Manual Entry' THEN 1 ELSE 0 END) as manual_entries
        FROM food_entries
        WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ";
    
    $data = $pdo->query($query)->fetch(PDO::FETCH_ASSOC);
    
    // Simulate metrics
    $aiCount = $data['ai_recognitions'];
    $totalCount = $data['total_entries'];
    
    // Simulate 85-95% accuracy for AI
    $simulatedAccuracy = rand(8500, 9500) / 100;
    $acceptedCount = round($aiCount * ($simulatedAccuracy / 100));
    $correctedCount = $aiCount - $acceptedCount;
    
    return [
        'total_recognitions' => $aiCount,
        'accepted_count' => $acceptedCount,
        'rejected_count' => 0,
        'corrected_count' => $correctedCount,
        'avg_confidence' => rand(8000, 9500) / 100,
        'avg_processing_time' => rand(800, 1500),
        'accuracy_rate' => $simulatedAccuracy,
        'unrecognized_queue' => rand(5, 15),
        'simulated' => true,
        'recognition_methods' => [
            'ai' => $data['ai_recognitions'],
            'barcode' => $data['barcode_scans'],
            'manual' => $data['manual_entries']
        ]
    ];
}

// Get accuracy trends over time
function getAccuracyTrends($pdo) {
    $tableExists = false;
    try {
        $pdo->query("SELECT 1 FROM ai_performance_metrics LIMIT 1");
        $tableExists = true;
    } catch (PDOException $e) {
        $tableExists = false;
    }
    
    if (!$tableExists) {
        // Simulate trend data
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $trends[] = [
                'metric_date' => $date,
                'accuracy_rate' => rand(8500, 9500) / 100,
                'total_recognitions' => rand(50, 200),
                'avg_confidence_score' => rand(8000, 9500) / 100
            ];
        }
        echo json_encode($trends);
        return;
    }
    
    $query = "
        SELECT 
            metric_date,
            accuracy_rate,
            total_recognitions,
            avg_confidence_score,
            avg_processing_time_ms
        FROM ai_performance_metrics
        WHERE metric_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ORDER BY metric_date ASC
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get unrecognized items queue
function getUnrecognizedQueue($pdo) {
    $tableExists = false;
    try {
        $pdo->query("SELECT 1 FROM unrecognized_items_queue LIMIT 1");
        $tableExists = true;
    } catch (PDOException $e) {
        $tableExists = false;
    }
    
    if (!$tableExists) {
        // Return simulated queue
        echo json_encode([
            [
                'queue_id' => 1,
                'user_name' => 'Sample User',
                'upload_datetime' => date('Y-m-d H:i:s', strtotime('-2 hours')),
                'ai_suggestion' => 'Unknown Malaysian Dish',
                'ai_confidence' => 45.5,
                'frequency_count' => 3,
                'priority' => 'High',
                'simulated' => true
            ],
            [
                'queue_id' => 2,
                'user_name' => 'Sample User 2',
                'upload_datetime' => date('Y-m-d H:i:s', strtotime('-1 day')),
                'ai_suggestion' => 'Unidentified Beverage',
                'ai_confidence' => 38.2,
                'frequency_count' => 1,
                'priority' => 'Medium',
                'simulated' => true
            ]
        ]);
        return;
    }
    
    $query = "
        SELECT 
            q.*,
            u.full_name as user_name,
            u.email as user_email
        FROM unrecognized_items_queue q
        INNER JOIN users u ON q.user_id = u.user_id
        WHERE q.reviewed = 0
        ORDER BY 
            CASE q.priority 
                WHEN 'High' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Low' THEN 3
            END,
            q.frequency_count DESC,
            q.upload_datetime DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get user corrections
function getUserCorrections($pdo) {
    $tableExists = false;
    try {
        $pdo->query("SELECT 1 FROM ai_recognition_logs LIMIT 1");
        $tableExists = true;
    } catch (PDOException $e) {
        $tableExists = false;
    }
    
    if (!$tableExists) {
        // Simulate corrections from food_entries
        $query = "
            SELECT 
                u.full_name as user_name,
                fe.food_name,
                fe.recognition_method,
                fe.entry_datetime,
                'N/A' as original_detection,
                'Simulated' as status
            FROM food_entries fe
            INNER JOIN users u ON fe.user_id = u.user_id
            WHERE fe.recognition_method = 'Manual Entry'
            AND fe.entry_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY fe.entry_datetime DESC
            LIMIT 20
        ";
        
        $stmt = $pdo->query($query);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as &$row) {
            $row['simulated'] = true;
        }
        echo json_encode($results);
        return;
    }
    
    $query = "
        SELECT 
            l.log_id,
            u.full_name as user_name,
            u.email as user_email,
            l.detected_food_name as ai_detected,
            l.user_corrected_name as user_correction,
            l.confidence_score,
            l.recognition_datetime,
            l.correction_datetime
        FROM ai_recognition_logs l
        INNER JOIN users u ON l.user_id = u.user_id
        WHERE l.user_corrected_name IS NOT NULL
        ORDER BY l.correction_datetime DESC
        LIMIT 50
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get model performance by version
function getModelPerformance($pdo) {
    $tableExists = false;
    try {
        $pdo->query("SELECT 1 FROM ai_recognition_logs LIMIT 1");
        $tableExists = true;
    } catch (PDOException $e) {
        $tableExists = false;
    }
    
    if (!$tableExists) {
        // Simulate model performance
        echo json_encode([
            [
                'model_version' => 'v2.1.0',
                'total_recognitions' => rand(1000, 2000),
                'accuracy_rate' => rand(8800, 9500) / 100,
                'avg_confidence' => rand(8500, 9200) / 100,
                'avg_processing_time' => rand(900, 1200),
                'simulated' => true
            ],
            [
                'model_version' => 'v2.0.5',
                'total_recognitions' => rand(500, 1000),
                'accuracy_rate' => rand(8500, 9000) / 100,
                'avg_confidence' => rand(8200, 8800) / 100,
                'avg_processing_time' => rand(1000, 1400),
                'simulated' => true
            ]
        ]);
        return;
    }
    
    $query = "
        SELECT 
            model_version,
            COUNT(*) as total_recognitions,
            (SUM(CASE WHEN user_accepted = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100) as accuracy_rate,
            AVG(confidence_score) as avg_confidence,
            AVG(processing_time_ms) as avg_processing_time
        FROM ai_recognition_logs
        WHERE recognition_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY model_version
        ORDER BY model_version DESC
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Get recognition methods breakdown
function getRecognitionMethods($pdo) {
    $query = "
        SELECT 
            CASE 
                WHEN recognition_method IS NULL OR recognition_method = '' OR TRIM(recognition_method) = '' 
                THEN 'AI Recognition'
                ELSE recognition_method
            END as recognition_method,
            COUNT(*) as count,
            (COUNT(*) / (SELECT COUNT(*) FROM food_entries WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)) * 100) as percentage
        FROM food_entries
        WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY recognition_method
        ORDER BY count DESC
    ";
    
    $stmt = $pdo->query($query);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
