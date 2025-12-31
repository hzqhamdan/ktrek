<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || empty(trim($data['email']))) {
    Response::error("Email is required", 400);
}

$email = Security::sanitize($data['email']);

// Validate email format
if (!Security::validateEmail($email)) {
    Response::error("Invalid email format", 400);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    // Check if verification_codes table exists, if not create it
    $createTableQuery = "CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_code (code)
    )";
    $db->exec($createTableQuery);

    // Generate 6-digit verification code
    $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Set expiration time (10 minutes from now)
    $expires_at = date('Y-m-d H:i:s', time() + 600);

    // Delete any existing unused codes for this email
    $deleteQuery = "DELETE FROM verification_codes WHERE email = :email AND is_used = FALSE";
    $stmt = $db->prepare($deleteQuery);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    // Insert new verification code
    $insertQuery = "INSERT INTO verification_codes (email, code, expires_at) 
                    VALUES (:email, :code, :expires_at)";
    $stmt = $db->prepare($insertQuery);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':code', $code);
    $stmt->bindParam(':expires_at', $expires_at);
    
    if ($stmt->execute()) {
        // In production, send this code via email
        // For now, we'll return it in the response for testing
        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        
        error_log("Verification code for {$email}: {$code}");
        
        Response::success([
            'email' => $email,
            'code' => $code, // Remove this in production!
            'expires_in' => 600, // 10 minutes in seconds
            'message' => 'Verification code sent successfully'
        ], "Code sent to {$email}");
    } else {
        Response::serverError("Failed to generate verification code");
    }

} catch (PDOException $e) {
    error_log("Send verification code error: " . $e->getMessage());
    Response::serverError("Failed to send verification code");
}
?>
