-- Debug script to check Food Database data and API query
USE iscms_db;

SELECT '========================================' as '';
SELECT 'DEBUGGING FOOD DATABASE ISSUE' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- 1. Check if food_database table exists and has data
SELECT '1. FOOD DATABASE TABLE CHECK' as '';
SELECT COUNT(*) as Total_Records FROM food_database;
SELECT '' as '';

-- 2. Show sample records
SELECT '2. SAMPLE FOOD DATABASE RECORDS' as '';
SELECT food_id, food_name, is_verified, needs_review, is_active, is_malaysian_food 
FROM food_database 
LIMIT 10;
SELECT '' as '';

-- 3. Check the exact query used by the API
SELECT '3. SIMULATING API QUERY (food_database overview)' as '';
SELECT
    COUNT(*) as total_items,
    SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_items,
    SUM(CASE WHEN is_malaysian_food = 1 THEN 1 ELSE 0 END) as malaysian_items,
    SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) as needs_review
FROM food_database
WHERE (is_active = 1 OR is_active IS NULL);
SELECT '' as '';

-- 4. Check without the is_active filter
SELECT '4. CHECK WITHOUT is_active FILTER' as '';
SELECT
    COUNT(*) as total_items,
    SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_items,
    SUM(CASE WHEN is_malaysian_food = 1 THEN 1 ELSE 0 END) as malaysian_items,
    SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) as needs_review
FROM food_database;
SELECT '' as '';

-- 5. Check is_active column values
SELECT '5. is_active COLUMN VALUES' as '';
SELECT is_active, COUNT(*) as count
FROM food_database
GROUP BY is_active;
SELECT '' as '';

-- 6. Check for NULL values
SELECT '6. CHECK FOR NULL VALUES' as '';
SELECT 
    SUM(CASE WHEN is_verified IS NULL THEN 1 ELSE 0 END) as null_verified,
    SUM(CASE WHEN is_malaysian_food IS NULL THEN 1 ELSE 0 END) as null_malaysian,
    SUM(CASE WHEN needs_review IS NULL THEN 1 ELSE 0 END) as null_needs_review,
    SUM(CASE WHEN is_active IS NULL THEN 1 ELSE 0 END) as null_is_active
FROM food_database;
SELECT '' as '';

-- 7. Check user_reported_foods
SELECT '7. USER REPORTED FOODS' as '';
SELECT COUNT(*) as Total FROM user_reported_foods;
SELECT COUNT(*) as Pending FROM user_reported_foods WHERE status = 'Pending';
SELECT '' as '';

-- 8. Check food_entries
SELECT '8. FOOD ENTRIES' as '';
SELECT COUNT(*) as Total_Entries FROM food_entries;
SELECT COUNT(*) as Last_7_Days FROM food_entries WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY);
SELECT '' as '';

-- 9. Show exact data types
SELECT '9. TABLE STRUCTURE' as '';
DESCRIBE food_database;
SELECT '' as '';

SELECT '========================================' as '';
SELECT 'DEBUG COMPLETE' as '';
SELECT '========================================' as '';
