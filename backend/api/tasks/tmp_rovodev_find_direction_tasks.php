<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

// Find all direction tasks
$query = "SELECT t.*, a.name as attraction_name 
          FROM tasks t
          LEFT JOIN attractions a ON t.attraction_id = a.id
          WHERE t.type = 'direction'
          ORDER BY t.id";
$stmt = $db->prepare($query);
$stmt->execute();
$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "All Direction Tasks:\n";
echo json_encode($tasks, JSON_PRETTY_PRINT) . "\n\n";

echo "Total direction tasks: " . count($tasks) . "\n\n";

// For each direction task, check if it has quiz questions
foreach ($tasks as $task) {
    $query = "SELECT qq.*, 
              (SELECT COUNT(*) FROM quiz_options WHERE question_id = qq.id) as option_count
              FROM quiz_questions qq
              WHERE qq.task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task['id']);
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Task ID " . $task['id'] . " (" . $task['name'] . "):\n";
    echo "  Questions: " . count($questions) . "\n";
    if (count($questions) > 0) {
        foreach ($questions as $q) {
            echo "    Question: " . $q['question_text'] . " (Options: " . $q['option_count'] . ")\n";
        }
    }
    echo "\n";
}
?>
