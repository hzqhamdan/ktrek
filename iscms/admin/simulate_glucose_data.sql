-- Simulation script for Glucose Levels
-- Generates realistic glucose readings for users over the last 30 days
-- simulating meal patterns and different health conditions.

DELIMITER //

DROP PROCEDURE IF EXISTS GenerateGlucoseData //

CREATE PROCEDURE GenerateGlucoseData()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE u_id INT;
    DECLARE u_health_status VARCHAR(50);
    DECLARE start_date DATETIME;
    DECLARE current_sim_time DATETIME;
    DECLARE end_date DATETIME;
    DECLARE base_glucose DECIMAL(5,2);
    DECLARE current_glucose DECIMAL(5,2);
    DECLARE meal_spike DECIMAL(5,2);
    DECLARE hour_of_day INT;
    DECLARE status_val VARCHAR(20);
    
    -- Cursor to iterate through active users
    DECLARE user_cursor CURSOR FOR 
        SELECT user_id, health_status FROM users WHERE is_active = 1 LIMIT 50; -- Limit to 50 users for performance
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Clear existing glucose readings to prevent duplicates during simulation runs (Optional: comment out if you want to append)
    -- DELETE FROM glucose_readings; 

    OPEN user_cursor;

    read_loop: LOOP
        FETCH user_cursor INTO u_id, u_health_status;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Set simulation range: Last 30 days to Now
        SET start_date = DATE_SUB(NOW(), INTERVAL 30 DAY);
        SET end_date = NOW();
        SET current_sim_time = start_date;

        -- Determine base glucose level based on health status
        IF u_health_status = 'Type 1 Diabetes' OR u_health_status = 'Type 2 Diabetes' THEN
            SET base_glucose = 130 + (RAND() * 50); -- Higher base for diabetics
        ELSEIF u_health_status = 'Pre-diabetic' THEN
            SET base_glucose = 100 + (RAND() * 20);
        ELSE
            SET base_glucose = 80 + (RAND() * 15); -- Healthy range
        END IF;

        -- Loop through time in 4-hour intervals (or 1 hour for better resolution)
        -- To keep it efficient, we'll do 6 readings a day (every 4 hours) + extras around meals
        
        WHILE current_sim_time <= end_date DO
            SET hour_of_day = HOUR(current_sim_time);
            SET current_glucose = base_glucose + (RAND() * 10 - 5); -- Small random fluctuation

            -- Simulate Meal Spikes (Breakfast: 7-9, Lunch: 12-14, Dinner: 18-20)
            IF hour_of_day BETWEEN 7 AND 9 OR hour_of_day BETWEEN 12 AND 14 OR hour_of_day BETWEEN 18 AND 20 THEN
                 -- Spike higher for diabetics
                IF u_health_status LIKE '%Diabetes%' THEN
                    SET meal_spike = 40 + (RAND() * 80);
                ELSE
                    SET meal_spike = 20 + (RAND() * 30);
                END IF;
                SET current_glucose = current_glucose + meal_spike;
            END IF;

            -- Determine Status
            IF current_glucose < 70 THEN
                SET status_val = 'Low';
            ELSEIF current_glucose <= 140 THEN
                SET status_val = 'Normal';
            ELSEIF current_glucose <= 200 THEN
                SET status_val = 'High';
            ELSE
                SET status_val = 'Critical';
            END IF;

            -- Insert Reading
            INSERT INTO glucose_readings (user_id, reading_datetime, glucose_level, unit, reading_type, status, notes)
            VALUES (u_id, current_sim_time, current_glucose, 'mg/dL', 'CGM', status_val, 'Simulated Data');

            -- Advance time by roughly 4 hours with some randomness
            SET current_sim_time = DATE_ADD(current_sim_time, INTERVAL (240 + FLOOR(RAND() * 30)) MINUTE);
            
        END WHILE;

    END LOOP;

    CLOSE user_cursor;
    
    SELECT 'Glucose data simulation completed successfully.' as Message;
END //

DELIMITER ;

-- Execute the procedure
CALL GenerateGlucoseData();

-- Drop the procedure after use to clean up
DROP PROCEDURE IF EXISTS GenerateGlucoseData;
