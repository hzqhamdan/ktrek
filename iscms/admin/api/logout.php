<?php
// iSCMS Admin Panel - Logout API
require_once '../config.php';

header('Content-Type: application/json');

startSecureSession();

if (isset($_SESSION['admin_id'])) {
    $conn = getDBConnection();
    logAudit($conn, 'Logout', 'admin_users', $_SESSION['admin_id'], 'Admin logged out');
    $conn->close();
}

// Destroy session
session_unset();
session_destroy();

sendResponse(true, [], 'Logout successful');
?>
