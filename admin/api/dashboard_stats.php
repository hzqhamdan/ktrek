<?php
// api/dashboard_stats.php
error_reporting(0); // Suppress all errors to prevent HTML output
ini_set('display_errors', 0); // Ensure errors are not displayed
header('Content-Type: application/json'); // Ensure JSON response

require_once '../config.php';

// Ensure session is started to get admin details
session_start();
if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_role'])) {
     echo json_encode([
        'success' => false,
        'message' => 'Authentication required.'
    ]);
    exit();
}
$admin_id = $_SESSION['admin_id'];
$admin_role = $_SESSION['admin_role'];

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

// Helper function to get manager's assigned attraction ID (NOT USED anymore for filtering stats)
// We keep it in case other parts of the system still rely on it for other purposes,
// but the core filtering in dashboard_stats is removed.
/*
function getManagerAttractionId($conn, $admin_id) {
    $stmt = $conn->prepare("SELECT attraction_id FROM admin WHERE id = ?");
    $stmt->bind_param("i", $admin_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return $row ? $row['attraction_id'] : null;
}
*/

// Helper function to get count for a specific period and table
// NOTE: This function no longer applies manager-specific attraction filtering as the RBAC model changed.
// It will count across ALL accessible data for the requesting admin (which is now all data).
function getCountForPeriod($conn, $table, $date_column, $period_start) {
    // Parameters for the prepared statement
    $params = [];
    $types = "";

    // Base query
    $query = "SELECT COUNT(*) as count FROM `$table` WHERE `$date_column` >= ?";

    // Add the period start date parameter
    $params[] = $period_start;
    $types .= "s"; // 's' for string (date)

    // NO MANAGER-SPECIFIC FILTERING APPLIED HERE ANYMORE
    // The query runs against the entire table for the given date range.

    // Prepare and execute the statement
    $stmt = $conn->prepare($query);
    if ($stmt) {
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        return $row ? $row['count'] : 0; // Return the count or 0 if no row found (shouldn't happen with COUNT(*))
    } else {
        // Log the specific error for debugging
        error_log("Error preparing statement in getCountForPeriod: " . $conn->error . " Query: $query");
        return 0; // Return 0 on error
    }
}

