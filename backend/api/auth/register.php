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

// Check if email field contains phone or email
$emailOrPhone = isset($data['email']) ? Security::sanitize($data['email']) : '';

// Determine if it's a phone number (starts with +60 or +6)
$isPhoneAuth = (strpos($emailOrPhone, '+60') === 0 || strpos($emailOrPhone, '+6') === 0);

$required = ['username', 'password', 'full_name'];
$errors = [];

foreach ($required as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        $errors[$field] = ucfirst($field) . " is required";
    }
}

// Validate email or phone
if ($isPhoneAuth) {
    // Phone number validation - Accept both +60 and +6 formats
    // +60123456789 (11 digits) or +6123456789 (10 digits)
    if (!preg_match('/^\+6(0)?[0-9]{8,10}$/', $emailOrPhone)) {
        $errors['email'] = "Invalid Malaysian phone number format. Expected +60xxxxxxxxx";
    }
    
    // Normalize to +60 format if it's +6
    if (strpos($emailOrPhone, '+60') !== 0) {
        $emailOrPhone = '+60' . substr($emailOrPhone, 2);
    }
    
    $phone_number = $emailOrPhone;
    $email = null;
} else {
    // Email validation
    if (!Security::validateEmail($emailOrPhone)) {
        $errors['email'] = "Invalid email format";
    }
    $email = $emailOrPhone;
    $phone_number = null;
}

// Validate password
if (isset($data['password']) && strlen($data['password']) < 8) {
    $errors['password'] = "Password must be at least 8 characters";
}

// Validate date of birth
if (isset($data['date_of_birth']) && !empty($data['date_of_birth'])) {
    $dob = DateTime::createFromFormat('Y-m-d', $data['date_of_birth']);
    if (!$dob) {
        $errors['date_of_birth'] = "Invalid date format";
    } else {
        $today = new DateTime();
        $age = $today->diff($dob)->y;
        if ($age < 13) {
            $errors['date_of_birth'] = "You must be at least 13 years old";
        }
    }
}

if (!empty($errors)) {
    Response::error("Validation failed", 400, $errors);
}

$username = Security::sanitize($data['username']);
$full_name = Security::sanitize($data['full_name']);
$date_of_birth = isset($data['date_of_birth']) ? $data['date_of_birth'] : null;
$auth_provider = $isPhoneAuth ? 'phone' : 'email';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    // Check if username exists
    $query = "SELECT id FROM users WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        Response::error("Username already taken", 400, ['username' => 'This username is already registered']);
    }

    // Check if email/phone exists
    if ($isPhoneAuth) {
        $query = "SELECT id FROM users WHERE phone_number = :phone";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':phone', $phone_number);
    } else {
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $email);
    }
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $field = $isPhoneAuth ? 'phone_number' : 'email';
        Response::error("Already registered", 400, [$field => 'This ' . ($isPhoneAuth ? 'phone number' : 'email') . ' is already registered']);
    }

    // Hash password
    $password_hash = Security::hashPassword($data['password']);

    // Insert user
    if ($isPhoneAuth) {
        $query = "INSERT INTO users (username, phone_number, password, full_name, date_of_birth, auth_provider) 
                  VALUES (:username, :phone, :password, :full_name, :date_of_birth, :auth_provider)";
    } else {
        $query = "INSERT INTO users (username, email, password, full_name, date_of_birth, auth_provider) 
                  VALUES (:username, :email, :password, :full_name, :date_of_birth, :auth_provider)";
    }
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $username);
    
    if ($isPhoneAuth) {
        $stmt->bindParam(':phone', $phone_number);
    } else {
        $stmt->bindParam(':email', $email);
    }
    
    $stmt->bindParam(':password', $password_hash);
    $stmt->bindParam(':full_name', $full_name);
    $stmt->bindParam(':date_of_birth', $date_of_birth);
    $stmt->bindParam(':auth_provider', $auth_provider);

    if ($stmt->execute()) {
        $user_id = $db->lastInsertId();

        Response::success([
            'user_id' => $user_id,
            'username' => $username,
            'email' => $isPhoneAuth ? null : $email,
            'phone_number' => $isPhoneAuth ? $phone_number : null,
            'full_name' => $full_name,
            'auth_provider' => $auth_provider
        ], "Registration successful", 201);
    } else {
        Response::serverError("Failed to create user");
    }

} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    Response::serverError("Registration failed");
}
?>