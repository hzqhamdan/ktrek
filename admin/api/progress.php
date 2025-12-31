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

// Helper function to get manager's assigned attraction ID (NOT USED anymore for filtering main lists)
// We keep it in case other parts of the system still rely on it for other purposes,
// but the core filtering in GET/POST for progress is removed.
/*
function getManagerAttractionId($conn, $admin_id) {
    $stmt = $conn->prepare("SELECT attraction_id FROM admin WHERE id = ?");
    $stmt->bind_param("i", $admin_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return $row ? $row['attraction_id'] : null;
}
*/

// GET - List all progress records or get single user's progress for all attractions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Base query - Join progress with attractions to get attraction name
        $query = "SELECT p.*, a.name as attraction_name FROM progress p LEFT JOIN attractions a ON p.attraction_id = a.id";

        // Apply attraction filter (filter by specific attraction ID) - Available for all roles now
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

            $query .= " WHERE p.attraction_id = ?";
            $params = [(int)$attraction_filter_id]; // Cast to int for safety
            $types = "i"; // One integer parameter for the attraction ID
        } else {
            $params = [];
            $types = "";
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

        // Query for a specific user's progress across *all* attractions
        // For superadmin: all attractions
        // For manager: all attractions (as access control based on admin.attraction_id is removed)
        $query = "SELECT p.*, a.name as attraction_name FROM progress p LEFT JOIN attractions a ON p.attraction_id = a.id WHERE p.firebase_user_id = ?";
        $params = [$firebase_user_id];
        $types = "s"; // One string parameter for firebase_user_id

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