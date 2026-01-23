-- Sample Device Data for Testing Device Management Dashboard
-- Run this after database_device_management.sql
-- This script will only insert devices for EXISTING users in your database

USE iscms_db;

-- First, let's check if we have users in the database
SELECT 'Checking existing users...' as Status;
SELECT COUNT(*) as Total_Users FROM users;

-- Store user IDs in a temporary table
CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_ids AS
SELECT user_id FROM users LIMIT 10;

-- Show which users will get devices
SELECT 'Devices will be created for these users:' as Info;
SELECT user_id, full_name, email FROM users WHERE user_id IN (SELECT user_id FROM temp_user_ids);

-- Sample CGM Devices (only for existing users)
-- Get the first 8 user IDs dynamically
SET @user1 = (SELECT user_id FROM users ORDER BY user_id LIMIT 0,1);
SET @user2 = (SELECT user_id FROM users ORDER BY user_id LIMIT 1,1);
SET @user3 = (SELECT user_id FROM users ORDER BY user_id LIMIT 2,1);
SET @user4 = (SELECT user_id FROM users ORDER BY user_id LIMIT 3,1);
SET @user5 = (SELECT user_id FROM users ORDER BY user_id LIMIT 4,1);
SET @user6 = (SELECT user_id FROM users ORDER BY user_id LIMIT 5,1);
SET @user7 = (SELECT user_id FROM users ORDER BY user_id LIMIT 6,1);
SET @user8 = (SELECT user_id FROM users ORDER BY user_id LIMIT 7,1);

-- Insert CGM devices for existing users
INSERT INTO cgm_devices (user_id, device_name, device_model, serial_number, connection_status, last_sync, battery_level, firmware_version, sensor_expiry_date, sensor_days_remaining, is_active)
SELECT @user1, 'Dexcom G6', 'G6 CGM', 'DXC123456', 'Connected', NOW() - INTERVAL 15 MINUTE, 85, 'v2.3.1', NOW() + INTERVAL 8 DAY, DATEDIFF(NOW() + INTERVAL 8 DAY, NOW()), 1 WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user2, 'FreeStyle Libre 2', 'Libre 2', 'FSL789012', 'Connected', NOW() - INTERVAL 30 MINUTE, 92, 'v1.5.0', NOW() + INTERVAL 12 DAY, DATEDIFF(NOW() + INTERVAL 12 DAY, NOW()), 1 WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user3, 'Medtronic Guardian', 'Guardian Connect', 'MDT345678', 'Disconnected', NOW() - INTERVAL 5 HOUR, 45, 'v3.1.2', NOW() + INTERVAL 2 DAY, DATEDIFF(NOW() + INTERVAL 2 DAY, NOW()), 1 WHERE @user3 IS NOT NULL
UNION ALL
SELECT @user4, 'Dexcom G6', 'G6 CGM', 'DXC234567', 'Connected', NOW() - INTERVAL 10 MINUTE, 18, 'v2.3.1', NOW() + INTERVAL 1 DAY, DATEDIFF(NOW() + INTERVAL 1 DAY, NOW()), 1 WHERE @user4 IS NOT NULL
UNION ALL
SELECT @user5, 'FreeStyle Libre 3', 'Libre 3', 'FSL890123', 'Error', NOW() - INTERVAL 1 DAY, 65, 'v2.0.0', NOW() - INTERVAL 1 DAY, DATEDIFF(NOW() - INTERVAL 1 DAY, NOW()), 1 WHERE @user5 IS NOT NULL
UNION ALL
SELECT @user6, 'Dexcom G7', 'G7 CGM', 'DXC345678', 'Connected', NOW() - INTERVAL 5 MINUTE, 95, 'v1.0.5', NOW() + INTERVAL 5 DAY, DATEDIFF(NOW() + INTERVAL 5 DAY, NOW()), 1 WHERE @user6 IS NOT NULL
UNION ALL
SELECT @user7, 'Eversense CGM', 'Eversense XL', 'EVS456789', 'Syncing', NOW() - INTERVAL 2 HOUR, 55, 'v4.2.0', NOW() + INTERVAL 90 DAY, DATEDIFF(NOW() + INTERVAL 90 DAY, NOW()), 1 WHERE @user7 IS NOT NULL
UNION ALL
SELECT @user8, 'Medtronic Guardian', 'Guardian 3', 'MDT567890', 'Connected', NOW() - INTERVAL 20 MINUTE, 78, 'v3.0.1', NOW() + INTERVAL 6 DAY, DATEDIFF(NOW() + INTERVAL 6 DAY, NOW()), 1 WHERE @user8 IS NOT NULL
ON DUPLICATE KEY UPDATE
    connection_status = VALUES(connection_status),
    last_sync = VALUES(last_sync),
    battery_level = VALUES(battery_level),
    sensor_days_remaining = VALUES(sensor_days_remaining);

-- Get more user IDs for scales (can overlap with CGM users)
SET @user9 = (SELECT user_id FROM users ORDER BY user_id LIMIT 8,1);
SET @user10 = (SELECT user_id FROM users ORDER BY user_id LIMIT 9,1);

