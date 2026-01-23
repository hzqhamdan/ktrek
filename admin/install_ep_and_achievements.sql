-- ============================================
-- Fix Stored Procedures to Match Table Structure
-- user_rewards table has 'category' but NO 'tier' column
-- Store tier info in metadata JSON instead
-- ============================================

USE ktrek_db;

SELECT '=== FIXING PROCEDURES ===' as '';

DELIMITER $$

-- Fix 1: award_category_completion_badge
DROP PROCEDURE IF EXISTS award_category_completion_badge$$

CREATE PROCEDURE award_category_completion_badge(
    IN p_user_id INT,
    IN p_category VARCHAR(50),
    IN p_tier VARCHAR(20)
)
BEGIN
    DECLARE v_badge_exists INT DEFAULT 0;
    DECLARE v_badge_name VARCHAR(255);
    DECLARE v_badge_description TEXT;
    
    -- Create badge name
    SET v_badge_name = CONCAT(UPPER(SUBSTRING(p_tier, 1, 1)), SUBSTRING(p_tier, 2), ' ', 
                             REPLACE(REPLACE(p_category, '_', ' '), 'malay traditional', 'Malay Traditional'));
    SET v_badge_description = CONCAT('Completed ', p_tier, ' tier for ', v_badge_name, ' category');
    
    -- Check if badge already exists
    SELECT COUNT(*) INTO v_badge_exists
    FROM user_rewards
    WHERE user_id = p_user_id 
    AND reward_type = 'badge'
    AND reward_identifier = CONCAT('badge_', p_category, '_', p_tier);
    
    IF v_badge_exists = 0 THEN
        -- Award badge (store tier in metadata since no tier column)
        INSERT INTO user_rewards (
            user_id, reward_type, reward_identifier, reward_name,
            reward_description, category, source_type, source_id, metadata, earned_date
        ) VALUES (
            p_user_id, 'badge', CONCAT('badge_', p_category, '_', p_tier),
            v_badge_name, v_badge_description, p_category, 'category', NULL,
            JSON_OBJECT('tier', p_tier),
            NOW()
        );
        
        -- Update user stats
        UPDATE user_stats
        SET total_badges = total_badges + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Log transaction
        INSERT INTO reward_transactions (user_id, transaction_type, amount, reason, created_at)
        VALUES (p_user_id, 'badge_earned', 1, CONCAT('Earned ', v_badge_name, ' badge'), NOW());
    END IF;
END$$

-- Fix 2: check_multi_category_achievements (Dual Master & Grand Master)
DROP PROCEDURE IF EXISTS check_multi_category_achievements$$

CREATE PROCEDURE check_multi_category_achievements(
    IN p_user_id INT
)
BEGIN
    DECLARE v_completed_categories INT DEFAULT 0;
    DECLARE v_total_categories INT DEFAULT 0;
    DECLARE v_dual_master_exists INT DEFAULT 0;
    DECLARE v_grand_master_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_completed_categories FROM user_category_progress
    WHERE user_id = p_user_id AND completion_percentage >= 100;
    
    SELECT COUNT(DISTINCT category) INTO v_total_categories FROM attractions;
    
    -- Dual Category Master
    IF v_completed_categories >= 2 THEN
        SELECT COUNT(*) INTO v_dual_master_exists FROM user_rewards
        WHERE user_id = p_user_id AND reward_identifier = 'achievement_dual_category_master';
        
        IF v_dual_master_exists = 0 THEN
            INSERT INTO user_rewards (
                user_id, reward_type, reward_identifier, reward_name,
                reward_description, category, source_type, source_id, metadata, earned_date
            ) VALUES (
                p_user_id, 'badge', 'achievement_dual_category_master', 'Dual Category Master',
                'Completed 100% of tasks in 2 or more categories', 'special', 'milestone', NULL,
                JSON_OBJECT('tier', 'master', 'categories_completed', v_completed_categories),
                NOW()
            );
            
            CALL award_ep(p_user_id, 500, 'Achieved Dual Category Master', 'achievement', 0);
            
            INSERT INTO user_titles (user_id, title_text, title_identifier, category, unlocked_date)
            VALUES (p_user_id, 'Category Explorer', 'dual_category_master', 'special', NOW())
            ON DUPLICATE KEY UPDATE unlocked_date = NOW();
            
            UPDATE user_stats SET total_badges = total_badges + 1, total_titles = total_titles + 1, updated_at = NOW()
            WHERE user_id = p_user_id;
            
            INSERT INTO user_milestones (user_id, milestone_type, milestone_name, description, achieved_at)
            VALUES (p_user_id, 'achievement', 'Dual Category Master', CONCAT('Completed ', v_completed_categories, ' categories'), NOW());
        END IF;
    END IF;
    
    -- Grand Master
    IF v_completed_categories >= v_total_categories AND v_total_categories > 0 THEN
        SELECT COUNT(*) INTO v_grand_master_exists FROM user_rewards
        WHERE user_id = p_user_id AND reward_identifier = 'achievement_grand_master';
        
        IF v_grand_master_exists = 0 THEN
            INSERT INTO user_rewards (
                user_id, reward_type, reward_identifier, reward_name,
                reward_description, category, source_type, source_id, metadata, earned_date
            ) VALUES (
                p_user_id, 'badge', 'achievement_grand_master', 'Grand Master Explorer',
                'Legendary achievement: Completed 100% of all attractions in every category',
                'special', 'milestone', NULL,
                JSON_OBJECT('tier', 'legendary', 'categories_completed', v_completed_categories),
                NOW()
            );
            
            CALL award_ep(p_user_id, 1000, 'Achieved Grand Master status!', 'achievement', 0);
            
            INSERT INTO user_titles (user_id, title_text, title_identifier, category, unlocked_date)
            VALUES (p_user_id, 'Grand Master Explorer', 'grand_master', 'special', NOW())
            ON DUPLICATE KEY UPDATE unlocked_date = NOW();
            
            -- Add to leaderboard/Hall of Fame (check what columns exist first)
            INSERT INTO leaderboard (user_id, total_xp, total_ep, rank, achievements, last_updated)
            SELECT p_user_id, us.total_xp, us.total_ep, 1,
                   JSON_OBJECT('grand_master', TRUE, 'completed_date', NOW()), NOW()
            FROM user_stats us WHERE us.user_id = p_user_id
            ON DUPLICATE KEY UPDATE 
                achievements = JSON_SET(IFNULL(achievements, '{}'), '$.grand_master', TRUE, '$.completed_date', NOW()), 
                last_updated = NOW();
            
            UPDATE user_stats SET total_badges = total_badges + 1, total_titles = total_titles + 1, updated_at = NOW()
            WHERE user_id = p_user_id;
            
            INSERT INTO user_milestones (user_id, milestone_type, milestone_name, description, achieved_at)
            VALUES (p_user_id, 'achievement', 'Grand Master Explorer', 'Completed ALL categories - Legendary status achieved!', NOW());
        END IF;
    END IF;
END$$

DELIMITER ;

SELECT '=== PROCEDURES FIXED ===' as '';
SELECT 'Tier information now stored in metadata JSON column' as note;
SELECT 'Run test_ep_and_achievements.sql to verify!' as next_step;
