<?php
/**
 * Get Leaderboard
 * Returns top users by XP with optional filtering
 */

require_once '../../config/database.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

header('Content-Type: application/json');

// Optional authentication
$user = authenticateUser(false);
$user_id = $user ? $user['id'] : null;

// Get query parameters
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
$limit = min($limit, 100); // Max 100

$filter = isset($_GET['filter']) ? $_GET['filter'] : 'all'; // all, grand_masters

try {
    $conn = getDBConnection();
    
    // Build query based on filter
    $where_clause = "";
    if ($filter === 'grand_masters') {
        $where_clause = "WHERE l.is_grand_master = TRUE";
    }
    
    // Get leaderboard
    $query = "
        SELECT 
            l.user_id,
            l.total_xp,
            l.total_ep,
            l.current_level,
            l.categories_completed,
            l.is_grand_master,
            l.grand_master_date,
            l.rank,
            u.name as user_name,
            u.avatar_url
        FROM leaderboard l
        JOIN users u ON l.user_id = u.id
        $where_clause
        ORDER BY l.total_xp DESC
        LIMIT ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $leaderboard = [];
    $user_rank_data = null;
    $rank = 1;
    
    while ($row = $result->fetch_assoc()) {
        $row['rank'] = $rank;
        $leaderboard[] = $row;
        
        if ($user_id && $row['user_id'] == $user_id) {
            $user_rank_data = $row;
        }
        
        $rank++;
    }
    
    // If user is authenticated but not in top results, get their rank
    if ($user_id && !$user_rank_data) {
        $user_rank_stmt = $conn->prepare("
            SELECT 
                l.user_id,
                l.total_xp,
                l.total_ep,
                l.current_level,
                l.categories_completed,
                l.is_grand_master,
                l.rank
            FROM leaderboard l
            WHERE l.user_id = ?
        ");
        
        $user_rank_stmt->bind_param("i", $user_id);
        $user_rank_stmt->execute();
        $user_result = $user_rank_stmt->get_result();
        
        if ($user_result->num_rows > 0) {
            $user_rank_data = $user_result->fetch_assoc();
        }
        
        $user_rank_stmt->close();
    }
    
    sendSuccessResponse([
        'leaderboard' => $leaderboard,
        'user_rank' => $user_rank_data,
        'filter' => $filter,
        'total_displayed' => count($leaderboard)
    ], 'Leaderboard retrieved successfully');
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendErrorResponse('Failed to retrieve leaderboard: ' . $e->getMessage(), 500);
}
