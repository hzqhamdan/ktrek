-- iSCMS Database Schema - Part 2
-- Food Database, Alerts, Notifications, and Content Management

USE iscms_db;

-- ============================================
-- FOOD DATABASE TABLES
-- ============================================

-- Master food database
CREATE TABLE IF NOT EXISTS food_database (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    food_name VARCHAR(255) NOT NULL,
    food_name_malay VARCHAR(255),
    category ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Dessert', 'Fast Food', 'Local Malaysian') NOT NULL,
    subcategory VARCHAR(100),
    
    -- Nutritional information per 100g
    sugar_per_100g DECIMAL(6,2),
    calories_per_100g INT,
    carbs_per_100g DECIMAL(6,2),
    protein_per_100g DECIMAL(6,2),
    fat_per_100g DECIMAL(6,2),
    fiber_per_100g DECIMAL(6,2),
    
    -- Serving information
    typical_serving_size VARCHAR(100),
    typical_serving_grams DECIMAL(6,2),
    
    -- Recognition data
    barcode VARCHAR(100),
    brand_name VARCHAR(255),
    image_url VARCHAR(500),
    
    -- Malaysian food specific
    is_malaysian_food TINYINT(1) DEFAULT 0,
    regional_variant VARCHAR(100),
    hawker_stall_common TINYINT(1) DEFAULT 0,
    
    -- Status
    is_verified TINYINT(1) DEFAULT 0,
    verified_by INT,
    needs_review TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    
    -- Tracking
    scan_count INT DEFAULT 0,
    photo_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_food_name (food_name),
    INDEX idx_category (category),
    INDEX idx_barcode (barcode),
    INDEX idx_malaysian (is_malaysian_food),
    FULLTEXT idx_food_search (food_name, food_name_malay, brand_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-reported food items (pending review)
CREATE TABLE IF NOT EXISTS user_reported_foods (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    estimated_sugar_g DECIMAL(6,2),
    photo_url VARCHAR(500),
    description TEXT,
    status ENUM('Pending', 'Approved', 'Rejected', 'Needs Info') DEFAULT 'Pending',
    reviewed_by INT,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ALERT & NOTIFICATION TABLES
-- ============================================

-- Alert configuration (system-wide defaults)
CREATE TABLE IF NOT EXISTS alert_configurations (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL,
    health_status ENUM('Healthy', 'Pre-diabetic', 'Type 1 Diabetes', 'Type 2 Diabetes', 'Gestational Diabetes'),
    
    -- Thresholds
    threshold_80_percent TINYINT(1) DEFAULT 1,
    threshold_100_percent TINYINT(1) DEFAULT 1,
    threshold_120_percent TINYINT(1) DEFAULT 1,
    
    -- Alert messages
    message_80_percent TEXT,
    message_100_percent TEXT,
    message_120_percent TEXT,
    
    -- Channels
    send_push TINYINT(1) DEFAULT 1,
    send_email TINYINT(1) DEFAULT 0,
    send_sms TINYINT(1) DEFAULT 0,
    
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-specific alerts
CREATE TABLE IF NOT EXISTS user_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alert_type ENUM('Sugar Limit Warning', 'Sugar Limit Exceeded', 'Glucose High', 'Glucose Low', 'Glucose Critical', 'Device Disconnected', 'Goal Achievement', 'Health Tip') NOT NULL,
    severity ENUM('Info', 'Warning', 'Critical') DEFAULT 'Warning',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_datetime DATETIME NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    read_at DATETIME,
    action_taken TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_datetime (user_id, alert_datetime),
    INDEX idx_type (alert_type),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_type ENUM('Push', 'Email', 'SMS', 'In-App') NOT NULL,
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    variables JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification history
CREATE TABLE IF NOT EXISTS notification_history (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    notification_type ENUM('Broadcast', 'Targeted', 'Individual') NOT NULL,
    channel ENUM('Push', 'Email', 'SMS', 'In-App') NOT NULL,
    recipient_segment VARCHAR(100),
    title VARCHAR(255),
    message TEXT NOT NULL,
    sent_datetime DATETIME NOT NULL,
    delivery_status ENUM('Sent', 'Delivered', 'Failed', 'Opened', 'Clicked') DEFAULT 'Sent',
    opened_at DATETIME,
    clicked_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_sent_datetime (sent_datetime),
    INDEX idx_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- High-risk user tracking
CREATE TABLE IF NOT EXISTS high_risk_users (
    risk_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    risk_level ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    risk_factors JSON,
    consecutive_violations INT DEFAULT 0,
    last_violation_date DATE,
    flagged_date DATE NOT NULL,
    provider_notified TINYINT(1) DEFAULT 0,
    intervention_needed TINYINT(1) DEFAULT 0,
    notes TEXT,
    is_resolved TINYINT(1) DEFAULT 0,
    resolved_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_risk_level (risk_level),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONTENT MANAGEMENT TABLES
-- ============================================

-- Health tips
CREATE TABLE IF NOT EXISTS health_tips (
    tip_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_malay VARCHAR(255),
    content TEXT NOT NULL,
    content_malay TEXT,
    category ENUM('Nutrition', 'Exercise', 'Diabetes Management', 'Mental Health', 'General Health') NOT NULL,
    target_audience ENUM('All', 'Pre-diabetic', 'Diabetic', 'Healthy') DEFAULT 'All',
    image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_featured TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    view_count INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_target (target_audience),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe database (low-sugar alternatives)
CREATE TABLE IF NOT EXISTS recipes (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_name VARCHAR(255) NOT NULL,
    recipe_name_malay VARCHAR(255),
    description TEXT,
    description_malay TEXT,
    category ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage') NOT NULL,
    prep_time_minutes INT,
    cook_time_minutes INT,
    servings INT,
    
    -- Nutritional info per serving
    sugar_per_serving DECIMAL(6,2),
    calories_per_serving INT,
    carbs_per_serving DECIMAL(6,2),
    
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    
    is_malaysian TINYINT(1) DEFAULT 0,
    difficulty_level ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    is_featured TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Educational articles
CREATE TABLE IF NOT EXISTS articles (
    article_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_malay VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    summary TEXT,
    content LONGTEXT NOT NULL,
    content_malay LONGTEXT,
    category ENUM('Diabetes Education', 'Nutrition', 'Lifestyle', 'Research', 'Success Stories') NOT NULL,
    author_name VARCHAR(255),
    featured_image VARCHAR(500),
    reading_time_minutes INT,
    is_published TINYINT(1) DEFAULT 0,
    published_date DATETIME,
    view_count INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_category (category),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ management
CREATE TABLE IF NOT EXISTS faqs (
    faq_id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    question_malay VARCHAR(500),
    answer TEXT NOT NULL,
    answer_malay TEXT,
    category ENUM('General', 'Technical', 'Health', 'Account', 'Billing', 'Privacy') NOT NULL,
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- In-app announcements
CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Info', 'Warning', 'Update', 'Promotion') DEFAULT 'Info',
    target_audience ENUM('All', 'Premium', 'Free', 'High Risk') DEFAULT 'All',
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    is_active TINYINT(1) DEFAULT 1,
    image_url VARCHAR(500),
    action_url VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
