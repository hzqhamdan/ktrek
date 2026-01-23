-- Clean Up Duplicate Rewards Script
-- Run this after updating the stored procedures

USE ktrek_db;

-- First, let's check what columns exist in user_rewards
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ktrek_db' 
AND TABLE_NAME = 'user_rewards';

-- If the table exists, proceed with cleanup
-- Replace YOUR_USER_ID with your actual user ID

SET @user_id = 1; -- CHANGE THIS TO YOUR USER ID

-- 1. Check for duplicate stamps
SELECT 
    user_id,
    reward_identifier,
    reward_name,
    COUNT(*) as count
FROM user_rewards
WHERE reward_type = 'stamp'
AND user_id = @user_id
GROUP BY user_id, reward_identifier, reward_name
HAVING count > 1;

-- 2. Check for duplicate photo cards
SELECT 
    user_id,
    reward_identifier,
    reward_name,
    COUNT(*) as count
FROM user_rewards
WHERE reward_type = 'photo_card'
AND user_id = @user_id
GROUP BY user_id, reward_identifier, reward_name
HAVING count > 1;

-- 3. Delete duplicate stamps (keep only the first one)
DELETE r1 FROM user_rewards r1
INNER JOIN user_rewards r2 
WHERE 
    r1.id > r2.id 
    AND r1.user_id = r2.user_id 
    AND r1.reward_type = r2.reward_type
    AND r1.reward_identifier = r2.reward_identifier
    AND r1.reward_type = 'stamp';

-- 4. Delete duplicate photo cards (keep only the first one)
DELETE r1 FROM user_rewards r1
INNER JOIN user_rewards r2 
WHERE 
    r1.id > r2.id 
    AND r1.user_id = r2.user_id 
    AND r1.reward_type = r2.reward_type
    AND r1.reward_identifier = r2.reward_identifier
    AND r1.reward_type = 'photo_card';

-- 5. Recalculate correct totals in user_stats
UPDATE user_stats us
SET 
    total_stamps = (
        SELECT COUNT(DISTINCT reward_identifier) 
        FROM user_rewards 
        WHERE user_id = us.user_id AND reward_type = 'stamp'
    ),
    total_photo_cards = (
        SELECT COUNT(DISTINCT reward_identifier)
        FROM user_rewards
        WHERE user_id = us.user_id AND reward_type = 'photo_card'
    ),
    total_badges = (
        SELECT COUNT(*)
        FROM user_rewards
        WHERE user_id = us.user_id AND reward_type = 'badge'
    )
WHERE us.user_id = @user_id;

-- 6. Verify the results
SELECT 
    'After Cleanup' as status,
    total_xp,
    current_level,
    total_badges,
    total_stamps,
    total_photo_cards
FROM user_stats 
WHERE user_id = @user_id;

-- 7. Show current rewards breakdown
SELECT 
    reward_type,
    COUNT(*) as count
FROM user_rewards
WHERE user_id = @user_id
GROUP BY reward_type;

SELECT 'Cleanup Complete!' as Status;
