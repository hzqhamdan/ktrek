-- AI Model Performance Tracking Schema
-- Tracks food recognition accuracy, corrections, and performance metrics

USE iscms_db;

-- AI Recognition Logs (tracks every AI recognition attempt)
CREATE TABLE IF NOT EXISTS ai_recognition_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_entry_id INT,
    image_url TEXT,
    recognition_datetime DATETIME NOT NULL,
    processing_time_ms INT,
    model_version VARCHAR(50),
    
    -- AI Results
    detected_food_name VARCHAR(255),
    confidence_score DECIMAL(5,2), -- 0.00 to 100.00
    alternative_results JSON, -- Top 5 alternatives with confidence
    
    -- User Feedback
    user_accepted TINYINT(1) DEFAULT NULL, -- NULL = pending, 0 = rejected, 1 = accepted
    user_corrected_name VARCHAR(255),
    correction_datetime DATETIME,
    
    -- Status
    recognition_status ENUM('Success', 'Low Confidence', 'Failed', 'Corrected') DEFAULT 'Success',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (food_entry_id) REFERENCES food_entries(entry_id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_datetime (recognition_datetime),
    INDEX idx_status (recognition_status),
    INDEX idx_confidence (confidence_score),
    INDEX idx_model (model_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Unrecognized Items Queue (items that need manual review)
CREATE TABLE IF NOT EXISTS unrecognized_items_queue (
    queue_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_id INT,
    image_url TEXT NOT NULL,
    upload_datetime DATETIME NOT NULL,
    
    -- AI attempted results
    ai_suggestion VARCHAR(255),
    ai_confidence DECIMAL(5,2),
    
    -- Admin review
    reviewed TINYINT(1) DEFAULT 0,
    reviewed_by INT,
    review_datetime DATETIME,
    correct_food_name VARCHAR(255),
    added_to_database TINYINT(1) DEFAULT 0,
    
    -- Priority
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    frequency_count INT DEFAULT 1, -- How many times this item appeared
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (log_id) REFERENCES ai_recognition_logs(log_id) ON DELETE SET NULL,
    
    INDEX idx_reviewed (reviewed),
    INDEX idx_priority (priority),
    INDEX idx_datetime (upload_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Model Performance Metrics (aggregated daily statistics)
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    
    -- Recognition Statistics
    total_recognitions INT DEFAULT 0,
    successful_recognitions INT DEFAULT 0,
    failed_recognitions INT DEFAULT 0,
    low_confidence_recognitions INT DEFAULT 0,
    
    -- User Feedback Statistics
    user_accepted_count INT DEFAULT 0,
    user_corrected_count INT DEFAULT 0,
    pending_feedback_count INT DEFAULT 0,
    
    -- Accuracy Metrics
    accuracy_rate DECIMAL(5,2), -- % of accepted recognitions
    avg_confidence_score DECIMAL(5,2),
    avg_processing_time_ms INT,
    
    -- Performance by category
    malaysian_food_accuracy DECIMAL(5,2),
    western_food_accuracy DECIMAL(5,2),
    beverages_accuracy DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_date_version (metric_date, model_version),
    INDEX idx_date (metric_date),
    INDEX idx_version (model_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Model Training Feedback (items marked for model improvement)
CREATE TABLE IF NOT EXISTS model_training_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    log_id INT,
    user_id INT NOT NULL,
    
    -- Original vs Corrected
    ai_detected_name VARCHAR(255),
    correct_food_name VARCHAR(255) NOT NULL,
    
    -- Context
    image_url TEXT,
    correction_reason ENUM('Wrong Food', 'Wrong Portion', 'Similar Item', 'Not Food', 'Other'),
    user_notes TEXT,
    
    -- Training status
    added_to_training_set TINYINT(1) DEFAULT 0,
    training_priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (log_id) REFERENCES ai_recognition_logs(log_id) ON DELETE SET NULL,
    
    INDEX idx_training_status (added_to_training_set),
    INDEX idx_priority (training_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ AI Performance tracking schema created successfully!' as Status;
