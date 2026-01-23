-- Audit Log Table for Tracking Superadmin Changes
-- This table tracks all changes made by superadmins to attractions, tasks, and guides
-- so that managers can see what changes were made to their attractions

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_role ENUM('superadmin', 'manager') NOT NULL,
    action_type ENUM('create', 'update', 'delete') NOT NULL,
    entity_type ENUM('attraction', 'task', 'guide', 'reward') NOT NULL,
    entity_id INT NOT NULL,
    entity_name VARCHAR(255),
    attraction_id INT NULL,
    attraction_name VARCHAR(255) NULL,
    changes_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attraction_id (attraction_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at),
    INDEX idx_entity_type_id (entity_type, entity_id),
    FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
);

-- Index for efficient querying by attraction and date
CREATE INDEX idx_attraction_date ON admin_audit_log(attraction_id, created_at DESC);
