<?php
// iSCMS Admin Panel - Food Database Analytics API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();

try {
    $days = isset($_GET['days']) ? max(1, min(90, intval($_GET['days']))) : 7;

    // Total scans (food entries) in period
    $totalScansQuery = "
        SELECT COUNT(*) as total
        FROM food_entries
        WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ";
    $stmt = $conn->prepare($totalScansQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $totalScans = $stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    // Recognition method breakdown
    $methodQuery = "
        SELECT recognition_method, COUNT(*) as count
        FROM food_entries
        WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY recognition_method
        ORDER BY count DESC
    ";
    $stmt = $conn->prepare($methodQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $methodResult = $stmt->get_result();
    $methods = [];
    while ($row = $methodResult->fetch_assoc()) {
        $methods[] = $row;
    }
    $stmt->close();

    // Top scanned foods (by name from food_entries)
    $topFoodsQuery = "
        SELECT food_name, COUNT(*) as scans
        FROM food_entries
        WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY food_name
        ORDER BY scans DESC
        LIMIT 10
    ";
    $stmt = $conn->prepare($topFoodsQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $topFoodsResult = $stmt->get_result();
    $topFoods = [];
    while ($row = $topFoodsResult->fetch_assoc()) {
        $topFoods[] = $row;
    }
    $stmt->close();

    // High sugar items most frequently consumed (avg sugar_content_g * count, approximate impact)
    $highSugarQuery = "
        SELECT food_name,
               COUNT(*) as entries,
               AVG(COALESCE(sugar_content_g, 0)) as avg_sugar,
               SUM(COALESCE(sugar_content_g, 0)) as total_sugar
        FROM food_entries
        WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY food_name
        HAVING total_sugar > 0
        ORDER BY total_sugar DESC
        LIMIT 10
    ";
    $stmt = $conn->prepare($highSugarQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $hsResult = $stmt->get_result();
    $highSugar = [];
    while ($row = $hsResult->fetch_assoc()) {
        $row['avg_sugar'] = round((float)$row['avg_sugar'], 2);
        $row['total_sugar'] = round((float)$row['total_sugar'], 2);
        $highSugar[] = $row;
    }
    $stmt->close();

    // Food database overview
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

    // User-reported foods pending
    $pendingReportedQuery = "
        SELECT COUNT(*) as pending
        FROM user_reported_foods
        WHERE status = 'Pending'
    ";
    $pendingReported = $conn->query($pendingReportedQuery)->fetch_assoc()['pending'];

    $data = [
        'period_days' => $days,
        'total_scans' => (int)$totalScans,
        'recognition_methods' => $methods,
        'top_scanned_foods' => $topFoods,
        'high_sugar_consumption' => $highSugar,
        'food_database' => [
            'total_items' => (int)$foodDb['total_items'],
            'verified_items' => (int)$foodDb['verified_items'],
            'malaysian_items' => (int)$foodDb['malaysian_items'],
            'needs_review' => (int)$foodDb['needs_review'],
            'pending_user_reports' => (int)$pendingReported,
        ]
    ];

    logAudit($conn, 'View', 'food_database', null, 'Viewed food analytics');

    $conn->close();
    sendResponse(true, $data, 'Food analytics generated');
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
