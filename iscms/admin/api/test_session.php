<?php
// Test session for debugging
session_start();

header('Content-Type: application/json');

echo json_encode([
    'session_id' => session_id(),
    'admin_logged_in' => $_SESSION['admin_logged_in'] ?? 'NOT SET',
    'admin_id' => $_SESSION['admin_id'] ?? 'NOT SET',
    'all_session_vars' => $_SESSION,
    'cookie' => $_COOKIE
]);
