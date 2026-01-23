-- K-Trek Reward System Testing Script
-- Run this script to test the reward system implementation

USE ktrek_db;

-- ============================================
-- TEST 1: Verify Tables Exist
-- ============================================
SELECT 'TEST 1: Checking if all tables exist...' as test;

SELECT 
    CASE WHEN COUNT(*) = 12 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    COUNT(*) as tables_found,
    12 as tables_expected
FROM information_schema.tables 
WHERE table_schema = 'ktrek_db' 
AND table_name IN (
    'user_rewards', 'user_stats', 'user_category_progress', 'user_milestones',
    'user_cosmetics', 'user_titles', 'user_badge_fragments', 'user_photo_cards',
    'user_task_stamps', 'leaderboard', 'reward_transactions'
);

-- ============================================
-- TEST 2: Verify Stored Procedures Exist
-- ============================================
SELECT 'TEST 2: Checking if stored procedures exist...' as test;

SELECT 
    CASE WHEN COUNT(*) >= 10 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    COUNT(*) as procedures_found,
    '10+' as procedures_expected
FROM information_schema.routines
WHERE routine_schema = 'ktrek_db'
AND routine_type = 'PROCEDURE'
AND routine_name IN (
    'init_user_stats', 'award_xp', 'award_ep', 'award_badge_fragment',
    'award_category_completion_badge', 'award_category_cosmetics',
    'award_task_stamp', 'award_photo_card', 'update_category_progress',
    'process_attraction_completion', 'check_cross_category_achievements'
);

-- ============================================
-- TEST 3: Check Attractions Have Categories
-- ============================================
SELECT 'TEST 3: Checking if attractions are categorized...' as test;

SELECT 
    category,
    COUNT(*) as attraction_count,
    CASE 
        WHEN category = 'malay_traditional' AND COUNT(*) = 5 THEN '✓'
        WHEN category = 'temples' AND COUNT(*) = 4 THEN '✓'
        WHEN category = 'beaches' AND COUNT(*) = 3 THEN '✓'
        ELSE '⚠️'
    END as status
FROM attractions
GROUP BY category;

-- ============================================
-- TEST 4: Test User Stats Initialization
-- ============================================
SELECT 'TEST 4: Testing user stats initialization...' as test;

-- Create test user if not exists
INSERT IGNORE INTO users (name, email, password, phone, created_at)
VALUES ('Test Reward User', 'test_rewards@ktrek.com', 'test123', '0123456789', NOW());

SET @test_user_id = (SELECT id FROM users WHERE email = 'test_rewards@ktrek.com' LIMIT 1);

-- Initialize stats
CALL init_user_stats(@test_user_id);

-- Verify
SELECT 
    CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    'User stats initialized' as description
FROM user_stats 
WHERE user_id = @test_user_id;

-- ============================================
-- TEST 5: Test XP Award
-- ============================================
SELECT 'TEST 5: Testing XP award system...' as test;

-- Award XP
CALL award_xp(@test_user_id, 150, 'Test XP', 'test', 1);

-- Verify
SELECT 
    CASE WHEN total_xp >= 150 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    total_xp,
    current_level,
    'XP awarded and level calculated' as description
FROM user_stats
WHERE user_id = @test_user_id;

-- ============================================
-- TEST 6: Test Badge Fragment System
-- ============================================
SELECT 'TEST 6: Testing badge fragment system...' as test;

-- Award badge fragment
CALL award_badge_fragment(@test_user_id, 'beaches', 1);

-- Verify
SELECT 
    CASE WHEN fragments_collected = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    category,
    fragments_collected,
    fragments_required,
    'Badge fragment awarded' as description
FROM user_badge_fragments
WHERE user_id = @test_user_id AND category = 'beaches';

-- ============================================
-- TEST 7: Test Category Progress
-- ============================================
SELECT 'TEST 7: Testing category progress tracking...' as test;

-- Initialize category progress
CALL update_category_progress(@test_user_id, 'beaches');

-- Verify
SELECT 
    CASE WHEN id IS NOT NULL THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    category,
    total_attractions,
    completed_attractions,
    completion_percentage,
    'Category progress tracked' as description
FROM user_category_progress
WHERE user_id = @test_user_id AND category = 'beaches';

