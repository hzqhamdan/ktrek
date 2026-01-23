<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/reward-helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();
$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$data = json_decode(file_get_contents("php://input"), true);
$task_id = isset($data['task_id']) ? intval($data['task_id']) : 0;
$checkpoints_visited = isset($data['checkpoints_visited']) ? $data['checkpoints_visited'] : [];

if ($task_id <= 0 || empty($checkpoints_visited)) {
    Response::error("Task ID and checkpoints are required", 400);
}

try {
    $db->beginTransaction();

    $query = "SELECT t.*, a.id as attraction_id, a.category
              FROM tasks t JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'route_completion'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Route completion task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get required checkpoints from quiz_options
    $query = "SELECT qo.id, qo.option_text
              FROM quiz_questions qq JOIN quiz_options qo ON qo.question_id = qq.id
              WHERE qq.task_id = :task_id ORDER BY qo.option_order";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $required = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalCheckpoints = count($required);
    $visitedCount = count($checkpoints_visited);
    $is_correct = $visitedCount >= $totalCheckpoints;

    // Check if already submitted
    $query = "SELECT id FROM user_task_submissions WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("Already submitted", 400);
    }

    $score = ($visitedCount / $totalCheckpoints) * 100;

    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, answer, score, is_correct, submitted_at)
              VALUES (:user_id, :task_id, :answer, :score, :is_correct, NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $answer = json_encode(['checkpoints' => $checkpoints_visited]);
    $stmt->bindParam(':answer', $answer);
    $stmt->bindParam(':score', $score);
    $stmt->bindParam(':is_correct', $is_correct, PDO::PARAM_BOOL);
    $stmt->execute();

    $rewards = null;
    if ($is_correct) {
        $rewards = RewardHelper::awardTaskCompletion($db, $user['id'], $task_id, 
                   $task['attraction_id'], $task['category'], 'route_completion');
    }

    $query = "INSERT INTO progress (user_id, attraction_id, task_id, completed_at)
              VALUES (:user_id, :attraction_id, :task_id, NOW())
              ON DUPLICATE KEY UPDATE completed_at = NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':attraction_id', $task['attraction_id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    $db->commit();

    Response::success([
        'is_correct' => $is_correct,
        'score' => round($score, 2),
        'visited_count' => $visitedCount,
        'total_checkpoints' => $totalCheckpoints,
        'message' => $is_correct ? "Route completed!" : "Visit all checkpoints to complete",
        'rewards' => $rewards,
        'attraction_id' => $task['attraction_id']
    ], "Route submission successful", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Route completion error: " . $e->getMessage());
    Response::serverError("Failed to submit route");
}
?>
