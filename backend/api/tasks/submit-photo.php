<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../config/constants.php';
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

// Get task_id from POST data
$task_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;

if ($task_id <= 0) {
    Response::error("Invalid task ID", 400);
}

// Check if file was uploaded
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    Response::error("No photo uploaded or upload error", 400);
}

$file = $_FILES['photo'];

// Validate file type
if (!in_array($file['type'], ALLOWED_IMAGE_TYPES)) {
    Response::error("Invalid file type. Only JPEG and PNG allowed", 400);
}

// Validate file size
if ($file['size'] > MAX_UPLOAD_SIZE) {
    Response::error("File too large. Maximum 5MB allowed", 400);
}

try {
    $db->beginTransaction();

    $user_id = $user['id']; // Fix: auth middleware returns 'id', not 'user_id'

    // Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("Photo already submitted for this task", 400);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'photo_' . $user_id . '_' . $task_id . '_' . time() . '.' . $extension;
    $filepath = UPLOAD_DIR . $filename;

    // Create upload directory if not exists
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0777, true);
    }

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        $db->rollBack();
        Response::serverError("Failed to save photo");
    }

    // Generate photo URL
    $photo_url = BASE_URL . '/uploads/photos/' . $filename;

    // Store submission
    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, photo_url, is_correct) 
              VALUES (:user_id, :task_id, :photo_url, 1)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':photo_url', $photo_url);
    $stmt->execute();

    // Get current attraction_id (MOVED UP - needed for rewards)
    $query = "SELECT attraction_id FROM tasks WHERE id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $currentTask = $stmt->fetch(PDO::FETCH_ASSOC);
    $attraction_id = $currentTask['attraction_id'];

    // Update progress
    $query = "CALL update_user_progress(:user_id, :task_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    $db->commit();
    
    // === REWARD SYSTEM INTEGRATION ===
    // Convert PDO connection to mysqli for reward functions
    $mysqli = new mysqli('localhost', 'root', '', 'ktrek_db');
    
    // Award task stamp for photo
    awardTaskStamp($mysqli, $user_id, $task_id, $attraction_id, 'photo_upload');
    
    // Award XP for photo submission
    $xp_result = awardTaskXP($mysqli, $user_id, 'photo_upload', $task_id);
    
    // Award photo card (quality score based on file size and type - can be enhanced later)
    $quality_score = 75; // Default quality, can be improved with AI/ML later
    awardPhotoCard($mysqli, $user_id, $attraction_id, $quality_score, $photo_url);
    
    // Check if attraction is now complete
    $completion_result = checkAttractionCompletion($mysqli, $user_id, $attraction_id);
    
    // Get newly earned rewards
    $new_rewards = getNewlyEarnedRewards($mysqli, $user_id, 15);
    
    // Get updated user stats (includes XP and EP)
    $user_stats = getUserCurrentStats($mysqli, $user_id);
    
    // Get EP earned in this session
    $ep_earned = getRecentEP($mysqli, $user_id, 15);
    
    // Get category progress for the current attraction
    $category = getAttractionCategory($mysqli, $attraction_id);
    $category_progress = getCategoryProgress($mysqli, $user_id);
    $current_category_progress = isset($category_progress[$category]) ? $category_progress[$category] : null;
    
    $mysqli->close();
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
        'photo_url' => $photo_url,
        'next_task_id' => $nextTask ? $nextTask['id'] : null,
        'attraction_id' => $attraction_id,
        // Enhanced reward data with EP and category progress
        'rewards' => [
            'xp_earned' => $xp_result['xp'],
            'ep_earned' => $ep_earned,
            'new_rewards' => $new_rewards,
            'user_stats' => $user_stats,
            'attraction_complete' => $completion_result['complete'],
            'completion_data' => $completion_result,
            'category_progress' => $current_category_progress
        ]
    ], "Photo submitted successfully", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Submit photo error: " . $e->getMessage());
    Response::serverError("Failed to submit photo");
}
?>