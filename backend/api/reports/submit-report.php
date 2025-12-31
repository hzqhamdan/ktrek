<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$data = json_decode(file_get_contents("php://input"), true);

$message = isset($data['message']) ? Security::sanitize($data['message']) : '';
$attraction_id = isset($data['attraction_id']) ? intval($data['attraction_id']) : null;

if (empty($message)) {
    Response::error("Message is required", 400);
}

try {
    $query = "INSERT INTO reports 
              (user_id, firebase_user_email, attraction_id, message, status) 
              VALUES (:user_id, :email, :attraction_id, :message, 'Pending')";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':email', $user['email']);
    $stmt->bindParam(':attraction_id', $attraction_id);
    $stmt->bindParam(':message', $message);
    $stmt->execute();

    Response::success(null, "Report submitted successfully", 201);

} catch (PDOException $e) {
    error_log("Submit report error: " . $e->getMessage());
    Response::serverError("Failed to submit report");
}
?>