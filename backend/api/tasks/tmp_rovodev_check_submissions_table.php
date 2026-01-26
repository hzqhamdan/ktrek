<?php
require_once '../../config/database.php';

header('Content-Type: text/plain');

$database = new Database();
$db = $database->getConnection();

// Show the structure of user_task_submissions table
$query = "DESCRIBE user_task_submissions";
$stmt = $db->prepare($query);
$stmt->execute();
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "user_task_submissions table structure:\n\n";
foreach ($columns as $col) {
    echo sprintf("%-20s %-20s %s\n", $col['Field'], $col['Type'], $col['Null'] === 'YES' ? 'NULL' : 'NOT NULL');
}

echo "\n\nSample data (first 5 rows):\n";
$query = "SELECT * FROM user_task_submissions LIMIT 5";
$stmt = $db->prepare($query);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($rows) > 0) {
    print_r($rows);
} else {
    echo "No data in table\n";
}
?>
