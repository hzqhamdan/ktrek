-- ============================================
-- K-TREK: Add New Task Types Migration
-- ============================================
-- This script adds support for 7 new task types:
-- 1. observation_match
-- 2. count_confirm
-- 3. direction
-- 4. time_based
-- 5. memory_recall
-- 6. route_completion
-- 7. riddle
-- ============================================

USE ktrek_db;

-- Step 1: Update tasks.type ENUM to include new task types
ALTER TABLE tasks 
MODIFY COLUMN type ENUM(
  'quiz', 
  'checkin', 
  'observation_match',
  'count_confirm',
  'direction',
  'time_based',
  'memory_recall',
  'route_completion',
  'riddle'
) NOT NULL DEFAULT 'quiz';

-- Step 2: Add task_config column for task-specific configurations
-- This will store JSON data like:
-- - Count & Confirm: {"target_object": "pillars", "correct_count": 12, "tolerance": 0}
-- - Time-Based: {"start_time": "17:30:00", "end_time": "19:00:00", "min_duration": 10}
-- - Route Completion: {"checkpoints": [...]}
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_config JSON DEFAULT NULL 
COMMENT 'Task-specific configuration (time windows, GPS coords, correct counts, etc.)';

-- Step 3: Add option_metadata column to quiz_options for complex data
-- This will store JSON data like:
-- - Observation Match: {"match_pair_id": 1, "item_type": "item"}
-- - Route Completion: {"latitude": 6.1234, "longitude": 102.5678, "radius": 50}
ALTER TABLE quiz_options
ADD COLUMN IF NOT EXISTS option_metadata JSON DEFAULT NULL 
COMMENT 'Extra data: match pairs, GPS coordinates, correct positions, etc.';

-- Step 4: Add index for better query performance
ALTER TABLE quiz_options
ADD INDEX IF NOT EXISTS idx_question_order (question_id, option_order);

-- Step 5: Display success message
SELECT '✅ Database schema updated successfully!' as status,
       'New task types: observation_match, count_confirm, direction, time_based, memory_recall, route_completion, riddle' as info;

-- ============================================
-- NOTES:
-- - Existing quiz and checkin tasks are unaffected
-- - quiz_questions and quiz_options tables are reused for all task types
-- - task_config stores task-specific JSON configurations
-- - option_metadata stores additional option data as JSON
-- ============================================
