# 📊 Sample Data Generation - Instructions

## 🎯 Quick Start

### **Option 1: Load Everything at Once (Recommended)**

Run the master script that loads all sample data:

```bash
mysql -u root -p iscms_db < admin/LOAD_SAMPLE_DATA.sql
```

**This will create:**
- ✅ 10 Sample Users (various health statuses)
- ✅ 7 CGM Devices (with varying battery and sensor status)
- ✅ 8 Smart Scale Devices (with varying connectivity)
- ✅ Today's Activity Data (food, glucose, weight, exercise)
- ✅ 7-Day Trend Data (glucose, weight, sugar intake)
- ✅ 3 High-Risk Users (for reports testing)

---

### **Option 2: Load Step by Step**

If you prefer manual control:

```bash
# Step 1: Create users
mysql -u root -p iscms_db < admin/sample_data_users.sql

# Step 2: Create devices and health data
mysql -u root -p iscms_db < admin/sample_data_devices_and_health.sql
```

---

## 👥 Sample Users Created

| # | Name | Email | Health Status | Premium | Features |
|---|------|-------|---------------|---------|----------|
| 1 | Ahmad bin Abdullah | ahmad.abdullah@email.com | Healthy | ✅ Yes | CGM + Scale |
| 2 | Siti Nurhaliza | siti.nurhaliza@email.com | Pre-diabetic | ✅ Yes | CGM + Scale |
| 3 | Tan Wei Ming | tan.weiming@email.com | Type 2 Diabetes | ❌ No | CGM + Scale |
| 4 | Nurul Aisyah | nurul.aisyah@email.com | Type 1 Diabetes | ✅ Yes | CGM |
| 5 | Rajesh Kumar | rajesh.kumar@email.com | Healthy | ❌ No | Scale |
| 6 | Lim Mei Ling | lim.meiling@email.com | Pre-diabetic | ✅ Yes | CGM + Scale |
| 7 | Muhammad Faizal | muhammad.faizal@email.com | Type 2 Diabetes | ❌ No | CGM |
| 8 | Kavitha Devi | kavitha.devi@email.com | Healthy | ✅ Yes | Scale |
| 9 | Wong Chee Keong | wong.cheekeong@email.com | Pre-diabetic | ❌ No | Scale |
| 10 | Fatimah Zahra | fatimah.zahra@email.com | Type 2 Diabetes | ✅ Yes | CGM + Scale |

---

## 🔧 Device Data Created

### **CGM Devices (7 total):**
- ✅ 5 Connected
- 🔴 1 Disconnected (User 3 - Tan Wei Ming)
- ⚠️ 1 Error (User 6 - Lim Mei Ling)
- 🟡 1 Syncing (User 10 - Fatimah Zahra)

**Battery Alerts:**
- 🔴 **Critical**: User 4 (18% battery)
- 🟡 **Warning**: User 3 (45% battery), User 6 (65%), User 10 (55%)

**Sensor Expiry Alerts:**
- 🔴 **Critical**: User 4 (1 day), User 6 (-1 day expired)
- 🟡 **Warning**: User 3 (2 days)

### **Smart Scale Devices (8 total):**
- ✅ 5 Connected
- 🔴 2 Disconnected (User 3, User 9)
- ⚠️ 1 Error (User 6)

**Battery Alerts:**
- 🔴 **Critical**: User 3 (15% battery), User 9 (22%)

---

## 📊 Health Data Created

### **Today's Activity:**
- 🍽️ **Food Entries**: 13 meals (breakfast, lunch, dinner, snacks)
- 📊 **Glucose Readings**: 14 readings (various times today)
- ⚖️ **Weight Logs**: 5 weight measurements
- 🏃 **Exercise Logs**: 4 activities (walking, jogging, cycling, swimming)

### **Weekly Trends (Last 7 Days):**
- 📈 **Glucose Readings**: 20+ readings for trend analysis
- 📉 **Weight Logs**: 7-day tracking with daily changes
- 🍬 **Sugar Intake**: 7-day compliance tracking

### **High-Risk Users (For Reports):**
- 🔴 **User 7** (Muhammad Faizal) - Critical risk, 5 violations, provider NOT notified
- 🟡 **User 3** (Tan Wei Ming) - High risk, 3 violations, provider notified
- 🟡 **User 10** (Fatimah Zahra) - High risk, 4 violations, provider notified

---

## 🧪 What You Can Test

### **1. Device Management Dashboard**
- Navigate to **Device Management** in sidebar
- See overview metrics (17 devices total)
- View CGM devices tab
- View Smart Scales tab
- Check battery warnings (color-coded)
- Check sensor expiry alerts
- View device alerts tab

### **2. Enhanced User Profile**
Pick any user and click "View":

