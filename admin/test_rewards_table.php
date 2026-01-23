<?php
// Test script to check rewards table structure
require_once 'config.php';

$conn = getDBConnection();

echo "<h2>Checking rewards table structure...</h2>";

// Check if table exists
$result = $conn->query("SHOW TABLES LIKE 'rewards'");
if ($result->num_rows === 0) {
    echo "<p style='color: red;'>❌ ERROR: 'rewards' table does not exist!</p>";
    exit();
}
echo "<p style='color: green;'>✓ 'rewards' table exists</p>";

// Check table structure
echo "<h3>Current columns in rewards table:</h3>";
$result = $conn->query("DESCRIBE rewards");
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['Field']}</td>";
    echo "<td>{$row['Type']}</td>";
    echo "<td>{$row['Null']}</td>";
    echo "<td>{$row['Key']}</td>";
    echo "<td>{$row['Default']}</td>";
    echo "<td>{$row['Extra']}</td>";
    echo "</tr>";
}
echo "</table>";

// Check which columns are missing
$required_columns = [
    'id', 'attraction_id', 'reward_type', 'reward_identifier', 'title', 
    'description', 'image', 'category', 'rarity', 'trigger_type', 
    'trigger_condition', 'xp_amount', 'ep_amount', 'is_active', 'created_at', 'updated_at'
];

echo "<h3>Column Check:</h3>";
$result = $conn->query("DESCRIBE rewards");
$existing_columns = [];
while ($row = $result->fetch_assoc()) {
    $existing_columns[] = $row['Field'];
}

echo "<ul>";
foreach ($required_columns as $col) {
    if (in_array($col, $existing_columns)) {
        echo "<li style='color: green;'>✓ {$col}</li>";
    } else {
        echo "<li style='color: red;'>❌ {$col} - MISSING!</li>";
    }
}
echo "</ul>";

// Check if we have any data
$result = $conn->query("SELECT COUNT(*) as count FROM rewards");
$count_row = $result->fetch_assoc();
echo "<h3>Table Data:</h3>";
echo "<p>Total rewards in table: <strong>{$count_row['count']}</strong></p>";

// Test a simple query
echo "<h3>Testing Query:</h3>";
try {
    $stmt = $conn->prepare("SELECT r.*, a.name as attraction_name FROM rewards r LEFT JOIN attractions a ON r.attraction_id = a.id ORDER BY r.id DESC LIMIT 5");
    $stmt->execute();
    $result = $stmt->get_result();
    
    echo "<p style='color: green;'>✓ Query executed successfully</p>";
    echo "<p>Sample rewards (max 5):</p>";
    
    if ($result->num_rows > 0) {
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>ID</th><th>Title</th><th>Type</th><th>Rarity</th><th>Active</th></tr>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>{$row['id']}</td>";
            echo "<td>{$row['title']}</td>";
            echo "<td>" . ($row['reward_type'] ?? 'NULL') . "</td>";
            echo "<td>" . ($row['rarity'] ?? 'NULL') . "</td>";
            echo "<td>" . ($row['is_active'] ?? 'NULL') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No rewards found in table.</p>";
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Query failed: " . $e->getMessage() . "</p>";
}

$conn->close();
?>
