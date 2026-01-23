<?php
// iSCMS Admin Panel - Glucose Population Analytics API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();

try {
    $days = isset($_GET['days']) ? max(1, min(90, intval($_GET['days']))) : 7;

    // Total readings
    $totalQuery = "
        SELECT COUNT(*) as total
        FROM glucose_readings
        WHERE reading_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ";
    $stmt = $conn->prepare($totalQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $totalReadings = (int)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    // Average glucose
    $avgQuery = "
        SELECT AVG(glucose_level) as avg_glucose
        FROM glucose_readings
        WHERE reading_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ";
    $stmt = $conn->prepare($avgQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $avgGlucose = $stmt->get_result()->fetch_assoc()['avg_glucose'];
    $stmt->close();

    // Status breakdown
    $statusQuery = "
        SELECT status, COUNT(*) as count
        FROM glucose_readings
        WHERE reading_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY status
        ORDER BY count DESC
    ";
    $stmt = $conn->prepare($statusQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $statusResult = $stmt->get_result();
    $statusBreakdown = [];
    while ($row = $statusResult->fetch_assoc()) {
        $statusBreakdown[] = $row;
    }
    $stmt->close();

    // High/Critical spikes (top 10)
    $spikesQuery = "
        SELECT gr.user_id, u.full_name, gr.glucose_level, gr.unit, gr.status, gr.reading_datetime
        FROM glucose_readings gr
        JOIN users u ON gr.user_id = u.user_id
        WHERE gr.reading_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND gr.status IN ('High','Critical')
        ORDER BY gr.glucose_level DESC, gr.reading_datetime DESC
        LIMIT 10
    ";
    $stmt = $conn->prepare($spikesQuery);
    $stmt->bind_param('i', $days);
    $stmt->execute();
    $spikeResult = $stmt->get_result();
    $topSpikes = [];
    while ($row = $spikeResult->fetch_assoc()) {
        $topSpikes[] = $row;
    }
    $stmt->close();

    // CGM coverage
    $cgmUsersQuery = "
        SELECT COUNT(DISTINCT user_id) as cgm_users
        FROM cgm_devices
        WHERE is_active = 1
    ";
    $cgmUsers = (int)$conn->query($cgmUsersQuery)->fetch_assoc()['cgm_users'];

    // Active devices
    $activeDevicesQuery = "
        SELECT COUNT(*) as connected
        FROM cgm_devices
        WHERE is_active = 1 AND connection_status = 'Connected'
    ";
    $connectedDevices = (int)$conn->query($activeDevicesQuery)->fetch_assoc()['connected'];

    $data = [
        'period_days' => $days,
        'total_readings' => $totalReadings,
        'avg_glucose' => $avgGlucose ? round((float)$avgGlucose, 1) : 0,
        'unit' => 'mg/dL',
        'status_breakdown' => $statusBreakdown,
        'top_spikes' => $topSpikes,
        'cgm_users' => $cgmUsers,
        'connected_devices' => $connectedDevices,
    ];

    logAudit($conn, 'View', 'glucose_readings', null, 'Viewed glucose population analytics');

    $conn->close();
    sendResponse(true, $data, 'Glucose analytics generated');
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
