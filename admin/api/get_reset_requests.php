<?php
/**
 * Get Password Reset Requests API
 * Returns all pending password reset requests for superadmin
 */

session_start();
header('Content-Type: application/json');

require_once '../config.php';

// Check if user is superadmin
if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'superadmin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$status = $_GET['status'] ?? 'pending'; // pending, approved, rejected, all

try {
    $conn = getDBConnection();
    
    $query = "SELECT 
                r.id,
                r.admin_id,
                r.requested_by_email,
                r.status,
                r.request_message,
                r.requested_at,
                r.processed_at,
                r.notes,
                a.full_name as manager_name,
                a.email as manager_email,
                p.full_name as processed_by_name
              FROM admin_password_reset_requests r
              JOIN admin a ON r.admin_id = a.id
              LEFT JOIN admin p ON r.processed_by = p.id";
    
    if ($status !== 'all') {
        $query .= " WHERE r.status = ?";
    }
    
    $query .= " ORDER BY r.requested_at DESC";
    
    if ($status !== 'all') {
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $status);
    } else {
        $stmt = $conn->prepare($query);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'requests' => $requests,
        'count' => count($requests)
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error fetching requests: ' . $e->getMessage()]);
}
