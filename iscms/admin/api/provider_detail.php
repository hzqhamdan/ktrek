<?php
// iSCMS Admin Panel - Healthcare Provider Detail API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, [], 'Method not allowed');
}

$providerId = isset($_GET['provider_id']) ? intval($_GET['provider_id']) : 0;
if (!$providerId) {
    sendResponse(false, [], 'Provider ID is required');
}

try {
    // Provider info
    $providerQuery = "
        SELECT provider_id, email, full_name, license_number, specialization,
               hospital_clinic, phone_number, is_verified, is_active, verification_date, created_at
        FROM healthcare_providers
        WHERE provider_id = ?
    ";
    $stmt = $conn->prepare($providerQuery);
    $stmt->bind_param('i', $providerId);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        $stmt->close();
        $conn->close();
        sendResponse(false, [], 'Provider not found');
    }

    $provider = $res->fetch_assoc();
    $stmt->close();

    // Linked patients
    $patientsQuery = "
        SELECT 
            ppl.link_id,
            ppl.user_id,
            u.full_name,
            u.health_status,
            u.state,
            u.city,
            ppl.consent_given,
            ppl.access_level,
            ppl.consent_date,
            ppl.created_at as linked_at,
            u.last_active
        FROM patient_provider_links ppl
        JOIN users u ON ppl.user_id = u.user_id
        WHERE ppl.provider_id = ? AND ppl.is_active = 1
        ORDER BY ppl.created_at DESC
    ";
    $stmt = $conn->prepare($patientsQuery);
    $stmt->bind_param('i', $providerId);
    $stmt->execute();
    $result = $stmt->get_result();
    $patients = [];
    while ($row = $result->fetch_assoc()) {
        $patients[] = $row;
    }
    $stmt->close();

    // Patient stats (aggregate for linked patients over last 7 days)
    $stats = [
        'linked_patients' => count($patients),
        'consented_patients' => count(array_filter($patients, fn($p) => (int)$p['consent_given'] === 1)),
    ];

    if (count($patients) > 0) {
        $patientIds = array_map(fn($p) => (int)$p['user_id'], $patients);
        $placeholders = implode(',', array_fill(0, count($patientIds), '?'));
        $types = str_repeat('i', count($patientIds));

        // Average sugar across linked patients (last 7 days)
        $sugarQuery = "
            SELECT AVG(total_sugar_g) as avg_sugar
            FROM sugar_intake_logs
            WHERE user_id IN ($placeholders)
              AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ";
        $stmt = $conn->prepare($sugarQuery);
        $stmt->bind_param($types, ...$patientIds);
        $stmt->execute();
        $avgSugar = $stmt->get_result()->fetch_assoc()['avg_sugar'];
        $stmt->close();

        // Count high/critical glucose readings (last 7 days)
        $glucoseQuery = "
            SELECT COUNT(*) as spikes
            FROM glucose_readings
            WHERE user_id IN ($placeholders)
              AND reading_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND status IN ('High','Critical')
        ";
        $stmt = $conn->prepare($glucoseQuery);
        $stmt->bind_param($types, ...$patientIds);
        $stmt->execute();
        $spikes = (int)$stmt->get_result()->fetch_assoc()['spikes'];
        $stmt->close();

        $stats['avg_patient_sugar_7d'] = $avgSugar ? round((float)$avgSugar, 1) : 0;
        $stats['glucose_spikes_7d'] = $spikes;
    } else {
        $stats['avg_patient_sugar_7d'] = 0;
        $stats['glucose_spikes_7d'] = 0;
    }

    $data = [
        'provider' => $provider,
        'stats' => $stats,
        'patients' => $patients,
    ];

    logAudit($conn, 'View', 'healthcare_providers', $providerId, 'Viewed provider details');

    $conn->close();
    sendResponse(true, $data, 'Provider details retrieved successfully');

} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
