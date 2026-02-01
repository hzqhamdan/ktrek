<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$attraction_id = isset($_GET['attraction_id']) ? intval($_GET['attraction_id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

try {
    $query = "SELECT 
                p.*,
                a.name as attraction_name,
                a.image as attraction_image
              FROM progress p
              JOIN attractions a ON p.attraction_id = a.id
              WHERE p.user_id = :user_id 
              AND p.attraction_id = :attraction_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':attraction_id', $attraction_id);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        Response::success([
            'completed_tasks' => 0,
            'total_tasks' => 0,
            'progress_percentage' => 0,
            'is_unlocked' => false
        ], "No progress yet");
    }

    $progress = $stmt->fetch();

	// Fix image URL - images are stored in admin/uploads directory
	if (!empty($progress['attraction_image'])) {
		// If image path doesn't start with http, construct full URL
		if (!preg_match('/^https?:\/\//', $progress['attraction_image'])) {
			$imagePath = $progress['attraction_image'];
			// Remove leading slash if present to avoid double slashes
			$imagePath = ltrim($imagePath, '/');
			// If path doesn't start with 'admin/', add it
			if (strpos($imagePath, 'admin/') !== 0 && strpos($imagePath, 'uploads/') === 0) {
				$imagePath = 'admin/' . $imagePath;
			}
			$progress['attraction_image'] = "http://localhost/" . $imagePath;
		}
	}

    Response::success($progress, "Attraction progress retrieved");

} catch (PDOException $e) {
    error_log("Get attraction progress error: " . $e->getMessage());
    Response::serverError("Failed to retrieve progress");
}
?>