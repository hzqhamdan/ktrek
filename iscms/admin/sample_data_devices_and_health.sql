-- Sample Devices and Health Data for iSCMS Testing
-- Run this AFTER sample_data_users.sql

USE iscms_db;

-- Get user IDs (dynamically gets the last 10 users created)
SET @user1 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 9, 1);
SET @user2 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 8, 1);
SET @user3 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 7, 1);
SET @user4 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 6, 1);
SET @user5 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 5, 1);
SET @user6 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 4, 1);
SET @user7 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 3, 1);
SET @user8 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 2, 1);
SET @user9 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1, 1);
SET @user10 = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 0, 1);

-- ============================================
-- CGM DEVICES
-- ============================================
INSERT INTO cgm_devices (
    user_id, device_name, device_model, serial_number, connection_status,
    last_sync, battery_level, firmware_version, sensor_expiry_date, sensor_days_remaining, is_active
)
SELECT @user1, 'Dexcom G6', 'G6 CGM', 'DXC-2024-001', 'Connected', 
       NOW() - INTERVAL 15 MINUTE, 85, 'v2.3.1', 
       NOW() + INTERVAL 8 DAY, DATEDIFF(NOW() + INTERVAL 8 DAY, NOW()), 1
WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user2, 'FreeStyle Libre 2', 'Libre 2', 'FSL-2024-002', 'Connected',
       NOW() - INTERVAL 30 MINUTE, 92, 'v1.5.0',
       NOW() + INTERVAL 12 DAY, DATEDIFF(NOW() + INTERVAL 12 DAY, NOW()), 1
WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user3, 'Medtronic Guardian', 'Guardian Connect', 'MDT-2024-003', 'Disconnected',
       NOW() - INTERVAL 5 HOUR, 45, 'v3.1.2',
       NOW() + INTERVAL 2 DAY, DATEDIFF(NOW() + INTERVAL 2 DAY, NOW()), 1
WHERE @user3 IS NOT NULL
UNION ALL
SELECT @user4, 'Dexcom G7', 'G7 CGM', 'DXC-2024-004', 'Connected',
       NOW() - INTERVAL 10 MINUTE, 18, 'v2.3.1',
       NOW() + INTERVAL 1 DAY, DATEDIFF(NOW() + INTERVAL 1 DAY, NOW()), 1
WHERE @user4 IS NOT NULL
UNION ALL
SELECT @user6, 'FreeStyle Libre 3', 'Libre 3', 'FSL-2024-006', 'Error',
       NOW() - INTERVAL 1 DAY, 65, 'v2.0.0',
       NOW() - INTERVAL 1 DAY, DATEDIFF(NOW() - INTERVAL 1 DAY, NOW()), 1
WHERE @user6 IS NOT NULL
UNION ALL
SELECT @user7, 'Dexcom G6', 'G6 CGM', 'DXC-2024-007', 'Connected',
       NOW() - INTERVAL 5 MINUTE, 95, 'v1.0.5',
       NOW() + INTERVAL 5 DAY, DATEDIFF(NOW() + INTERVAL 5 DAY, NOW()), 1
WHERE @user7 IS NOT NULL
UNION ALL
SELECT @user10, 'Medtronic Guardian', 'Guardian 3', 'MDT-2024-010', 'Syncing',
       NOW() - INTERVAL 2 HOUR, 55, 'v4.2.0',
       NOW() + INTERVAL 90 DAY, DATEDIFF(NOW() + INTERVAL 90 DAY, NOW()), 1
WHERE @user10 IS NOT NULL
ON DUPLICATE KEY UPDATE
    connection_status = VALUES(connection_status),
    last_sync = VALUES(last_sync),
    battery_level = VALUES(battery_level);

-- ============================================
-- SMART SCALE DEVICES
-- ============================================
INSERT INTO smart_scale_devices (
    user_id, device_name, device_model, serial_number, connection_status,
    last_sync, battery_level, firmware_version, is_active
)
SELECT @user1, 'Withings Body+', 'Body+ Scale', 'WTH-2024-001', 'Connected',
       NOW() - INTERVAL 2 HOUR, 90, 'v5.2.1', 1
WHERE @user1 IS NOT NULL
UNION ALL
SELECT @user2, 'Fitbit Aria Air', 'Aria Air', 'FIT-2024-002', 'Connected',
       NOW() - INTERVAL 1 HOUR, 75, 'v3.1.0', 1
