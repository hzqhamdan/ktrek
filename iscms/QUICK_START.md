# iSCMS Admin Panel - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes!

---

## Step 1: Create Database (1 minute)

Open MySQL/phpMyAdmin and run:

```sql
CREATE DATABASE iscms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Step 2: Import Database (2 minutes)

**Option A: Using Command Line**
```bash
mysql -u root -p iscms_db < iscms/admin/database.sql
mysql -u root -p iscms_db < iscms/admin/database_part2.sql
mysql -u root -p iscms_db < iscms/admin/database_part3.sql
```

**Option B: Using phpMyAdmin**
1. Select `iscms_db` database
2. Click "Import" tab
3. Upload and execute each SQL file in order:
   - database.sql
   - database_part2.sql
   - database_part3.sql

---

## Step 3: Configure Database (30 seconds)

Edit `iscms/admin/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');          // Your MySQL username
define('DB_PASS', '');              // Your MySQL password
define('DB_NAME', 'iscms_db');
```

---

## Step 4: Create Admin User (30 seconds)

Navigate to:
```
http://localhost/iscms/admin/setup_admin.php
```

This creates a default admin account:
- **Email:** admin@iscms.com
- **Password:** admin123

---

## Step 5: Login (30 seconds)

Navigate to:
```
http://localhost/iscms/admin/
```

Login with the credentials above.

**⚠️ IMPORTANT:** Change your password immediately!

---

## ✅ You're Done!

You should now see the iSCMS Admin Dashboard with:
- 📊 Key metrics cards
- 🚀 Quick action buttons
- 📝 Recent activity feed

---

## 🎯 Next Steps

1. **Change Password** - Click your avatar → Edit Profile
2. **Explore Dashboard** - View system metrics
3. **Add Food Items** - Navigate to Food Database
4. **Configure Settings** - Navigate to System Settings
5. **Read Full Guide** - See ISCMS_ADMIN_SETUP_GUIDE.md

---

## 🆘 Having Issues?

### Can't login?
- Run `setup_admin.php` again
- Clear browser cookies
- Check database connection in config.php

### Dashboard empty?
- Verify all 3 SQL files were imported
- Check browser console for errors

### Database connection error?
- Verify MySQL is running
- Check credentials in config.php
- Ensure database exists

---

## 📚 Full Documentation

For detailed information, see:
- **ISCMS_ADMIN_SETUP_GUIDE.md** - Complete setup guide
- **README.md** - System overview

---

**Happy managing! 🎉**
