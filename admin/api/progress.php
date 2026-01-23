<?php
// api/progress.php
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

// Helper: get manager's assigned attraction ID (legacy mapping)
function getManagerAttractionId($conn, $admin_id) {
    $stmt = $conn->prepare("SELECT attraction_id FROM admin WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $admin_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result ? $result->fetch_assoc() : null;
    $stmt->close();
    return $row ? $row['attraction_id'] : null;
}

// Helper: get list of attraction IDs that the manager is allowed to view
// Rule:
// 1) Prefer attractions created by this manager (attractions.created_by_admin_id)
// 2) Backward compatibility: include admin.attraction_id if set
function getManagerAllowedAttractionIds($conn, $admin_id) {
    $ids = [];

    // Created attractions
    $stmt = $conn->prepare("SELECT id FROM attractions WHERE created_by_admin_id = ?");
    $stmt->bind_param("i", $admin_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $ids[] = (int)$row['id'];
        }
    }
    $stmt->close();

    // Legacy assignment
    $assigned = getManagerAttractionId($conn, $admin_id);
    if ($assigned !== null && $assigned !== '') {
        $ids[] = (int)$assigned;
    }

    // De-duplicate
    // Use a classic anonymous function for compatibility with older PHP versions (pre-7.4)
    $ids = array_values(array_unique(array_filter($ids, function ($v) { return $v !== 0; })));

    return $ids;
}

// GET - List all progress records or get single user's progress for all attractions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Base query - Join progress with attractions to get attraction name
        $query = "SELECT p.*, a.name as attraction_name FROM progress p LEFT JOIN attractions a ON p.attraction_id = a.id";

        // Apply attraction filter
        // Superadmin: can see all (optionally filter by attraction_id)
        // Manager: MUST be restricted to their own attraction(s)
        $attraction_filter_id = $_GET['attraction_id'] ?? '';

        $params = [];
        $types = "";

        if ($admin_role === 'manager') {
            $allowedIds = getManagerAllowedAttractionIds($conn, $admin_id);
            if (count($allowedIds) === 0) {
                echo json_encode([
                    'success' => false,
                    'message' => 'No attraction is assigned to your manager account.'
                ]);
                $conn->close();
                exit();
            }

            // If manager explicitly requests an attraction_id, enforce it's allowed
            if ($attraction_filter_id !== '') {
                if (!is_numeric($attraction_filter_id)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid attraction ID provided for filter.'
                    ]);
                    $conn->close();
                    exit();
                }

                $requested = (int)$attraction_filter_id;
                if (!in_array($requested, $allowedIds, true)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied for this attraction.'
                    ]);
                    $conn->close();
                    exit();
                }

                $query .= " WHERE p.attraction_id = ?";
                $params[] = $requested;
                $types .= "i";
            } else {
                // No specific attraction requested: restrict to allowed list
                $placeholders = implode(',', array_fill(0, count($allowedIds), '?'));
                $query .= " WHERE p.attraction_id IN ($placeholders)";
                $params = array_merge($params, $allowedIds);
                $types .= str_repeat('i', count($allowedIds));
            }
        } else {
            // superadmin/others: optional filter
            if ($attraction_filter_id !== '') {
                if (!is_numeric($attraction_filter_id)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid attraction ID provided for filter.'
                    ]);
                    $conn->close();
                    exit();
                }

                $query .= " WHERE p.attraction_id = ?";
                $params[] = (int)$attraction_filter_id;
                $types .= "i";
            }
        }

        $query .= " ORDER BY p.updated_at DESC"; // Order by last update
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $progress_records = [];

        while ($row = $result->fetch_assoc()) {
            $progress_records[] = $row;
        }

        echo json_encode([
            'success' => true,
            'progress' => $progress_records
        ]);
        $stmt->close();
    }
    elseif ($action === 'get' && isset($_GET['firebase_user_id'])) {
        $firebase_user_id = $_GET['firebase_user_id'];

        // Query for a specific user's progress
        // Superadmin: all attractions
        // Manager: only their allowed attraction(s)
        $query = "SELECT p.*, a.name as attraction_name FROM progress p LEFT JOIN attractions a ON p.attraction_id = a.id WHERE p.firebase_user_id = ?";
        $params = [$firebase_user_id];
        $types = "s"; // One string parameter for firebase_user_id

        if ($admin_role === 'manager') {
            $allowedIds = getManagerAllowedAttractionIds($conn, $admin_id);
            if (count($allowedIds) === 0) {
                echo json_encode([
                    'success' => false,
                    'message' => 'No attraction is assigned to your manager account.'
                ]);
                $conn->close();
                exit();
            }

            $placeholders = implode(',', array_fill(0, count($allowedIds), '?'));
            $query .= " AND p.attraction_id IN ($placeholders)";
            $params = array_merge($params, $allowedIds);
            $types .= str_repeat('i', count($allowedIds));
        }

        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $user_progress = [];

        while ($row = $result->fetch_assoc()) {
            $user_progress[] = $row;
        }

        if (!empty($user_progress)) {
            echo json_encode([
                'success' => true,
                'progress' => $user_progress
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No progress found for this user.'
            ]);
        }
        $stmt->close();
    } else {
         echo json_encode([
            'success' => false,
            'message' => 'Invalid action or missing parameters for GET request.'
        ]);
    }
}

// POST - Currently no POST actions defined for progress by admin, maybe update unlock status in future?
// For now, only GET is needed based on SRS "View user's progress"
else {
     echo json_encode([
        'success' => false,
        'message' => 'Invalid request method for this endpoint. Use GET.'
    ]);
}

$conn->close();
?>