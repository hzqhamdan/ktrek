<?php
/**
 * Helper functions for check-in verification
 */
class CheckinHelper {
    
    /**
     * Check if user has completed the check-in task for a specific attraction
     * 
     * @param PDO $db Database connection
     * @param int $user_id User ID
     * @param int $attraction_id Attraction ID
     * @return bool True if user has checked in, false otherwise
     */
    public static function hasCheckedIn($db, $user_id, $attraction_id) {
        try {
            // Find the check-in task for this attraction
            $query = "SELECT t.id 
                      FROM tasks t 
                      WHERE t.attraction_id = :attraction_id 
                      AND t.type = 'checkin' 
                      LIMIT 1";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':attraction_id', $attraction_id);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                // No check-in task exists for this attraction, so it's not required
                return true;
            }
            
            $checkin_task = $stmt->fetch(PDO::FETCH_ASSOC);
            $checkin_task_id = $checkin_task['id'];
            
            // Check if user has completed the check-in task
            $query = "SELECT id 
                      FROM user_task_submissions 
                      WHERE user_id = :user_id 
                      AND task_id = :task_id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':task_id', $checkin_task_id);
            $stmt->execute();
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("CheckinHelper error: " . $e->getMessage());
            // If there's an error, don't block the user
            return true;
        }
    }
    
    /**
     * Get check-in task ID for an attraction
     * 
     * @param PDO $db Database connection
     * @param int $attraction_id Attraction ID
     * @return int|null Check-in task ID or null if not found
     */
    public static function getCheckinTaskId($db, $attraction_id) {
        try {
            $query = "SELECT id 
                      FROM tasks 
                      WHERE attraction_id = :attraction_id 
                      AND type = 'checkin' 
                      LIMIT 1";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':attraction_id', $attraction_id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $task = $stmt->fetch(PDO::FETCH_ASSOC);
                return $task['id'];
            }
            
            return null;
            
        } catch (PDOException $e) {
            error_log("CheckinHelper::getCheckinTaskId error: " . $e->getMessage());
            return null;
        }
    }
}
?>
