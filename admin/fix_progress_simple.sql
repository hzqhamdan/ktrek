-- Simple Progress Fix (Avoids Collation Issues)
-- Run this to fix your progress

USE ktrek_db;

-- Set your user ID
SET @user_id = 5; -- CHANGE THIS TO YOUR USER ID

SELECT 'Fixing progress...' as Status;

-- For each attraction, recalculate progress
-- This avoids the collation issue by not joining tables in UPDATE

-- First, let's see what needs fixing
SELECT 
    p.attraction_id,
    a.name,
    (SELECT COUNT(*) FROM tasks WHERE attraction_id = p.attraction_id) as total_tasks_actual,
    p.total_tasks as total_tasks_in_progress,
    (SELECT COUNT(DISTINCT task_id) 
     FROM user_task_submissions 
     WHERE user_id = @user_id 
     AND task_id IN (SELECT id FROM tasks WHERE attraction_id = p.attraction_id)) as completed_tasks_actual,
    p.completed_tasks as completed_tasks_in_progress,
    p.progress_percentage
FROM progress p
JOIN attractions a ON p.attraction_id = a.id
WHERE p.user_id = @user_id;

-- Now update each field separately to avoid collation issues
UPDATE progress p
SET p.total_tasks = (
    SELECT COUNT(*) 
    FROM tasks t
    WHERE t.attraction_id = p.attraction_id
)
WHERE p.user_id = @user_id;

UPDATE progress p
SET p.completed_tasks = (
    SELECT COUNT(DISTINCT uts.task_id) 
    FROM user_task_submissions uts
    INNER JOIN tasks t ON uts.task_id = t.id
    WHERE uts.user_id = @user_id 
    AND t.attraction_id = p.attraction_id
)
WHERE p.user_id = @user_id;

UPDATE progress p
SET p.progress_percentage = (
    CASE 
        WHEN p.total_tasks > 0 THEN (p.completed_tasks / p.total_tasks) * 100
        ELSE 0
    END
),
p.updated_at = NOW()
WHERE p.user_id = @user_id;

-- Mark completed attractions
UPDATE progress
SET completed_at = NOW()
WHERE user_id = @user_id 
AND progress_percentage >= 100
AND completed_at IS NULL;

-- Show final results
SELECT 
    p.attraction_id,
    a.name as attraction_name,
    p.completed_tasks,
    p.total_tasks,
    ROUND(p.progress_percentage, 2) as progress_pct,
    p.updated_at
FROM progress p
JOIN attractions a ON p.attraction_id = a.id
WHERE p.user_id = @user_id
ORDER BY p.progress_percentage DESC;

-- Show which are 100% complete
SELECT 
    p.attraction_id,
    a.name as attraction_name,
    a.category,
    '100% Complete!' as status
FROM progress p
JOIN attractions a ON p.attraction_id = a.id
WHERE p.user_id = @user_id
AND p.progress_percentage >= 100;

SELECT '✓ Progress Fixed! Check results above.' as Status;
