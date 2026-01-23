<?php
// rewards.php - Reward Management System (Superadmin Only)
require_once '../config.php';

// Ensure session is started to get admin details
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Enable error logging for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors (they break JSON)
ini_set('log_errors', 1);
ini_set('error_log', '../error_log.txt');
if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_role'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Authentication required.'
    ]);
    exit();
}

$admin_id = $_SESSION['admin_id'];
$admin_role = $_SESSION['admin_role'];

// Restrict to Superadmin only
if (strcasecmp($admin_role, 'superadmin') !== 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Superadmin privileges required.'
    ]);
    exit();
}

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

// GET - List all rewards or get single reward
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Base query - Get all rewards with attraction names
        $query = "SELECT r.*, a.name as attraction_name 
                  FROM rewards r 
                  LEFT JOIN attractions a ON r.attraction_id = a.id 
                  ORDER BY r.created_at DESC";

        $params = [];
        $types = "";

        // Apply search filter
        $search_term = $_GET['search'] ?? '';
        if ($search_term !== '') {
            $search_param = '%' . $search_term . '%';
            $query = "SELECT r.*, a.name as attraction_name 
                      FROM rewards r 
                      LEFT JOIN attractions a ON r.attraction_id = a.id 
                      WHERE (r.title LIKE ? OR r.description LIKE ? OR r.reward_identifier LIKE ?)
                      ORDER BY r.created_at DESC";
            $params[] = $search_param;
            $params[] = $search_param;
            $params[] = $search_param;
            $types .= "sss";
        }

        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $rewards = [];

        while ($row = $result->fetch_assoc()) {
            // Parse JSON fields
            if (isset($row['trigger_condition']) && $row['trigger_condition']) {
                $row['trigger_condition'] = json_decode($row['trigger_condition'], true);
            }
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
        $stmt = $conn->prepare("SELECT r.*, a.name as attraction_name FROM rewards r LEFT JOIN attractions a ON r.attraction_id = a.id WHERE r.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $reward = $result->fetch_assoc();
            
            // Parse JSON fields
            if (isset($reward['trigger_condition']) && $reward['trigger_condition']) {
                $reward['trigger_condition'] = json_decode($reward['trigger_condition'], true);
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

    // CREATE new reward
    if ($action === 'create') {
        // Validate required fields
        if (!validateRequired($input, ['title', 'description', 'reward_type'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Title, description, and reward type are required.'
            ]);
            $conn->close();
            exit();
        }

        // Generate reward_identifier if not provided
        $reward_identifier = $input['reward_identifier'] ?? strtolower(str_replace(' ', '_', $input['title'])) . '_' . time();
        
        // Prepare values
        $attraction_id = isset($input['attraction_id']) && $input['attraction_id'] !== '' ? intval($input['attraction_id']) : null;
        $reward_type = $input['reward_type'] ?? 'badge';
        $category = $input['category'] ?? null;
        $rarity = $input['rarity'] ?? 'common';
        $trigger_type = $input['trigger_type'] ?? null;
        $trigger_condition = isset($input['trigger_condition']) ? json_encode($input['trigger_condition']) : null;
        $xp_amount = isset($input['xp_amount']) ? intval($input['xp_amount']) : 0;
        $ep_amount = isset($input['ep_amount']) ? intval($input['ep_amount']) : 0;
        $is_active = isset($input['is_active']) ? intval($input['is_active']) : 1;
        $image_url = $input['image'] ?? null;

        $stmt = $conn->prepare("INSERT INTO rewards (attraction_id, reward_type, reward_identifier, title, description, image, category, rarity, trigger_type, trigger_condition, xp_amount, ep_amount, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssssssssiii", $attraction_id, $reward_type, $reward_identifier, $input['title'], $input['description'], $image_url, $category, $rarity, $trigger_type, $trigger_condition, $xp_amount, $ep_amount, $is_active);

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
    
    // UPDATE reward
    elseif ($action === 'update') {
        if (!isset($input['id']) || !validateRequired($input, ['title', 'description', 'reward_type'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID, title, description, and reward type are required.'
            ]);
            $conn->close();
            exit();
        }

        $id = intval($input['id']);
        
        // Prepare values
        $attraction_id = isset($input['attraction_id']) && $input['attraction_id'] !== '' ? intval($input['attraction_id']) : null;
        $reward_type = $input['reward_type'] ?? 'badge';
        $reward_identifier = $input['reward_identifier'] ?? null;
        $category = $input['category'] ?? null;
        $rarity = $input['rarity'] ?? 'common';
        $trigger_type = $input['trigger_type'] ?? null;
        $trigger_condition = isset($input['trigger_condition']) ? json_encode($input['trigger_condition']) : null;
        $xp_amount = isset($input['xp_amount']) ? intval($input['xp_amount']) : 0;
        $ep_amount = isset($input['ep_amount']) ? intval($input['ep_amount']) : 0;
        $is_active = isset($input['is_active']) ? intval($input['is_active']) : 1;
        $image_url = $input['image'] ?? null;

        $stmt = $conn->prepare("UPDATE rewards SET attraction_id = ?, reward_type = ?, reward_identifier = ?, title = ?, description = ?, image = ?, category = ?, rarity = ?, trigger_type = ?, trigger_condition = ?, xp_amount = ?, ep_amount = ?, is_active = ? WHERE id = ?");
        $stmt->bind_param("isssssssssiii", $attraction_id, $reward_type, $reward_identifier, $input['title'], $input['description'], $image_url, $category, $rarity, $trigger_type, $trigger_condition, $xp_amount, $ep_amount, $is_active, $id);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Reward updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error updating reward: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    
    // DELETE reward
    elseif ($action === 'delete') {
        if (!isset($input['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID is required for deleting a reward.'
            ]);
            $conn->close();
            exit();
        }

        $id = intval($input['id']);
        $stmt = $conn->prepare("DELETE FROM rewards WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Reward deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting reward: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    
    // TOGGLE ACTIVE status
    elseif ($action === 'toggle_active') {
        if (!isset($input['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID is required.'
            ]);
            $conn->close();
            exit();
        }

        $id = intval($input['id']);
        $is_active = isset($input['is_active']) ? intval($input['is_active']) : 1;

        $stmt = $conn->prepare("UPDATE rewards SET is_active = ? WHERE id = ?");
        $stmt->bind_param("ii", $is_active, $id);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Reward status updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error updating status: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid action'
        ]);
    }
}

else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}

$conn->close();
?>
