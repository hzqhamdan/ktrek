-- Role-Based Access Control Setup for iSCMS Admin Panel
-- Creates Superadmin and Healthcare Provider roles

USE iscms_db;

-- 1. Update admin_users table to support roles
ALTER TABLE admin_users 
MODIFY COLUMN role ENUM('Superadmin', 'Admin', 'Healthcare Provider', 'Support') DEFAULT 'Admin';

-- 2. Update current admin to Superadmin
UPDATE admin_users 
SET role = 'Superadmin' 
WHERE admin_id = 1;

-- You can also set by email if you know the admin email
-- UPDATE admin_users SET role = 'Superadmin' WHERE email = 'admin@iscms.com';

-- 3. Create permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role, permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Insert Superadmin permissions (full access)
INSERT INTO admin_permissions (role, permission_key, permission_name, description) VALUES
-- Dashboard & Analytics
('Superadmin', 'view_dashboard', 'View Dashboard', 'Access main dashboard with all statistics'),
('Superadmin', 'view_analytics', 'View Analytics', 'Access AI Analytics and Predictive Analytics'),

-- User Management
('Superadmin', 'view_users', 'View Users', 'View all users in the system'),
('Superadmin', 'manage_users', 'Manage Users', 'Create, edit, delete users'),
('Superadmin', 'export_users', 'Export Users', 'Export user data'),

-- Healthcare Provider Management
('Superadmin', 'view_providers', 'View Healthcare Providers', 'View all healthcare providers'),
('Superadmin', 'manage_providers', 'Manage Healthcare Providers', 'Register and manage healthcare providers'),
('Superadmin', 'verify_providers', 'Verify Healthcare Providers', 'Verify provider credentials'),

-- Device Management
('Superadmin', 'view_devices', 'View Devices', 'View all CGM and smart scale devices'),
('Superadmin', 'manage_devices', 'Manage Devices', 'Register and manage devices'),

-- Health Data
('Superadmin', 'view_health_data', 'View Health Data', 'View all patient health data'),
('Superadmin', 'manage_health_data', 'Manage Health Data', 'Edit and delete health data'),

-- Food Database
('Superadmin', 'view_food_database', 'View Food Database', 'View food database items'),
('Superadmin', 'manage_food_database', 'Manage Food Database', 'Add, edit, delete food items'),

-- Alerts & Notifications
('Superadmin', 'view_alerts', 'View Alerts', 'View all system alerts'),
('Superadmin', 'manage_alerts', 'Manage Alerts', 'Create and send notifications'),

-- Reports
('Superadmin', 'view_reports', 'View Reports', 'Generate and view reports'),
('Superadmin', 'daily_summary', 'Daily Summary', 'Access daily population summary'),

-- Content Management
('Superadmin', 'view_content', 'View Content', 'View health tips and articles'),
('Superadmin', 'manage_content', 'Manage Content', 'Create and edit content'),

-- System Settings
('Superadmin', 'view_settings', 'View Settings', 'View system settings'),
('Superadmin', 'manage_settings', 'Manage Settings', 'Modify system configuration'),
('Superadmin', 'view_security', 'View Security', 'View security logs and compliance'),
('Superadmin', 'manage_security', 'Manage Security', 'Manage security settings');

-- 5. Insert Healthcare Provider permissions (limited access)
INSERT INTO admin_permissions (role, permission_key, permission_name, description) VALUES
-- Dashboard (limited)
('Healthcare Provider', 'view_dashboard', 'View Dashboard', 'Access provider dashboard with patient statistics'),

-- User Management (view only linked patients)
('Healthcare Provider', 'view_linked_patients', 'View Linked Patients', 'View only patients linked to this provider'),
('Healthcare Provider', 'view_patient_profile', 'View Patient Profile', 'View detailed patient profiles'),

-- Health Data (view and monitor)
('Healthcare Provider', 'view_health_data', 'View Health Data', 'View patient health data (glucose, sugar intake)'),
('Healthcare Provider', 'monitor_glucose', 'Monitor Glucose Levels', 'Monitor real-time glucose readings'),
('Healthcare Provider', 'set_patient_limits', 'Set Patient Sugar Limits', 'Set and adjust patient sugar intake limits'),

