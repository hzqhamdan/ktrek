-- ============================================
-- Add task_type_completion Trigger Type
-- This migration adds support for rewarding users
-- when they complete any task of a specific type
-- ============================================

USE ktrek_db;

-- Add 'task_type_completion' to the trigger_type ENUM
ALTER TABLE rewards
MODIFY COLUMN trigger_type ENUM(
    'task_completion',
    'task_set_completion',
    'attraction_completion',
    'category_milestone',
    'manual',
    'task_type_completion'
) DEFAULT NULL;

-- Update existing NULL trigger_types to 'manual' for consistency
UPDATE rewards 
SET trigger_type = 'manual' 
WHERE trigger_type IS NULL;

-- Example trigger_condition format for task_type_completion:
-- {"task_type": "quiz"} or {"task_type": "checkin"} etc.
-- Valid task types: checkin (required first), quiz, observation_match, 
--                   count_confirm, direction, time_based
-- Note: memory_recall, route_completion, riddle, and photo types have been removed
