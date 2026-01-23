-- Fix blank/null recognition methods in food_entries table
USE iscms_db;

-- Check current recognition methods
SELECT 'Before Fix:' as Status;
SELECT 
    recognition_method, 
    COUNT(*) as count 
FROM food_entries 
GROUP BY recognition_method;

-- Update all NULL, empty, or whitespace-only recognition methods to 'AI Recognition'
UPDATE food_entries 
SET recognition_method = 'AI Recognition'
WHERE recognition_method IS NULL 
   OR recognition_method = '' 
   OR TRIM(recognition_method) = '';

-- Check after fix
SELECT '' as '';
SELECT 'After Fix:' as Status;
SELECT 
    recognition_method, 
    COUNT(*) as count 
FROM food_entries 
GROUP BY recognition_method;

SELECT '' as '';
SELECT 'Fix complete! All blank recognition methods set to AI Recognition' as Result;
