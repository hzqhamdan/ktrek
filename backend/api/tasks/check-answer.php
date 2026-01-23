<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$data = json_decode(file_get_contents("php://input"), true);

$question_id = isset($data['question_id']) ? intval($data['question_id']) : 0;
$selected_option_id = isset($data['selected_option_id']) ? intval($data['selected_option_id']) : 0;

if ($question_id <= 0 || $selected_option_id <= 0) {
    Response::error("Question ID and selected option ID are required", 400);
}

try {
    // Check if selected option is correct
    $query = "SELECT is_correct FROM quiz_options WHERE id = :option_id AND question_id = :question_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':option_id', $selected_option_id);
    $stmt->bindParam(':question_id', $question_id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        Response::error("Invalid option or question", 400);
    }
    
    $option = $stmt->fetch();
    $is_correct = (bool)$option['is_correct'];
    
    // Get the correct option ID
    $query = "SELECT id as option_id FROM quiz_options WHERE question_id = :question_id AND is_correct = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':question_id', $question_id);
    $stmt->execute();
    $correctOption = $stmt->fetch();
    
    Response::success([
        'is_correct' => $is_correct,
        'selected_option_id' => $selected_option_id,
        'correct_option_id' => $correctOption ? $correctOption['option_id'] : null
    ], "Answer checked successfully");

} catch (PDOException $e) {
    error_log("Check answer error: " . $e->getMessage());
    Response::serverError("Failed to check answer");
}
?>
