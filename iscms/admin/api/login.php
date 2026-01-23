<?php
// iSCMS Admin Panel - Login API
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, [], 'Invalid request method');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!validateRequired($input, ['email', 'password'])) {
    sendResponse(false, [], 'Email and password are required');
}

$email = sanitizeInput($input['email']);
$password = $input['password'];

$conn = getDBConnection();

// Check if admin exists
$stmt = $conn->prepare("SELECT admin_id, email, password_hash, full_name, role, avatar_url, is_active FROM admin_users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    $conn->close();
    sendResponse(false, [], 'Invalid email or password');
}

$admin = $result->fetch_assoc();
$stmt->close();

// Check if account is active
if (!$admin['is_active']) {
    $conn->close();
    sendResponse(false, [], 'Account is deactivated. Please contact administrator.');
}

// Verify password
if (!verifyPassword($password, $admin['password_hash'])) {
    $conn->close();
    sendResponse(false, [], 'Invalid email or password');
}

// Update last login
$updateStmt = $conn->prepare("UPDATE admin_users SET last_login = NOW() WHERE admin_id = ?");
$updateStmt->bind_param("i", $admin['admin_id']);
$updateStmt->execute();
$updateStmt->close();

// Start session and store admin data
startSecureSession();
$_SESSION['admin_id'] = $admin['admin_id'];
$_SESSION['admin_email'] = $admin['email'];
$_SESSION['admin_full_name'] = $admin['full_name'];
$_SESSION['admin_role'] = $admin['role'];
$_SESSION['admin_avatar_url'] = $admin['avatar_url'];

// Load user permissions
loadUserPermissions($admin['admin_id'], $admin['role']);

// If Healthcare Provider, load provider_id
$providerId = null;
if ($admin['role'] === 'Healthcare Provider') {
    $providerStmt = $conn->prepare("SELECT provider_id FROM admin_provider_mapping WHERE admin_id = ?");
    $providerStmt->bind_param("i", $admin['admin_id']);
    $providerStmt->execute();
    $providerResult = $providerStmt->get_result();
    if ($providerRow = $providerResult->fetch_assoc()) {
        $_SESSION['provider_id'] = $providerRow['provider_id'];
        $providerId = $providerRow['provider_id'];
    }
    $providerStmt->close();
}

// Log the login
logAudit($conn, 'Login', 'admin_users', $admin['admin_id'], 'Admin logged in');

$conn->close();

sendResponse(true, [
    'admin_id' => $admin['admin_id'],
    'email' => $admin['email'],
    'full_name' => $admin['full_name'],
    'role' => $admin['role'],
    'provider_id' => $providerId,
    'permissions' => $_SESSION['permissions']
], 'Login successful');
?>
