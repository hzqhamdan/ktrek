<?php
/**
 * Reward Helper Functions
 * Helper functions to integrate rewards with task submissions
 */

/**
 * Award task stamp based on task type
 */
function awardTaskStamp($conn, $user_id, $task_id, $attraction_id, $task_type) {
    try {
        $stmt = $conn->prepare("CALL award_task_stamp(?, ?, ?, ?)");
        $stmt->bind_param("iiis", $user_id, $task_id, $attraction_id, $task_type);
        $stmt->execute();
        $stmt->close();
        
        // Check for task set completion rewards
        checkTaskSetCompletion($conn, $user_id, $task_id);
        
        // Check for task type completion rewards
        checkTaskTypeCompletion($conn, $user_id, $task_type);
        
        return true;
    } catch (Exception $e) {
        error_log("Failed to award task stamp: " . $e->getMessage());
        return false;
    }
}

/**
 * Get XP amount based on reward rarity
 */
function getXPByRarity($rarity) {
    $xp_values = [
        'common' => 50,
        'rare' => 100,
        'epic' => 200,
        'legendary' => 500
    ];
    return isset($xp_values[$rarity]) ? $xp_values[$rarity] : 50;
}

/**
 * Check and award task type completion rewards
 * This checks if the user has completed tasks of a specific type
 * Supports both single completion and multiple completions (e.g., "Complete 5 quizzes")
 */
