<?php
// admin/api/superadmin_dashboard.php
// Superadmin-only dashboard: managers oversight, performance, risk indicators, growth, and audit/activity.

require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['admin_id']) || ($_SESSION['admin_role'] ?? '') !== 'superadmin') {
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Superadmin only.'
    ]);
    exit();
}

$conn = getDBConnection();

function ktrek_column_exists(mysqli $conn, string $table, string $column): bool {
    $tableEsc = $conn->real_escape_string($table);
    $colEsc = $conn->real_escape_string($column);
    $sql = "SHOW COLUMNS FROM `{$tableEsc}` LIKE '{$colEsc}'";
    $res = $conn->query($sql);
    return $res && $res->num_rows > 0;
}

$has_status = ktrek_column_exists($conn, 'admin', 'status');
$has_last_login = ktrek_column_exists($conn, 'admin', 'last_login');
$has_created_by_admin_id = ktrek_column_exists($conn, 'attractions', 'created_by_admin_id');

$action = $_GET['action'] ?? 'get';
$periodDays = isset($_GET['period_days']) ? max(7, min(365, intval($_GET['period_days']))) : 30;
$inactiveDays = isset($_GET['inactive_days']) ? max(7, min(3650, intval($_GET['inactive_days']))) : 30;

function fetchAllAssoc(mysqli_stmt $stmt): array {
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    return $rows;
}

