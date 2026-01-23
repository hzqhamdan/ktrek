-- iSCMS Database Schema - Part 3
-- Reports, Support, Financial, Security & System Tables

USE iscms_db;

-- ============================================
-- SUPPORT & FEEDBACK TABLES
-- ============================================

-- User feedback
CREATE TABLE IF NOT EXISTS user_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    feedback_type ENUM('Bug Report', 'Feature Request', 'Complaint', 'Compliment', 'General') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('New', 'In Review', 'In Progress', 'Resolved', 'Closed') DEFAULT 'New',
    assigned_to INT,
    response TEXT,
    resolution_notes TEXT,
    sentiment ENUM('Positive', 'Neutral', 'Negative'),
    submitted_at DATETIME NOT NULL,
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_type (feedback_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Technical', 'Account', 'Billing', 'Health Data', 'General') NOT NULL,
    priority ENUM('Low', 'Normal', 'High', 'Urgent') DEFAULT 'Normal',
    status ENUM('Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed') DEFAULT 'Open',
    assigned_to INT,
    response_time_minutes INT,
    resolution_time_hours DECIMAL(10,2),
    customer_satisfaction INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support ticket messages
CREATE TABLE IF NOT EXISTS ticket_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    sender_type ENUM('User', 'Support', 'System') NOT NULL,
    sender_id INT,
    message TEXT NOT NULL,
    attachments JSON,
    is_internal_note TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FINANCIAL TABLES
-- ============================================

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_type ENUM('Free', 'Basic', 'Premium', 'Premium Plus') DEFAULT 'Free',
    status ENUM('Active', 'Cancelled', 'Expired', 'Suspended') DEFAULT 'Active',
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew TINYINT(1) DEFAULT 1,
    payment_method ENUM('Credit Card', 'Debit Card', 'E-Wallet', 'Bank Transfer', 'Subsidy') DEFAULT 'Credit Card',
    amount_paid DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'MYR',
    billing_cycle ENUM('Monthly', 'Quarterly', 'Yearly') DEFAULT 'Monthly',
    next_billing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment history
CREATE TABLE IF NOT EXISTS payment_history (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT,
    transaction_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MYR',
    payment_method ENUM('Credit Card', 'Debit Card', 'E-Wallet', 'Bank Transfer', 'Subsidy') NOT NULL,
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_date DATETIME NOT NULL,
    refund_amount DECIMAL(10,2),
    refund_date DATETIME,
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Government subsidies & vouchers
CREATE TABLE IF NOT EXISTS subsidies (
    subsidy_id INT AUTO_INCREMENT PRIMARY KEY,
    subsidy_code VARCHAR(50) UNIQUE NOT NULL,
    subsidy_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    eligibility_criteria JSON,
    total_allocation INT,
    used_count INT DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (subsidy_code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Voucher redemptions
CREATE TABLE IF NOT EXISTS voucher_redemptions (
    redemption_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subsidy_id INT NOT NULL,
    voucher_code VARCHAR(100) UNIQUE NOT NULL,
    redemption_date DATETIME NOT NULL,
    amount_credited DECIMAL(10,2) NOT NULL,
    verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subsidy_id) REFERENCES subsidies(subsidy_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_voucher (voucher_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REPORTS & ANALYTICS TABLES
-- ============================================

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type ENUM('Population Health', 'System Performance', 'Policy Report', 'Financial', 'Custom') NOT NULL,
    frequency ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly') NOT NULL,
    recipients JSON,
    format ENUM('PDF', 'Excel', 'CSV', 'JSON') DEFAULT 'PDF',
    parameters JSON,
    last_run DATETIME,
    next_run DATETIME,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_next_run (next_run),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report history
CREATE TABLE IF NOT EXISTS report_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT,
    report_name VARCHAR(255) NOT NULL,
    generated_by INT,
    generated_at DATETIME NOT NULL,
    file_path VARCHAR(500),
    file_size_kb INT,
    parameters JSON,
    execution_time_seconds DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECURITY & COMPLIANCE TABLES
-- ============================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('Admin', 'User', 'Provider', 'System') NOT NULL,
    user_id INT,
    action_type ENUM('Login', 'Logout', 'Create', 'Update', 'Delete', 'View', 'Export', 'Import') NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    action_description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_type_id (user_type, user_id),
    INDEX idx_action (action_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User consent tracking
CREATE TABLE IF NOT EXISTS user_consents (
    consent_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    consent_type ENUM('Data Collection', 'Data Sharing', 'Research', 'Marketing', 'Third Party') NOT NULL,
    consent_given TINYINT(1) NOT NULL,
    consent_date DATETIME NOT NULL,
    consent_version VARCHAR(20),
    ip_address VARCHAR(45),
    withdrawn_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (consent_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data deletion requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    request_date DATETIME NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    processed_by INT,
    processed_date DATETIME,
    verification_code VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    incident_type ENUM('Failed Login', 'Suspicious Activity', 'Data Breach Attempt', 'API Abuse', 'Other') NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_id INT,
    detected_at DATETIME NOT NULL,
    status ENUM('New', 'Investigating', 'Resolved', 'False Positive') DEFAULT 'New',
    action_taken TEXT,
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (incident_type),
    INDEX idx_severity (severity),
    INDEX idx_detected (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Database backups
CREATE TABLE IF NOT EXISTS database_backups (
    backup_id INT AUTO_INCREMENT PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_type ENUM('Full', 'Incremental', 'Differential') DEFAULT 'Full',
    file_path VARCHAR(500),
    file_size_mb DECIMAL(10,2),
    backup_status ENUM('In Progress', 'Completed', 'Failed') DEFAULT 'Completed',
    backup_start DATETIME NOT NULL,
    backup_end DATETIME,
    created_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_backup_start (backup_start),
    INDEX idx_status (backup_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM CONFIGURATION TABLES
-- ============================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('String', 'Number', 'Boolean', 'JSON') DEFAULT 'String',
    category ENUM('General', 'Alerts', 'AI', 'Integrations', 'Security', 'Limits') NOT NULL,
    description TEXT,
    is_editable TINYINT(1) DEFAULT 1,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI model versions
CREATE TABLE IF NOT EXISTS ai_models (
    model_id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_type ENUM('Food Recognition', 'Sugar Estimation', 'Risk Prediction') NOT NULL,
    version VARCHAR(50) NOT NULL,
    accuracy_rate DECIMAL(5,2),
    file_path VARCHAR(500),
    status ENUM('Development', 'Testing', 'Production', 'Deprecated') DEFAULT 'Testing',
    deployment_date DATETIME,
    performance_metrics JSON,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (model_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API integrations
CREATE TABLE IF NOT EXISTS api_integrations (
    integration_id INT AUTO_INCREMENT PRIMARY KEY,
    integration_name VARCHAR(255) NOT NULL,
    integration_type ENUM('CGM Device', 'Smart Scale', 'Healthcare System', 'Payment Gateway', 'Analytics', 'Other') NOT NULL,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    status ENUM('Active', 'Inactive', 'Testing', 'Error') DEFAULT 'Inactive',
    last_sync DATETIME,
    sync_frequency_minutes INT,
    configuration JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (integration_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System monitoring
CREATE TABLE IF NOT EXISTS system_monitoring (
    monitor_id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_type ENUM('CPU', 'Memory', 'Disk', 'API Response', 'Database', 'Active Users', 'Error Rate') NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    threshold_warning DECIMAL(10,2),
    threshold_critical DECIMAL(10,2),
    status ENUM('Normal', 'Warning', 'Critical') DEFAULT 'Normal',
    recorded_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric (metric_name),
    INDEX idx_recorded (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RESEARCH & ANALYTICS TABLES
-- ============================================

-- A/B Testing experiments
CREATE TABLE IF NOT EXISTS ab_tests (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    test_type ENUM('Alert Strategy', 'UI/UX', 'Feature', 'Notification Timing') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('Draft', 'Active', 'Completed', 'Cancelled') DEFAULT 'Draft',
    control_group_size INT,
    test_group_size INT,
    results JSON,
    winner VARCHAR(50),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Research data access
CREATE TABLE IF NOT EXISTS research_access (
    access_id INT AUTO_INCREMENT PRIMARY KEY,
    researcher_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    project_title VARCHAR(500) NOT NULL,
    irb_approval_number VARCHAR(100),
    access_level ENUM('Aggregated', 'Anonymized', 'Limited') DEFAULT 'Aggregated',
    data_fields JSON,
    access_granted TINYINT(1) DEFAULT 0,
    granted_by INT,
    granted_date DATE,
    expiry_date DATE,
    publications JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_granted (access_granted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
