<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::error("Database connection failed", 500);
}

// Get task_id from query params
$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : 0;

if ($task_id <= 0) {
    Response::error("Invalid task ID", 400);
}

try {
    // Get guides for specific task
    $query = "SELECT id, attraction_id, task_id, title, content, created_at, updated_at 
              FROM guides 
              WHERE task_id = :task_id 
              ORDER BY created_at ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    $guides = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    Response::success($guides, "Guides retrieved successfully");
    
} catch (PDOException $e) {
    error_log("Get guides by task error: " . $e->getMessage());
    Response::error("Failed to retrieve guides", 500);
}
?>
