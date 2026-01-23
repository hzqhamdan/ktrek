-- Predictive Analytics Schema
-- Tracks patterns, predictions, and recommendations for users

USE iscms_db;

-- User Health Patterns (detected patterns in user behavior)
CREATE TABLE IF NOT EXISTS user_health_patterns (
    pattern_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Pattern Information
    pattern_type ENUM('Sugar Spike', 'Low Glucose', 'Weight Gain', 'Weight Loss', 'Non-Compliance', 'Exercise Drop', 'Meal Skipping') NOT NULL,
    pattern_description TEXT,
    
    -- Pattern Detection
    detection_date DATE NOT NULL,
    frequency_count INT DEFAULT 1, -- How many times detected
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    
    -- Pattern Context
    time_of_day VARCHAR(50), -- Morning, Afternoon, Evening, Night
    trigger_factors JSON, -- What causes this pattern (e.g., specific foods, stress)
    
    -- Trend Analysis
    trend_direction ENUM('Improving', 'Stable', 'Worsening') DEFAULT 'Stable',
    first_detected_date DATE,
    last_detected_date DATE,
    
    -- Action Status
    recommendation_sent TINYINT(1) DEFAULT 0,
    user_acknowledged TINYINT(1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_type (pattern_type),
    INDEX idx_severity (severity),
    INDEX idx_trend (trend_direction),
    INDEX idx_detection_date (detection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Recommendations (personalized recommendations for users)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pattern_id INT,
    
    -- Recommendation Details
    recommendation_type ENUM('Dietary', 'Exercise', 'Medication', 'Monitoring', 'Lifestyle', 'Medical Consultation') NOT NULL,
    recommendation_title VARCHAR(255) NOT NULL,
    recommendation_text TEXT NOT NULL,
    
    -- Priority and Impact
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    expected_impact VARCHAR(255), -- e.g., "May reduce sugar spikes by 20%"
    
    -- Recommendation Status
    status ENUM('Pending', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Completed') DEFAULT 'Pending',
    sent_date DATETIME,
    viewed_date DATETIME,
    user_response_date DATETIME,
    
    -- Effectiveness Tracking
    effectiveness_rating INT, -- 1-5 stars from user
    actual_impact_observed TEXT,
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE,
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (pattern_id) REFERENCES user_health_patterns(pattern_id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_type (recommendation_type),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Health Predictions (predicted health outcomes)
CREATE TABLE IF NOT EXISTS health_predictions (
    prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Prediction Details
    prediction_type ENUM('Blood Sugar', 'Weight', 'HbA1c', 'Health Status', 'Risk Level') NOT NULL,
    prediction_timeframe ENUM('1 Week', '2 Weeks', '1 Month', '3 Months', '6 Months') NOT NULL,
    
    -- Predicted Values
    predicted_value DECIMAL(10,2),
    predicted_range_min DECIMAL(10,2),
    predicted_range_max DECIMAL(10,2),
    predicted_category VARCHAR(100), -- e.g., "Pre-diabetic", "High Risk"
    
    -- Confidence and Model
    confidence_score DECIMAL(5,2), -- 0-100%
    model_version VARCHAR(50),
    based_on_data JSON, -- What historical data was used
    
    -- Prediction Accuracy (after timeframe passes)
    actual_value DECIMAL(10,2),
    prediction_accuracy DECIMAL(5,2), -- How accurate was the prediction
    
    -- Dates
    prediction_date DATE NOT NULL,
    target_date DATE NOT NULL,
    verification_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_type (prediction_type),
    INDEX idx_target_date (target_date),
    INDEX idx_prediction_date (prediction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Risk Assessment History (track how user risk changes over time)
CREATE TABLE IF NOT EXISTS risk_assessment_history (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Assessment Details
    assessment_date DATE NOT NULL,
    overall_risk_score DECIMAL(5,2), -- 0-100
    risk_category ENUM('Low', 'Moderate', 'High', 'Very High', 'Critical') NOT NULL,
    
    -- Risk Factors
    glucose_risk_score DECIMAL(5,2),
    weight_risk_score DECIMAL(5,2),
    compliance_risk_score DECIMAL(5,2),
    lifestyle_risk_score DECIMAL(5,2),
    
    -- Risk Factors Details
    risk_factors JSON, -- List of contributing factors
    protective_factors JSON, -- Positive factors
    
    -- Trend
    risk_trend ENUM('Improving', 'Stable', 'Worsening') DEFAULT 'Stable',
    change_from_previous DECIMAL(5,2), -- +/- change in score
    
    -- Assessment Context
    assessment_notes TEXT,
    assessed_by VARCHAR(100), -- 'AI System' or admin name
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_date (assessment_date),
    INDEX idx_risk_category (risk_category),
    INDEX idx_trend (risk_trend)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Predictive Analytics schema created successfully!' as Status;
