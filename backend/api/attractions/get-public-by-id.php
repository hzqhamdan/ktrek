<?php

require_once '../../config/cors.php';
require_once '../../config/constants.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/url.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    Response::error("Invalid attraction ID", 400);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    $query = "SELECT id, name, location, description, image, latitude, longitude, navigation_link, created_at, updated_at 
              FROM attractions 
              WHERE id = :id 
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        Response::error("Attraction not found", 404);
    }
    
    $attraction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Normalize image URL
    $attraction['image'] = ktrek_normalize_image_url($attraction['image'] ?? null);
    
    Response::success($attraction, "Attraction retrieved successfully", 200);
    
} catch (PDOException $e) {
    error_log("Error fetching attraction: " . $e->getMessage());
    Response::serverError("Failed to fetch attraction");
}
?>