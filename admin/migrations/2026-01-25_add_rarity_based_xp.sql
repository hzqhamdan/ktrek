-- ============================================
-- Add Rarity-Based XP Reward System
-- This migration implements automatic XP rewards
-- based on the rarity of badges/titles earned
-- ============================================

USE ktrek_db;

-- XP Rewards by Rarity Tier:
-- Common: 50 XP
-- Rare: 100 XP
-- Epic: 200 XP
-- Legendary: 500 XP

-- Note: The rarity field already exists in the rewards table
-- This migration documents the XP values and creates a helper function

-- Create a function to get XP amount by rarity
DELIMITER $$

DROP FUNCTION IF EXISTS get_xp_by_rarity$$

CREATE FUNCTION get_xp_by_rarity(reward_rarity VARCHAR(50))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE xp_amount INT;
    
    CASE reward_rarity
        WHEN 'common' THEN SET xp_amount = 50;
        WHEN 'rare' THEN SET xp_amount = 100;
        WHEN 'epic' THEN SET xp_amount = 200;
        WHEN 'legendary' THEN SET xp_amount = 500;
        ELSE SET xp_amount = 50; -- Default to common
    END CASE;
    
    RETURN xp_amount;
END$$

DELIMITER ;

-- Test the function
SELECT 
    'common' as rarity, 
    get_xp_by_rarity('common') as xp_amount
UNION ALL
SELECT 
    'rare' as rarity, 
    get_xp_by_rarity('rare') as xp_amount
UNION ALL
SELECT 
    'epic' as rarity, 
    get_xp_by_rarity('epic') as xp_amount
UNION ALL
SELECT 
    'legendary' as rarity, 
    get_xp_by_rarity('legendary') as xp_amount;

-- Verify the function is created
SHOW FUNCTION STATUS WHERE Db = 'ktrek_db' AND Name = 'get_xp_by_rarity';

-- Example: Query to see rewards with their automatic XP amounts
SELECT 
    id,
    title,
    reward_type,
    rarity,
    get_xp_by_rarity(rarity) as automatic_xp,
    trigger_type
FROM rewards
ORDER BY get_xp_by_rarity(rarity) DESC, title;
