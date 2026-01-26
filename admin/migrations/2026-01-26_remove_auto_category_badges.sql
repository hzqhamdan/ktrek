-- ============================================
-- Remove Auto-Generated Category Milestone Badges
-- These badges are automatically created by stored procedures
-- but should be tracked in user_category_progress table instead
-- ============================================

USE ktrek_db;

-- Step 1: Backup the existing auto-generated category badges before deletion
CREATE TABLE IF NOT EXISTS user_rewards_category_badges_backup (
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

-- Backup category tier badges (bronze/silver/gold badges)
INSERT INTO user_rewards_category_badges_backup 
    (id, user_id, reward_type, reward_identifier, reward_name, reward_description, category, earned_date)
SELECT 
    id, user_id, reward_type, reward_identifier, reward_name, reward_description, category, earned_date
FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold';

-- Show what will be deleted
SELECT 
    'These category milestone badges will be deleted:' as notice,
    id, user_id, reward_name, category, earned_date
FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold';

-- Step 2: Delete the auto-generated category tier badges from user_rewards
-- Uncomment the line below when you're ready to delete
-- DELETE FROM user_rewards
-- WHERE reward_identifier LIKE 'badge_%_bronze'
--    OR reward_identifier LIKE 'badge_%_silver'
--    OR reward_identifier LIKE 'badge_%_gold';

-- Step 3: Update the stored procedure to stop creating these badges
-- We need to DROP and recreate the procedure without the badge insertion logic

-- First, let's see the current procedure (you'll need to run SHOW CREATE PROCEDURE separately)
-- SHOW CREATE PROCEDURE award_category_tier_badge;

-- The procedure should be modified to ONLY update user_category_progress
-- and NOT insert into user_rewards

-- Temporary: Disable the procedure by renaming it (backup)
DROP PROCEDURE IF EXISTS award_category_tier_badge_OLD_BACKUP;
RENAME PROCEDURE award_category_tier_badge TO award_category_tier_badge_OLD_BACKUP;

-- Note: The above RENAME command might not work in all MySQL versions
-- Alternative: Just drop the old one
-- DROP PROCEDURE IF EXISTS award_category_tier_badge_OLD_BACKUP;
-- Then we'll create a new one that doesn't insert into user_rewards

