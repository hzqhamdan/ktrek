-- ============================================
-- Fix Check-in 500 Error
-- Removes the 'description' column reference in process_attraction_completion
-- ============================================

-- INSTRUCTIONS:
-- 1. Open phpMyAdmin
-- 2. Select 'ktrek_db' database
-- 3. Go to SQL tab
-- 4. Copy and paste this ENTIRE file
-- 5. Click 'Go'

USE ktrek_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS process_attraction_completion$$

CREATE PROCEDURE process_attraction_completion(
    IN p_user_id INT,
    IN p_attraction_id INT,
    IN p_quality_score INT
)
BEGIN
    DECLARE v_category VARCHAR(50);
    DECLARE v_completion_xp INT DEFAULT 50;
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
        
        -- Update category progress
        CALL update_category_progress(p_user_id, v_category);
        
        -- Log milestone (FIXED: removed 'description' column, use 'achievement_date')
        INSERT INTO user_milestones (user_id, milestone_type, milestone_name, achievement_date)
        VALUES (p_user_id, 'attraction_complete', v_attraction_name, NOW());
    END IF;
END$$

DELIMITER ;

SELECT '========================================' as '';
SELECT 'Procedure updated successfully!' as '';
SELECT 'Check-in should now work without 500 error' as '';
SELECT '========================================' as '';
