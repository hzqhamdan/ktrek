-- Comprehensive Data Verification Script for iSCMS Admin Panel
-- Run this to check what data exists and what's missing

USE iscms_db;

SELECT '========================================' as '';
SELECT 'DATABASE DATA VERIFICATION REPORT' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- 1. USERS
SELECT '1. USERS TABLE' as Category;
SELECT COUNT(*) as Total_Users FROM users;
SELECT COUNT(*) as Active_Users FROM users WHERE is_active = 1;
SELECT '' as '';

-- 2. FOOD DATABASE
SELECT '2. FOOD DATABASE TABLE' as Category;
SELECT COUNT(*) as Total_Food_Items FROM food_database;
SELECT 
    SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as Verified_Items,
    SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) as Needs_Review,
    SUM(CASE WHEN is_malaysian_food = 1 THEN 1 ELSE 0 END) as Malaysian_Foods
FROM food_database;
SELECT '' as '';

-- 3. FOOD ENTRIES
SELECT '3. FOOD ENTRIES TABLE' as Category;
SELECT COUNT(*) as Total_Food_Entries FROM food_entries;
SELECT COUNT(*) as Recent_7_Days FROM food_entries 
WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY);
SELECT '' as '';

-- 4. USER ALERTS
SELECT '4. USER ALERTS TABLE' as Category;
SELECT COUNT(*) as Total_Alerts FROM user_alerts;
SELECT 
    SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as Critical_Alerts,
    SUM(CASE WHEN severity = 'Warning' THEN 1 ELSE 0 END) as Warning_Alerts,
    SUM(CASE WHEN severity = 'Info' THEN 1 ELSE 0 END) as Info_Alerts,
    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as Unread_Alerts
FROM user_alerts;
SELECT '' as '';

-- 5. NOTIFICATION HISTORY
SELECT '5. NOTIFICATION HISTORY TABLE' as Category;
SELECT COUNT(*) as Total_Notifications FROM notification_history;
SELECT COUNT(*) as Recent_7_Days FROM notification_history 
WHERE sent_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY);
SELECT '' as '';

-- 6. CGM DEVICES
SELECT '6. CGM DEVICES TABLE' as Category;
SELECT COUNT(*) as Total_CGM_Devices FROM cgm_devices;
SELECT COUNT(*) as Active_Devices FROM cgm_devices WHERE status = 'Active';
SELECT '' as '';

-- 7. GLUCOSE READINGS
SELECT '7. GLUCOSE READINGS TABLE' as Category;
SELECT COUNT(*) as Total_Glucose_Readings FROM glucose_readings;
SELECT COUNT(*) as Recent_7_Days FROM glucose_readings 
WHERE reading_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY);
SELECT '' as '';

-- 8. SMART SCALE DEVICES
SELECT '8. SMART SCALE DEVICES TABLE' as Category;
SELECT COUNT(*) as Total_Smart_Scales FROM smart_scale_devices;
SELECT '' as '';

-- 9. WEIGHT LOGS
SELECT '9. WEIGHT LOGS TABLE' as Category;
SELECT COUNT(*) as Total_Weight_Logs FROM weight_logs;
SELECT '' as '';

-- 10. USER REPORTED FOODS
SELECT '10. USER REPORTED FOODS TABLE' as Category;
SELECT COUNT(*) as Total_Reports FROM user_reported_foods;
SELECT COUNT(*) as Pending_Reports FROM user_reported_foods WHERE status = 'Pending';
SELECT '' as '';

SELECT '========================================' as '';
SELECT 'MISSING DATA SUMMARY' as '';
SELECT '========================================' as '';

-- Summary of what's missing
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM food_database) = 0 THEN '❌ MISSING: food_database table is empty - Run sample_food_database.sql'
        ELSE '✅ OK: food_database has data'
    END as Food_Database_Status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM user_alerts) = 0 THEN '❌ MISSING: user_alerts table is empty - Run sample_alerts_notifications.sql'
        ELSE '✅ OK: user_alerts has data'
    END as User_Alerts_Status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM notification_history) = 0 THEN '❌ MISSING: notification_history is empty - Run sample_alerts_notifications.sql'
        ELSE '✅ OK: notification_history has data'
    END as Notifications_Status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM food_entries) = 0 THEN '⚠️ WARNING: food_entries is empty - Total Scans will be 0'
        ELSE '✅ OK: food_entries has data'
    END as Food_Entries_Status;

SELECT '' as '';
SELECT 'Run this script to see what data needs to be loaded!' as '';
