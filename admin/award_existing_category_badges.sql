-- ============================================
-- Award Category Tier Badges for Existing Progress
-- This script awards badges to users who already have category progress
-- but haven't received badges yet (retroactive award)
-- ============================================

USE ktrek_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS award_all_existing_category_badges$$

CREATE PROCEDURE award_all_existing_category_badges()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_user_id INT;
    DECLARE v_category VARCHAR(50);
    DECLARE v_bronze_unlocked TINYINT;
    DECLARE v_silver_unlocked TINYINT;
    DECLARE v_gold_unlocked TINYINT;
    
    -- Cursor to get all users with category progress
    DECLARE cur CURSOR FOR 
        SELECT user_id, category, bronze_unlocked, silver_unlocked, gold_unlocked
        FROM user_category_progress
        WHERE bronze_unlocked = 1 OR silver_unlocked = 1 OR gold_unlocked = 1;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_user_id, v_category, v_bronze_unlocked, v_silver_unlocked, v_gold_unlocked;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Award bronze badge if unlocked
        IF v_bronze_unlocked = 1 THEN
            CALL award_category_tier_badge(v_user_id, v_category, 'bronze');
        END IF;
        
        -- Award silver badge if unlocked
        IF v_silver_unlocked = 1 THEN
            CALL award_category_tier_badge(v_user_id, v_category, 'silver');
        END IF;
        
        -- Award gold badge if unlocked
        IF v_gold_unlocked = 1 THEN
            CALL award_category_tier_badge(v_user_id, v_category, 'gold');
        END IF;
        
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- Execute the procedure to award all existing badges
CALL award_all_existing_category_badges();

-- Show results
SELECT '========================================' as '';
SELECT 'Retroactive Badge Award Complete!' as '';
SELECT '========================================' as '';
SELECT CONCAT('Total badges awarded: ', COUNT(*)) as 'Result'
FROM user_rewards
WHERE reward_type = 'badge' 
AND source_type = 'category_milestone'
AND DATE(earned_date) = CURDATE();

SELECT '========================================' as '';
SELECT 'Badges by Category:' as '';
SELECT category, COUNT(*) as badge_count
FROM user_rewards
WHERE reward_type = 'badge' 
AND source_type = 'category_milestone'
GROUP BY category;

-- Cleanup
DROP PROCEDURE award_all_existing_category_badges;
