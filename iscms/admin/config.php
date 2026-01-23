<?php
// iSCMS Admin Panel - Database Configuration
// Sugar Intake Monitoring System

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'iscms_db');

// Create database connection
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        die(json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]));
    }
    
    $conn->set_charset('utf8mb4');
    return $conn;
}

// CORS headers for API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper function to send JSON response
function sendResponse($success, $data = [], $message = '') {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// Helper function to validate required fields
function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            return false;
        }
    }
    return true;
}

// Helper function to sanitize input
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Session configuration
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
        session_start();
    }
}

// Check if user is logged in as admin
function checkAdminAuth() {
    startSecureSession();
    if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_email'])) {
        sendResponse(false, [], 'Unauthorized access. Please login.');
    }
}

// Check if user is superadmin
function checkSuperadminAuth() {
    checkAdminAuth();
    $role = $_SESSION['admin_role'] ?? '';
    if (strcasecmp($role, 'Superadmin') !== 0) {
        sendResponse(false, [], 'Unauthorized. Superadmin access required.');
    }
}

// Check if user has specific permission
function hasPermission($permissionKey) {
    startSecureSession();
    
    if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_role'])) {
        return false;
    }
    
    // Superadmin has all permissions
    if (strcasecmp($_SESSION['admin_role'], 'Superadmin') === 0) {
        return true;
    }
    
    // Check permission in session cache
    if (isset($_SESSION['permissions']) && in_array($permissionKey, $_SESSION['permissions'])) {
        return true;
    }
    
    return false;
}

// Check permission and send error if not authorized
function requirePermission($permissionKey) {
    if (!hasPermission($permissionKey)) {
        sendResponse(false, [], 'Unauthorized. You do not have permission to perform this action.');
    }
}

// Get admin's linked provider ID (if Healthcare Provider role)
function getAdminProviderId() {
    startSecureSession();
    
    if (!isset($_SESSION['admin_id'])) {
        return null;
    }
    
    // Return cached provider_id if available
    if (isset($_SESSION['provider_id'])) {
        return $_SESSION['provider_id'];
    }
    
    // Query database
    $conn = getDBConnection();
    $stmt = $conn->prepare("SELECT provider_id FROM admin_provider_mapping WHERE admin_id = ?");
    $stmt->bind_param("i", $_SESSION['admin_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $_SESSION['provider_id'] = $row['provider_id'];
        $stmt->close();
        $conn->close();
        return $row['provider_id'];
    }
    
    $stmt->close();
    $conn->close();
    return null;
}

// Load user permissions into session
function loadUserPermissions($adminId, $role) {
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("SELECT permission_key FROM admin_permissions WHERE role = ?");
    $stmt->bind_param("s", $role);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $permissions = [];
    while ($row = $result->fetch_assoc()) {
        $permissions[] = $row['permission_key'];
    }
    
    $stmt->close();
    $conn->close();
    
    $_SESSION['permissions'] = $permissions;
    return $permissions;
}

// Check if admin can access specific user/patient
function canAccessPatient($userId) {
    startSecureSession();
    
    $role = $_SESSION['admin_role'] ?? '';
    
    // Superadmin and Admin can access all patients
    if (in_array($role, ['Superadmin', 'Admin'])) {
        return true;
    }
    
    // Healthcare Provider can only access linked patients
    if ($role === 'Healthcare Provider') {
        $providerId = getAdminProviderId();
        if (!$providerId) {
            return false;
        }
        
        $conn = getDBConnection();
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM patient_provider_links 
            WHERE provider_id = ? AND user_id = ? AND is_active = 1
        ");
        $stmt->bind_param("ii", $providerId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        $stmt->close();
        $conn->close();
        
        return $row['count'] > 0;
    }
    
    return false;
}

// Log audit trail
function logAudit($conn, $actionType, $tableName = null, $recordId = null, $description = '', $oldValues = null, $newValues = null) {
    startSecureSession();
    
    $userId = $_SESSION['admin_id'] ?? null;
    $userType = 'Admin';
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $oldValuesJson = $oldValues ? json_encode($oldValues) : null;
    $newValuesJson = $newValues ? json_encode($newValues) : null;
    
    $stmt = $conn->prepare("
        INSERT INTO audit_logs 
        (user_type, user_id, action_type, table_name, record_id, action_description, ip_address, user_agent, old_values, new_values)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param(
        "sissssssss",
        $userType,
        $userId,
        $actionType,
        $tableName,
        $recordId,
        $description,
        $ipAddress,
        $userAgent,
        $oldValuesJson,
        $newValuesJson
    );
    
    $stmt->execute();
    $stmt->close();
}

// Generate secure random token
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

// Hash password
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

// Verify password
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}
?>
