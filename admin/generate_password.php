<?php
// Password Hash Generator
// Run this file once to generate the correct password hash

$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Password: " . $password . "<br>";
echo "Hash: " . $hash . "<br><br>";

echo "Copy this SQL command and run it in PhpMyAdmin:<br><br>";
echo "<code>UPDATE admin SET password = '" . $hash . "' WHERE email = 'admin@ktrek.com';</code>";
?>