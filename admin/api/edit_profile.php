<?php
// api/edit_profile.php
require_once '../config.php';

session_start();
if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_role'])) {
     echo json_encode([
        'success' => false,
        'message' => 'Authentication required.'
    ]);
    exit();
}
$admin_id = $_SESSION['admin_id'];
// $admin_role = $_SESSION['admin_role']; // Not strictly needed for this endpoint, but good to have

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

// Helper function to validate required fields
function validateRequiredEditProfile($data, $fields) {
    foreach ($fields as $field) {
        // Allow empty password if not intended to be changed
        if ($field === 'password') continue;
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            return false;
        }
    }
    return true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';

    if ($action === 'update_profile') {
        // Validate required fields (full_name is required, password is optional)
        if (!validateRequiredEditProfile($input, ['full_name'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Full Name is required.'
            ]);
            exit();
        }

        $full_name = trim($input['full_name']);
        $password = $input['password'] ?? ''; // Get password, might be empty

        // Start building the query
        $query = "UPDATE admin SET full_name = ?";
        $params = [$full_name];
        $types = "s";

        // If password is provided, hash it and add to the query
        if (!empty($password)) {
            if (strlen($password) < 6) {
                 echo json_encode([
                    'success' => false,
                    'message' => 'Password must be at least 6 characters long.'
                ]);
                exit();
            }
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $query .= ", password = ?"; // Append password update to query
            $params[] = $hashed_password; // Add hashed password to params
            $types .= "s"; // Add string type for password
        }

        $query .= " WHERE id = ?"; // Always update based on the logged-in user's ID
        $params[] = $admin_id; // Add user ID to params
        $types .= "i"; // Add integer type for ID

        $stmt = $conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param($types, ...$params);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    // Update successful in DB. Now, update the session data.
                    $_SESSION['admin_full_name'] = $full_name;
                    // Note: We don't update the password in the session, as it's not stored there.

                    echo json_encode([
                        'success' => true,
                        'message' => 'Profile updated successfully.',
                        'updated_user' => [
                            'id' => $admin_id,
                            'full_name' => $full_name,
                            // Don't send back the password
                        ]
                    ]);
                } else {
                    // This case might occur if no fields actually changed
                    echo json_encode([
                        'success' => true, // Technically not an error
                        'message' => 'No changes detected. Profile not updated.'
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating profile: ' . $conn->error
                ]);
            }
            $stmt->close();
        } else {
             echo json_encode([
                'success' => false,
                'message' => 'Error preparing statement: ' . $conn->error
            ]);
        }
    } else {
         echo json_encode([
            'success' => false,
            'message' => 'Invalid action specified.'
        ]);
    }
} else {
     echo json_encode([
        'success' => false,
        'message' => 'Invalid request method. Use POST.'
    ]);
}

$conn->close();
?>