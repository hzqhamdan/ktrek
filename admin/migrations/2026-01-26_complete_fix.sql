-- ============================================
-- COMPLETE FIX: Remove Auto-Generated Category Milestone Badges
-- Run this entire script in phpMyAdmin
-- ============================================

USE ktrek_db;

-- ============================================
-- STEP 1: CREATE BACKUP
-- ============================================
DROP TABLE IF EXISTS user_rewards_category_badges_backup;
CREATE TABLE user_rewards_category_badges_backup (
    id INT,
    user_id INT,
    reward_type VARCHAR(50),
    reward_identifier VARCHAR(100),
    reward_name VARCHAR(255),
    reward_description TEXT,
    category VARCHAR(50),
    earned_date TIMESTAMP,
    backed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup auto-generated category tier badges
INSERT INTO user_rewards_category_badges_backup 
    (id, user_id, reward_type, reward_identifier, reward_name, reward_description, category, earned_date)
SELECT 
    id, user_id, reward_type, reward_identifier, reward_name, reward_description, category, earned_date
FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold';

SELECT '✓ Backup created' as step1_status, COUNT(*) as backed_up_records 
FROM user_rewards_category_badges_backup;

-- ============================================
-- STEP 2: SHOW WHAT WILL BE DELETED
-- ============================================
SELECT 
    '⚠️  These records will be deleted from user_rewards:' as notice;
    
SELECT 
    id, user_id, reward_name, category, earned_date
FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold'
ORDER BY user_id, earned_date;

-- ============================================
-- STEP 3: DELETE AUTO-GENERATED BADGES
-- ============================================
DELETE FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold';

SELECT '✓ Auto-generated category badges deleted' as step3_status, ROW_COUNT() as deleted_count;

-- ============================================
-- STEP 4: UPDATE THE STORED PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS award_category_tier_badge;

DELIMITER $$

CREATE PROCEDURE award_category_tier_badge(
    IN p_user_id INT,
    IN p_category VARCHAR(50),
    IN p_tier VARCHAR(20)
)
BEGIN
    DECLARE v_already_unlocked BOOLEAN DEFAULT FALSE;
    DECLARE v_exists INT DEFAULT 0;
    
    -- Check if user_category_progress record exists
    SELECT COUNT(*) INTO v_exists
    FROM user_category_progress
    WHERE user_id = p_user_id AND category = p_category;
    
    -- If no record exists, we can't update tiers (should be created first)
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'user_category_progress record must exist before awarding tier';
    END IF;
    
    -- Update the appropriate tier flag
    IF p_tier = 'bronze' THEN
        SELECT bronze_unlocked INTO v_already_unlocked
        FROM user_category_progress
        WHERE user_id = p_user_id AND category = p_category;
        
        IF NOT v_already_unlocked THEN
            UPDATE user_category_progress
            SET bronze_unlocked = TRUE
            WHERE user_id = p_user_id AND category = p_category;
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
END$$

DELIMITER ;

SELECT '✓ Stored procedure updated' as step4_status;

-- ============================================
-- STEP 5: VERIFICATION
-- ============================================

-- Check that auto-generated badges are removed
SELECT 
    'Verification: Auto-generated badges remaining' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END as result
FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold';

-- Show category progress is intact
SELECT 
    'Verification: Category progress data' as check_type;
    
SELECT 
    user_id, 
    category, 
    bronze_unlocked, 
    silver_unlocked, 
    gold_unlocked, 
    completion_percentage,
    CASE 
        WHEN gold_unlocked THEN '🥇 Gold'
        WHEN silver_unlocked THEN '🥈 Silver'
        WHEN bronze_unlocked THEN '🥉 Bronze'
        ELSE 'No tier'
    END as current_tier
FROM user_category_progress
ORDER BY user_id, category;

-- Show remaining badges (should only be manually created ones)
SELECT 
    'Verification: Remaining badges in user_rewards' as check_type;
    
SELECT 
    id,
    user_id,
    reward_name,
    category,
    earned_date
FROM user_rewards
WHERE reward_type = 'badge'
ORDER BY user_id, earned_date DESC;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 
    '========================================' as message
UNION ALL
SELECT '✓ Migration Complete!' as message
UNION ALL
SELECT '========================================' as message
UNION ALL
SELECT 'Category milestone badges have been removed from user_rewards' as message
UNION ALL
SELECT 'Stored procedure updated to prevent future auto-generation' as message
UNION ALL
SELECT 'Category tiers are now tracked ONLY in user_category_progress' as message
UNION ALL
SELECT 'UI will display milestones via CategoryMilestone component' as message
UNION ALL
SELECT '========================================' as message;

