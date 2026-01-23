-- iSCMS Device Management Enhancement
-- Adding Smart Scale devices and sensor expiry tracking

USE iscms_db;

-- Smart Scale devices table
CREATE TABLE IF NOT EXISTS smart_scale_devices (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_name VARCHAR(255),
    device_model VARCHAR(100),
    serial_number VARCHAR(100),
    connection_status ENUM('Connected', 'Disconnected', 'Syncing', 'Error') DEFAULT 'Disconnected',
    last_sync DATETIME,
    battery_level INT,
    firmware_version VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (connection_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CGM Sensor tracking (for sensor expiry management)
CREATE TABLE IF NOT EXISTS cgm_sensors (
    sensor_id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    user_id INT NOT NULL,
    sensor_serial VARCHAR(100),
    installation_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    sensor_status ENUM('Active', 'Expiring Soon', 'Expired', 'Removed') DEFAULT 'Active',
    removal_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES cgm_devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_device (device_id),
    INDEX idx_expiry (expiry_date),
    INDEX idx_status (sensor_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device sync history (for monitoring data flow)
CREATE TABLE IF NOT EXISTS device_sync_history (
    sync_id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    device_type ENUM('CGM', 'Smart Scale') NOT NULL,
    user_id INT NOT NULL,
    sync_datetime DATETIME NOT NULL,
    sync_status ENUM('Success', 'Failed', 'Partial') DEFAULT 'Success',
    records_synced INT DEFAULT 0,
    error_message TEXT,
    sync_duration_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_device (device_id, device_type),
    INDEX idx_sync_datetime (sync_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device alerts (battery low, disconnection, sensor expiry)
CREATE TABLE IF NOT EXISTS device_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    device_type ENUM('CGM', 'Smart Scale') NOT NULL,
    alert_type ENUM('Battery Low', 'Disconnected', 'Sensor Expiring', 'Sensor Expired', 'Sync Failed', 'Data Gap') NOT NULL,
    severity ENUM('Info', 'Warning', 'Critical') DEFAULT 'Warning',
    message TEXT NOT NULL,
    alert_datetime DATETIME NOT NULL,
    is_resolved TINYINT(1) DEFAULT 0,
    resolved_at DATETIME,
    admin_notified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_device (device_id, device_type),
    INDEX idx_type (alert_type),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add firmware_version to existing cgm_devices if not exists
ALTER TABLE cgm_devices ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(50) AFTER battery_level;

-- Add sensor_expiry_date to cgm_devices for quick reference
ALTER TABLE cgm_devices ADD COLUMN IF NOT EXISTS sensor_expiry_date DATETIME AFTER firmware_version;
ALTER TABLE cgm_devices ADD COLUMN IF NOT EXISTS sensor_days_remaining INT AFTER sensor_expiry_date;
