-- ============================================
-- Update Category Progress to Auto-Create Tier Badges
-- This ensures badges are automatically awarded at 33%, 66%, 100%
-- ============================================

USE ktrek_db;

DELIMITER $$

-- Helper procedure to award category tier badges
DROP PROCEDURE IF EXISTS award_category_tier_badge$$

CREATE PROCEDURE award_category_tier_badge(
    IN p_user_id INT,
    IN p_category VARCHAR(50),
    IN p_tier VARCHAR(20)  -- 'bronze', 'silver', 'gold'
)
BEGIN
    DECLARE v_badge_name VARCHAR(255);
    DECLARE v_badge_description TEXT;
    DECLARE v_badge_exists INT DEFAULT 0;
    DECLARE v_reward_identifier VARCHAR(100);
    
    -- Format category name for display
    SET v_badge_name = CONCAT(
        UPPER(SUBSTRING(REPLACE(p_category, '_', ' '), 1, 1)),
        LOWER(SUBSTRING(REPLACE(p_category, '_', ' '), 2)),
        ' ',
        CASE p_tier
            WHEN 'bronze' THEN 'Explorer'
            WHEN 'silver' THEN 'Adventurer'
            WHEN 'gold' THEN 'Master'
        END
    );
    
    SET v_badge_description = CONCAT(
        'Completed ',
        CASE p_tier
            WHEN 'bronze' THEN '33%'
            WHEN 'silver' THEN '66%'
            WHEN 'gold' THEN '100%'
        END,
        ' of ',
        REPLACE(p_category, '_', ' '),
        ' category attractions'
    );
    
    SET v_reward_identifier = CONCAT('badge_', p_category, '_', p_tier);
    
    -- Check if badge already exists
    SELECT COUNT(*) INTO v_badge_exists
    FROM user_rewards
    WHERE user_id = p_user_id 
    AND reward_type = 'badge'
    AND reward_identifier = v_reward_identifier;
    
    IF v_badge_exists = 0 THEN
        -- Award badge
        INSERT INTO user_rewards (
            user_id, 
            reward_type, 
            reward_identifier, 
            reward_name,
            reward_description, 
            category, 
            source_type,
            earned_date
        ) VALUES (
            p_user_id, 
            'badge', 
            v_reward_identifier,
            v_badge_name, 
            v_badge_description, 
            p_category,
            'category_milestone',
            NOW()
        );
        
        -- Update user stats (if table has badges column)
        -- UPDATE user_stats
        -- SET total_badges = total_badges + 1,
        --     updated_at = NOW()
        -- WHERE user_id = p_user_id;
    END IF;
END$$

-- Update the main category progress procedure
DROP PROCEDURE IF EXISTS update_category_progress$$

CREATE PROCEDURE update_category_progress(
    IN p_user_id INT,
    IN p_category VARCHAR(50)
)
BEGIN
    DECLARE v_total_attractions INT DEFAULT 0;
    DECLARE v_completed_attractions INT DEFAULT 0;
    DECLARE v_completion_pct DECIMAL(5,2);
    DECLARE v_bronze_unlocked TINYINT DEFAULT 0;
    DECLARE v_silver_unlocked TINYINT DEFAULT 0;
    DECLARE v_gold_unlocked TINYINT DEFAULT 0;
    DECLARE v_prev_bronze TINYINT DEFAULT 0;
    DECLARE v_prev_silver TINYINT DEFAULT 0;
    DECLARE v_prev_gold TINYINT DEFAULT 0;
    
    -- Get previous unlock status
    SELECT 
        COALESCE(bronze_unlocked, 0),
        COALESCE(silver_unlocked, 0),
        COALESCE(gold_unlocked, 0)
    INTO v_prev_bronze, v_prev_silver, v_prev_gold
    FROM user_category_progress
    WHERE user_id = p_user_id 
    AND category = p_category COLLATE utf8mb4_unicode_ci;
    
    -- Count total attractions in category
    SELECT COUNT(*) INTO v_total_attractions
    FROM attractions
    WHERE category = p_category COLLATE utf8mb4_unicode_ci;
    
    -- Count completed attractions (100% progress)
    SELECT COUNT(*) INTO v_completed_attractions
    FROM progress p
    JOIN attractions a ON p.attraction_id = a.id
    WHERE p.user_id = p_user_id
    AND a.category COLLATE utf8mb4_unicode_ci = p_category COLLATE utf8mb4_unicode_ci
    AND p.progress_percentage >= 100;
    
    -- Calculate completion percentage
    IF v_total_attractions > 0 THEN
        SET v_completion_pct = (v_completed_attractions / v_total_attractions) * 100;
    ELSE
        SET v_completion_pct = 0;
    END IF;
    
    -- Determine unlock status
    SET v_bronze_unlocked = IF(v_completion_pct >= 33, 1, 0);
    SET v_silver_unlocked = IF(v_completion_pct >= 66, 1, 0);
    SET v_gold_unlocked = IF(v_completion_pct >= 100, 1, 0);
    
    -- Update or insert category progress
    INSERT INTO user_category_progress (
        user_id, 
        category, 
        total_attractions, 
        completed_attractions,
        completion_percentage, 
        bronze_unlocked, 
        silver_unlocked, 
        gold_unlocked, 
        updated_at
    ) VALUES (
        p_user_id, 
        p_category, 
        v_total_attractions, 
        v_completed_attractions,
        v_completion_pct, 
        v_bronze_unlocked,
        v_silver_unlocked,
        v_gold_unlocked,
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        total_attractions = v_total_attractions,
        completed_attractions = v_completed_attractions,
        completion_percentage = v_completion_pct,
        bronze_unlocked = v_bronze_unlocked,
        silver_unlocked = v_silver_unlocked,
        gold_unlocked = v_gold_unlocked,
        last_completion_date = IF(v_completed_attractions > completed_attractions, NOW(), last_completion_date),
        updated_at = NOW();
    
    -- Award tier milestones if newly unlocked
    -- Bronze (33%)
    IF v_bronze_unlocked = 1 AND v_prev_bronze = 0 THEN
        CALL award_ep(p_user_id, 50, CONCAT('Bronze tier unlocked: ', p_category), 'category_milestone', 0);
        CALL award_category_tier_badge(p_user_id, p_category, 'bronze');
    END IF;
    
    -- Silver (66%)
    IF v_silver_unlocked = 1 AND v_prev_silver = 0 THEN
        CALL award_ep(p_user_id, 100, CONCAT('Silver tier unlocked: ', p_category), 'category_milestone', 0);
        CALL award_category_tier_badge(p_user_id, p_category, 'silver');
    END IF;
    
    -- Gold (100%)
    IF v_gold_unlocked = 1 AND v_prev_gold = 0 THEN
        CALL award_ep(p_user_id, 200, CONCAT('Gold tier unlocked: ', p_category), 'category_milestone', 0);
        CALL award_category_tier_badge(p_user_id, p_category, 'gold');
        
        -- Check for multi-category achievements (if procedure exists)
        -- CALL check_multi_category_achievements(p_user_id);
    END IF;
    
END$$

DELIMITER ;

-- ============================================
-- Test the updated procedure
-- ============================================
SELECT '========================================' as '';
SELECT 'Category Tier Badge System Updated!' as '';
SELECT '========================================' as '';
SELECT 'Now badges will be automatically created when users reach 33%, 66%, 100%' as '';
SELECT '========================================' as '';
