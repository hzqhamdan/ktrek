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

$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : 0;

if ($task_id <= 0) {
    Response::error("Invalid task ID", 400);
}

try {
    // Verify task exists and is a quiz-backed type
    $query = "SELECT type FROM tasks WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        Response::notFound("Task not found");
    }
    
    $task = $stmt->fetch();
    $quizBackedTypes = ['quiz', 'observation_match', 'riddle', 'memory_recall', 'direction'];
    if (!in_array($task['type'], $quizBackedTypes, true)) {
        Response::error("This task does not use quiz questions", 400);
    }

    // Get quiz questions with options
    $query = "SELECT 
                q.id as question_id,
                q.question_text,
                q.question_order
              FROM quiz_questions q
              WHERE q.task_id = :task_id
              ORDER BY q.question_order ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $questions = $stmt->fetchAll();

    // Get options for each question
    foreach ($questions as &$question) {
        $query = "SELECT 
                    id as option_id,
                    option_text,
                    option_order,
                    is_correct,
                    option_metadata
                  FROM quiz_options
                  WHERE question_id = :question_id
                  ORDER BY option_order ASC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':question_id', $question['question_id']);
        $stmt->execute();
        $question['options'] = $stmt->fetchAll();
    }

    Response::success([
        'task_id' => $task_id,
        'questions' => $questions
    ], "Quiz retrieved successfully");

} catch (PDOException $e) {
    error_log("Get quiz error: " . $e->getMessage());
    Response::serverError("Failed to retrieve quiz");
}
?>