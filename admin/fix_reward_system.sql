-- ============================================
-- K-Trek Reward System Fix
-- This script creates all missing stored procedures 
-- and syncs existing rewards for user_id = 5
-- ============================================

USE ktrek_db;

-- ============================================
-- PART 1: Create Missing Stored Procedures
-- ============================================

DELIMITER $$

-- ============================================
-- 1. Initialize User Stats
-- ============================================
DROP PROCEDURE IF EXISTS init_user_stats$$

CREATE PROCEDURE init_user_stats(
    IN p_user_id INT
)
BEGIN
    -- Insert user stats if not exists
    INSERT IGNORE INTO user_stats (
        user_id, total_xp, total_ep, current_level, 
        xp_to_next_level, total_badges, total_titles, 
        total_stamps, total_photo_cards, created_at, updated_at
    ) VALUES (
        p_user_id, 0, 0, 1, 100, 0, 0, 0, 0, NOW(), NOW()
    );
END$$

-- ============================================
-- 2. Award XP
-- ============================================
DROP PROCEDURE IF EXISTS award_xp$$

CREATE PROCEDURE award_xp(
    IN p_user_id INT,
    IN p_xp_amount INT,
    IN p_reason VARCHAR(255),
    IN p_source_type VARCHAR(50),
    IN p_source_id INT
)
BEGIN
    DECLARE v_current_xp INT DEFAULT 0;
    DECLARE v_current_level INT DEFAULT 1;
    DECLARE v_new_xp INT;
    DECLARE v_new_level INT;
    DECLARE v_xp_for_next INT;
    
    -- Ensure user stats exist
    CALL init_user_stats(p_user_id);
    
    -- Get current stats
    SELECT total_xp, current_level INTO v_current_xp, v_current_level
    FROM user_stats
    WHERE user_id = p_user_id;
    
    -- Calculate new XP
    SET v_new_xp = v_current_xp + p_xp_amount;
    
    -- Calculate new level (100 XP per level)
    SET v_new_level = FLOOR(v_new_xp / 100) + 1;
    SET v_xp_for_next = (v_new_level * 100) - v_new_xp;
    
    -- Update user stats
    UPDATE user_stats
    SET total_xp = v_new_xp,
        current_level = v_new_level,
        xp_to_next_level = v_xp_for_next,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO reward_transactions (user_id, transaction_type, amount, reason, created_at)
    VALUES (p_user_id, 'xp_gain', p_xp_amount, p_reason, NOW());
    
    -- Check for level up
    IF v_new_level > v_current_level THEN
        INSERT INTO reward_transactions (user_id, transaction_type, amount, reason, created_at)
        VALUES (p_user_id, 'level_up', v_new_level, CONCAT('Reached level ', v_new_level), NOW());
    END IF;
END$$

-- ============================================
-- 3. Award Task Stamp
-- ============================================
DROP PROCEDURE IF EXISTS award_task_stamp$$

CREATE PROCEDURE award_task_stamp(
    IN p_user_id INT,
    IN p_task_id INT,
    IN p_attraction_id INT,
    IN p_stamp_type VARCHAR(50)
)
BEGIN
    DECLARE v_stamp_exists INT DEFAULT 0;
    DECLARE v_task_name VARCHAR(255);
    DECLARE v_attraction_name VARCHAR(255);
    
    -- Check if stamp already exists
    SELECT COUNT(*) INTO v_stamp_exists
    FROM user_task_stamps
    WHERE user_id = p_user_id AND task_id = p_task_id;
    
    IF v_stamp_exists = 0 THEN
        -- Get task and attraction names
        SELECT t.name, a.name INTO v_task_name, v_attraction_name
        FROM tasks t
        JOIN attractions a ON t.attraction_id = a.id
        WHERE t.id = p_task_id;
        
        -- Insert stamp into user_task_stamps
        INSERT INTO user_task_stamps (
            user_id, task_id, attraction_id, stamp_type
        ) VALUES (
            p_user_id, p_task_id, p_attraction_id, p_stamp_type
        );
        
        -- Add to user_rewards table
        INSERT INTO user_rewards (
            user_id, reward_type, reward_identifier, reward_name,
            reward_description, metadata, earned_date
        ) VALUES (
            p_user_id, 'stamp', CONCAT('stamp_', p_task_id),
            CONCAT(v_stamp_type, ' Stamp'),
            CONCAT('Completed ', v_task_name, ' at ', v_attraction_name),
            JSON_OBJECT('task_id', p_task_id, 'attraction_id', p_attraction_id, 'stamp_type', p_stamp_type),
            NOW()
        );
        
        -- Update user stats
        UPDATE user_stats
        SET total_stamps = total_stamps + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END$$

