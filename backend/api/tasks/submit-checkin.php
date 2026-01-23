<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';
require_once '../../utils/qrcode.php';
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
$latitude = isset($data['latitude']) ? floatval($data['latitude']) : null;
$longitude = isset($data['longitude']) ? floatval($data['longitude']) : null;
$accuracy = isset($data['accuracy']) ? floatval($data['accuracy']) : null;
$qr_code = isset($data['qr_code']) ? trim($data['qr_code']) : null;

if ($task_id <= 0) {
    Response::error("Invalid task ID", 400);
}

try {
    $db->beginTransaction();

    $user_id = $user['id']; // Fix: auth middleware returns 'id', not 'user_id'

    // Get task and attraction details
    $query = "SELECT t.*, a.latitude as attraction_lat, a.longitude as attraction_lon, a.name as attraction_name
              FROM tasks t
              JOIN attractions a ON t.attraction_id = a.id
              WHERE t.id = :task_id AND t.type = 'checkin'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        $db->rollBack();
        Response::error("Check-in task not found", 404);
    }

    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check if already submitted
    $query = "SELECT id FROM user_task_submissions 
              WHERE user_id = :user_id AND task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $db->rollBack();
        Response::error("Already checked in to this task", 400);
    }

    // Verification: QR OR Location
    $verification_method = null;
    $proximityCheck = [
        'valid' => true,
        'distance' => null,
        'message' => 'Verified'
    ];
    $allowed_radius_m = null;

    if (!empty($qr_code)) {
        // QR-based check-in (proves user is on-site)
        if (empty($task['qr_code']) || hash_equals((string)$task['qr_code'], (string)$qr_code) === false) {
            $db->rollBack();
            Response::error("Invalid QR code for this task", 403);
        }
        $verification_method = 'qr';
    } else {
        // Location-based check-in (geofencing)
        $verification_method = 'location';

        // If attraction has coordinates, require user location.
        if (!empty($task['attraction_lat']) && !empty($task['attraction_lon'])) {
            if ($accuracy === null) {
                $db->rollBack();
                Response::error("GPS accuracy is required for location check-in", 400);
            }

            // Strict accuracy requirement (prevents approximate / IP-based location check-ins)
            $MAX_ALLOWED_ACCURACY_M = 150;

            $formatDistance = function($meters) {
                if ($meters === null) return null;
                $m = floatval($meters);
                if ($m >= 500) {
                    $km = $m / 1000;
                    $rounded = round($km, 1);
                    // drop trailing .0
                    if (abs($rounded - round($rounded)) < 0.00001) {
                        return intval(round($rounded)) . "km";
                    }
                    return number_format($rounded, 1) . "km";
                }
                return intval(round($m)) . "m";
            };

            if ($accuracy > $MAX_ALLOWED_ACCURACY_M) {
                $db->rollBack();
                $accText = $formatDistance($accuracy);
                Response::error("Location is not accurate enough ({$accText}). Enable Precise Location/GPS and try again outdoors.", 403);
            }

            // System-determined radius: 100m base, expand up to 200m depending on accuracy.
            // - accuracy <= 50m: keep 100m
            // - accuracy 50..150m: expand linearly to 200m
            // - accuracy 150..300m: cap at 200m
            $BASE_RADIUS_M = 100;
            $MAX_RADIUS_M = 200;
            $ACCURACY_NO_EXPAND_M = 50;

            $allowed_radius_m = $BASE_RADIUS_M;
            if ($accuracy > $ACCURACY_NO_EXPAND_M) {
                $allowed_radius_m = min($MAX_RADIUS_M, $BASE_RADIUS_M + ($accuracy - $ACCURACY_NO_EXPAND_M));
            }

            $proximityCheck = QRCodeGenerator::validateProximity(
                $latitude,
                $longitude,
                $task['attraction_lat'],
                $task['attraction_lon'],
                (int)round($allowed_radius_m)
            );

            if (!$proximityCheck['valid']) {
                $db->rollBack();
                Response::error($proximityCheck['message'], 403);
            }
        }
    }

    // Store check-in (with optional location)
    // Note: latitude/longitude may be null for QR-based check-in

    $query = "INSERT INTO user_task_submissions 
              (user_id, task_id, is_correct, latitude, longitude) 
              VALUES (:user_id, :task_id, 1, :latitude, :longitude)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':latitude', $latitude);
    $stmt->bindParam(':longitude', $longitude);
    $stmt->execute();

    // Update progress
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

    $db->commit();
    
    // === REWARD SYSTEM INTEGRATION ===
    // Convert PDO connection to mysqli for reward functions
    $mysqli = new mysqli('localhost', 'root', '', 'ktrek_db');
    
    // Award task stamp for check-in
    awardTaskStamp($mysqli, $user_id, $task_id, $attraction_id, 'qr_checkin');
    
    // Award XP for check-in
    $xp_result = awardTaskXP($mysqli, $user_id, 'qr_checkin', $task_id);
    
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
    
    // === END REWARD INTEGRATION ===

    // Get next task in the same attraction (BEFORE closing mysqli)
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
    
    // Close mysqli connection after all queries are done
    $mysqli->close();

    Response::success([
        'next_task_id' => $nextTask ? $nextTask['id'] : null,
        'attraction_id' => $attraction_id,
        'verification' => [
            'method' => $verification_method,
            'distance_m' => $proximityCheck['distance'],
            'allowed_radius_m' => $allowed_radius_m,
            'gps_accuracy_m' => $accuracy
        ],
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
    ], "Check-in successful", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Submit check-in error: " . $e->getMessage());
    Response::serverError("Failed to check in");
}
?>