<?php
// Debug script to check provider mapping
session_start();
require_once 'config.php';

echo "<h2>Provider Debug Information</h2>";

// Check session
echo "<h3>Session Data:</h3>";
echo "Admin ID: " . ($_SESSION['admin_id'] ?? 'NOT SET') . "<br>";
echo "Admin Role: " . ($_SESSION['admin_role'] ?? 'NOT SET') . "<br>";
echo "Provider ID (session): " . ($_SESSION['provider_id'] ?? 'NOT SET') . "<br>";

// Get provider ID using function
$providerId = getAdminProviderId();
echo "Provider ID (function): " . ($providerId ?? 'NULL') . "<br>";

echo "<hr>";

// Check admin_provider_mapping
$conn = getDBConnection();
$adminId = $_SESSION['admin_id'] ?? 0;

echo "<h3>Admin-Provider Mapping:</h3>";
$stmt = $conn->prepare("SELECT * FROM admin_provider_mapping WHERE admin_id = ?");
$stmt->bind_param('i', $adminId);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "Mapping exists!<br>";
    echo "Admin ID: " . $row['admin_id'] . "<br>";
    echo "Provider ID: " . $row['provider_id'] . "<br>";
} else {
    echo "<strong style='color:red;'>NO MAPPING FOUND for admin_id: $adminId</strong><br>";
}

$stmt->close();

echo "<hr>";

// Check recommendations
echo "<h3>Your Recommendations:</h3>";
if ($providerId) {
    $stmt = $conn->prepare("SELECT recommendation_id, user_id, title, status FROM clinical_recommendations WHERE provider_id = ?");
    $stmt->bind_param('i', $providerId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>User ID</th><th>Title</th><th>Status</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['recommendation_id'] . "</td>";
        echo "<td>" . $row['user_id'] . "</td>";
        echo "<td>" . $row['title'] . "</td>";
        echo "<td>" . $row['status'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    $stmt->close();
} else {
    echo "<strong style='color:red;'>Provider ID is NULL - cannot fetch recommendations</strong>";
}

$conn->close();

echo "<hr>";
echo "<p><strong>Delete this file after debugging!</strong></p>";
?>
