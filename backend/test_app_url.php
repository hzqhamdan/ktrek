<?php
// Test file to check APP_URL value
require_once 'config/email-config.php';

echo "<!DOCTYPE html>";
echo "<html><body>";
echo "<h1>APP_URL Configuration Test</h1>";
echo "<p><strong>Current APP_URL:</strong> " . (defined('APP_URL') ? APP_URL : 'NOT DEFINED') . "</p>";
echo "<p><strong>Expected:</strong> https://ktrek.vercel.app</p>";
echo "<hr>";
echo "<p>If these don't match, the config file isn't being loaded correctly.</p>";
echo "</body></html>";
?>
