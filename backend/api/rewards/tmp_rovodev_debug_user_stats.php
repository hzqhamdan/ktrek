<?php
require_once '../../config/database.php';

header('Content-Type: text/plain');

$database = new Database();
$db = $database->getConnection();

// For debugging, allow passing user_id as query parameter
$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 5;

echo "GET parameter: " . ($_GET['user_id'] ?? 'not set') . "\n";
echo "User ID after intval: $userId\n";
echo "=== DEBUG USER STATS FOR USER $userId ===\n\n";

// Check if user_stats table exists
try {
    $query = "DESCRIBE user_stats";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "user_stats table structure:\n";
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "ERROR: user_stats table doesn't exist or error: " . $e->getMessage() . "\n\n";
}

// Check if user has stats
try {
    $query = "SELECT * FROM user_stats WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($stats) {
        echo "User stats found:\n";
        print_r($stats);
    } else {
        echo "No stats found for user $userId\n";
        echo "Attempting to initialize...\n\n";
        
        try {
            $init = $db->prepare('CALL init_user_stats(:user_id)');
            $init->bindParam(':user_id', $userId);
            $init->execute();
            while ($init->nextRowset()) { /* consume */ }
            
            // Try again
            $stmt->execute();
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($stats) {
                echo "Stats initialized successfully:\n";
                print_r($stats);
            } else {
                echo "Failed to initialize stats\n";
            }
        } catch (Exception $e) {
            echo "ERROR initializing: " . $e->getMessage() . "\n";
        }
    }
} catch (Exception $e) {
    echo "ERROR querying stats: " . $e->getMessage() . "\n";
}
?>
