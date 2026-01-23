# Healthcare Provider Alerts & Notifications Implementation

## Overview
Healthcare Providers can now access the **Alerts & Notifications** section in the admin panel and receive real-time alerts, but **only for their designated patients**.

## Changes Made

### 1. **Sidebar Navigation Update** (`admin/components/ui/sidebar.php`)
- **Line 69**: Added `'Healthcare Provider'` to the roles array for Alerts & Notifications menu item
- **Before**: `'roles' => ['Superadmin', 'Admin']`
- **After**: `'roles' => ['Superadmin', 'Admin', 'Healthcare Provider']`

### 2. **Index Page Update** (`admin/index.php`)
- **Line 351**: Removed PHP conditional that was hiding the Alerts section from Healthcare Providers
- **Removed**: `<?php if ($adminRole !== 'Healthcare Provider'): ?>`
- **Line 427**: Removed closing `<?php endif; ?>` tag
- The Alerts & Notifications section is now visible to all roles

### 3. **Alerts API Update** (`admin/api/alerts.php`)
- **Lines 17-19**: Added role detection for Healthcare Providers
- **Lines 36-53**: Implemented patient filtering logic:
  - If user is Healthcare Provider:
    - Gets their `provider_id` using `getAdminProviderId()` function
    - Joins `patient_provider_links` table
    - Filters alerts to show only those from patients where:
      - `ppl.provider_id` matches the provider's ID
      - `ppl.is_active = 1` (active patient-provider relationship)
  - If user is Superadmin or Admin:
    - Shows all alerts (no filtering)

## How It Works

### Database Relationships
```
admin_users (Healthcare Provider)
    ↓ (admin_id)
admin_provider_mapping
    ↓ (provider_id)
healthcare_providers
    ↓ (provider_id)
patient_provider_links
    ↓ (user_id)
user_alerts
```

### Query Logic for Healthcare Providers
```sql
SELECT ua.alert_id, ua.user_id, u.full_name, ua.alert_type, 
       ua.severity, ua.title, ua.message, ua.alert_datetime, ua.is_read
FROM user_alerts ua
JOIN users u ON ua.user_id = u.user_id
INNER JOIN patient_provider_links ppl 
    ON ua.user_id = ppl.user_id 
WHERE ppl.provider_id = [provider_id]
    AND ppl.is_active = 1
ORDER BY ua.alert_datetime DESC
LIMIT 100
```

## Testing Instructions

### Prerequisites
Ensure the following sample data is loaded:
1. **Healthcare Providers**: `sample_healthcare_providers.sql`
2. **Provider Admin Accounts**: `create_sample_provider_admins.sql`
3. **User Alerts**: `sample_alerts_notifications.sql`

### Test Credentials
```
Healthcare Provider Login:
- Email: dr.ahmad.admin@hkl.gov.my
- Password: provider123

- Email: dr.siti.admin@ummc.edu.my
- Password: provider123

- Email: dr.lee.admin@gleneagles.com.my
- Password: provider123
```

### Test Steps
1. **Login as Healthcare Provider**
   - Use one of the test credentials above
   - Navigate to admin panel

2. **Check Sidebar**
   - ✓ "Alerts & Notifications" menu item should be visible
   - ✓ Click on it to open the section

3. **Verify Alert Filtering**
   - ✓ Alerts displayed should only be for the provider's designated patients
   - ✓ Compare with Admin login (should see more alerts)

4. **Check Patient Links**
   - Provider ID 1 (Dr. Ahmad) should see alerts for users 1, 2, and 3
   - Provider ID 2 (Dr. Siti) should see alerts for users 2 and 4
   - Provider ID 3 (Dr. Lee) should see alerts for user 5

5. **Test Filters**
   - ✓ Severity filter should work
   - ✓ Type filter should work
   - ✓ Unread only filter should work
   - All filters apply only to designated patient alerts

## Security Features

### Access Control
- Healthcare Providers can **only** see alerts from their designated patients
- Relationship must be active (`is_active = 1`)
- Provider must be properly mapped via `admin_provider_mapping` table

### Data Protection
- No direct patient data exposure outside assigned relationships
- Alert filtering happens at database level
- Uses existing `canAccessPatient()` security function in config.php

## Features Available to Healthcare Providers

### In Alerts & Notifications Section:
- ✓ View alerts from designated patients
- ✓ Filter by severity (Info, Warning, Critical)
- ✓ Filter by type (Glucose alerts, Sugar limits, Device status, etc.)
- ✓ Mark alerts as read
- ✓ Auto-refresh functionality
- ✓ Real-time alert monitoring

### Restrictions:
- ✗ Cannot send broadcast notifications (button hidden in UI - future enhancement)
- ✗ Cannot see notification history of system-wide broadcasts
- ✗ Cannot access alerts from non-designated patients

## Future Enhancements (Optional)

1. **Push Notifications**: Real-time browser/mobile push notifications for critical alerts
2. **Alert Acknowledgment**: Providers can acknowledge and respond to alerts
3. **Alert Escalation**: Automatic escalation of unread critical alerts
4. **Custom Alert Rules**: Providers can set custom alert thresholds for their patients
5. **Alert Summary Report**: Daily/weekly summary of patient alerts

## Related Files

- `admin/components/ui/sidebar.php` - Navigation menu
- `admin/index.php` - Main admin page
- `admin/api/alerts.php` - Alerts API endpoint
- `admin/config.php` - Helper functions (getAdminProviderId, canAccessPatient)
- `admin/database.sql` - Database schema
- `admin/sample_healthcare_providers.sql` - Sample provider data
- `admin/create_sample_provider_admins.sql` - Sample admin accounts

## Rollback Instructions

If you need to revert these changes:

1. **Sidebar**: Change line 69 back to `'roles' => ['Superadmin', 'Admin']`
2. **Index.php**: Add back `<?php if ($adminRole !== 'Healthcare Provider'): ?>` before line 351 and `<?php endif; ?>` after line 426
3. **API**: Remove lines 17-53 in `admin/api/alerts.php` (role detection and filtering)

## Summary

✅ **Healthcare Providers can now:**
- Access the Alerts & Notifications section
- View real-time alerts from their designated patients
- Use all alert filtering and management features
- Monitor patient health status through alerts

✅ **Security maintained:**
- Providers only see alerts from their assigned patients
- Database-level filtering ensures data privacy
- All existing access control mechanisms remain intact

✅ **No breaking changes:**
- Admin and Superadmin functionality unchanged
- All existing alerts work as before
- Backward compatible with existing data
