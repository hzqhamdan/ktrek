<?php
require_once '../config.php';

session_start();
if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_role'])) {
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

$admin_id = $_SESSION['admin_id'];
$admin_role = $_SESSION['admin_role'];

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

$task_id = isset($input['task_id']) ? intval($input['task_id']) : null;

/* ===========================
   GET REQUESTS
=========================== */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $action = $_GET['action'] ?? 'list';

    /* ==== LIST GUIDES ==== */
    if ($action === 'list') {

        $query = "SELECT g.*, a.name AS attraction_name 
                  FROM guides g 
                  LEFT JOIN attractions a ON g.attraction_id = a.id";

        $params = [];
        $types  = "";

        if ($admin_role === 'manager') {
            $query .= " WHERE a.created_by_admin_id = ?";
            $params[] = $admin_id;
            $types .= "i";
        }

        if (!empty($_GET['search'])) {
            $search = "%" . $_GET['search'] . "%";
            $query .= (strpos($query, "WHERE") !== false ? " AND" : " WHERE");
            $query .= " (g.title LIKE ? OR g.content LIKE ?)";
            $params[] = $search;
            $params[] = $search;
            $types .= "ss";
        }

        if (!empty($_GET['attraction_id'])) {
            $query .= (strpos($query, "WHERE") !== false ? " AND" : " WHERE");
            $query .= " g.attraction_id = ?";
            $params[] = intval($_GET['attraction_id']);
            $types .= "i";
        }

        $query .= " ORDER BY g.created_at DESC";

        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();

        $result = $stmt->get_result();
        $guides = [];

        while ($row = $result->fetch_assoc()) {
            $guides[] = $row;
        }

        echo json_encode(['success' => true, 'guides' => $guides]);
        $stmt->close();
    }

    /* ==== GET SINGLE GUIDE ==== */
    elseif ($action === 'get' && isset($_GET['id'])) {

        $id = intval($_GET['id']);

        $stmt = $conn->prepare(
            "SELECT g.*, a.name as attraction_name, a.created_by_admin_id 
             FROM guides g 
             LEFT JOIN attractions a ON g.attraction_id = a.id 
             WHERE g.id = ?"
        );

        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {

            $guide = $result->fetch_assoc();

            if ($admin_role === 'manager' && $guide['created_by_admin_id'] != $admin_id) {
                echo json_encode(['success' => false, 'message' => 'Access denied.']);
                exit();
            }

            echo json_encode(['success' => true, 'guide' => $guide]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Guide not found']);
        }

        $stmt->close();
    }

    else {
        echo json_encode(['success' => false, 'message' => 'Invalid GET action']);
    }
}

/* ===========================
   POST REQUESTS
=========================== */
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $action = $input['action'] ?? '';

    /* ==== CREATE GUIDE ==== */
    if ($action === 'create') {

        if ($admin_role === 'manager') {
            $check = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
            $check->bind_param("i", $input['attraction_id']);
            $check->execute();
            $res = $check->get_result()->fetch_assoc();

            if ($res['created_by_admin_id'] != $admin_id) {
                echo json_encode(['success' => false, 'message' => 'Access denied']);
                exit();
            }
        }

        $stmt = $conn->prepare(
            "INSERT INTO guides (attraction_id, task_id, title, content) 
             VALUES (?, ?, ?, ?)"
        );

        $stmt->bind_param(
            "iiss",
            $input['attraction_id'],
            $task_id,
            $input['title'],
            $input['content']
        );

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Guide created successfully',
                'id' => $conn->insert_id
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => $conn->error]);
        }

        $stmt->close();
    }

    /* ==== UPDATE GUIDE ==== */
    elseif ($action === 'update') {

        $id = intval($input['id']);

        if ($admin_role === 'manager') {

            $guideCheck = $conn->prepare("SELECT attraction_id FROM guides WHERE id = ?");
            $guideCheck->bind_param("i", $id);
            $guideCheck->execute();
            $guideRes = $guideCheck->get_result()->fetch_assoc();

            $attrCheck = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
            $attrCheck->bind_param("i", $guideRes['attraction_id']);
            $attrCheck->execute();
            $attrRes = $attrCheck->get_result()->fetch_assoc();

            if ($attrRes['created_by_admin_id'] != $admin_id) {
                echo json_encode(['success' => false, 'message' => 'Access denied']);
                exit();
            }
        }

        $stmt = $conn->prepare(
            "UPDATE guides 
             SET attraction_id = ?, 
                 task_id = ?, 
                 title = ?, 
                 content = ?, 
                 updated_at = NOW() 
             WHERE id = ?"
        );

        $stmt->bind_param(
            "iissi",
            $input['attraction_id'],
            $task_id,
            $input['title'],
            $input['content'],
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Guide updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => $conn->error]);
        }

        $stmt->close();
    }

    /* ==== DELETE GUIDE ==== */
    elseif ($action === 'delete') {

        $id = intval($input['id']);

        if ($admin_role === 'manager') {

            $guideCheck = $conn->prepare("SELECT attraction_id FROM guides WHERE id = ?");
            $guideCheck->bind_param("i", $id);
            $guideCheck->execute();
            $guideRes = $guideCheck->get_result()->fetch_assoc();

            $attrCheck = $conn->prepare("SELECT created_by_admin_id FROM attractions WHERE id = ?");
            $attrCheck->bind_param("i", $guideRes['attraction_id']);
            $attrCheck->execute();
            $attrRes = $attrCheck->get_result()->fetch_assoc();

            if ($attrRes['created_by_admin_id'] != $admin_id) {
                echo json_encode(['success' => false, 'message' => 'Access denied']);
                exit();
            }
        }

        $stmt = $conn->prepare("DELETE FROM guides WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Guide deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => $conn->error]);
        }

        $stmt->close();
    }

    else {
        echo json_encode(['success' => false, 'message' => 'Invalid POST action']);
    }
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>
