<?php
// ktrek-backend/api/attractions/get-by-id.php

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

// Optional authentication (works for both logged in and guest users)
$authMiddleware = new AuthMiddleware($db);
$user = $authMiddleware->optionalSession(); // Returns user or null

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    Response::error("Invalid attraction ID", 400);
}

try {
    if ($user) {
        // Authenticated user - include progress and manager info
        $query = "SELECT 
                    a.id,
                    a.name,
                    a.location,
                    a.description,
                    a.image,
                    a.latitude,
                    a.longitude,
                    a.navigation_link,
                    a.created_at,
                    a.updated_at,
                    COALESCE(p.completed_tasks, 0) as completed_tasks,
                    COALESCE(p.total_tasks, 0) as total_tasks,
                    COALESCE(p.progress_percentage, 0) as progress_percentage,
                    adm.full_name as manager_name
                  FROM attractions a
                  LEFT JOIN progress p ON a.id = p.attraction_id AND p.user_id = :user_id
                  LEFT JOIN admin adm ON a.created_by_admin_id = adm.id
                  WHERE a.id = :id
                  LIMIT 1";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
    } else {
        // Guest user - basic info with manager name
        $query = "SELECT 
                    a.id, 
                    a.name, 
                    a.location, 
                    a.description, 
                    a.image, 
                    a.latitude, 
                    a.longitude, 
                    a.navigation_link, 
                    a.created_at, 
                    a.updated_at,
                    adm.full_name as manager_name
                  FROM attractions a
                  LEFT JOIN admin adm ON a.created_by_admin_id = adm.id
                  WHERE a.id = :id 
                  LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }
    
    if ($stmt->rowCount() === 0) {
        Response::error("Attraction not found", 404);
    }
    
    $attraction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    Response::success($attraction, "Attraction retrieved successfully", 200);
    
} catch (PDOException $e) {
    error_log("Error fetching attraction: " . $e->getMessage());
    Response::serverError("Failed to fetch attraction");
}
?>