-- Fix missing columns for time-based task completion
-- Date: 2026-01-29

-- Add missing columns to user_stats table
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS total_stamps INT(11) DEFAULT 0 AFTER total_titles,
ADD COLUMN IF NOT EXISTS total_photo_cards INT(11) DEFAULT 0 AFTER total_stamps;

-- Add missing task_id column to progress table
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS task_id INT(11) DEFAULT NULL AFTER attraction_id,
ADD INDEX idx_progress_task (task_id);

-- Update existing progress records to set task_id based on completed tasks
-- This is optional as new submissions will have task_id populated

SELECT 'Migration completed: Added total_stamps, total_photo_cards to user_stats, and task_id to progress' as status;
