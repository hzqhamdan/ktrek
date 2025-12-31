<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/constants.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);

// Required fields for new user registration after email verification
$required = ['email', 'username', 'full_name', 'password'];
$errors = [];

foreach ($required as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        $errors[$field] = ucfirst($field) . " is required";
    }
}

if (!empty($errors)) {
    Response::error("Validation failed", 400, $errors);
}

$email = Security::sanitize($data['email']);
$username = Security::sanitize($data['username']);
$full_name = Security::sanitize($data['full_name']);
$password = $data['password'];
$date_of_birth = isset($data['date_of_birth']) ? $data['date_of_birth'] : null;

// Validate email
if (!Security::validateEmail($email)) {
    $errors['email'] = "Invalid email format";
}

// Validate password
if (strlen($password) < 8) {
    $errors['password'] = "Password must be at least 8 characters";
}

// Validate date of birth if provided
if ($date_of_birth) {
    $dob = DateTime::createFromFormat('Y-m-d', $date_of_birth);
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

    // Check if email exists
    $query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        Response::error("Email already registered", 400, ['email' => 'This email is already registered']);
    }

    // Hash password
    $password_hash = Security::hashPassword($password);

    // Insert user
    $query = "INSERT INTO users (username, email, password, full_name, date_of_birth, auth_provider) 
              VALUES (:username, :email, :password, :full_name, :date_of_birth, 'email')";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $password_hash);
    $stmt->bindParam(':full_name', $full_name);
    $stmt->bindParam(':date_of_birth', $date_of_birth);

    if ($stmt->execute()) {
        $user_id = $db->lastInsertId();

        // Generate session token
        $session_token = Security::generateSessionToken();
        $expires_at = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);

        // Create session
        try {
            $sessionQuery = "INSERT INTO sessions (user_id, token, expires_at) 
                           VALUES (:user_id, :token, :expires)";
            
            $stmt = $db->prepare($sessionQuery);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':token', $session_token);
            $stmt->bindParam(':expires', $expires_at);
            $stmt->execute();
        } catch (PDOException $sessionError) {
            error_log("Session creation warning: " . $sessionError->getMessage());
        }

        Response::success([
            'token' => $session_token,
            'expires_at' => $expires_at,
            'user' => [
                'id' => $user_id,
                'username' => $username,
                'email' => $email,
                'full_name' => $full_name,
                'auth_provider' => 'email'
            ]
        ], "Registration successful", 201);
    } else {
        Response::serverError("Failed to create user");
    }

} catch (PDOException $e) {
    error_log("Complete registration error: " . $e->getMessage());
    Response::serverError("Registration failed");
}
?>