**Test Ahmad bin Abdullah (User 1):**
- ✅ **Overview Tab** - Basic info, sugar summary
- ✅ **Today's Activity Tab** - See food entries, glucose readings, weight log, exercise
- ✅ **Weekly Trends Tab** - 7-day glucose/weight/sugar trends
- ✅ **Health Data Tab** - Recent food entries
- ✅ **Devices Tab** - CGM + Smart Scale with battery/sensor info
- ✅ **Alerts Tab** - Any recent alerts
- ✅ **Healthcare Providers Tab** - Linked providers (if any)

**Test Tan Wei Ming (User 3) - Type 2 Diabetes:**
- Device with disconnection and low battery
- Multiple high glucose readings
- High-risk user flagged
- Exceeded sugar limits

**Test Nurul Aisyah (User 4) - Type 1 Diabetes:**
- Critical battery warning (18%)
- Sensor expiring in 1 day
- Low glucose reading (88 mg/dL)

### **3. Reports Section**
Click **"Reports"** in sidebar:

**Population Health Report:**
- Health status distribution chart
- Average sugar by health status
- Geographic distribution (states)

**System Performance Report:**
- User registration stats
- Food database stats
- Device connectivity stats

**High-Risk Users Report:**
- 3 high-risk users displayed
- Risk levels and violations
- Provider notification status
- Click "View User" to see details

---

## 📈 Expected Results

### **Device Management Dashboard Metrics:**
- Total Devices: **15**
- Connected: **~10**
- Disconnected: **~3**
- Low Battery: **~4**
- Sensors Expiring Soon: **2**
- Sensors Expired: **1**

### **User Profile - Today's Activity:**
- Food entries with meal times
- Glucose readings throughout the day
- Weight logs from smart scale
- Exercise activities

### **User Profile - Weekly Trends:**
- Glucose: 7-day averages with min/max
- Weight: Daily tracking with changes
- Sugar: Compliance status per day

### **Reports:**
- Health status breakdown (Healthy, Pre-diabetic, Type 1, Type 2)
- System metrics (users, food items, devices)
- High-risk users list (3 users flagged)

---

## 🔄 Re-running Sample Data

If you need to reload sample data:

```bash
# This will update existing data or create new entries
mysql -u root -p iscms_db < admin/LOAD_SAMPLE_DATA.sql
```

The scripts use `ON DUPLICATE KEY UPDATE` so they won't create duplicates if run multiple times.

---

## 🗑️ Cleaning Up Sample Data

To remove all sample data:

```sql
-- WARNING: This will delete the sample data!
DELETE FROM exercise_logs WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM food_entries WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM sugar_intake_logs WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM weight_logs WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM glucose_readings WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM high_risk_users WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM smart_scale_devices WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM cgm_devices WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@email.com');
DELETE FROM users WHERE email LIKE '%@email.com';
```

---

## 📝 Notes

### **User Passwords:**
All sample users have placeholder password hashes. To login as a sample user, you would need to:
1. Update the password_hash in the users table
2. Or use the admin panel to view user data (no user login needed)

### **Data Realism:**
- Malaysian names and locations
- Realistic health statuses
- Typical glucose ranges
- Common Malaysian foods
- Realistic device models (Dexcom, FreeStyle Libre, Withings, Fitbit)

### **Device Scenarios:**
- **Normal operation**: Most devices connected with good battery
- **Low battery warnings**: Some devices below 20%
- **Sensor expiry**: CGM sensors at various stages
- **Disconnection issues**: Some devices not syncing
- **Error states**: Devices with sync errors

---

## ✅ Verification

After loading, verify data with:

```sql
-- Check users
SELECT user_id, full_name, health_status FROM users ORDER BY user_id DESC LIMIT 10;

-- Check devices
SELECT COUNT(*) as cgm_count FROM cgm_devices WHERE is_active = 1;
SELECT COUNT(*) as scale_count FROM smart_scale_devices WHERE is_active = 1;

-- Check today's activity
SELECT COUNT(*) FROM glucose_readings WHERE DATE(reading_datetime) = CURDATE();
SELECT COUNT(*) FROM food_entries WHERE DATE(entry_datetime) = CURDATE();
SELECT COUNT(*) FROM weight_logs WHERE log_date = CURDATE();

-- Check high-risk users
SELECT user_id, risk_level, consecutive_violations FROM high_risk_users WHERE is_resolved = 0;
```

---

## 🎉 Ready to Test!

1. ✅ Load sample data using the master script
2. ✅ Login to admin panel
3. ✅ Explore Device Management
4. ✅ View user profiles (all 7 tabs)
5. ✅ Generate reports (3 types)
6. ✅ Check device alerts and battery warnings

**Everything should work with real, dynamic data!** 🚀

---

## 📞 Need Help?

If you encounter issues:
1. Check that database connection works (`admin/config.php`)
2. Verify all SQL files are in the `admin/` folder
3. Ensure you have permissions to create data
4. Check for SQL errors in the output

---

**Happy Testing!** 🎊
