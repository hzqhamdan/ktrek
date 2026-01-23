<?php
// Direct test of the food_analytics.php API without authentication
// This bypasses the admin auth to see what data the API is actually returning

require_once '../config.php';

// Bypass auth for testing
// checkAdminAuth();

$conn = getDBConnection();

echo "=== TESTING FOOD ANALYTICS API ===\n\n";

try {
    $days = 7;

    // Total scans (food entries) in period
    echo "1. CHECKING TOTAL SCANS (food_entries):\n";
    $totalScansQuery = "
        SELECT COUNT(*) as total
        FROM food_entries
        WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ";
    $stmt = $conn->prepare($totalScansQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $totalScans = $stmt->get_result()->fetch_assoc()['total'];
    echo "   Total Scans: $totalScans\n\n";
    $stmt->close();

    // Food database overview
    echo "2. CHECKING FOOD DATABASE:\n";
    $foodDbQuery = "
        SELECT
            COUNT(*) as total_items,
            SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_items,
            SUM(CASE WHEN is_malaysian_food = 1 THEN 1 ELSE 0 END) as malaysian_items,
            SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) as needs_review
        FROM food_database
        WHERE (is_active = 1 OR is_active IS NULL)
    ";
    $foodDb = $conn->query($foodDbQuery)->fetch_assoc();
    
    echo "   Total Items: " . ($foodDb['total_items'] ?? 'NULL') . "\n";
    echo "   Verified Items: " . ($foodDb['verified_items'] ?? 'NULL') . "\n";
    echo "   Malaysian Items: " . ($foodDb['malaysian_items'] ?? 'NULL') . "\n";
    echo "   Needs Review: " . ($foodDb['needs_review'] ?? 'NULL') . "\n\n";

    // User-reported foods pending
    echo "3. CHECKING USER REPORTED FOODS:\n";
    $pendingReportedQuery = "
        SELECT COUNT(*) as pending
        FROM user_reported_foods
        WHERE status = 'Pending'
    ";
    $result = $conn->query($pendingReportedQuery);
    if ($result) {
        $pendingReported = $result->fetch_assoc()['pending'];
        echo "   Pending Reports: $pendingReported\n\n";
    } else {
        echo "   ERROR: user_reported_foods table might not exist\n\n";
    }

    // Build the complete data structure
    echo "4. COMPLETE DATA STRUCTURE:\n";
    $data = [
        'period_days' => $days,
        'total_scans' => (int)$totalScans,
        'food_database' => [
            'total_items' => (int)$foodDb['total_items'],
            'verified_items' => (int)$foodDb['verified_items'],
            'malaysian_items' => (int)$foodDb['malaysian_items'],
            'needs_review' => (int)$foodDb['needs_review'],
            'pending_user_reports' => isset($pendingReported) ? (int)$pendingReported : 0,
        ]
    ];
    
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n\n";

    // Test the actual API endpoint
    echo "5. TESTING ACTUAL API ENDPOINT:\n";
    echo "   URL: /admin/api/food_analytics.php\n";
    echo "   Try accessing it directly in your browser while logged in\n\n";

    $conn->close();
    
    echo "=== TEST COMPLETE ===\n";
    echo "\nIf all numbers show 0 or NULL, the food_database table is empty.\n";
    echo "Run: mysql -u root -p iscms_db < admin/sample_food_database.sql\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    $conn->close();
}
?>
