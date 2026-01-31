-- Migration: Add rejection_reason column to password reset requests
-- Created: 2026-01-28
-- Purpose: Allow superadmin to provide reason when rejecting password reset requests

ALTER TABLE admin_password_reset_requests 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL AFTER notes;
