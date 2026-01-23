-- Sample Healthcare Providers Data for iSCMS Admin Panel
-- Populates healthcare_providers and patient_provider_links tables

USE iscms_db;

-- Insert sample healthcare providers
INSERT INTO healthcare_providers (
    email, password_hash, full_name, license_number, specialization, 
    hospital_clinic, phone_number, is_verified, is_active, verification_date
) VALUES
-- Verified Providers
('dr.ahmad@hkl.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Ahmad bin Hassan', 'MMC12345', 'Endocrinologist', 'Hospital Kuala Lumpur', '+60123456789', 1, 1, DATE_SUB(NOW(), INTERVAL 30 DAY)),
('dr.siti@ummc.edu.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Siti Nurhaliza binti Abdullah', 'MMC23456', 'Diabetologist', 'UMMC (University Malaya Medical Centre)', '+60198765432', 1, 1, DATE_SUB(NOW(), INTERVAL 45 DAY)),
('dr.lee@gleneagles.com.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Lee Wei Ming', 'MMC34567', 'Internal Medicine', 'Gleneagles Hospital Kuala Lumpur', '+60176543210', 1, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
('dr.kumar@ampang.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Kumar a/l Subramaniam', 'MMC45678', 'General Practitioner', 'Hospital Ampang', '+60123334444', 1, 1, DATE_SUB(NOW(), INTERVAL 20 DAY)),
('dietitian.amy@pantai.com.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amy Tan Li Ying', 'DN12345', 'Dietitian', 'Pantai Hospital Kuala Lumpur', '+60167778888', 1, 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),

-- Pending Verification
('dr.fatimah@clinic.com.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Fatimah binti Mohd Yusof', 'MMC56789', 'Family Medicine', 'Klinik Kesihatan Cheras', '+60123335555', 0, 1, NULL),
('nutritionist.sarah@wellness.com.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Wong Mei Ling', 'DN23456', 'Nutritionist', 'Wellness Centre Petaling Jaya', '+60187776666', 0, 1, NULL),
('dr.rahman@selayang.gov.my', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Abdul Rahman bin Ahmad', 'MMC67890', 'Endocrinologist', 'Hospital Selayang', '+60129998888', 0, 1, NULL);

-- Note: Password for all sample providers is 'password123' (hashed with bcrypt)

-- Link providers to patients (using existing user IDs from sample data)
-- Assuming users with IDs 1-5 exist from previous sample data
INSERT INTO patient_provider_links (
    user_id, provider_id, consent_given, access_level, consent_date, is_active
) VALUES
-- Dr. Ahmad (provider_id: 1) has 3 patients
(1, 1, 1, 'Full', DATE_SUB(NOW(), INTERVAL 25 DAY), 1),
(2, 1, 1, 'Full', DATE_SUB(NOW(), INTERVAL 20 DAY), 1),
(3, 1, 1, 'Read-Only', DATE_SUB(NOW(), INTERVAL 15 DAY), 1),

-- Dr. Siti (provider_id: 2) has 2 patients
(2, 2, 1, 'Full', DATE_SUB(NOW(), INTERVAL 40 DAY), 1),
(4, 2, 1, 'Full', DATE_SUB(NOW(), INTERVAL 30 DAY), 1),

-- Dr. Lee (provider_id: 3) has 1 patient
(5, 3, 1, 'Read-Only', DATE_SUB(NOW(), INTERVAL 50 DAY), 1),

-- Dr. Kumar (provider_id: 4) has 2 patients
(1, 4, 1, 'Full', DATE_SUB(NOW(), INTERVAL 10 DAY), 1),
(3, 4, 0, 'Pending', NULL, 1),

-- Dietitian Amy (provider_id: 5) has 3 patients
(2, 5, 1, 'Full', DATE_SUB(NOW(), INTERVAL 12 DAY), 1),
(4, 5, 1, 'Full', DATE_SUB(NOW(), INTERVAL 8 DAY), 1),
(5, 5, 1, 'Read-Only', DATE_SUB(NOW(), INTERVAL 5 DAY), 1);

-- Verify data
SELECT '========================================' as '';
SELECT 'HEALTHCARE PROVIDERS DATA LOADED' as '';
SELECT '========================================' as '';
SELECT '' as '';

SELECT 'Provider Summary' as Info, 
       COUNT(*) as Total_Providers,
       SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as Verified,
       SUM(CASE WHEN is_verified = 0 THEN 1 ELSE 0 END) as Pending_Verification
FROM healthcare_providers;

SELECT '' as '';

SELECT 'Patient-Provider Links Summary' as Info,
       COUNT(*) as Total_Links,
       SUM(CASE WHEN consent_given = 1 THEN 1 ELSE 0 END) as Consented,
       SUM(CASE WHEN consent_given = 0 THEN 1 ELSE 0 END) as Pending_Consent
FROM patient_provider_links;

SELECT '' as '';

-- Show providers with patient counts
SELECT 
    hp.provider_id,
    hp.full_name,
    hp.specialization,
    hp.hospital_clinic,
    hp.is_verified,
    COUNT(ppl.link_id) as linked_patients,
    SUM(CASE WHEN ppl.consent_given = 1 THEN 1 ELSE 0 END) as consented_patients
FROM healthcare_providers hp
LEFT JOIN patient_provider_links ppl ON hp.provider_id = ppl.provider_id AND ppl.is_active = 1
GROUP BY hp.provider_id
ORDER BY hp.provider_id;

SELECT '' as '';
SELECT 'Sample provider credentials:' as '';
SELECT 'Email: dr.ahmad@hkl.gov.my | Password: password123' as '';
SELECT 'Email: dr.siti@ummc.edu.my | Password: password123' as '';
SELECT '' as '';