-- Sample Smart Scale Devices
INSERT INTO smart_scale_devices (user_id, device_name, device_model, serial_number, connection_status, last_sync, battery_level, firmware_version, is_active)
SELECT @user1, 'Withings Body+', 'Body+ Scale', 'WTH123456', 'Connected', NOW() - INTERVAL 2 HOUR, 90, 'v5.2.1', 1 WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user2, 'Fitbit Aria Air', 'Aria Air', 'FIT789012', 'Connected', NOW() - INTERVAL 1 HOUR, 75, 'v3.1.0', 1 WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user3, 'Eufy Smart Scale', 'P2 Pro', 'EUF345678', 'Disconnected', NOW() - INTERVAL 3 DAY, 15, 'v2.5.3', 1 WHERE @user3 IS NOT NULL
UNION ALL
SELECT @user4, 'Withings Body Cardio', 'Body Cardio', 'WTH234567', 'Connected', NOW() - INTERVAL 30 MINUTE, 88, 'v6.0.0', 1 WHERE @user4 IS NOT NULL
UNION ALL
SELECT @user5, 'Garmin Index S2', 'Index S2', 'GRM890123', 'Error', NOW() - INTERVAL 1 DAY, 42, 'v4.1.2', 1 WHERE @user5 IS NOT NULL
UNION ALL
SELECT @user6, 'Renpho Scale', 'ES-26M', 'REN345678', 'Connected', NOW() - INTERVAL 45 MINUTE, 95, 'v1.8.0', 1 WHERE @user6 IS NOT NULL
UNION ALL
SELECT @user7, 'Fitbit Aria 2', 'Aria 2', 'FIT456789', 'Connected', NOW() - INTERVAL 15 MINUTE, 68, 'v3.2.1', 1 WHERE @user7 IS NOT NULL
UNION ALL
SELECT @user9, 'Eufy Smart Scale C1', 'C1', 'EUF567890', 'Disconnected', NOW() - INTERVAL 2 DAY, 22, 'v2.3.0', 1 WHERE @user9 IS NOT NULL
UNION ALL
SELECT @user10, 'Withings Body', 'Body Scale', 'WTH678901', 'Connected', NOW() - INTERVAL 1 HOUR, 82, 'v5.1.0', 1 WHERE @user10 IS NOT NULL
ON DUPLICATE KEY UPDATE
    connection_status = VALUES(connection_status),
    last_sync = VALUES(last_sync),
    battery_level = VALUES(battery_level);

-- Sample Glucose Readings (to show device activity) - only for users with CGM devices
INSERT INTO glucose_readings (user_id, reading_datetime, glucose_level, unit, reading_type, status)
SELECT @user1, NOW() - INTERVAL 15 MINUTE, 145, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user1, NOW() - INTERVAL 30 MINUTE, 138, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user1, NOW() - INTERVAL 1 HOUR, 142, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user2, NOW() - INTERVAL 20 MINUTE, 210, 'mg/dL', 'CGM', 'High' WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user2, NOW() - INTERVAL 40 MINUTE, 195, 'mg/dL', 'CGM', 'High' WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user2, NOW() - INTERVAL 1 HOUR, 188, 'mg/dL', 'CGM', 'High' WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user4, NOW() - INTERVAL 10 MINUTE, 95, 'mg/dL', 'CGM', 'Normal' WHERE @user4 IS NOT NULL
UNION ALL
SELECT @user4, NOW() - INTERVAL 25 MINUTE, 98, 'mg/dL', 'CGM', 'Normal' WHERE @user4 IS NOT NULL
UNION ALL
SELECT @user6, NOW() - INTERVAL 5 MINUTE, 165, 'mg/dL', 'CGM', 'Normal' WHERE @user6 IS NOT NULL
UNION ALL
SELECT @user6, NOW() - INTERVAL 20 MINUTE, 158, 'mg/dL', 'CGM', 'Normal' WHERE @user6 IS NOT NULL
UNION ALL
SELECT @user8, NOW() - INTERVAL 25 MINUTE, 88, 'mg/dL', 'CGM', 'Low' WHERE @user8 IS NOT NULL
UNION ALL
SELECT @user8, NOW() - INTERVAL 45 MINUTE, 92, 'mg/dL', 'CGM', 'Normal' WHERE @user8 IS NOT NULL
ON DUPLICATE KEY UPDATE reading_datetime = VALUES(reading_datetime);

-- Sample Weight Logs (to show scale activity) - only for users with scales
INSERT INTO weight_logs (user_id, log_date, weight_kg, bmi, source)
SELECT @user1, CURDATE(), 75.5, 24.5, 'Smart Scale' WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user1, CURDATE() - INTERVAL 1 DAY, 75.8, 24.6, 'Smart Scale' WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user2, CURDATE(), 82.3, 26.8, 'Smart Scale' WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user2, CURDATE() - INTERVAL 1 DAY, 82.5, 26.9, 'Smart Scale' WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user4, CURDATE(), 68.9, 22.1, 'Smart Scale' WHERE @user4 IS NOT NULL
UNION ALL
SELECT @user6, CURDATE(), 79.2, 25.3, 'Smart Scale' WHERE @user6 IS NOT NULL
UNION ALL
SELECT @user7, CURDATE(), 91.5, 29.2, 'Smart Scale' WHERE @user7 IS NOT NULL
UNION ALL
SELECT @user10, CURDATE(), 70.8, 23.5, 'Smart Scale' WHERE @user10 IS NOT NULL
ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), bmi = VALUES(bmi);

-- Show summary
SELECT '✅ Device Data Inserted Successfully' as Status;
SELECT '---' as '---';
SELECT 'CGM Devices:' as Category, COUNT(*) as Count FROM cgm_devices WHERE is_active = 1;
SELECT 'Smart Scales:' as Category, COUNT(*) as Count FROM smart_scale_devices WHERE is_active = 1;
SELECT 'Glucose Readings (Today):' as Category, COUNT(*) as Count FROM glucose_readings WHERE DATE(reading_datetime) = CURDATE();
SELECT 'Weight Logs (Today):' as Category, COUNT(*) as Count FROM weight_logs WHERE log_date = CURDATE();
SELECT '---' as '---';
SELECT '🎉 Ready to test Device Management Dashboard!' as Message;
