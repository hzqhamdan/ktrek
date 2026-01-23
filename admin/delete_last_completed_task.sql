-- ============================================
-- Delete Last Completed Task (For Testing Tier Unlocks)
-- This safely removes only your most recent task submission
-- ============================================

-- INSTRUCTIONS:
-- 1. Open phpMyAdmin
-- 2. Select 'ktrek_db' database
-- 3. Copy and paste this query
-- 4. Replace USER_ID with your actual user ID (e.g., 5)
-- 5. Optionally: Replace CATEGORY with specific category ('beaches', 'temples', or 'malay_traditional')
-- 6. Click 'Go'

USE ktrek_db;

-- Set your user ID here
SET @user_id = 5;  -- CHANGE THIS TO YOUR USER ID

-- Set category filter (optional - set to NULL to delete from any category)
SET @category_filter = 'malay_traditional';  -- Options: 'beaches', 'temples', 'malay_traditional', or NULL

-- ============================================
-- View your most recent completed task BEFORE deletion
-- ============================================
SELECT 
    uts.id as submission_id,
    uts.task_id,
    t.name as task_name,
    a.name as attraction_name,
    a.category,
    uts.submitted_at,
    'This will be deleted' as note
FROM user_task_submissions uts
JOIN tasks t ON uts.task_id = t.id
JOIN attractions a ON t.attraction_id = a.id
WHERE uts.user_id = @user_id
AND (@category_filter IS NULL OR a.category COLLATE utf8mb4_general_ci = @category_filter COLLATE utf8mb4_general_ci)
ORDER BY uts.submitted_at DESC
LIMIT 1;

-- ============================================
-- Delete the most recent completed task
-- ============================================
DELETE FROM user_task_submissions
WHERE id = (
    SELECT submission_id FROM (
        SELECT uts.id as submission_id
        FROM user_task_submissions uts
        JOIN tasks t ON uts.task_id = t.id
        JOIN attractions a ON t.attraction_id = a.id
        WHERE uts.user_id = @user_id
        AND (@category_filter IS NULL OR a.category COLLATE utf8mb4_general_ci = @category_filter COLLATE utf8mb4_general_ci)
        ORDER BY uts.submitted_at DESC
        LIMIT 1
    ) as temp
);

-- ============================================
-- Recalculate progress after deletion
-- ============================================
-- This will update your progress tables to reflect the deletion

-- Get the attraction ID of the affected attraction
SET @affected_attraction = (
    SELECT t.attraction_id
    FROM user_task_submissions uts
    JOIN tasks t ON uts.task_id = t.id
    JOIN attractions a ON t.attraction_id = a.id
    WHERE uts.user_id = @user_id
    AND (@category_filter IS NULL OR a.category COLLATE utf8mb4_general_ci = @category_filter COLLATE utf8mb4_general_ci)
    ORDER BY uts.submitted_at DESC
    LIMIT 1
);

-- Update attraction progress (pick any remaining task from that attraction)
SET @any_task_from_attraction = (
    SELECT id FROM tasks WHERE attraction_id = @affected_attraction LIMIT 1
);

CALL update_user_progress(@user_id, @any_task_from_attraction);

-- Update category progress
CALL update_category_progress(@user_id, @category_filter);

-- ============================================
-- Show updated progress
-- ============================================
SELECT '========================================' as '';
SELECT 'Last task deleted successfully!' as '';
SELECT '========================================' as '';

SELECT 
    category,
    completed_attractions,
    total_attractions,
    completion_percentage,
    bronze_unlocked,
    silver_unlocked,
    gold_unlocked
FROM user_category_progress
WHERE user_id = @user_id
AND (@category_filter IS NULL OR category COLLATE utf8mb4_general_ci = @category_filter COLLATE utf8mb4_general_ci);

SELECT '========================================' as '';
SELECT 'Now complete that task again to see the tier unlock modal!' as '';
SELECT '========================================' as '';
