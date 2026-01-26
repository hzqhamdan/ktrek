<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : 61;
$correct_direction = isset($_GET['correct']) ? $_GET['correct'] : 'North'; // Default to North

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // Check if task exists
    $query = "SELECT * FROM tasks WHERE id = :task_id AND type = 'direction'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        throw new Exception("Task not found");
    }
    
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if question already exists
    $query = "SELECT id FROM quiz_questions WHERE task_id = :task_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        throw new Exception("Question already exists for this task. Delete it first if you want to recreate.");
    }
    
    // Insert quiz question
    $question_text = $task['description'] ?: "Identify the direction";
    $query = "INSERT INTO quiz_questions (task_id, question_text, question_order) 
              VALUES (:task_id, :question_text, 1)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':question_text', $question_text);
    $stmt->execute();
    
    $question_id = $db->lastInsertId();
    
    // Insert all 8 direction options
    $directions = [
        'North', 'Northeast', 'East', 'Southeast', 
        'South', 'Southwest', 'West', 'Northwest'
    ];
    
    $option_order = 1;
    foreach ($directions as $direction) {
        $is_correct = ($direction === $correct_direction) ? 1 : 0;
        
        $query = "INSERT INTO quiz_options (question_id, option_text, is_correct, option_order) 
                  VALUES (:question_id, :option_text, :is_correct, :option_order)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':question_id', $question_id);
        $stmt->bindParam(':option_text', $direction);
        $stmt->bindParam(':is_correct', $is_correct);
        $stmt->bindParam(':option_order', $option_order);
        $stmt->execute();
        
        $option_order++;
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Direction task configured successfully',
        'task_id' => $task_id,
        'question_id' => $question_id,
        'correct_direction' => $correct_direction,
        'options_created' => count($directions)
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    $db->rollBack();
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
