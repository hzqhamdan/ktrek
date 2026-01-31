-- Migration: Admin Password Reset Request System
-- Created: 2026-01-27
-- Purpose: Allow managers to request password resets and superadmins to approve them

-- Create password reset requests table
CREATE TABLE IF NOT EXISTS admin_password_reset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    requested_by_email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_message TEXT,
    new_password_hash VARCHAR(255) DEFAULT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by INT NULL,
    notes TEXT,
    FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES admin(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_admin_id (admin_id),
    INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add column to admin table to track if password must be changed
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE AFTER is_active;

-- Add column to track last password reset
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS last_password_reset TIMESTAMP NULL AFTER must_change_password;
