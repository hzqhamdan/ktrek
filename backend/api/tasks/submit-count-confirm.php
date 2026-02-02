<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/reward-helper.php';
require_once '../../utils/checkin-helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();

$data = json_decode(file_get_contents("php://input"), true);

$task_id = isset($data['task_id']) ? intval($data['task_id']) : 0;
$user_count = isset($data['count']) ? intval($data['count']) : null;

if ($task_id <= 0) {
    Response::error("Task ID is required", 400);
}

if ($user_count === null || $user_count < 0) {
    Response::error("Valid count is required", 400);
}

try {
    $db->beginTransaction();

    // 1. Get task details and configuration
    $query = "SELECT t.*, a.name as attraction_name, a.id as attraction_id, a.category
              FROM tasks t
              JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'count_confirm'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Count & Confirm task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    $task_config = json_decode($task['task_config'], true);

    // Debug: Log the task config
    error_log("Task ID: {$task_id}, task_config raw: " . $task['task_config']);
    error_log("Task config decoded: " . print_r($task_config, true));

    // Check if user has checked in to this attraction first
    if (!CheckinHelper::hasCheckedIn($db, $user['id'], $task['attraction_id'])) {
        $db->rollBack();
        $checkin_task_id = CheckinHelper::getCheckinTaskId($db, $task['attraction_id']);
        Response::error("Please check in to this attraction first before attempting other tasks", 403, [
            'requires_checkin' => true,
            'checkin_task_id' => $checkin_task_id
        ]);
    }

    if (!$task_config || !isset($task_config['correct_count'])) {
        $db->rollBack();
        error_log("Invalid task config - task_config: " . json_encode($task_config));
        Response::error("Task configuration is invalid. Missing 'correct_count' in task_config. Please configure this task in the admin panel.", 500);
    }

    $correct_count = intval($task_config['correct_count']);
    $tolerance = isset($task_config['tolerance']) ? intval($task_config['tolerance']) : 0;
    $target_object = $task_config['target_object'] ?? 'objects';

    // 2. Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("You have already submitted this task", 400);
    }

    // 3. Check if count is correct (within tolerance)
    $difference = abs($user_count - $correct_count);
    $is_correct = $difference <= $tolerance;
    
    // Calculate score (full points if within tolerance, partial if close)
    $score = 0;
    if ($is_correct) {
        $score = 100;
    } elseif ($difference <= $tolerance + 2) {
        // Partial credit for being very close
        $score = 50;
    }

    // 4. Store submission
    $answer_data = json_encode([
        'user_count' => $user_count,
        'correct_count' => $correct_count,
        'tolerance' => $tolerance,
        'difference' => $difference,
        'target_object' => $target_object
    ]);

    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, answer, score, is_correct, submitted_at)
              VALUES (:user_id, :task_id, :answer, :score, :is_correct, NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':answer', $answer_data);
    $stmt->bindParam(':score', $score);
    $stmt->bindParam(':is_correct', $is_correct, PDO::PARAM_BOOL);
    $stmt->execute();

    $submission_id = $db->lastInsertId();

    // 5. Award base XP and EP
    $xp_earned = 0;
    $ep_earned = 0;
    $special_rewards = null;
    
    if ($is_correct) {
        $xp_earned = 20; // Base XP for count_confirm tasks
        $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, 'task', :task_id)";
        $xp_stmt = $db->prepare($xp_query);
        $xp_reason = "Completed count & confirm task";
        $xp_stmt->bindParam(':user_id', $user['id']);
        $xp_stmt->bindParam(':xp_amount', $xp_earned);
        $xp_stmt->bindParam(':reason', $xp_reason);
        $xp_stmt->bindParam(':task_id', $task_id);
        $xp_stmt->execute();
        
        $ep_earned = 10; // Base EP for completing a task
        $ep_query = "CALL award_ep(:user_id, :ep_amount, :reason, 'task', :task_id)";
        $ep_stmt = $db->prepare($ep_query);
        $ep_reason = "Completed task at attraction";
        $ep_stmt->bindParam(':user_id', $user['id']);
        $ep_stmt->bindParam(':ep_amount', $ep_earned);
        $ep_stmt->bindParam(':reason', $ep_reason);
        $ep_stmt->bindParam(':task_id', $task_id);
        $ep_stmt->execute();
        
        // Check for special rewards
        $special_rewards = RewardHelper::awardTaskCompletion(
            $db,
            $user['id'],
            $task_id,
            $task['attraction_id'],
            $task['category'],
            'count_confirm'
        );
    }

    // 6. Update progress
    $query = "INSERT INTO progress (user_id, attraction_id, task_id, completed_at)
              VALUES (:user_id, :attraction_id, :task_id, NOW())
              ON DUPLICATE KEY UPDATE completed_at = NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':attraction_id', $task['attraction_id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    $db->commit();

    // 7. Return response
    Response::success([
        'submission_id' => $submission_id,
        'is_correct' => $is_correct,
        'score' => $score,
        'user_count' => $user_count,
        'correct_count' => $correct_count,
        'difference' => $difference,
        'tolerance' => $tolerance,
        'message' => $is_correct 
            ? "Correct! You counted {$user_count} {$target_object}." 
            : "Not quite. The correct count is {$correct_count} {$target_object}.",
        'rewards' => [
            'xp_earned' => (int)$xp_earned,
            'ep_earned' => (int)$ep_earned,
            'new_rewards' => $special_rewards ?: []
        ],
        'attraction_id' => $task['attraction_id']
    ], "Task submitted successfully", 201);

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    $errorMsg = $e->getMessage();
    $errorFile = $e->getFile();
    $errorLine = $e->getLine();
    error_log("Count & Confirm PDO error: $errorMsg in $errorFile:$errorLine");
    error_log("Stack trace: " . $e->getTraceAsString());
    
    Response::error("Database error: $errorMsg (in $errorFile line $errorLine)", 500);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    $errorMsg = $e->getMessage();
    $errorFile = $e->getFile();
    $errorLine = $e->getLine();
    error_log("Count & Confirm general error: $errorMsg in $errorFile:$errorLine");
    error_log("Stack trace: " . $e->getTraceAsString());
    
    Response::error("Error: $errorMsg (in $errorFile line $errorLine)", 500);
}
?>
