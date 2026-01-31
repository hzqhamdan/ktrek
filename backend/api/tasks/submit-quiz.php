<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

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
$answers = isset($data['answers']) ? $data['answers'] : [];

if ($task_id <= 0 || empty($answers)) {
    Response::error("Task ID and answers are required", 400);
}

try {
    $db->beginTransaction();

    $user_id = $user['id']; // Fix: auth middleware returns 'id', not 'user_id'

    // Get attraction_id for this task first (needed for check-in verification)
    $query = "SELECT attraction_id FROM tasks WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        Response::error("Task not found", 404);
    }
    
    $task_info = $stmt->fetch(PDO::FETCH_ASSOC);
    $attraction_id = $task_info['attraction_id'];

    // Check if user has checked in to this attraction first
    if (!CheckinHelper::hasCheckedIn($db, $user_id, $attraction_id)) {
        $db->rollBack();
        $checkin_task_id = CheckinHelper::getCheckinTaskId($db, $attraction_id);
        Response::error("Please check in to this attraction first before attempting other tasks", 403, [
            'requires_checkin' => true,
            'checkin_task_id' => $checkin_task_id
        ]);
    }

    // Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("Quiz already submitted", 400);
    }

    // Validate answers and calculate score
    $total_questions = 0;
    $correct_answers = 0;

    foreach ($answers as $answer) {
        $question_id = $answer['question_id'];
        $selected_option_id = $answer['selected_option_id'];

        // Check if selected option is correct
        $query = "SELECT is_correct FROM quiz_options WHERE id = :option_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':option_id', $selected_option_id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $option = $stmt->fetch();
            if ($option['is_correct']) {
                $correct_answers++;
            }
            $total_questions++;
        }
    }

    $score = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100) : 0;
    $is_correct = $correct_answers == $total_questions; // All must be correct

    // Store submission
    $answer_json = json_encode($answers);
    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, answer, is_correct, score) 
              VALUES (:user_id, :task_id, :answer, :is_correct, :score)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':answer', $answer_json);
    $stmt->bindParam(':is_correct', $is_correct);
    $stmt->bindParam(':score', $score);
    $stmt->execute();

    // Update progress using stored procedure
    $query = "CALL update_user_progress(:user_id, :task_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    // Get current attraction_id (MOVED UP - needed for rewards)
    $query = "SELECT attraction_id FROM tasks WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $currentTask = $stmt->fetch(PDO::FETCH_ASSOC);
    $attraction_id = $currentTask['attraction_id'];

    // Get task details for rewards
    $query = "SELECT t.*, a.category 
              FROM tasks t 
              JOIN attractions a ON t.attraction_id = a.id 
              WHERE t.id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $task_details = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Award base XP for completing the quiz
    $xp_earned = 25; // Base XP for quiz tasks
    $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, 'task', :task_id)";
    $xp_stmt = $db->prepare($xp_query);
    $xp_reason = "Completed quiz task";
    $xp_stmt->bindParam(':user_id', $user_id);
    $xp_stmt->bindParam(':xp_amount', $xp_earned);
    $xp_stmt->bindParam(':reason', $xp_reason);
    $xp_stmt->bindParam(':task_id', $task_id);
    $xp_stmt->execute();
    
    // Award EP for the attraction
    $ep_earned = 10; // Base EP for completing a task
    $ep_query = "CALL award_ep(:user_id, :ep_amount, :reason, 'task', :task_id)";
    $ep_stmt = $db->prepare($ep_query);
    $ep_reason = "Completed task at attraction";
    $ep_stmt->bindParam(':user_id', $user_id);
    $ep_stmt->bindParam(':ep_amount', $ep_earned);
    $ep_stmt->bindParam(':reason', $ep_reason);
    $ep_stmt->bindParam(':task_id', $task_id);
    $ep_stmt->execute();

    $db->commit();

    // Check for special rewards (badges, titles)
    $special_rewards = RewardHelper::awardTaskCompletion(
        $db,
        $user_id,
        $task_id,
        $attraction_id,
        $task_details['category'],
        'quiz'
    );
    // === END REWARD INTEGRATION ===

    // Get next task in the same attraction
    $query = "SELECT t.id
              FROM tasks t
              WHERE t.attraction_id = :attraction_id
              AND t.id NOT IN (
                  SELECT task_id FROM user_task_submissions 
                  WHERE user_id = :user_id
              )
              ORDER BY t.id ASC
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':attraction_id', $attraction_id);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $nextTask = $stmt->fetch(PDO::FETCH_ASSOC);

    Response::success([
        'score' => $score,
        'correct_answers' => $correct_answers,
        'total_questions' => $total_questions,
        'is_perfect' => $is_correct,
        'next_task_id' => $nextTask ? $nextTask['id'] : null,
        'attraction_id' => $attraction_id,
        'rewards' => [
            'xp_earned' => $xp_earned,
            'ep_earned' => $ep_earned,
            'special_rewards' => $special_rewards
        ]
    ], "Quiz submitted successfully", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Submit quiz error: " . $e->getMessage());
    Response::serverError("Failed to submit quiz");
}
?>