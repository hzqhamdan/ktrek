-- Award Missing Rewards for Completed Attractions
-- Run this AFTER recalculate_all_progress.sql

USE ktrek_db;

-- Set your user ID
SET @user_id = 5; -- CHANGE THIS TO YOUR USER ID

SELECT 'Checking for completed attractions missing rewards...' as Status;

-- Temporary table to store completed attractions
DROP TEMPORARY TABLE IF EXISTS completed_attractions;
CREATE TEMPORARY TABLE completed_attractions AS
SELECT 
    p.attraction_id,
    a.category,
    a.name as attraction_name,
    p.progress_percentage
FROM progress p
JOIN attractions a ON p.attraction_id = a.id
WHERE p.user_id = @user_id
AND p.progress_percentage >= 100;

-- Show what will be processed
SELECT * FROM completed_attractions;

-- Process each completed attraction
-- Note: We'll call the stored procedure for each one

-- For each completed attraction, award rewards manually
-- You'll need to run this for each attraction individually

SELECT 
    CONCAT('CALL process_attraction_completion(', @user_id, ', ', attraction_id, ', 100);') as run_this_query
FROM completed_attractions;

SELECT 'Copy and run the queries above to award missing rewards!' as Instructions;

-- Also check and update category progress
SELECT 
    category,
    COUNT(*) as completed_in_category,
    (SELECT COUNT(*) FROM attractions WHERE category = ca.category) as total_in_category
FROM completed_attractions ca
GROUP BY category;

SELECT 'After running the process_attraction_completion queries, run update_category_progress for each category!' as Instructions2;
