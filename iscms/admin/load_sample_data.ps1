# PowerShell Script to Load iSCMS Sample Data
# Run this script from the admin directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iSCMS Sample Data Loader" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get database credentials
Write-Host "Please enter your MySQL credentials:" -ForegroundColor Green
$dbHost = Read-Host "Database Host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbUser = Read-Host "Database Username (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "root" }

$dbPassword = Read-Host "Database Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

$dbName = Read-Host "Database Name (default: iscms_db)"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "iscms_db" }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Loading sample data..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if mysql command is available
try {
    $mysqlVersion = mysql --version 2>&1
    Write-Host "✓ MySQL client found: $mysqlVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ MySQL client not found in PATH" -ForegroundColor Red
    Write-Host "Please ensure MySQL is installed and added to your PATH" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Load the master script
Write-Host ""
Write-Host "Loading LOAD_SAMPLE_DATA.sql..." -ForegroundColor Yellow

$command = "mysql -h $dbHost -u $dbUser -p$dbPasswordPlain $dbName"
$scriptPath = "LOAD_SAMPLE_DATA.sql"

if (Test-Path $scriptPath) {
    try {
        Get-Content $scriptPath | & mysql -h $dbHost -u $dbUser -p$dbPasswordPlain $dbName
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "✓ Sample Data Loaded Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Yellow
        Write-Host "  1. Login to the admin panel" -ForegroundColor White
        Write-Host "  2. Test Device Management" -ForegroundColor White
        Write-Host "  3. View Enhanced User Profiles" -ForegroundColor White
        Write-Host "  4. Generate Reports" -ForegroundColor White
        Write-Host ""
        Write-Host "Sample users created:" -ForegroundColor Green
        Write-Host "  - ahmad.abdullah@email.com (Healthy, CGM + Scale)" -ForegroundColor White
        Write-Host "  - siti.nurhaliza@email.com (Pre-diabetic, CGM + Scale)" -ForegroundColor White
        Write-Host "  - tan.weiming@email.com (Type 2 Diabetes, CGM + Scale)" -ForegroundColor White
        Write-Host "  - And 7 more users..." -ForegroundColor White
        Write-Host ""
        Write-Host "Check SAMPLE_DATA_INSTRUCTIONS.md for details!" -ForegroundColor Cyan
        Write-Host ""
        
    } catch {
        Write-Host ""
        Write-Host "✗ Error loading sample data:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "✗ Error: LOAD_SAMPLE_DATA.sql not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the admin directory" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to exit"
