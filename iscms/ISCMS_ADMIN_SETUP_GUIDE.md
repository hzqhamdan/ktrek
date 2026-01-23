# iSCMS Admin Panel - Complete Setup Guide

## 🏥 About iSCMS (Integrated Sugar Consumption Monitoring System)

iSCMS is a comprehensive health management system designed to help users monitor their sugar intake, track glucose levels, manage weight, and prevent diabetes through AI-powered food recognition and real-time health monitoring.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [Admin Panel Features](#admin-panel-features)
5. [Default Login Credentials](#default-login-credentials)
6. [Module Overview](#module-overview)
7. [API Endpoints](#api-endpoints)
8. [Security Features](#security-features)
9. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

- **Web Server:** Apache 2.4+ or Nginx
- **PHP:** 7.4 or higher (8.0+ recommended)
- **Database:** MySQL 5.7+ or MariaDB 10.3+
- **Browser:** Modern browsers (Chrome, Firefox, Safari, Edge)

### Required PHP Extensions
- mysqli
- json
- session
- mbstring

---

## 🚀 Installation Steps

### Step 1: Database Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE iscms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import database schema:**
   Run the following SQL files in order:
   ```bash
   mysql -u root -p iscms_db < iscms/admin/database.sql
   mysql -u root -p iscms_db < iscms/admin/database_part2.sql
   mysql -u root -p iscms_db < iscms/admin/database_part3.sql
   ```

### Step 2: Configure Database Connection

Edit `iscms/admin/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
define('DB_NAME', 'iscms_db');
```

### Step 3: Create Default Admin User

1. Navigate to: `http://localhost/iscms/admin/setup_admin.php`
2. This will create a default superadmin account
3. **Default Credentials:**
   - Email: `admin@iscms.com`
   - Password: `admin123`
4. **⚠️ IMPORTANT:** Change the password immediately after first login!

### Step 4: Access Admin Panel

Navigate to: `http://localhost/iscms/admin/`

---

## 🗄️ Database Setup

### Complete Database Schema

The system includes 40+ tables organized into the following categories:

#### Core Tables
- `admin_users` - Admin authentication and roles
- `users` - End-user accounts with health profiles
- `healthcare_providers` - Verified medical professionals

#### Health Data Tables
- `sugar_intake_logs` - Daily sugar consumption tracking
- `food_entries` - Individual meal/snack records
- `glucose_readings` - CGM device data
- `weight_logs` - Weight tracking over time
- `cgm_devices` - Connected monitoring devices

#### Food Database Tables
- `food_database` - Master food nutrition database
- `user_reported_foods` - User-submitted food items

#### Alert & Notification Tables
- `alert_configurations` - System alert settings
- `user_alerts` - User-specific alerts
- `notification_templates` - Reusable message templates
- `notification_history` - Sent notification tracking
- `high_risk_users` - Users requiring intervention

#### Content Management Tables
- `health_tips` - Educational health content
- `recipes` - Low-sugar recipe database
- `articles` - Long-form educational content
- `faqs` - Frequently asked questions
- `announcements` - In-app announcements

#### Support Tables
- `user_feedback` - User feedback submissions
- `support_tickets` - Support ticket system
- `ticket_messages` - Ticket conversation threads

#### Financial Tables
- `subscriptions` - User subscription management
- `payment_history` - Payment records
- `subsidies` - Government subsidy programs
- `voucher_redemptions` - Voucher usage tracking

#### Reports & Analytics Tables
- `scheduled_reports` - Automated report generation
- `report_history` - Generated report archive

#### Security & Compliance Tables
- `audit_logs` - Complete system audit trail
- `user_consents` - GDPR/PDPA consent tracking
- `data_deletion_requests` - Right to be forgotten
- `security_incidents` - Security event logging
- `database_backups` - Backup history

#### System Configuration Tables
- `system_settings` - Configurable system parameters
- `ai_models` - AI model version management
- `api_integrations` - Third-party API connections
- `system_monitoring` - Performance metrics

#### Research Tables
- `ab_tests` - A/B testing experiments
- `research_access` - Research data access control

---

## 🎯 Admin Panel Features

### 1. Dashboard 📊
- **Key Metrics at a Glance:**
  - Total active users
  - Daily new registrations
  - Average population sugar intake
  - Users exceeding limits percentage
  - High-risk user count
  - Active alerts
  - Connected CGM devices
  - Goal achievement rate

- **Quick Actions:**
  - Send broadcast notifications
  - Add food items
  - View critical alerts
  - Export reports
  - Manage support tickets

- **Recent Activity Feed:**
  - Real-time system activity log

### 2. User Management 👥

#### User Account Management
- View all registered users
- Search and filter users
- User profile details
- Activate/deactivate accounts
- Reset user passwords
- View user activity logs
- Export user list (CSV/Excel)

#### User Analytics
- Registration trends
- User retention rate
- Demographics breakdown
- Device usage statistics
- Engagement metrics

#### Healthcare Provider Management
- Register healthcare providers
- Verify provider credentials
- Assign patients to providers
- Manage provider access levels
- Provider activity logs

### 3. Health Data Management 📈

#### Sugar Intake Monitoring
- Individual user sugar consumption
- Population-level trends
- Average daily intake by demographic
- Compliance rate tracking
- Peak consumption patterns

#### Glucose Data Overview
- Aggregate glucose statistics
- Spike frequency analysis
- CGM device connection status
- Alert frequency statistics
- Trend analysis by user segment

#### Weight & Health Metrics
- Population weight trends
- BMI distribution
- Health goal achievement rates
- Correlation analysis

### 4. Food Database Management 🍽️

#### Food Item Management
- Add new food items
- Edit existing entries
- Delete/archive items
- Bulk import (CSV)
- Nutritional information management
- Barcode database
- Malaysian food specialization

#### Food Database Analytics
- Most scanned items
- Most photographed meals
- High sugar content foods
- Trending foods
- User-reported items review

### 5. Alert & Notification System 🔔

#### Alert Configuration
- Set sugar intake thresholds
- Configure alert timing
- Customize alert messages
- Set escalation rules
- Configure notification channels

#### Notification Management
- Send broadcast notifications
- Targeted notifications
- Schedule notifications
- Notification templates
- Track delivery status
- Engagement analytics

#### System Alerts
- High-risk user alerts
- Device disconnection alerts
- Data sync failures
- Unusual pattern detection

### 6. Reports & Analytics 📋

#### Population Health Reports
- Weekly/monthly summaries
- Sugar consumption trends
- Diabetes prevention metrics
- Geographic health patterns
- Intervention effectiveness

#### System Performance Reports
- AI food recognition accuracy
- CGM connectivity rates
- App crash reports
- API response times
- Database performance

#### Policy Support Reports
- Anonymized data for government
- Regional sugar consumption
- High-risk community identification
- Intervention impact assessments
- Exportable policy briefs

### 7. Content Management 📝

#### Educational Content
- Health tips library
- Recipe database
- Educational articles
- Video content management
- In-app banners/announcements

#### FAQ & Support
- Manage FAQ content
- Support ticket system
- Common issues resolution
- Tutorial videos

### 8. System Settings ⚙️

#### Application Settings
- Default sugar limits by health status
- Alert threshold configurations
- Glucose range definitions
- Unit preferences (mg/dL vs mmol/L)
- Language settings
- Time zone settings

#### AI Model Management
- Food recognition model version
- Model accuracy monitoring
- Trigger model retraining
- Update AI parameters

#### Integration Settings
- CGM device API configurations
- Smart scale integrations
- Healthcare provider system APIs
- Payment gateway settings

### 9. Security & Compliance 🔒

#### Data Privacy Management
- User consent tracking
- Data anonymization settings
- GDPR/PDPA compliance tools
- Data retention policies
- Data deletion requests
- Complete audit logs

#### Security Monitoring
- Failed login attempts
- Suspicious activity detection
- API rate limiting
- IP whitelisting/blacklisting
- Security incident logs

#### Backup & Recovery
- Database backup schedules
- Backup status monitoring
- Restore database functionality
- Disaster recovery procedures

---

## 🔐 Default Login Credentials

**⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN!**

- **Email:** admin@iscms.com
- **Password:** admin123
- **Role:** Superadmin

### Creating Additional Admin Users

After logging in as superadmin, you can create additional admin users with different roles:
- **Superadmin:** Full system access
- **Admin:** Standard administrative access
- **Support:** Limited to support tickets and user assistance
- **Healthcare Provider:** Access to patient data only

---

## 🔌 API Endpoints

### Authentication
- `POST /api/login.php` - Admin login
- `POST /api/logout.php` - Admin logout

### Dashboard
- `GET /api/dashboard_stats.php` - Get dashboard metrics
- `GET /api/recent_activity.php` - Get recent activity

### Users
- `GET /api/users.php` - List all users
- `PUT /api/users.php` - Update user status

### Healthcare Providers
- `GET /api/providers.php` - List all providers
- `POST /api/providers.php` - Create new provider
- `PUT /api/providers.php` - Verify provider

### Health Data
- `GET /api/health_data.php?type=sugar` - Sugar intake data
- `GET /api/health_data.php?type=glucose` - Glucose level data
- `GET /api/health_data.php?type=weight` - Weight tracking data

### Food Database
- `GET /api/food_database.php` - List food items
- `POST /api/food_database.php` - Add food item
- `PUT /api/food_database.php` - Update food item
- `DELETE /api/food_database.php` - Delete food item

### Notifications
- `GET /api/notifications.php` - Get notification history
- `POST /api/notifications.php` - Send notification

### Alerts
- `GET /api/alerts.php` - Get user alerts
- `PUT /api/alerts.php` - Mark alert as read

### Reports
- `GET /api/reports.php?report_type=population_health` - Population health report
- `GET /api/reports.php?report_type=system_performance` - System performance report
- `GET /api/reports.php?report_type=high_risk_users` - High-risk users report

### Content
- `GET /api/content.php?type=health_tips` - Health tips
- `GET /api/content.php?type=recipes` - Recipes
- `GET /api/content.php?type=articles` - Articles
- `GET /api/content.php?type=faqs` - FAQs
- `POST /api/content.php` - Create content

### Support
- `GET /api/support.php?type=tickets` - Support tickets
- `GET /api/support.php?type=feedback` - User feedback
- `PUT /api/support.php` - Update ticket status

### Settings
- `GET /api/settings.php` - Get system settings
- `PUT /api/settings.php` - Update setting

### Security (Superadmin Only)
- `GET /api/security.php?type=audit_logs` - Audit logs
- `GET /api/security.php?type=security_incidents` - Security incidents
- `GET /api/security.php?type=backups` - Backup history
- `GET /api/security.php?type=data_deletion_requests` - Deletion requests
- `POST /api/security.php` - Create backup

---

## 🛡️ Security Features

### Authentication & Authorization
- Secure session management
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session hijacking prevention

### Audit Trail
- Complete system activity logging
- User action tracking
- IP address logging
- Old/new value comparison

### Data Protection
- SQL injection prevention (prepared statements)
- XSS protection (input sanitization)
- CSRF protection
- Secure password policies

### Privacy Compliance
- GDPR/PDPA compliant
- User consent management
- Data anonymization
- Right to be forgotten

---

## 🔧 Troubleshooting

### Issue: Cannot login to admin panel
**Solution:**
1. Verify database connection in `config.php`
2. Check if admin user exists in `admin_users` table
3. Run `setup_admin.php` to create default admin
4. Clear browser cache and cookies

### Issue: Dashboard shows no data
**Solution:**
1. Check database connection
2. Verify tables are created properly
3. Ensure PHP has proper permissions
4. Check browser console for JavaScript errors

### Issue: Upload folder not writable
**Solution:**
```bash
chmod 755 iscms/admin/uploads
chown www-data:www-data iscms/admin/uploads
```

### Issue: Session timeout too quick
**Solution:**
Edit `config.php` and add:
```php
ini_set('session.gc_maxlifetime', 86400); // 24 hours
```

---

## 📞 Support

For technical support or questions:
- **Documentation:** See this guide
- **Issues:** Check common issues above
- **Contact:** admin@iscms.com

---

## 📄 License

© 2026 iSCMS. All rights reserved.

---

## ✅ Post-Installation Checklist

- [ ] Database created and imported
- [ ] Config.php updated with correct credentials
- [ ] Default admin user created
- [ ] Successfully logged into admin panel
- [ ] Default password changed
- [ ] System settings configured
- [ ] Upload folder permissions set
- [ ] SSL certificate installed (production)
- [ ] Backup schedule configured
- [ ] Email/SMS notification configured

---

**🎉 Congratulations! Your iSCMS Admin Panel is now ready to use!**
