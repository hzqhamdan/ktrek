-- K-Trek cleanup migration: remove photo uploads, stamps, photo cards, cosmetics (data-only by default)
-- Safe/Non-destructive by default. Destructive DDL steps are included but commented.
-- Database: ktrek_db

/*
How to run (PhpMyAdmin or MySQL CLI):
1) Review the script and uncomment the destructive steps only if/when ready.
2) Run in a transaction-friendly environment for the DML parts if desired.
*/

-- 0) Use database
USE ktrek_db;

-- 1) Backups (idempotent if run once)
-- Note: These CREATE ... LIKE statements require the source tables to exist.
-- If a table doesn't exist in your environment, comment that section out.

-- 1a) Backup user_rewards
CREATE TABLE IF NOT EXISTS user_rewards_backup_photo_cleanup LIKE user_rewards;
INSERT INTO user_rewards_backup_photo_cleanup SELECT * FROM user_rewards;

-- 1b) Backup user_stats
CREATE TABLE IF NOT EXISTS user_stats_backup_photo_cleanup LIKE user_stats;
INSERT INTO user_stats_backup_photo_cleanup SELECT * FROM user_stats;

-- 1c) Backup user_photo_cards (if table exists)
-- Comment out if user_photo_cards does not exist in your schema
CREATE TABLE IF NOT EXISTS user_photo_cards_backup_photo_cleanup LIKE user_photo_cards;
INSERT INTO user_photo_cards_backup_photo_cleanup SELECT * FROM user_photo_cards;

-- 1d) Backup user_cosmetics (if table exists)
-- Comment out if user_cosmetics does not exist in your schema
CREATE TABLE IF NOT EXISTS user_cosmetics_backup_photo_cleanup LIKE user_cosmetics;
INSERT INTO user_cosmetics_backup_photo_cleanup SELECT * FROM user_cosmetics;

-- 2) Non-destructive cleanup
-- Remove discontinued reward types from user_rewards
DELETE FROM user_rewards
WHERE reward_type IN ('stamp', 'photo_card', 'cosmetic');

-- 3) Reset and recompute aggregates in user_stats
-- This preserves XP/EP and other fields, only resets counts tied to removed features.
-- If these columns do not exist in your environment, comment out the update or adjust columns accordingly.
UPDATE user_stats us
SET
  total_stamps = 0,
  total_photo_cards = 0,
  total_cosmetics = 0,
  total_badges = (
    SELECT COUNT(*) FROM user_rewards ur
    WHERE ur.user_id = us.user_id AND ur.reward_type = 'badge'
  ),
  total_titles = (
    SELECT COUNT(*) FROM user_rewards ur
    WHERE ur.user_id = us.user_id AND ur.reward_type = 'title'
  );

-- 4) Optional cleanup for photo traces in submissions (non-destructive)
-- If you want to null out photo_url fields in user_task_submissions because photo tasks are removed:
-- UPDATE user_task_submissions
-- SET photo_url = NULL
-- WHERE photo_url IS NOT NULL;

-- 5) Destructive schema changes (OPTIONAL - UNCOMMENT IF/WHEN READY)
-- Drop feature-specific tables (photo cards, cosmetics). Only if present and no longer needed.
-- DROP TABLE IF EXISTS user_photo_cards;
-- DROP TABLE IF EXISTS user_cosmetics;

-- Drop discontinued aggregates from user_stats (MySQL 8.0+ recommended). Adjust to your schema.
-- ALTER TABLE user_stats
--   DROP COLUMN total_stamps,
--   DROP COLUMN total_photo_cards,
--   DROP COLUMN total_cosmetics;

-- If you have stored procedures/triggers/migrations referencing stamp/photo_card/cosmetic, update/remove them accordingly.

-- End of migration.
