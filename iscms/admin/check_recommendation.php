<?php
// Check which recommendation is failing
session_start();
require_once 'config.php';

$recommendationId = isset($_GET['id']) ? intval($_GET['id']) : 1;

echo "<h2>Checking Recommendation #$recommendationId</h2>";

$conn = getDBConnection();

// Check the recommendation
$stmt = $conn->prepare("SELECT * FROM clinical_recommendations WHERE recommendation_id = ?");
$stmt->bind_param('i', $recommendationId);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "<h3>Recommendation Details:</h3>";
    echo "ID: " . $row['recommendation_id'] . "<br>";
    echo "User ID: " . $row['user_id'] . "<br>";
    echo "Provider ID: " . $row['provider_id'] . "<br>";
    echo "Title: " . $row['title'] . "<br>";
    echo "Status: " . $row['status'] . "<br>";
    
    echo "<hr>";
    
    // Check your provider ID
    $providerId = getAdminProviderId();
    echo "<h3>Your Provider ID: " . $providerId . "</h3>";
    
    echo "<hr>";
    
    if ($row['provider_id'] == $providerId) {
        echo "<strong style='color:green;'>✓ YOU OWN THIS RECOMMENDATION - Update should work!</strong>";
    } else {
        echo "<strong style='color:red;'>✗ YOU DO NOT OWN THIS RECOMMENDATION</strong><br>";
        echo "Recommendation provider_id: " . $row['provider_id'] . "<br>";
        echo "Your provider_id: " . $providerId . "<br>";
    }
} else {
    echo "<strong style='color:red;'>Recommendation not found!</strong>";
}

$stmt->close();
$conn->close();

echo "<hr>";
echo "<p>Test different recommendations by changing the URL: ?id=1, ?id=2, etc.</p>";
?>
