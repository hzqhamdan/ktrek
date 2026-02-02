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

            // Load quiz-style questions/options for relevant task types
            $quiz_backed_types = ['quiz', 'riddle', 'direction', 'observation_match'];
            if (in_array($task['type'], $quiz_backed_types, true)) {
                $questions_stmt = $conn->prepare("SELECT id, question_text, question_order FROM quiz_questions WHERE task_id = ? ORDER BY question_order ASC");
                $questions_stmt->bind_param("i", $id);
                $questions_stmt->execute();
                $questions_result = $questions_stmt->get_result();
                $questions = [];

                while ($question = $questions_result->fetch_assoc()) {
                    $options_stmt = $conn->prepare("SELECT id as option_id, option_text, is_correct, option_order, option_metadata FROM quiz_options WHERE question_id = ? ORDER BY option_order ASC");
                    $question_id = (int)$question['id'];
                    $options_stmt->bind_param("i", $question_id);
                    $options_stmt->execute();
                    $options_result = $options_stmt->get_result();
                    $options = [];
                    while ($option = $options_result->fetch_assoc()) {
                        $options[] = $option;
                    }
                    $options_stmt->close();

                    $question['options'] = $options;
                    $questions[] = $question;
                }
                $questions_stmt->close();

                $task['questions'] = $questions;
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

        // Consolidate task-specific configs into task_config
        $task_config = null;
        if (isset($input['time_config'])) {
            $task_config = json_encode($input['time_config']);
        } elseif (isset($input['count_config'])) {
            $task_config = json_encode($input['count_config']);
        } elseif (isset($input['direction_config'])) {
            $task_config = json_encode($input['direction_config']);
        }
        
        $stmt = $conn->prepare("INSERT INTO tasks (attraction_id, name, type, description, qr_code, media_url, task_config) VALUES (?, ?, ?, ?, ?, ?, ?)");
        // Assuming qr_code and media_url might be part of input, adjust as needed
        $qr_code = $input['qr_code'] ?? null;
        $media_url = $input['media_url'] ?? null;
        $stmt->bind_param("issssss", $input['attraction_id'], $input['name'], $input['type'], $input['description'], $qr_code, $media_url, $task_config);

        if ($stmt->execute()) {
            $task_id = $conn->insert_id;
            
            // If it's a quiz or direction task, handle quiz questions
            if (($input['type'] === 'quiz' || $input['type'] === 'direction') && isset($input['questions']) && is_array($input['questions'])) {
                foreach ($input['questions'] as $index => $question) {
                    if (!empty($question['question_text'])) {
                        // Insert question
                        $q_stmt = $conn->prepare("INSERT INTO quiz_questions (task_id, question_text, question_order) VALUES (?, ?, ?)");
                        $q_stmt->bind_param("isi", $task_id, $question['question_text'], $index);
                        $q_stmt->execute();
                        $question_id = $conn->insert_id;
                        $q_stmt->close();
                        
                        // Insert options (for quiz, use question['options']; for direction, use input['options'])
                        $options_to_insert = [];
                        if (isset($question['options']) && is_array($question['options'])) {
                            $options_to_insert = $question['options'];
                        } elseif ($input['type'] === 'direction' && isset($input['options']) && is_array($input['options'])) {
                            $options_to_insert = $input['options'];
                        }
                        
                        foreach ($options_to_insert as $opt_index => $option) {
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
            
            // Observation Match tasks (admin form sends questions/options, similar to quiz)
            if ($input['type'] === 'observation_match' && isset($input['questions']) && is_array($input['questions'])) {
                foreach ($input['questions'] as $index => $question) {
                    if (!empty($question['question_text'])) {
                        $q_stmt = $conn->prepare("INSERT INTO quiz_questions (task_id, question_text, question_order) VALUES (?, ?, ?)");
                        $q_stmt->bind_param("isi", $task_id, $question['question_text'], $index);
                        $q_stmt->execute();
                        $question_id = $conn->insert_id;
                        $q_stmt->close();

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

            // If it's an observation_match task, handle options (new format with multiple correct answers)
            if ($input['type'] === 'observation_match' && isset($input['observation_match_options']) && is_array($input['observation_match_options'])) {
                // Create a single question container
                $q_stmt = $conn->prepare("INSERT INTO quiz_questions (task_id, question_text, question_order) VALUES (?, ?, ?)");
                $question_text = isset($input['observation_match_question']) ? $input['observation_match_question'] : "Select all correct answers";
                $question_order = 0;
                $q_stmt->bind_param("isi", $task_id, $question_text, $question_order);
                $q_stmt->execute();
                $question_id = $conn->insert_id;
                $q_stmt->close();
                
                // Insert each option with is_correct metadata
                foreach ($input['observation_match_options'] as $option) {
                    $option_text = $option['option_text'];
                    $is_correct = isset($option['is_correct']) && $option['is_correct'] ? true : false;
                    $option_order = isset($option['option_order']) ? (int)$option['option_order'] : 0;
                    
                    // Store is_correct in metadata for the submission handler
                    $option_metadata = json_encode([
                        'is_correct' => $is_correct
                    ]);
                    
                    $opt_stmt = $conn->prepare("INSERT INTO quiz_options (question_id, option_text, is_correct, option_order, option_metadata) VALUES (?, ?, ?, ?, ?)");
                    $is_correct_int = $is_correct ? 1 : 0;
                    $opt_stmt->bind_param("isiis", $question_id, $option_text, $is_correct_int, $option_order, $option_metadata);
                    $opt_stmt->execute();
                    $opt_stmt->close();
                }
            }
            // Legacy format: match pairs (for backwards compatibility)
            elseif ($input['type'] === 'observation_match' && isset($input['match_pairs']) && is_array($input['match_pairs'])) {
                // Create a single question container for all match pairs
                $q_stmt = $conn->prepare("INSERT INTO quiz_questions (task_id, question_text, question_order) VALUES (?, ?, ?)");
                $question_text = "Match the items with their meanings";
                $question_order = 0;
                $q_stmt->bind_param("isi", $task_id, $question_text, $question_order);
                $q_stmt->execute();
                $question_id = $conn->insert_id;
                $q_stmt->close();
                
                // Insert each match pair as two options with metadata
                $option_order = 0;
                foreach ($input['match_pairs'] as $pair) {
                    $pair_id = (int)$pair['pair_id'];
                    
                    // Insert the item (observable feature)
                    $item_metadata = json_encode([
                        'match_pair_id' => $pair_id,
                        'item_type' => 'item'
                    ]);
                    $opt_stmt = $conn->prepare("INSERT INTO quiz_options (question_id, option_text, is_correct, option_order, option_metadata) VALUES (?, ?, 0, ?, ?)");
                    $opt_stmt->bind_param("isis", $question_id, $pair['item_text'], $option_order, $item_metadata);
                    $opt_stmt->execute();
                    $opt_stmt->close();
                    $option_order++;
                    
                    // Insert the function/meaning
                    $function_metadata = json_encode([
                        'match_pair_id' => $pair_id,
                        'item_type' => 'function'
                    ]);
                    $opt_stmt = $conn->prepare("INSERT INTO quiz_options (question_id, option_text, is_correct, option_order, option_metadata) VALUES (?, ?, 0, ?, ?)");
                    $opt_stmt->bind_param("isis", $question_id, $pair['function_text'], $option_order, $function_metadata);
                    $opt_stmt->execute();
                    $opt_stmt->close();
                    $option_order++;
                }
            }
            
            // Get attraction name for audit log
            $attr_name_stmt = $conn->prepare("SELECT name FROM attractions WHERE id = ?");
            $attr_name_stmt->bind_param("i", $input['attraction_id']);
            $attr_name_stmt->execute();
            $attr_name_result = $attr_name_stmt->get_result();
            $attraction_name = $attr_name_result->num_rows > 0 ? $attr_name_result->fetch_assoc()['name'] : 'Unknown';
            $attr_name_stmt->close();
            
            // Log audit entry (only for superadmin)
            logAudit($conn, $admin_id, $admin_role, 'create', 'task', $task_id, $input['name'], $input['attraction_id'], $attraction_name, 'Created new task of type: ' . $input['type']);
            
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

        // Fetch the existing task first (needed for all roles for change tracking)
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

        // Check if manager is trying to update a task for an attraction they don't manage
        if ($admin_role === 'manager') {

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

        // Consolidate task-specific configs into task_config
        $task_config = null;
        error_log("UPDATE - Received input keys: " . implode(', ', array_keys($input)));
        error_log("UPDATE - Has time_config: " . (isset($input['time_config']) ? 'YES' : 'NO'));
        if (isset($input['time_config'])) {
            error_log("UPDATE - time_config value: " . json_encode($input['time_config']));
        }
        
        if (isset($input['task_config'])) {
            $task_config = json_encode($input['task_config']);
        } elseif (isset($input['time_config'])) {
            $task_config = json_encode($input['time_config']);
        } elseif (isset($input['count_config'])) {
            $task_config = json_encode($input['count_config']);
        } elseif (isset($input['direction_config'])) {
            $task_config = json_encode($input['direction_config']);
        }
        
        error_log("UPDATE - Final task_config: " . ($task_config ?? 'NULL'));
        
        $stmt = $conn->prepare("UPDATE tasks SET attraction_id = ?, name = ?, type = ?, description = ?, qr_code = ?, media_url = ?, task_config = ? WHERE id = ?");
        $qr_code = $input['qr_code'] ?? null;
        $media_url = $input['media_url'] ?? null;
        // 8 placeholders: attraction_id (i), name (s), type (s), description (s), qr_code (s), media_url (s), task_config (s), id (i)
        $stmt->bind_param("issssssi", $input['attraction_id'], $input['name'], $input['type'], $input['description'], $qr_code, $media_url, $task_config, $id);

        if ($stmt->execute()) {
            $questions_updated = false;
            
            // Handle quiz/observation_match questions update
            $quiz_backed_types = ['quiz', 'riddle', 'direction', 'observation_match'];
            if (in_array($input['type'], $quiz_backed_types, true) && isset($input['questions']) && is_array($input['questions'])) {
                // First, delete existing questions and options for this task
                // Get all question IDs for this task
                $get_questions_stmt = $conn->prepare("SELECT id FROM quiz_questions WHERE task_id = ?");
                $get_questions_stmt->bind_param("i", $id);
                $get_questions_stmt->execute();
                $questions_result = $get_questions_stmt->get_result();
                
                while ($q_row = $questions_result->fetch_assoc()) {
                    // Delete options for this question
                    $del_opts_stmt = $conn->prepare("DELETE FROM quiz_options WHERE question_id = ?");
                    $del_opts_stmt->bind_param("i", $q_row['id']);
                    $del_opts_stmt->execute();
                    $del_opts_stmt->close();
                }
                $get_questions_stmt->close();
                
                // Delete all questions for this task
                $del_questions_stmt = $conn->prepare("DELETE FROM quiz_questions WHERE task_id = ?");
                $del_questions_stmt->bind_param("i", $id);
                $del_questions_stmt->execute();
                $del_questions_stmt->close();
                
                // Insert new questions and options
                foreach ($input['questions'] as $index => $question) {
                    if (!empty($question['question_text'])) {
                        $q_stmt = $conn->prepare("INSERT INTO quiz_questions (task_id, question_text, question_order) VALUES (?, ?, ?)");
                        $q_stmt->bind_param("isi", $id, $question['question_text'], $index);
                        $q_stmt->execute();
                        $question_id = $conn->insert_id;
                        $q_stmt->close();
                        
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
                        $questions_updated = true;
                    }
                }
            }
            
            // Check if either main task was updated OR questions were updated
            if ($stmt->affected_rows > 0 || $questions_updated) {
                // Get attraction name for audit log
                $attr_name_stmt = $conn->prepare("SELECT name FROM attractions WHERE id = ?");
                $attr_name_stmt->bind_param("i", $input['attraction_id']);
                $attr_name_stmt->execute();
                $attr_name_result = $attr_name_stmt->get_result();
                $attraction_name = $attr_name_result->num_rows > 0 ? $attr_name_result->fetch_assoc()['name'] : 'Unknown';
                $attr_name_stmt->close();
                
                // Build changes summary
                $changes = [];
                if (isset($input['name'])) $changes[] = 'name';
                if (isset($input['type'])) $changes[] = 'type';
                if (isset($input['description'])) $changes[] = 'description';
                if (isset($input['qr_code'])) $changes[] = 'QR code';
                if (isset($input['media_url'])) $changes[] = 'media';
                if (isset($input['task_config'])) $changes[] = 'task configuration';
                if (isset($input['attraction_id']) && $input['attraction_id'] != $existing_task['attraction_id']) $changes[] = 'attraction';
                if ($questions_updated) $changes[] = 'questions/options';
                $changes_summary = 'Updated: ' . implode(', ', $changes);
                
                // Log audit entry (only for superadmin)
                logAudit($conn, $admin_id, $admin_role, 'update', 'task', $id, $input['name'], $input['attraction_id'], $attraction_name, $changes_summary);
                
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

        // Get task and attraction info before deletion for audit log
        $task_info_stmt = $conn->prepare("SELECT t.name as task_name, a.id as attraction_id, a.name as attraction_name FROM tasks t LEFT JOIN attractions a ON t.attraction_id = a.id WHERE t.id = ?");
        $task_info_stmt->bind_param("i", $id);
        $task_info_stmt->execute();
        $task_info_result = $task_info_stmt->get_result();
        $task_info = $task_info_result->num_rows > 0 ? $task_info_result->fetch_assoc() : null;
        $task_info_stmt->close();

        $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                // Log audit entry (only for superadmin)
                if ($task_info) {
                    logAudit($conn, $admin_id, $admin_role, 'delete', 'task', $id, $task_info['task_name'] ?? 'Unknown', $task_info['attraction_id'] ?? null, $task_info['attraction_name'] ?? 'Unknown', 'Deleted task');
                }
                
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