// GET - Return dashboard statistics
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_stats') {
        try {
            // Get period parameter (default to 7 days)
            $period = isset($_GET['period']) ? intval($_GET['period']) : 7;
            if ($period !== 7 && $period !== 30) {
                $period = 7; // Fallback to 7 if invalid value
            }

            // Calculate base stats (counts across all data accessible to the admin)
        // Use a very old date (1970-01-01) to count ALL records, not just today's
        
        // Get manager's assigned attraction if they are a manager
        $manager_attraction_id = null;
        if ($admin_role === 'manager') {
            $stmt = $conn->prepare("SELECT attraction_id FROM admin WHERE id = ?");
            $stmt->bind_param("i", $admin_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $admin_data = $result->fetch_assoc();
            $stmt->close();
            $manager_attraction_id = $admin_data['attraction_id'] ?? null;
        }
        
        // Count attractions based on role
        if ($admin_role === 'manager' && $manager_attraction_id) {
            // Managers can only see their assigned attraction
            $attractions_count = 1;
        } else if ($admin_role === 'manager') {
            // Manager with no assigned attraction
            $attractions_count = 0;
        } else {
            // Superadmins see all attractions
            $attractions_count = getCountForPeriod($conn, 'attractions', 'created_at', '1970-01-01');
        }
        
        // Count tasks based on role
        if ($admin_role === 'manager' && $manager_attraction_id) {
            // Managers see only tasks for their attraction
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tasks WHERE attraction_id = ?");
            $stmt->bind_param("i", $manager_attraction_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $tasks_count = $row['count'] ?? 0;
            $stmt->close();
        } else if ($admin_role === 'manager') {
            // Manager with no assigned attraction
            $tasks_count = 0;
        } else {
            // Superadmins see all tasks
            $tasks_count = getCountForPeriod($conn, 'tasks', 'created_at', '1970-01-01');
        }
        
        // Count total users based on role
        if ($admin_role === 'manager') {
            // For managers: count only users who participated in tasks of their attraction
            if ($manager_attraction_id) {
                // Count distinct users who have progress or submissions for this attraction's tasks
                $users_query = "
                    SELECT COUNT(DISTINCT user_id) as count 
                    FROM (
                        SELECT user_id FROM progress WHERE attraction_id = ?
                        UNION
                        SELECT DISTINCT uts.user_id 
                        FROM user_task_submissions uts
                        INNER JOIN tasks t ON uts.task_id = t.id
                        WHERE t.attraction_id = ?
                    ) as unique_users
                ";
                $stmt = $conn->prepare($users_query);
                $stmt->bind_param("ii", $manager_attraction_id, $manager_attraction_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $users_count = $row['count'] ?? 0;
                $stmt->close();
            } else {
                // Manager has no assigned attraction
                $users_count = 0;
            }
        } else {
            // For superadmins: count all users
            $users_count = getCountForPeriod($conn, 'users', 'created_at', '1970-01-01');
        }
        
        // Count pending reports based on role
        if ($admin_role === 'manager' && $manager_attraction_id) {
            // Managers see only pending reports for their attraction
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM reports WHERE attraction_id = ? AND status = 'Pending'");
            $stmt->bind_param("i", $manager_attraction_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $pending_reports_count = $row['count'] ?? 0;
            $stmt->close();
        } else if ($admin_role === 'manager') {
            // Manager with no assigned attraction
            $pending_reports_count = 0;
        } else {
            // Superadmins see all pending reports
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'Pending'");
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $pending_reports_count = $row['count'] ?? 0;
            $stmt->close();
        }

        // Calculate engagement metrics
        $today = date('Y-m-d');
        $week_ago = date('Y-m-d', strtotime('-7 days'));
        
        // Active users today and this week
        if ($admin_role === 'manager' && $manager_attraction_id) {
            // Active users today (users who submitted tasks today)
            $stmt = $conn->prepare("
                SELECT COUNT(DISTINCT user_id) as count 
                FROM user_task_submissions uts
                INNER JOIN tasks t ON uts.task_id = t.id
                WHERE t.attraction_id = ? AND DATE(uts.submitted_at) = ?
            ");
            $stmt->bind_param("is", $manager_attraction_id, $today);
            $stmt->execute();
            $result = $stmt->get_result();
            $active_users_today = $result->fetch_assoc()['count'] ?? 0;
            $stmt->close();
            
            // Active users this week
            $stmt = $conn->prepare("
                SELECT COUNT(DISTINCT user_id) as count 
                FROM user_task_submissions uts
                INNER JOIN tasks t ON uts.task_id = t.id
                WHERE t.attraction_id = ? AND DATE(uts.submitted_at) >= ?
            ");
            $stmt->bind_param("is", $manager_attraction_id, $week_ago);
            $stmt->execute();
            $result = $stmt->get_result();
            $active_users_week = $result->fetch_assoc()['count'] ?? 0;
            $stmt->close();
            
            // Completion rate (users who completed all tasks / total users who started)
            $stmt = $conn->prepare("
                SELECT 
                    COUNT(DISTINCT CASE WHEN p.progress_percentage >= 100 THEN p.user_id END) as completed_users,
                    COUNT(DISTINCT p.user_id) as total_users
                FROM progress p
                WHERE p.attraction_id = ?
            ");
            $stmt->bind_param("i", $manager_attraction_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $completion_data = $result->fetch_assoc();
            $stmt->close();
            
            $completed_users = $completion_data['completed_users'] ?? 0;
            $total_users_started = $completion_data['total_users'] ?? 0;
            $completion_rate = $total_users_started > 0 ? round(($completed_users / $total_users_started) * 100, 1) : 0;
            
            // Average time spent (from progress table)
            $stmt = $conn->prepare("
                SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_minutes
                FROM progress
                WHERE attraction_id = ? AND progress_percentage >= 100 AND updated_at IS NOT NULL
            ");
            $stmt->bind_param("i", $manager_attraction_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $avg_time_data = $result->fetch_assoc();
            $stmt->close();
            
            $avg_time_minutes = $avg_time_data['avg_minutes'] ?? 0;
            
        } else if ($admin_role === 'manager') {
            $active_users_today = 0;
            $active_users_week = 0;
            $completion_rate = 0;
            $avg_time_minutes = 0;
        } else {
            // Superadmin - all data
            $stmt = $conn->prepare("
                SELECT COUNT(DISTINCT user_id) as count 
                FROM user_task_submissions
                WHERE DATE(submitted_at) = ?
            ");
            $stmt->bind_param("s", $today);
            $stmt->execute();
            $result = $stmt->get_result();
            $active_users_today = $result->fetch_assoc()['count'] ?? 0;
            $stmt->close();
            
            $stmt = $conn->prepare("
                SELECT COUNT(DISTINCT user_id) as count 
                FROM user_task_submissions
                WHERE DATE(submitted_at) >= ?
            ");
            $stmt->bind_param("s", $week_ago);
            $stmt->execute();
            $result = $stmt->get_result();
            $active_users_week = $result->fetch_assoc()['count'] ?? 0;
            $stmt->close();
            
            $stmt = $conn->prepare("
                SELECT 
                    COUNT(DISTINCT CASE WHEN progress_percentage >= 100 THEN user_id END) as completed_users,
                    COUNT(DISTINCT user_id) as total_users
                FROM progress
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            $completion_data = $result->fetch_assoc();
            $stmt->close();
            
            $completed_users = $completion_data['completed_users'] ?? 0;
            $total_users_started = $completion_data['total_users'] ?? 0;
            $completion_rate = $total_users_started > 0 ? round(($completed_users / $total_users_started) * 100, 1) : 0;
            
            $stmt = $conn->prepare("
                SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_minutes
                FROM progress
                WHERE progress_percentage >= 100 AND updated_at IS NOT NULL
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            $avg_time_data = $result->fetch_assoc();
            $stmt->close();
            
            $avg_time_minutes = $avg_time_data['avg_minutes'] ?? 0;
        }
        
        // Get recent activity (reports and task completions)
        if ($admin_role === 'manager' && $manager_attraction_id) {
            // Recent reports
            $stmt = $conn->prepare("
                SELECT r.id, r.message as report_type, r.message as description, r.created_at, u.full_name as user_name
                FROM reports r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.attraction_id = ?
                ORDER BY r.created_at DESC
                LIMIT 5
            ");
            $stmt->bind_param("i", $manager_attraction_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $recent_reports = [];
            while ($row = $result->fetch_assoc()) {
                $recent_reports[] = $row;
            }
            $stmt->close();
            
            // Recent task completions
            $stmt = $conn->prepare("
                SELECT uts.id, uts.submitted_at, u.full_name as user_name, t.name as task_title, t.type as task_type
                FROM user_task_submissions uts
                INNER JOIN tasks t ON uts.task_id = t.id
                LEFT JOIN users u ON uts.user_id = u.id
                WHERE t.attraction_id = ?
                ORDER BY uts.submitted_at DESC
                LIMIT 5
            ");
            $stmt->bind_param("i", $manager_attraction_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $recent_completions = [];
            while ($row = $result->fetch_assoc()) {
                $recent_completions[] = $row;
            }
            $stmt->close();
        } else if ($admin_role === 'manager') {
            $recent_reports = [];
            $recent_completions = [];
        } else {
            // Superadmin - all data
            $stmt = $conn->prepare("
                SELECT r.id, r.message as report_type, r.message as description, r.created_at, u.full_name as user_name, a.name as attraction_name
                FROM reports r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN attractions a ON r.attraction_id = a.id
                ORDER BY r.created_at DESC
                LIMIT 5
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            $recent_reports = [];
            while ($row = $result->fetch_assoc()) {
                $recent_reports[] = $row;
            }
            $stmt->close();
            
            $stmt = $conn->prepare("
                SELECT uts.id, uts.submitted_at, u.full_name as user_name, t.name as task_title, t.type as task_type, a.name as attraction_name
                FROM user_task_submissions uts
                INNER JOIN tasks t ON uts.task_id = t.id
                LEFT JOIN users u ON uts.user_id = u.id
                LEFT JOIN attractions a ON t.attraction_id = a.id
                ORDER BY uts.submitted_at DESC
                LIMIT 5
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            $recent_completions = [];
            while ($row = $result->fetch_assoc()) {
                $recent_completions[] = $row;
            }
            $stmt->close();
        }
        
        // Get alerts (urgent items needing attention)
        $alerts = [];
        
        // Alert: Old unresolved reports (older than 3 days)
        $three_days_ago = date('Y-m-d', strtotime('-3 days'));
        if ($admin_role === 'manager' && $manager_attraction_id) {
            $stmt = $conn->prepare("
                SELECT COUNT(*) as count
                FROM reports
                WHERE attraction_id = ? AND status = 'Pending' AND created_at < ?
            ");
            $stmt->bind_param("is", $manager_attraction_id, $three_days_ago);
            $stmt->execute();
            $result = $stmt->get_result();
            $old_reports_count = $result->fetch_assoc()['count'] ?? 0;
            $stmt->close();
            
            if ($old_reports_count > 0) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => "$old_reports_count pending report(s) older than 3 days need attention"
                ];
            }
        } else if ($admin_role === 'superadmin') {
            $stmt = $conn->prepare("
                SELECT COUNT(*) as count
                FROM reports
                WHERE status = 'Pending' AND created_at < ?
            ");
            $stmt->bind_param("s", $three_days_ago);
            $stmt->execute();
            $result = $stmt->get_result();
            $old_reports_count = $result->fetch_assoc()['count'] ?? 0;
            $stmt->close();
            
            if ($old_reports_count > 0) {
                $alerts[] = [
                    'type' => 'warning',
                    'message' => "$old_reports_count pending report(s) older than 3 days need attention"
                ];
            }
        }
        
        // Get chart data - Task completions over selected period
        $chart_labels = [];
        $chart_data = [];
        
        for ($i = $period - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            // Format label based on period
            if ($period <= 7) {
                $chart_labels[] = date('M d', strtotime($date)); // "Jan 15"
            } else {
                $chart_labels[] = date('m/d', strtotime($date)); // "01/15"
            }
            
            if ($admin_role === 'manager' && $manager_attraction_id) {
                $stmt = $conn->prepare("
                    SELECT COUNT(*) as count 
                    FROM user_task_submissions uts
                    INNER JOIN tasks t ON uts.task_id = t.id
                    WHERE t.attraction_id = ? AND DATE(uts.submitted_at) = ?
                ");
                $stmt->bind_param("is", $manager_attraction_id, $date);
            } else {
                $stmt = $conn->prepare("
                    SELECT COUNT(*) as count 
                    FROM user_task_submissions
                    WHERE DATE(submitted_at) = ?
                ");
                $stmt->bind_param("s", $date);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            $count = $result->fetch_assoc()['count'] ?? 0;
            $chart_data[] = $count;
            $stmt->close();
        }
        
        // Get chart data - Active users over selected period
        $user_chart_labels = [];
        $user_chart_data = [];
        
        for ($i = $period - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            // Format label based on period
            if ($period <= 7) {
                $user_chart_labels[] = date('M d', strtotime($date)); // "Jan 15"
            } else {
                $user_chart_labels[] = date('m/d', strtotime($date)); // "01/15"
            }
            
            if ($admin_role === 'manager' && $manager_attraction_id) {
                $stmt = $conn->prepare("
                    SELECT COUNT(DISTINCT uts.user_id) as count 
                    FROM user_task_submissions uts
                    INNER JOIN tasks t ON uts.task_id = t.id
                    WHERE t.attraction_id = ? AND DATE(uts.submitted_at) = ?
                ");
                $stmt->bind_param("is", $manager_attraction_id, $date);
            } else {
                $stmt = $conn->prepare("
                    SELECT COUNT(DISTINCT user_id) as count 
                    FROM user_task_submissions
                    WHERE DATE(submitted_at) = ?
                ");
                $stmt->bind_param("s", $date);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            $count = $result->fetch_assoc()['count'] ?? 0;
            $user_chart_data[] = $count;
            $stmt->close();
        }
        
        // Get leaderboard - Top 5 users by task completions
        $leaderboard = [];
        
        if ($admin_role === 'manager' && $manager_attraction_id) {
            $stmt = $conn->prepare("
                SELECT 
                    u.full_name,
                    COUNT(uts.id) as task_count,
                    SUM(uts.score) as total_points
                FROM users u
                LEFT JOIN user_task_submissions uts ON u.id = uts.user_id
                LEFT JOIN tasks t ON uts.task_id = t.id
                WHERE t.attraction_id = ?
                GROUP BY u.id
                ORDER BY task_count DESC, total_points DESC
                LIMIT 5
            ");
            $stmt->bind_param("i", $manager_attraction_id);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $leaderboard[] = [
                    'name' => $row['full_name'] ?? 'Unknown User',
                    'task_count' => $row['task_count'] ?? 0,
                    'points' => $row['total_points'] ?? 0
                ];
            }
            $stmt->close();
        } else if ($admin_role === 'superadmin') {
            $stmt = $conn->prepare("
                SELECT 
                    u.full_name,
                    COUNT(uts.id) as task_count,
                    SUM(uts.score) as total_points
                FROM users u
                LEFT JOIN user_task_submissions uts ON u.id = uts.user_id
                GROUP BY u.id
                ORDER BY task_count DESC, total_points DESC
                LIMIT 5
            ");
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $leaderboard[] = [
                    'name' => $row['full_name'] ?? 'Unknown User',
                    'task_count' => $row['task_count'] ?? 0,
                    'points' => $row['total_points'] ?? 0
                ];
            }
            $stmt->close();
        }
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'attractions' => $attractions_count,
                'tasks' => $tasks_count,
                'users' => $users_count,
                'pending_reports' => $pending_reports_count,
                
                // Engagement metrics
                'active_users_today' => $active_users_today,
                'active_users_week' => $active_users_week,
                'completion_rate' => $completion_rate,
                'avg_time_minutes' => round($avg_time_minutes, 0),
                
                // Recent activity
                'recent_reports' => $recent_reports,
                'recent_completions' => $recent_completions,
                
                // Alerts
                'alerts' => $alerts,
                
                // Chart data
                'task_completion_chart' => [
                    'labels' => $chart_labels,
                    'data' => $chart_data
                ],
                'user_activity_chart' => [
                    'labels' => $user_chart_labels,
                    'data' => $user_chart_data
                ],
                
                // Leaderboard
                'leaderboard' => $leaderboard
            ]
        ]);
        } catch (Exception $e) {
            // Log the error and return JSON error response
            error_log("Dashboard stats error: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Error loading dashboard: ' . $e->getMessage()
            ]);
        }
    } else {
         echo json_encode([
            'success' => false,
            'message' => 'Invalid action for GET request.'
        ]);
    }
} else {
     echo json_encode([
        'success' => false,
        'message' => 'Invalid request method for this endpoint.'
    ]);
}

$conn->close();
?>