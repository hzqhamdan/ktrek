# PowerShell Script to Load All Sample Data for iSCMS Admin Panel
# This script will load food database, alerts, and notifications

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "iSCMS Admin Panel - Sample Data Loader" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get database credentials
Write-Host "Please enter your MySQL credentials:" -ForegroundColor Yellow
$dbUser = Read-Host "MySQL Username (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

$dbName = Read-Host "Database Name (default: iscms_db)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "iscms_db"
}

Write-Host ""
Write-Host "You will be prompted for the MySQL password for each script..." -ForegroundColor Yellow
Write-Host ""

# Function to run SQL script
function Run-SQLScript {
    param (
        [string]$ScriptName,
        [string]$Description
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Loading: $Description" -ForegroundColor Green
    Write-Host "Script: $ScriptName" -ForegroundColor Gray
    Write-Host ""
    
    $scriptPath = Join-Path $PSScriptRoot $ScriptName
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "❌ ERROR: Script not found at $scriptPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $mysqlCmd = "mysql -u $dbUser -p $dbName"
        Get-Content $scriptPath | mysql -u $dbUser -p $dbName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SUCCESS: $Description loaded successfully!" -ForegroundColor Green
            Write-Host ""
            return $true
        } else {
            Write-Host "❌ ERROR: Failed to load $Description" -ForegroundColor Red
            Write-Host ""
            return $false
        }
    }
    catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Step 1: Verify current data
Write-Host "STEP 1: Verifying current data status..." -ForegroundColor Cyan
Write-Host ""
$verify1 = Run-SQLScript "verify_all_data.sql" "Data Verification (Before)"

Start-Sleep -Seconds 2

# Step 2: Load food database
Write-Host "STEP 2: Loading Food Database..." -ForegroundColor Cyan
Write-Host ""
$food = Run-SQLScript "sample_food_database.sql" "Food Database (60+ items)"

Start-Sleep -Seconds 2

# Step 3: Load alerts and notifications
Write-Host "STEP 3: Loading Alerts & Notifications..." -ForegroundColor Cyan
Write-Host ""
$alerts = Run-SQLScript "sample_alerts_notifications.sql" "Alerts & Notifications (50+ records)"

Start-Sleep -Seconds 2

# Step 4: Verify after loading
Write-Host "STEP 4: Verifying data after loading..." -ForegroundColor Cyan
Write-Host ""
$verify2 = Run-SQLScript "verify_all_data.sql" "Data Verification (After)"

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($food -and $alerts) {
    Write-Host "✅ All sample data loaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was loaded:" -ForegroundColor Yellow
    Write-Host "  ✅ Food Database: 60+ food items" -ForegroundColor White
    Write-Host "     - 25+ Malaysian foods" -ForegroundColor Gray
    Write-Host "     - 35+ common foods" -ForegroundColor Gray
    Write-Host "     - Complete nutritional data" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ✅ Alerts & Notifications: 50+ records" -ForegroundColor White
    Write-Host "     - 35+ user alerts" -ForegroundColor Gray
    Write-Host "     - 15+ notification history" -ForegroundColor Gray
    Write-Host "     - Varied severity levels" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Open your Admin Panel in browser" -ForegroundColor White
    Write-Host "  2. Refresh the page (Ctrl+F5)" -ForegroundColor White
    Write-Host "  3. Check Food Database section - stats should show numbers" -ForegroundColor White
    Write-Host "  4. Check Alerts & Notifications - should have data" -ForegroundColor White
    Write-Host "  5. Test Content Management search bar" -ForegroundColor White
} else {
    Write-Host "⚠️ Some scripts failed to load!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please check the error messages above and:" -ForegroundColor White
    Write-Host "  1. Verify MySQL credentials are correct" -ForegroundColor White
    Write-Host "  2. Ensure database '$dbName' exists" -ForegroundColor White
    Write-Host "  3. Check if you have permission to insert data" -ForegroundColor White
    Write-Host "  4. Try running scripts individually" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
