<?php
require_once '../../config/cors.php';
require_once '../../config/constants.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/url.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    // Get all attractions (public - no authentication required)
    $query = "SELECT id, name, location, description, image, latitude, longitude, navigation_link, created_at 
              FROM attractions 
              ORDER BY created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $attractions = $stmt->fetchAll(PDO::FETCH_ASSOC);


    // Normalize image URLs
    foreach ($attractions as &$a) {
        $a['image'] = ktrek_normalize_image_url($a['image'] ?? null);
    }

    
    // Return success response
    Response::success($attractions, "Attractions retrieved successfully", 200);
    
} catch (PDOException $e) {
    error_log("Error fetching public attractions: " . $e->getMessage());
    Response::serverError("Failed to fetch attractions");
}
?>