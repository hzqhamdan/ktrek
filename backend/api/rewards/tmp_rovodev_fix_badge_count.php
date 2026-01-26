<?php
require_once '../../config/database.php';

header('Content-Type: text/plain');

$userId = 5;

$database = new Database();
$db = $database->getConnection();

echo "=== FIXING BADGE COUNT FOR USER $userId ===\n\n";

try {
    // Count actual badges in user_rewards
    $query = "SELECT COUNT(*) as count, 
              GROUP_CONCAT(reward_name SEPARATOR ', ') as badge_names
              FROM user_rewards 
              WHERE user_id = :user_id AND reward_type = 'badge'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $actualBadgeCount = $result['count'];
    
    echo "Actual badges in user_rewards (type='badge'): $actualBadgeCount\n";
    echo "Badge names: " . ($result['badge_names'] ?? 'none') . "\n\n";
    
    // Also check if there are rewards with other reward_types
    $query = "SELECT reward_type, COUNT(*) as count 
              FROM user_rewards 
              WHERE user_id = :user_id 
              GROUP BY reward_type";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $breakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Breakdown by reward_type:\n";
    foreach ($breakdown as $row) {
        echo "  {$row['reward_type']}: {$row['count']}\n";
    }
    echo "\n";
    
    // Get current user_stats
    $query = "SELECT total_badges, total_titles FROM user_stats WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Current user_stats:\n";
    echo "  total_badges: {$stats['total_badges']}\n";
    echo "  total_titles: {$stats['total_titles']}\n\n";
    
    // Update if needed
    if ($stats['total_badges'] != $actualBadgeCount) {
        echo "⚠️ MISMATCH DETECTED! Updating...\n";
        $query = "UPDATE user_stats 
                  SET total_badges = :badge_count, 
                      updated_at = NOW() 
                  WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':badge_count', $actualBadgeCount);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        echo "✅ Updated total_badges from {$stats['total_badges']} to $actualBadgeCount\n";
    } else {
        echo "✅ Badge count is already correct!\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