function checkTaskTypeCompletion($conn, $user_id, $task_type) {
    try {
        // Get all rewards with task_type_completion trigger (including rarity for XP calculation)
        $stmt = $conn->prepare("
            SELECT id, title, trigger_condition, rarity, reward_identifier, reward_type
            FROM rewards
            WHERE trigger_type = 'task_type_completion'
            AND is_active = 1
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($reward = $result->fetch_assoc()) {
            $trigger_condition = json_decode($reward['trigger_condition'], true);
            
            if (!isset($trigger_condition['task_type']) || empty($trigger_condition['task_type'])) {
                continue;
            }
            
            $required_task_type = $trigger_condition['task_type'];
            $required_count = isset($trigger_condition['required_count']) ? intval($trigger_condition['required_count']) : 1;
            
            // Check if the completed task matches the required task type
            if ($task_type === $required_task_type) {
                // Check if user already has this reward
                $check_stmt = $conn->prepare("
                    SELECT id FROM user_rewards
                    WHERE user_id = ? AND reward_identifier = ?
                ");
                $check_stmt->bind_param("is", $user_id, $reward['reward_identifier']);
                $check_stmt->execute();
                $check_result = $check_stmt->get_result();
                
                if ($check_result->num_rows === 0) {
                    // Count how many tasks of this type the user has completed
                    $count_stmt = $conn->prepare("
                        SELECT COUNT(DISTINCT t.id) as completed_count
                        FROM tasks t
                        INNER JOIN user_task_submissions uts ON t.id = uts.task_id
                        WHERE uts.user_id = ? 
                        AND t.type = ?
                        AND uts.is_correct = 1
                    ");
                    $count_stmt->bind_param("is", $user_id, $required_task_type);
                    $count_stmt->execute();
                    $count_result = $count_stmt->get_result();
                    $count_data = $count_result->fetch_assoc();
                    $completed_count = intval($count_data['completed_count']);
                    $count_stmt->close();
                    
                    // Award the reward if user has completed the required number of tasks
                    if ($completed_count >= $required_count) {
                        $award_stmt = $conn->prepare("
                            INSERT INTO user_rewards (user_id, reward_id, reward_type, reward_identifier, 
                                                     title, description, image, rarity, source_type, 
                                                     source_id, earned_at)
                            SELECT ?, r.id, r.reward_type, r.reward_identifier, r.title, r.description, 
                                   r.image, r.rarity, 'task_type', 0, NOW()
                            FROM rewards r
                            WHERE r.id = ?
                        ");
                        $award_stmt->bind_param("ii", $user_id, $reward['id']);
                        $award_stmt->execute();
                        $award_stmt->close();
                        
                        // Award XP based on rarity
                        $xp_amount = getXPByRarity($reward['rarity']);
                        $xp_stmt = $conn->prepare("CALL award_xp(?, ?, ?, ?, ?)");
                        $count_text = $required_count > 1 ? " (completed " . $required_count . " tasks)" : "";
                        $reason = "Earned " . $reward['rarity'] . " badge: " . $reward['title'] . $count_text;
                        $source_type = "task_type_completion";
                        $source_id = 0;
                        $xp_stmt->bind_param("iissi", $user_id, $xp_amount, $reason, $source_type, $source_id);
                        $xp_stmt->execute();
                        $xp_stmt->close();
                        
                        error_log("Awarded task_type_completion reward: " . $reward['title'] . " (" . $reward['rarity'] . ", " . $xp_amount . " XP, " . $completed_count . "/" . $required_count . " tasks) to user " . $user_id);
                    }
                }
                $check_stmt->close();
            }
        }
        
        $stmt->close();
        return true;
    } catch (Exception $e) {
        error_log("Failed to check task type completion: " . $e->getMessage());
        return false;
    }
}

/**
 * Check and award task set completion rewards
 * This checks if the user has completed all tasks in any task set
 */
function checkTaskSetCompletion($conn, $user_id, $task_id) {
    try {
        // Get all rewards with task_set_completion trigger (including rarity for XP calculation)
        $stmt = $conn->prepare("
            SELECT id, title, trigger_condition, rarity, reward_identifier, reward_type
            FROM rewards
            WHERE trigger_type = 'task_set_completion'
            AND is_active = 1
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($reward = $result->fetch_assoc()) {
            $trigger_condition = json_decode($reward['trigger_condition'], true);
            
            if (!isset($trigger_condition['task_ids']) || !is_array($trigger_condition['task_ids'])) {
                continue;
            }
            
            $task_ids = $trigger_condition['task_ids'];
            
            // Check if the completed task is part of this task set
            if (!in_array($task_id, $task_ids)) {
                continue;
            }
            
            // Check if user has already earned this reward
            $check_stmt = $conn->prepare("
                SELECT id FROM user_rewards 
                WHERE user_id = ? AND reward_identifier = ?
            ");
            $check_stmt->bind_param("is", $user_id, $reward['reward_identifier']);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            
            if ($check_result->num_rows > 0) {
                $check_stmt->close();
                continue; // Already earned
            }
            $check_stmt->close();
            
            // Check if user has completed ALL tasks in the set
            $placeholders = implode(',', array_fill(0, count($task_ids), '?'));
            $completed_stmt = $conn->prepare("
                SELECT COUNT(DISTINCT task_id) as completed_count
                FROM user_task_submissions
                WHERE user_id = ? AND task_id IN ($placeholders)
            ");
            
            // Bind parameters dynamically
            $types = str_repeat('i', count($task_ids) + 1);
            $params = array_merge([$user_id], $task_ids);
            $completed_stmt->bind_param($types, ...$params);
            $completed_stmt->execute();
            $completed_result = $completed_stmt->get_result();
            $completed_data = $completed_result->fetch_assoc();
            $completed_stmt->close();
            
            // If all tasks in the set are completed, award the reward
            if ($completed_data['completed_count'] == count($task_ids)) {
                // Award XP based on rarity
                $xp_amount = getXPByRarity($reward['rarity']);
                $xp_stmt = $conn->prepare("CALL award_xp(?, ?, ?, 'task_set_completion', ?)");
                $xp_reason = "Completed " . $reward['rarity'] . " task set: " . $reward['title'];
                $xp_stmt->bind_param("iisi", $user_id, $xp_amount, $xp_reason, $reward['id']);
                $xp_stmt->execute();
                $xp_stmt->close();
                
                // Award the reward (badge or title)
                $metadata = json_encode([
                    'task_ids' => $task_ids,
                    'completion_date' => date('Y-m-d H:i:s')
                ]);
                
                $insert_stmt = $conn->prepare("
                    INSERT INTO user_rewards 
                    (user_id, reward_type, reward_identifier, reward_name, reward_description, source_type, source_id, metadata, earned_date)
                    VALUES (?, ?, ?, ?, ?, 'task_set_completion', ?, ?, NOW())
                ");
                $insert_stmt->bind_param("issssis", 
                    $user_id, 
                    $reward['reward_type'], 
                    $reward['reward_identifier'], 
                    $reward['title'],
                    'Completed all tasks in the set',
                    $reward['id'],
                    $metadata
                );
                $insert_stmt->execute();
                $insert_stmt->close();
                
                error_log("Task set completion reward awarded: " . $reward['title'] . " (" . $reward['rarity'] . ", " . $xp_amount . " XP) to user " . $user_id);
            }
        }
        
        $stmt->close();
        return true;
        
    } catch (Exception $e) {
        error_log("Failed to check task set completion: " . $e->getMessage());
        return false;
    }
}

/**
 * Award XP for task completion
 */
function awardTaskXP($conn, $user_id, $task_type, $task_id, $score = 100) {
    try {
        // Base XP amounts per task type
        $xp_amounts = [
            'quiz' => 25,
            'photo_upload' => 20,
            'qr_checkin' => 15,
            'guide_reading' => 10,
            'checkin' => 15,
            'count_confirm' => 20,
            'direction' => 20,
            'riddle' => 30,
            'memory_recall' => 30,
            'observation_match' => 25,
            'route_completion' => 35,
            'time_based' => 15
        ];
        
        $base_xp = isset($xp_amounts[$task_type]) ? $xp_amounts[$task_type] : 15;
        
        // Bonus for perfect score on quiz
        if ($task_type === 'quiz' && $score >= 100) {
            $base_xp += 10; // Bonus for perfect quiz
        }
        
        $reason = "Completed task: " . ucfirst(str_replace('_', ' ', $task_type));
        
        $stmt = $conn->prepare("CALL award_xp(?, ?, ?, 'task', ?)");
        $stmt->bind_param("iisi", $user_id, $base_xp, $reason, $task_id);
        $stmt->execute();
        $stmt->close();
        
        return ['awarded' => true, 'xp' => $base_xp];
    } catch (Exception $e) {
        error_log("Failed to award task XP: " . $e->getMessage());
        return ['awarded' => false, 'xp' => 0];
    }
}

/**
 * Award photo card when photo is uploaded
 */
function awardPhotoCard($conn, $user_id, $attraction_id, $quality_score, $photo_url) {
    try {
        $stmt = $conn->prepare("CALL award_photo_card(?, ?, ?, ?)");
        $stmt->bind_param("iiis", $user_id, $attraction_id, $quality_score, $photo_url);
        $stmt->execute();
        $stmt->close();
        return true;
    } catch (Exception $e) {
        error_log("Failed to award photo card: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if attraction is complete and award completion rewards
 */
function checkAttractionCompletion($conn, $user_id, $attraction_id) {
    try {
        // Check progress percentage
        $stmt = $conn->prepare("
            SELECT progress_percentage 
            FROM progress 
            WHERE user_id = ? AND attraction_id = ?
        ");
        $stmt->bind_param("ii", $user_id, $attraction_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return ['complete' => false];
        }
        
        $progress = $result->fetch_assoc();
        $progress_pct = $progress['progress_percentage'];
        $stmt->close();
        
        // If 100% complete, process attraction completion rewards
        if ($progress_pct >= 100) {
            // Calculate quality score based on task completion
            $quality_stmt = $conn->prepare("
                SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN uts.is_correct = 1 THEN 1 ELSE 0 END) as correct_tasks,
                    AVG(COALESCE(uts.score, 100)) as avg_score
                FROM tasks t
                LEFT JOIN user_task_submissions uts ON t.id = uts.task_id AND uts.user_id = ?
                WHERE t.attraction_id = ?
            ");
            $quality_stmt->bind_param("ii", $user_id, $attraction_id);
            $quality_stmt->execute();
            $quality_result = $quality_stmt->get_result();
            $quality_data = $quality_result->fetch_assoc();
            
            $quality_score = intval($quality_data['avg_score']);
            $quality_stmt->close();
            
            // Process attraction completion
            $completion_stmt = $conn->prepare("CALL process_attraction_completion(?, ?, ?)");
            $completion_stmt->bind_param("iii", $user_id, $attraction_id, $quality_score);
            $completion_stmt->execute();
            $completion_stmt->close();
            
            return [
                'complete' => true,
                'quality_score' => $quality_score,
                'completion_processed' => true
            ];
        }
        
        return ['complete' => false, 'progress' => $progress_pct];
        
    } catch (Exception $e) {
        error_log("Failed to check attraction completion: " . $e->getMessage());
        return ['complete' => false, 'error' => $e->getMessage()];
    }
}

/**
 * Get newly earned rewards (for displaying to user)
 */
function getNewlyEarnedRewards($conn, $user_id, $seconds_ago = 10) {
    try {
        $stmt = $conn->prepare("
            SELECT 
                reward_type,
                reward_identifier,
                reward_name,
                reward_description,
                metadata,
                earned_date
            FROM user_rewards
            WHERE user_id = ? 
            AND earned_date >= DATE_SUB(NOW(), INTERVAL ? SECOND)
            ORDER BY earned_date DESC
        ");
        $stmt->bind_param("ii", $user_id, $seconds_ago);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $rewards = [];
        while ($row = $result->fetch_assoc()) {
            if ($row['metadata']) {
                $row['metadata'] = json_decode($row['metadata'], true);
            }
            $rewards[] = $row;
        }
        
        $stmt->close();
        return $rewards;
        
    } catch (Exception $e) {
        error_log("Failed to get newly earned rewards: " . $e->getMessage());
        return [];
    }
}

/**
 * Get user's current stats (XP, level, etc.)
 */
function getUserCurrentStats($conn, $user_id) {
    try {
        $stmt = $conn->prepare("
            SELECT 
                total_xp,
                total_ep,
                current_level,
                xp_to_next_level,
                total_badges,
                total_titles,
                total_stamps,
                total_photo_cards
            FROM user_stats
            WHERE user_id = ?
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            // Initialize stats if not exists
            $init_stmt = $conn->prepare("CALL init_user_stats(?)");
            $init_stmt->bind_param("i", $user_id);
            $init_stmt->execute();
            $init_stmt->close();
            
            // Retry
            $stmt->execute();
            $result = $stmt->get_result();
        }
        
        $stats = $result->fetch_assoc();
        $stmt->close();
        
        // Add formatted values
        $stats['total_xp'] = intval($stats['total_xp']);
        $stats['total_ep'] = intval($stats['total_ep']);
        $stats['current_level'] = intval($stats['current_level']);
        $stats['xp_to_next_level'] = intval($stats['xp_to_next_level']);
        
        return $stats;
        
    } catch (Exception $e) {
        error_log("Failed to get user stats: " . $e->getMessage());
        return null;
    }
}

/**
 * Get category progress for display
 */
function getCategoryProgress($conn, $user_id) {
    try {
        $stmt = $conn->prepare("
            SELECT 
                category,
                completed_attractions,
                total_attractions,
                completion_percentage,
                bronze_unlocked,
                silver_unlocked,
                gold_unlocked
            FROM user_category_progress
            WHERE user_id = ?
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            // Format values
            $row['completion_percentage'] = floatval($row['completion_percentage']);
            $row['bronze_unlocked'] = (bool)$row['bronze_unlocked'];
            $row['silver_unlocked'] = (bool)$row['silver_unlocked'];
            $row['gold_unlocked'] = (bool)$row['gold_unlocked'];
            
            // Determine current tier
            if ($row['gold_unlocked']) {
                $row['current_tier'] = 'gold';
            } elseif ($row['silver_unlocked']) {
                $row['current_tier'] = 'silver';
            } elseif ($row['bronze_unlocked']) {
                $row['current_tier'] = 'bronze';
            } else {
                $row['current_tier'] = 'none';
            }
            
            $categories[$row['category']] = $row;
        }
        
        $stmt->close();
        return $categories;
        
    } catch (Exception $e) {
        error_log("Failed to get category progress: " . $e->getMessage());
        return [];
    }
}

/**
 * Get EP earned in this session (last X seconds)
 */
function getRecentEP($conn, $user_id, $seconds_ago = 15) {
    try {
        $stmt = $conn->prepare("
            SELECT IFNULL(SUM(amount), 0) as ep_earned
            FROM reward_transactions
            WHERE user_id = ? 
            AND transaction_type = 'ep_gain'
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)
        ");
        $stmt->bind_param("ii", $user_id, $seconds_ago);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        $stmt->close();
        
        return intval($data['ep_earned']);
        
    } catch (Exception $e) {
        error_log("Failed to get recent EP: " . $e->getMessage());
        return 0;
    }
}

/**
 * Get current attraction's category
 */
function getAttractionCategory($conn, $attraction_id) {
    try {
        $stmt = $conn->prepare("SELECT category FROM attractions WHERE id = ?");
        $stmt->bind_param("i", $attraction_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $stmt->close();
            return $row['category'];
        }
        
        $stmt->close();
        return null;
        
    } catch (Exception $e) {
        error_log("Failed to get attraction category: " . $e->getMessage());
        return null;
    }
}

/**
 * Initialize user in reward system if new user
 */
function initializeUserRewards($conn, $user_id) {
    try {
        // Initialize user stats
        $stmt = $conn->prepare("CALL init_user_stats(?)");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        
        // Initialize category progress for all categories
        $categories = ['malay_traditional', 'temples', 'beaches'];
        foreach ($categories as $category) {
            $init_stmt = $conn->prepare("CALL update_category_progress(?, ?)");
            $init_stmt->bind_param("is", $user_id, $category);
            $init_stmt->execute();
            $init_stmt->close();
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Failed to initialize user rewards: " . $e->getMessage());
        return false;
    }
}

/**
 * RewardHelper class wrapper for compatibility with PDO-based task endpoints
 */
class RewardHelper {
    /**
     * Award task completion rewards (wrapper for PDO connections)
     * This method checks for task type rewards and task set rewards
     */
    public static function awardTaskCompletion($pdo_conn, $user_id, $task_id, $attraction_id, $category, $task_type) {
        try {
            // For PDO connections, we need to handle rewards differently
            // Check for task type completion rewards
            $query = "
                SELECT id, title, trigger_condition, rarity, reward_identifier, reward_type
                FROM rewards
                WHERE trigger_type = 'task_type_completion'
                AND is_active = 1
            ";
            $stmt = $pdo_conn->prepare($query);
            $stmt->execute();
            $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $awarded_rewards = [];
            
            foreach ($rewards as $reward) {
                $trigger_condition = json_decode($reward['trigger_condition'], true);
                
                if (!isset($trigger_condition['task_type']) || empty($trigger_condition['task_type'])) {
                    continue;
                }
                
                $required_task_type = $trigger_condition['task_type'];
                $required_count = isset($trigger_condition['required_count']) ? intval($trigger_condition['required_count']) : 1;
                
                // Check if the completed task matches the required task type
                if ($task_type === $required_task_type) {
                    // Check if user already has this reward
                    $check_query = "
                        SELECT id FROM user_rewards
                        WHERE user_id = :user_id AND reward_identifier = :reward_identifier
                    ";
                    $check_stmt = $pdo_conn->prepare($check_query);
                    $check_stmt->bindParam(':user_id', $user_id);
                    $check_stmt->bindParam(':reward_identifier', $reward['reward_identifier']);
                    $check_stmt->execute();
                    
                    if ($check_stmt->rowCount() === 0) {
                        // Count how many tasks of this type the user has completed
                        $count_query = "
                            SELECT COUNT(DISTINCT t.id) as completed_count
                            FROM tasks t
                            INNER JOIN user_task_submissions uts ON t.id = uts.task_id
                            WHERE uts.user_id = :user_id 
                            AND t.type = :task_type
                            AND uts.is_correct = 1
                        ";
                        $count_stmt = $pdo_conn->prepare($count_query);
                        $count_stmt->bindParam(':user_id', $user_id);
                        $count_stmt->bindParam(':task_type', $required_task_type);
                        $count_stmt->execute();
                        $count_data = $count_stmt->fetch(PDO::FETCH_ASSOC);
                        $completed_count = intval($count_data['completed_count']);
                        
                        // Award the reward if user has completed the required number of tasks
                        if ($completed_count >= $required_count) {
                            $award_query = "
                                INSERT INTO user_rewards (user_id, reward_type, reward_identifier, 
                                                         reward_name, reward_description, category, metadata, earned_date)
                                SELECT :user_id, r.reward_type, r.reward_identifier, r.title, r.description, 
                                       :category, JSON_OBJECT('rarity', r.rarity, 'image', r.image), NOW()
                                FROM rewards r
                                WHERE r.id = :reward_id
                            ";
                            $award_stmt = $pdo_conn->prepare($award_query);
                            $award_stmt->bindParam(':user_id', $user_id);
                            $award_stmt->bindParam(':reward_id', $reward['id']);
                            $award_stmt->bindParam(':category', $category);
                            $award_stmt->execute();
                            
                            // Award XP based on rarity
                            $xp_amount = getXPByRarity($reward['rarity']);
                            $count_text = $required_count > 1 ? " (completed " . $required_count . " tasks)" : "";
                            $reason = "Earned " . $reward['rarity'] . " badge: " . $reward['title'] . $count_text;
                            $source_type = "task_type_completion";
                            
                            $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, :source_type, 0)";
                            $xp_stmt = $pdo_conn->prepare($xp_query);
                            $xp_stmt->bindParam(':user_id', $user_id);
                            $xp_stmt->bindParam(':xp_amount', $xp_amount);
                            $xp_stmt->bindParam(':reason', $reason);
                            $xp_stmt->bindParam(':source_type', $source_type);
                            $xp_stmt->execute();
                            
                            $awarded_rewards[] = [
                                'reward_type' => $reward['reward_type'],
                                'reward_name' => $reward['title'],
                                'rarity' => $reward['rarity'],
                                'xp_awarded' => $xp_amount
                            ];
                            
                            error_log("Awarded task_type_completion reward: " . $reward['title'] . " (" . $reward['rarity'] . ", " . $xp_amount . " XP, " . $completed_count . "/" . $required_count . " tasks) to user " . $user_id);
                        }
                    }
                }
            }
            
            // Check for task set completion rewards
            $set_query = "
                SELECT id, title, trigger_condition, rarity, reward_identifier, reward_type
                FROM rewards
                WHERE trigger_type = 'task_set_completion'
                AND is_active = 1
            ";
            $set_stmt = $pdo_conn->prepare($set_query);
            $set_stmt->execute();
            $set_rewards = $set_stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($set_rewards as $reward) {
                $trigger_condition = json_decode($reward['trigger_condition'], true);
                
                if (!isset($trigger_condition['task_ids']) || !is_array($trigger_condition['task_ids'])) {
                    continue;
                }
                
                $task_ids = $trigger_condition['task_ids'];
                
                // Check if the just-completed task is in this set
                if (in_array($task_id, $task_ids)) {
                    // Check if user already has this reward
                    $check_query = "
                        SELECT id FROM user_rewards
                        WHERE user_id = :user_id AND reward_identifier = :reward_identifier
                    ";
                    $check_stmt = $pdo_conn->prepare($check_query);
                    $check_stmt->bindParam(':user_id', $user_id);
                    $check_stmt->bindParam(':reward_identifier', $reward['reward_identifier']);
                    $check_stmt->execute();
                    
                    if ($check_stmt->rowCount() === 0) {
                        // Check if all tasks in the set are completed
                        $placeholders = implode(',', array_fill(0, count($task_ids), '?'));
                        $completed_query = "
                            SELECT COUNT(DISTINCT uts.task_id) as completed_count
                            FROM user_task_submissions uts
                            WHERE uts.user_id = :user_id 
                            AND uts.task_id IN ($placeholders)
                            AND uts.is_correct = 1
                        ";
                        $completed_stmt = $pdo_conn->prepare($completed_query);
                        $completed_stmt->bindParam(':user_id', $user_id);
                        foreach ($task_ids as $idx => $tid) {
                            $completed_stmt->bindValue($idx + 1, $tid);
                        }
                        $completed_stmt->execute();
                        $completed_data = $completed_stmt->fetch(PDO::FETCH_ASSOC);
                        $completed_count = intval($completed_data['completed_count']);
                        
                        // Award if all tasks completed
                        if ($completed_count >= count($task_ids)) {
                            $award_query = "
                                INSERT INTO user_rewards (user_id, reward_type, reward_identifier, 
                                                         reward_name, reward_description, category, metadata, earned_date)
                                SELECT :user_id, r.reward_type, r.reward_identifier, r.title, r.description, 
                                       :category, JSON_OBJECT('rarity', r.rarity, 'image', r.image), NOW()
                                FROM rewards r
                                WHERE r.id = :reward_id
                            ";
                            $award_stmt = $pdo_conn->prepare($award_query);
                            $award_stmt->bindParam(':user_id', $user_id);
                            $award_stmt->bindParam(':reward_id', $reward['id']);
                            $award_stmt->bindParam(':category', $category);
                            $award_stmt->execute();
                            
                            // Award XP
                            $xp_amount = getXPByRarity($reward['rarity']);
                            $reason = "Completed task set: " . $reward['title'];
                            $source_type = "task_set_completion";
                            
                            $xp_query = "CALL award_xp(:user_id, :xp_amount, :reason, :source_type, 0)";
                            $xp_stmt = $pdo_conn->prepare($xp_query);
                            $xp_stmt->bindParam(':user_id', $user_id);
                            $xp_stmt->bindParam(':xp_amount', $xp_amount);
                            $xp_stmt->bindParam(':reason', $reason);
                            $xp_stmt->bindParam(':source_type', $source_type);
                            $xp_stmt->execute();
                            
                            $awarded_rewards[] = [
                                'reward_type' => $reward['reward_type'],
                                'reward_name' => $reward['title'],
                                'rarity' => $reward['rarity'],
                                'xp_awarded' => $xp_amount
                            ];
                            
                            error_log("Awarded task_set_completion reward: " . $reward['title'] . " to user " . $user_id);
                        }
                    }
                }
            }
            
            return count($awarded_rewards) > 0 ? $awarded_rewards : null;
            
        } catch (Exception $e) {
            error_log("Failed to award task completion rewards: " . $e->getMessage());
            return null;
        }
    }
}
