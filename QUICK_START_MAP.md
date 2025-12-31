# 🚀 Quick Start Guide - Interactive Map

## ✅ Status: Implementation Complete & Tested!

The interactive map is ready to use. Just follow these 3 simple steps:

---

## Step 1: Database Setup (2 minutes)

### 1.1 Add Columns
Open **PhpMyAdmin** → Select `ktrek_db` → Go to **SQL** tab → Run:

```sql
ALTER TABLE attractions 
ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER location,
ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;
```

### 1.2 Add Sample Coordinates (Optional)
Copy and run the contents of: `admin/sample_kelantan_coordinates.sql`

Or manually add coordinates for your attractions:
```sql
UPDATE attractions SET latitude = 6.1335, longitude = 102.2437 WHERE id = 1;
```

💡 Find coordinates at: https://www.latlong.net/

---

## Step 2: Get Mapbox Token (3 minutes)

### 2.1 Create Account
1. Go to: https://account.mapbox.com/auth/signup/
2. Sign up (free - no credit card required)
3. Verify your email

### 2.2 Copy Token
1. After login, you'll see your dashboard
2. Find **"Default public token"** section
3. Copy the token (starts with `pk.`)

### 2.3 Add to Environment
Open `frontend/.env` and update:
```env
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoieour_actual_token_here
```

---

## Step 3: Test the Map (1 minute)

### Restart Dev Server
```bash
# Stop current server (Ctrl+C)
cd frontend
npm run dev
```

### Visit Homepage
Open: http://localhost:5174 (or 5173)

---

## ✨ What You'll See

- **Big interactive map** on homepage hero section
- **Purple pin markers** for each attraction with coordinates
- **Click marker** → Popup with attraction details
- **"View Details" button** → Navigate to attraction page
- **Zoom controls** in top-right corner
- **Legend** in bottom-left showing attraction count

---

## 🐛 Troubleshooting

### Map not showing?
- ✅ Check Mapbox token is correct in `.env`
- ✅ Restart dev server after changing `.env`
- ✅ Check browser console (F12) for errors

### No markers on map?
- ✅ Run database migration (Step 1.1)
- ✅ Add coordinates to attractions (Step 1.2)
- ✅ Verify attractions table has latitude/longitude columns

### Wrong marker positions?
- ✅ Check lat/lng format: `latitude` (-90 to 90), `longitude` (-180 to 180)
- ✅ For Kelantan: lat around 6.x, lng around 102.x

---

## 📊 Popular Kelantan Coordinates

Copy these for quick testing:

| Attraction | Latitude | Longitude |
|------------|----------|-----------|
| Istana Jahar | 6.1335 | 102.2437 |
| Pantai Cahaya Bulan | 6.1711 | 102.2876 |
| Muzium Negeri Kelantan | 6.1374 | 102.2488 |
| Pasar Siti Khadijah | 6.1329 | 102.2461 |
| Istana Balai Besar | 6.1250 | 102.2381 |

---

## 🎨 Customization

### Change Map Style
Edit `frontend/src/components/map/AttractionMap.jsx` line 31:
```javascript
style: 'mapbox://styles/mapbox/outdoors-v12',
// Options: streets-v12, outdoors-v12, light-v11, dark-v11, satellite-v9
```

### Change Marker Color
Edit line 65 in same file:
```javascript
fill="#8B5CF6"  // Change to any hex color
```

### Change Map Height
Edit line 191:
```javascript
<div className="w-full h-[600px] ...">  // Change from 500px to 600px
```

---

## 📁 Files Created

✅ `frontend/src/components/map/AttractionMap.jsx` - Map component  
✅ `admin/migration_add_coordinates.sql` - Database migration  
✅ `admin/sample_kelantan_coordinates.sql` - Sample data  
✅ `MAP_IMPLEMENTATION_SUMMARY.md` - Full documentation  
✅ `QUICK_START_MAP.md` - This guide  

---

## 🎯 Next Steps (Optional)

After basic setup works, you can:

1. **Admin Panel Integration** - Add lat/lng fields to admin attraction form
2. **More Attractions** - Add coordinates for all your attractions
3. **Custom Styling** - Create your own Mapbox style
4. **Advanced Features** - Add clustering, filters, or routes

---

## 💡 Tips

- **Free Tier**: Mapbox allows 50,000 map loads/month (plenty for development)
- **Testing**: You only need 1-2 attractions with coordinates to see the map working
- **Coordinates**: Use Google Maps or https://www.latlong.net/ to find exact locations
- **Updates**: After changing `.env`, always restart the dev server

---

## 🆘 Need Help?

Check:
- Full documentation: `MAP_IMPLEMENTATION_SUMMARY.md`
- Browser console: Press F12 and check for errors
- Network tab: Verify API calls return latitude/longitude

Common issues:
- Token not working? Make sure it starts with `pk.` and has no extra spaces
- Map blank? Check if attractions have valid coordinates in database
- Markers not clickable? Clear browser cache and refresh

---

**Ready to go! Complete Step 1, 2, and 3 above, and your interactive map will be live! 🎉**