-- ============================================
-- TEST 8: Test Task Stamp
-- ============================================
SELECT 'TEST 8: Testing task stamp system...' as test;

-- Get a task ID for testing
SET @test_task_id = (SELECT id FROM tasks LIMIT 1);
SET @test_attraction_id = (SELECT attraction_id FROM tasks WHERE id = @test_task_id);

-- Award stamp
CALL award_task_stamp(@test_user_id, @test_task_id, @test_attraction_id, 'quiz');

-- Verify
SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    COUNT(*) as stamps_awarded,
    'Task stamp awarded' as description
FROM user_task_stamps
WHERE user_id = @test_user_id;

-- ============================================
-- TEST 9: Test Photo Card
-- ============================================
SELECT 'TEST 9: Testing photo card system...' as test;

-- Award photo card
CALL award_photo_card(@test_user_id, @test_attraction_id, 85, '/uploads/test.jpg');

-- Verify
SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    card_type,
    quality_score,
    'Photo card created' as description
FROM user_photo_cards
WHERE user_id = @test_user_id;

-- ============================================
-- TEST 10: Test Reward Transactions Log
-- ============================================
SELECT 'TEST 10: Checking reward transaction logging...' as test;

SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as result,
    COUNT(*) as transactions_logged,
    'Transactions logged correctly' as description
FROM reward_transactions
WHERE user_id = @test_user_id;

-- ============================================
-- SUMMARY REPORT
-- ============================================
SELECT '========================================' as '';
SELECT 'REWARD SYSTEM TEST SUMMARY' as '';
SELECT '========================================' as '';

SELECT 
    'Tables' as component,
    CASE WHEN COUNT(*) = 12 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'ktrek_db' 
AND table_name IN (
    'user_rewards', 'user_stats', 'user_category_progress', 'user_milestones',
    'user_cosmetics', 'user_titles', 'user_badge_fragments', 'user_photo_cards',
    'user_task_stamps', 'leaderboard', 'reward_transactions'
)

UNION ALL

SELECT 
    'Stored Procedures' as component,
    CASE WHEN COUNT(*) >= 10 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.routines
WHERE routine_schema = 'ktrek_db'
AND routine_type = 'PROCEDURE'

UNION ALL

SELECT 
    'User Stats' as component,
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM user_stats
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'XP System' as component,
    CASE WHEN total_xp > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM user_stats
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Badge Fragments' as component,
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM user_badge_fragments
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Task Stamps' as component,
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM user_task_stamps
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Photo Cards' as component,
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM user_photo_cards
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Transaction Logging' as component,
    CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM reward_transactions
WHERE user_id = @test_user_id;

-- ============================================
-- View Test User's Reward Summary
-- ============================================
SELECT '========================================' as '';
SELECT 'TEST USER REWARD SUMMARY' as '';
SELECT '========================================' as '';

SELECT 
    'Total XP' as metric,
    total_xp as value
FROM user_stats
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Current Level' as metric,
    current_level as value
FROM user_stats
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Total Rewards' as metric,
    COUNT(*) as value
FROM user_rewards
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Task Stamps' as metric,
    COUNT(*) as value
FROM user_task_stamps
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'Photo Cards' as metric,
    COUNT(*) as value
FROM user_photo_cards
WHERE user_id = @test_user_id;

-- ============================================
-- CLEANUP (Optional - comment out to keep test data)
-- ============================================
-- DELETE FROM user_stats WHERE user_id = @test_user_id;
-- DELETE FROM user_rewards WHERE user_id = @test_user_id;
-- DELETE FROM user_badge_fragments WHERE user_id = @test_user_id;
-- DELETE FROM user_category_progress WHERE user_id = @test_user_id;
-- DELETE FROM user_task_stamps WHERE user_id = @test_user_id;
-- DELETE FROM user_photo_cards WHERE user_id = @test_user_id;
-- DELETE FROM reward_transactions WHERE user_id = @test_user_id;
-- DELETE FROM users WHERE email = 'test_rewards@ktrek.com';

SELECT '========================================' as '';
SELECT 'TESTING COMPLETE!' as '';
SELECT 'Review results above for any ✗ FAIL statuses' as '';
SELECT '========================================' as '';
