-- Simple Cleanup Script for Duplicate Rewards
-- Change the user_id value below to your actual user ID

USE ktrek_db;

SET @user_id = 1; -- ⚠️ CHANGE THIS TO YOUR USER ID

-- Show current state BEFORE cleanup
SELECT 'BEFORE CLEANUP:' as status;
SELECT * FROM user_stats WHERE user_id = @user_id;

-- Count rewards before cleanup
SELECT 
    reward_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT reward_identifier) as unique_count
FROM user_rewards
WHERE user_id = @user_id
GROUP BY reward_type;

-- Delete duplicate stamps (keep earliest)
DELETE r1 FROM user_rewards r1
INNER JOIN user_rewards r2 
WHERE 
    r1.id > r2.id 
    AND r1.user_id = r2.user_id 
    AND r1.user_id = @user_id
    AND r1.reward_type = 'stamp'
    AND r1.reward_identifier = r2.reward_identifier;

-- Delete duplicate photo cards (keep earliest)
DELETE r1 FROM user_rewards r1
INNER JOIN user_rewards r2 
WHERE 
    r1.id > r2.id 
    AND r1.user_id = r2.user_id 
    AND r1.user_id = @user_id
    AND r1.reward_type = 'photo_card'
    AND r1.reward_identifier = r2.reward_identifier;

-- Recalculate totals
UPDATE user_stats
SET 
    total_stamps = (
        SELECT COUNT(*) 
        FROM user_rewards 
        WHERE user_id = @user_id AND reward_type = 'stamp'
    ),
    total_photo_cards = (
        SELECT COUNT(*)
        FROM user_rewards
        WHERE user_id = @user_id AND reward_type = 'photo_card'
    ),
    total_badges = (
        SELECT COUNT(*)
        FROM user_rewards
        WHERE user_id = @user_id AND reward_type = 'badge'
    )
WHERE user_id = @user_id;

-- Show current state AFTER cleanup
SELECT 'AFTER CLEANUP:' as status;
SELECT * FROM user_stats WHERE user_id = @user_id;

-- Show reward breakdown
SELECT 
    reward_type,
    COUNT(*) as count
FROM user_rewards
WHERE user_id = @user_id
GROUP BY reward_type;

SELECT '✓ Cleanup Complete!' as Result;
