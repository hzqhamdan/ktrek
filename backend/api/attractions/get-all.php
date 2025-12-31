<?php

require_once '../../config/cors.php';
require_once '../../config/constants.php';
require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/url.php';

// Only accept GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Verify authentication
$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

try {
    // Get all attractions with task count and user progress
    $query = "SELECT 
                a.id,
                a.name,
                a.location,
              a.latitude,
              a.longitude,
              a.navigation_link,
                a.description,
                a.image,
                COUNT(DISTINCT t.id) as total_tasks,
                COALESCE(p.completed_tasks, 0) as completed_tasks,
                COALESCE(p.progress_percentage, 0) as progress_percentage,
                COALESCE(p.is_unlocked, 0) as reward_unlocked
              FROM attractions a
              LEFT JOIN tasks t ON a.id = t.attraction_id
              LEFT JOIN progress p ON a.id = p.attraction_id AND p.user_id = :user_id
              GROUP BY a.id, a.name, a.location, a.latitude, a.longitude, a.navigation_link, a.description, a.image, 
                       p.completed_tasks, p.progress_percentage, p.is_unlocked
              ORDER BY a.name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();

    $attractions = $stmt->fetchAll();
	
    // Normalize image URLs
    foreach ($attractions as &$a) {
        $a['image'] = ktrek_normalize_image_url($a['image'] ?? null);
    }
	
    Response::success($attractions, "Attractions retrieved successfully");

} catch (PDOException $e) {
    error_log("Get attractions error: " . $e->getMessage());
    Response::serverError("Failed to retrieve attractions");
}
?>