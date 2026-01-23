-- Missing update_user_progress procedure
-- This procedure is called by task submission endpoints

USE ktrek_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS update_user_progress$$

CREATE PROCEDURE update_user_progress(
    IN p_user_id INT,
    IN p_task_id INT
)
BEGIN
    DECLARE v_attraction_id INT;
    DECLARE v_total_tasks INT;
    DECLARE v_completed_tasks INT;
    DECLARE v_progress_pct DECIMAL(5,2);
    
    -- Get attraction_id from task
    SELECT attraction_id INTO v_attraction_id
    FROM tasks
    WHERE id = p_task_id;
    
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
    
    -- Update or insert progress (now includes completed_tasks and total_tasks)
    INSERT INTO progress (user_id, attraction_id, completed_tasks, total_tasks, progress_percentage, updated_at)
    VALUES (p_user_id, v_attraction_id, v_completed_tasks, v_total_tasks, v_progress_pct, NOW())
    ON DUPLICATE KEY UPDATE 
        completed_tasks = v_completed_tasks,
        total_tasks = v_total_tasks,
        progress_percentage = v_progress_pct,
        updated_at = NOW();
        
END$$

DELIMITER ;

SELECT 'update_user_progress procedure created successfully!' as Status;