-- ============================================
-- 4. Award Photo Card
-- ============================================
DROP PROCEDURE IF EXISTS award_photo_card$$

CREATE PROCEDURE award_photo_card(
    IN p_user_id INT,
    IN p_attraction_id INT,
    IN p_quality_score INT,
    IN p_photo_url VARCHAR(500)
)
BEGIN
    DECLARE v_card_type VARCHAR(20);
    DECLARE v_attraction_name VARCHAR(255);
    DECLARE v_card_exists INT DEFAULT 0;
    
    -- Determine card type based on quality
    IF p_quality_score >= 90 THEN
        SET v_card_type = 'legendary';
    ELSEIF p_quality_score >= 75 THEN
        SET v_card_type = 'epic';
    ELSEIF p_quality_score >= 60 THEN
        SET v_card_type = 'rare';
    ELSE
        SET v_card_type = 'common';
    END IF;
    
    -- Get attraction name
    SELECT name INTO v_attraction_name
    FROM attractions
    WHERE id = p_attraction_id;
    
    -- Check if photo card already exists for this attraction
    SELECT COUNT(*) INTO v_card_exists
    FROM user_photo_cards
    WHERE user_id = p_user_id AND attraction_id = p_attraction_id;
    
    IF v_card_exists = 0 THEN
        -- Insert photo card
        INSERT INTO user_photo_cards (
            user_id, attraction_id, card_type, quality_score, photo_url
        ) VALUES (
            p_user_id, p_attraction_id, v_card_type, p_quality_score, p_photo_url
        );
        
        -- Add to user_rewards table
        INSERT INTO user_rewards (
            user_id, reward_type, reward_identifier, reward_name,
            reward_description, metadata, earned_date
        ) VALUES (
            p_user_id, 'photo_card', CONCAT('photo_', p_attraction_id),
            CONCAT(v_attraction_name, ' Photo Card'),
            CONCAT('Captured a ', v_card_type, ' quality photo at ', v_attraction_name),
            JSON_OBJECT('attraction_id', p_attraction_id, 'card_type', v_card_type, 'quality_score', p_quality_score),
            NOW()
        );
        
        -- Update user stats
        UPDATE user_stats
        SET total_photo_cards = total_photo_cards + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END$$

-- ============================================
-- 5. Award Badge Fragment
-- ============================================
DROP PROCEDURE IF EXISTS award_badge_fragment$$

CREATE PROCEDURE award_badge_fragment(
    IN p_user_id INT,
    IN p_category VARCHAR(50),
    IN p_fragments INT
)
BEGIN
    DECLARE v_current_fragments INT DEFAULT 0;
    DECLARE v_required_fragments INT DEFAULT 3;
    DECLARE v_new_fragments INT;
    DECLARE v_is_complete TINYINT DEFAULT 0;
    
    -- Get or create badge fragment record
    INSERT INTO user_badge_fragments (user_id, category, fragments_collected, fragments_required, is_complete)
    VALUES (p_user_id, p_category, 0, v_required_fragments, 0)
    ON DUPLICATE KEY UPDATE user_id = user_id;
    
    -- Get current fragments
    SELECT fragments_collected, is_complete INTO v_current_fragments, v_is_complete
    FROM user_badge_fragments
    WHERE user_id = p_user_id AND category = p_category;
    
    -- Only add if not already complete
    IF v_is_complete = 0 THEN
        SET v_new_fragments = v_current_fragments + p_fragments;
        
        -- Update fragments
        UPDATE user_badge_fragments
        SET fragments_collected = v_new_fragments,
            is_complete = IF(v_new_fragments >= v_required_fragments, 1, 0),
            updated_at = NOW()
        WHERE user_id = p_user_id AND category = p_category;
        
        -- If complete, award the badge
        IF v_new_fragments >= v_required_fragments THEN
            CALL award_category_completion_badge(p_user_id, p_category, 'bronze');
        END IF;
    END IF;
END$$

-- ============================================
-- 6. Award Category Completion Badge
-- ============================================
DROP PROCEDURE IF EXISTS award_category_completion_badge$$

