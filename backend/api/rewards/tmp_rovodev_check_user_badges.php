<?php
require_once '../../config/database.php';

header('Content-Type: text/plain');

$userId = 5;

$database = new Database();
$db = $database->getConnection();

echo "=== CHECKING BADGES FOR USER $userId ===\n\n";

// Check user_rewards table for badges
$query = "SELECT ur.*, r.name as reward_name, r.type, r.rarity
          FROM user_rewards ur
          JOIN rewards r ON ur.reward_id = r.id
          WHERE ur.user_id = :user_id AND r.type = 'badge'
          ORDER BY ur.unlocked_at DESC";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $userId);
$stmt->execute();
$badges = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Badges in user_rewards table: " . count($badges) . "\n\n";
foreach ($badges as $badge) {
    echo "- {$badge['reward_name']} ({$badge['rarity']}) - Unlocked: {$badge['unlocked_at']}\n";
}

// Check user_stats
$query = "SELECT total_badges FROM user_stats WHERE user_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $userId);
$stmt->execute();
$stats = $stmt->fetch(PDO::FETCH_ASSOC);

echo "\nuser_stats.total_badges: " . ($stats['total_badges'] ?? 'NULL') . "\n";

// Check if there's a mismatch
$actualCount = count($badges);
$statsCount = $stats['total_badges'] ?? 0;

if ($actualCount != $statsCount) {
    echo "\n⚠️ MISMATCH DETECTED!\n";
    echo "Actual badges in user_rewards: $actualCount\n";
    echo "user_stats.total_badges: $statsCount\n";
    echo "\nThis needs to be updated!\n";
} else {
    echo "\n✅ Counts match!\n";
}
?>
