-- Migration: Add option_metadata column to quiz_options table
-- Required for Observation Match task type to store match pair relationships
-- Run this migration if you already have the database set up

-- Add option_metadata column to quiz_options table
ALTER TABLE quiz_options 
ADD COLUMN option_metadata JSON DEFAULT NULL 
AFTER option_order;

-- Add index for better query performance when filtering by metadata
-- Note: JSON columns can be indexed on specific paths in MySQL 5.7+
-- CREATE INDEX idx_option_metadata ON quiz_options ((CAST(option_metadata->>'$.match_pair_id' AS UNSIGNED)));

-- Verification query (run after migration to confirm)
-- SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'quiz_options' AND COLUMN_NAME = 'option_metadata';