WHERE @user2 IS NOT NULL
UNION ALL
SELECT @user3, 'Eufy Smart Scale', 'P2 Pro', 'EUF-2024-003', 'Disconnected',
       NOW() - INTERVAL 3 DAY, 15, 'v2.5.3', 1
WHERE @user3 IS NOT NULL
UNION ALL
SELECT @user5, 'Withings Body Cardio', 'Body Cardio', 'WTH-2024-005', 'Connected',
       NOW() - INTERVAL 30 MINUTE, 88, 'v6.0.0', 1
WHERE @user5 IS NOT NULL
UNION ALL
SELECT @user6, 'Garmin Index S2', 'Index S2', 'GRM-2024-006', 'Error',
       NOW() - INTERVAL 1 DAY, 42, 'v4.1.2', 1
WHERE @user6 IS NOT NULL
UNION ALL
SELECT @user8, 'Renpho Scale', 'ES-26M', 'REN-2024-008', 'Connected',
       NOW() - INTERVAL 45 MINUTE, 95, 'v1.8.0', 1
WHERE @user8 IS NOT NULL
UNION ALL
SELECT @user9, 'Fitbit Aria 2', 'Aria 2', 'FIT-2024-009', 'Disconnected',
       NOW() - INTERVAL 2 DAY, 22, 'v3.2.1', 1
WHERE @user9 IS NOT NULL
UNION ALL
SELECT @user10, 'Withings Body', 'Body Scale', 'WTH-2024-010', 'Connected',
       NOW() - INTERVAL 1 HOUR, 82, 'v5.1.0', 1
WHERE @user10 IS NOT NULL
ON DUPLICATE KEY UPDATE
    connection_status = VALUES(connection_status),
    last_sync = VALUES(last_sync),
    battery_level = VALUES(battery_level);

-- ============================================
-- GLUCOSE READINGS (Today + Last 7 Days)
-- ============================================
INSERT INTO glucose_readings (user_id, reading_datetime, glucose_level, unit, reading_type, status)
SELECT * FROM (
    -- User 1 - Today's readings
    SELECT @user1, NOW() - INTERVAL 1 HOUR, 125, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 2 HOUR, 132, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 4 HOUR, 118, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 6 HOUR, 145, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    
    -- User 2 - Today's readings (Pre-diabetic)
    UNION ALL SELECT @user2, NOW() - INTERVAL 30 MINUTE, 178, 'mg/dL', 'CGM', 'High' WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, NOW() - INTERVAL 2 HOUR, 165, 'mg/dL', 'CGM', 'Normal' WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, NOW() - INTERVAL 4 HOUR, 192, 'mg/dL', 'CGM', 'High' WHERE @user2 IS NOT NULL
    
    -- User 3 - Today's readings (Type 2 Diabetes)
    UNION ALL SELECT @user3, NOW() - INTERVAL 1 HOUR, 215, 'mg/dL', 'CGM', 'High' WHERE @user3 IS NOT NULL
    UNION ALL SELECT @user3, NOW() - INTERVAL 3 HOUR, 198, 'mg/dL', 'CGM', 'High' WHERE @user3 IS NOT NULL
    
    -- User 4 - Today's readings (Type 1 Diabetes)
    UNION ALL SELECT @user4, NOW() - INTERVAL 15 MINUTE, 88, 'mg/dL', 'CGM', 'Low' WHERE @user4 IS NOT NULL
    UNION ALL SELECT @user4, NOW() - INTERVAL 1 HOUR, 145, 'mg/dL', 'CGM', 'Normal' WHERE @user4 IS NOT NULL
    UNION ALL SELECT @user4, NOW() - INTERVAL 3 HOUR, 162, 'mg/dL', 'CGM', 'Normal' WHERE @user4 IS NOT NULL
    
    -- Last 7 days data for trends (sample for user 1)
    UNION ALL SELECT @user1, NOW() - INTERVAL 1 DAY, 135, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 2 DAY, 128, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 3 DAY, 142, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 4 DAY, 138, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 5 DAY, 145, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, NOW() - INTERVAL 6 DAY, 132, 'mg/dL', 'CGM', 'Normal' WHERE @user1 IS NOT NULL
) AS readings
ON DUPLICATE KEY UPDATE reading_datetime = VALUES(reading_datetime);

