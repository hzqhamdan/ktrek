<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$task_id = 61;

$database = new Database();
$db = $database->getConnection();

// Get question and options
$query = "SELECT qq.*, qo.id as option_id, qo.option_text, qo.is_correct, qo.option_order
          FROM quiz_questions qq
          LEFT JOIN quiz_options qo ON qo.question_id = qq.id
          WHERE qq.task_id = :task_id
          ORDER BY qo.option_order";
$stmt = $db->prepare($query);
$stmt->bindParam(':task_id', $task_id);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Task 61 Configuration:\n\n";
echo "Question: " . $rows[0]['question_text'] . "\n\n";
echo "Options:\n";
foreach ($rows as $row) {
    $correct = $row['is_correct'] ? " ✓ CORRECT" : "";
    echo "  " . $row['option_order'] . ". " . $row['option_text'] . $correct . "\n";
}
?>
