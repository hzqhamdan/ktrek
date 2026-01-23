# iSCMS - Integrated Sugar Consumption Monitoring System

## 🏥 Overview

iSCMS is a comprehensive health management system designed to help users monitor their sugar intake, track glucose levels, manage weight, and prevent diabetes through AI-powered food recognition and real-time health monitoring.

---

## ✨ Key Features

### For Users
- 📸 **AI-Powered Food Recognition** - Photograph meals for automatic nutritional analysis
- 🍬 **Sugar Intake Tracking** - Monitor daily sugar consumption
- 📊 **Glucose Monitoring** - Connect CGM devices for real-time glucose tracking
- ⚖️ **Weight Management** - Track weight and BMI over time
- 🔔 **Smart Alerts** - Receive notifications when approaching sugar limits
- 🏆 **Health Goals** - Set and achieve personalized health targets
- 📚 **Educational Content** - Access health tips, recipes, and articles

### For Healthcare Providers
- 👨‍⚕️ **Patient Monitoring** - Track assigned patients' health data
- 📈 **Trend Analysis** - View patient health trends over time
- 🚨 **Risk Alerts** - Get notified about high-risk patients
- 💬 **Patient Communication** - Communicate with patients through the system

### For Administrators
- 📊 **Dashboard Analytics** - Real-time system metrics and insights
- 👥 **User Management** - Comprehensive user account administration
- 🍽️ **Food Database Management** - Maintain extensive food nutrition database
- 🔔 **Notification System** - Send targeted or broadcast notifications
- 📋 **Reports & Analytics** - Generate population health and system reports
- 🔒 **Security & Compliance** - GDPR/PDPA compliant with audit trails
- ⚙️ **System Configuration** - Flexible system settings management

---

## 🚀 Quick Start

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7+ or MariaDB 10.3+
- Apache or Nginx web server
- Modern web browser

### Installation

1. **Clone or download the project**
   ```bash
   # Place in your web server directory
   cd /var/www/html/
   ```

2. **Create database**
   ```sql
   CREATE DATABASE iscms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import database schema**
   ```bash
   mysql -u root -p iscms_db < iscms/admin/database.sql
   mysql -u root -p iscms_db < iscms/admin/database_part2.sql
   mysql -u root -p iscms_db < iscms/admin/database_part3.sql
   ```

4. **Configure database connection**
   Edit `iscms/admin/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'iscms_db');
   ```

5. **Setup admin user**
   Navigate to: `http://localhost/iscms/admin/setup_admin.php`

6. **Login to admin panel**
   Navigate to: `http://localhost/iscms/admin/`
   - Email: `admin@iscms.com`
   - Password: `admin123`
   - **⚠️ Change password immediately after first login!**

---

## 📁 Project Structure

```
iscms/
├── admin/                          # Admin Panel
│   ├── api/                        # API Endpoints
│   │   ├── login.php              # Authentication
│   │   ├── dashboard_stats.php    # Dashboard metrics
│   │   ├── users.php              # User management
│   │   ├── providers.php          # Healthcare providers
│   │   ├── health_data.php        # Health data APIs
│   │   ├── food_database.php      # Food database CRUD
│   │   ├── notifications.php      # Notification management
│   │   ├── alerts.php             # Alert system
│   │   ├── reports.php            # Report generation
│   │   ├── content.php            # Content management
│   │   ├── support.php            # Support tickets
│   │   ├── settings.php           # System settings
│   │   └── security.php           # Security & audit
│   ├── assets/                    # Frontend assets
│   │   ├── css/                   # Stylesheets
│   │   └── js/                    # JavaScript files
│   ├── components/                # Reusable components
│   │   └── ui/
│   │       └── sidebar.php        # Sidebar navigation
│   ├── uploads/                   # Upload directory
│   ├── config.php                 # Database configuration
│   ├── index.php                  # Main admin interface
│   ├── login.php                  # Login page
│   ├── setup_admin.php            # Admin setup script
│   ├── database.sql               # Database schema part 1
│   ├── database_part2.sql         # Database schema part 2
│   └── database_part3.sql         # Database schema part 3
├── ISCMS_ADMIN_SETUP_GUIDE.md    # Comprehensive setup guide
└── README.md                      # This file
```

---

## 🎯 Admin Panel Features

### 1. Dashboard
- Real-time key metrics
- Quick action buttons
- Recent activity feed
- Visual analytics

### 2. User Management
- User account management
- Healthcare provider management
- Patient-provider linking
- User analytics and demographics

### 3. Health Data Management
- Sugar intake monitoring
- Glucose level tracking
- Weight and BMI management
- CGM device management

