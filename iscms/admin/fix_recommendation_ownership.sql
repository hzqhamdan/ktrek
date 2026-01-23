-- Fix Clinical Recommendations Ownership
-- Assign all existing recommendations to the Healthcare Provider admin accounts

USE iscms_db;

-- Update all existing recommendations to be owned by provider_id = 1 (Dr. Ahmad)
-- This matches the admin_provider_mapping for the first Healthcare Provider admin
UPDATE clinical_recommendations 
SET provider_id = 1 
WHERE provider_id IN (1, 2, 3);

-- Verify the update
SELECT 'Updated Recommendations:' as Info;
SELECT recommendation_id, user_id, provider_id, title, status
FROM clinical_recommendations
ORDER BY recommendation_id;

SELECT '' as '';
SELECT 'Summary:' as Info;
SELECT 
    provider_id,
    COUNT(*) as total_recommendations,
    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
FROM clinical_recommendations
GROUP BY provider_id;

SELECT '' as '';
SELECT 'Now all recommendations are owned by provider_id = 1' as Result;
SELECT 'which is linked to admin_id = 2 (dr.ahmad.admin@hkl.gov.my)' as Result;
