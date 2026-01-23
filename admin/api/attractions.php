<?php
// attractions.php - Updated for implicit ownership via created_by_admin_id
require_once '../config.php';

// Ensure session is started to get admin details
session_start();
if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_role'])) {
     echo json_encode([
        'success' => false,
        'message' => 'Authentication required.'
    ]);
    exit();
}
$admin_id = $_SESSION['admin_id'];
$admin_role = $_SESSION['admin_role'];

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

// Helper function to log audit entries (only for superadmin actions)
function logAudit($conn, $admin_id, $admin_role, $action_type, $entity_type, $entity_id, $entity_name, $attraction_id = null, $attraction_name = null, $changes_summary = null) {
    // Only log superadmin actions
    if ($admin_role !== 'superadmin') {
        return;
    }
    
    // Check if audit log table exists before attempting to log
    try {
        $check_table = $conn->query("SHOW TABLES LIKE 'admin_audit_log'");
        if ($check_table->num_rows === 0) {
            // Table doesn't exist yet, skip logging silently
            return;
        }
    } catch (Exception $e) {
        // If there's any error checking for the table, skip logging
        return;
    }
    
    // Get admin name
    $admin_stmt = $conn->prepare("SELECT full_name FROM admin WHERE id = ?");
    $admin_stmt->bind_param("i", $admin_id);
    $admin_stmt->execute();
    $admin_result = $admin_stmt->get_result();
    $admin_data = $admin_result->fetch_assoc();
    $admin_name = $admin_data['full_name'] ?? 'Unknown';
    $admin_stmt->close();
    
    // Insert audit log entry
    $log_stmt = $conn->prepare("INSERT INTO admin_audit_log (admin_id, admin_name, admin_role, action_type, entity_type, entity_id, entity_name, attraction_id, attraction_name, changes_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if ($log_stmt) {
        $log_stmt->bind_param("issssisiss", $admin_id, $admin_name, $admin_role, $action_type, $entity_type, $entity_id, $entity_name, $attraction_id, $attraction_name, $changes_summary);
        $log_stmt->execute();
        $log_stmt->close();
    }
}