### 4. Food Database
- 10,000+ food items
- Malaysian food specialization
- Nutritional information
- Barcode database
- User-reported foods review

### 5. Alerts & Notifications
- Alert configuration
- Broadcast notifications
- Targeted messaging
- High-risk user alerts
- Notification templates

### 6. Reports & Analytics
- Population health reports
- System performance metrics
- Policy support reports
- Custom report builder
- Export to PDF/Excel/CSV

### 7. Content Management
- Health tips library
- Low-sugar recipes
- Educational articles
- FAQ management
- In-app announcements

### 8. System Settings
- Application configuration
- AI model management
- Integration settings
- Alert thresholds
- Unit preferences

### 9. Security & Compliance
- Complete audit trail
- User consent tracking
- Data deletion requests
- Security incident logging
- Backup management

### 10. Support System
- Support ticket management
- User feedback tracking
- Response tracking
- Satisfaction ratings

---

## 🔐 Security Features

- ✅ Role-based access control (RBAC)
- ✅ Secure password hashing (bcrypt)
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Session security
- ✅ Complete audit logging
- ✅ GDPR/PDPA compliance
- ✅ Data encryption
- ✅ IP tracking

---

## 📊 Database Schema

The system includes 40+ tables organized into:

### Core Tables
- Admin users & authentication
- User accounts & profiles
- Healthcare providers

### Health Data Tables
- Sugar intake logs
- Food entries
- Glucose readings
- Weight tracking
- CGM devices

### Food Database Tables
- Food nutrition database
- User-reported foods

### Notification Tables
- Alert configurations
- User alerts
- Notification history
- High-risk tracking

### Content Tables
- Health tips
- Recipes
- Articles
- FAQs

### Support Tables
- Support tickets
- User feedback
- Ticket messages

### Financial Tables
- Subscriptions
- Payments
- Subsidies
- Vouchers

### Security Tables
- Audit logs
- Security incidents
- Backups
- Consents

### System Tables
- Settings
- AI models
- API integrations
- Monitoring

---

## 🌐 Supported Languages

- English
- Bahasa Malaysia

---

## 📱 Mobile Integration

The admin panel is designed to manage the mobile app ecosystem:
- iOS app support
- Android app support
- Web app support

---

## 🤝 User Roles

### Superadmin
- Full system access
- User management
- System configuration
- Security settings

### Admin
- User management
- Content management
- Report generation
- Support tickets

### Support
- Support ticket management
- User assistance
- Feedback handling

### Healthcare Provider
- Patient monitoring
- Health data access
- Patient communication

---

## 📈 System Statistics

Track important metrics:
- Total active users
- Daily registrations
- Average sugar intake
- Compliance rates
- High-risk users
- CGM device connections
- Goal achievement rates

---

## 🔧 Configuration

### Database Settings
Located in `admin/config.php`

### System Settings
Configurable through admin panel:
- Sugar intake limits
- Alert thresholds
- Glucose ranges
- Time zones
- Languages
- AI model parameters

---

## 📝 API Documentation

All APIs return JSON responses in the format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}
}
```

### Authentication Required
Most APIs require admin session authentication.

### Superadmin Only
Security-related APIs require superadmin role.

---

## 🐛 Troubleshooting

### Common Issues

**Login not working?**
- Check database connection
- Verify admin user exists
- Run setup_admin.php

**Dashboard showing no data?**
- Import all database files
- Check PHP error logs
- Verify database permissions

**Upload issues?**
- Check folder permissions: `chmod 755 uploads/`
- Verify PHP upload settings

---

## 📞 Support

For detailed setup instructions, see:
- **[ISCMS_ADMIN_SETUP_GUIDE.md](ISCMS_ADMIN_SETUP_GUIDE.md)** - Complete setup guide

---

## 🚦 Development Status

✅ Admin Panel - Complete
✅ Database Schema - Complete
✅ Authentication System - Complete
✅ User Management - Complete
✅ Health Data Management - Complete
✅ Food Database - Complete
✅ Alerts & Notifications - Complete
✅ Reports & Analytics - Complete
✅ Content Management - Complete
✅ Security Features - Complete

---

## 📄 License

© 2026 iSCMS. All rights reserved.

---

## 🎉 Getting Started

1. Follow installation steps above
2. Read the [Setup Guide](ISCMS_ADMIN_SETUP_GUIDE.md)
3. Login to admin panel
4. Change default password
5. Configure system settings
6. Start managing users and content!

---

**Built with ❤️ for diabetes prevention and health management**
