<?php
// reports.php
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
// but the core filtering in GET/POST for reports is removed.
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

// GET - List all reports or get single report
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Base query - Join reports with attractions to get attraction name
        $query = "SELECT r.*, a.name as attraction_name FROM reports r LEFT JOIN attractions a ON r.attraction_id = a.id";

        $params = [];
        $types = "";

        // Apply status filter
        $status_filter = $_GET['status'] ?? '';
        if ($status_filter !== '') {
            // Determine if WHERE or AND is needed based on previous filters (none in this base query)
            $query .= " WHERE r.status = ?";
            $params[] = $status_filter;
            $types .= "s"; // One string parameter for the status
        }

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

            // Determine if WHERE or AND is needed based on previous filters (status)
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
        $reports = [];

        while ($row = $result->fetch_assoc()) {
            $reports[] = $row;
        }

        echo json_encode([
            'success' => true,
            'reports' => $reports
        ]);
        $stmt->close();
    }
    elseif ($action === 'get' && isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $query = "SELECT r.*, a.name as attraction_name FROM reports r LEFT JOIN attractions a ON r.attraction_id = a.id WHERE r.id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $report = $result->fetch_assoc();

            // No specific access check needed here based on manager assignment anymore.
            // Any logged-in admin (manager or superadmin) can view any report details.

            echo json_encode([
                'success' => true,
                'report' => $report
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Report not found'
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
// POST - Reply to report, Delete report, Bulk Delete reports
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? '';

    // Reply to report
    if ($action === 'reply') {
        if (!isset($input['id']) || !isset($input['reply'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Report ID and reply message are required'
            ]);
            exit();
        }

        // No specific check needed for manager replying to a report based on 'admin.attraction_id'.
        // Any logged-in admin can reply to any report.
        // You might add logic here to check if the report exists before attempting to reply.

        // Optional: Verify the report exists before attempting reply (adds robustness)
        $verify_stmt = $conn->prepare("SELECT id FROM reports WHERE id = ?");
        $verify_stmt->bind_param("i", $input['id']);
        $verify_stmt->execute();
        $verify_result = $verify_stmt->get_result();

        if (!$verify_result || $verify_result->num_rows !== 1) {
             echo json_encode([
                'success' => false,
                'message' => 'Report not found.'
            ]);
            $verify_stmt->close();
            $conn->close();
            exit();
        }
        $verify_stmt->close(); // Close the verification statement

        $stmt = $conn->prepare("UPDATE reports SET reply = ?, status = 'Replied', replied_at = NOW() WHERE id = ?");
        $stmt->bind_param("si", $input['reply'], $input['id']);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Reply sent successfully'
                ]);
            } else {
                // Shouldn't happen if verification passed, but good to check
                 echo json_encode([
                    'success' => false,
                    'message' => 'Report not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error sending reply: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Delete report (single)
    elseif ($action === 'delete') {
        if (!isset($input['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'ID is required'
            ]);
            exit();
        }

        // No specific check needed for manager deleting a report based on 'admin.attraction_id'.
        // Any logged-in admin can delete any report.
        // You might add logic here to check if the report exists before attempting deletion.

         // Optional: Verify the report exists before attempting delete (adds robustness)
         $verify_stmt = $conn->prepare("SELECT id FROM reports WHERE id = ?");
         $verify_stmt->bind_param("i", $input['id']);
         $verify_stmt->execute();
         $verify_result = $verify_stmt->get_result();

         if (!$verify_result || $verify_result->num_rows !== 1) {
              echo json_encode([
                 'success' => false,
                 'message' => 'Report not found.'
             ]);
             $verify_stmt->close();
             $conn->close();
             exit();
         }
         $verify_stmt->close(); // Close the verification statement

        $stmt = $conn->prepare("DELETE FROM reports WHERE id = ?");
        $stmt->bind_param("i", $input['id']);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Report deleted successfully'
                ]);
            } else {
                // Shouldn't happen if verification passed, but good to check
                 echo json_encode([
                    'success' => false,
                    'message' => 'Report not found.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting report: ' . $conn->error
            ]);
        }
        $stmt->close();
    }
    // Bulk Delete reports
    elseif ($action === 'bulk_delete') {
        if (!isset($input['ids']) || !is_array($input['ids']) || empty($input['ids'])) {
            echo json_encode([
                'success' => false,
                'message' => 'No report IDs provided for bulk delete.'
            ]);
            exit();
        }

        // Validate and sanitize IDs (ensure they are integers)
        $ids = array_map('intval', $input['ids']); // Convert all to integers
        $ids = array_filter($ids, function($id) { return $id > 0; }); // Remove any non-positive values

        if (empty($ids)) {
             echo json_encode([
                'success' => false,
                'message' => 'Invalid report IDs provided for bulk delete.'
            ]);
            exit();
        }

        // Create placeholders for the IN clause (?, ?, ? ...)
        $placeholders = str_repeat('?,', count($ids) - 1) . '?';

        $query = "DELETE FROM reports WHERE id IN ($placeholders)";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            // Create the type string for bind_param (e.g., "iii" for 3 integers)
            $types = str_repeat('i', count($ids));
            // Bind the array of IDs
            $stmt->bind_param($types, ...$ids);

            if ($stmt->execute()) {
                $deleted_count = $stmt->affected_rows;
                echo json_encode([
                    'success' => true,
                    'message' => "Successfully deleted $deleted_count report(s)."
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Error deleting reports: ' . $conn->error
                ]);
            }
            $stmt->close();
        } else {
             echo json_encode([
                'success' => false,
                'message' => 'Error preparing statement for bulk delete: ' . $conn->error
            ]);
        }
    } else {
         echo json_encode([
            'success' => false,
            'message' => 'Unknown action requested for POST.'
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