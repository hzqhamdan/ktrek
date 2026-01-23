-- ============================================
-- Fix Category Progress Collation Error
-- Resolves: #1267 Illegal mix of collations error
-- ============================================

USE ktrek_db;

DELIMITER $$

-- ============================================
-- Fix update_category_progress with explicit collation
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
    DECLARE v_bronze_unlocked TINYINT(1) DEFAULT 0;
    DECLARE v_silver_unlocked TINYINT(1) DEFAULT 0;
    DECLARE v_gold_unlocked TINYINT(1) DEFAULT 0;
    DECLARE v_prev_bronze TINYINT(1) DEFAULT 0;
    DECLARE v_prev_silver TINYINT(1) DEFAULT 0;
    DECLARE v_prev_gold TINYINT(1) DEFAULT 0;
    
    -- Get previous tier states (if row exists)
    SELECT bronze_unlocked, silver_unlocked, gold_unlocked
    INTO v_prev_bronze, v_prev_silver, v_prev_gold
    FROM user_category_progress
    WHERE user_id = p_user_id 
    AND category COLLATE utf8mb4_general_ci = p_category COLLATE utf8mb4_general_ci
    LIMIT 1;
    
    -- Count total attractions in category (FIX: explicit collation)
    SELECT COUNT(*) INTO v_total_attractions
    FROM attractions
    WHERE category COLLATE utf8mb4_general_ci = p_category COLLATE utf8mb4_general_ci;
    
    -- Count completed attractions (100% progress) (FIX: explicit collation)
    SELECT COUNT(*) INTO v_completed_attractions
    FROM progress p
    JOIN attractions a ON p.attraction_id = a.id
    WHERE p.user_id = p_user_id
    AND a.category COLLATE utf8mb4_general_ci = p_category COLLATE utf8mb4_general_ci
    AND p.progress_percentage >= 100;
    
    -- Calculate completion percentage
    IF v_total_attractions > 0 THEN
        SET v_completion_pct = (v_completed_attractions / v_total_attractions) * 100;
    ELSE
        SET v_completion_pct = 0;
    END IF;
    
    -- Determine tier unlocks
    IF v_completion_pct >= 33 THEN
        SET v_bronze_unlocked = 1;
    END IF;
    
    IF v_completion_pct >= 66 THEN
        SET v_silver_unlocked = 1;
    END IF;
    
    IF v_completion_pct >= 100 THEN
        SET v_gold_unlocked = 1;
    END IF;
    
    -- Update or insert category progress
    INSERT INTO user_category_progress (
        user_id, 
        category, 
        total_attractions, 
        completed_attractions, 
        completion_percentage,
        bronze_unlocked,
        silver_unlocked,
        gold_unlocked,
        first_completion_date,
        last_completion_date
    ) VALUES (
        p_user_id,
        p_category,
        v_total_attractions,
        v_completed_attractions,
        v_completion_pct,
        v_bronze_unlocked,
        v_silver_unlocked,
        v_gold_unlocked,
        IF(v_completed_attractions > 0, NOW(), NULL),
        IF(v_completed_attractions > 0, NOW(), NULL)
    )
    ON DUPLICATE KEY UPDATE
        total_attractions = v_total_attractions,
        completed_attractions = v_completed_attractions,
        completion_percentage = v_completion_pct,
        bronze_unlocked = v_bronze_unlocked,
        silver_unlocked = v_silver_unlocked,
        gold_unlocked = v_gold_unlocked,
        last_completion_date = IF(v_completed_attractions > completed_attractions, NOW(), last_completion_date);
    
    -- Award tier milestones if newly unlocked
    -- Bronze (33%)
    IF v_bronze_unlocked = 1 AND v_prev_bronze = 0 THEN
        CALL award_ep(p_user_id, 50, CONCAT('Bronze tier unlocked: ', p_category), 'category_milestone', 0);
        -- Optional: award badge via award_category_completion_badge if procedure exists
    END IF;
    
    -- Silver (66%)
    IF v_silver_unlocked = 1 AND v_prev_silver = 0 THEN
        CALL award_ep(p_user_id, 100, CONCAT('Silver tier unlocked: ', p_category), 'category_milestone', 0);
    END IF;
    
    -- Gold (100%)
    IF v_gold_unlocked = 1 AND v_prev_gold = 0 THEN
        CALL award_ep(p_user_id, 200, CONCAT('Gold tier unlocked: ', p_category), 'category_milestone', 0);
        
        -- Check for multi-category achievements
        CALL check_multi_category_achievements(p_user_id);
    END IF;
    
