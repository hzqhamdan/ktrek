# ✅ Sample Data Generation - Complete!

## 🎉 What Was Created

I've created a comprehensive sample data generation system with **4 files**:

---

## 📁 Files Created

### **1. `admin/sample_data_users.sql`**
Creates 10 diverse sample users with:
- Malaysian names and locations
- Various health statuses (Healthy, Pre-diabetic, Type 1, Type 2 Diabetes)
- Premium and free users
- Different ages, genders, BMI, sugar limits
- Realistic registration dates and last active times

### **2. `admin/sample_data_devices_and_health.sql`**
Creates comprehensive test data:
- **7 CGM Devices** (various connection statuses, battery levels, sensor expiry)
- **8 Smart Scale Devices** (various connection and battery statuses)
- **Today's Activity Data** (food entries, glucose readings, weight logs, exercise)
- **7-Day Trend Data** (glucose, weight, sugar intake histories)
- **3 High-Risk Users** (for reports testing)

### **3. `admin/LOAD_SAMPLE_DATA.sql`** ⭐ MASTER SCRIPT
One-command loader that:
- Runs both SQL files in correct order
- Shows progress messages
- Displays comprehensive summary
- Lists all created data with counts

### **4. `admin/load_sample_data.ps1`** (BONUS)
PowerShell script with interactive prompts:
- Asks for database credentials
- Checks MySQL availability
- Loads all data with one command
- Shows success/error messages

---

## 🚀 How to Use

### **Method 1: SQL Command (Recommended)**

```bash
mysql -u root -p iscms_db < admin/LOAD_SAMPLE_DATA.sql
```

### **Method 2: PowerShell Script (Windows)**

```powershell
cd admin
.\load_sample_data.ps1
```

### **Method 3: Manual Steps**

```bash
# Step 1: Create users
mysql -u root -p iscms_db < admin/sample_data_users.sql

# Step 2: Create devices and health data
mysql -u root -p iscms_db < admin/sample_data_devices_and_health.sql
```

---

## 📊 What Gets Created

### **👥 10 Sample Users**
| User | Health Status | Devices |
|------|---------------|---------|
| Ahmad bin Abdullah | Healthy | CGM + Scale |
| Siti Nurhaliza | Pre-diabetic | CGM + Scale |
| Tan Wei Ming | Type 2 Diabetes | CGM + Scale (LOW BATTERY) |
| Nurul Aisyah | Type 1 Diabetes | CGM (CRITICAL BATTERY) |
| Rajesh Kumar | Healthy | Scale |
| Lim Mei Ling | Pre-diabetic | CGM (ERROR) + Scale |
| Muhammad Faizal | Type 2 Diabetes | CGM |
| Kavitha Devi | Healthy | Scale |
| Wong Chee Keong | Pre-diabetic | Scale (DISCONNECTED) |
| Fatimah Zahra | Type 2 Diabetes | CGM (SYNCING) + Scale |

### **🔧 Device Scenarios**
- ✅ **5 Connected CGM devices** - Normal operation
- 🔴 **1 Disconnected CGM** - User 3 (Tan Wei Ming)
- ⚠️ **1 Error CGM** - User 6 (Lim Mei Ling)
- 🟡 **1 Syncing CGM** - User 10 (Fatimah Zahra)
- 🔴 **Critical Battery**: User 4 (18%)
- 🟡 **Low Battery**: Users 3, 6, 10
- 🔴 **Sensor Expired**: User 6 (-1 day)
- 🟡 **Sensor Expiring**: User 4 (1 day), User 3 (2 days)

### **📈 Health Data**
**Today's Activity:**
- 🍽️ 13 Food entries (Nasi Lemak, Chicken Rice, Satay, etc.)
- 📊 14 Glucose readings (ranging 88-215 mg/dL)
- ⚖️ 5 Weight measurements
- 🏃 4 Exercise activities (Walking, Jogging, Cycling, Swimming)

