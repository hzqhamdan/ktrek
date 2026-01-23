-- Fix user_rewards table structure
-- This drops the old table and recreates it with the new structure

USE ktrek_db;

-- Backup old rewards data (just in case)
CREATE TABLE IF NOT EXISTS user_rewards_backup AS SELECT * FROM user_rewards;

-- Drop the old table
DROP TABLE IF EXISTS user_rewards;

-- Create the new user_rewards table with correct structure
CREATE TABLE user_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reward_type ENUM('xp', 'ep', 'badge', 'title', 'cosmetic', 'stamp', 'photo_card', 'fragment') NOT NULL,
    reward_identifier VARCHAR(100) NOT NULL,
    reward_name VARCHAR(255) NOT NULL,
    reward_description TEXT,
    quantity INT DEFAULT 1,
    category VARCHAR(50) NULL,
    source_type ENUM('attraction', 'category', 'milestone', 'task') NOT NULL,
    source_id INT NULL,
    metadata JSON NULL,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_rewards (user_id, reward_type),
    INDEX idx_user_category (user_id, category),
    INDEX idx_reward_identifier (reward_identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ user_rewards table recreated with correct structure!' as Status;

-- Verify new structure
DESCRIBE user_rewards;
