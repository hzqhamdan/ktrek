<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : 61;

$database = new Database();
$db = $database->getConnection();

// Check task_config field
$query = "SELECT * FROM tasks WHERE id = :task_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':task_id', $task_id);
$stmt->execute();
$task = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Full Task Data:\n";
echo json_encode($task, JSON_PRETTY_PRINT) . "\n\n";

// Check if task_config is JSON
if (!empty($task['task_config'])) {
    echo "Parsed task_config:\n";
    echo json_encode(json_decode($task['task_config']), JSON_PRETTY_PRINT) . "\n\n";
}

// Check all tables for this task_id
echo "\n=== Checking all related tables ===\n\n";

// Check task_options table (if exists)
try {
    $query = "SELECT * FROM task_options WHERE task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $options = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "task_options:\n";
    echo json_encode($options, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "task_options table: " . $e->getMessage() . "\n\n";
}

// Check direction_tasks table (if exists)
try {
    $query = "SELECT * FROM direction_tasks WHERE task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $direction = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "direction_tasks:\n";
    echo json_encode($direction, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "direction_tasks table: " . $e->getMessage() . "\n\n";
}

// List all tables
$query = "SHOW TABLES";
$stmt = $db->prepare($query);
$stmt->execute();
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "All tables in database:\n";
echo json_encode($tables, JSON_PRETTY_PRINT) . "\n";
?>
