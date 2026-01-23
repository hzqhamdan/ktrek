<?php
// iSCMS Admin Panel - Setup Default Admin User
// Run this file once to create the default superadmin account

require_once 'config.php';

$conn = getDBConnection();

// Default admin credentials
$email = 'admin@iscms.com';
$password = 'admin123'; // Change this after first login!
$fullName = 'System Administrator';
$role = 'Superadmin';

// Check if admin already exists
$checkStmt = $conn->prepare("SELECT admin_id FROM admin_users WHERE email = ?");
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows > 0) {
    echo "Admin user already exists!<br>";
    echo "Email: $email<br>";
    $checkStmt->close();
    $conn->close();
    exit();
}

$checkStmt->close();

// Create admin user
$passwordHash = hashPassword($password);

$stmt = $conn->prepare("
    INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
    VALUES (?, ?, ?, ?, 1)
");

$stmt->bind_param("ssss", $email, $passwordHash, $fullName, $role);

if ($stmt->execute()) {
    echo "<h2>✅ Default Admin User Created Successfully!</h2>";
    echo "<p><strong>Email:</strong> $email</p>";
    echo "<p><strong>Password:</strong> $password</p>";
    echo "<p><strong>Role:</strong> $role</p>";
    echo "<hr>";
    echo "<p style='color: red;'><strong>⚠️ IMPORTANT: Please change the password after first login!</strong></p>";
    echo "<p><a href='login.php'>Go to Login Page</a></p>";
    
    // Insert some default system settings
    $settingsToInsert = [
        ['default_sugar_limit_healthy', '50', 'Number', 'Limits', 'Default daily sugar limit for healthy users (grams)'],
        ['default_sugar_limit_prediabetic', '40', 'Number', 'Limits', 'Default daily sugar limit for pre-diabetic users (grams)'],
        ['default_sugar_limit_diabetic', '30', 'Number', 'Limits', 'Default daily sugar limit for diabetic users (grams)'],
        ['alert_threshold_warning', '80', 'Number', 'Alerts', 'Warning alert at this percentage of daily limit'],
        ['alert_threshold_danger', '100', 'Number', 'Alerts', 'Danger alert at this percentage of daily limit'],
        ['system_name', 'iSCMS', 'String', 'General', 'System name'],
        ['system_timezone', 'Asia/Kuala_Lumpur', 'String', 'General', 'System timezone']
    ];
    
    $settingStmt = $conn->prepare("
        INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_editable)
        VALUES (?, ?, ?, ?, ?, 1)
    ");
    
    foreach ($settingsToInsert as $setting) {
        $settingStmt->bind_param("sssss", $setting[0], $setting[1], $setting[2], $setting[3], $setting[4]);
        $settingStmt->execute();
    }
    
    $settingStmt->close();
    echo "<p>✅ Default system settings created.</p>";
    
} else {
    echo "<h2>❌ Error creating admin user</h2>";
    echo "<p>" . $stmt->error . "</p>";
}

$stmt->close();
$conn->close();
?>