-- ============================================
-- WEIGHT LOGS (Today + Last 7 Days)
-- ============================================
INSERT INTO weight_logs (user_id, log_date, weight_kg, bmi, source)
SELECT * FROM (
    -- Today's weight
    SELECT @user1, CURDATE(), 72.0, 23.5, 'Smart Scale' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user2, CURDATE(), 68.0, 26.6, 'Smart Scale' WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user3, CURDATE(), 85.0, 29.4, 'Smart Scale' WHERE @user3 IS NOT NULL
    UNION ALL SELECT @user5, CURDATE(), 78.0, 24.6, 'Smart Scale' WHERE @user5 IS NOT NULL
    UNION ALL SELECT @user8, CURDATE(), 55.0, 20.9, 'Smart Scale' WHERE @user8 IS NOT NULL
    
    -- Last 7 days for user 1 (trend)
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 1 DAY, 72.2, 23.6, 'Smart Scale' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 2 DAY, 72.5, 23.7, 'Smart Scale' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 3 DAY, 72.8, 23.8, 'Smart Scale' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 4 DAY, 73.0, 23.9, 'Smart Scale' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 5 DAY, 73.2, 24.0, 'Smart Scale' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 6 DAY, 73.5, 24.1, 'Smart Scale' WHERE @user1 IS NOT NULL
) AS weights
ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), bmi = VALUES(bmi);

