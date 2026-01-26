<?php
// Start session for admin authentication
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K-Trek Admin Dashboard</title>
    <link rel="stylesheet" href="styles/styles.css">
    <link rel="stylesheet" href="assets/css/sidebar.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="assets/js/sidebar.js" defer></script>
</head>
<body>
    <!-- Login Screen -->
    <div id="loginScreen" class="login-container">
        <h2>K-Trek Admin Login</h2>
        <div id="loginAlert" class="alert"></div>
        <form id="loginForm">
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="loginEmail" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="loginPassword" required>
            </div>
            <button type="submit" class="btn">Login</button>
        </form>
        <p style="text-align: center; margin-top: 20px; color: #666;">
            Don't have an account? <a href="#" onclick="showRegisterForm()" style="color: #667eea; text-decoration: none;">Register here</a>
        </p>
    </div>

    <!-- Registration Screen -->
    <div id="registerScreen" class="login-container hidden">
        <h2>K-Trek Manager Registration</h2>
        <div id="registerAlert" class="alert"></div>
        <form id="registerForm">
            <div class="form-group">
                <label>Full Name*</label>
                <input type="text" id="registerFullName" required>
            </div>
            <div class="form-group">
                <label>Email*</label>
                <input type="email" id="registerEmail" required>
            </div>
            <div class="form-group">
                <label>Password*</label>
                <input type="password" id="registerPassword" required minlength="6">
                <small style="color: #666; font-size: 12px;">Minimum 6 characters</small>
            </div>
            <button type="submit" class="btn">Register as Manager</button>
        </form>
        <p style="text-align: center; margin-top: 20px; color: #666;">
            Already have an account? <a href="#" onclick="showLoginForm()" style="color: #667eea; text-decoration: none;">Login here</a>
        </p>
    </div>

    <!-- Admin Dashboard -->
    <div id="adminDashboard" class="hidden">
        <!-- Shared top bar: logo + title + user dropdown -->
        <header class="kt-topbar">
            <!-- This slot aligns with the (collapsed) sidebar column -->
            <div class="kt-topbar-sidebar-slot">
                <img src="logo/logo.png" alt="K-Trek Logo" class="kt-topbar-logo">
            </div>

            <!-- This slot aligns with the main content column -->
            <div class="kt-topbar-main-slot">
                <h1 class="kt-topbar-title">Admin Dashboard</h1>

                <!-- Add User Profile Dropdown -->
                <div class="user-profile">
                    <div class="user-info" onclick="toggleProfileDropdown()">
                        <span id="userNameDisplay">User</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div id="profileDropdown" class="dropdown-content" style="display: none;">
                        <a href="#" onclick="editProfile(); event.stopPropagation();">Edit Profile</a>
                        <a href="#" onclick="logout(); event.stopPropagation();">Logout</a>
                    </div>
                </div>
            </div>
        </header>

        <div class="dashboard-container">
            <!-- Left Sidebar Navigation (reusable component) -->
            <?php include 'components/ui/sidebar.php'; ?>

            <!-- Main Content Area -->
            <main class="main-content">

                <div id="alert" class="alert"></div>

                <!-- Tabbed Content Sections -->
                <div class="content-sections">
                    <!-- Dashboard Section (Manager dashboard - keep as-is) -->
                    <div id="dashboard" class="content-section active">

                        <!-- Superadmin Dashboard (hidden for managers; filled by JS) -->
                        <div id="superadminDashboard" style="display:none;">
                            <div class="section-header">
                                <h2>Superadmin Overview</h2>
                                <button class="add-btn" onclick="loadSuperadminDashboard()" style="padding: 8px 15px; font-size: 14px;">Refresh</button>
                            </div>

                            <!-- Manager Overview Cards -->
                            <div class="stats-grid" style="margin-top: 15px;">
                                <div class="stat-card">
                                    <h3>Total Managers</h3>
                                    <div class="number" id="saTotalManagers">0</div>
                                </div>
                                <div class="stat-card">
                                    <h3>Active Managers</h3>
                                    <div class="number" id="saActiveManagers">0</div>
                                </div>
                                <div class="stat-card">
                                    <h3>Inactive / Suspended</h3>
                                    <div class="number" id="saInactiveManagers">0</div>
                                </div>
                                <div class="stat-card">
                                    <h3>New (Period)</h3>
                                    <div class="number" id="saNewManagers">0</div>
                                </div>
                            </div>

                            <!-- Alerts / Risk Indicators -->
                            <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">Risk & Alerts</h3>
                            <div id="saRiskContainer" style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px;"></div>

                            <!-- Manager Table -->
                            <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">Managers</h3>
                            <div class="data-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Status</th>
                                            <th>Last Login</th>
                                            <th>Attractions</th>
                                            <th>Tasks</th>
                                            <th>Reports (Open)</th>
                                            <th>Avg Response (min)</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="saManagersTable">
                                        <tr><td colspan="8" class="loading">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Platform Growth Snapshot -->
                            <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 30px; margin-bottom: 15px;">
                                <h3 style="color:#5E35B1; margin: 0;">Platform Growth Snapshot</h3>
                                <div style="display:flex; gap: 10px;">
                                    <button class="add-btn" onclick="loadSuperadminDashboard(30)" style="padding: 8px 15px; font-size: 14px;">30 Days</button>
                                    <button class="add-btn" onclick="loadSuperadminDashboard(90)" style="padding: 8px 15px; font-size: 14px; background:#E0E0E0; color:#666;">90 Days</button>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                                <div style="background:#fff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD;">
                                    <h4 style="color:#5E35B1; margin:0 0 10px 0;">New Users</h4>
                                    <canvas id="saUsersGrowthChart" style="max-height: 240px;"></canvas>
                                </div>
                                <div style="background:#fff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD;">
                                    <h4 style="color:#5E35B1; margin:0 0 10px 0;">New Attractions</h4>
                                    <canvas id="saAttractionsGrowthChart" style="max-height: 240px;"></canvas>
                                </div>
                            </div>
                            <div style="background:#fff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD; margin-bottom: 30px;">
                                <h4 style="color:#5E35B1; margin:0 0 10px 0;">Engagement (Task Submissions)</h4>
                                <canvas id="saEngagementChart" style="max-height: 260px;"></canvas>
                            </div>

                            <!-- Audit / Activity Summary -->
                            <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">Audit & Activity Summary</h3>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                                <div style="background:#fff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD;">
                                    <h4 style="color:#5E35B1; margin-top:0;">Recent Attractions</h4>
                                    <div id="saRecentAttractions" style="max-height: 280px; overflow:auto;"></div>
                                </div>
                                <div style="background:#fff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD;">
                                    <h4 style="color:#5E35B1; margin-top:0;">Recent Tasks</h4>
                                    <div id="saRecentTasks" style="max-height: 280px; overflow:auto;"></div>
                                </div>
                            </div>

                            <!-- Superadmin Quick Actions -->
                            <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">Superadmin Quick Actions</h3>
                            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 30px;">
                                <button onclick="switchTab('userProgress')" class="add-btn" style="padding: 15px; font-size: 15px; display:flex; align-items:center; justify-content:center; gap: 8px;">
                                    View User Progress
                                </button>
                                <button onclick="switchTab('adminUsers')" class="add-btn" style="padding: 15px; font-size: 15px; display:flex; align-items:center; justify-content:center; gap: 8px; background:#36a2eb;">
                                    👤 Manage Manager Accounts
                                </button>
                                <button onclick="switchTab('reports')" class="add-btn" style="padding: 15px; font-size: 15px; display:flex; align-items:center; justify-content:center; gap: 8px; background:#ff9800;">
                                    📨 View Reports
                                </button>
                            </div>
                        </div>

                        <div class="section-header">
                            <h2>Overview</h2>
                            <button class="add-btn" onclick="loadDashboardStats()" style="padding: 8px 15px; font-size: 14px;">Refresh Stats</button>
                        </div>
                        <br>
                        
                        <!-- Alert Notifications -->
                        <div id="alertsContainer" style="display: none; margin-bottom: 20px;">
                            <!-- Alerts will be dynamically inserted here -->
                        </div>

                        <!-- Recent Changes Section (Manager Only) -->
                        <div id="managerRecentChanges" style="display: none; margin-bottom: 30px;">
                            <div style="background:#fff; padding: 20px; border-radius: 12px; border: 2px solid #E3F2FD; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <h3 style="color: #5E35B1; margin: 0; font-size: 18px;">
                                        <i class="fas fa-history"></i> Recent Changes by Superadmin
                                    </h3>
                                    <button class="add-btn" onclick="loadManagerRecentChanges()" style="padding: 6px 12px; font-size: 13px;">
                                        <i class="fas fa-sync-alt"></i> Refresh
                                    </button>
                                </div>
                                <div id="recentChangesContainer" style="max-height: 350px; overflow-y: auto;">
                                    <p style="color: #888; text-align: center; padding: 20px;">Loading recent changes...</p>
                                </div>
                            </div>
                        </div>

                        <!-- Original Stats Grid -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <h3>📍 Total Attractions</h3>
                                <div class="number" id="totalAttractions">0</div>
                                <div class="trend" id="attractionsTrend"></div> <!-- Placeholder for trend -->
                            </div>
                            <div class="stat-card">
                                <h3>✅ Total Tasks</h3>
                                <div class="number" id="totalTasks">0</div>
                                <div class="trend" id="tasksTrend"></div> <!-- Placeholder for trend -->
                            </div>
                            <div class="stat-card">
                                <h3>👤 Total Users</h3>
                                <div class="number" id="totalUsers">-</div>
                                <small style="opacity: 0.8;">Registered users in the system</small>
                                <div class="trend" id="usersTrend"></div> <!-- Placeholder for trend -->
                            </div>
                            <div class="stat-card">
                                <h3>📢 Pending Reports</h3>
                                <div class="number" id="pendingReports">0</div>
                                <div class="trend" id="reportsTrend"></div> <!-- Placeholder for trend -->
                            </div>
                            <!-- Pending Approvals card is hidden as before -->
                            <div class="stat-card" id="pendingApprovalsCard" style="display: none;">
                                <h3>Pending Approvals</h3>
                                <div class="number" id="pendingApprovals">0</div>
                            </div>
						</div>

                        <!-- User Engagement Metrics -->
                        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">👥 User Engagement Metrics</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <h3>Active Users Today</h3>
                                <div class="number" id="activeUsersToday">0</div>
                                <small style="opacity: 0.8;">Users who completed tasks today</small>
                            </div>
                            <div class="stat-card">
                                <h3>Active Users This Week</h3>
                                <div class="number" id="activeUsersWeek">0</div>
                                <small style="opacity: 0.8;">Users active in the last 7 days</small>
                            </div>
                            <div class="stat-card">
                                <h3>Completion Rate</h3>
                                <div class="number" id="completionRate">0%</div>
                                <small style="opacity: 0.8;">Users who finished all tasks</small>
                            </div>
                            <div class="stat-card">
                                <h3>Avg. Time Spent</h3>
                                <div class="number" id="avgTimeSpent">0 min</div>
                                <small style="opacity: 0.8;">Average completion time</small>
                            </div>
                        </div>

                        <!-- Recent Activity Feed -->
                        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">🔔 Recent Activity</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <!-- Recent Reports -->
                            <div class="activity-feed" style="background: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                                <h4 style="color: #5E35B1; margin-bottom: 10px; margin-top: 0;">📋 New Reports</h4>
                                <div id="recentReportsContainer" style="max-height: 300px; overflow-y: auto;">
                                    <p style="color: #888;">No recent reports</p>
                                </div>
                            </div>
                            <!-- Recent Task Completions -->
                            <div class="activity-feed" style="background: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                                <h4 style="color: #5E35B1; margin-bottom: 10px; margin-top: 0;">✅ Recent Task Completions</h4>
                                <div id="recentCompletionsContainer" style="max-height: 300px; overflow-y: auto;">
                                    <p style="color: #888;">No recent completions</p>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions Panel -->
                        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">⚡ Quick Actions</h3>
                        <div class="quick-actions">
                            <button onclick="navigateTo('reports')" class="add-btn" style="padding: 15px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                📢 View Pending Reports
                            </button>
                            <button onclick="showSection('users')" class="add-btn" style="padding: 15px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; background: #36a2eb;">
                                👥 Check User Activity
                            </button>
                            <button onclick="showSection('attractions')" class="add-btn" style="padding: 15px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; background: #ff9800;">
                                📍 View My Attraction
                            </button>
                            <button onclick="loadDashboardStats()" class="add-btn" style="padding: 15px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; background: #4caf50;">
                                🔄 Refresh Dashboard
                            </button>
                        </div>

                        <!-- Analytics Charts -->
                        <div class="analytics-header">
                            <h3 style="color: #5E35B1; margin: 0;">📈 Analytics</h3>
                            <div class="analytics-period-buttons">
                                <button id="toggle7Days" class="add-btn" onclick="toggleChartPeriod(7)" style="padding: 8px 15px; font-size: 14px; background: #5E35B1;">Last 7 Days</button>
                                <button id="toggle30Days" class="add-btn" onclick="toggleChartPeriod(30)" style="padding: 8px 15px; font-size: 14px; background: #E0E0E0; color: #666;">Last 30 Days</button>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <!-- Task Completion Trend Chart -->
                            <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                                <h4 id="taskCompletionChartTitle" style="color: #5E35B1; margin-bottom: 15px; margin-top: 0;">Task Completions (Last 7 Days)</h4>
                                <canvas id="taskCompletionChart" style="max-height: 250px;"></canvas>
                            </div>
                            <!-- User Activity Chart -->
                            <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #E3F2FD; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                                <h4 id="userActivityChartTitle" style="color: #5E35B1; margin-bottom: 15px; margin-top: 0;">Active Users (Last 7 Days)</h4>
                                <canvas id="userActivityChart" style="max-height: 250px;"></canvas>
                            </div>
                        </div>

                        <!-- Leaderboard -->
                        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #5E35B1;">🏆 Top Performers</h3>
                        <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 2px solid #E3F2FD; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                            <div id="leaderboardContainer">
                                <p style="color: #888; text-align: center;">Loading leaderboard...</p>
                            </div>
                        </div>


                    </div>

                    <!-- Attractions Section -->
                    <div id="attractions" class="content-section">
                        <div class="section-header">
                            <h2>Manage Attractions</h2>
                            <div style="display: flex; gap: 10px; align-items: center;"> <!-- Use flexbox for buttons -->
                                <!-- Superadmin-only Sort By (shown/hidden by JS) -->
                                <div class="form-group" id="attractionSortGroup" style="display: none; margin: 0; width: auto;">
                                    <label for="attractionSortBy" style="margin-right: 6px;">Sort by:</label>
                                    <select id="attractionSortBy" style="width: auto;" onchange="applyAttractionSort()">
                                        <option value="">Default</option>
                                        <option value="name_asc">Name (A-Z)</option>
                                        <option value="name_desc">Name (Z-A)</option>
                                        <option value="id_asc">Attraction ID (Ascending)</option>
                                        <option value="id_desc">Attraction ID (Descending)</option>
                                    </select>
                                </div>

                                <button class="add-btn" onclick="openAttractionModal()">Add Attraction</button>
                                <button class="add-btn" onclick="openTaskAndGuideModal()">Add Task & Guide</button>
                            </div>
                        </div>
                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Description</th>
                                        <th>Image</th> <!-- Added Image column -->
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="attractionsTable">
                                    <tr><td colspan="6" class="loading">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Tasks Section -->
                    <div id="tasks" class="content-section">
                        <div class="section-header">
                            <h2>Manage Tasks</h2>
                            <button class="add-btn" onclick="openTaskModal()">Add Task</button>
                        </div>
                        <!-- Add Filter Section -->
                        <div class="filter-section" style="margin-bottom: 20px;">
                            <div class="form-group" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="taskSearchInput">Search:</label>
                                <input type="text" id="taskSearchInput" placeholder="Task Name..." style="width: 200px;">
                            </div>
                            <div class="form-group" id="taskTypeFilterGroup" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="taskTypeFilter">Type:</label>
                                <select id="taskTypeFilter" style="width: auto;">
                                    <option value="">All Types</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="checkin">Check-in</option>
                                    <option value="direction">Direction & Orientation</option>
                                    <option value="observation_match">Observation Match</option>
                                    <option value="count_confirm">Count & Confirm</option>
                                    <option value="time_based">Time Based</option>
                                </select>
                            </div>
                            <div class="form-group" id="taskAttractionFilterGroup" style="display: none; margin-right: 15px; width: auto;">
                                <label for="taskAttractionFilter">Attraction:</label>
                                <select id="taskAttractionFilter" style="width: auto;">
                                    <option value="">All Attractions</option>
                                    <!-- Options will be populated by JS -->
                                </select>
                            </div>
                             <button class="btn" onclick="applyTaskFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 15px; font-size: 14px;">Apply Filters</button>
                             <button class="btn" onclick="clearTaskFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 15px; font-size: 14px; background: #9ca3af;">Clear</button>
                        </div>
                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Task Name</th>
                                        <th>Attraction</th>
                                        <th>Type</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="tasksTable">
                                    <tr><td colspan="5" class="loading">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Guides Section -->
                    <div id="guides" class="content-section">
                        <div class="section-header">
                            <h2>Manage Guides</h2>
                            <button class="add-btn" onclick="openGuideModal()">Add Guide</button>
                        </div>
                        <!-- Add Filter Section for Guides -->
                        <div class="filter-section" style="margin-bottom: 20px;">
                            <div class="form-group" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="guideSearchInput">Search:</label>
                                <input type="text" id="guideSearchInput" placeholder="Guide Title, Content..." style="width: 200px;">
                            </div>
                            <div class="form-group" id="guideAttractionFilterGroup" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="guideAttractionFilter">Attraction:</label>
                                <select id="guideAttractionFilter" style="width: auto;">
                                    <option value="">All Attractions</option>
                                    <!-- Options will be populated by JS -->
                                </select>
                            </div>
                             <button class="btn" onclick="applyGuideFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 10px; font-size: 14px;">Apply Filters</button>
                             <button class="btn" onclick="clearGuideFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 10px; font-size: 14px; background: #9ca3af;">Clear</button>
                        </div>
                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Attraction</th>
                                        <th>Content</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="guidesTable">
                                    <tr><td colspan="5" class="loading">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Rewards Section -->
                    <div id="rewards" class="content-section">
                        <div class="section-header">
                            <h2>Manage Rewards</h2>
                            <button class="add-btn" onclick="openRewardModal()">Add Reward</button>
                        </div>
                        
                        <!-- Filter Section -->
                        <div class="filter-section" style="margin-bottom: 20px;">
                            <div class="form-group" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="rewardSearchInput">Search:</label>
                                <input type="text" id="rewardSearchInput" placeholder="Search by title or description..." style="width: 250px;">
                            </div>
                            <div class="form-group" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="rewardTypeFilter">Type:</label>
                                <select id="rewardTypeFilter" style="width: auto;">
                                    <option value="">All Types</option>
                                    <option value="badge">Badge</option>
                                    <option value="title">Title</option>
                                </select>
                            </div>
                            <div class="form-group" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="rewardStatusFilter">Status:</label>
                                <select id="rewardStatusFilter" style="width: auto;">
                                    <option value="">All Status</option>
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            </div>
                            <button class="btn" onclick="applyRewardFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 15px; font-size: 14px;">Apply Filters</button>
                            <button class="btn" onclick="clearRewardFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 15px; font-size: 14px; background: #9ca3af;">Clear</button>
                        </div>

                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Icon</th>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Category</th>
                                        <th>Trigger</th>
                                        <th>Rarity</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="rewardsTable">
                                    <tr><td colspan="9" class="loading">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Reports Section -->
                    <div id="reports" class="content-section">
                        <h2>User Reports</h2>
                        <!-- Add Filter Section for Reports -->
                        <div class="filter-section" style="margin-bottom: 20px;">
                            <div class="form-group" style="display: inline-block; margin-right: 15px; width: auto;">
                                <label for="reportStatusFilter">Status:</label>
                                <select id="reportStatusFilter" style="width: auto;">
                                    <option value="">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Replied">Replied</option>
                                </select>
                            </div>
                             <button class="btn" onclick="applyReportFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 15px; font-size: 14px;">Apply Filters</button>
                             <button class="btn" onclick="clearReportFilters()" style="display: inline-block; margin-top: 25px; padding: 8px 15px; font-size: 14px; background: #9ca3af;">Clear</button>
                        </div>

                        <!-- Add Initial Select Button -->
                        <div class="bulk-action-initiate" id="bulkActionInitiateReports" style="margin-bottom: 10px; display: block;"> <!-- Initially visible -->
                            <button class="btn" onclick="enterBulkSelectionModeReports()" style="padding: 8px 15px; font-size: 14px; background: #3b82f6;">Select Reports</button>
                        </div>

                        <!-- Add Bulk Action Controls (Initially Hidden) -->
                        <div class="bulk-action-controls" id="bulkActionControlsReports" style="margin-bottom: 10px; display: none; align-items: center;"> <!-- Initially hidden -->
                            <button class="btn" id="bulkDeleteReportsBtn" onclick="bulkDeleteReports()" style="padding: 8px 15px; font-size: 14px; background: #ef4444; margin-right: 10px;" disabled>Delete Selected</button> <!-- Initially disabled -->
                            <button class="btn" onclick="exitBulkSelectionModeReports()" style="padding: 8px 15px; font-size: 14px; background: #9ca3af;">Cancel</button>
                            <span id="selectedReportCount" style="margin-left: 15px; color: #667eea;">0 selected</span>
                        </div>

                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th id="reportsSelectHeader" style="display: none;"><!-- Checkbox in header will appear here --></th> <!-- Initially hidden -->
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Attraction</th>
                                        <th>Message</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="reportsTable">
                                    <tr><td colspan="8" class="loading">Loading...</td></tr> <!-- Adjust colspan -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- User Progress Section -->
                    <div id="userProgress" class="content-section">
                        <h2>User Progress Analytics</h2>
                        
                        <!-- Charts Section -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px;">
                            <!-- Overall Progress Chart -->
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="margin-top: 0; color: #333;">Overall Task Completion</h3>
                                <canvas id="overallProgressChart"></canvas>
                            </div>
                            
                            <!-- Attraction Completion Chart -->
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h3 style="margin-top: 0; color: #333;">Attraction Completion Status</h3>
                                <canvas id="attractionCompletionChart"></canvas>
                            </div>
                        </div>
                        
                        <!-- User Progress Distribution Chart -->
                        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px;">
                            <h3 style="margin-top: 0; color: #333;">User Progress Distribution</h3>
                            <canvas id="userProgressChart" style="max-height: 400px;"></canvas>
                        </div>
                        
                        <!-- Data Table (Collapsible) -->
                        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3 style="margin: 0; color: #333;">Detailed Progress Data</h3>
                                <button onclick="toggleProgressTable()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Toggle Table
                                </button>
                            </div>
                            <div id="progressTableContainer" class="data-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User ID</th>
                                            <th>Attraction</th>
                                            <th>Completed Tasks</th>
                                            <th>Total Tasks</th>
                                            <th>Progress %</th>
                                            <th>Is Unlocked</th>
                                            <th>Last Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody id="progressTable">
                                        <tr><td colspan="7" class="loading">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Admin Users Section -->
                    <div id="adminUsers" class="content-section">
                        <h2>Admin User Management</h2>
                        <p style="margin-bottom: 20px; color: #666;">Manage system administrators and attraction managers</p>
                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Attraction</th>
                                        <th>Status</th>
                                        <th>Last Login</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="adminUsersTable">
                                    <tr><td colspan="9" class="loading">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Attraction Modal -->
    <div id="attractionModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="attractionModalTitle">Add Attraction</h3>
                <button class="close-btn" onclick="closeAttractionModal()">&times;</button>
            </div>
            <form id="attractionForm">
                <input type="hidden" id="attractionId">
                <input type="hidden" id="attractionImage"> <!-- To hold existing image path when editing -->
                <div class="form-group">
                    <label>Name*</label>
                    <input type="text" id="attractionName" required>
                </div>
                <div class="form-group">
                    <label>Location*</label>
                    <input type="text" id="attractionLocation" required>
                </div>
                <div class="form-group">
                    <label>Coordinates (Optional)</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 12px; color: #888;">Latitude</label>
                            <input type="number" id="attractionLatitude" step="0.000001" min="-90" max="90" placeholder="e.g., 6.1335">
                            <small style="color: #666; font-size: 11px;">Range: -90 to 90</small>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #888;">Longitude</label>
                            <input type="number" id="attractionLongitude" step="0.000001" min="-180" max="180" placeholder="e.g., 102.2437">
                            <small style="color: #666; font-size: 11px;">Range: -180 to 180</small>
                        </div>
                    </div>
                    <small style="color: #4a9eff; font-size: 12px; display: block; margin-top: 5px;">
                        💡 Add coordinates to show this attraction on the homepage map! Find them at <a href="https://www.latlong.net/" target="_blank" style="color: #4a9eff;">latlong.net</a>
                    </small>
                </div>
                <div class="form-group">
                    <label>Description*</label>
                    <textarea id="attractionDescription" required></textarea>
                </div>
                <div class="form-group">
                    <label>Navigation Link (Google Maps)</label>
                    <input type="url" id="attractionNavigationLink" placeholder="https://www.google.com/maps/place/...">
                    <small style="color: #666; font-size: 12px;">Optional. If provided, users can tap “Navigate” on the Attraction Details page.</small>
                </div>
                <div class="form-group">
                    <label>Image File</label>
                    <input type="file" id="attractionImageFile" accept="image/*">
                    <small style="color: #666; font-size: 12px;">Upload an image (JPEG, PNG, GIF, WEBP)</small>
                </div>
                <!-- Optional: Display current image if editing -->
                <div class="form-group" id="currentAttractionImageContainer" style="display: none;">
                    <label>Current Image:</label>
                    <img id="currentAttractionImage" src="" alt="Current Attraction Image" style="max-width: 200px; max-height: 200px; display: block; margin-top: 5px;">
                </div>
                <button type="submit" class="btn">Save Attraction</button>
            </form>
        </div>
    </div>

    <!-- Task Modal -->
    <div id="taskModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="taskModalTitle">Add Task</h3>
                <button class="close-btn" onclick="closeTaskModal()">&times;</button>
            </div>
            <form id="taskForm">
                <input type="hidden" id="taskId">
                <input type="hidden" id="taskQR">
                <input type="hidden" id="taskMedia">
                <div class="form-group">
                    <label>Task Name*</label>
                    <input type="text" id="taskName" required>
                </div>
                <div class="form-group">
                    <label>Attraction*</label>
                    <select id="taskAttraction" required>
                        <option value="">Select Attraction</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Type*</label>
                    <select id="taskType" required>
                        <option value="">Select Type</option>
                        <option value="quiz">Quiz</option>
                        <option value="checkin">Check-in</option>
                        <option value="count_confirm">Count & Confirm</option>
                        <option value="direction">Direction & Orientation</option>
                        <option value="riddle">Riddle / Puzzle</option>
                        <option value="memory_recall">Memory Recall</option>
                        <option value="observation_match">Observation Match</option>
                        <option value="route_completion">Route Completion</option>
                        <option value="time_based">Time-Based Challenge</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description*</label>
                    <textarea id="taskDescription" required></textarea>
                </div>
                
                <!-- Quiz Questions Section (only visible for quiz type) -->
                <div id="quizQuestionsSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Quiz Questions</h4>
                    <div id="quizQuestionsList"></div>
                    <button type="button" class="btn" onclick="addQuizQuestion()" style="background: #3b82f6; margin-top: 10px;">
                        <i class="fas fa-plus"></i> Add Question
                    </button>
                </div>

                <!-- Count & Confirm Section (only visible for count_confirm type) -->
                <div id="countConfirmSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Count & Confirm Configuration</h4>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">What should users count?*</label>
                        <input type="text" id="countTargetObject" placeholder="e.g., Wooden pillars, Buddha statues, Steps" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Describe the object users need to count</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Correct Count*</label>
                        <input type="number" id="countCorrectCount" min="1" placeholder="e.g., 12" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">The actual number of objects</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Tolerance (±)</label>
                        <input type="number" id="countTolerance" min="0" value="0" placeholder="0" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Allow ± this many for correct answer (default: 0 = exact count required)</small>
                    </div>
                </div>

                <!-- Direction & Orientation Section (only visible for direction type) -->
                <div id="directionSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Direction & Orientation Configuration</h4>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Question*</label>
                        <input type="text" id="directionQuestion" placeholder="e.g., Which direction is the Buddha facing?" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Ask users to identify a direction</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Correct Direction*</label>
                        <select id="directionCorrect" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                            <option value="">Select Direction</option>
                            <option value="North">North</option>
                            <option value="Northeast">Northeast</option>
                            <option value="East">East</option>
                            <option value="Southeast">Southeast</option>
                            <option value="South">South</option>
                            <option value="Southwest">Southwest</option>
                            <option value="West">West</option>
                            <option value="Northwest">Northwest</option>
                        </select>
                        <small style="color: #a0aec0; font-size: 12px;">The correct direction</small>
                    </div>
                </div>

                <!-- Time-Based Challenge Section (only visible for time_based type) -->
                <div id="timeBasedSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Time-Based Challenge Configuration</h4>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Start Time*</label>
                        <input type="time" id="timeStartTime" value="17:30" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">When can users start checking in</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">End Time*</label>
                        <input type="time" id="timeEndTime" value="19:00" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">When does the time window close</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Minimum Duration (minutes)</label>
                        <input type="number" id="timeMinDuration" value="10" min="1" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">How long users must stay checked in (optional)</small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>QR Code String (for Check-in tasks)</label>
                    <input type="text" id="taskQRString" readonly placeholder="Generate or upload QR code">
                    <small style="color: #666; font-size: 12px;">Unique token for this check-in location</small>
                </div>
                <div class="form-group" id="qrActionsContainer" style="display: none;">
                    <button type="button" class="btn" onclick="generateQRToken()" style="background: #10b981; margin-right: 10px;">
                        <i class="fas fa-qrcode"></i> Generate QR Token
                    </button>
                    <button type="button" class="btn" onclick="downloadQRCode()" id="downloadQRBtn" style="background: #3b82f6;" disabled>
                        <i class="fas fa-download"></i> Download QR Code
                    </button>
                </div>
                <div class="form-group" id="currentQRContainer" style="display: none;">
                    <label>Current QR Code Preview:</label>
                    <img id="currentQR" src="" alt="Current QR" style="max-width: 300px; max-height: 300px; border: 2px solid #4a5568; border-radius: 8px; padding: 10px; background: white;">
                    <small id="qrInfoText" style="color: #666; font-size: 11px; display: block; margin-top: 5px; word-break: break-all;"></small>
                </div>
                <div class="form-group">
                    <label>Media File</label>
                    <input type="file" id="taskMediaFile" accept="image/*">
                    <small style="color: #666; font-size: 12px;">Upload media file (for photo tasks)</small>
                </div>
                <div class="form-group" id="currentMediaContainer" style="display: none;">
                    <label>Current Media:</label>
                    <img id="currentMedia" src="" alt="Current Media" style="max-width: 200px; max-height: 200px;">
                </div>
                <button type="submit" class="btn">Save Task</button>
            </form>
        </div>
    </div>

    <!-- Guide Modal -->
    <div id="guideModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="guideModalTitle">Add Guide</h3>
                <button class="close-btn" onclick="closeGuideModal()">&times;</button>
            </div>
            <form id="guideForm">
                <input type="hidden" id="guideId">
                <div class="form-group">
                    <label>Title*</label>
                    <input type="text" id="guideTitle" required>
                </div>
                <div class="form-group">
                    <label>Attraction*</label>
                    <select id="guideAttraction" required>
                        <option value="">Select Attraction</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Task*</label>
                    <select id="guideTask" required>
                        <option value="">Select Task</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Content*</label>
                    <textarea id="guideContent" required rows="8"></textarea>
                </div>
                <button type="submit" class="btn">Save Guide</button>
            </form>
        </div>
    </div>

    <!-- Task & Guide Modal -->
    <div id="taskAndGuideModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="taskAndGuideModalTitle">Add Task & Guide for Attraction</h3>
                <button class="close-btn" onclick="closeTaskAndGuideModal()">&times;</button>
            </div>
            <form id="taskAndGuideForm">
                <input type="hidden" id="taskAndGuideAttractionId"> <!-- Stores the ID of the attraction this task/guide is for -->
                <input type="hidden" id="taskAndGuideTaskId"> <!-- Stores the ID of the task if editing -->
                <input type="hidden" id="taskAndGuideGuideId"> <!-- Stores the ID of the guide if editing -->
                <input type="hidden" id="taskAndGuideQR"> <!-- To hold existing QR path when editing -->
                <input type="hidden" id="taskAndGuideMedia"> <!-- To hold existing media path when editing -->

                <!-- Task Details -->
                <h4 style="margin-top: 0; color: #e0e0e0;">Task Details</h4>
                <div class="form-group">
                    <label>Task Name*</label>
                    <input type="text" id="taskAndGuideTaskName" required>
                </div>
                <div class="form-group">
                    <label>Type*</label>
                    <select id="taskAndGuideTaskType" required>
                        <option value="">Select Type</option>
                        <option value="quiz">Quiz</option>
                        <option value="photo">Photo Upload</option>
                        <option value="checkin">Check-in</option>
                        <option value="count_confirm">Count & Confirm</option>
                        <option value="direction">Direction & Orientation</option>
                        <option value="riddle">Riddle / Puzzle</option>
                        <option value="memory_recall">Memory Recall</option>
                        <option value="observation_match">Observation Match</option>
                        <option value="route_completion">Route Completion</option>
                        <option value="time_based">Time-Based Challenge</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description*</label>
                    <textarea id="taskAndGuideTaskDescription" required></textarea>
                </div>
                
                <!-- Quiz Questions Section for Task & Guide Modal -->
                <div id="taskAndGuideQuizSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Quiz Questions</h4>
                    <div id="taskAndGuideQuizList"></div>
                    <button type="button" class="btn" onclick="addTaskAndGuideQuizQuestion()" style="background: #3b82f6; margin-top: 10px;">
                        <i class="fas fa-plus"></i> Add Question
                    </button>
                </div>

                <!-- Count & Confirm Section for Task & Guide Modal -->
                <div id="taskAndGuideCountConfirmSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Count & Confirm Configuration</h4>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">What should users count?*</label>
                        <input type="text" id="taskAndGuideCountTargetObject" placeholder="e.g., Wooden pillars, Buddha statues, Steps" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Describe the object users need to count</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Correct Count*</label>
                        <input type="number" id="taskAndGuideCountCorrectCount" min="1" placeholder="e.g., 12" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">The actual number of objects</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Tolerance (±)</label>
                        <input type="number" id="taskAndGuideCountTolerance" min="0" value="0" placeholder="0" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Allow ± this many for correct answer (default: 0 = exact count required)</small>
                    </div>
                </div>

                <!-- Direction & Orientation Section for Task & Guide Modal -->
                <div id="taskAndGuideDirectionSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Direction & Orientation Configuration</h4>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Question*</label>
                        <input type="text" id="taskAndGuideDirectionQuestion" placeholder="e.g., Which direction is the Buddha facing?" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Ask users to identify a direction</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Correct Direction*</label>
                        <select id="taskAndGuideDirectionCorrect" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                            <option value="">Select Direction</option>
                            <option value="North">North</option>
                            <option value="Northeast">Northeast</option>
                            <option value="East">East</option>
                            <option value="Southeast">Southeast</option>
                            <option value="South">South</option>
                            <option value="Southwest">Southwest</option>
                            <option value="West">West</option>
                            <option value="Northwest">Northwest</option>
                        </select>
                        <small style="color: #a0aec0; font-size: 12px;">The correct direction</small>
                    </div>
                </div>

                <!-- Time-Based Challenge Section for Task & Guide Modal -->
                <div id="taskAndGuideTimeBasedSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Time-Based Challenge Configuration</h4>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Start Time*</label>
                        <input type="time" id="taskAndGuideTimeStartTime" value="17:30" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">When can users start checking in</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">End Time*</label>
                        <input type="time" id="taskAndGuideTimeEndTime" value="19:00" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">When does the time window close</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Minimum Duration (minutes)</label>
                        <input type="number" id="taskAndGuideTimeMinDuration" value="10" min="1" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">How long users must stay checked in (optional)</small>
                    </div>
                </div>

                <!-- Riddle Section for Task & Guide Modal -->
                <div id="taskAndGuideRiddleSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Riddle / Puzzle Configuration</h4>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Riddle Question*</label>
                        <textarea id="taskAndGuideRiddleQuestion" placeholder="Enter your riddle or puzzle question..." rows="3" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;"></textarea>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Correct Answer*</label>
                        <input type="text" id="taskAndGuideRiddleAnswer" placeholder="The answer to the riddle" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Case-insensitive matching will be used</small>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Hints (optional, one per line)</label>
                        <textarea id="taskAndGuideRiddleHints" placeholder="Enter hints, one per line..." rows="3" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;"></textarea>
                    </div>
                </div>

                <!-- Memory Recall Section for Task & Guide Modal -->
                <div id="taskAndGuideMemoryRecallSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Memory Recall Configuration</h4>
                    <p style="color: #a0aec0; font-size: 13px;">Users will be shown information, then asked to recall it after a delay.</p>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Information to Memorize*</label>
                        <textarea id="taskAndGuideMemoryInfo" placeholder="Enter the information users need to memorize..." rows="3" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;"></textarea>
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Recall Question*</label>
                        <input type="text" id="taskAndGuideMemoryQuestion" placeholder="What should users recall?" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Correct Answer*</label>
                        <input type="text" id="taskAndGuideMemoryAnswer" placeholder="The expected answer" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                    </div>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Delay (seconds)</label>
                        <input type="number" id="taskAndGuideMemoryDelay" value="30" min="5" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                        <small style="color: #a0aec0; font-size: 12px;">Time before showing the recall question</small>
                    </div>
                </div>

                <!-- Observation Match Section for Task & Guide Modal -->
                <div id="taskAndGuideObservationMatchSection" style="display: none; margin-top: 20px;">
                    <div style="background: #1e293b; border-radius: 8px; padding: 20px; border: 2px solid #5E35B1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <h4 style="color: #e0e0e0; margin: 0; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-eye" style="color: #5E35B1;"></i>
                                    Observation Match - Multiple Choice
                                </h4>
                                <p style="color: #9ca3af; font-size: 13px; margin: 5px 0 0 0;">
                                    Add observable items, each with answer options (not the Quiz modal).
                                </p>
                            </div>
                        </div>
                        
                        <div style="background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
                            <p style="color: #93c5fd; font-size: 13px; margin: 0;">
                                <i class="fas fa-info-circle"></i> <strong>Guidelines:</strong>
                                Add at least one observable item and select the correct answer for each.
                            </p>
                        </div>
                        
                        <div id="taskAndGuideObservationQuestionsList"></div>
                        <button type="button" class="btn" onclick="addTaskAndGuideObservationMatchQuestion()" 
                                style="background: #3b82f6; color: white; margin-top: 10px; width: 100%;">
                            <i class="fas fa-plus"></i> Add Observable Item
                        </button>
                    </div>
                </div>

                <!-- Route Completion Section for Task & Guide Modal -->
                <div id="taskAndGuideRouteCompletionSection" style="display: none; margin-top: 20px; padding: 15px; background: #2d3748; border-radius: 5px;">
                    <h4 style="color: #e0e0e0; margin-top: 0;">Route Completion Configuration</h4>
                    <p style="color: #a0aec0; font-size: 13px;">Users must visit checkpoints in order to complete the route.</p>
                    <div class="form-group">
                        <label style="color: #e0e0e0;">Route Name*</label>
                        <input type="text" id="taskAndGuideRouteName" placeholder="e.g., Temple Discovery Trail" style="background: #1a202c; color: #e0e0e0; border: 1px solid #4a5568;">
                    </div>
                    <div id="taskAndGuideRouteCheckpoints">
                        <!-- Checkpoints will be added here -->
                    </div>
                    <button type="button" class="btn" onclick="addTaskAndGuideRouteCheckpoint()" style="background: #3b82f6; margin-top: 10px;">
                        <i class="fas fa-plus"></i> Add Checkpoint
                    </button>
                </div>
                
                <div class="form-group">
                    <label>QR Code File</label>
                    <input type="file" id="taskAndGuideQRFile" accept="image/*">
                    <small style="color: #666; font-size: 12px;">Upload a QR code image (JPEG, PNG, GIF, WEBP)</small>
                </div>
                <!-- Optional: Display current QR if editing -->
                <div class="form-group" id="currentTaskAndGuideQRContainer" style="display: none;">
                    <label>Current QR Code:</label>
                    <img id="currentTaskAndGuideQR" src="" alt="Current QR Code" style="max-width: 200px; max-height: 200px; display: block; margin-top: 5px;">
                </div>
                <div class="form-group">
                    <label>QR Code String (Fallback/Editing)</label>
                    <input type="text" id="taskAndGuideQRString"> <!-- Keep text input for editing existing path or fallback -->
                </div>
                <div class="form-group">
                    <label>Media File (for Photo Tasks)</label>
                    <input type="file" id="taskAndGuideMediaFile" accept="image/*">
                    <small style="color: #666; font-size: 12px;">Upload a media file (JPEG, PNG, GIF, WEBP)</small>
                </div>
                <!-- Optional: Display current media if editing -->
                <div class="form-group" id="currentTaskAndGuideMediaContainer" style="display: none;">
                    <label>Current Media:</label>
                    <img id="currentTaskAndGuideMedia" src="" alt="Current Media" style="max-width: 200px; max-height: 200px; display: block; margin-top: 5px;">
                </div>

                <!-- Guide Details -->
                <h4 style="margin-top: 20px; color: #e0e0e0;" id="guideInfoHeader">Guide Details</h4>
                <div class="form-group">
                    <label id="guideTitleLabel">Title*</label>
                    <input type="text" id="taskAndGuideGuideTitle" required>
                </div>
                <div class="form-group">
                    <label id="guideContentLabel">Content*</label>
                    <textarea id="taskAndGuideGuideContent" required></textarea>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;"> <!-- Button container -->
                    <button type="button" class="btn" onclick="addMoreTaskAndGuide()" style="background: #3b82f6;">Add More Task & Guide</button> <!-- New button -->
                    <button type="submit" class="btn" style="background: #10b981;">Finish</button> <!-- Submit button -->
                </div>
            </form>
        </div>
    </div>

    <!-- Reward Modal -->
    <?php include 'components/reward_modal.php'; ?>
	
	<!-- Edit Profile Modal -->
    <div id="editProfileModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Profile</h3>
                <button class="close-btn" onclick="closeEditProfileModal()">&times;</button>
            </div>
            <form id="editProfileForm">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="editProfileEmail" readonly disabled> <!-- Readonly/disabled as email shouldn't change -->
                    <small style="color: #666; font-size: 12px;">Email cannot be changed.</small>
                </div>
                <div class="form-group">
                    <label>Full Name*</label>
                    <input type="text" id="editProfileFullName" name="full_name" required>
                </div>
                <div class="form-group">
                    <label>New Password (Leave blank to keep current)</label>
                    <input type="password" id="editProfilePassword" name="password" minlength="6">
                    <small style="color: #666; font-size: 12px;">Minimum 6 characters. Leave blank to keep current password.</small>
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" id="editProfileConfirmPassword" name="confirm_password">
                </div>
                <button type="submit" class="btn">Save Changes</button>
            </form>
        </div>
    </div>

    <!-- Reply Modal -->
    <div id="replyModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reply to Report</h3>
                <button class="close-btn" onclick="closeReplyModal()">&times;</button>
            </div>
            <form id="replyForm">
                <input type="hidden" id="replyReportId">
                <div class="form-group">
                    <label>Reply Message*</label>
                    <textarea id="replyMessage" required></textarea>
                </div>
                <button type="submit" class="btn">Send Reply</button>
            </form>
        </div>
    </div>

	<script src="javascript/main.js?v=<?php echo time(); ?>"></script>
	<script src="javascript/rewards.js?v=<?php echo time(); ?>"></script>
</body>
</html>