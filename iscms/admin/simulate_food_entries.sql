-- Simulation script for Food Entries
-- Generates realistic food logs for users over the last 14 days
-- simulating breakfast, lunch, dinner, and snacks.

DELIMITER //

DROP PROCEDURE IF EXISTS GenerateFoodEntries //

CREATE PROCEDURE GenerateFoodEntries()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE u_id INT;
    DECLARE start_date DATETIME;
    DECLARE current_sim_time DATETIME;
    DECLARE end_date DATETIME;
    DECLARE f_id INT;
    DECLARE f_name VARCHAR(255);
    DECLARE f_sugar DECIMAL(6,2);
    DECLARE f_calories INT;
    DECLARE f_carbs DECIMAL(6,2);
    DECLARE f_protein DECIMAL(6,2);
    DECLARE f_fat DECIMAL(6,2);
    DECLARE rec_method VARCHAR(50);
    DECLARE meal_type VARCHAR(20);
    
    -- Cursor to iterate through active users
    DECLARE user_cursor CURSOR FOR 
        SELECT user_id FROM users WHERE is_active = 1 LIMIT 50;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN user_cursor;

    read_loop: LOOP
        FETCH user_cursor INTO u_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Set simulation range: Last 14 days
        SET start_date = DATE_SUB(NOW(), INTERVAL 14 DAY);
        SET end_date = NOW();
        SET current_sim_time = start_date;

        WHILE current_sim_time <= end_date DO
            
            -- 1. Breakfast (7am - 9am)
            SET current_sim_time = DATE(current_sim_time) + INTERVAL (7 + RAND()*2) HOUR;
            
            -- Select a random breakfast/beverage/snack item
            SELECT food_id, food_name, sugar_per_100g, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g
            INTO f_id, f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat
            FROM food_database 
            WHERE category IN ('Breakfast', 'Beverages', 'Bakery') 
            ORDER BY RAND() LIMIT 1;
            
            IF f_id IS NOT NULL THEN
                -- Random recognition method
                SET rec_method = ELT(FLOOR(1 + (RAND() * 4)), 'Barcode Scan', 'Photo Recognition', 'Manual Entry', 'Voice Input');
                
                INSERT INTO food_entries (user_id, food_item_id, entry_datetime, meal_type, food_name, sugar_content_g, calories, carbs_g, protein_g, fat_g, recognition_method, ai_confidence)
                VALUES (u_id, f_id, current_sim_time, 'Breakfast', f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat, rec_method, 0.85 + (RAND() * 0.14));
            END IF;

            -- 2. Lunch (12pm - 2pm)
            SET current_sim_time = DATE(current_sim_time) + INTERVAL (12 + RAND()*2) HOUR;
            
            SELECT food_id, food_name, sugar_per_100g, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g
            INTO f_id, f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat
            FROM food_database 
            WHERE category IN ('Lunch', 'Meals', 'Fast Food', 'Local Malaysian') 
            ORDER BY RAND() LIMIT 1;
            
            IF f_id IS NOT NULL THEN
                SET rec_method = ELT(FLOOR(1 + (RAND() * 4)), 'Barcode Scan', 'Photo Recognition', 'Manual Entry', 'Voice Input');
                
                INSERT INTO food_entries (user_id, food_item_id, entry_datetime, meal_type, food_name, sugar_content_g, calories, carbs_g, protein_g, fat_g, recognition_method, ai_confidence)
                VALUES (u_id, f_id, current_sim_time, 'Lunch', f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat, rec_method, 0.80 + (RAND() * 0.15));
            END IF;

            -- 3. Snack (3pm - 5pm) (50% chance)
            IF RAND() < 0.5 THEN
                SET current_sim_time = DATE(current_sim_time) + INTERVAL (15 + RAND()*2) HOUR;
                
                SELECT food_id, food_name, sugar_per_100g, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g
                INTO f_id, f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat
                FROM food_database 
                WHERE category IN ('Snack', 'Dessert', 'Beverages', 'Fruits') 
                ORDER BY RAND() LIMIT 1;
                
                IF f_id IS NOT NULL THEN
                    SET rec_method = ELT(FLOOR(1 + (RAND() * 4)), 'Barcode Scan', 'Photo Recognition', 'Manual Entry', 'Voice Input');
                    
                    INSERT INTO food_entries (user_id, food_item_id, entry_datetime, meal_type, food_name, sugar_content_g, calories, carbs_g, protein_g, fat_g, recognition_method, ai_confidence)
                    VALUES (u_id, f_id, current_sim_time, 'Snack', f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat, rec_method, 0.90 + (RAND() * 0.09));
                END IF;
            END IF;

            -- 4. Dinner (7pm - 9pm)
            SET current_sim_time = DATE(current_sim_time) + INTERVAL (19 + RAND()*2) HOUR;
            
            SELECT food_id, food_name, sugar_per_100g, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g
            INTO f_id, f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat
            FROM food_database 
            WHERE category IN ('Dinner', 'Meals', 'Local Malaysian') 
            ORDER BY RAND() LIMIT 1;
            
            IF f_id IS NOT NULL THEN
                SET rec_method = ELT(FLOOR(1 + (RAND() * 4)), 'Barcode Scan', 'Photo Recognition', 'Manual Entry', 'Voice Input');
                
                INSERT INTO food_entries (user_id, food_item_id, entry_datetime, meal_type, food_name, sugar_content_g, calories, carbs_g, protein_g, fat_g, recognition_method, ai_confidence)
                VALUES (u_id, f_id, current_sim_time, 'Dinner', f_name, f_sugar, f_calories, f_carbs, f_protein, f_fat, rec_method, 0.75 + (RAND() * 0.20));
            END IF;

            -- Advance to next day
            SET current_sim_time = DATE_ADD(DATE(current_sim_time), INTERVAL 1 DAY);
            
        END WHILE;

    END LOOP;

    CLOSE user_cursor;
    
    SELECT 'Food entries simulation completed successfully.' as Message;
END //

DELIMITER ;

-- Execute the procedure
CALL GenerateFoodEntries();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS GenerateFoodEntries;
