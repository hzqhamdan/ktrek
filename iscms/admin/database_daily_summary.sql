-- Daily Population Summary Schema
-- Tracks daily digest, compliance metrics, and population health trends

USE iscms_db;

-- Daily Population Summary (aggregated daily statistics)
CREATE TABLE IF NOT EXISTS daily_population_summary (
    summary_id INT AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE NOT NULL UNIQUE,
    
    -- User Statistics
    total_active_users INT DEFAULT 0,
    new_registrations_today INT DEFAULT 0,
    users_logged_in_today INT DEFAULT 0,
    inactive_users INT DEFAULT 0,
    
    -- Health Compliance
    users_within_sugar_limit INT DEFAULT 0,
    users_exceeded_sugar_limit INT DEFAULT 0,
    overall_compliance_rate DECIMAL(5,2), -- Percentage
    avg_sugar_intake_g DECIMAL(8,2),
    
    -- Glucose Monitoring
    total_glucose_readings INT DEFAULT 0,
    users_with_high_glucose INT DEFAULT 0,
    users_with_low_glucose INT DEFAULT 0,
    avg_glucose_level DECIMAL(6,2),
    
    -- Device Activity
    active_cgm_devices INT DEFAULT 0,
    active_smart_scales INT DEFAULT 0,
    devices_needing_attention INT DEFAULT 0,
    
    -- Food Recognition
    total_food_entries INT DEFAULT 0,
    ai_recognized_foods INT DEFAULT 0,
    manual_entries INT DEFAULT 0,
    barcode_scans INT DEFAULT 0,
    
    -- Alert Statistics
    total_alerts_generated INT DEFAULT 0,
    critical_alerts INT DEFAULT 0,
    warnings_sent INT DEFAULT 0,
    
    -- Health Status Distribution
    healthy_count INT DEFAULT 0,
    prediabetic_count INT DEFAULT 0,
    type1_diabetes_count INT DEFAULT 0,
    type2_diabetes_count INT DEFAULT 0,
    
    -- System Performance
    avg_ai_response_time_ms INT,
    system_uptime_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (summary_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compliance Triggers (what caused compliance violations)
CREATE TABLE IF NOT EXISTS compliance_triggers (
    trigger_id INT AUTO_INCREMENT PRIMARY KEY,
    trigger_date DATE NOT NULL,
    user_id INT NOT NULL,
    
    -- Trigger Details
    trigger_type ENUM('Sugar Exceeded', 'Meal Skipped', 'No Reading', 'High Glucose', 'Low Glucose', 'Device Offline') NOT NULL,
    trigger_value DECIMAL(10,2), -- The actual value that triggered
    threshold_value DECIMAL(10,2), -- The threshold that was exceeded
    
    -- Context
    time_of_day VARCHAR(50),
    meal_type VARCHAR(50),
    trigger_description TEXT,
    
    -- Resolution
    is_resolved TINYINT(1) DEFAULT 0,
    resolved_datetime DATETIME,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_date (trigger_date),
    INDEX idx_user (user_id),
    INDEX idx_type (trigger_type),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hourly Activity Snapshot (activity distribution throughout the day)
CREATE TABLE IF NOT EXISTS hourly_activity_snapshot (
    snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    hour_of_day INT NOT NULL, -- 0-23
    
    -- Activity Counts
    food_entries_count INT DEFAULT 0,
    glucose_readings_count INT DEFAULT 0,
    weight_logs_count INT DEFAULT 0,
    active_users_count INT DEFAULT 0,
    
    -- Peak Activity Indicators
    is_peak_hour TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_snapshot (snapshot_date, hour_of_day),
    INDEX idx_date (snapshot_date),
    INDEX idx_hour (hour_of_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily Goals Achievement (track population goal completion)
CREATE TABLE IF NOT EXISTS daily_goals_achievement (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    achievement_date DATE NOT NULL,
    
    -- Goal Metrics
    users_met_sugar_goal INT DEFAULT 0,
    users_met_weight_goal INT DEFAULT 0,
    users_met_exercise_goal INT DEFAULT 0,
    users_logged_meals INT DEFAULT 0,
    users_logged_glucose INT DEFAULT 0,
    
    -- Achievement Rates
    sugar_goal_rate DECIMAL(5,2),
    weight_goal_rate DECIMAL(5,2),
    exercise_goal_rate DECIMAL(5,2),
    
    -- Streaks
    users_with_7day_streak INT DEFAULT 0,
    users_with_30day_streak INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (achievement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Daily Population Summary schema created successfully!' as Status;
