-- Diagnose Reward Issues
-- This will show exactly what's happening with your rewards

USE ktrek_db;

SET @user_id = 5; -- CHANGE THIS TO YOUR USER ID

SELECT '=== DIAGNOSTIC REPORT ===' as '';

-- 1. Check current stats
SELECT '1. Current Stats:' as '';
SELECT * FROM user_stats WHERE user_id = @user_id;

-- 2. Count rewards by type
SELECT '2. Rewards by Type:' as '';
SELECT 
    reward_type,
    COUNT(*) as total_count
FROM user_rewards
WHERE user_id = @user_id
GROUP BY reward_type;

-- 3. Check for duplicate stamps
SELECT '3. Duplicate Stamps Check:' as '';
SELECT 
    reward_identifier,
    reward_name,
    COUNT(*) as count,
    GROUP_CONCAT(id ORDER BY id) as reward_ids,
    MIN(earned_date) as first_earned,
    MAX(earned_date) as last_earned
FROM user_rewards
WHERE user_id = @user_id
AND reward_type = 'stamp'
GROUP BY reward_identifier, reward_name
HAVING COUNT(*) > 1;

-- 4. Check for duplicate photo cards
SELECT '4. Duplicate Photo Cards Check:' as '';
SELECT 
    reward_identifier,
    reward_name,
    COUNT(*) as count,
    GROUP_CONCAT(id ORDER BY id) as reward_ids
FROM user_rewards
WHERE user_id = @user_id
AND reward_type = 'photo_card'
GROUP BY reward_identifier, reward_name
HAVING COUNT(*) > 1;

-- 5. Check actual stamps in user_task_stamps table
SELECT '5. Actual Stamps in user_task_stamps:' as '';
SELECT 
    stamp_type,
    COUNT(*) as count
FROM user_task_stamps
WHERE user_id = @user_id
GROUP BY stamp_type;

-- 6. Check actual photo cards in user_photo_cards table
SELECT '6. Actual Photo Cards in user_photo_cards:' as '';
SELECT 
    attraction_id,
    card_type,
    quality_score
FROM user_photo_cards
WHERE user_id = @user_id;

-- 7. Check badge fragments
SELECT '7. Badge Fragments:' as '';
SELECT 
    category,
    fragments_collected,
    fragments_required,
    is_complete
FROM user_badge_fragments
WHERE user_id = @user_id;

-- 8. Check if any badges were awarded
SELECT '8. Badges in user_rewards:' as '';
SELECT 
    reward_name,
    category,
    earned_date
FROM user_rewards
WHERE user_id = @user_id
AND reward_type = 'badge';

-- 9. Check recent reward transactions
SELECT '9. Recent Reward Transactions (Last 20):' as '';
SELECT 
    transaction_type,
    amount,
    reason,
    created_at
FROM reward_transactions
WHERE user_id = @user_id
ORDER BY created_at DESC
LIMIT 20;

-- 10. Check completed attractions
SELECT '10. Completed Attractions (100%):' as '';
SELECT 
    p.attraction_id,
    a.name,
    a.category,
    p.progress_percentage,
    p.completed_at
FROM progress p
JOIN attractions a ON p.attraction_id = a.id
WHERE p.user_id = @user_id
AND p.progress_percentage >= 100;

-- 11. Compare counts
SELECT '11. Count Comparison:' as '';
SELECT 
    'In user_rewards table' as source,
    (SELECT COUNT(*) FROM user_rewards WHERE user_id = @user_id AND reward_type = 'stamp') as stamp_count,
    (SELECT COUNT(*) FROM user_rewards WHERE user_id = @user_id AND reward_type = 'photo_card') as photo_card_count
UNION ALL
SELECT 
    'In user_stats table' as source,
    (SELECT total_stamps FROM user_stats WHERE user_id = @user_id) as stamp_count,
    (SELECT total_photo_cards FROM user_stats WHERE user_id = @user_id) as photo_card_count
UNION ALL
SELECT 
    'In actual tables' as source,
    (SELECT COUNT(*) FROM user_task_stamps WHERE user_id = @user_id) as stamp_count,
    (SELECT COUNT(*) FROM user_photo_cards WHERE user_id = @user_id) as photo_card_count;

SELECT '=== END DIAGNOSTIC ===' as '';
