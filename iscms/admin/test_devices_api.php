<?php
// Simple test script to check if devices API works
session_start();

// Simulate admin login for testing
$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_id'] = 1;

echo "<h2>Testing Devices API</h2>";

// Test 1: Include and check config
echo "<h3>Test 1: Config Check</h3>";
require_once 'config.php';
echo "Database: " . DB_NAME . "<br>";
echo "Host: " . DB_HOST . "<br><br>";

// Test 2: Check database connection
echo "<h3>Test 2: Database Connection</h3>";
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Database connected successfully<br><br>";
    
    // Test 3: Count devices
    echo "<h3>Test 3: Device Counts</h3>";
    $cgmCount = $pdo->query("SELECT COUNT(*) FROM cgm_devices WHERE is_active = 1")->fetchColumn();
    $scaleCount = $pdo->query("SELECT COUNT(*) FROM smart_scale_devices WHERE is_active = 1")->fetchColumn();
    echo "CGM Devices: $cgmCount<br>";
    echo "Smart Scales: $scaleCount<br><br>";
    
    // Test 4: Test the actual API query
    echo "<h3>Test 4: API Query (CGM Devices)</h3>";
    $cgmQuery = "
        SELECT 
            cd.device_id,
            'CGM' as device_type,
            cd.user_id,
            u.full_name,
            u.email,
            cd.device_name,
            cd.device_model,
            cd.connection_status,
            cd.battery_level
        FROM cgm_devices cd
        INNER JOIN users u ON cd.user_id = u.user_id
        WHERE cd.is_active = 1
        LIMIT 5
    ";
    $stmt = $pdo->query($cgmQuery);
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<pre>";
    print_r($devices);
    echo "</pre>";
    
    // Test 5: Test API Stats directly
    echo "<h3>Test 5: API Stats Response</h3>";
    
    // Get stats
    $cgmStatsQuery = "
        SELECT 
            COUNT(*) as total_cgm,
            SUM(CASE WHEN connection_status = 'Connected' THEN 1 ELSE 0 END) as cgm_connected,
            SUM(CASE WHEN connection_status = 'Disconnected' THEN 1 ELSE 0 END) as cgm_disconnected,
            SUM(CASE WHEN battery_level IS NOT NULL AND battery_level <= 20 THEN 1 ELSE 0 END) as cgm_low_battery,
            SUM(CASE WHEN sensor_days_remaining IS NOT NULL AND sensor_days_remaining <= 3 THEN 1 ELSE 0 END) as sensors_expiring_soon,
            AVG(battery_level) as avg_battery_level
        FROM cgm_devices
        WHERE is_active = 1
    ";
    
    $scaleStatsQuery = "
        SELECT 
            COUNT(*) as total_scales,
            SUM(CASE WHEN connection_status = 'Connected' THEN 1 ELSE 0 END) as scales_connected,
            SUM(CASE WHEN connection_status = 'Disconnected' THEN 1 ELSE 0 END) as scales_disconnected,
            SUM(CASE WHEN battery_level IS NOT NULL AND battery_level <= 20 THEN 1 ELSE 0 END) as scales_low_battery,
            AVG(battery_level) as avg_battery_level
        FROM smart_scale_devices
        WHERE is_active = 1
    ";
    
    $cgmStats = $pdo->query($cgmStatsQuery)->fetch(PDO::FETCH_ASSOC);
    $scaleStats = $pdo->query($scaleStatsQuery)->fetch(PDO::FETCH_ASSOC);
    
    echo "<strong>Stats that should appear on Device Management dashboard:</strong><br>";
    echo "Total CGM Devices: " . $cgmStats['total_cgm'] . "<br>";
    echo "CGM Connected: " . $cgmStats['cgm_connected'] . "<br>";
    echo "CGM Disconnected: " . $cgmStats['cgm_disconnected'] . "<br>";
    echo "CGM Low Battery: " . $cgmStats['cgm_low_battery'] . "<br>";
    echo "Sensors Expiring Soon: " . $cgmStats['sensors_expiring_soon'] . "<br>";
    echo "<br>";
    echo "Total Smart Scales: " . $scaleStats['total_scales'] . "<br>";
    echo "Scales Connected: " . $scaleStats['scales_connected'] . "<br>";
    echo "Scales Disconnected: " . $scaleStats['scales_disconnected'] . "<br>";
    echo "Scales Low Battery: " . $scaleStats['scales_low_battery'] . "<br>";
    
    echo "<br><h3>Test 6: Direct API Call</h3>";
    
    // Now actually call the API file
    $_GET['action'] = 'stats';
    ob_start();
    include 'api/devices.php';
    $apiOutput = ob_get_clean();
    
    echo "<strong>API Output:</strong><br>";
    echo "<pre>" . htmlspecialchars($apiOutput) . "</pre>";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

echo "<br><h3>Conclusion:</h3>";
echo "If you see device stats above, the backend works fine.<br>";
echo "The issue is likely with the JavaScript on the Device Management page.<br>";
echo "<strong>Next step: Check browser console for JavaScript errors when on Device Management page.</strong>";
?>
