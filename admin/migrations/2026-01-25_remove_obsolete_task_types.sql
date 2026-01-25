-- ============================================
-- Remove Obsolete Task Types
-- This migration removes: memory_recall, route_completion, riddle, photo
-- And ensures check-in prerequisite is enforced
-- ============================================

USE ktrek_db;

-- Step 1: Check if there are any existing tasks with these types
-- (This is just for informational purposes - you may want to backup/migrate these)
SELECT 
    type, 
    COUNT(*) as count,
    GROUP_CONCAT(id) as task_ids
FROM tasks 
WHERE type IN ('memory_recall', 'route_completion', 'riddle', 'photo')
GROUP BY type;

-- Step 2: BACKUP existing tasks of these types (optional but recommended)
-- Uncomment the following lines if you want to create a backup table:
/*
CREATE TABLE IF NOT EXISTS tasks_backup_2026_01_25 AS
SELECT * FROM tasks 
WHERE type IN ('memory_recall', 'route_completion', 'riddle', 'photo');
*/

-- Step 3: Delete user submissions for these task types
DELETE uts FROM user_task_submissions uts
INNER JOIN tasks t ON uts.task_id = t.id
WHERE t.type IN ('memory_recall', 'route_completion', 'riddle', 'photo');

-- Step 4: Delete rewards that trigger on these task types
DELETE FROM rewards
WHERE trigger_type = 'task_type_completion'
AND JSON_EXTRACT(trigger_condition, '$.task_type') IN ('memory_recall', 'route_completion', 'riddle', 'photo');

-- Step 5: Delete the actual tasks
DELETE FROM tasks 
WHERE type IN ('memory_recall', 'route_completion', 'riddle', 'photo');

-- Step 6: Update the tasks type ENUM to remove these types
ALTER TABLE tasks
MODIFY COLUMN type ENUM(
    'quiz',
    'checkin',
    'observation_match',
    'count_confirm',
    'direction',
    'time_based'
) NOT NULL;

-- Step 7: Verify the changes
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ktrek_db' 
  AND TABLE_NAME = 'tasks' 
  AND COLUMN_NAME = 'type';

-- Step 8: Show remaining task types distribution
SELECT type, COUNT(*) as count
FROM tasks
GROUP BY type
ORDER BY count DESC;

-- Note: Check-in prerequisite logic is already implemented in:
-- backend/api/tasks/check-prerequisite.php
-- All non-checkin tasks require checkin completion first
