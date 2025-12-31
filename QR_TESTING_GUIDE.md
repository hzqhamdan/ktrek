# QR Check-in Testing Guide

## Step-by-Step Testing Instructions

### Phase 1: Database Setup (5 minutes)

1. **Run the database updates:**
   ```bash
   # Option A: Using command line
   mysql -u root -p kelantan_explorer < admin/database_updates.sql
   
   # Option B: Using phpMyAdmin
   # - Open phpMyAdmin
   # - Select your database
   # - Click "Import" tab
   # - Choose admin/database_updates.sql
   # - Click "Go"
   
   # Option C: Using MySQL Workbench
   # - Open the SQL file
   # - Execute all statements
   ```

2. **Verify the updates worked:**
   ```sql
   -- Check attractions table has new columns
   DESCRIBE attractions;
   -- Should see: latitude, longitude columns
   
   -- Check user_task_submissions table
   DESCRIBE user_task_submissions;
   -- Should see: latitude, longitude columns
   
   -- Check tasks table
   DESCRIBE tasks;
   -- Should see: task_order column
   ```

### Phase 2: Setup Test Data (10 minutes)

#### 2.1 Set Attraction Coordinates

1. Go to Admin Panel → Attractions
2. Edit an existing attraction (or create a new one)
3. Add coordinates for a location you can physically visit:

   **Example Test Locations:**
   - Your office/home: Use Google Maps → Right-click → Copy coordinates
   - Public landmark: Search on Google Maps → Copy coordinates
   
   **Format:** 
   - Latitude: 6.1254 (example for Kelantan)
   - Longitude: 102.2381

   **To get your current location:**
   - Open https://www.latlong.net/
   - Click "Get Location" 
   - Copy the coordinates
   
4. Save the attraction

#### 2.2 Create a Check-in Task

1. Go to Admin Panel → Tasks → Add Task
2. Fill in:
   - **Name:** "Check-in at [Attraction Name]"
   - **Attraction:** Select the attraction you just updated
   - **Type:** Check-in (important!)
   - **Description:** "Scan the QR code at the location to check in"
   
3. Click **"Generate QR Token"** button
   - You should see a QR code preview appear
   - The "Download QR Code" button should become enabled
   
4. Click **"Download QR Code"**
   - A PNG file will download
   - File name: `qr_Check-in_at_[name]_[timestamp].png`
   
5. Click **"Save"** to save the task

#### 2.3 Create Additional Tasks (for testing prerequisites)

1. Create a Photo task for the same attraction
2. Create a Quiz task for the same attraction
3. These will be blocked until check-in is completed

### Phase 3: Desktop Testing (Without Physical Location) (5 minutes)

**Purpose:** Test the UI flow without needing to be at the location

#### 3.1 Test Admin Panel

1. **Verify QR in task list:**
   - Go to Tasks section
   - Find your check-in task
   - Click "Edit"
   - Verify QR code token is shown
   - Verify QR preview loads

2. **Test QR download:**
   - Click "Download QR Code"
   - Open the downloaded PNG
   - Try scanning it with your phone (should show the token string)

#### 3.2 Test Frontend (Browser Location Override)

**Using Chrome DevTools:**

1. Open your frontend app in Chrome
2. Press F12 → Open DevTools
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Sensors" → Select "Show Sensors"
5. In Sensors tab → Location dropdown → Select "Custom location"
6. Enter the SAME coordinates you set for the attraction
7. Navigate to the check-in task
8. Try to check in → Should succeed!

**Using Firefox:**

1. Type `about:config` in address bar
2. Search for `geo.enabled` → Make sure it's `true`
3. Install extension: "Location Guard" 
4. Set fixed location to match attraction coordinates
5. Test check-in

### Phase 4: Real-World Testing (20 minutes)

**You'll need:**
- Smartphone with camera
- Printed QR code (or display on another screen)
- To be within 100m of the attraction coordinates

#### 4.1 Print the QR Code

1. Print the downloaded QR code PNG
2. Or display it on a tablet/laptop screen

#### 4.2 Test Location Permission Flow

1. **Open app on mobile device**
2. Navigate to the attraction page
3. Look for the check-in task
4. Click "Scan QR" (or navigate to check-in task)

**Expected: Location permission prompt**
- If denied → Should show error message
- If allowed → Continue to next step

#### 4.3 Test QR Scanning

1. **Scan the QR code** with the app
   - Should verify the task
   - Should navigate to check-in page

2. **Click "Check In Now"**
   
   **If you're AT the location (within 100m):**
   - ✅ Check-in succeeds
   - Shows success message
   - Task marked as complete
   
   **If you're NOT at the location (>100m away):**
   - ❌ Check-in fails
   - Shows: "You must be within 100m of the attraction. You are [distance]m away."

#### 4.4 Test Task Prerequisites

1. After successful check-in, try to access other tasks
   - Photo task → Should be accessible
   - Quiz task → Should be accessible

2. Create a new user account (or logout/clear data)
3. Try to access photo/quiz tasks WITHOUT checking in first
   - Should be blocked
   - Should show: "You must complete check-in first"

### Phase 5: Edge Case Testing (10 minutes)

#### Test Case 1: No GPS Signal
1. Turn on airplane mode
2. Try to check in
3. Expected: "Unable to get your location" error

#### Test Case 2: GPS Permission Denied
1. Go to browser settings → Deny location for the site
2. Try to check in
3. Expected: "Please enable location permissions" error

