-- Create Sample Healthcare Provider Admin Accounts
-- These providers can access the admin panel with limited permissions

USE iscms_db;

-- Insert Healthcare Provider admin accounts (skip if already exist)
-- Password for all: 'provider123' (hashed with bcrypt cost 10)
INSERT IGNORE INTO admin_users (email, password_hash, full_name, role, is_active) VALUES
('dr.ahmad.admin@hkl.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Ahmad bin Hassan', 'Healthcare Provider', 1),
('dr.siti.admin@ummc.edu.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Siti Nurhaliza binti Abdullah', 'Healthcare Provider', 1),
('dr.lee.admin@gleneagles.com.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Lee Wei Ming', 'Healthcare Provider', 1);

-- Update existing accounts to Healthcare Provider role if they already exist
UPDATE admin_users 
SET role = 'Healthcare Provider', is_active = 1 
WHERE email IN ('dr.ahmad.admin@hkl.gov.my', 'dr.siti.admin@ummc.edu.my', 'dr.lee.admin@gleneagles.com.my')
AND role != 'Healthcare Provider';

-- Link these admin accounts to their healthcare_providers records
-- First, get the admin_ids and provider_ids, then create a mapping table

CREATE TABLE IF NOT EXISTS admin_provider_mapping (
    mapping_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    provider_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(provider_id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_provider (admin_id, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Map admin accounts to provider records (skip if already exist)
-- Assuming the sample_healthcare_providers.sql has been run
INSERT IGNORE INTO admin_provider_mapping (admin_id, provider_id)
SELECT au.admin_id, hp.provider_id
FROM admin_users au
JOIN healthcare_providers hp ON au.email LIKE CONCAT(SUBSTRING_INDEX(hp.email, '@', 1), '.admin%')
WHERE au.role = 'Healthcare Provider'
AND NOT EXISTS (
    SELECT 1 FROM admin_provider_mapping apm 
    WHERE apm.admin_id = au.admin_id AND apm.provider_id = hp.provider_id
);

-- Insert some sample patient sugar limits (skip if already exist)
INSERT IGNORE INTO patient_sugar_limits (user_id, daily_limit_g, set_by_provider_id, reason, effective_from, notes) VALUES
(1, 45.00, 1, 'Pre-diabetic condition', CURDATE(), 'Reduced from standard 50g to help manage blood sugar levels'),
(2, 40.00, 1, 'Type 2 Diabetes', CURDATE(), 'Strict sugar control required'),
(3, 50.00, 1, 'Standard monitoring', CURDATE(), 'Standard daily limit for regular monitoring'),
(4, 35.00, 2, 'High risk patient', CURDATE(), 'Patient showing consistent high glucose readings'),
(5, 55.00, 3, 'Active lifestyle', CURDATE(), 'Slightly higher limit due to active lifestyle and good glucose control');

-- Insert sample clinical recommendations (skip if already exist)
INSERT INTO clinical_recommendations (
    user_id, provider_id, recommendation_type, title, recommendation_text, 
    priority, status, is_educational, effective_date, review_date
)
SELECT 1, 1, 'Diet', 'Reduce Refined Carbohydrates', 
 'For educational purposes: Consider replacing white rice with brown rice or quinoa. Limit intake of sugary beverages and processed foods. Increase fiber intake through vegetables and whole grains.', 
 'High', 'Active', 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
WHERE NOT EXISTS (SELECT 1 FROM clinical_recommendations WHERE user_id = 1 AND provider_id = 1 AND title = 'Reduce Refined Carbohydrates')
UNION ALL
SELECT 1, 1, 'Exercise', 'Regular Physical Activity', 
 'For educational purposes: Aim for 30 minutes of moderate exercise 5 times per week. Walking, swimming, or cycling can help improve insulin sensitivity and blood sugar control.', 
 'Medium', 'Active', 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
WHERE NOT EXISTS (SELECT 1 FROM clinical_recommendations WHERE user_id = 1 AND provider_id = 1 AND title = 'Regular Physical Activity')
UNION ALL
SELECT 2, 1, 'Monitoring', 'Increase Glucose Monitoring Frequency', 
 'For educational purposes: Check blood glucose levels before meals and 2 hours after meals for the next 2 weeks to better understand food impact on blood sugar.', 
 'High', 'Active', 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY)
WHERE NOT EXISTS (SELECT 1 FROM clinical_recommendations WHERE user_id = 2 AND provider_id = 1 AND title = 'Increase Glucose Monitoring Frequency')
UNION ALL
SELECT 2, 2, 'Diet', 'Meal Timing and Portion Control', 
 'For educational purposes: Eat smaller, more frequent meals throughout the day. Avoid skipping breakfast. Keep portion sizes consistent to help stabilize blood sugar levels.', 
 'Medium', 'Active', 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
WHERE NOT EXISTS (SELECT 1 FROM clinical_recommendations WHERE user_id = 2 AND provider_id = 2 AND title = 'Meal Timing and Portion Control')
UNION ALL
SELECT 3, 1, 'Lifestyle', 'Stress Management', 
 'For educational purposes: High stress can affect blood sugar levels. Consider incorporating relaxation techniques such as deep breathing, meditation, or yoga into daily routine.', 
 'Low', 'Active', 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY)
WHERE NOT EXISTS (SELECT 1 FROM clinical_recommendations WHERE user_id = 3 AND provider_id = 1 AND title = 'Stress Management')
UNION ALL
SELECT 4, 2, 'Diet', 'Low Glycemic Index Foods', 
 'For educational purposes: Choose foods with low glycemic index (GI) to prevent blood sugar spikes. Examples include legumes, non-starchy vegetables, and most fruits.', 
 'High', 'Active', 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
WHERE NOT EXISTS (SELECT 1 FROM clinical_recommendations WHERE user_id = 4 AND provider_id = 2 AND title = 'Low Glycemic Index Foods')
UNION ALL
SELECT 5, 3, 'Monitoring', 'Post-Exercise Glucose Tracking', 
 'For educational purposes: Monitor blood glucose before and after exercise sessions to understand how physical activity affects your levels and adjust accordingly.', 
 'Medium', 'Active', 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 21 DAY)