CREATE PROCEDURE award_category_completion_badge(
    IN p_user_id INT,
    IN p_category VARCHAR(50),
    IN p_tier VARCHAR(20)
)
BEGIN
    DECLARE v_badge_exists INT DEFAULT 0;
    DECLARE v_badge_name VARCHAR(255);
    DECLARE v_badge_description TEXT;
    
    -- Create badge name
    SET v_badge_name = CONCAT(UPPER(SUBSTRING(p_tier, 1, 1)), SUBSTRING(p_tier, 2), ' ', 
                             REPLACE(REPLACE(p_category, '_', ' '), 'malay traditional', 'Malay Traditional'));
    SET v_badge_description = CONCAT('Completed ', p_tier, ' tier for ', v_badge_name, ' category');
    
    -- Check if badge already exists
    SELECT COUNT(*) INTO v_badge_exists
    FROM user_rewards
    WHERE user_id = p_user_id 
    AND reward_type = 'badge'
    AND reward_identifier = CONCAT('badge_', p_category, '_', p_tier);
    
    IF v_badge_exists = 0 THEN
        -- Award badge
        INSERT INTO user_rewards (
            user_id, reward_type, reward_identifier, reward_name,
            reward_description, category, tier, earned_date
        ) VALUES (
            p_user_id, 'badge', CONCAT('badge_', p_category, '_', p_tier),
            v_badge_name, v_badge_description, p_category, p_tier, NOW()
        );
        
        -- Update user stats
        UPDATE user_stats
        SET total_badges = total_badges + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Log transaction
        INSERT INTO reward_transactions (user_id, transaction_type, amount, reason, created_at)
        VALUES (p_user_id, 'badge_earned', 1, CONCAT('Earned ', v_badge_name, ' badge'), NOW());
    END IF;
END$$

-- ============================================
-- 7. Update Category Progress
-- ============================================
DROP PROCEDURE IF EXISTS update_category_progress$$

