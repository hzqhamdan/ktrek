<?php
require_once '../../config/cors.php';
// ktrek-backend/api/attractions/get-tasks.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

// Optional authentication
$authMiddleware = new AuthMiddleware($db);
$user = $authMiddleware->optionalSession();

$attraction_id = isset($_GET['attraction_id']) ? intval($_GET['attraction_id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

if ($attraction_id <= 0) {
    Response::error("Invalid attraction ID", 400);
}

try {
    if ($user) {
        // Authenticated user - include completion status
        $query = "SELECT 
                    t.id,
                    t.attraction_id,
                    t.name,
                    t.type,
                    t.description,
                    t.created_at,
                    CASE WHEN uts.id IS NOT NULL THEN 1 ELSE 0 END as is_completed
                  FROM tasks t
                  LEFT JOIN user_task_submissions uts 
                    ON t.id = uts.task_id AND uts.user_id = :user_id
                  WHERE t.attraction_id = :attraction_id
                  ORDER BY t.created_at ASC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':attraction_id', $attraction_id);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
    } else {
        // Guest user - just task list
        $query = "SELECT 
                    id,
                    attraction_id,
                    name,
                    type,
                    description,
                    created_at,
                    0 as is_completed
                  FROM tasks
                  WHERE attraction_id = :attraction_id
                  ORDER BY created_at ASC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':attraction_id', $attraction_id);
        $stmt->execute();
    }
    
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    Response::success($tasks ?: [], "Tasks retrieved successfully", 200);
    
} catch (PDOException $e) {
    error_log("Error fetching tasks: " . $e->getMessage());
    Response::serverError("Failed to fetch tasks");
}
?>