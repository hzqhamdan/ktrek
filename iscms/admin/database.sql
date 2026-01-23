-- iSCMS Database Schema
-- Sugar Intake Monitoring System for Diabetes Prevention

-- Create database
CREATE DATABASE IF NOT EXISTS iscms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iscms_db;

-- ============================================
-- ADMIN & AUTHENTICATION TABLES
-- ============================================

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('Superadmin', 'Admin', 'Support', 'Healthcare Provider') DEFAULT 'Admin',
    avatar_url VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

-- Main users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    age INT,
    gender ENUM('Male', 'Female', 'Other'),
    
    -- Health information
    health_status ENUM('Healthy', 'Pre-diabetic', 'Type 1 Diabetes', 'Type 2 Diabetes', 'Gestational Diabetes') DEFAULT 'Healthy',
    height_cm DECIMAL(5,2),
    current_weight_kg DECIMAL(5,2),
    target_weight_kg DECIMAL(5,2),
    bmi DECIMAL(5,2),
    
    -- Daily limits
    daily_sugar_limit_g DECIMAL(6,2) DEFAULT 50.00,
    daily_calorie_limit INT DEFAULT 2000,
    
    -- Location
    state VARCHAR(100),
    city VARCHAR(100),
    
    -- Account status
    is_active TINYINT(1) DEFAULT 1,
    is_premium TINYINT(1) DEFAULT 0,
    premium_until DATE,
    device_type ENUM('iOS', 'Android', 'Web') DEFAULT 'Android',
    app_version VARCHAR(20),
    
    -- Timestamps
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone_number),
    INDEX idx_health_status (health_status),
    INDEX idx_state (state),
    INDEX idx_registration_date (registration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Healthcare providers table
CREATE TABLE IF NOT EXISTS healthcare_providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    specialization VARCHAR(100),
    hospital_clinic VARCHAR(255),
    phone_number VARCHAR(20),
    is_verified TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    verification_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_license (license_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patient-provider relationships
CREATE TABLE IF NOT EXISTS patient_provider_links (
    link_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    consent_given TINYINT(1) DEFAULT 0,
    consent_date DATETIME,
    access_level ENUM('Full', 'Limited', 'View Only') DEFAULT 'Limited',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(provider_id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_provider (user_id, provider_id),
    INDEX idx_user (user_id),
    INDEX idx_provider (provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- HEALTH DATA TABLES
-- ============================================

-- Daily sugar intake records
CREATE TABLE IF NOT EXISTS sugar_intake_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    total_sugar_g DECIMAL(8,2) DEFAULT 0,
    meal_count INT DEFAULT 0,
    snack_count INT DEFAULT 0,
    beverage_count INT DEFAULT 0,
    limit_exceeded TINYINT(1) DEFAULT 0,
    compliance_status ENUM('Within Limit', 'Near Limit', 'Exceeded', 'Significantly Exceeded') DEFAULT 'Within Limit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, log_date),
    INDEX idx_user_date (user_id, log_date),
    INDEX idx_compliance (compliance_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual food entries
CREATE TABLE IF NOT EXISTS food_entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_item_id INT,
    entry_datetime DATETIME NOT NULL,
    meal_type ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage') NOT NULL,
    
    -- Food details
    food_name VARCHAR(255) NOT NULL,
    portion_size VARCHAR(100),
    sugar_content_g DECIMAL(6,2),
    calories INT,
    carbs_g DECIMAL(6,2),
    protein_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    
    -- Recognition method
    recognition_method ENUM('Barcode Scan', 'Photo Recognition', 'Manual Entry', 'Voice Input') DEFAULT 'Manual Entry',
    photo_url VARCHAR(500),
    ai_confidence DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_datetime (user_id, entry_datetime),
    INDEX idx_meal_type (meal_type),
    INDEX idx_recognition_method (recognition_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Glucose level readings (from CGM devices)
CREATE TABLE IF NOT EXISTS glucose_readings (
    reading_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reading_datetime DATETIME NOT NULL,
    glucose_level DECIMAL(5,2) NOT NULL,
    unit ENUM('mg/dL', 'mmol/L') DEFAULT 'mg/dL',
    reading_type ENUM('CGM', 'Manual', 'Lab Test') DEFAULT 'CGM',
    status ENUM('Low', 'Normal', 'High', 'Critical') DEFAULT 'Normal',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_datetime (user_id, reading_datetime),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weight tracking
CREATE TABLE IF NOT EXISTS weight_logs (
    weight_log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    bmi DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    source ENUM('Smart Scale', 'Manual Entry', 'Healthcare Provider') DEFAULT 'Manual Entry',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, log_date),
    INDEX idx_user_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CGM device connections
CREATE TABLE IF NOT EXISTS cgm_devices (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_name VARCHAR(255),
    device_model VARCHAR(100),
    serial_number VARCHAR(100),
    connection_status ENUM('Connected', 'Disconnected', 'Syncing', 'Error') DEFAULT 'Disconnected',
    last_sync DATETIME,
    battery_level INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (connection_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
