<?php
// register.php
// Start output buffering to catch any errors
ob_start();

// Set error handler to catch fatal errors and return JSON
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Server error: ' . htmlspecialchars($error['message'], ENT_QUOTES, 'UTF-8')
        ]);
        exit();
    }
});

require_once '../config.php';

// Clean any output that might have been generated
ob_clean();

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate required fields
    if (!validateRequired($input, ['email', 'password', 'full_name'])) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Email, password and full name are required.'
        ]);
        exit();
    }

    $email = trim($input['email']);
    $password = $input['password'];
    $full_name = trim($input['full_name']);

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
        ]);
        exit();
    }

    // Validate password length
    if (strlen($password) < 6) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Password must be at least 6 characters long'
        ]);
        exit();
    }

    // For admin registration via this form, always assign 'manager' role
    $role = 'manager'; // Automatically set role

    // Get database connection (getDBConnection uses die() on error, so no try-catch needed)
    $conn = getDBConnection();

    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM admin WHERE email = ?");
    if (!$stmt) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $conn->error
        ]);
        $conn->close();
        exit();
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Email already registered'
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }
    $stmt->close();

    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Managers are now active by default (is_active = 1)
    $is_active = 1; // Always active upon registration

    // Insert new admin/manager (without attraction_id since column doesn't exist in actual DB)
    $stmt = $conn->prepare("INSERT INTO admin (email, password, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $conn->error
        ]);
        $conn->close();
        exit();
    }
    
    $stmt->bind_param("ssssi", $email, $hashed_password, $full_name, $role, $is_active);

    if ($stmt->execute()) {
        $message = ($role === 'manager')
            ? 'Registration successful! You can now log in.' // Updated message
            : 'Registration successful!'; // Less likely for this form

        ob_end_clean();
        echo json_encode([
            'success' => true,
            'message' => $message,
            'user_id' => $conn->insert_id,
            'needs_approval' => false // No approval needed anymore
        ]);
    } else {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Registration failed: ' . $conn->error
        ]);
    }

    $stmt->close();
    $conn->close();
} else {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}

// End output buffering if still active
if (ob_get_level() > 0) {
    ob_end_flush();
}
?>