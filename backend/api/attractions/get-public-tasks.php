<?php

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

$attraction_id = isset($_GET['attraction_id']) ? intval($_GET['attraction_id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

if ($attraction_id <= 0) {
    Response::error("Invalid attraction ID", 400);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    // Get all tasks for this attraction (public view - no completion status)
    $query = "SELECT id, attraction_id, name, type, description, created_at 
              FROM tasks 
              WHERE attraction_id = :attraction_id 
              ORDER BY created_at ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':attraction_id', $attraction_id);
    $stmt->execute();
    
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    Response::success($tasks, "Tasks retrieved successfully", 200);
    
} catch (PDOException $e) {
    error_log("Error fetching tasks: " . $e->getMessage());
    Response::serverError("Failed to fetch tasks");
}
?>