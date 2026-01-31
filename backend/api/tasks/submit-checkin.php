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

    // Get current attraction_id and category for rewards
    $query = "SELECT t.attraction_id, a.category 
              FROM tasks t 
              JOIN attractions a ON t.attraction_id = a.id 
              WHERE t.id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $currentTask = $stmt->fetch(PDO::FETCH_ASSOC);
    $attraction_id = $currentTask['attraction_id'];
    $category = $currentTask['category'];

    // Award base XP for completing the check-in task
    $xp_earned = 15; // Base XP for check-in tasks
    $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, 'task', :task_id)";
    $xp_stmt = $db->prepare($xp_query);
    $xp_reason = "Completed check-in task";
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
    
    // === REWARD SYSTEM INTEGRATION ===
    // Check for special rewards (badges, titles, etc.)
    $special_rewards = RewardHelper::awardTaskCompletion(
        $db,
        $user_id,
        $task_id,
        $attraction_id,
        $category,
        'checkin'
    );
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

    Response::success([
        'next_task_id' => $nextTask ? $nextTask['id'] : null,
        'attraction_id' => $attraction_id,
        'verification' => [
            'method' => $verification_method,
            'distance_m' => $proximityCheck['distance'],
            'allowed_radius_m' => $allowed_radius_m,
            'gps_accuracy_m' => $accuracy
        ],
        'rewards' => $rewards
    ], "Check-in successful", 201);

} catch (PDOException $e) {
    $db->rollBack();
    error_log("Submit check-in error: " . $e->getMessage());
    Response::serverError("Failed to check in");
}
?>