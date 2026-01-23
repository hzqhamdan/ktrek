-- ============================================
-- Test EP System and Achievements
-- Run this AFTER completing install_all_enhancements.sql
-- ============================================

USE ktrek_db;

SET @user_id = 5; -- Change to your user ID

SELECT '========================================' as '';
SELECT 'EP & ACHIEVEMENTS TEST REPORT' as '';
SELECT '========================================' as '';

-- 1. Current EP Status
SELECT '1. Current EP Status:' as '';
SELECT 
    user_id,
    total_xp,
    total_ep,
    current_level,
    total_badges,
    total_stamps
FROM user_stats
WHERE user_id = @user_id;

-- 2. EP Earned by Attraction
SELECT '2. EP Earned per Attraction:' as '';
SELECT 
    p.attraction_id,
    a.name as attraction_name,
    p.completed_tasks,
    p.total_tasks,
    p.progress_percentage,
    p.ep_earned,
    p.completed_at
FROM progress p
JOIN attractions a ON p.attraction_id = a.id
WHERE p.user_id = @user_id
ORDER BY p.attraction_id;

-- 3. EP Transaction History
SELECT '3. Recent EP Transactions:' as '';
SELECT 
    transaction_type,
    amount as ep_amount,
    reason,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as earned_at
FROM reward_transactions
WHERE user_id = @user_id
AND transaction_type = 'ep_gain'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Category Progress
SELECT '4. Category Completion Progress:' as '';
SELECT 
    category,
    completed_attractions,
    total_attractions,
    CONCAT(ROUND(completion_percentage, 1), '%') as completion,
    CASE WHEN bronze_unlocked = 1 THEN '🥉' ELSE '❌' END as bronze,
    CASE WHEN silver_unlocked = 1 THEN '🥈' ELSE '❌' END as silver,
    CASE WHEN gold_unlocked = 1 THEN '🥇' ELSE '❌' END as gold
FROM user_category_progress
WHERE user_id = @user_id
ORDER BY completion_percentage DESC;

-- 5. Category Badges Earned
SELECT '5. Category Badges Earned:' as '';
SELECT 
    reward_name,
    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.tier')), 'N/A') as tier,
    IFNULL(category, 'N/A') as category,
    DATE_FORMAT(earned_date, '%Y-%m-%d') as earned
FROM user_rewards
WHERE user_id = @user_id
AND reward_type = 'badge'
ORDER BY earned_date;

-- 6. Special Achievements
SELECT '6. Special Achievements:' as '';
SELECT 
    reward_name,
    IFNULL(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.tier')), 'special') as tier,
    reward_description,
    DATE_FORMAT(earned_date, '%Y-%m-%d') as earned
FROM user_rewards
WHERE user_id = @user_id
AND reward_identifier IN ('achievement_dual_category_master', 'achievement_grand_master');

-- 7. Titles Unlocked
SELECT '7. Titles Unlocked:' as '';
SELECT 
    title_text,
    title_identifier,
    category,
    CASE WHEN is_active = 1 THEN '✅ Active' ELSE '○ Unlocked' END as status,
    DATE_FORMAT(unlocked_date, '%Y-%m-%d') as unlocked
FROM user_titles
WHERE user_id = @user_id;

-- 8. Hall of Fame Status
SELECT '8. Hall of Fame / Leaderboard Status:' as '';
SELECT 
    l.*,
    u.username
FROM leaderboard l
LEFT JOIN users u ON l.user_id = u.id
WHERE l.user_id = @user_id;

-- 9. EP Summary Statistics
SELECT '9. EP Summary:' as '';
SELECT 
    'Total EP Earned' as metric,
    IFNULL(SUM(amount), 0) as value
FROM reward_transactions
WHERE user_id = @user_id AND transaction_type = 'ep_gain'
UNION ALL
SELECT 
    'EP from First Visits' as metric,
    IFNULL(SUM(amount), 0) as value
FROM reward_transactions
WHERE user_id = @user_id AND transaction_type = 'ep_gain' AND reason LIKE 'First visit%'
UNION ALL
SELECT 
    'EP from Completions' as metric,
    IFNULL(SUM(amount), 0) as value
FROM reward_transactions
WHERE user_id = @user_id AND transaction_type = 'ep_gain' AND reason LIKE 'Completed all tasks%'
UNION ALL
SELECT 
    'EP from Category Tiers' as metric,
    IFNULL(SUM(amount), 0) as value
FROM reward_transactions
WHERE user_id = @user_id AND transaction_type = 'ep_gain' AND reason LIKE 'Unlocked%tier%'
UNION ALL
SELECT 
    'EP from Achievements' as metric,
    IFNULL(SUM(amount), 0) as value
FROM reward_transactions
WHERE user_id = @user_id AND transaction_type = 'ep_gain' AND reason LIKE '%Master%';

-- 10. Next Milestones
SELECT '10. Progress to Next Milestones:' as '';
SELECT 
    category,
    CONCAT(completed_attractions, '/', total_attractions) as progress,
    CASE 
        WHEN completion_percentage < 33 THEN CONCAT('Need ', CEIL((0.33 * total_attractions) - completed_attractions), ' more for Bronze (', ROUND(33 - completion_percentage, 1), '% remaining)')
        WHEN completion_percentage < 66 THEN CONCAT('Need ', CEIL((0.66 * total_attractions) - completed_attractions), ' more for Silver (', ROUND(66 - completion_percentage, 1), '% remaining)')
        WHEN completion_percentage < 100 THEN CONCAT('Need ', CEIL(total_attractions - completed_attractions), ' more for Gold (', ROUND(100 - completion_percentage, 1), '% remaining)')
        ELSE '✅ Gold Complete!'
    END as next_milestone
FROM user_category_progress
WHERE user_id = @user_id
ORDER BY completion_percentage DESC;

SELECT '========================================' as '';
SELECT 'TEST COMPLETE!' as '';
SELECT '========================================' as '';

-- Recommendations
SELECT 'Recommendations:' as '';
SELECT CASE 
    WHEN (SELECT COUNT(*) FROM user_category_progress WHERE user_id = @user_id AND completion_percentage >= 100) = 0
    THEN '🎯 Focus on completing one category to unlock Gold badge!'
    WHEN (SELECT COUNT(*) FROM user_category_progress WHERE user_id = @user_id AND completion_percentage >= 100) = 1
    THEN '🎯 Complete one more category to earn Dual Category Master!'
    WHEN (SELECT COUNT(*) FROM user_category_progress WHERE user_id = @user_id AND completion_percentage >= 100) >= 2
         AND (SELECT COUNT(*) FROM user_rewards WHERE user_id = @user_id AND reward_identifier = 'achievement_dual_category_master') = 0
    THEN '✨ You qualify for Dual Category Master! Complete another attraction to trigger it.'
    WHEN (SELECT COUNT(DISTINCT category) FROM attractions) = (SELECT COUNT(*) FROM user_category_progress WHERE user_id = @user_id AND completion_percentage >= 100)
    THEN '🏆 GRAND MASTER ACHIEVED! You are legendary!'
    ELSE '🌟 Keep exploring to unlock more achievements!'
END as next_goal;
