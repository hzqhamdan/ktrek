-- Sample Users Data for iSCMS Testing
-- Creates 10 test users with various health statuses

USE iscms_db;

-- Insert sample users
INSERT INTO users (
    full_name, email, phone_number, password_hash, date_of_birth, age, gender,
    health_status, height_cm, current_weight_kg, target_weight_kg, bmi,
    daily_sugar_limit_g, daily_calorie_limit, state, city,
    is_active, is_premium, premium_until, device_type, app_version,
    registration_date, last_active
) VALUES
-- User 1: Healthy user
('Ahmad bin Abdullah', 'ahmad.abdullah@email.com', '+60123456789', '$2y$10$dummy.hash.1', '1990-05-15', 33, 'Male',
 'Healthy', 175, 72, 70, 23.5, 50, 2000, 'Kuala Lumpur', 'Kuala Lumpur',
 1, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), 'Android', '2.1.0',
 DATE_SUB(NOW(), INTERVAL 180 DAY), NOW() - INTERVAL 2 HOUR),

-- User 2: Pre-diabetic user
('Siti Nurhaliza', 'siti.nurhaliza@email.com', '+60123456790', '$2y$10$dummy.hash.2', '1985-08-20', 38, 'Female',
 'Pre-diabetic', 160, 68, 60, 26.6, 40, 1800, 'Selangor', 'Petaling Jaya',
 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 'iOS', '2.0.5',
 DATE_SUB(NOW(), INTERVAL 150 DAY), NOW() - INTERVAL 1 HOUR),

-- User 3: Type 2 Diabetes
('Tan Wei Ming', 'tan.weiming@email.com', '+60123456791', '$2y$10$dummy.hash.3', '1978-03-10', 45, 'Male',
 'Type 2 Diabetes', 170, 85, 75, 29.4, 35, 1600, 'Penang', 'Georgetown',
 1, 0, NULL, 'Android', '1.9.2',
 DATE_SUB(NOW(), INTERVAL 200 DAY), NOW() - INTERVAL 30 MINUTE),

-- User 4: Type 1 Diabetes
('Nurul Aisyah', 'nurul.aisyah@email.com', '+60123456792', '$2y$10$dummy.hash.4', '1995-11-25', 28, 'Female',
 'Type 1 Diabetes', 165, 58, 58, 21.3, 45, 1900, 'Johor', 'Johor Bahru',
 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 'iOS', '2.1.0',
 DATE_SUB(NOW(), INTERVAL 120 DAY), NOW() - INTERVAL 15 MINUTE),

-- User 5: Healthy user
('Rajesh Kumar', 'rajesh.kumar@email.com', '+60123456793', '$2y$10$dummy.hash.5', '1988-07-08', 35, 'Male',
 'Healthy', 178, 78, 75, 24.6, 50, 2100, 'Selangor', 'Shah Alam',
 1, 0, NULL, 'Android', '2.0.8',
 DATE_SUB(NOW(), INTERVAL 90 DAY), NOW() - INTERVAL 3 HOUR),

-- User 6: Pre-diabetic user
('Lim Mei Ling', 'lim.meiling@email.com', '+60123456794', '$2y$10$dummy.hash.6', '1992-12-12', 31, 'Female',
 'Pre-diabetic', 158, 72, 62, 28.8, 40, 1700, 'Kuala Lumpur', 'Cheras',
 1, 1, DATE_ADD(NOW(), INTERVAL 120 DAY), 'iOS', '2.1.0',
 DATE_SUB(NOW(), INTERVAL 60 DAY), NOW() - INTERVAL 45 MINUTE),

-- User 7: Type 2 Diabetes
('Muhammad Faizal', 'muhammad.faizal@email.com', '+60123456795', '$2y$10$dummy.hash.7', '1980-02-28', 43, 'Male',
 'Type 2 Diabetes', 172, 90, 78, 30.4, 30, 1500, 'Perak', 'Ipoh',
 1, 0, NULL, 'Android', '1.8.5',
 DATE_SUB(NOW(), INTERVAL 250 DAY), NOW() - INTERVAL 4 HOUR),

-- User 8: Healthy user
('Kavitha Devi', 'kavitha.devi@email.com', '+60123456796', '$2y$10$dummy.hash.8', '1993-09-05', 30, 'Female',
 'Healthy', 162, 55, 55, 20.9, 50, 1800, 'Selangor', 'Subang Jaya',
 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 'iOS', '2.0.9',
 DATE_SUB(NOW(), INTERVAL 45 DAY), NOW() - INTERVAL 20 MINUTE),

-- User 9: Pre-diabetic user
('Wong Chee Keong', 'wong.cheekeong@email.com', '+60123456797', '$2y$10$dummy.hash.9', '1987-04-18', 36, 'Male',
 'Pre-diabetic', 168, 82, 72, 29.0, 38, 1650, 'Melaka', 'Melaka City',
 1, 0, NULL, 'Android', '2.0.3',
 DATE_SUB(NOW(), INTERVAL 100 DAY), NOW() - INTERVAL 6 HOUR),

-- User 10: Type 2 Diabetes
('Fatimah Zahra', 'fatimah.zahra@email.com', '+60123456798', '$2y$10$dummy.hash.10', '1975-06-30', 48, 'Female',
 'Type 2 Diabetes', 155, 75, 65, 31.2, 32, 1550, 'Kedah', 'Alor Setar',
 1, 1, DATE_ADD(NOW(), INTERVAL 75 DAY), 'iOS', '1.9.8',
 DATE_SUB(NOW(), INTERVAL 300 DAY), NOW() - INTERVAL 1 HOUR)

ON DUPLICATE KEY UPDATE 
    last_active = VALUES(last_active);

SELECT '✅ Sample users created successfully!' as Status;
SELECT user_id, full_name, email, health_status FROM users ORDER BY user_id DESC LIMIT 10;
