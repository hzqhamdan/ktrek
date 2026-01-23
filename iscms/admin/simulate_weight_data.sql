-- Simulation script for Weight Logs
-- Generates realistic weight readings for users over the last 60 days
-- simulating different weight trends (loss, gain, stable).

DELIMITER //

DROP PROCEDURE IF EXISTS GenerateWeightData //

CREATE PROCEDURE GenerateWeightData()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE u_id INT;
    DECLARE u_height_cm DECIMAL(5,2);
    DECLARE u_target_weight DECIMAL(5,2);
    DECLARE start_date DATE;
    DECLARE current_sim_date DATE;
    DECLARE end_date DATE;
    DECLARE current_weight DECIMAL(5,2);
    DECLARE start_weight DECIMAL(5,2);
    DECLARE trend_factor DECIMAL(5,4); -- Daily change
    DECLARE frequency INT; -- How often they weigh (days)
    DECLARE calculated_bmi DECIMAL(5,2);
    DECLARE log_source VARCHAR(50);
    
    -- Cursor to iterate through active users with height info
    DECLARE user_cursor CURSOR FOR 
        SELECT user_id, height_cm, target_weight_kg FROM users WHERE is_active = 1 AND height_cm > 0 LIMIT 50;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN user_cursor;

    read_loop: LOOP
        FETCH user_cursor INTO u_id, u_height_cm, u_target_weight;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Set simulation range: Last 60 days
        SET start_date = DATE_SUB(CURDATE(), INTERVAL 60 DAY);
        SET end_date = CURDATE();
        SET current_sim_date = start_date;

        -- Determine starting weight (randomly around target + 10-20kg usually if trying to lose)
        IF u_target_weight > 0 THEN
            SET start_weight = u_target_weight + 5 + (RAND() * 15); 
        ELSE
            SET start_weight = 60 + (RAND() * 40); -- Random 60-100kg
        END IF;
        
        SET current_weight = start_weight;
        
        -- Determine Trend
        -- 0: Stable, 1: Losing, 2: Gaining (less likely for this app context but possible)
        CASE FLOOR(RAND() * 3)
            WHEN 0 THEN SET trend_factor = 0;
            WHEN 1 THEN SET trend_factor = -0.05 - (RAND() * 0.1); -- Losing 0.05 to 0.15 kg/day (aggressive to moderate)
            WHEN 2 THEN SET trend_factor = 0.02 + (RAND() * 0.05); -- Gaining
        END CASE;

        -- Weighing Frequency (every 1 to 5 days)
        SET frequency = 1 + FLOOR(RAND() * 5);

        WHILE current_sim_date <= end_date DO
            -- Apply trend with some daily noise
            SET current_weight = current_weight + trend_factor + (RAND() * 0.4 - 0.2);
            
            -- Calculate BMI
            IF u_height_cm > 0 THEN
                SET calculated_bmi = current_weight / ((u_height_cm / 100) * (u_height_cm / 100));
            ELSE
                SET calculated_bmi = NULL;
            END IF;

            -- Determine Source
            IF RAND() < 0.7 THEN
                SET log_source = 'Smart Scale';
            ELSE
                SET log_source = 'Manual Entry';
            END IF;

            -- Insert Reading (using INSERT IGNORE to skip if date already has log)
            INSERT IGNORE INTO weight_logs (user_id, log_date, weight_kg, bmi, source, notes)
            VALUES (u_id, current_sim_date, ROUND(current_weight, 2), ROUND(calculated_bmi, 2), log_source, 'Simulated Data');

            -- Update current weight in users table for the latest date
            IF current_sim_date = end_date THEN
                UPDATE users SET current_weight_kg = ROUND(current_weight, 2), bmi = ROUND(calculated_bmi, 2) WHERE user_id = u_id;
            END IF;

            -- Advance time
            SET current_sim_date = DATE_ADD(current_sim_date, INTERVAL (frequency + FLOOR(RAND() * 2)) DAY);
            
        END WHILE;

    END LOOP;

    CLOSE user_cursor;
    
    SELECT 'Weight data simulation completed successfully.' as Message;
END //

DELIMITER ;

-- Execute the procedure
CALL GenerateWeightData();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS GenerateWeightData;
