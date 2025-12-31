<?php
// rewards.php - Updated for attraction-based ownership
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

// GET - List all rewards for accessible attractions or get single reward
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Base query - Join rewards with attractions and admin (creator) to get names and check ownership
        $query = "SELECT r.*, a.name as attraction_name FROM rewards r LEFT JOIN attractions a ON r.attraction_id = a.id LEFT JOIN admin ad ON a.created_by_admin_id = ad.id";

        $params = [];
        $types = "";

        // Apply filter for managers - Managers can only see rewards for attractions they created
        if ($admin_role === 'manager') {
             $query .= " WHERE a.created_by_admin_id = ?";
             $params[] = $admin_id; // Use the logged-in admin's ID
             $types .= "i"; // Integer for admin ID
        }
        // Superadmin sees all rewards

        // Apply search filter (search in title and description)
        $search_term = $_GET['search'] ?? '';
        if ($search_term !== '') {
            $search_param = '%' . $search_term . '%';
            // Determine if WHERE or AND is needed based on previous filters (manager filter)
            $where_clause = ($admin_role === 'manager') ? ' AND' : ' WHERE';
            $query .= $where_clause . " (r.title LIKE ? OR r.description LIKE ?)";
            $params[] = $search_param;
            $params[] = $search_param; // Search in both title and description
            $types .= "ss"; // Two string parameters for the LIKE clauses
        }

        // Apply attraction filter (filter by specific attraction ID)
        $attraction_filter_id = $_GET['attraction_id'] ?? '';
        if ($attraction_filter_id !== '') {
             // Validate the attraction ID (optional but recommended)
             if (!is_numeric($attraction_filter_id)) {
                 echo json_encode([
                    'success' => false,
                    'message' => 'Invalid attraction ID provided for filter.'
                ]);
                $conn->close();
                exit();
             }

            // Determine if WHERE or AND is needed based on previous filters (manager, search)
            $clause = (strpos($query, 'WHERE') !== false) ? ' AND' : ' WHERE';
            $query .= $clause . " r.attraction_id = ?";
            $params[] = (int)$attraction_filter_id; // Cast to int for safety
            $types .= "i"; // One integer parameter for the attraction ID
        }

        $query .= " ORDER BY r.created_at DESC";
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $rewards = [];

        while ($row = $result->fetch_assoc()) {
            $rewards[] = $row;
        }

        echo json_encode([
            'success' => true,
            'rewards' => $rewards
        ]);
        $stmt->close();
    }
    elseif ($action === 'get' && isset($_GET['id'])) {
        $id = intval($_GET['id']);
        // Join with attractions table to check creator
        $stmt = $conn->prepare("SELECT r.*, a.name as attraction_name, a.created_by_admin_id FROM rewards r LEFT JOIN attractions a ON r.attraction_id = a.id WHERE r.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $reward = $result->fetch_assoc();

            // Check if manager can access this specific reward
            if ($admin_role === 'manager') {
                // The key check: the reward's attraction must have been created by the current manager
                if ($reward['attraction_created_by_admin_id'] !== $admin_id) { // Note: fetched column name might differ based on JOIN alias
                     echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. This reward is not part of your attraction.'
                    ]);
                    $stmt->close();
                    $conn->close();
                    exit();
                }
            }

            echo json_encode([
                'success' => true,
                'reward' => $reward
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Reward not found'
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

// POST - Create, Update, or Delete reward
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';

    // Validate required fields for creation (example)
    if ($action === 'create' && !validateRequired($input, ['title', 'attraction_id', 'description'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Title, attraction, and description are required for creating a reward.'
        ]);
        $conn->close();
        exit();
    }

    // Validate required fields for update (example)
    if ($action === 'update' && (!isset($input['id']) || !validateRequired($input, ['title', 'attraction_id', 'description']))) {
        echo json_encode([
            'success' => false,
            'message' => 'ID, title, attraction, and description are required for updating a reward.'
        ]);
        $conn->close();
        exit();
    }

    // Validate required fields for deletion (example)
    if ($action === 'delete' && !isset($input['id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID is required for deleting a reward.'
        ]);
        $conn->close();
        exit();
    }


    // Create new reward
    if ($action === 'create') {
        // Check if manager is trying to create reward for an attraction they didn't create
        if ($admin_role === 'manager') {
             // First, fetch the attraction to check its creator
             $attr_fetch_stmt = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
             $attr_fetch_stmt->bind_param("i", $input['attraction_id']);
             $attr_fetch_stmt->execute();
             $attr_fetch_result = $attr_fetch_stmt->get_result();

             if (!$attr_fetch_result || $attr_fetch_result->num_rows !== 1) {
                  echo json_encode([
                     'success' => false,
                     'message' => 'Target attraction not found.'
                 ]);
                 $attr_fetch_stmt->close();
                 $conn->close();
                 exit();
             }

             $target_attraction = $attr_fetch_result->fetch_assoc();
             $attr_fetch_stmt->close();

             if ($target_attraction['created_by_admin_id'] !== $admin_id) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You can only create rewards for attractions you manage.'
                ]);
                $conn->close();
                exit();
             }
        }

        $image_url = !empty($input['image']) ? trim($input['image']) : null; // Get image path from input

        $stmt = $conn->prepare("INSERT INTO rewards (attraction_id, title, description, image) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isss", $input['attraction_id'], $input['title'], $input['description'], $image_url);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Reward created successfully',
                'id' => $conn->insert_id
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error creating reward: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Update reward
    elseif ($action === 'update') {
        $id = intval($input['id']);

        // Check if manager is trying to update a reward for an attraction they didn't create
        if ($admin_role === 'manager') {
             // First, fetch the *existing* reward to get its attraction_id
             $existing_reward_fetch_stmt = $conn->prepare("SELECT attraction_id FROM rewards WHERE id = ?");
             $existing_reward_fetch_stmt->bind_param("i", $id);
             $existing_reward_fetch_stmt->execute();
             $existing_reward_fetch_result = $existing_reward_fetch_stmt->get_result();

             if (!$existing_reward_fetch_result || $existing_reward_fetch_result->num_rows !== 1) {
                  echo json_encode([
                     'success' => false,
                     'message' => 'Reward not found.'
                 ]);
                 $existing_reward_fetch_stmt->close();
                 $conn->close();
                 exit();
             }

             $existing_reward = $existing_reward_fetch_result->fetch_assoc();
             $existing_reward_fetch_stmt->close();

             // Then, fetch the *attraction* for that reward to check its creator
             $attr_fetch_stmt_for_update = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
             $attr_fetch_stmt_for_update->bind_param("i", $existing_reward['attraction_id']);
             $attr_fetch_stmt_for_update->execute();
             $attr_fetch_result_for_update = $attr_fetch_stmt_for_update->get_result();

             if (!$attr_fetch_result_for_update || $attr_fetch_result_for_update->num_rows !== 1) {
                  echo json_encode([
                     'success' => false,
                     'message' => 'Attraction for the reward not found.'
                 ]);
                 $attr_fetch_stmt_for_update->close();
                 $conn->close();
                 exit();
             }

             $target_attraction = $attr_fetch_result_for_update->fetch_assoc();
             $attr_fetch_stmt_for_update->close();

             if ($target_attraction['created_by_admin_id'] !== $admin_id) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You cannot update this reward.'
                ]);
                $conn->close();
                exit();
             }

             // Also check if manager is trying to change the attraction_id to an unassigned one (optional, depends on rules)
             // If changing attraction_id is allowed, check if the *new* attraction_id also belongs to the manager.
             if (isset($input['attraction_id']) && $input['attraction_id'] != $existing_reward['attraction_id']) {
                 $new_attr_fetch_stmt = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
                 $new_attr_fetch_stmt->bind_param("i", $input['attraction_id']);
                 $new_attr_fetch_stmt->execute();
                 $new_attr_fetch_result = $new_attr_fetch_stmt->get_result();

                 if (!$new_attr_fetch_result || $new_attr_fetch_result->num_rows !== 1) {
                      echo json_encode([
                         'success' => false,
                         'message' => 'Target attraction for update not found.'
                     ]);
                     $new_attr_fetch_stmt->close();
                     $conn->close();
                     exit();
                 }

                 $new_target_attraction = $new_attr_fetch_result->fetch_assoc();
                 $new_attr_fetch_stmt->close();

                 if ($new_target_attraction['created_by_admin_id'] !== $admin_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You cannot move this reward to an attraction you do not manage.'
                    ]);
                    $conn->close();
                    exit();
                 }
             }
        }

        // Optional: Verify the reward exists before attempting update (adds robustness - already done above)
        // $verify_stmt = $conn->prepare("SELECT id FROM rewards WHERE id = ?");
        // $verify_stmt->bind_param("i", $id);
        // $verify_stmt->execute();
        // $verify_result = $verify_stmt->get_result();
        // if (!$verify_result || $verify_result->num_rows !== 1) { ... }

        $image_url = !empty($input['image']) ? trim($input['image']) : null; // Get potentially updated image path

        $stmt = $conn->prepare("UPDATE rewards SET attraction_id = ?, title = ?, description = ?, image = ? WHERE id = ?");
        $stmt->bind_param("issssi", $input['attraction_id'], $input['title'], $input['description'], $image_url, $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Reward updated successfully'
                ]);
            } else {
                // This case might occur if the ID doesn't exist (though verification above should catch it) or no changes were made
                 echo json_encode([
                    'success' => false,
                    'message' => 'Reward not found or no changes made.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error updating reward: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Delete reward
    elseif ($action === 'delete') {
        $id = intval($input['id']);

        // Check if manager is trying to delete a reward for an attraction they didn't create
        if ($admin_role === 'manager') {
             // First, fetch the *existing* reward to get its attraction_id
             $existing_reward_fetch_stmt = $conn->prepare("SELECT attraction_id FROM rewards WHERE id = ?");
             $existing_reward_fetch_stmt->bind_param("i", $id);
             $existing_reward_fetch_stmt->execute();
             $existing_reward_fetch_result = $existing_reward_fetch_stmt->get_result();

             if (!$existing_reward_fetch_result || $existing_reward_fetch_result->num_rows !== 1) {
                  echo json_encode([
                     'success' => false,
                     'message' => 'Reward not found.'
                 ]);
                 $existing_reward_fetch_stmt->close();
                 $conn->close();
                 exit();
             }

             $existing_reward = $existing_reward_fetch_result->fetch_assoc();
             $existing_reward_fetch_stmt->close();

             // Then, fetch the *attraction* for that reward to check its creator
             $attr_fetch_stmt_for_delete = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
             $attr_fetch_stmt_for_delete->bind_param("i", $existing_reward['attraction_id']);
             $attr_fetch_stmt_for_delete->execute();
             $attr_fetch_result_for_delete = $attr_fetch_stmt_for_delete->get_result();

             if (!$attr_fetch_result_for_delete || $attr_fetch_result_for_delete->num_rows !== 1) {
                  echo json_encode([
                     'success' => false,
                     'message' => 'Attraction for the reward not found.'
                 ]);
                 $attr_fetch_stmt_for_delete->close();
                 $conn->close();
                 exit();
             }

             $target_attraction = $attr_fetch_result_for_delete->fetch_assoc();
             $attr_fetch_stmt_for_delete->close();

             if ($target_attraction['created_by_admin_id'] !== $admin_id) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You cannot delete this reward.'
                ]);
                $conn->close();
                exit();
             }
        }

         // Optional: Verify the reward exists before attempting delete (adds robustness - already done above)
         // $verify_stmt = $conn->prepare("SELECT id FROM rewards WHERE id = ?");
         // $verify_stmt->bind_param("i", $id);
         // $verify_stmt->execute();
         // $verify_result = $verify_stmt->get_result();
         // if (!$verify_result || $verify_result->num_rows !== 1) { ... }

        $stmt = $conn->prepare("DELETE FROM rewards WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Reward deleted successfully'
                ]);
            } else {
                // Shouldn't happen if verification passed, but good to check
                 echo json_encode([
                    'success' => false,
                    'message' => 'Reward not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting reward: ' . $conn->error
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