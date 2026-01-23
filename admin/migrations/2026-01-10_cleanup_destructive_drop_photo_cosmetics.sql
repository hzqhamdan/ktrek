-- K-Trek cleanup migration (destructive): permanently remove photo cards, cosmetics, and stamp/photo_card/cosmetic rewards
-- NO BACKUPS. This operation is irreversible.
-- Database: ktrek_db

USE ktrek_db;

-- 1) Purge discontinued reward types from user_rewards
DELETE FROM user_rewards
WHERE reward_type IN ('stamp', 'photo_card', 'cosmetic');

-- 2) Drop feature-specific tables if present
DROP TABLE IF EXISTS user_photo_cards;
DROP TABLE IF EXISTS user_cosmetics;

-- 3) Drop obsolete aggregate columns from user_stats (MySQL 8+ supports IF EXISTS)
ALTER TABLE user_stats
  DROP COLUMN IF EXISTS total_stamps,
  DROP COLUMN IF EXISTS total_photo_cards,
  DROP COLUMN IF EXISTS total_cosmetics;

-- 4) Optional: clear photo traces in submissions if desired (uncomment to run)
-- UPDATE user_task_submissions SET photo_url = NULL WHERE photo_url IS NOT NULL;

-- 5) Note: If any stored procedures, triggers, or views reference these tables/columns,
-- update or drop them accordingly to avoid runtime errors.

-- End of destructive migration.
