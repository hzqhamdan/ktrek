<?php
// Use dynamic CORS configuration that supports any localhost port
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];

$full_name = isset($data['full_name']) ? Security::sanitize($data['full_name']) : null;
$phone_number = array_key_exists('phone_number', $data) ? Security::sanitize($data['phone_number']) : null;
$date_of_birth = array_key_exists('date_of_birth', $data) ? Security::sanitize($data['date_of_birth']) : null;

if ($full_name !== null && $full_name === '') {
    Response::error('Full name cannot be empty', 400);
}

// Basic date format guard (YYYY-MM-DD)
if ($date_of_birth !== null && $date_of_birth !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_of_birth)) {
    Response::error('Invalid date_of_birth format. Expected YYYY-MM-DD', 400);
}

$database = new Database();
$db = $database->getConnection();
if (!$db) {
    Response::serverError('Database connection failed');
}

$auth = new AuthMiddleware($db);
$user = $auth->requireAuth();

// Build dynamic update list (only allow specific fields)
$fields = [];
$params = [':user_id' => $user['id']];

if ($full_name !== null) {
    $fields[] = 'full_name = :full_name';
    $params[':full_name'] = $full_name;
}
if ($phone_number !== null) {
    // Allow clearing phone by sending empty string
    $fields[] = 'phone_number = :phone_number';
    $params[':phone_number'] = ($phone_number === '') ? null : $phone_number;
}
if ($date_of_birth !== null) {
    // Allow clearing dob by sending empty string
    $fields[] = 'date_of_birth = :date_of_birth';
    $params[':date_of_birth'] = ($date_of_birth === '') ? null : $date_of_birth;
}

if (count($fields) === 0) {
    Response::error('No fields to update', 400);
}

try {
    $query = 'UPDATE users SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :user_id';
    $stmt = $db->prepare($query);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->execute();

    $fetch = $db->prepare('SELECT id, username, email, phone_number, full_name, date_of_birth, profile_picture, avatar_style, avatar_seed, auth_provider FROM users WHERE id = :user_id LIMIT 1');
    $fetch->bindParam(':user_id', $user['id']);
    $fetch->execute();
    $updated = $fetch->fetch(PDO::FETCH_ASSOC);

    Response::success(['user' => $updated], 'Profile updated');
} catch (PDOException $e) {
    error_log('Update profile error: ' . $e->getMessage());
    Response::serverError('Failed to update profile');
}
?>
