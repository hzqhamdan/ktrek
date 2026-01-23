# 🚀 Device Management - Installation Steps

## Fixed SQL Import Issue ✅

The computed column issue has been resolved. Follow these steps to install:

---

## 📋 **Installation Steps**

### **Step 1: Import Database Schema**
```bash
mysql -u root -p iscms_db < admin/database_device_management.sql
```

This creates:
- ✅ `smart_scale_devices` table
- ✅ `cgm_sensors` table (without computed column)
- ✅ `device_sync_history` table
- ✅ `device_alerts` table
- ✅ Adds columns to existing `cgm_devices` table

---

### **Step 2: Import Sample Data (Optional - for testing)**
```bash
mysql -u root -p iscms_db < admin/sample_device_data.sql
```

This inserts:
- ✅ 8 CGM devices with varying statuses
- ✅ 9 Smart scale devices
- ✅ Sample glucose readings (today)
- ✅ Sample weight logs (today)

**Sample data includes:**
- Connected devices (normal operation)
- Disconnected devices (need attention)
- Low battery devices (≤20%)
- Expiring sensors (≤3 days)
- Expired sensors (negative days)
- Error status devices

---

### **Step 3: Verify Installation**

Login to admin panel and check:

1. **Sidebar Menu** - "Device Management" option should appear
2. **Click Device Management** - Dashboard should load
3. **Check Metrics**:
   - Total Devices: 17
   - Connected: ~13-14
   - Disconnected: 2-3
   - Low Battery: 2-4
   - Sensors Expiring Soon: 2
   - Sensors Expired: 1

---

## 🔧 **What Was Fixed**

### **Original Error:**
```
#1901 - Function or expression 'current_timestamp()' cannot be used 
in the GENERATED ALWAYS AS clause of `days_remaining`
```

### **Solution:**
Removed the computed column `days_remaining` from `cgm_sensors` table. The days calculation is now done:
- In the API (`admin/api/devices.php`) using SQL `DATEDIFF()` functions
- In the frontend JavaScript for display
- When inserting data using `DATEDIFF()` in INSERT statements

---

## 📊 **Database Changes**

### **cgm_sensors table** (Simplified)
```sql
CREATE TABLE cgm_sensors (
    sensor_id INT PRIMARY KEY,
    device_id INT,
    user_id INT,
    installation_date DATETIME,
    expiry_date DATETIME,
    sensor_status ENUM('Active', 'Expiring Soon', 'Expired', 'Removed'),
    -- days_remaining is now calculated dynamically
);
```

### **Days Remaining Calculation** (Done in API)
```php
// In devices.php - calculated dynamically
DATEDIFF(sensor_expiry_date, NOW()) as days_remaining
```

---

## ✅ **Verification Checklist**

After installation, verify:

- [ ] Database schema imported without errors
- [ ] Sample data inserted successfully
- [ ] "Device Management" appears in sidebar
- [ ] Dashboard loads with metrics
- [ ] CGM Devices tab shows 8 devices
- [ ] Smart Scales tab shows 9 devices
- [ ] Battery levels are color-coded
- [ ] Sensor expiry shows days remaining
- [ ] "View User" button works
- [ ] Connection status badges display correctly

---

## 🐛 **Troubleshooting**

### **Issue: Sidebar doesn't show "Device Management"**
**Solution:** Clear browser cache and reload

### **Issue: Dashboard shows "Loading..." forever**
**Solution:** 
1. Check browser console for errors
2. Verify API file exists: `admin/api/devices.php`
3. Check file permissions (should be readable)

### **Issue: Foreign key constraint error when importing sample data**
**Solution:**
This happens if you don't have users in your database yet. The sample data file now dynamically checks for existing users and only creates devices for them.

If you get this error:
1. **Option A**: First create some test users, then import sample_device_data.sql
2. **Option B**: The sample data will work with ANY existing users - it auto-detects them

### **Issue: No devices shown**
**Solution:**
1. Verify sample data was imported: `SELECT COUNT(*) FROM cgm_devices;`
2. Check if you have users in database: `SELECT COUNT(*) FROM users;`
3. If no users exist, create some users first, then re-run sample_device_data.sql

### **Issue: Days remaining shows NULL**
**Solution:**
1. Update devices: `UPDATE cgm_devices SET sensor_days_remaining = DATEDIFF(sensor_expiry_date, NOW()) WHERE sensor_expiry_date IS NOT NULL;`

---

## 🔄 **Update Existing Devices**

If you have existing CGM devices without the new columns:

```sql
-- Update all existing devices with sample sensor expiry dates
UPDATE cgm_devices 
SET 
    firmware_version = 'v2.0.0',
    sensor_expiry_date = DATE_ADD(NOW(), INTERVAL 7 DAY),
    sensor_days_remaining = 7
WHERE sensor_expiry_date IS NULL;
```

---

## 📁 **File Structure After Installation**

```
admin/
├── api/
│   ├── devices.php              ✅ NEW - Device Management API
│   └── ...
├── database_device_management.sql ✅ NEW - Schema
├── sample_device_data.sql        ✅ NEW - Test data
├── components/
│   └── ui/
│       └── sidebar.php           ✅ MODIFIED
├── assets/
│   └── js/
│       ├── main.js               ✅ MODIFIED (+400 lines)
│       └── sidebar.js            ✅ MODIFIED
└── index.php                     ✅ MODIFIED
```

---

## 🎯 **Quick Test Commands**

### **Check if tables exist:**
```sql
USE iscms_db;
SHOW TABLES LIKE '%device%';
SHOW TABLES LIKE '%scale%';
SHOW TABLES LIKE '%sensor%';
```

### **Check sample data:**
```sql
SELECT COUNT(*) as Total, connection_status, 
       AVG(battery_level) as Avg_Battery
FROM cgm_devices 
WHERE is_active = 1
GROUP BY connection_status;
```

### **Check devices needing attention:**
```sql
SELECT user_id, device_name, battery_level, sensor_days_remaining
FROM cgm_devices
WHERE battery_level < 30 
   OR sensor_days_remaining < 3
ORDER BY battery_level ASC, sensor_days_remaining ASC;
```

---

## ✨ **All Set!**

Your Device Management Dashboard is now ready to use!

**Next Steps:**
1. Login to admin panel
2. Click "Device Management" in sidebar
3. Explore the dashboard
4. Try filtering with tabs (CGM/Scales/Alerts)
5. Click "View User" to see device info in user profiles

---

**Need help?** Check `DEVICE_MANAGEMENT_IMPLEMENTATION.md` for full documentation!
