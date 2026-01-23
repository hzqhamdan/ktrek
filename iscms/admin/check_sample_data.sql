-- Check if sample data was loaded correctly

USE iscms_db;

SELECT '========================================' as '';
SELECT 'Checking Sample Data Status' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Check users
SELECT 'USERS:' as Category;
SELECT user_id, full_name, email, health_status 
FROM users 
WHERE email LIKE '%@email.com'
ORDER BY user_id;

SELECT '' as '';

-- Check CGM devices
SELECT 'CGM DEVICES:' as Category;
SELECT COUNT(*) as Total FROM cgm_devices;
SELECT * FROM cgm_devices LIMIT 5;

SELECT '' as '';

-- Check Smart Scales
SELECT 'SMART SCALES:' as Category;
SELECT COUNT(*) as Total FROM smart_scale_devices;
SELECT * FROM smart_scale_devices LIMIT 5;

SELECT '' as '';

-- Check glucose readings
SELECT 'GLUCOSE READINGS (Today):' as Category;
SELECT COUNT(*) as Total FROM glucose_readings WHERE DATE(reading_datetime) = CURDATE();

SELECT '' as '';

-- Check food entries
SELECT 'FOOD ENTRIES (Today):' as Category;
SELECT COUNT(*) as Total FROM food_entries WHERE DATE(entry_datetime) = CURDATE();

SELECT '' as '';

-- Check weight logs
SELECT 'WEIGHT LOGS (Today):' as Category;
SELECT COUNT(*) as Total FROM weight_logs WHERE log_date = CURDATE();
