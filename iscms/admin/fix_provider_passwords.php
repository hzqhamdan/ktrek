<?php
// Fix Healthcare Provider Admin Passwords
// Run this once to set the correct password for provider accounts

require_once 'config.php';

$conn = getDBConnection();

// Password to set
$password = 'provider123';
$passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

echo "<h2>Fixing Healthcare Provider Passwords</h2>";
echo "<p>Setting password to: <strong>provider123</strong></p>";
echo "<p>Password hash: " . substr($passwordHash, 0, 30) . "...</p><br>";

// Update all Healthcare Provider admin accounts
$emails = [
    'dr.ahmad.admin@hkl.gov.my',
    'dr.siti.admin@ummc.edu.my',
    'dr.lee.admin@gleneagles.com.my'
];

foreach ($emails as $email) {
    $stmt = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE email = ?");
    $stmt->bind_param("ss", $passwordHash, $email);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo "✅ Updated password for: <strong>$email</strong><br>";
        } else {
            echo "⚠️ Account not found: <strong>$email</strong><br>";
        }
    } else {
        echo "❌ Error updating: <strong>$email</strong><br>";
    }
    
    $stmt->close();
}

$conn->close();

echo "<br><h3>✅ Done!</h3>";
echo "<p>You can now login with:</p>";
echo "<ul>";
echo "<li>Email: dr.ahmad.admin@hkl.gov.my | Password: provider123</li>";
echo "<li>Email: dr.siti.admin@ummc.edu.my | Password: provider123</li>";
echo "<li>Email: dr.lee.admin@gleneagles.com.my | Password: provider123</li>";
echo "</ul>";
echo "<p><strong>Delete this file after running it!</strong></p>";
?>