// GET - List all attractions or get single attraction
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Base query - Join with admin table to get creator name if needed
        $query = "SELECT a.*, ad.full_name as created_by_name FROM attractions a LEFT JOIN admin ad ON a.created_by_admin_id = ad.id";

        $params = [];
        $types = "";

        // Apply filter for managers
        // Preferred: managers only see attractions they created (created_by_admin_id)
        // Backward compatibility: if older data doesn't have created_by_admin_id populated,
        // fall back to admin.attraction_id assignment.
        if ($admin_role === 'manager') {
            // Fetch manager's assigned attraction_id (legacy behavior)
            $assigned_attraction_id = null;
            $aStmt = $conn->prepare("SELECT attraction_id FROM admin WHERE id = ? LIMIT 1");
            $aStmt->bind_param("i", $admin_id);
            $aStmt->execute();
            $aRes = $aStmt->get_result();
            if ($aRes && $aRes->num_rows === 1) {
                $assigned_attraction_id = $aRes->fetch_assoc()['attraction_id'];
            }
            $aStmt->close();

            if ($assigned_attraction_id !== null) {
                $query .= " WHERE (a.created_by_admin_id = ? OR a.id = ?)";
                $params[] = $admin_id;
                $params[] = (int)$assigned_attraction_id;
                $types .= "ii";
            } else {
                $query .= " WHERE a.created_by_admin_id = ?";
                $params[] = $admin_id;
                $types .= "i";
            }
        }

        $query .= " ORDER BY a.created_at DESC";
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $attractions = [];

        while ($row = $result->fetch_assoc()) {
            $attractions[] = $row;
        }

        // If manager has no accessible attractions, return an actionable error message.
        // This avoids UI confusion (success=true with empty list) and guides admins to fix account assignment.
        if ($admin_role === 'manager' && count($attractions) === 0) {
            echo json_encode([
                'success' => false,
                'message' => 'No attraction is assigned to your manager account. Please create an attraction or ask a superadmin to assign one.'
            ]);
            $stmt->close();
            $conn->close();
            exit();
        }

        echo json_encode([
            'success' => true,
            'attractions' => $attractions
        ]);
        $stmt->close();
    }
    elseif ($action === 'get' && isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("SELECT a.*, ad.full_name as created_by_name FROM attractions a LEFT JOIN admin ad ON a.created_by_admin_id = ad.id WHERE a.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $attraction = $result->fetch_assoc();

            // Check if manager can access this specific attraction
            if ($admin_role === 'manager') {
                // The key check: the attraction must have been created by the current manager
                if ($attraction['created_by_admin_id'] !== $admin_id) {
                     echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. This is not your attraction.'
                    ]);
                    $stmt->close();
                    $conn->close();
                    exit();
                }
            }

            echo json_encode([
                'success' => true,
                'attraction' => $attraction
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Attraction not found'
            ]);
        }
        $stmt->close();
    } else {
         echo json_encode([
            'success' => false,
            'message' => 'Invalid action for GET request.'
        ]);
    }
}
// POST - Create, Update, or Delete attraction
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';

    // Validate required fields for creation (example)
    if ($action === 'create' && !validateRequired($input, ['name', 'location', 'description'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Name, location, and description are required for creating an attraction.'
        ]);
        $conn->close();
        exit();
    }

    // Validate required fields for update
    if ($action === 'update' && (!isset($input['id']) || !validateRequired($input, ['name', 'location', 'description']))) {
        echo json_encode([
            'success' => false,
            'message' => 'ID, name, location, and description are required for updating an attraction.'
        ]);
        $conn->close();
        exit();
    }

    // Validate coordinate ranges if provided
    if (isset($input['latitude']) && $input['latitude'] !== '' && $input['latitude'] !== null) {
        $lat = floatval($input['latitude']);
        
        if ($lat < -90 || $lat > 90) {
            echo json_encode([
                'success' => false,
                'message' => 'Latitude must be between -90 and 90.'
            ]);
            $conn->close();
            exit();
        }
    }

    // Validate navigation link if provided (must be http/https URL)
    if (isset($input['navigation_link']) && $input['navigation_link'] !== '' && $input['navigation_link'] !== null) {
        $nav = trim((string)$input['navigation_link']);
        if ($nav !== '') {
            if (!filter_var($nav, FILTER_VALIDATE_URL)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Navigation link must be a valid URL.'
                ]);
                $conn->close();
                exit();
            }
            $scheme = parse_url($nav, PHP_URL_SCHEME);
            if (!in_array($scheme, ['http', 'https'], true)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Navigation link must start with http:// or https://.'
                ]);
                $conn->close();
                exit();
            }
        }
    }
    
    if (isset($input['longitude']) && $input['longitude'] !== '' && $input['longitude'] !== null) {
        $lng = floatval($input['longitude']);
        
        if ($lng < -180 || $lng > 180) {
            echo json_encode([
                'success' => false,
                'message' => 'Longitude must be between -180 and 180.'
            ]);
            $conn->close();
            exit();
        }
    }

    // Validate required fields for deletion (example)
    if ($action === 'delete' && !isset($input['id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID is required for deleting an attraction.'
        ]);
        $conn->close();
        exit();
    }


    // Create new attraction
    if ($action === 'create') {
        // Check if manager is trying to create a second attraction (they should only have one)
        if ($admin_role === 'manager') {
             // Query to see if the manager already has an attraction created
             $check_stmt = $conn->prepare("SELECT id FROM attractions WHERE created_by_admin_id = ?");
             $check_stmt->bind_param("i", $admin_id);
             $check_stmt->execute();
             $check_result = $check_stmt->get_result();

             if ($check_result && $check_result->num_rows > 0) {
                 echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You already manage an attraction. Managers can only manage one attraction.'
                ]);
                $check_stmt->close();
                $conn->close();
                exit();
             }
             $check_stmt->close(); // Close the check statement
        }

        $image_url = !empty($input['image']) ? trim($input['image']) : null;
        $latitude = isset($input['latitude']) ? floatval($input['latitude']) : null;
        $longitude = isset($input['longitude']) ? floatval($input['longitude']) : null;
        $navigation_link = isset($input['navigation_link']) && trim((string)$input['navigation_link']) !== '' ? trim((string)$input['navigation_link']) : null;

        $stmt = $conn->prepare("INSERT INTO attractions (name, location, latitude, longitude, navigation_link, description, image, created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssddsssi", $input['name'], $input['location'], $latitude, $longitude, $navigation_link, $input['description'], $image_url, $admin_id); // Bind the current admin's ID

        if ($stmt->execute()) {
            $new_attraction_id = $conn->insert_id;

            // If the user is a manager, assign the attraction to them
            if ($admin_role === 'manager') {
                $update_stmt = $conn->prepare("UPDATE admin SET attraction_id = ? WHERE id = ?");
                $update_stmt->bind_param("ii", $new_attraction_id, $admin_id);
                $update_stmt->execute();
                $update_stmt->close();
            }

            // Log audit entry (only for superadmin)
            logAudit($conn, $admin_id, $admin_role, 'create', 'attraction', $new_attraction_id, $input['name'], $new_attraction_id, $input['name'], 'Created new attraction');

            echo json_encode([
                'success' => true,
                'message' => 'Attraction created successfully',
                'id' => $new_attraction_id
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error creating attraction: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Update attraction
    elseif ($action === 'update') {
        $id = intval($input['id']);

        // Check if manager is trying to update an attraction that isn't theirs
        if ($admin_role === 'manager') {
            // First, fetch the existing attraction to check its creator
            $fetch_stmt = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
            $fetch_stmt->bind_param("i", $id);
            $fetch_stmt->execute();
            $fetch_result = $fetch_stmt->get_result();

            if (!$fetch_result || $fetch_result->num_rows !== 1) {
                 echo json_encode([
                    'success' => false,
                    'message' => 'Attraction not found.'
                ]);
                $fetch_stmt->close();
                $conn->close();
                exit();
            }

            $existing_attraction = $fetch_result->fetch_assoc();
            $fetch_stmt->close();

            if ($existing_attraction['created_by_admin_id'] !== $admin_id) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You cannot update this attraction.'
                ]);
                $conn->close();
                exit();
            }
        }

        // Optional: Verify the attraction exists before attempting update (adds robustness - already done above)
        // $verify_stmt = $conn->prepare("SELECT id FROM attractions WHERE id = ?");
        // $verify_stmt->bind_param("i", $id);
        // $verify_stmt->execute();
        // $verify_result = $verify_stmt->get_result();
        // if (!$verify_result || $verify_result->num_rows !== 1) { ... }

        $image_url = !empty($input['image']) ? trim($input['image']) : null;
        $latitude = isset($input['latitude']) ? floatval($input['latitude']) : null;
        $longitude = isset($input['longitude']) ? floatval($input['longitude']) : null;
        $navigation_link = isset($input['navigation_link']) && trim((string)$input['navigation_link']) !== '' ? trim((string)$input['navigation_link']) : null;

        $stmt = $conn->prepare("UPDATE attractions SET name = ?, location = ?, latitude = ?, longitude = ?, navigation_link = ?, description = ?, image = ? WHERE id = ?");
        $stmt->bind_param("ssddsssi", $input['name'], $input['location'], $latitude, $longitude, $navigation_link, $input['description'], $image_url, $id);

        if ($stmt->execute()) {
            // Check if affected_rows > 0 OR if the attraction exists (update successful even if no changes)
            if ($stmt->affected_rows > 0 || $stmt->affected_rows === 0) {
                // Affected rows = 0 can mean no changes, but update was successful
                // We already verified the attraction exists above, so this is OK
                
                // Log audit entry (only for superadmin)
                $changes = [];
                if (isset($input['name'])) $changes[] = 'name';
                if (isset($input['location'])) $changes[] = 'location';
                if (isset($input['description'])) $changes[] = 'description';
                if (isset($input['latitude']) || isset($input['longitude'])) $changes[] = 'coordinates';
                if (isset($input['navigation_link'])) $changes[] = 'navigation_link';
                if (isset($input['image'])) $changes[] = 'image';
                $changes_summary = 'Updated: ' . implode(', ', $changes);
                logAudit($conn, $admin_id, $admin_role, 'update', 'attraction', $id, $input['name'], $id, $input['name'], $changes_summary);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Attraction updated successfully'
                ]);
            } else {
                // This shouldn't happen since we verified above
                 echo json_encode([
                    'success' => false,
                    'message' => 'Attraction not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error updating attraction: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Delete attraction
    elseif ($action === 'delete') {
        $id = intval($input['id']);

        // Check if manager is trying to delete an attraction that isn't theirs
        if ($admin_role === 'manager') {
             // First, fetch the existing attraction to check its creator
             $fetch_stmt = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
             $fetch_stmt->bind_param("i", $id);
             $fetch_stmt->execute();
             $fetch_result = $fetch_stmt->get_result();

             if (!$fetch_result || $fetch_result->num_rows !== 1) {
                  echo json_encode([
                     'success' => false,
                     'message' => 'Attraction not found.'
                 ]);
                 $fetch_stmt->close();
                 $conn->close();
                 exit();
             }

             $existing_attraction = $fetch_result->fetch_assoc();
             $fetch_stmt->close();

             if ($existing_attraction['created_by_admin_id'] !== $admin_id) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You cannot delete this attraction.'
                ]);
                $conn->close();
                exit();
             }
        }

         // Optional: Verify the attraction exists before attempting delete (adds robustness - already done above)
         // $verify_stmt = $conn->prepare("SELECT id FROM attractions WHERE id = ?");
         // $verify_stmt->bind_param("i", $id);
         // $verify_stmt->execute();
         // $verify_result = $verify_stmt->get_result();
         // if (!$verify_result || $verify_result->num_rows !== 1) { ... }

        $stmt = $conn->prepare("DELETE FROM attractions WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                // If the user was a manager, clearing their attraction_id is no longer relevant
                // as that column no longer exists in the admin table.
                // The relationship between attractions and creators/managers is now handled via 'created_by_admin_id' in the attractions table.

                // Get attraction name before deletion for audit log
                $name_stmt = $conn->prepare("SELECT name FROM attractions WHERE id = ?");
                $name_stmt->bind_param("i", $id);
                $name_stmt->execute();
                $name_result = $name_stmt->get_result();
                $attraction_name = $name_result->num_rows > 0 ? $name_result->fetch_assoc()['name'] : 'Unknown';
                $name_stmt->close();

                // Log audit entry (only for superadmin)
                logAudit($conn, $admin_id, $admin_role, 'delete', 'attraction', $id, $attraction_name, $id, $attraction_name, 'Deleted attraction');

                echo json_encode([
                    'success' => true,
                    'message' => 'Attraction deleted successfully'
                ]);
            } else {
                // Shouldn't happen if verification passed, but good to check
                 echo json_encode([
                    'success' => false,
                    'message' => 'Attraction not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting attraction: ' . $conn->error
            ]);
        }
        $stmt->close();
    } else {
         echo json_encode([
            'success' => false,
            'message' => 'Invalid action specified for POST request. Use create, update, or delete.'
        ]);
    }
} else {
     echo json_encode([
        'success' => false,
        'message' => 'Invalid request method. Use GET or POST.'
    ]);
}

$conn->close();
?>