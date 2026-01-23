-- ============================================
-- Manual Award Category Badges (Direct Insert)
-- Replace YOUR_USER_ID with your actual user_id
-- ============================================

USE ktrek_db;

-- First, let's see what category progress exists
SELECT 'Current Category Progress:' as '';
SELECT user_id, category, completion_percentage, bronze_unlocked, silver_unlocked, gold_unlocked
FROM user_category_progress;

-- Now manually insert badges for users with unlocked tiers
-- You need to replace 1 with your actual user_id

-- Award Bronze badges
INSERT INTO user_rewards (user_id, reward_type, reward_identifier, reward_name, reward_description, category, source_type, earned_date)
SELECT 
    user_id,
    'badge' as reward_type,
    CONCAT('badge_', category, '_bronze') as reward_identifier,
    CONCAT(
        UPPER(SUBSTRING(REPLACE(category, '_', ' '), 1, 1)),
        LOWER(SUBSTRING(REPLACE(category, '_', ' '), 2)),
        ' Explorer'
    ) as reward_name,
    CONCAT('Completed 33% of ', REPLACE(category, '_', ' '), ' category attractions') as reward_description,
    category,
    'category_milestone' as source_type,
    NOW() as earned_date
FROM user_category_progress
WHERE bronze_unlocked = 1
AND NOT EXISTS (
    SELECT 1 FROM user_rewards ur 
    WHERE ur.user_id = user_category_progress.user_id 
    AND ur.reward_identifier = CONCAT('badge_', user_category_progress.category, '_bronze')
);

-- Award Silver badges
INSERT INTO user_rewards (user_id, reward_type, reward_identifier, reward_name, reward_description, category, source_type, earned_date)
SELECT 
    user_id,
    'badge' as reward_type,
    CONCAT('badge_', category, '_silver') as reward_identifier,
    CONCAT(
        UPPER(SUBSTRING(REPLACE(category, '_', ' '), 1, 1)),
        LOWER(SUBSTRING(REPLACE(category, '_', ' '), 2)),
        ' Adventurer'
    ) as reward_name,
    CONCAT('Completed 66% of ', REPLACE(category, '_', ' '), ' category attractions') as reward_description,
    category,
    'category_milestone' as source_type,
    NOW() as earned_date
FROM user_category_progress
WHERE silver_unlocked = 1
AND NOT EXISTS (
    SELECT 1 FROM user_rewards ur 
    WHERE ur.user_id = user_category_progress.user_id 
    AND ur.reward_identifier = CONCAT('badge_', user_category_progress.category, '_silver')
);

-- Award Gold badges
INSERT INTO user_rewards (user_id, reward_type, reward_identifier, reward_name, reward_description, category, source_type, earned_date)
SELECT 
    user_id,
    'badge' as reward_type,
    CONCAT('badge_', category, '_gold') as reward_identifier,
    CONCAT(
        UPPER(SUBSTRING(REPLACE(category, '_', ' '), 1, 1)),
        LOWER(SUBSTRING(REPLACE(category, '_', ' '), 2)),
        ' Master'
    ) as reward_name,
    CONCAT('Completed 100% of ', REPLACE(category, '_', ' '), ' category attractions') as reward_description,
    category,
    'category_milestone' as source_type,
    NOW() as earned_date
FROM user_category_progress
WHERE gold_unlocked = 1
AND NOT EXISTS (
    SELECT 1 FROM user_rewards ur 
    WHERE ur.user_id = user_category_progress.user_id 
    AND ur.reward_identifier = CONCAT('badge_', user_category_progress.category, '_gold')
);

-- Show results
SELECT '========================================' as '';
SELECT 'Badges Awarded!' as '';
SELECT '========================================' as '';
SELECT reward_name, category, earned_date
FROM user_rewards
WHERE reward_type = 'badge'
AND source_type = 'category_milestone'
ORDER BY earned_date DESC;
