# Device Alerts Data Simulation

## ✅ Summary of Changes
Created and executed a data simulation script for Device Alerts to populate the "Device Alerts" tab in the Device Management section.

### 1. Simulation Script
**File:** `admin/simulate_device_alerts.sql`
- **Logic:**
    - Iterates through users who have either a CGM device or a Smart Scale (or both).
    - Simulates alerts over the last 30 days.
    - **CGM Alerts:**
        - Battery Low (Warning)
        - Disconnected (Critical)
        - Sensor Expiring (Info)
        - Sync Failed (Warning)
    - **Smart Scale Alerts:**
        - Battery Low (Warning)
        - Sync Failed (Warning)
    - Generates resolved historical alerts.
    - Generates a few *unresolved* alerts for "today" to ensure the dashboard shows active issues.

### 2. Execution
- Ran the script against the `iscms_db` database.
- Verified that approximately 20-50 alerts were generated (depending on the number of devices in the sample data).

## 🚀 How to Test
1. Login to the Admin Panel.
2. Navigate to **Device Management**.
3. Click on the **Device Alerts** tab.
4. You should now see a list of alerts including:
    - Recent unresolved alerts (e.g., "Data Gap", "Battery Low").
    - Historical resolved alerts.
    - Different severity levels (Critical, Warning, Info) with appropriate color coding.