WHERE NOT EXISTS (SELECT 1 FROM clinical_recommendations WHERE user_id = 5 AND provider_id = 3 AND title = 'Post-Exercise Glucose Tracking');

-- Verify data
SELECT '========================================' as '';
SELECT 'HEALTHCARE PROVIDER ADMIN ACCOUNTS CREATED' as '';
SELECT '========================================' as '';
SELECT '' as '';

SELECT 'Healthcare Provider Admin Accounts:' as Info;
SELECT admin_id, email, full_name, role, is_active
FROM admin_users
WHERE role = 'Healthcare Provider';

SELECT '' as '';

SELECT 'Admin-Provider Mappings:' as Info;
SELECT 
    au.full_name as Admin_Name,
    hp.full_name as Provider_Name,
    hp.specialization,
    hp.hospital_clinic
FROM admin_provider_mapping apm
JOIN admin_users au ON apm.admin_id = au.admin_id
JOIN healthcare_providers hp ON apm.provider_id = hp.provider_id;

SELECT '' as '';

SELECT 'Patient Sugar Limits Summary:' as Info;
SELECT COUNT(*) as Total_Limits,
       AVG(daily_limit_g) as Avg_Daily_Limit,
       MIN(daily_limit_g) as Min_Limit,
       MAX(daily_limit_g) as Max_Limit
FROM patient_sugar_limits;

SELECT '' as '';

SELECT 'Clinical Recommendations Summary:' as Info;
SELECT 
    recommendation_type,
    COUNT(*) as Count,
    SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as HighPriority
FROM clinical_recommendations
GROUP BY recommendation_type;

SELECT '' as '';
SELECT 'Login Credentials for Healthcare Providers:' as '';
SELECT 'Email: dr.ahmad.admin@hkl.gov.my | Password: provider123' as '';
SELECT 'Email: dr.siti.admin@ummc.edu.my | Password: provider123' as '';
SELECT 'Email: dr.lee.admin@gleneagles.com.my | Password: provider123' as '';
SELECT '' as '';