**Weekly Trends (7 days):**
- 📈 20+ Glucose readings for trend analysis
- 📉 7-day weight tracking with daily changes
- 🍬 7-day sugar intake with compliance status

**High-Risk Users:**
- 🔴 User 7 - Critical (5 violations, NOT notified)
- 🟡 User 3 - High (3 violations, notified)
- 🟡 User 10 - High (4 violations, notified)

---

## 🧪 Testing Checklist

### **✅ Device Management Dashboard**
Navigate to Device Management and verify:
- [ ] Total devices: ~15
- [ ] Connected devices: ~10
- [ ] Disconnected devices: ~3
- [ ] Low battery alerts: ~4
- [ ] Sensors expiring soon: 2
- [ ] Sensors expired: 1
- [ ] Can switch between CGM/Scale/Alerts tabs
- [ ] Battery levels are color-coded
- [ ] Sensor expiry countdown shows

### **✅ Enhanced User Profile**
Open Ahmad bin Abdullah's profile and verify:
- [ ] **Overview Tab** - Shows basic info and sugar summary
- [ ] **Today's Activity Tab** - Shows 4 food entries with icons
- [ ] **Weekly Trends Tab** - Shows 7-day glucose/weight/sugar tables
- [ ] **Health Data Tab** - Shows recent food entries
- [ ] **Devices Tab** - Shows CGM + Smart Scale with battery/sensor info
- [ ] **Alerts Tab** - Loads without errors
- [ ] **Healthcare Providers Tab** - Loads without errors
- [ ] All tabs switch smoothly

### **✅ Today's Activity Timeline**
For Ahmad bin Abdullah:
- [ ] Shows Nasi Lemak breakfast entry
- [ ] Shows Roti Canai entry
- [ ] Shows Chicken Rice lunch
- [ ] Shows Mango Lassi snack
- [ ] Shows glucose readings
- [ ] Shows weight log
- [ ] Shows walking exercise
- [ ] Each item has correct icon (🍽️📊⚖️🏃)
- [ ] Items are in chronological order

### **✅ Weekly Trends**
For Ahmad bin Abdullah:
- [ ] **Glucose Table** - Shows 7 days with avg/min/max
- [ ] **Weight Table** - Shows 7 days with changes (color-coded)
- [ ] **Sugar Table** - Shows 7 days with compliance badges
- [ ] Weight changes show + or - with correct colors
- [ ] Exceeded days show red badges

### **✅ Device Monitoring**
Test Tan Wei Ming (User 3):
- [ ] Shows disconnected CGM
- [ ] Battery level is 45% (yellow)
- [ ] Sensor expiring in 2 days (yellow)
- [ ] Smart scale is disconnected (red)
- [ ] Scale battery is 15% (red)

Test Nurul Aisyah (User 4):
- [ ] CGM battery is 18% (red - critical)
- [ ] Sensor expiring in 1 day (red - critical)
- [ ] Glucose reading shows 88 mg/dL (low)

### **✅ Reports Section**
Navigate to Reports and verify:
- [ ] **Population Health Report** generates
- [ ] Shows health status distribution (visual cards)
- [ ] Shows average sugar by health status
- [ ] Shows geographic distribution (states)
- [ ] **System Performance Report** generates
- [ ] Shows user statistics (registrations)
- [ ] Shows food database stats
- [ ] Shows CGM device stats
- [ ] **High-Risk Users Report** generates
- [ ] Shows 3 high-risk users
- [ ] Shows risk levels and violations
- [ ] "View User" button works
- [ ] Export PDF button shows alert

---

## 🎯 Expected Dashboard Results

### **Device Management Metrics:**
```
Total Devices: 15
Connected: 10
Disconnected: 3
Low Battery: 4
Sensors Expiring Soon: 2
Sensors Expired: 1
```

### **User Profile - Ahmad bin Abdullah:**
```
Today's Activity: 7 items (4 food, 3 glucose, 1 weight, 1 exercise)
Weekly Glucose Trend: 7 days of data
Weekly Weight Trend: 7 days (showing -1.5 kg decrease)
Weekly Sugar: 7 days (6 compliant, 1 exceeded)
Devices: 2 (1 CGM + 1 Scale, both connected)
```