function getManagerStatus(array $row): string {
    // Prefer explicit status column if present, otherwise map is_active.
    if (isset($row['status']) && $row['status'] !== null && $row['status'] !== '') {
        return $row['status'];
    }
    return !empty($row['is_active']) ? 'active' : 'deactivated';
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendResponse(false, [], 'Method not allowed');
    }

    if ($action !== 'get') {
        sendResponse(false, [], 'Invalid action');
    }

    // 1) Manager Overview
    // Exclude superadmins from manager list.
    $select = "SELECT id, full_name, email, role, is_active";
    if ($has_status) $select .= ", status";
    if ($has_last_login) $select .= ", last_login";
    $select .= ", created_at FROM admin WHERE role = 'manager' ORDER BY created_at DESC";

    $stmt = $conn->prepare($select);
    $stmt->execute();
    $managers = fetchAllAssoc($stmt);
    $stmt->close();

    $totalManagers = count($managers);
    $activeManagers = 0;
    $inactiveManagers = 0;
    $suspendedManagers = 0;
    $recentManagers = 0;
    $inactiveLong = [];

    $periodStart = date('Y-m-d H:i:s', strtotime("-$periodDays days"));
    $inactiveCutoff = date('Y-m-d H:i:s', strtotime("-$inactiveDays days"));

    foreach ($managers as &$m) {
        $m['account_status'] = getManagerStatus($m);
        if ($m['account_status'] === 'active') $activeManagers++;
        if ($m['account_status'] === 'deactivated') $inactiveManagers++;
        if ($m['account_status'] === 'suspended') $suspendedManagers++;

        if (!empty($m['created_at']) && $m['created_at'] >= $periodStart) {
            $recentManagers++;
        }

        // Inactivity: last_login is null OR older than cutoff
        if (empty($m['last_login']) || $m['last_login'] < $inactiveCutoff) {
            $inactiveLong[] = [
                'id' => $m['id'],
                'full_name' => $m['full_name'],
                'email' => $m['email'],
                'account_status' => $m['account_status'],
                'last_login' => $m['last_login']
            ];
        }
    }
    unset($m);

    // 2) Manager Performance Summary
    // Support both schemas:
    // - New schema: attractions.created_by_admin_id
    // - Legacy schema: admin.attraction_id (one attraction per manager)

    $attractionsByManager = [];
    $tasksByManager = [];
    $reportsByManager = [];

    if ($has_created_by_admin_id) {
        // Attractions added per manager
        $stmt = $conn->prepare("SELECT created_by_admin_id AS manager_id, COUNT(*) AS attractions_added FROM attractions GROUP BY created_by_admin_id");
        $stmt->execute();
        $attrCounts = fetchAllAssoc($stmt);
        $stmt->close();
        foreach ($attrCounts as $row) {
            if ($row['manager_id'] !== null) {
                $attractionsByManager[(string)$row['manager_id']] = intval($row['attractions_added']);
            }
        }

        // Tasks created per manager
        $stmt = $conn->prepare("SELECT a.created_by_admin_id AS manager_id, COUNT(t.id) AS tasks_created FROM tasks t JOIN attractions a ON a.id = t.attraction_id GROUP BY a.created_by_admin_id");
        $stmt->execute();
        $taskCounts = fetchAllAssoc($stmt);
        $stmt->close();
        foreach ($taskCounts as $row) {
            if ($row['manager_id'] !== null) {
                $tasksByManager[(string)$row['manager_id']] = intval($row['tasks_created']);
            }
        }

        // Reports handled vs open + avg response time by manager
        $stmt = $conn->prepare("SELECT 
                a.created_by_admin_id AS manager_id,
                SUM(CASE WHEN r.replied_at IS NOT NULL OR r.status = 'Replied' THEN 1 ELSE 0 END) AS reports_handled,
                SUM(CASE WHEN r.replied_at IS NULL AND (r.status IS NULL OR r.status = 'Pending') THEN 1 ELSE 0 END) AS reports_open,
                AVG(CASE WHEN r.replied_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, r.created_at, r.replied_at) ELSE NULL END) AS avg_response_minutes
            FROM reports r
            JOIN attractions a ON a.id = r.attraction_id
            GROUP BY a.created_by_admin_id");
        $stmt->execute();
        $reportAgg = fetchAllAssoc($stmt);
        $stmt->close();
        foreach ($reportAgg as $row) {
            if ($row['manager_id'] !== null) {
                $reportsByManager[(string)$row['manager_id']] = [
                    'reports_handled' => intval($row['reports_handled'] ?? 0),
                    'reports_open' => intval($row['reports_open'] ?? 0),
                    'avg_response_minutes' => $row['avg_response_minutes'] !== null ? round(floatval($row['avg_response_minutes']), 1) : null,
                ];
            }
        }

    } else {
        // Legacy: manager mapped to a single attraction via admin.attraction_id
        $stmt = $conn->prepare("SELECT id AS manager_id, attraction_id FROM admin WHERE role = 'manager'");
        $stmt->execute();
        $mapRows = fetchAllAssoc($stmt);
        $stmt->close();

        foreach ($mapRows as $mr) {
            $mid = (string)$mr['manager_id'];
            $aid = $mr['attraction_id'] ?? null;
            if (!$aid) continue;

            $attractionsByManager[$mid] = 1;

            // tasks count
            $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM tasks WHERE attraction_id = ?");
            $stmt->bind_param('i', $aid);
            $stmt->execute();
            $tasksByManager[$mid] = intval($stmt->get_result()->fetch_assoc()['c'] ?? 0);
            $stmt->close();

            // reports stats
            $stmt = $conn->prepare("\
                SELECT
                    SUM(CASE WHEN replied_at IS NOT NULL OR status = 'Replied' THEN 1 ELSE 0 END) AS reports_handled,
                    SUM(CASE WHEN replied_at IS NULL AND (status IS NULL OR status = 'Pending') THEN 1 ELSE 0 END) AS reports_open,
                    AVG(CASE WHEN replied_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, created_at, replied_at) ELSE NULL END) AS avg_response_minutes
                FROM reports
                WHERE attraction_id = ?
            ");
            $stmt->bind_param('i', $aid);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc() ?: [];
            $stmt->close();

            $reportsByManager[$mid] = [
                'reports_handled' => intval($row['reports_handled'] ?? 0),
                'reports_open' => intval($row['reports_open'] ?? 0),
                'avg_response_minutes' => $row['avg_response_minutes'] !== null ? round(floatval($row['avg_response_minutes']), 1) : null,
            ];
        }
    }

    // Combine into manager performance rows
    $managerPerformance = [];
    foreach ($managers as $m) {
        $id = (string)$m['id'];
        $managerPerformance[] = [
            'id' => $m['id'],
            'full_name' => $m['full_name'],
            'email' => $m['email'],
            'account_status' => $m['account_status'],
            'last_login' => $m['last_login'],
            'created_at' => $m['created_at'],
            'attractions_added' => $attractionsByManager[$id] ?? 0,
            'tasks_created' => $tasksByManager[$id] ?? 0,
            'reports_handled' => $reportsByManager[$id]['reports_handled'] ?? 0,
            'reports_open' => $reportsByManager[$id]['reports_open'] ?? 0,
            'avg_response_minutes' => $reportsByManager[$id]['avg_response_minutes'] ?? null,
        ];
    }

    // 3) Accountability & Risk Indicators
    // Overdue unresolved reports: pending older than X days
    $overdueDays = 7;
    $overdueCutoff = date('Y-m-d H:i:s', strtotime("-$overdueDays days"));
    $stmt = $conn->prepare($has_created_by_admin_id
        ? "SELECT a.created_by_admin_id AS manager_id, COUNT(r.id) AS overdue_reports
           FROM reports r
           JOIN attractions a ON a.id = r.attraction_id
           WHERE (r.status IS NULL OR r.status = 'Pending') AND r.created_at < ?
           GROUP BY a.created_by_admin_id"
        : "SELECT ad.id AS manager_id, COUNT(r.id) AS overdue_reports
           FROM reports r
           JOIN admin ad ON ad.attraction_id = r.attraction_id AND ad.role = 'manager'
           WHERE (r.status IS NULL OR r.status = 'Pending') AND r.created_at < ?
           GROUP BY ad.id");
    $stmt->bind_param('s', $overdueCutoff);
    $stmt->execute();
    $overdueAgg = fetchAllAssoc($stmt);
    $stmt->close();
    $overdueByManager = [];
    foreach ($overdueAgg as $row) {
        if ($row['manager_id'] !== null) {
            $overdueByManager[(string)$row['manager_id']] = intval($row['overdue_reports'] ?? 0);
        }
    }

    // Complaints proxy: total reports in last period_days (not perfect but available)
    $stmt = $conn->prepare($has_created_by_admin_id
        ? "SELECT a.created_by_admin_id AS manager_id, COUNT(r.id) AS complaints_recent
           FROM reports r
           JOIN attractions a ON a.id = r.attraction_id
           WHERE r.created_at >= ?
           GROUP BY a.created_by_admin_id"
        : "SELECT ad.id AS manager_id, COUNT(r.id) AS complaints_recent
           FROM reports r
           JOIN admin ad ON ad.attraction_id = r.attraction_id AND ad.role = 'manager'
           WHERE r.created_at >= ?
           GROUP BY ad.id");
    $stmt->bind_param('s', $periodStart);
    $stmt->execute();
    $complaintsAgg = fetchAllAssoc($stmt);
    $stmt->close();
    $complaintsByManager = [];
    foreach ($complaintsAgg as $row) {
        if ($row['manager_id'] !== null) {
            $complaintsByManager[(string)$row['manager_id']] = intval($row['complaints_recent'] ?? 0);
        }
    }

    // Low engagement proxy: task submissions in last period_days across manager attractions
    $stmt = $conn->prepare($has_created_by_admin_id
        ? "SELECT a.created_by_admin_id AS manager_id, COUNT(uts.id) AS submissions_recent
           FROM user_task_submissions uts
           JOIN tasks t ON t.id = uts.task_id
           JOIN attractions a ON a.id = t.attraction_id
           WHERE uts.submitted_at >= ?
           GROUP BY a.created_by_admin_id"
        : "SELECT ad.id AS manager_id, COUNT(uts.id) AS submissions_recent
           FROM user_task_submissions uts
           JOIN tasks t ON t.id = uts.task_id
           JOIN admin ad ON ad.attraction_id = t.attraction_id AND ad.role = 'manager'
           WHERE uts.submitted_at >= ?
           GROUP BY ad.id");
    $stmt->bind_param('s', $periodStart);
    $stmt->execute();
    $engAgg = fetchAllAssoc($stmt);
    $stmt->close();
    $submissionsByManager = [];
    foreach ($engAgg as $row) {
        if ($row['manager_id'] !== null) {
            $submissionsByManager[(string)$row['manager_id']] = intval($row['submissions_recent'] ?? 0);
        }
    }

    $riskIndicators = [];
    foreach ($managerPerformance as $mp) {
        $id = (string)$mp['id'];
        $overdue = $overdueByManager[$id] ?? 0;
        $complaints = $complaintsByManager[$id] ?? 0;
        $subs = $submissionsByManager[$id] ?? 0;

        $flags = [];
        if ($overdue > 0) $flags[] = ['type' => 'overdue_reports', 'severity' => 'high', 'value' => $overdue];
        if (empty($mp['last_login']) || $mp['last_login'] < $inactiveCutoff) $flags[] = ['type' => 'inactive', 'severity' => 'medium', 'value' => $mp['last_login']];
        if ($complaints >= 5) $flags[] = ['type' => 'high_complaints', 'severity' => 'medium', 'value' => $complaints];
        if (($mp['attractions_added'] ?? 0) > 0 && $subs === 0) $flags[] = ['type' => 'low_engagement', 'severity' => 'low', 'value' => $subs];

        if (!empty($flags)) {
            $riskIndicators[] = [
                'manager_id' => $mp['id'],
                'full_name' => $mp['full_name'],
                'email' => $mp['email'],
                'flags' => $flags,
            ];
        }
    }

    // 4) Platform Growth Snapshot
    // Users growth (created_at per day)
    // Attractions growth (created_at per day)
    // Task completion trends (user_task_submissions per day)
    // Engagement trend: submissions per day
    $labels = [];
    $userSeries = [];
    $attrSeries = [];
    $submissionSeries = [];

    for ($i = $periodDays - 1; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $labels[] = $date;

        // Users
        $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) = ?");
        $stmt->bind_param('s', $date);
        $stmt->execute();
        $userSeries[] = intval($stmt->get_result()->fetch_assoc()['c'] ?? 0);
        $stmt->close();

        // Attractions
        $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM attractions WHERE DATE(created_at) = ?");
        $stmt->bind_param('s', $date);
        $stmt->execute();
        $attrSeries[] = intval($stmt->get_result()->fetch_assoc()['c'] ?? 0);
        $stmt->close();

        // Task submissions
        $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM user_task_submissions WHERE DATE(submitted_at) = ?");
        $stmt->bind_param('s', $date);
        $stmt->execute();
        $submissionSeries[] = intval($stmt->get_result()->fetch_assoc()['c'] ?? 0);
        $stmt->close();
    }

    $growth = [
        'labels' => $labels,
        'users_new' => $userSeries,
        'attractions_new' => $attrSeries,
        'task_submissions' => $submissionSeries,
    ];

    // 5) Audit & Activity Summary
    // Recent attractions created/updated
    $stmt = $conn->prepare($has_created_by_admin_id
        ? "SELECT a.id, a.name, a.updated_at, a.created_at, ad.full_name AS manager_name
           FROM attractions a
           LEFT JOIN admin ad ON ad.id = a.created_by_admin_id
           ORDER BY a.updated_at DESC
           LIMIT 10"
        : "SELECT a.id, a.name, a.updated_at, a.created_at, ad.full_name AS manager_name
           FROM attractions a
           LEFT JOIN admin ad ON ad.attraction_id = a.id AND ad.role = 'manager'
           ORDER BY a.updated_at DESC
           LIMIT 10");
    $stmt->execute();
    $recentAttractions = fetchAllAssoc($stmt);
    $stmt->close();

    // Recent tasks created/updated
    $stmt = $conn->prepare($has_created_by_admin_id
        ? "SELECT t.id, t.name, t.type, t.updated_at, t.created_at, a.name AS attraction_name, ad.full_name AS manager_name
           FROM tasks t
           JOIN attractions a ON a.id = t.attraction_id
           LEFT JOIN admin ad ON ad.id = a.created_by_admin_id
           ORDER BY t.updated_at DESC
           LIMIT 10"
        : "SELECT t.id, t.name, t.type, t.updated_at, t.created_at, a.name AS attraction_name, ad.full_name AS manager_name
           FROM tasks t
           JOIN attractions a ON a.id = t.attraction_id
           LEFT JOIN admin ad ON ad.attraction_id = a.id AND ad.role = 'manager'
           ORDER BY t.updated_at DESC
           LIMIT 10");
    $stmt->execute();
    $recentTasks = fetchAllAssoc($stmt);
    $stmt->close();

    // Recent manager account changes (proxy: recently created or status != active or last_login updates)
    // Recent manager account activity (fallback to created_at if last_login/status not present)
    $select = "SELECT id, full_name, email, is_active";
    if ($has_status) $select .= ", status";
    if ($has_last_login) $select .= ", last_login";
    $select .= ", created_at FROM admin WHERE role = 'manager'";

    if ($has_last_login) {
        $select .= " ORDER BY GREATEST(IFNULL(last_login, '1970-01-01'), created_at) DESC";
    } else {
        $select .= " ORDER BY created_at DESC";
    }
    $select .= " LIMIT 10";

    $stmt = $conn->prepare($select);
    $stmt->execute();
    $recentManagersActivity = fetchAllAssoc($stmt);
    $stmt->close();

    // 6) Quick actions: handled by existing admin_users endpoints (register/toggle/delete) and edit_profile.

    $payload = [
        'manager_overview' => [
            'total' => $totalManagers,
            'active' => $activeManagers,
            'inactive' => $inactiveManagers,
            'suspended' => $suspendedManagers,
            'new_in_period' => $recentManagers,
            'inactive_long' => $inactiveLong,
            'list' => array_map(function($m) {
                return [
                    'id' => $m['id'],
                    'full_name' => $m['full_name'],
                    'email' => $m['email'],
                    'account_status' => $m['account_status'],
                    'last_login' => $m['last_login'],
                    'created_at' => $m['created_at'],
                ];
            }, $managers),
        ],
        'manager_performance' => $managerPerformance,
        'risk_indicators' => $riskIndicators,
        'growth' => $growth,
        'recent_activity' => [
            'recent_attractions' => $recentAttractions,
            'recent_tasks' => $recentTasks,
            'recent_managers' => $recentManagersActivity,
        ],
        'meta' => [
            'period_days' => $periodDays,
            'inactive_days' => $inactiveDays,
            'overdue_days' => $overdueDays,
        ]
    ];

    sendResponse(true, $payload, 'Superadmin dashboard loaded');

} catch (Exception $e) {
    // Return error details to help local debugging (XAMPP). Remove details in production.
    error_log('superadmin_dashboard.php error: ' . $e->getMessage());
    sendResponse(false, ['error' => $e->getMessage()], 'Failed to load superadmin dashboard');
} finally {
    $conn->close();
}
