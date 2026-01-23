-- Check Food Database and Food Entries Data
SELECT 'food_database table' as Table_Name, COUNT(*) as Total_Records FROM food_database;
SELECT 'food_entries table' as Table_Name, COUNT(*) as Total_Records FROM food_entries;
SELECT 'user_reported_foods table' as Table_Name, COUNT(*) as Total_Records FROM user_reported_foods;

-- Check food_database details
SELECT 
    COUNT(*) as total_items,
    SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_items,
    SUM(CASE WHEN is_malaysian_food = 1 THEN 1 ELSE 0 END) as malaysian_items,
    SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) as needs_review
FROM food_database
WHERE (is_active = 1 OR is_active IS NULL);

-- Check food_entries recent data
SELECT COUNT(*) as recent_entries 
FROM food_entries 
WHERE entry_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Sample of food_database records
SELECT food_id, food_name, is_verified, is_malaysian_food, needs_review 
FROM food_database 
LIMIT 10;

-- Sample of food_entries records
SELECT entry_id, user_id, food_name, entry_datetime 
FROM food_entries 
ORDER BY entry_datetime DESC
LIMIT 10;
