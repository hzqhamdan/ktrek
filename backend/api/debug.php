<?php
// backend/api/debug.php

// Debug: Log raw headers
error_log("DEBUG PROBE: " . print_r(getallheaders(), true));

// Manually apply CORS for diagnostics
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'CORS Debug Probe',
    'received_origin' => $origin,
    'server_time' => date('Y-m-d H:i:s')
]);
?>
