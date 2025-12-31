<?php
// admin_users.php - FIXED VERSION (No attraction_id reference)
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

// Check if user is logged in and is a superadmin
session_start();
if (!isset($_SESSION['admin_id']) || $_SESSION['admin_role'] !== 'superadmin') {
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Only super administrators can access this resource.'
    ]);
    exit();
}

$admin_id = $_SESSION['admin_id'];
$admin_role = $_SESSION['admin_role'];

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

// GET - List all admin users (excluding the current superadmin)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Get the current superadmin's ID to exclude from the list
        $current_admin_id = $_SESSION['admin_id'];

        $has_status = ktrek_column_exists($conn, 'admin', 'status');
        $has_last_login = ktrek_column_exists($conn, 'admin', 'last_login');

        $select = "SELECT a.id, a.email, a.full_name, a.role, a.is_active";
        if ($has_status) $select .= ", a.status";
        if ($has_last_login) $select .= ", a.last_login";
        $select .= ", a.created_at, a.attraction_id, COALESCE(at.name, 'No Attraction Assigned') AS attraction_name";

        // Query to list all other admin users with attraction information
        $query = "\n            {$select}\n            FROM admin a\n            LEFT JOIN attractions at ON a.attraction_id = at.id\n            WHERE a.id != ?\n            ORDER BY a.role DESC, a.created_at DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            $stmt->bind_param("i", $current_admin_id); // Bind the current admin ID to exclude
            $stmt->execute();
            $result = $stmt->get_result();
            $admins = [];

            while ($row = $result->fetch_assoc()) {
                $admins[] = $row;
            }

            echo json_encode([
                'success' => true,
                'admins' => $admins
            ]);
            $stmt->close();
        } else {
             echo json_encode([
                'success' => false,
                'message' => 'Error preparing statement: ' . $conn->error
            ]);
        }
    }
    // Note: You might want to add a 'get' action for single user details later if needed for editing
    // elseif ($action === 'get' && isset($_GET['id'])) { ... }
    else {
         echo json_encode([
            'success' => false,
            'message' => 'Invalid action for GET request.'
        ]);
    }
}
// POST - Toggle status, update details (removed attraction assignment), or delete admin
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';

    // Toggle active status
    if ($action === 'toggle_status') {
        if (!isset($input['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID is required'
            ]);
            exit();
        }

        $target_id = (int)$input['id']; // Cast to int for safety
        $current_admin_id = $_SESSION['admin_id'];

        // Prevent superadmin from changing their own status
        if ($current_admin_id == $target_id) {
            echo json_encode([
                'success' => false,
                'message' => 'You cannot change your own active status.'
            ]);
            exit();
        }

        $stmt = $conn->prepare("UPDATE admin SET is_active = NOT is_active WHERE id = ?");
        $stmt->bind_param("i", $target_id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Status updated successfully'
                ]);
            } else {
                // Could mean the user wasn't found
                echo json_encode([
                    'success' => false,
                    'message' => 'Admin user not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error updating status: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Update admin details (e.g., change role - REMOVED attraction assignment)
    elseif ($action === 'update') {
        if (!isset($input['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID is required'
            ]);
            exit();
        }

        $target_id = (int)$input['id']; // Cast to int for safety
        $current_admin_id = $_SESSION['admin_id'];

        // *** REMOVED attraction_id logic ***
        // $new_attraction_id = isset($input['attraction_id']) && $input['attraction_id'] !== '' ? (int)$input['attraction_id'] : null;
        // $update_stmt = $conn->prepare("UPDATE admin SET attraction_id = ? WHERE id = ?"); // This line is removed
        // $update_stmt->bind_param("ii", $new_attraction_id, $target_id); // This line is removed
        // *** END REMOVED logic ***

        // Example: Update role (be very careful with this logic in production)
        // You might want to add more specific fields to update based on the request payload.
        $new_role = $input['role'] ?? null;
        if ($new_role && in_array($new_role, ['superadmin', 'manager'])) { // Validate role
             // Prevent demoting self
             if ($current_admin_id == $target_id && $new_role !== $admin_role) {
                 echo json_encode([
                    'success' => false,
                    'message' => 'You cannot change your own role.'
                ]);
                exit();
             }
             $update_stmt = $conn->prepare("UPDATE admin SET role = ? WHERE id = ?");
             $update_stmt->bind_param("si", $new_role, $target_id);
        } else {
             // If no valid update field is provided, or if attraction_id was intended but is gone, return an error
             echo json_encode([
                'success' => false,
                'message' => 'No valid field to update provided (e.g., role). Attraction assignment is no longer supported.'
            ]);
            exit();
        }


        if ($update_stmt->execute()) {
            if ($update_stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Admin details updated successfully'
                ]);
            } else {
                // Could mean the user wasn't found
                echo json_encode([
                    'success' => false,
                    'message' => 'Admin user not found or no changes made.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error updating admin details: ' . $conn->error
            ]);
        }
        $update_stmt->close();
    }
    // Delete admin user
    elseif ($action === 'delete') {
        if (!isset($input['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID is required'
            ]);
            exit();
        }

        $target_id = (int)$input['id']; // Cast to int for safety
        $current_admin_id = $_SESSION['admin_id'];

        // Prevent deleting yourself
        if ($current_admin_id == $target_id) {
            echo json_encode([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ]);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM admin WHERE id = ?");
        $stmt->bind_param("i", $target_id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Admin user deleted successfully'
                ]);
            } else {
                // Could mean the user wasn't found
                echo json_encode([
                    'success' => false,
                    'message' => 'Admin user not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting admin user: ' . $conn->error
            ]);
        }
        $stmt->close();
    } else {
        // Handle unknown actions within POST
        echo json_encode([
            'success' => false,
            'message' => 'Unknown action requested: ' . $action
        ]);
    }
} else {
    // Handle invalid request methods
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method. Use GET or POST.'
    ]);
}

$conn->close();
?>