#### Test Case 3: Duplicate Check-in
1. Complete check-in successfully
2. Try to check in again
3. Expected: "Already checked in to this task" error

#### Test Case 4: Invalid QR Code
1. Generate a QR code with random text (not from system)
2. Scan it
3. Expected: "Invalid QR code" error

#### Test Case 5: Task Without Attraction Coordinates
1. Create attraction without lat/lng
2. Create check-in task for it
3. Try to check in
4. Expected: Should skip location validation (or show warning)

#### Test Case 6: Extremely Slow GPS
1. Test indoors or in poor GPS area
2. Try to check in
3. Expected: 10-second timeout → error message

### Phase 6: Admin Verification (5 minutes)

#### Check Stored Data

```sql
-- View check-in submissions with location data
SELECT 
    uts.id,
    u.full_name as user,
    t.name as task,
    uts.latitude,
    uts.longitude,
    uts.submitted_at
FROM user_task_submissions uts
JOIN users u ON uts.user_id = u.id
JOIN tasks t ON uts.task_id = t.id
WHERE t.type = 'checkin'
ORDER BY uts.submitted_at DESC;

-- Calculate distance from attraction for each check-in
SELECT 
    u.full_name,
    t.name as task,
    a.name as attraction,
    uts.latitude as user_lat,
    uts.longitude as user_lng,
    a.latitude as attraction_lat,
    a.longitude as attraction_lng,
    (
        6371000 * acos(
            cos(radians(a.latitude)) * 
            cos(radians(uts.latitude)) * 
            cos(radians(uts.longitude) - radians(a.longitude)) + 
            sin(radians(a.latitude)) * 
            sin(radians(uts.latitude))
        )
    ) as distance_meters
FROM user_task_submissions uts
JOIN users u ON uts.user_id = u.id
JOIN tasks t ON uts.task_id = t.id
JOIN attractions a ON t.attraction_id = a.id
WHERE t.type = 'checkin'
ORDER BY uts.submitted_at DESC;
```

## Quick Test Checklist

- [ ] Database updated successfully
- [ ] Attraction has latitude/longitude set
- [ ] Check-in task created with type='checkin'
- [ ] QR token generated
- [ ] QR code downloaded and readable
- [ ] QR scan redirects to check-in task
- [ ] Location permission prompt appears
- [ ] Check-in succeeds when at location
- [ ] Check-in fails when far from location (shows distance)
- [ ] Other tasks blocked before check-in
- [ ] Other tasks accessible after check-in
- [ ] Duplicate check-in prevented
- [ ] Location data stored in database
- [ ] Admin can download QR anytime

## Troubleshooting Common Issues

### Issue: "QR token not generating"
**Solution:**
- Check browser console for errors
- Ensure crypto API is available (requires HTTPS or localhost)
- Check `admin/api/generate_qr_token.php` exists and is executable

### Issue: "Check-in always fails with location error"
**Solution:**
- Verify attraction has lat/lng set
- Check user granted location permission
- Test with Chrome DevTools location override
- Check browser console for actual error message

### Issue: "QR code image not loading"
**Solution:**
- Check internet connection (uses Google Charts API)
- Verify QR token exists in database
- Try regenerating the token

### Issue: "Frontend can't capture location"
**Solution:**
- Ensure HTTPS or localhost (geolocation requires secure context)
- Check browser location settings
- Try different browser
- Check mobile GPS is enabled

### Issue: "Always says too far away even when at location"
**Solution:**
- Verify GPS accuracy on phone (should be <50m accuracy)
- Wait for GPS to stabilize (may take 30 seconds)
- Check attraction coordinates are correct
- Try adjusting proximity radius in code (100m default)

### Issue: "Other tasks not blocking before check-in"
**Solution:**
- Check `backend/api/tasks/check-prerequisite.php` exists
- Implement frontend UI to call this endpoint before showing tasks
- Verify task.type === 'checkin' in database

## Mock Testing Tool

For testing without physical location, use this bookmarklet:

```javascript
// Mock Geolocation Bookmarklet
javascript:(function(){
  var lat = prompt('Enter latitude:', '6.1254');
  var lng = prompt('Enter longitude:', '102.2381');
  navigator.geolocation.getCurrentPosition = function(success){
    success({
      coords: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        accuracy: 10
      }
    });
  };
  alert('Location mocked to: ' + lat + ', ' + lng);
})();
```

**How to use:**
1. Create a new bookmark in your browser
2. Set the URL to the code above
3. Click the bookmark when on the frontend
4. Enter test coordinates
5. Try check-in → will use mocked location

## Success Criteria

Your implementation is working correctly when:

✅ Admin can generate unique QR tokens for check-in tasks
✅ QR codes download as printable PNG files  
✅ Users at the location (within 100m) can successfully check in
✅ Users far from location (>100m) get rejected with distance shown
✅ Location data is stored with each check-in submission
✅ Users cannot complete other tasks before check-in
✅ Users cannot check in twice to the same task
✅ Clear error messages for permission/GPS issues

## Performance Expectations

- QR generation: < 1 second
- QR download: < 2 seconds
- GPS acquisition: 2-10 seconds (depends on signal)
- Check-in validation: < 1 second
- Task prerequisite check: < 0.5 seconds

## Need Help?

Check the implementation docs: `QR_CHECKIN_IMPLEMENTATION.md`
