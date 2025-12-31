# QR Check-in System Implementation Guide

## Overview
Complete QR-based check-in system with geolocation validation and task prerequisites.

## What Was Implemented

### 1. Database Updates
**File:** `admin/database_updates.sql`
- Added `latitude` and `longitude` columns to `attractions` table
- Added `latitude` and `longitude` columns to `user_task_submissions` table
- Added index on `qr_code` for faster lookups
- Added `task_order` column to enforce check-in as first task

**Run this SQL file on your database before using the system.**

### 2. Backend Components

#### QR Code Generation & Utilities
**File:** `backend/utils/qrcode.php`
- `QRCodeGenerator::generateToken()` - Generate secure random tokens
- `QRCodeGenerator::generateURL()` - Create QR code image URLs
- `QRCodeGenerator::streamImage()` - Stream QR code images
- `QRCodeGenerator::calculateDistance()` - Calculate GPS distance (Haversine formula)
- `QRCodeGenerator::validateProximity()` - Validate user is within 100m of attraction

#### QR Generation Endpoint
**File:** `backend/api/qr/generate.php`
- GET endpoint to generate QR code images for tasks
- Auto-generates tokens if `allow_generate=true`
- Only works for check-in type tasks

#### Check-in Validation
**File:** `backend/api/tasks/submit-checkin.php` (updated)
- Now requires latitude/longitude from client
- Validates user is within 100 meters of attraction
- Stores user location with submission
- Returns error if user is too far away

#### Task Prerequisites
**File:** `backend/api/tasks/check-prerequisite.php`
- Checks if user has completed check-in before accessing other tasks
- Returns `can_access: false` if check-in not completed

### 3. Admin Panel Updates

#### QR Token Generation
**Files:** `admin/index.html`, `admin/javascript/main.js`
- "Generate QR Token" button for check-in tasks
- "Download QR Code" button to save QR as PNG
- Live QR preview in the modal
- Uses Google Charts API for QR generation (no external dependencies)

**File:** `admin/api/generate_qr_token.php`
- Backend endpoint to generate and save QR tokens for tasks

### 4. Frontend Updates

#### Geolocation Check-in
**File:** `frontend/src/components/tasks/CheckinTask.jsx`
- Captures user's GPS location on check-in
- High-accuracy positioning (enableHighAccuracy: true)
- User-friendly error messages for location issues
- Displays location errors on screen

**File:** `frontend/src/api/tasks.js`
- Updated `submitCheckin()` to accept location object
- Added `checkPrerequisite()` to verify task access

## How to Use

### Admin Workflow

1. **Create/Edit a Check-in Task:**
   - Go to Admin Panel → Tasks
   - Create a new task with type "Check-in"
   - Click "Generate QR Token" button
   - Click "Download QR Code" to save the QR image
   - Save the task

2. **Set Attraction Coordinates:**
   - Go to Admin Panel → Attractions
   - Edit the attraction
   - Set the latitude and longitude
   - The check-in will validate users are within 100m of these coordinates

3. **Print and Place QR Code:**
   - Print the downloaded QR code
   - Place it at the attraction location
   - Users must scan this QR to complete check-in

### User Workflow

1. **Start at an Attraction:**
   - User arrives at the physical location
   - Opens the app and navigates to the attraction

2. **Scan QR Code:**
   - User taps "Scan QR" or similar
   - Scans the QR code placed at the location
   - App verifies the QR and shows the check-in task

3. **Complete Check-in:**
   - User taps "Check In Now"
   - App requests location permission
   - App captures GPS coordinates
   - Backend validates user is within 100m
   - Check-in completes if validation passes

4. **Continue with Other Tasks:**
   - After check-in, user can access photo, quiz, and other tasks
   - Without check-in, other tasks are blocked

## Security Features

1. **Secure Token Generation:** 64-character hex tokens (32 bytes)
2. **Geofencing:** 100-meter radius validation
3. **Location Storage:** GPS coordinates stored for audit trail
4. **One-time Check-in:** Prevents duplicate submissions
5. **Backend Validation:** All checks performed server-side

## Configuration

### Adjust Proximity Distance
Edit `backend/api/tasks/submit-checkin.php` line 66:
```php
$proximityCheck = QRCodeGenerator::validateProximity(
    $latitude, 
    $longitude, 
    $task['attraction_lat'], 
    $task['attraction_lon'],
    100 // Change this value (in meters)
);
```

### QR Code Size
Admin download: 400x400 pixels
Preview: 300x300 pixels

To change, edit `admin/javascript/main.js`:
- `showQRPreview()` function (line 2316)
- `downloadQRCode()` function (line 2333)

## Testing Checklist

- [ ] Run `admin/database_updates.sql` on your database
- [ ] Create a check-in task in admin panel
- [ ] Generate QR token for the task
- [ ] Download QR code image
- [ ] Set attraction coordinates (latitude/longitude)
- [ ] Test QR scan on frontend
- [ ] Test check-in with correct location
- [ ] Test check-in with incorrect location (should fail)
- [ ] Test that other tasks are blocked without check-in
- [ ] Test that other tasks are accessible after check-in

## Troubleshooting

### "Location permission denied"
- User must grant location permission in browser/device settings

### "You must be within 100m of the attraction"
- Verify attraction has correct latitude/longitude set
- Check user's actual GPS location
- Adjust proximity radius if needed

### "QR code invalid"
- Ensure QR token matches the one in database
- Regenerate QR if needed

### Google Charts API not loading
- Check internet connection
- Google Charts API is free and no API key required
- Alternative: implement server-side QR generation with a PHP library

## Files Modified/Created

### Created:
- `admin/database_updates.sql`
- `backend/utils/qrcode.php`
- `backend/api/qr/generate.php`
- `backend/api/tasks/check-prerequisite.php`
- `admin/api/generate_qr_token.php`
- `QR_CHECKIN_IMPLEMENTATION.md`

### Modified:
- `admin/index.html` - Added QR UI elements
- `admin/javascript/main.js` - Added QR generation functions
- `backend/api/tasks/submit-checkin.php` - Added geolocation validation
- `frontend/src/components/tasks/CheckinTask.jsx` - Added geolocation capture
- `frontend/src/api/tasks.js` - Updated API calls

## Next Steps (Optional Enhancements)

1. **Task Ordering:** Implement strict task sequence enforcement
2. **QR Expiration:** Add expiration dates to QR tokens
3. **Offline QR Generation:** Add PHP library for server-side QR generation
4. **Admin QR Preview:** Show QR in admin task list
5. **Bulk QR Download:** Download all QR codes for an attraction at once
6. **Location History:** Track all check-in attempts (success and failures)
7. **Push Notifications:** Notify admins of check-ins in real-time

## Support

For issues or questions, check:
1. Browser console for JavaScript errors
2. PHP error logs for backend issues
3. Network tab for API call failures
4. Database for data integrity
