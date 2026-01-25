<?php
/**
 * Backfill Rewards for Users Who Completed Tasks Before Reward System
 * This script checks all completed tasks and awards any missing rewards
 */

require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/response.php';
require_once '../../utils/reward-helper.php';

// Allow GET or POST
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$database = new Database();
$db = $database->getConnection();

// Get user_id from query parameter or POST data
$user_id = null;
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
} else {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : null;
}

if (!$user_id) {
    Response::error("User ID is required", 400);
}

try {
    $awarded_rewards = [];
    $skipped_rewards = [];
    
    // Get all active rewards with task_type_completion trigger
    $query = "
        SELECT id, title, reward_type, reward_identifier, rarity, trigger_condition
        FROM rewards
        WHERE trigger_type = 'task_type_completion'
        AND is_active = 1
    ";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("Backfilling rewards for user $user_id. Found " . count($rewards) . " active task_type_completion rewards.");
    
    foreach ($rewards as $reward) {
        $trigger_condition = json_decode($reward['trigger_condition'], true);
        
        if (!isset($trigger_condition['task_type']) || empty($trigger_condition['task_type'])) {
            continue;
        }
        
        $required_task_type = $trigger_condition['task_type'];
        $required_count = isset($trigger_condition['required_count']) ? intval($trigger_condition['required_count']) : 1;
        
        // Check if user already has this reward
        $check_query = "
            SELECT id FROM user_rewards
            WHERE user_id = :user_id AND reward_identifier = :reward_identifier
        ";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':user_id', $user_id);
        $check_stmt->bindParam(':reward_identifier', $reward['reward_identifier']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $skipped_rewards[] = [
                'reward' => $reward['title'],
                'reason' => 'Already earned'
            ];
            continue;
        }
        
        // Count how many tasks of this type the user has completed
        $count_query = "
            SELECT COUNT(DISTINCT t.id) as completed_count
            FROM tasks t
            INNER JOIN user_task_submissions uts ON t.id = uts.task_id
            WHERE uts.user_id = :user_id 
            AND t.type = :task_type
            AND uts.is_correct = 1
        ";
        $count_stmt = $db->prepare($count_query);
        $count_stmt->bindParam(':user_id', $user_id);
        $count_stmt->bindParam(':task_type', $required_task_type);
        $count_stmt->execute();
        $count_data = $count_stmt->fetch(PDO::FETCH_ASSOC);
        $completed_count = intval($count_data['completed_count']);
        
        // Award the reward if user has completed the required number of tasks
        if ($completed_count >= $required_count) {
            // Get category from first completed task of this type
            $category_query = "
                SELECT a.category
                FROM tasks t
                INNER JOIN attractions a ON t.attraction_id = a.id
                INNER JOIN user_task_submissions uts ON t.id = uts.task_id
                WHERE uts.user_id = :user_id 
                AND t.type = :task_type
                AND uts.is_correct = 1
                LIMIT 1
            ";
            $category_stmt = $db->prepare($category_query);
            $category_stmt->bindParam(':user_id', $user_id);
            $category_stmt->bindParam(':task_type', $required_task_type);
            $category_stmt->execute();
            $category_data = $category_stmt->fetch(PDO::FETCH_ASSOC);
            $category = $category_data['category'] ?? null;
            
            $award_query = "
                INSERT INTO user_rewards (user_id, reward_type, reward_identifier, 
                                         reward_name, reward_description, category, metadata, earned_date)
                SELECT :user_id, r.reward_type, r.reward_identifier, r.title, r.description, 
                       :category, JSON_OBJECT('rarity', r.rarity, 'image', r.image, 'backfilled', true), NOW()
                FROM rewards r
                WHERE r.id = :reward_id
            ";
            $award_stmt = $db->prepare($award_query);
            $award_stmt->bindParam(':user_id', $user_id);
            $award_stmt->bindParam(':reward_id', $reward['id']);
            $award_stmt->bindParam(':category', $category);
            $award_stmt->execute();
            
            // Award XP based on rarity
            $xp_amount = getXPByRarity($reward['rarity']);
            $count_text = $required_count > 1 ? " (completed " . $required_count . " tasks)" : "";
            $reason = "Earned " . $reward['rarity'] . " badge: " . $reward['title'] . $count_text . " (backfilled)";
            $source_type = "task_type_completion";
            
            try {
                $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, :source_type, 0)";
                $xp_stmt = $db->prepare($xp_query);
                $xp_stmt->bindParam(':user_id', $user_id);
                $xp_stmt->bindParam(':xp_amount', $xp_amount);
                $xp_stmt->bindParam(':reason', $reason);
                $xp_stmt->bindParam(':source_type', $source_type);
                $xp_stmt->execute();
            } catch (PDOException $e) {
                // XP award failed, but continue (stored procedure might not exist)
                error_log("XP award failed (stored procedure may not exist): " . $e->getMessage());
            }
            
            $awarded_rewards[] = [
                'reward_id' => $reward['id'],
                'reward_name' => $reward['title'],
                'reward_type' => $reward['reward_type'],
                'rarity' => $reward['rarity'],
                'task_type' => $required_task_type,
                'completed_count' => $completed_count,
                'required_count' => $required_count,
                'xp_awarded' => $xp_amount
            ];
            
            error_log("Backfilled reward: " . $reward['title'] . " (" . $reward['rarity'] . ", " . $xp_amount . " XP, " . $completed_count . "/" . $required_count . " tasks) for user " . $user_id);
        } else {
            $skipped_rewards[] = [
                'reward' => $reward['title'],
                'reason' => "Not enough completions ($completed_count/$required_count)"
            ];
        }
    }
    
    // Also check task_set_completion rewards
    $set_query = "
        SELECT id, title, reward_type, reward_identifier, rarity, trigger_condition
        FROM rewards
        WHERE trigger_type = 'task_set_completion'
        AND is_active = 1
    ";
    $set_stmt = $db->prepare($set_query);
    $set_stmt->execute();
    $set_rewards = $set_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($set_rewards as $reward) {
        $trigger_condition = json_decode($reward['trigger_condition'], true);
        
        if (!isset($trigger_condition['task_ids']) || !is_array($trigger_condition['task_ids'])) {
            continue;
        }
        
        $task_ids = $trigger_condition['task_ids'];
        
        // Check if user already has this reward
        $check_query = "
            SELECT id FROM user_rewards
            WHERE user_id = :user_id AND reward_identifier = :reward_identifier
        ";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':user_id', $user_id);
        $check_stmt->bindParam(':reward_identifier', $reward['reward_identifier']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $skipped_rewards[] = [
                'reward' => $reward['title'],
                'reason' => 'Already earned'
            ];
            continue;
        }
        
        // Check if all tasks in the set are completed
        $placeholders = implode(',', array_fill(0, count($task_ids), '?'));
        $completed_query = "
            SELECT COUNT(DISTINCT uts.task_id) as completed_count
            FROM user_task_submissions uts
            WHERE uts.user_id = ?
            AND uts.task_id IN ($placeholders)
            AND uts.is_correct = 1
        ";
        $completed_stmt = $db->prepare($completed_query);
        $completed_stmt->execute(array_merge([$user_id], $task_ids));
        $completed_data = $completed_stmt->fetch(PDO::FETCH_ASSOC);
        $completed_count = intval($completed_data['completed_count']);
        
        // Award if all tasks completed
        if ($completed_count >= count($task_ids)) {
            // Get category from first task
            $category_query = "
                SELECT a.category
                FROM tasks t
                INNER JOIN attractions a ON t.attraction_id = a.id
                WHERE t.id = ?
                LIMIT 1
            ";
            $category_stmt = $db->prepare($category_query);
            $category_stmt->execute([$task_ids[0]]);
            $category_data = $category_stmt->fetch(PDO::FETCH_ASSOC);
            $category = $category_data['category'] ?? null;
            
            $award_query = "
                INSERT INTO user_rewards (user_id, reward_type, reward_identifier, 
                                         reward_name, reward_description, category, metadata, earned_date)
                SELECT :user_id, r.reward_type, r.reward_identifier, r.title, r.description, 
                       :category, JSON_OBJECT('rarity', r.rarity, 'image', r.image, 'backfilled', true), NOW()
                FROM rewards r
                WHERE r.id = :reward_id
            ";
            $award_stmt = $db->prepare($award_query);
            $award_stmt->bindParam(':user_id', $user_id);
            $award_stmt->bindParam(':reward_id', $reward['id']);
            $award_stmt->bindParam(':category', $category);
            $award_stmt->execute();
            
            // Award XP
            $xp_amount = getXPByRarity($reward['rarity']);
            $reason = "Completed task set: " . $reward['title'] . " (backfilled)";
            $source_type = "task_set_completion";
            
            try {
                $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, :source_type, 0)";
                $xp_stmt = $db->prepare($xp_query);
                $xp_stmt->bindParam(':user_id', $user_id);
                $xp_stmt->bindParam(':xp_amount', $xp_amount);
                $xp_stmt->bindParam(':reason', $reason);
                $xp_stmt->bindParam(':source_type', $source_type);
                $xp_stmt->execute();
            } catch (PDOException $e) {
                error_log("XP award failed (stored procedure may not exist): " . $e->getMessage());
            }
            
            $awarded_rewards[] = [
                'reward_id' => $reward['id'],
                'reward_name' => $reward['title'],
                'reward_type' => $reward['reward_type'],
                'rarity' => $reward['rarity'],
                'task_set' => $task_ids,
                'xp_awarded' => $xp_amount
            ];
            
            error_log("Backfilled task set reward: " . $reward['title'] . " for user " . $user_id);
        } else {
            $skipped_rewards[] = [
                'reward' => $reward['title'],
                'reason' => "Not all tasks completed ($completed_count/" . count($task_ids) . ")"
            ];
        }
    }
    
    Response::success([
        'user_id' => $user_id,
        'awarded_count' => count($awarded_rewards),
        'skipped_count' => count($skipped_rewards),
        'awarded_rewards' => $awarded_rewards,
        'skipped_rewards' => $skipped_rewards
    ], "Backfill completed successfully");

} catch (PDOException $e) {
    error_log("Backfill error: " . $e->getMessage());
    Response::serverError("Failed to backfill rewards: " . $e->getMessage());
}
?>
