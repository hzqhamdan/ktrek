<?php

// Use dynamic CORS configuration that supports any localhost port
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);
$identifier = isset($data['email']) ? Security::sanitize($data['email']) : '';

if (empty($identifier)) {
    Response::error("Validation failed", 400, ['email' => 'Email or phone number is required']);
}

// Determine if it's a phone number (starts with +60 or +6)
$isPhoneAuth = (strpos($identifier, '+60') === 0 || strpos($identifier, '+6') === 0);

if ($isPhoneAuth) {
    if (!preg_match('/^\+6(0)?[0-9]{8,10}$/', $identifier)) {
        Response::error("Validation failed", 400, ['email' => 'Invalid Malaysian phone number format. Expected +60xxxxxxxxx']);
    }

    // Normalize to +60 format if it's +6
    if (strpos($identifier, '+60') !== 0) {
        $identifier = '+60' . substr($identifier, 2);
    }
} else {
    if (!Security::validateEmail($identifier)) {
        Response::error("Validation failed", 400, ['email' => 'Invalid email format']);
    }
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    if ($isPhoneAuth) {
        $query = "SELECT id FROM users WHERE phone_number = :phone LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':phone', $identifier);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            Response::error("Already registered", 400, ['phone_number' => 'This phone number is already registered']);
        }
    } else {
        $query = "SELECT id FROM users WHERE email = :email LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $identifier);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            Response::error("Already registered", 400, ['email' => 'This email is already registered']);
        }
    }

    Response::success(['available' => true], 'Available', 200);
} catch (PDOException $e) {
    error_log("Check identifier error: " . $e->getMessage());
    Response::serverError("Check failed");
}
