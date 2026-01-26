<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : 61;

$database = new Database();
$db = $database->getConnection();

// Check task exists
$query = "SELECT t.*, a.name as attraction_name 
          FROM tasks t
          JOIN attractions a ON t.attraction_id = a.id
          WHERE t.id = :task_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':task_id', $task_id);
$stmt->execute();
$task = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Task Info:\n";
echo json_encode($task, JSON_PRETTY_PRINT) . "\n\n";

// Check quiz questions
$query = "SELECT * FROM quiz_questions WHERE task_id = :task_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':task_id', $task_id);
$stmt->execute();
$questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Quiz Questions:\n";
echo json_encode($questions, JSON_PRETTY_PRINT) . "\n\n";

// Check quiz options
$query = "SELECT qo.* 
          FROM quiz_options qo
          JOIN quiz_questions qq ON qo.question_id = qq.id
          WHERE qq.task_id = :task_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':task_id', $task_id);
$stmt->execute();
$options = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Quiz Options:\n";
echo json_encode($options, JSON_PRETTY_PRINT) . "\n";
?>