END$$

-- ============================================
-- Fix update_user_progress to call category progress update
-- ============================================
DROP PROCEDURE IF EXISTS update_user_progress$$

CREATE PROCEDURE update_user_progress(
    IN p_user_id INT,
    IN p_task_id INT
)
BEGIN
    DECLARE v_attraction_id INT;
    DECLARE v_category VARCHAR(50);
    DECLARE v_total_tasks INT;
    DECLARE v_completed_tasks INT;
    DECLARE v_progress_pct DECIMAL(5,2);
    DECLARE v_quality_score INT DEFAULT 75;
    
    -- Get attraction_id from task
    SELECT attraction_id INTO v_attraction_id
    FROM tasks
    WHERE id = p_task_id;
    
    -- Get category for this attraction
    SELECT category INTO v_category
    FROM attractions
    WHERE id = v_attraction_id;
    
    -- Count total tasks for this attraction
    SELECT COUNT(*) INTO v_total_tasks
    FROM tasks
    WHERE attraction_id = v_attraction_id;
    
    -- Count completed tasks for this user at this attraction
    SELECT COUNT(DISTINCT task_id) INTO v_completed_tasks
    FROM user_task_submissions
    WHERE user_id = p_user_id
    AND task_id IN (SELECT id FROM tasks WHERE attraction_id = v_attraction_id);
    
    -- Calculate progress percentage
    IF v_total_tasks > 0 THEN
        SET v_progress_pct = (v_completed_tasks / v_total_tasks) * 100;
    ELSE
        SET v_progress_pct = 0;
    END IF;
    
    -- Update or insert progress
    INSERT INTO progress (user_id, attraction_id, completed_tasks, total_tasks, progress_percentage, updated_at)
    VALUES (p_user_id, v_attraction_id, v_completed_tasks, v_total_tasks, v_progress_pct, NOW())
    ON DUPLICATE KEY UPDATE 
        completed_tasks = v_completed_tasks,
        total_tasks = v_total_tasks,
        progress_percentage = v_progress_pct,
        updated_at = NOW();
    
    -- If attraction is now complete (100%), trigger completion rewards
    IF v_progress_pct >= 100 THEN
        CALL process_attraction_completion(p_user_id, v_attraction_id, v_quality_score);
    END IF;
    
    -- Always update category progress (so partial progress shows too)
    IF v_category IS NOT NULL THEN
        CALL update_category_progress(p_user_id, v_category);
    END IF;
    
END$$

DELIMITER ;

-- ============================================
-- Test the fix
-- ============================================
SELECT '========================================' as '';
SELECT 'Collation fix applied!' as '';
SELECT '========================================' as '';
SELECT 'Testing with your user...' as '';

-- Initialize category progress for user 5 (or replace with your user_id)
SET @test_user_id = 5;

CALL update_category_progress(@test_user_id, 'beaches');
CALL update_category_progress(@test_user_id, 'temples');
CALL update_category_progress(@test_user_id, 'malay_traditional');

SELECT '========================================' as '';
SELECT 'Category progress initialized!' as '';
SELECT '========================================' as '';

-- Show results
SELECT 
    category,
    total_attractions,
    completed_attractions,
    completion_percentage,
    bronze_unlocked,
    silver_unlocked,
    gold_unlocked
FROM user_category_progress
WHERE user_id = @test_user_id
ORDER BY category;

SELECT '========================================' as '';
SELECT 'If you see rows above, the fix worked!' as '';
SELECT 'Now refresh /dashboard/progress to see Category Progress cards' as '';
SELECT '========================================' as '';
