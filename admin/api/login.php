<?php
// api/login.php
require_once '../config.php';

function ktrek_column_exists(mysqli $conn, string $table, string $column): bool {
    // NOTE: Some MariaDB/MySQL setups don't allow placeholders with SHOW COLUMNS.
    // Use a safely escaped direct query instead.
    $tableEsc = $conn->real_escape_string($table);
    $colEsc = $conn->real_escape_string($column);
    $sql = "SHOW COLUMNS FROM `{$tableEsc}` LIKE '{$colEsc}'";
    $res = $conn->query($sql);
    return $res && $res->num_rows > 0;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate input
    if (!isset($input['email']) || !isset($input['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Email and password are required'
        ]);
        exit();
    }

    $email = trim($input['email']);
    $password = $input['password'];

    $conn = getDBConnection();

    // Backward-compatible select: status/last_login may not exist if DB updates haven't been run yet.
    $has_status = ktrek_column_exists($conn, 'admin', 'status');
    $has_last_login = ktrek_column_exists($conn, 'admin', 'last_login');

    $select = "SELECT id, email, password, full_name, role, is_active";
    if ($has_status) $select .= ", status";
    if ($has_last_login) $select .= ", last_login";
    $select .= " FROM admin WHERE email = ?";

    $stmt = $conn->prepare($select);
    if ($stmt) {
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $admin = $result->fetch_assoc();

            // Check if account is active
            // If `status` column exists, enforce it (suspended/deactivated).
            if (isset($admin['status']) && $admin['status'] !== 'active') {
                echo json_encode([
                    'success' => false,
                    'message' => 'Account is ' . $admin['status'] . '. Contact administrator.'
                ]);
                $stmt->close();
                $conn->close();
                exit();
            }
            if (!$admin['is_active']) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Account is deactivated or pending approval. Contact administrator.'
                ]);
                $stmt->close();
                $conn->close();
                exit();
            }

            // Verify password
            if (password_verify($password, $admin['password'])) {
                // Start session (or resume existing session)
                if (session_status() == PHP_SESSION_NONE) {
                    session_start();
                }

                // Update last_login (best-effort; only if column exists)
                if ($has_last_login) {
                    $updateStmt = $conn->prepare("UPDATE admin SET last_login = NOW() WHERE id = ?");
                    if ($updateStmt) {
                        $updateStmt->bind_param("i", $admin['id']);
                        $updateStmt->execute();
                        $updateStmt->close();
                    }
                }

                // Store user details in session - CRITICAL: Store role (attraction_id is gone)
                $_SESSION['admin_id'] = $admin['id'];
                $_SESSION['admin_email'] = $admin['email'];
                $_SESSION['admin_full_name'] = $admin['full_name'];
                $_SESSION['admin_role'] = $admin['role']; // Store role in session - CRITICAL
                // $_SESSION['admin_attraction_id'] = $admin['attraction_id']; // REMOVED: No longer stored in session from admin table

                // Send successful login response - CRITICAL: Include role (and other necessary fields), but NOT attraction_id
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => [
                        'id' => $admin['id'],
                        'email' => $admin['email'],
                        'full_name' => $admin['full_name'],
                        'role' => $admin['role'], // Include role in response - CRITICAL
                        'status' => $admin['status'] ?? null,
                        'last_login' => $admin['last_login'] ?? null,
                        // 'attraction_id' => $admin['attraction_id'], // REMOVED: No longer sent from admin table
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
        }

        $stmt->close();
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error preparing statement: ' . $conn->error
        ]);
    }

    $conn->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>