-- ============================================
-- FOOD ENTRIES (Today's Activity)
-- ============================================
INSERT INTO food_entries (
    user_id, food_name, meal_type, entry_datetime, 
    sugar_content_g, calories, recognition_method
)
SELECT * FROM (
    -- User 1 - Today's meals
    SELECT @user1, 'Nasi Lemak with Sambal', 'Breakfast', NOW() - INTERVAL 8 HOUR, 12, 450, 'AI Recognition' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, 'Roti Canai', 'Breakfast', NOW() - INTERVAL 7 HOUR + INTERVAL 30 MINUTE, 8, 350, 'Barcode Scan' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, 'Chicken Rice', 'Lunch', NOW() - INTERVAL 4 HOUR, 15, 520, 'AI Recognition' WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, 'Mango Lassi', 'Snack', NOW() - INTERVAL 2 HOUR, 25, 180, 'Manual Entry' WHERE @user1 IS NOT NULL
    
    -- User 2 - Today's meals
    UNION ALL SELECT @user2, 'Char Kway Teow', 'Lunch', NOW() - INTERVAL 5 HOUR, 18, 680, 'AI Recognition' WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, 'Teh Tarik', 'Snack', NOW() - INTERVAL 3 HOUR, 22, 150, 'Barcode Scan' WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, 'Satay', 'Dinner', NOW() - INTERVAL 1 HOUR, 14, 420, 'AI Recognition' WHERE @user2 IS NOT NULL
    
    -- User 3 - Today's meals (Type 2 Diabetes - higher sugar)
    UNION ALL SELECT @user3, 'Nasi Kandar', 'Lunch', NOW() - INTERVAL 4 HOUR, 28, 750, 'AI Recognition' WHERE @user3 IS NOT NULL
    UNION ALL SELECT @user3, 'Cendol', 'Snack', NOW() - INTERVAL 2 HOUR, 35, 280, 'Manual Entry' WHERE @user3 IS NOT NULL
    
    -- User 4 - Today's meals
    UNION ALL SELECT @user4, 'Oatmeal with Berries', 'Breakfast', NOW() - INTERVAL 7 HOUR, 8, 220, 'Manual Entry' WHERE @user4 IS NOT NULL
    UNION ALL SELECT @user4, 'Grilled Fish Salad', 'Lunch', NOW() - INTERVAL 3 HOUR, 6, 320, 'AI Recognition' WHERE @user4 IS NOT NULL
) AS foods
ON DUPLICATE KEY UPDATE entry_datetime = VALUES(entry_datetime);

-- ============================================
-- EXERCISE LOGS (Today's Activity)
-- ============================================
INSERT INTO exercise_logs (
    user_id, activity_type, activity_datetime, duration_minutes, calories_burned
)
SELECT * FROM (
    SELECT @user1, 'Walking', NOW() - INTERVAL 6 HOUR, 30, 120 WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user2, 'Jogging', NOW() - INTERVAL 7 HOUR, 45, 280 WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user4, 'Cycling', NOW() - INTERVAL 5 HOUR, 60, 350 WHERE @user4 IS NOT NULL
    UNION ALL SELECT @user5, 'Swimming', NOW() - INTERVAL 8 HOUR, 40, 300 WHERE @user5 IS NOT NULL
) AS exercises
ON DUPLICATE KEY UPDATE activity_datetime = VALUES(activity_datetime);

-- ============================================
-- SUGAR INTAKE LOGS (Last 7 Days)
-- ============================================
INSERT INTO sugar_intake_logs (
    user_id, log_date, total_sugar_g, compliance_status, limit_exceeded
)
SELECT * FROM (
    -- User 1 - Good compliance
    SELECT @user1, CURDATE(), 45, 'Within Limit', 0 WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 1 DAY, 48, 'Within Limit', 0 WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 2 DAY, 42, 'Within Limit', 0 WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 3 DAY, 52, 'Exceeded', 1 WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 4 DAY, 46, 'Within Limit', 0 WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 5 DAY, 44, 'Within Limit', 0 WHERE @user1 IS NOT NULL
    UNION ALL SELECT @user1, CURDATE() - INTERVAL 6 DAY, 49, 'Within Limit', 0 WHERE @user1 IS NOT NULL
    
    -- User 2 - Pre-diabetic with some violations
    UNION ALL SELECT @user2, CURDATE(), 52, 'Exceeded', 1 WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, CURDATE() - INTERVAL 1 DAY, 38, 'Within Limit', 0 WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, CURDATE() - INTERVAL 2 DAY, 45, 'Exceeded', 1 WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, CURDATE() - INTERVAL 3 DAY, 42, 'Exceeded', 1 WHERE @user2 IS NOT NULL
    UNION ALL SELECT @user2, CURDATE() - INTERVAL 4 DAY, 35, 'Within Limit', 0 WHERE @user2 IS NOT NULL
    
    -- User 3 - Type 2 Diabetes with violations
    UNION ALL SELECT @user3, CURDATE(), 68, 'Exceeded', 1 WHERE @user3 IS NOT NULL
    UNION ALL SELECT @user3, CURDATE() - INTERVAL 1 DAY, 58, 'Exceeded', 1 WHERE @user3 IS NOT NULL
    UNION ALL SELECT @user3, CURDATE() - INTERVAL 2 DAY, 62, 'Exceeded', 1 WHERE @user3 IS NOT NULL
) AS sugar_logs
ON DUPLICATE KEY UPDATE total_sugar_g = VALUES(total_sugar_g);

-- ============================================
-- HIGH RISK USERS (For Reports Testing)
-- ============================================
INSERT INTO high_risk_users (
    user_id, risk_level, consecutive_violations, flagged_date, provider_notified, is_resolved
)
SELECT * FROM (
    SELECT @user3, 'High', 3, NOW() - INTERVAL 5 DAY, 1, 0 WHERE @user3 IS NOT NULL
    UNION ALL SELECT @user7, 'Critical', 5, NOW() - INTERVAL 10 DAY, 0, 0 WHERE @user7 IS NOT NULL
    UNION ALL SELECT @user10, 'High', 4, NOW() - INTERVAL 7 DAY, 1, 0 WHERE @user10 IS NOT NULL
) AS risks
ON DUPLICATE KEY UPDATE consecutive_violations = VALUES(consecutive_violations);

-- ============================================
-- SUMMARY
-- ============================================
SELECT '✅ Sample data created successfully!' as Status;
SELECT '' as '';
SELECT 'CGM Devices:' as Category, COUNT(*) as Count FROM cgm_devices WHERE is_active = 1;
SELECT 'Smart Scales:' as Category, COUNT(*) as Count FROM smart_scale_devices WHERE is_active = 1;
SELECT 'Glucose Readings (Today):' as Category, COUNT(*) as Count FROM glucose_readings WHERE DATE(reading_datetime) = CURDATE();
SELECT 'Weight Logs (Today):' as Category, COUNT(*) as Count FROM weight_logs WHERE log_date = CURDATE();
SELECT 'Food Entries (Today):' as Category, COUNT(*) as Count FROM food_entries WHERE DATE(entry_datetime) = CURDATE();
SELECT 'Exercise Logs (Today):' as Category, COUNT(*) as Count FROM exercise_logs WHERE DATE(activity_datetime) = CURDATE();
SELECT 'High Risk Users:' as Category, COUNT(*) as Count FROM high_risk_users WHERE is_resolved = 0;
