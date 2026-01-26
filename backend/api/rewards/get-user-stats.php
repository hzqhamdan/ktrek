<?php
/**
 * Get User Stats and Rewards
 * Returns user's XP, level, badges, and overall statistics
 */

require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth-middleware.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError('Database connection failed');
}

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();
$userId = $user['id'];

try {
    // Fetch user stats; init if missing.
    $stats = null;
    try {
        $stmt = $db->prepare(
            "SELECT 
                us.total_xp,
                us.total_ep,
                us.current_level,
                us.xp_to_next_level,
                us.total_badges,
                us.total_titles,
                us.created_at,
                us.updated_at
            FROM user_stats us
            WHERE us.user_id = :user_id"
        );
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$stats) {
            // Some databases use stored procedure `init_user_stats`.
            // If it doesn't exist, return a clean error so the frontend can show feedback.
            try {
                $init = $db->prepare('CALL init_user_stats(:user_id)');
                $init->bindParam(':user_id', $userId);
                $init->execute();

                // Some MySQL drivers require consuming additional result sets.
                while ($init->nextRowset()) { /* noop */ }
            } catch (PDOException $e) {
                error_log('init_user_stats failed: ' . $e->getMessage());
            }

            $stmt->execute();
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        }
    } catch (PDOException $e) {
        error_log('user_stats query failed: ' . $e->getMessage());
        $stats = null;
    }

    // Category progress
    $categories = [];
    try {
        $categoryStmt = $db->prepare(
            "SELECT 
                category,
                total_attractions,
                completed_attractions,
                completion_percentage,
                bronze_unlocked,
                silver_unlocked,
                gold_unlocked,
                category_xp_earned,
                first_completion_date,
                last_completion_date
            FROM user_category_progress
            WHERE user_id = :user_id
            ORDER BY category"
        );
        $categoryStmt->bindParam(':user_id', $userId);
        $categoryStmt->execute();
        $categories = $categoryStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (PDOException $e) {
        error_log('user_category_progress query failed: ' . $e->getMessage());
    }

    // Recent milestones
    $milestones = [];
    try {
        $milestoneStmt = $db->prepare(
            "SELECT 
                milestone_type,
                milestone_name,
                category,
                bonus_xp_awarded,
                achievement_date
            FROM user_milestones
            WHERE user_id = :user_id
            ORDER BY achievement_date DESC
            LIMIT 5"
        );
        $milestoneStmt->bindParam(':user_id', $userId);
        $milestoneStmt->execute();
        $milestones = $milestoneStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (PDOException $e) {
        error_log('user_milestones query failed: ' . $e->getMessage());
    }

    // Badge fragments
    $fragments = [];
    try {
        $fragmentStmt = $db->prepare(
            "SELECT 
                category,
                fragments_collected,
                fragments_required,
                is_complete,
                completed_date
            FROM user_badge_fragments
            WHERE user_id = :user_id
            ORDER BY category"
        );
        $fragmentStmt->bindParam(':user_id', $userId);
        $fragmentStmt->execute();
        $fragments = $fragmentStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (PDOException $e) {
        error_log('user_badge_fragments query failed: ' . $e->getMessage());
    }

    // Leaderboard data
    $leaderboard = null;
    try {
        $gmStmt = $db->prepare(
            'SELECT is_grand_master, grand_master_date, rank FROM leaderboard WHERE user_id = :user_id'
        );
        $gmStmt->bindParam(':user_id', $userId);
        $gmStmt->execute();
        $leaderboard = $gmStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    } catch (PDOException $e) {
        error_log('leaderboard query failed: ' . $e->getMessage());
    }

    $response = [
        'stats' => $stats ?: null,
        'categories' => $categories,
        'milestones' => $milestones,
        'fragments' => $fragments,
        'leaderboard' => $leaderboard,
        'is_grand_master' => $leaderboard ? (bool)$leaderboard['is_grand_master'] : false,
    ];

    Response::success($response, 'User stats retrieved successfully');

} catch (PDOException $e) {
    error_log('Failed to retrieve user stats: ' . $e->getMessage());
    Response::serverError('Failed to retrieve user stats');
}
