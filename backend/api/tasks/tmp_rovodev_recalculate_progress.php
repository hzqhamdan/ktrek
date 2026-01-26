<?php
require_once '../../config/database.php';

header('Content-Type: text/plain');

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 5;

$database = new Database();
$db = $database->getConnection();

echo "===== RECALCULATING PROGRESS FOR USER $user_id =====\n\n";

try {
    // Get all attractions the user has submitted tasks for
    $query = "SELECT DISTINCT t.attraction_id, a.name as attraction_name
              FROM user_task_submissions uts
              JOIN tasks t ON uts.task_id = t.id
              JOIN attractions a ON t.attraction_id = a.id
              WHERE uts.user_id = :user_id
              ORDER BY t.attraction_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $attractions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "User has submitted tasks for " . count($attractions) . " attractions\n\n";
    
    foreach ($attractions as $attraction) {
        $attraction_id = $attraction['attraction_id'];
        $attraction_name = $attraction['attraction_name'];
        
        echo "--- $attraction_name (ID: $attraction_id) ---\n";
        
        // Get total tasks for this attraction
        $query = "SELECT COUNT(*) as total FROM tasks WHERE attraction_id = :attraction_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':attraction_id', $attraction_id);
        $stmt->execute();
        $total_tasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get completed tasks
        $query = "SELECT COUNT(DISTINCT uts.task_id) as completed
                  FROM user_task_submissions uts
                  JOIN tasks t ON uts.task_id = t.id
                  WHERE uts.user_id = :user_id AND t.attraction_id = :attraction_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':attraction_id', $attraction_id);
        $stmt->execute();
        $completed_tasks = $stmt->fetch(PDO::FETCH_ASSOC)['completed'];
        
        $progress_percentage = $total_tasks > 0 ? ($completed_tasks / $total_tasks) * 100 : 0;
        $is_completed = $progress_percentage >= 100 ? 1 : 0;
        
        echo "  Total tasks: $total_tasks\n";
        echo "  Completed tasks: $completed_tasks\n";
        echo "  Progress: " . round($progress_percentage, 2) . "%\n";
        
        // Check current progress table entry
        $query = "SELECT * FROM progress WHERE user_id = :user_id AND attraction_id = :attraction_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':attraction_id', $attraction_id);
        $stmt->execute();
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($current) {
            echo "  Current DB: {$current['completed_tasks']}/{$current['total_tasks']} ({$current['progress_percentage']}%)\n";
            
            // Update if different
            if ($current['completed_tasks'] != $completed_tasks || $current['total_tasks'] != $total_tasks) {
                $query = "UPDATE progress 
                          SET completed_tasks = :completed_tasks,
                              total_tasks = :total_tasks,
                              progress_percentage = :progress_percentage,
                              updated_at = NOW(),
                              completed_at = CASE WHEN :is_completed = 1 AND completed_at IS NULL THEN NOW() ELSE completed_at END
                          WHERE user_id = :user_id AND attraction_id = :attraction_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':completed_tasks', $completed_tasks);
                $stmt->bindParam(':total_tasks', $total_tasks);
                $stmt->bindParam(':progress_percentage', $progress_percentage);
                $stmt->bindParam(':is_completed', $is_completed);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':attraction_id', $attraction_id);
                $stmt->execute();
                echo "  ✓ UPDATED\n";
            } else {
                echo "  ✓ Already correct\n";
            }
        } else {
            echo "  ! NO ENTRY IN progress TABLE - Creating...\n";
            $query = "INSERT INTO progress (user_id, attraction_id, completed_tasks, total_tasks, progress_percentage, created_at, updated_at, completed_at)
                      VALUES (:user_id, :attraction_id, :completed_tasks, :total_tasks, :progress_percentage, NOW(), NOW(), :completed_at)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':attraction_id', $attraction_id);
            $stmt->bindParam(':completed_tasks', $completed_tasks);
            $stmt->bindParam(':total_tasks', $total_tasks);
            $stmt->bindParam(':progress_percentage', $progress_percentage);
            $completed_at = $is_completed ? date('Y-m-d H:i:s') : null;
            $stmt->bindParam(':completed_at', $completed_at);
            $stmt->execute();
            echo "  ✓ CREATED\n";
        }
        
        echo "\n";
    }
    
    echo "\n===== PROGRESS RECALCULATION COMPLETE =====\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
?>
