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
    $query = "SELECT * FROM guides WHERE attraction_id = :attraction_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':attraction_id', $attraction_id);
    $stmt->execute();

    $guides = $stmt->fetchAll();

    Response::success($guides, "Guides retrieved");

} catch (PDOException $e) {
    error_log("Get guides error: " . $e->getMessage());
    Response::serverError("Failed to retrieve guides");
}
?>