-- Clinical Features
('Healthcare Provider', 'provide_recommendations', 'Provide Clinical Recommendations', 'Add educational clinical recommendations for patients'),
('Healthcare Provider', 'generate_reports', 'Generate Health Reports', 'Generate patient health reports'),

-- Alerts (receive only)
('Healthcare Provider', 'receive_alerts', 'Receive Patient Alerts', 'Receive real-time alerts for linked patients'),
('Healthcare Provider', 'view_alerts', 'View Patient Alerts', 'View alert history for linked patients'),

-- Food Database (view only)
('Healthcare Provider', 'view_food_database', 'View Food Database', 'View food database for reference'),

-- Reports (view patient-specific)
('Healthcare Provider', 'view_patient_reports', 'View Patient Reports', 'View reports for linked patients only');

-- 6. Create role descriptions table
CREATE TABLE IF NOT EXISTS admin_role_descriptions (
    role VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    dashboard_type ENUM('full', 'provider', 'support') DEFAULT 'full',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_role_descriptions (role, display_name, description, dashboard_type) VALUES
('Superadmin', 'Super Administrator', 'Full system access with all administrative privileges. Can manage users, providers, settings, and system configuration.', 'full'),
('Admin', 'Administrator', 'Standard administrative access. Can manage users, view reports, and handle day-to-day operations.', 'full'),
('Healthcare Provider', 'Healthcare Provider', 'Medical professionals who can monitor linked patients, view health data, set patient limits, provide clinical recommendations, and generate reports for educational purposes.', 'provider'),
('Support', 'Support Staff', 'Customer support access. Can view user issues and provide assistance.', 'support');

-- 7. Create admin activity log for role-based actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_role (role),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Create patient sugar limits table
CREATE TABLE IF NOT EXISTS patient_sugar_limits (
    limit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    daily_limit_g DECIMAL(6,2) NOT NULL DEFAULT 50.00,
    set_by_admin_id INT,
    set_by_provider_id INT,
    reason VARCHAR(255),
    effective_from DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (set_by_admin_id) REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    FOREIGN KEY (set_by_provider_id) REFERENCES healthcare_providers(provider_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_effective_from (effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Create clinical recommendations table
CREATE TABLE IF NOT EXISTS clinical_recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    recommendation_type ENUM('Diet', 'Exercise', 'Medication', 'Lifestyle', 'Monitoring', 'Other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    recommendation_text TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    is_educational TINYINT(1) DEFAULT 1 COMMENT 'For educational purposes',
    effective_date DATE,
    review_date DATE,
    patient_acknowledged TINYINT(1) DEFAULT 0,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(provider_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Verify setup
SELECT '========================================' as '';
SELECT 'ROLE-BASED ACCESS CONTROL SETUP COMPLETE' as '';
SELECT '========================================' as '';
SELECT '' as '';

SELECT 'Admin Roles:' as Info;
SELECT role, COUNT(*) as Count 
FROM admin_users 
GROUP BY role;

SELECT '' as '';

SELECT 'Superadmin Permissions:' as Info;
SELECT COUNT(*) as Total_Permissions 
FROM admin_permissions 
WHERE role = 'Superadmin';

SELECT '' as '';

SELECT 'Healthcare Provider Permissions:' as Info;
SELECT COUNT(*) as Total_Permissions 
FROM admin_permissions 
WHERE role = 'Healthcare Provider';

SELECT '' as '';

SELECT 'Role Descriptions:' as Info;
SELECT role, display_name, dashboard_type 
FROM admin_role_descriptions;

SELECT '' as '';
SELECT 'Next Steps:' as '';
SELECT '1. Current admin set to Superadmin' as Step;
SELECT '2. Run create_sample_provider_admins.sql to create Healthcare Provider accounts' as Step;
SELECT '3. Update authentication system to support roles' as Step;
SELECT '4. Implement role-based UI restrictions' as Step;
