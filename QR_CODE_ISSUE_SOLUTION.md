# 🔧 QR Code "Invalid QR code" Issue - Complete Solution

## Problem
Users get "Invalid QR code" error when scanning QR codes on mobile, even when logged in.

## Root Cause ⭐
**The check-in tasks in your database don't have QR codes generated yet!**

The verification endpoint (`backend/api/qr/verify-qr.php`) searches for tasks with matching QR codes:
```sql
WHERE t.qr_code = :qr_code
```

If the `qr_code` column is NULL or empty, no matches are found → **"Invalid QR code"** error.

---

## 🚀 Quick Fix (5 Minutes)

### Step 1: Generate QR Codes in Database
Run this SQL script in your MySQL database:

```bash
# Open your database and run:
mysql -u root -p ktrek_db < tmp_rovodev_auto_fix_qr_codes.sql
```

Or manually in phpMyAdmin/MySQL Workbench:
```sql
UPDATE tasks 
SET qr_code = LOWER(CONCAT(
    MD5(CONCAT('ktrek_', id, '_', UNIX_TIMESTAMP(), '_', RAND())),
    MD5(CONCAT(name, '_', id, '_', NOW()))
))
WHERE type = 'checkin' 
AND (qr_code IS NULL OR qr_code = '');
```

### Step 2: Set Vercel Environment Variable
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your K-Trek project
3. Go to **Settings → Environment Variables**
4. Add or update:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://idiocratically-doddered-brittaney.ngrok-free.dev/backend/api`
5. **Redeploy** the frontend (important!)

### Step 3: Test the Fix
1. Get a QR code from your database:
   ```sql
   SELECT qr_code FROM tasks WHERE type = 'checkin' LIMIT 1;
   ```
2. Open `tmp_rovodev_test_api.html` in your browser
3. Login to https://ktrek.vercel.app/ first
4. Come back and click "Get Token from K-Trek App"
5. Paste the QR code and click "Verify QR Code"
6. Should see success! ✅

### Step 4: Generate Printable QR Codes
Generate QR code images to print and place at attractions:

**Via Admin Panel:**
- Login to admin panel
- Go to Tasks section
- Click "Generate QR" or "View QR Code" for each task
- Download and print

**Via Direct URL:**
```
https://idiocratically-doddered-brittaney.ngrok-free.dev/backend/api/qr/generate.php?task_id=1
```
(Replace `task_id=1` with your task ID)

---

## 📋 Testing Tools Provided

I've created several tools to help you debug and fix this issue:

### 1. **tmp_rovodev_auto_fix_qr_codes.sql**
Automated SQL script that:
- ✅ Checks current QR code status
- ✅ Lists tasks needing QR codes
- ✅ Auto-generates QR codes for all check-in tasks
- ✅ Provides test QR codes you can use immediately

### 2. **tmp_rovodev_test_api.html**
Interactive web-based testing tool:
- ✅ Test authentication/session
- ✅ Test QR code verification
- ✅ Test API connectivity
- ✅ Debug token issues
- Open in browser and follow instructions

### 3. **tmp_rovodev_check_qr_setup.sql**
Diagnostic queries to check QR code status in database

### 4. **tmp_rovodev_fix_summary.md**
Detailed troubleshooting guide with all possible solutions

---

## 🧪 How to Test

### Test 1: Database Check
```sql
-- Check if QR codes exist
SELECT COUNT(*) FROM tasks WHERE type = 'checkin' AND qr_code IS NOT NULL;
-- Should return > 0
```

### Test 2: API Test with curl
```bash
# Get a QR code from database first
curl -X POST https://idiocratically-doddered-brittaney.ngrok-free.dev/backend/api/qr/verify-qr.php \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"qr_code": "YOUR_QR_CODE_HERE"}'
```

Expected response:
```json
{
  "success": true,
  "message": "QR code verified",
  "data": {
    "task": {
      "id": 1,
      "name": "Check in at Attraction",
      "attraction_name": "Museum",
      ...
    }
  }
}
```

### Test 3: Mobile App Test
1. Login to https://ktrek.vercel.app/
2. Go to an attraction
3. Use "Enter Code Manually" in QR scanner
4. Paste a QR code from database
5. Should verify successfully!

---

## 🎯 Expected Results After Fix

✅ **Database**: All check-in tasks have QR codes  
✅ **API**: QR verification endpoint returns task data  
✅ **Mobile**: QR scanner successfully verifies codes  
✅ **Check-in**: Users can complete check-in tasks  

---

## ⚠️ Important Notes

1. **QR Code Format**: System expects a hex string (64 chars), not a URL
2. **Location Verification**: After QR scan, users still need to be within 100m of attraction (or provide location)
3. **Print QR Codes**: Generate and print QR codes to place at physical locations
4. **Redeploy Frontend**: After changing Vercel env vars, you MUST redeploy

---

## 🐛 Still Having Issues?

### Issue: "Invalid QR code" after running fix
**Solution**: Make sure you're testing with a QR code that's actually in the database. Run:
```sql
SELECT id, name, qr_code FROM tasks WHERE type = 'checkin' LIMIT 5;
```
Copy one of these QR codes exactly.

### Issue: "Network Error" or "Failed to fetch"
**Solution**: 
1. Check ngrok is still running
2. Verify VITE_API_BASE_URL in Vercel matches your current ngrok URL
3. Check browser console for CORS errors

### Issue: "401 Unauthorized"
**Solution**: User must be logged in. Check:
1. Login to https://ktrek.vercel.app/
2. Verify token exists: `localStorage.getItem('token')`
3. Token should be in Authorization header

### Issue: Environment variable not working
**Solution**: After adding/changing env vars in Vercel:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. OR push a new commit to trigger deployment

---

## 📞 Next Steps

After fixing, you should:

1. ✅ Run the SQL fix script
2. ✅ Update Vercel environment variable
3. ✅ Redeploy frontend
4. ✅ Test with manual QR code entry first
5. ✅ Generate printable QR codes
6. ✅ Print and place QR codes at attractions
7. ✅ Test scanning at actual location

---

## 📝 Technical Details

**Files Involved:**
- `backend/api/qr/verify-qr.php` - QR verification endpoint
- `frontend/src/components/qr/QRScannerModal.jsx` - QR scanner UI
- `frontend/src/api/qr.js` - QR API calls
- `backend/config/database.php` - Database connection
- Database table: `tasks` column: `qr_code`

**QR Code Generation:**
- Uses MD5 hash for uniqueness
- 64 character hex string
- Stored in `tasks.qr_code` column
- Only for tasks with `type = 'checkin'`

---

Good luck! The fix should take less than 5 minutes. Let me know if you need any clarification! 🚀
