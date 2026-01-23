-- Quick Update: Add EP to existing procedures
-- Run this to update your procedures to award EP
USE ktrek_db;

DELIMITER $$

-- Update award_task_stamp to call award_first_visit_ep
DROP PROCEDURE IF EXISTS award_task_stamp$$

CREATE PROCEDURE award_task_stamp(
    IN p_user_id INT,
    IN p_task_id INT,
    IN p_attraction_id INT,
    IN p_stamp_type VARCHAR(50)
)
BEGIN
    DECLARE v_stamp_exists INT DEFAULT 0;
    DECLARE v_task_name VARCHAR(255);
    DECLARE v_attraction_name VARCHAR(255);
    
    -- Check if stamp already exists
    SELECT COUNT(*) INTO v_stamp_exists
    FROM user_task_stamps
    WHERE user_id = p_user_id AND task_id = p_task_id;
    
    IF v_stamp_exists = 0 THEN
        -- Get task and attraction names
        SELECT t.name, a.name INTO v_task_name, v_attraction_name
        FROM tasks t
        JOIN attractions a ON t.attraction_id = a.id
        WHERE t.id = p_task_id;
        
        -- Insert stamp into user_task_stamps
        INSERT INTO user_task_stamps (
            user_id, task_id, attraction_id, stamp_type
        ) VALUES (
            p_user_id, p_task_id, p_attraction_id, p_stamp_type
        );
        
        -- Add to user_rewards table
        INSERT INTO user_rewards (
            user_id, reward_type, reward_identifier, reward_name,
            reward_description, source_type, source_id, metadata, earned_date
        ) VALUES (
            p_user_id, 'stamp', CONCAT('stamp_', p_task_id),
            CONCAT(v_stamp_type, ' Stamp'),
            CONCAT('Completed ', v_task_name, ' at ', v_attraction_name),
            'task', p_task_id,
            JSON_OBJECT('task_id', p_task_id, 'attraction_id', p_attraction_id, 'stamp_type', p_stamp_type),
            NOW()
        );
        
        -- Update user stats
        UPDATE user_stats
        SET total_stamps = total_stamps + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- *** NEW: Award first visit EP ***
        CALL award_first_visit_ep(p_user_id, p_attraction_id);
    END IF;
END$$

-- Update process_attraction_completion to award EP
DROP PROCEDURE IF EXISTS process_attraction_completion$$

CREATE PROCEDURE process_attraction_completion(
    IN p_user_id INT,
    IN p_attraction_id INT,
    IN p_quality_score INT
)
BEGIN
    DECLARE v_category VARCHAR(50);
    DECLARE v_completion_xp INT DEFAULT 50;
    DECLARE v_completion_ep INT DEFAULT 25;  -- *** NEW: EP for completion ***
    DECLARE v_attraction_name VARCHAR(255);
    DECLARE v_already_completed INT DEFAULT 0;
    
    -- Check if already processed
    SELECT COUNT(*) INTO v_already_completed
    FROM progress
    WHERE user_id = p_user_id 
    AND attraction_id = p_attraction_id 
    AND completed_at IS NOT NULL;
    
    IF v_already_completed = 0 THEN
        -- Get attraction info
        SELECT name, category INTO v_attraction_name, v_category
        FROM attractions
        WHERE id = p_attraction_id;
        
        -- Mark attraction as completed
        UPDATE progress
        SET completed_at = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id AND attraction_id = p_attraction_id;
        
        -- Award completion XP
        CALL award_xp(p_user_id, v_completion_xp, 
                     CONCAT('Completed ', v_attraction_name), 
                     'attraction_completion', p_attraction_id);
        
        -- *** NEW: Award completion EP ***
        CALL award_ep(p_user_id, v_completion_ep,
                     CONCAT('Completed all tasks at ', v_attraction_name),
                     'attraction_completion', p_attraction_id);
        
        -- Update progress with EP
        UPDATE progress
        SET ep_earned = ep_earned + v_completion_ep
        WHERE user_id = p_user_id AND attraction_id = p_attraction_id;
        
        -- Update category progress
        CALL update_category_progress(p_user_id, v_category);
        
        -- Log milestone
        INSERT INTO user_milestones (user_id, milestone_type, milestone_name, description, achieved_at)
        VALUES (p_user_id, 'attraction_complete', v_attraction_name,
                CONCAT('Completed all tasks at ', v_attraction_name), NOW());
    END IF;
END$$

DELIMITER ;

SELECT '=== PROCEDURES UPDATED ===' as '';
SELECT 'award_task_stamp now calls award_first_visit_ep' as '';
SELECT 'process_attraction_completion now awards EP' as '';
SELECT '' as '';
SELECT 'Try completing a NEW task now!' as '';
SELECT 'EP should be awarded automatically' as '';