CREATE PROCEDURE update_category_progress(
    IN p_user_id INT,
    IN p_category VARCHAR(50)
)
BEGIN
    DECLARE v_total_attractions INT DEFAULT 0;
    DECLARE v_completed_attractions INT DEFAULT 0;
    DECLARE v_completion_pct DECIMAL(5,2);
    
    -- Count total attractions in category
    SELECT COUNT(*) INTO v_total_attractions
    FROM attractions
    WHERE category = p_category;
    
    -- Count completed attractions (100% progress)
    SELECT COUNT(*) INTO v_completed_attractions
    FROM progress p
    JOIN attractions a ON p.attraction_id = a.id
    WHERE p.user_id = p_user_id
    AND a.category = p_category
    AND p.progress_percentage >= 100;
    
    -- Calculate completion percentage
    IF v_total_attractions > 0 THEN
        SET v_completion_pct = (v_completed_attractions / v_total_attractions) * 100;
    ELSE
        SET v_completion_pct = 0;
    END IF;
    
    -- Update or insert category progress
    INSERT INTO user_category_progress (
        user_id, category, total_attractions, completed_attractions,
        completion_percentage, bronze_unlocked, silver_unlocked, gold_unlocked, updated_at
    ) VALUES (
        p_user_id, p_category, v_total_attractions, v_completed_attractions,
        v_completion_pct, 
        IF(v_completion_pct >= 33, 1, 0),
        IF(v_completion_pct >= 66, 1, 0),
        IF(v_completion_pct >= 100, 1, 0),
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        total_attractions = v_total_attractions,
        completed_attractions = v_completed_attractions,
        completion_percentage = v_completion_pct,
        bronze_unlocked = IF(v_completion_pct >= 33, 1, 0),
        silver_unlocked = IF(v_completion_pct >= 66, 1, 0),
        gold_unlocked = IF(v_completion_pct >= 100, 1, 0),
        updated_at = NOW();
        
    -- Award badge fragments based on completion
    IF v_completion_pct >= 33 AND v_completion_pct < 66 THEN
        CALL award_badge_fragment(p_user_id, p_category, 1);
    ELSEIF v_completion_pct >= 66 AND v_completion_pct < 100 THEN
        CALL award_category_completion_badge(p_user_id, p_category, 'silver');
    ELSEIF v_completion_pct >= 100 THEN
        CALL award_category_completion_badge(p_user_id, p_category, 'gold');
    END IF;
END$$

-- ============================================
-- 8. Process Attraction Completion
-- ============================================
DROP PROCEDURE IF EXISTS process_attraction_completion$$

CREATE PROCEDURE process_attraction_completion(
    IN p_user_id INT,
    IN p_attraction_id INT,
    IN p_quality_score INT
)
BEGIN
    DECLARE v_category VARCHAR(50);
    DECLARE v_completion_xp INT DEFAULT 50;
    DECLARE v_attraction_name VARCHAR(255);
    DECLARE v_already_completed INT DEFAULT 0;
    
    -- Check if already processed
    SELECT COUNT(*) INTO v_already_completed
    FROM progress
    WHERE user_id = p_user_id 
    AND attraction_id = p_attraction_id 
    AND completed_at IS NOT NULL;
    
    IF v_already_completed = 0 THEN
        -- Get attraction info
        SELECT name, category INTO v_attraction_name, v_category
        FROM attractions
        WHERE id = p_attraction_id;
        
        -- Mark attraction as completed
        UPDATE progress
        SET completed_at = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id AND attraction_id = p_attraction_id;
        
        -- Award completion XP
        CALL award_xp(p_user_id, v_completion_xp, 
                     CONCAT('Completed ', v_attraction_name), 
                     'attraction_completion', p_attraction_id);
        
        -- Update category progress
        CALL update_category_progress(p_user_id, v_category);
        
        -- Log milestone
        INSERT INTO user_milestones (user_id, milestone_type, milestone_name, achievement_date)
        VALUES (p_user_id, 'attraction_complete', v_attraction_name, NOW());
    END IF;
END$$

DELIMITER ;

-- ============================================
-- PART 2: Sync Existing Rewards for User 5
-- ============================================

SET @user_id = 5;

SELECT '========================================' as '';
SELECT 'Starting reward system sync for user 5...' as '';
SELECT '========================================' as '';

-- Initialize user stats if not exists
CALL init_user_stats(@user_id);

-- Sync stamps from user_task_stamps to user_rewards
SELECT 'Syncing stamps...' as '';

INSERT INTO user_rewards (user_id, reward_type, reward_identifier, reward_name, reward_description, metadata, earned_date)
SELECT 
    uts.user_id,
    'stamp' as reward_type,
    CONCAT('stamp_', uts.task_id) as reward_identifier,
    CONCAT(uts.stamp_type, ' Stamp') as reward_name,
    CONCAT('Completed ', t.name, ' at ', a.name) as reward_description,
    JSON_OBJECT('task_id', uts.task_id, 'attraction_id', uts.attraction_id, 'stamp_type', uts.stamp_type) as metadata,
    NOW()
FROM user_task_stamps uts
JOIN tasks t ON uts.task_id = t.id
JOIN attractions a ON uts.attraction_id = a.id
WHERE uts.user_id = @user_id
AND NOT EXISTS (
    SELECT 1 FROM user_rewards ur
    WHERE ur.user_id = uts.user_id
    AND ur.reward_identifier = CONCAT('stamp_', uts.task_id)
);

-- Update stamp count in user_stats
UPDATE user_stats
SET total_stamps = (SELECT COUNT(*) FROM user_task_stamps WHERE user_id = @user_id),
    updated_at = NOW()
WHERE user_id = @user_id;

-- Sync photo cards from user_photo_cards to user_rewards
SELECT 'Syncing photo cards...' as '';

INSERT INTO user_rewards (user_id, reward_type, reward_identifier, reward_name, reward_description, metadata, earned_date)
SELECT 
    upc.user_id,
    'photo_card' as reward_type,
    CONCAT('photo_', upc.attraction_id) as reward_identifier,
    CONCAT(a.name, ' Photo Card') as reward_name,
    CONCAT('Captured a ', upc.card_type, ' quality photo at ', a.name) as reward_description,
    JSON_OBJECT('attraction_id', upc.attraction_id, 'card_type', upc.card_type, 'quality_score', upc.quality_score) as metadata,
    NOW()
FROM user_photo_cards upc
JOIN attractions a ON upc.attraction_id = a.id
WHERE upc.user_id = @user_id
AND NOT EXISTS (
    SELECT 1 FROM user_rewards ur
    WHERE ur.user_id = upc.user_id
    AND ur.reward_identifier = CONCAT('photo_', upc.attraction_id)
);

-- Update photo card count in user_stats
UPDATE user_stats
SET total_photo_cards = (SELECT COUNT(*) FROM user_photo_cards WHERE user_id = @user_id),
    updated_at = NOW()
WHERE user_id = @user_id;

-- Process completed attractions
SELECT 'Processing completed attractions...' as '';

-- For each completed attraction, run completion procedure
CALL process_attraction_completion(@user_id, 8, 100);  -- Kampung Kraftangan
CALL process_attraction_completion(@user_id, 9, 100);  -- Istana Jahar

SELECT '========================================' as '';
SELECT 'Sync completed! Running diagnostic...' as '';
SELECT '========================================' as '';

-- Run diagnostic
SELECT 'Current Stats:' as '';
SELECT * FROM user_stats WHERE user_id = @user_id;

SELECT 'Rewards Summary:' as '';
SELECT 
    reward_type,
    COUNT(*) as count
FROM user_rewards
WHERE user_id = @user_id
GROUP BY reward_type;

SELECT 'Recent Rewards:' as '';
SELECT 
    reward_type,
    reward_name,
    earned_date
FROM user_rewards
WHERE user_id = @user_id
ORDER BY earned_date DESC
LIMIT 10;

SELECT '========================================' as '';
SELECT 'Reward system fix completed!' as '';
SELECT '========================================' as '';
