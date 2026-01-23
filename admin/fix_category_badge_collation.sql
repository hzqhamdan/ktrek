-- ============================================
-- Fix Collation Issue in Category Tier Badge Procedure
-- ============================================

USE ktrek_db;

DELIMITER $$

-- Drop and recreate the procedure with proper collation handling
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
    
    -- Check if badge already exists (using COLLATE to match collations)
    SELECT COUNT(*) INTO v_badge_exists
    FROM user_rewards
    WHERE user_id = p_user_id 
    AND reward_type = 'badge'
    AND reward_identifier COLLATE utf8mb4_unicode_ci = v_reward_identifier COLLATE utf8mb4_unicode_ci;
    
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
    END IF;
END$$

DELIMITER ;

-- Test the fixed procedure
SELECT '========================================' as '';
SELECT 'Category Badge Procedure Fixed!' as '';
SELECT '========================================' as '';
SELECT 'Collation issue resolved. You can now run award_existing_category_badges.sql' as '';
SELECT '========================================' as '';
