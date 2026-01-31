# QR Code URL Fix Summary

## Problem
The QR codes generated for Check-In tasks were using `http://localhost:5173` instead of the deployed Vercel URL `https://ktrek.vercel.app`.

## Root Cause
The `showQRPreview()` function in `admin/javascript/main.js` was hardcoded to use localhost as a fallback when generating QR code deep links.

## Solution Applied

### File Changed: `admin/javascript/main.js`

**Before:**
```javascript
// If task is saved, create a deep link
if (taskId) {
    // Get the frontend URL - adjust this for your environment
    let appUrl = window.location.origin;
    
    // Development: Replace localhost with network IP for mobile access
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
        // Option 1: Use your computer's IP address (works on same network)
        // Get IP from user or use stored value
        const savedIP = localStorage.getItem('frontend_ip');
        if (savedIP) {
            appUrl = `http://${savedIP}:5173`;
        } else {
            // Fallback: use localhost (you can manually set IP)
            appUrl = 'http://localhost:5173';
            
            // Show warning to set IP
            console.warn('For mobile access, set your IP: localStorage.setItem("frontend_ip", "192.168.X.X")');
        }
    }
```

**After:**
```javascript
// If task is saved, create a deep link
if (taskId) {
    // Use deployed frontend URL (Vercel)
    let appUrl = 'https://ktrek.vercel.app';
    
    // Allow override via localStorage for testing
    const customUrl = localStorage.getItem('frontend_url');
    if (customUrl) {
        appUrl = customUrl;
        console.log('Using custom frontend URL:', appUrl);
    }
```

## Testing Instructions

### 1. Clear Browser Cache
Since JavaScript files are cached, you need to clear your browser cache or do a hard refresh:
- **Chrome/Edge**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

### 2. Generate a New QR Code
1. Log into the admin panel
2. Go to the **Tasks** section
3. Edit an existing Check-In task or create a new one
4. Click the **"Generate QR Token"** button
5. The QR code preview should now show a URL like:
   ```
   https://ktrek.vercel.app/qr-checkin?code=TOKEN&task=TASK_ID
   ```

### 3. Download and Test the QR Code
1. Click **"Download QR Code"** button
2. Scan the QR code with your mobile device
3. It should open your app at: `https://ktrek.vercel.app`

### 4. Verify the QR Info Text
Below the QR code preview, you should see:
```
✅ Scannable QR: https://ktrek.vercel.app/qr-checkin?code=...&task=...
```

## Optional: Testing with Custom URL

If you need to test with a different URL (e.g., for staging), you can set a custom URL in the browser console:

```javascript
// Set custom frontend URL
localStorage.setItem('frontend_url', 'https://your-staging-url.vercel.app');

// To revert to default (production)
localStorage.removeItem('frontend_url');
```

## Additional Configuration Already in Place

The following files already have the correct Vercel URL configured:
- ✅ `backend/config/email-config.php` - Contains `APP_URL = 'https://ktrek.vercel.app'`

## Backend Configuration

Your backend is using ngrok: `https://idiocratically-doddered-brittaney.ngrok-free.dev`

This is already configured correctly and doesn't need changes for QR code functionality.

## What Happens When Users Scan the QR Code

1. User scans QR code with their mobile device
2. QR code contains: `https://ktrek.vercel.app/qr-checkin?code=TOKEN&task=TASK_ID`
3. Opens the K-Trek app (deployed on Vercel)
4. App reads the `code` and `task` parameters from URL
5. App calls your ngrok backend API to verify and complete check-in
6. User successfully checks in to the attraction

## Files Modified
- `admin/javascript/main.js` - Updated `showQRPreview()` function

## Files Not Modified (Already Correct)
- `backend/config/email-config.php` - Already has correct APP_URL
- `backend/api/qr/generate.php` - Works correctly (generates tokens only)
- `backend/api/qr/verify-qr.php` - Works correctly (verifies tokens)
- `backend/api/tasks/submit-checkin.php` - Works correctly (processes check-ins)

---

**Note**: If you update your Vercel deployment URL in the future, you only need to update:
1. The `appUrl` value in `admin/javascript/main.js` (line ~4940)
2. The `APP_URL` constant in `backend/config/email-config.php` (line 21)
