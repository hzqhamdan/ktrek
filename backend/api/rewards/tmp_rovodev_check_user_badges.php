<?php
require_once '../../config/database.php';

header('Content-Type: text/plain');

$userId = 5;

$database = new Database();
$db = $database->getConnection();

echo "=== CHECKING BADGES FOR USER $userId ===\n\n";

// First, let's check what tables exist
echo "Checking database tables...\n";
$query = "SHOW TABLES LIKE '%reward%'";
$stmt = $db->prepare($query);
$stmt->execute();
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "Tables with 'reward' in name:\n";
foreach ($tables as $table) {
    echo "  - $table\n";
}
echo "\n";

// Check if user_rewards exists
if (in_array('user_rewards', $tables)) {
    echo "Checking user_rewards table...\n";
    $query = "DESCRIBE user_rewards";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Columns: ";
    foreach ($columns as $col) {
        echo $col['Field'] . ", ";
    }
    echo "\n\n";
    
    // Count badges
    $query = "SELECT COUNT(*) as count FROM user_rewards WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total rewards in user_rewards: {$result['count']}\n\n";
}

// Check user_stats
$query = "SELECT total_badges, total_titles FROM user_stats WHERE user_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $userId);
$stmt->execute();
$stats = $stmt->fetch(PDO::FETCH_ASSOC);

echo "user_stats data:\n";
echo "  total_badges: " . ($stats['total_badges'] ?? 'NULL') . "\n";
echo "  total_titles: " . ($stats['total_titles'] ?? 'NULL') . "\n";
?>
