-- Database Updates for QR Check-in System
-- Run these updates after the main database.sql

-- Add latitude and longitude to attractions table (if not exists)
ALTER TABLE attractions 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL AFTER description,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Add navigation link (Google Maps URL) to attractions (if not exists)
-- This can be a full Google Maps link (e.g., https://maps.google.com/?q=... or https://www.google.com/maps/place/...) 
ALTER TABLE attractions
ADD COLUMN IF NOT EXISTS navigation_link VARCHAR(1000) NULL AFTER longitude;

-- Add creator column for attraction-based ownership (used by admin APIs)
ALTER TABLE attractions
ADD COLUMN IF NOT EXISTS created_by_admin_id INT NULL;

-- Optional: add FK (if supported/desired)
-- ALTER TABLE attractions ADD CONSTRAINT fk_attractions_created_by_admin
--   FOREIGN KEY (created_by_admin_id) REFERENCES admin(id) ON DELETE SET NULL;

-- Add avatar fields to users table (DiceBear avatar onboarding)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(50) NULL AFTER profile_picture,
ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(255) NULL AFTER avatar_style;

-- Add location validation columns to user_task_submissions
ALTER TABLE user_task_submissions 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL AFTER photo_url,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Add index on qr_code for faster lookup
ALTER TABLE tasks 
ADD INDEX IF NOT EXISTS idx_qr_code (qr_code);

-- Add task order column to enforce check-in as first task
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_order INT DEFAULT 0 AFTER type;

-- Admin account tracking (for Superadmin dashboard)
-- status: active/deactivated/suspended (kept separate from is_active for backward compatibility)
ALTER TABLE admin
ADD COLUMN IF NOT EXISTS status ENUM('active','deactivated','suspended') NOT NULL DEFAULT 'active' AFTER is_active,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL DEFAULT NULL AFTER status;

-- Update existing checkin tasks to have order = 1 (first task)
UPDATE tasks SET task_order = 1 WHERE type = 'checkin';

-- Update other tasks to have order = 10 (after checkin)
UPDATE tasks SET task_order = 10 WHERE type != 'checkin' AND task_order = 0;
