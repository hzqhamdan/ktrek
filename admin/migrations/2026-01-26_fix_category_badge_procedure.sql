-- ============================================
-- Fix award_category_tier_badge Procedure
-- Remove the logic that auto-creates badge entries in user_rewards
-- Category tiers should only be tracked in user_category_progress
-- ============================================

USE ktrek_db;

-- Drop the old procedure
DROP PROCEDURE IF EXISTS award_category_tier_badge;

-- Create new simplified procedure that ONLY updates category progress
-- Does NOT create badge entries in user_rewards
DELIMITER $$

CREATE PROCEDURE award_category_tier_badge(
    IN p_user_id INT,
    IN p_category VARCHAR(50),
    IN p_tier VARCHAR(20)  -- 'bronze', 'silver', or 'gold'
)
BEGIN
    DECLARE v_already_unlocked BOOLEAN DEFAULT FALSE;
    
    -- Check if tier is already unlocked
    IF p_tier = 'bronze' THEN
        SELECT bronze_unlocked INTO v_already_unlocked
        FROM user_category_progress
        WHERE user_id = p_user_id AND category = p_category;
        
        IF NOT v_already_unlocked THEN
            -- Update the bronze_unlocked flag only
            UPDATE user_category_progress
            SET bronze_unlocked = TRUE
            WHERE user_id = p_user_id AND category = p_category;
            
            -- Log the achievement (optional)
            -- Award XP for milestone (optional - can be done elsewhere)
            -- But DO NOT create a badge entry in user_rewards
        END IF;
        
    ELSEIF p_tier = 'silver' THEN
        SELECT silver_unlocked INTO v_already_unlocked
        FROM user_category_progress
        WHERE user_id = p_user_id AND category = p_category;
        
        IF NOT v_already_unlocked THEN
            UPDATE user_category_progress
            SET silver_unlocked = TRUE
            WHERE user_id = p_user_id AND category = p_category;
        END IF;
        
    ELSEIF p_tier = 'gold' THEN
        SELECT gold_unlocked INTO v_already_unlocked
        FROM user_category_progress
        WHERE user_id = p_user_id AND category = p_category;
        
        IF NOT v_already_unlocked THEN
            UPDATE user_category_progress
            SET gold_unlocked = TRUE
            WHERE user_id = p_user_id AND category = p_category;
        END IF;
    END IF;
    
    -- Note: This procedure now ONLY updates the tier flags in user_category_progress
    -- It does NOT insert any entries into user_rewards table
    -- Category milestones are displayed via CategoryMilestone component
    -- which reads directly from user_category_progress table
END$$

DELIMITER ;

-- Verify the procedure was created
SHOW CREATE PROCEDURE award_category_tier_badge;

SELECT 'Procedure updated successfully. Category tier badges will no longer be auto-created in user_rewards.' as status;

