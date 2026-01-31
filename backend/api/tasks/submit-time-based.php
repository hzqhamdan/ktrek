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

if ($task_id <= 0) {
    Response::error("Task ID is required", 400);
}

try {
    $db->beginTransaction();

    $query = "SELECT t.*, t.task_config, a.id as attraction_id, a.category
              FROM tasks t JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'time_based'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Time-based task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    $config = json_decode($task['task_config'], true);

    // Check if user has checked in to this attraction first
    if (!CheckinHelper::hasCheckedIn($db, $user['id'], $task['attraction_id'])) {
        $db->rollBack();
        $checkin_task_id = CheckinHelper::getCheckinTaskId($db, $task['attraction_id']);
        Response::error("Please check in to this attraction first before attempting other tasks", 403, [
            'requires_checkin' => true,
            'checkin_task_id' => $checkin_task_id
        ]);
    }

    // Check current time is within window (Malaysia timezone)
    date_default_timezone_set('Asia/Kuala_Lumpur');
    $current_time = date('H:i:s');
    $start_time = $config['start_time'];
    $end_time = $config['end_time'];
    
    $is_correct = ($current_time >= $start_time && $current_time <= $end_time);

    if (!$is_correct) {
        $db->rollBack();
        Response::error("You can only complete this task between {$start_time} and {$end_time}", 400);
    }

    // Check if already submitted
    $query = "SELECT id FROM user_task_submissions WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("Already completed", 400);
    }

    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, answer, score, is_correct, submitted_at)
              VALUES (:user_id, :task_id, :answer, 100, 1, NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':task_id', $task_id);
    $answer = json_encode(['check_in_time' => $current_time]);
    $stmt->bindParam(':answer', $answer);
    $stmt->execute();

    // Award XP for completing the task
    $xp_earned = 15; // Base XP for time_based tasks
    $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, 'task', :task_id)";
    $xp_stmt = $db->prepare($xp_query);
    $xp_reason = "Completed time-based task";
    $xp_stmt->bindParam(':user_id', $user['id']);
    $xp_stmt->bindParam(':xp_amount', $xp_earned);
    $xp_stmt->bindParam(':reason', $xp_reason);
    $xp_stmt->bindParam(':task_id', $task_id);
    $xp_stmt->execute();
    
    // Award EP for the attraction
    $ep_earned = 10; // Base EP for completing a task
    $ep_query = "CALL award_ep(:user_id, :ep_amount, :reason, 'task', :task_id)";
    $ep_stmt = $db->prepare($ep_query);
    $ep_reason = "Completed task at attraction";
    $ep_stmt->bindParam(':user_id', $user['id']);
    $ep_stmt->bindParam(':ep_amount', $ep_earned);
    $ep_stmt->bindParam(':reason', $ep_reason);
    $ep_stmt->bindParam(':task_id', $task_id);
    $ep_stmt->execute();
    
    // Check for special rewards (badges, titles)
    $special_rewards = RewardHelper::awardTaskCompletion($db, $user['id'], $task_id, 
               $task['attraction_id'], $task['category'], 'time_based');

    // Update progress table - insert/update task completion
    $query = "INSERT INTO progress (user_id, attraction_id, task_id, completed_at)
              VALUES (:user_id, :attraction_id, :task_id, NOW())
              ON DUPLICATE KEY UPDATE completed_at = NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':attraction_id', $task['attraction_id']);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    // Calculate and update progress percentage for this attraction
    $progress_query = "
        SELECT 
            COUNT(DISTINCT t.id) as total_tasks,
            COUNT(DISTINCT uts.task_id) as completed_tasks
        FROM tasks t
        LEFT JOIN user_task_submissions uts ON t.id = uts.task_id AND uts.user_id = :user_id
        WHERE t.attraction_id = :attraction_id
    ";
    $progress_stmt = $db->prepare($progress_query);
    $progress_stmt->bindParam(':user_id', $user['id']);
    $progress_stmt->bindParam(':attraction_id', $task['attraction_id']);
    $progress_stmt->execute();
    $progress_data = $progress_stmt->fetch(PDO::FETCH_ASSOC);
    
    $total_tasks = $progress_data['total_tasks'];
    $completed_tasks = $progress_data['completed_tasks'];
    $progress_percentage = $total_tasks > 0 ? ($completed_tasks / $total_tasks) * 100 : 0;
    
    // Update progress record with calculated values
    $update_progress_query = "
        UPDATE progress 
        SET completed_tasks = :completed_tasks,
            total_tasks = :total_tasks,
            progress_percentage = :progress_percentage,
            updated_at = NOW()
        WHERE user_id = :user_id AND attraction_id = :attraction_id
    ";
    $update_stmt = $db->prepare($update_progress_query);
    $update_stmt->bindParam(':completed_tasks', $completed_tasks);
    $update_stmt->bindParam(':total_tasks', $total_tasks);
    $update_stmt->bindParam(':progress_percentage', $progress_percentage);
    $update_stmt->bindParam(':user_id', $user['id']);
    $update_stmt->bindParam(':attraction_id', $task['attraction_id']);
    $update_stmt->execute();

    $db->commit();

    Response::success([
        'is_correct' => true,
        'score' => 100,
        'check_in_time' => $current_time,
        'time_window' => "{$start_time} - {$end_time}",
        'message' => "Perfect timing! Task completed.",
        'rewards' => [
            'xp_earned' => (int)$xp_earned,
            'ep_earned' => (int)$ep_earned,
            'new_rewards' => $special_rewards ?: []
        ],
        'attraction_id' => $task['attraction_id']
    ], "Time-based task completed", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Time-based task error: " . $e->getMessage());
    Response::serverError("Failed to complete task");
}
?>
