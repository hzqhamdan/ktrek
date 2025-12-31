<?php
// tasks.php - Manager scoping: supports both (1) attractions.created_by_admin_id and (2) legacy admin.attraction_id
require_once '../config.php';

session_start();
if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_role'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Authentication required.'
    ]);
    exit();
}

$admin_id = (int)$_SESSION['admin_id'];
$admin_role = $_SESSION['admin_role'];

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

function dbColumnExists(mysqli $conn, string $table, string $column): bool {
    $sql = "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    if (!$stmt) return false;
    $stmt->bind_param('ss', $table, $column);
    $stmt->execute();
    $res = $stmt->get_result();
    $exists = $res && $res->num_rows > 0;
    $stmt->close();
    return $exists;
}

$has_created_by_column = dbColumnExists($conn, 'attractions', 'created_by_admin_id');

function getLegacyManagerAttractionId(mysqli $conn, int $admin_id): ?int {
    $stmt = $conn->prepare('SELECT attraction_id FROM admin WHERE id = ? LIMIT 1');
    if (!$stmt) return null;
    $stmt->bind_param('i', $admin_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();
    if (!$row || $row['attraction_id'] === null) return null;
    return (int)$row['attraction_id'];
}

$legacy_manager_attraction_id = null;
if ($admin_role === 'manager' && !$has_created_by_column) {
    $legacy_manager_attraction_id = getLegacyManagerAttractionId($conn, $admin_id);
}

// GET - List all tasks for accessible attractions or get single task
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Base query - Join tasks with attractions
        $query = "SELECT t.*, a.name as attraction_name FROM tasks t LEFT JOIN attractions a ON t.attraction_id = a.id";

        $params = [];
        $types = "";

        // Apply filter for managers
        if ($admin_role === 'manager') {
            if ($has_created_by_column) {
                // New model: attractions.created_by_admin_id
                $query .= " WHERE a.created_by_admin_id = ?";
                $params[] = $admin_id;
                $types .= "i";
            } else {
                // Legacy model: admin.attraction_id (one attraction per manager)
                if ($legacy_manager_attraction_id === null) {
                    echo json_encode(['success' => true, 'tasks' => []]);
                    $conn->close();
                    exit();
                }
                $query .= " WHERE t.attraction_id = ?";
                $params[] = $legacy_manager_attraction_id;
                $types .= "i";
            }
        }
        // Superadmin sees all tasks

        // Apply search filter (search in task name and attraction name)
        $search_term = $_GET['search'] ?? '';
        if ($search_term !== '') {
            $search_param = '%' . $search_term . '%';
            // Determine if WHERE or AND is needed based on previous filters (manager filter)
            $where_clause = ($admin_role === 'manager') ? ' AND' : ' WHERE';
            $query .= $where_clause . " (t.name LIKE ? OR a.name LIKE ?)";
            $params[] = $search_param;
            $params[] = $search_param; // Search in both task name and attraction name
            $types .= "ss"; // Two string parameters for the LIKE clauses
        }

        // Apply type filter
        $type_filter = $_GET['type'] ?? '';
        if ($type_filter !== '') {
            // Determine if WHERE or AND is needed based on previous filters (manager, search)
            $clause = (strpos($query, 'WHERE') !== false) ? ' AND' : ' WHERE';
            $query .= $clause . " t.type = ?";
            $params[] = $type_filter;
            $types .= "s"; // One string parameter for the type
        }

        $query .= " ORDER BY t.created_at DESC";
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $tasks = [];

        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }

        echo json_encode([
            'success' => true,
            'tasks' => $tasks
        ]);
        $stmt->close();
    }
    elseif ($action === 'get' && isset($_GET['id'])) {
        $id = intval($_GET['id']);
        // Join with attractions table
        $select_cols = "t.*, a.name as attraction_name";
        if ($has_created_by_column) {
            $select_cols .= ", a.created_by_admin_id";
        }
        $stmt = $conn->prepare("SELECT {$select_cols} FROM tasks t LEFT JOIN attractions a ON t.attraction_id = a.id WHERE t.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $task = $result->fetch_assoc();

            // Check if manager can access this specific task
            if ($admin_role === 'manager') {
                if ($has_created_by_column) {
                    if ((int)($task['created_by_admin_id'] ?? 0) !== $admin_id) {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Access denied. You do not manage the attraction for this task.'
                        ]);
                        $stmt->close();
                        $conn->close();
                        exit();
                    }
                } else {
                    if ($legacy_manager_attraction_id === null || (int)$task['attraction_id'] !== $legacy_manager_attraction_id) {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Access denied. You do not manage the attraction for this task.'
                        ]);
                        $stmt->close();
                        $conn->close();
                        exit();
                    }
                }
            }

            echo json_encode([
                'success' => true,
                'task' => $task
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Task not found'
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

// POST - Create, Update, or Delete task
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';

    // Validate required fields for creation (example)
    if ($action === 'create' && !validateRequired($input, ['name', 'attraction_id', 'type', 'description'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Name, attraction, type, and description are required for creating a task.'
        ]);
        $conn->close();
        exit();
    }

    // Validate required fields for update (example)
    if ($action === 'update' && (!isset($input['id']) || !validateRequired($input, ['name', 'attraction_id', 'type', 'description']))) {
        echo json_encode([
            'success' => false,
            'message' => 'ID, name, attraction, type, and description are required for updating a task.'
        ]);
        $conn->close();
        exit();
    }

    // Validate required fields for deletion (example)
    if ($action === 'delete' && !isset($input['id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID is required for deleting a task.'
        ]);
        $conn->close();
        exit();
    }


    // Create new task with quiz questions support
    if ($action === 'create') {
        // Check if manager is trying to create task for an attraction they don't manage
        if ($admin_role === 'manager') {
            if ($has_created_by_column) {
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

                if ((int)$target_attraction['created_by_admin_id'] !== $admin_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You can only create tasks for attractions you manage.'
                    ]);
                    $conn->close();
                    exit();
                }
            } else {
                if ($legacy_manager_attraction_id === null || (int)$input['attraction_id'] !== $legacy_manager_attraction_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You can only create tasks for your assigned attraction.'
                    ]);
                    $conn->close();
                    exit();
                }
            }
        }

        $stmt = $conn->prepare("INSERT INTO tasks (attraction_id, name, type, description, qr_code, media_url) VALUES (?, ?, ?, ?, ?, ?)");
        // Assuming qr_code and media_url might be part of input, adjust as needed
        $qr_code = $input['qr_code'] ?? null;
        $media_url = $input['media_url'] ?? null;
        $stmt->bind_param("isssss", $input['attraction_id'], $input['name'], $input['type'], $input['description'], $qr_code, $media_url);

        if ($stmt->execute()) {
            $task_id = $conn->insert_id;
            
            // If it's a quiz task, handle quiz questions
            if ($input['type'] === 'quiz' && isset($input['questions']) && is_array($input['questions'])) {
                foreach ($input['questions'] as $index => $question) {
                    if (!empty($question['question_text'])) {
                        // Insert question
                        $q_stmt = $conn->prepare("INSERT INTO quiz_questions (task_id, question_text, question_order) VALUES (?, ?, ?)");
                        $q_stmt->bind_param("isi", $task_id, $question['question_text'], $index);
                        $q_stmt->execute();
                        $question_id = $conn->insert_id;
                        $q_stmt->close();
                        
                        // Insert options
                        if (isset($question['options']) && is_array($question['options'])) {
                            foreach ($question['options'] as $opt_index => $option) {
                                if (!empty($option['option_text'])) {
                                    $is_correct = isset($option['is_correct']) ? (int)$option['is_correct'] : 0;
                                    $opt_stmt = $conn->prepare("INSERT INTO quiz_options (question_id, option_text, is_correct, option_order) VALUES (?, ?, ?, ?)");
                                    $opt_stmt->bind_param("isii", $question_id, $option['option_text'], $is_correct, $opt_index);
                                    $opt_stmt->execute();
                                    $opt_stmt->close();
                                }
                            }
                        }
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Task created successfully',
                'id' => $task_id
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error creating task: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Update task
    elseif ($action === 'update') {
        $id = intval($input['id']);

        // Check if manager is trying to update a task for an attraction they don't manage
        if ($admin_role === 'manager') {
            // First, fetch the *existing* task to get its attraction_id
            $existing_task_fetch_stmt = $conn->prepare("SELECT attraction_id FROM tasks WHERE id = ?");
            $existing_task_fetch_stmt->bind_param("i", $id);
            $existing_task_fetch_stmt->execute();
            $existing_task_fetch_result = $existing_task_fetch_stmt->get_result();

            if (!$existing_task_fetch_result || $existing_task_fetch_result->num_rows !== 1) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Task not found.'
                ]);
                $existing_task_fetch_stmt->close();
                $conn->close();
                exit();
            }

            $existing_task = $existing_task_fetch_result->fetch_assoc();
            $existing_task_fetch_stmt->close();

            if ($has_created_by_column) {
                // Then, fetch the attraction to check creator
                $attr_fetch_stmt_for_update = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
                $attr_fetch_stmt_for_update->bind_param("i", $existing_task['attraction_id']);
                $attr_fetch_stmt_for_update->execute();
                $attr_fetch_result_for_update = $attr_fetch_stmt_for_update->get_result();

                if (!$attr_fetch_result_for_update || $attr_fetch_result_for_update->num_rows !== 1) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Attraction for the task not found.'
                    ]);
                    $attr_fetch_stmt_for_update->close();
                    $conn->close();
                    exit();
                }

                $target_attraction = $attr_fetch_result_for_update->fetch_assoc();
                $attr_fetch_stmt_for_update->close();

                if ((int)$target_attraction['created_by_admin_id'] !== $admin_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You cannot update this task.'
                    ]);
                    $conn->close();
                    exit();
                }

                // If changing attraction_id is allowed, ensure new attraction also belongs to manager
                if (isset($input['attraction_id']) && $input['attraction_id'] != $existing_task['attraction_id']) {
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

                    if ((int)$new_target_attraction['created_by_admin_id'] !== $admin_id) {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Access denied. You cannot move this task to an attraction you do not manage.'
                        ]);
                        $conn->close();
                        exit();
                    }
                }
            } else {
                // Legacy model: manager can only update tasks in their assigned attraction
                if ($legacy_manager_attraction_id === null || (int)$existing_task['attraction_id'] !== $legacy_manager_attraction_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You cannot update this task.'
                    ]);
                    $conn->close();
                    exit();
                }

                if (isset($input['attraction_id']) && (int)$input['attraction_id'] !== $legacy_manager_attraction_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You cannot move this task to another attraction.'
                    ]);
                    $conn->close();
                    exit();
                }
            }
        }

        // Optional: Verify the task exists before attempting update (adds robustness - already done above)
        // $verify_stmt = $conn->prepare("SELECT id FROM tasks WHERE id = ?");
        // $verify_stmt->bind_param("i", $id);
        // $verify_stmt->execute();
        // $verify_result = $verify_stmt->get_result();
        // if (!$verify_result || $verify_result->num_rows !== 1) { ... }

        $stmt = $conn->prepare("UPDATE tasks SET attraction_id = ?, name = ?, type = ?, description = ?, qr_code = ?, media_url = ? WHERE id = ?");
        $qr_code = $input['qr_code'] ?? null;
        $media_url = $input['media_url'] ?? null;
        $stmt->bind_param("issssssi", $input['attraction_id'], $input['name'], $input['type'], $input['description'], $qr_code, $media_url, $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Task updated successfully'
                ]);
            } else {
                // This case might occur if the ID doesn't exist (though verification above should catch it) or no changes were made
                 echo json_encode([
                    'success' => false,
                    'message' => 'Task not found or no changes made.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error updating task: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Delete task
    elseif ($action === 'delete') {
        $id = intval($input['id']);

        // Check if manager is trying to delete a task for an attraction they don't manage
        if ($admin_role === 'manager') {
            // First, fetch the *existing* task to get its attraction_id
            $existing_task_fetch_stmt = $conn->prepare("SELECT attraction_id FROM tasks WHERE id = ?");
            $existing_task_fetch_stmt->bind_param("i", $id);
            $existing_task_fetch_stmt->execute();
            $existing_task_fetch_result = $existing_task_fetch_stmt->get_result();

            if (!$existing_task_fetch_result || $existing_task_fetch_result->num_rows !== 1) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Task not found.'
                ]);
                $existing_task_fetch_stmt->close();
                $conn->close();
                exit();
            }

            $existing_task = $existing_task_fetch_result->fetch_assoc();
            $existing_task_fetch_stmt->close();

            if ($has_created_by_column) {
                $attr_fetch_stmt_for_delete = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
                $attr_fetch_stmt_for_delete->bind_param("i", $existing_task['attraction_id']);
                $attr_fetch_stmt_for_delete->execute();
                $attr_fetch_result_for_delete = $attr_fetch_stmt_for_delete->get_result();

                if (!$attr_fetch_result_for_delete || $attr_fetch_result_for_delete->num_rows !== 1) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Attraction for the task not found.'
                    ]);
                    $attr_fetch_stmt_for_delete->close();
                    $conn->close();
                    exit();
                }

                $target_attraction = $attr_fetch_result_for_delete->fetch_assoc();
                $attr_fetch_stmt_for_delete->close();

                if ((int)$target_attraction['created_by_admin_id'] !== $admin_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You cannot delete this task.'
                    ]);
                    $conn->close();
                    exit();
                }
            } else {
                if ($legacy_manager_attraction_id === null || (int)$existing_task['attraction_id'] !== $legacy_manager_attraction_id) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You cannot delete this task.'
                    ]);
                    $conn->close();
                    exit();
                }
            }
        }

         // Optional: Verify the task exists before attempting delete (adds robustness - already done above)
         // $verify_stmt = $conn->prepare("SELECT id FROM tasks WHERE id = ?");
         // $verify_stmt->bind_param("i", $id);
         // $verify_stmt->execute();
         // $verify_result = $verify_stmt->get_result();
         // if (!$verify_result || $verify_result->num_rows !== 1) { ... }

        $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Task deleted successfully'
                ]);
            } else {
                // Shouldn't happen if verification passed, but good to check
                 echo json_encode([
                    'success' => false,
                    'message' => 'Task not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting task: ' . $conn->error
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