### **Reports - Population Health:**
```
Health Status Distribution:
- Healthy: 3 users
- Pre-diabetic: 3 users
- Type 1 Diabetes: 1 user
- Type 2 Diabetes: 3 users
```

---

## 📝 Additional Documentation

Created comprehensive documentation:
- ✅ **`SAMPLE_DATA_INSTRUCTIONS.md`** - Detailed usage guide
- ✅ **`SAMPLE_DATA_COMPLETE.md`** - This file (summary)

---

## 🔄 Re-running Sample Data

Safe to run multiple times:
```bash
mysql -u root -p iscms_db < admin/LOAD_SAMPLE_DATA.sql
```

The scripts use `ON DUPLICATE KEY UPDATE` to prevent duplicates.

---

## 🗑️ Removing Sample Data

To clean up test data:
```sql
DELETE FROM users WHERE email LIKE '%@email.com';
-- This will cascade delete all related data (devices, logs, etc.)
```

---

## ✨ Smart Features

### **Dynamic User Detection**
- Scripts automatically find the last 10 users
- Works even if you have existing users
- No need to modify user IDs

### **Realistic Scenarios**
- **Malaysian context**: Names, locations, foods
- **Common devices**: Dexcom, FreeStyle Libre, Withings, Fitbit
- **Real health patterns**: Glucose ranges, sugar limits
- **Varied situations**: Good compliance, violations, critical cases

### **Testing Edge Cases**
- Critical battery (18%)
- Expired sensor (-1 day)
- Disconnected devices (5 hours offline)
- High glucose (215 mg/dL)
- Low glucose (88 mg/dL)
- Consistent violations (5 in a row)

---

## 🎉 Success Indicators

After loading, you should see:

```
✅ SAMPLE DATA LOADED SUCCESSFULLY!

📊 SUMMARY OF CREATED DATA:

Users: 10 total, 6 premium, 10 active
CGM Devices: 7 total, 5 connected, 2 low battery, 2 expiring
Smart Scales: 8 total, 5 connected, 2 low battery
Today's Data: 14 glucose, 5 weight, 13 food, 4 exercise
Weekly Data: 20+ glucose, 7 weight, 15 sugar logs
High Risk Users: 3 total, 1 critical, 1 not notified

🎉 READY TO TEST!
```

---

## 💡 Pro Tips

### **Best Users for Testing:**

1. **Ahmad bin Abdullah (User 1)** - Perfect example
   - All features working normally
   - Good compliance
   - Complete data

2. **Tan Wei Ming (User 3)** - Problem device
   - Disconnected CGM
   - Low battery on both devices
   - High-risk user
   - Exceeded sugar limits

3. **Nurul Aisyah (User 4)** - Critical alerts
   - 18% battery (critical)
   - Sensor expiring in 1 day
   - Low glucose reading

4. **Lim Mei Ling (User 6)** - Error state
   - CGM in error state
   - Expired sensor
   - Scale with error

### **Testing Workflow:**

1. **Start with Device Management**
   - Get overview of all devices
   - Identify problem cases
   - Note low battery and expiry alerts

2. **Deep dive into User Profiles**
   - View each user's complete profile
   - Check all 7 tabs
   - Verify data accuracy

3. **Generate Reports**
   - Population health overview
   - System performance metrics
   - High-risk user identification

---

## 🚀 You're All Set!

Everything is ready for comprehensive testing:
- ✅ 10 diverse users
- ✅ 15 IoT devices with realistic scenarios
- ✅ Today's activity data
- ✅ 7-day trend data
- ✅ High-risk user flags
- ✅ Complete documentation

**Run the master script and start testing!** 🎊

```bash
mysql -u root -p iscms_db < admin/LOAD_SAMPLE_DATA.sql
```

---

**Happy Testing!** 🎉
