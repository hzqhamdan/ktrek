-- Simulation script for Device Alerts
-- Generates device alerts (CGM and Smart Scale) for users
-- simulating battery issues, disconnections, sensor expiry, and sync failures.

DELIMITER //

DROP PROCEDURE IF EXISTS GenerateDeviceAlerts //

CREATE PROCEDURE GenerateDeviceAlerts()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE u_id INT;
    DECLARE cgm_id INT;
    DECLARE scale_id INT;
    DECLARE start_date DATETIME;
    DECLARE current_sim_time DATETIME;
    DECLARE end_date DATETIME;
    DECLARE alert_prob DECIMAL(5,4);
    
    -- Cursor to iterate through users with devices
    DECLARE user_cursor CURSOR FOR 
        SELECT 
            u.user_id, 
            c.device_id as cgm_id,
            s.device_id as scale_id
        FROM users u
        LEFT JOIN cgm_devices c ON u.user_id = c.user_id AND c.is_active = 1
        LEFT JOIN smart_scale_devices s ON u.user_id = s.user_id AND s.is_active = 1
        WHERE u.is_active = 1 AND (c.device_id IS NOT NULL OR s.device_id IS NOT NULL)
        LIMIT 50;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN user_cursor;

    read_loop: LOOP
        FETCH user_cursor INTO u_id, cgm_id, scale_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Set simulation range: Last 30 days
        SET start_date = DATE_SUB(NOW(), INTERVAL 30 DAY);
        SET end_date = NOW();
        SET current_sim_time = start_date;

        WHILE current_sim_time <= end_date DO
            
            -- 1. CGM Alerts (if user has CGM)
            IF cgm_id IS NOT NULL THEN
                SET alert_prob = RAND();
                
                -- Battery Low (5% chance every check)
                IF alert_prob < 0.05 THEN
                     INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved, resolved_at)
                     VALUES (u_id, cgm_id, 'CGM', 'Battery Low', 'Warning', 'CGM battery is below 15%', current_sim_time, 1, DATE_ADD(current_sim_time, INTERVAL 4 HOUR));
                
                -- Disconnected (3% chance)
                ELSEIF alert_prob < 0.08 THEN
                     INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved, resolved_at)
                     VALUES (u_id, cgm_id, 'CGM', 'Disconnected', 'Critical', 'CGM device disconnected unexpectedly', current_sim_time, 1, DATE_ADD(current_sim_time, INTERVAL 30 MINUTE));
                
                -- Sensor Expiring (2% chance)
                ELSEIF alert_prob < 0.10 THEN
                     INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved, resolved_at)
                     VALUES (u_id, cgm_id, 'CGM', 'Sensor Expiring', 'Info', 'CGM sensor will expire in 3 days', current_sim_time, 1, DATE_ADD(current_sim_time, INTERVAL 1 DAY));
                
                -- Sync Failed (4% chance)
                ELSEIF alert_prob < 0.14 THEN
                     INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved, resolved_at)
                     VALUES (u_id, cgm_id, 'CGM', 'Sync Failed', 'Warning', 'Failed to sync data with central server', current_sim_time, 1, DATE_ADD(current_sim_time, INTERVAL 1 HOUR));
                END IF;
            END IF;

            -- 2. Smart Scale Alerts (if user has Scale)
            IF scale_id IS NOT NULL THEN
                SET alert_prob = RAND();
                
                -- Battery Low (3% chance)
                IF alert_prob < 0.03 THEN
                     INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved, resolved_at)
                     VALUES (u_id, scale_id, 'Smart Scale', 'Battery Low', 'Warning', 'Scale battery is below 10%', current_sim_time, 1, DATE_ADD(current_sim_time, INTERVAL 2 DAY));
                
                -- Sync Failed (2% chance)
                ELSEIF alert_prob < 0.05 THEN
                     INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved, resolved_at)
                     VALUES (u_id, scale_id, 'Smart Scale', 'Sync Failed', 'Warning', 'Scale data upload failed', current_sim_time, 1, DATE_ADD(current_sim_time, INTERVAL 6 HOUR));
                END IF;
            END IF;

            -- Advance time by random 1-3 days
            SET current_sim_time = DATE_ADD(current_sim_time, INTERVAL (24 + FLOOR(RAND() * 48)) HOUR);
            
        END WHILE;

        -- Generate some UNRESOLVED alerts for "Today"
        IF cgm_id IS NOT NULL AND RAND() < 0.3 THEN
            INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved)
            VALUES (u_id, cgm_id, 'CGM', 'Data Gap', 'Warning', 'No data received for > 2 hours', NOW(), 0);
        END IF;

        IF scale_id IS NOT NULL AND RAND() < 0.2 THEN
            INSERT INTO device_alerts (user_id, device_id, device_type, alert_type, severity, message, alert_datetime, is_resolved)
            VALUES (u_id, scale_id, 'Smart Scale', 'Battery Low', 'Warning', 'Scale battery critical (5%)', NOW(), 0);
        END IF;

    END LOOP;

    CLOSE user_cursor;
    
    SELECT 'Device alerts simulation completed successfully.' as Message;
END //

DELIMITER ;

-- Execute the procedure
CALL GenerateDeviceAlerts();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS GenerateDeviceAlerts;
