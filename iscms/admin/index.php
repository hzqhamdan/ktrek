<?php
// iSCMS Admin Panel - Main Interface
session_start();

// Redirect to login if not authenticated
if (!isset($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit();
}

// Get admin details
$adminName = $_SESSION['admin_full_name'] ?? 'Admin';
$adminRole = $_SESSION['admin_role'] ?? 'Admin';
$adminEmail = $_SESSION['admin_email'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iSCMS Admin Panel - Sugar Intake Monitoring System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/sidebar.css">
    <link rel="stylesheet" href="assets/css/content-management.css">
</head>
<body>
    <!-- Include Sidebar -->
    <?php include 'components/ui/sidebar.php'; ?>

    <!-- Main Content Area -->
    <main class="main-content" id="mainContent">
        <!-- Dashboard Section -->
        <section id="dashboardSection" class="content-section active">
            <div class="section-header">
                <h1>Dashboard</h1>
                <p>Welcome to iSCMS Admin Panel - Sugar Intake Monitoring System</p>
            </div>
            
            <!-- Key Metrics -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="totalUsers">0</h3>
                        <p>Total Active Users</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="newRegistrations">0</h3>
                        <p>Today's Registrations</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M208,97.37V96A80,80,0,0,0,48,96v1.37A24,24,0,0,0,56,144h3.29l54.82,95.94a16,16,0,0,0,27.78,0L196.71,144H200a24,24,0,0,0,8-46.63ZM77.71,144H97.07l40.61,71.06L128,232Zm57.08,0,21.75,38.06-9.65,16.88L115.5,144Zm31,21.94L153.21,144h25.08ZM200,128H56a8,8,0,0,1,0-16,8,8,0,0,0,8-8V96a64,64,0,0,1,128,0v8a8,8,0,0,0,8,8,8,8,0,0,1,0,16Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="avgSugarIntake">0g</h3>
                        <p>Avg Sugar Intake</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="exceedingUsers">0%</h3>
                        <p>Users Exceeding Limits</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M120,16V8a8,8,0,0,1,16,0v8a8,8,0,0,1-16,0Zm80,32a8,8,0,0,0,5.66-2.34l8-8a8,8,0,0,0-11.32-11.32l-8,8A8,8,0,0,0,200,48ZM50.34,45.66A8,8,0,0,0,61.66,34.34l-8-8A8,8,0,0,0,42.34,37.66Zm87,26.45a8,8,0,1,0-2.64,15.78C153.67,91.08,168,108.32,168,128a8,8,0,0,0,16,0C184,100.6,163.93,76.57,137.32,72.11ZM232,176v24a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V176a16,16,0,0,1,16-16V128a88,88,0,0,1,88.67-88c48.15.36,87.33,40.29,87.33,89v31A16,16,0,0,1,232,176ZM56,160H200V129c0-40-32.05-72.71-71.45-73H128a72,72,0,0,0-72,72Zm160,40V176H40v24H216Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="highRiskUsers">0</h3>
                        <p>High-Risk Users</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M224,71.1a8,8,0,0,1-10.78-3.42,94.13,94.13,0,0,0-33.46-36.91,8,8,0,1,1,8.54-13.54,111.46,111.46,0,0,1,39.12,43.09A8,8,0,0,1,224,71.1ZM35.71,72a8,8,0,0,0,7.1-4.32A94.13,94.13,0,0,1,76.27,30.77a8,8,0,1,0-8.54-13.54A111.46,111.46,0,0,0,28.61,60.32,8,8,0,0,0,35.71,72Zm186.1,103.94A16,16,0,0,1,208,200H167.2a40,40,0,0,1-78.4,0H48a16,16,0,0,1-13.79-24.06C43.22,160.39,48,138.28,48,112a80,80,0,0,1,160,0C208,138.27,212.78,160.38,221.81,175.94ZM150.62,200H105.38a24,24,0,0,0,45.24,0ZM208,184c-10.64-18.27-16-42.49-16-72a64,64,0,0,0-128,0c0,29.52-5.38,53.74-16,72Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="activeAlerts">0</h3>
                        <p>Active Alerts</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M237.66,66.34l-48-48a8,8,0,0,0-11.32,11.32L196.69,48,168,76.69,133.66,42.34a8,8,0,0,0-11.32,11.32L128.69,60l-84,84A15.86,15.86,0,0,0,40,155.31v49.38L18.34,226.34a8,8,0,0,0,11.32,11.32L51.31,216h49.38A15.86,15.86,0,0,0,112,211.31l84-84,6.34,6.35a8,8,0,0,0,11.32-11.32L179.31,88,208,59.31l18.34,18.35a8,8,0,0,0,11.32-11.32ZM100.69,200H56V155.31l18-18,20.34,20.35a8,8,0,0,0,11.32-11.32L85.31,126,98,113.31l20.34,20.35a8,8,0,0,0,11.32-11.32L109.31,102,140,71.31,184.69,116Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="cgmDevices">0</h3>
                        <p>CGM Devices Connected</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M232,64H208V48a8,8,0,0,0-8-8H56a8,8,0,0,0-8,8V64H24A16,16,0,0,0,8,80V96a40,40,0,0,0,40,40h3.65A80.13,80.13,0,0,0,120,191.61V216H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V191.58c31.94-3.23,58.44-25.64,68.08-55.58H208a40,40,0,0,0,40-40V80A16,16,0,0,0,232,64ZM48,120A24,24,0,0,1,24,96V80H48v32q0,4,.39,8Zm144-8.9c0,35.52-29,64.64-64,64.9a64,64,0,0,1-64-64V56H192ZM232,96a24,24,0,0,1-24,24h-.5a81.81,81.81,0,0,0,.5-8.9V80h24Z"></path></svg>
                    </div>
                    <div class="metric-info">
                        <h3 id="goalAchievement">0%</h3>
                        <p>Goal Achievement Rate</p>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <h2>Quick Actions</h2>
                <div class="action-buttons">
                    <?php if ($adminRole !== 'Healthcare Provider'): ?>
                    <button class="action-btn" onclick="openBroadcastNotification()">
                        <span>📢</span> Send Broadcast Notification
                    </button>
                    <button class="action-btn" onclick="showSection('foodDatabaseSection')">
                        <span>🍽️</span> Add Food Item
                    </button>
                    <?php endif; ?>
                    <button class="action-btn" onclick="showSection('alertsSection')">
                        <span>⚠️</span> View Critical Alerts
                    </button>
                    <button class="action-btn" onclick="showSection('reportsSection')">
                        <span>📊</span> Export Daily Report
                    </button>
                    <?php if ($adminRole !== 'Healthcare Provider'): ?>
                    <button class="action-btn" onclick="showSection('supportSection')">
                        <span>🎫</span> Manage Support Tickets
                    </button>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Health Status Breakdown -->
            <div class="health-breakdown">
                <h2>Health Status Distribution</h2>
                <div id="healthStatusChart" class="health-status-chart">
                    <p class="no-data">Loading health status breakdown...</p>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="recent-activity">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">Real-Time Activity Feed</h2>
                    <span class="refresh-indicator" id="refreshIndicator">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                        </svg>
                        Auto-refresh: ON
                    </span>
                </div>
                <div id="activityFeed" class="activity-feed">
                    <p class="no-data">Loading recent activity...</p>
                </div>
            </div>
        </section>

        <!-- User Management Section -->
        <section id="usersSection" class="content-section">
            <div class="section-header">
                <h1><?= $adminRole === 'Healthcare Provider' ? 'My Patients' : 'User Management' ?></h1>
                <?php if ($adminRole !== 'Healthcare Provider'): ?>
                <button class="btn-primary" onclick="exportUsers()">Export Users</button>
                <?php endif; ?>
            </div>

            <!-- Filters -->
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                <div>
                    <label style="font-size: 12px; opacity: 0.8; margin-right: 5px;">Search:</label>
                    <input type="text" id="userSearchInput" placeholder="Search by name, email..." onkeyup="loadUsers()" style="padding: 6px 10px; background:#3d2a1d; color:#c9b7a9; border:1px solid rgba(201,183,169,0.3); border-radius:6px; width: 250px;">
                </div>
                <div>
                    <label style="font-size: 12px; opacity: 0.8; margin-right: 5px;">Health Status:</label>
                    <select id="userHealthStatusFilter" onchange="loadUsers()" style="padding: 6px 10px; background:#3d2a1d; color:#c9b7a9; border:1px solid rgba(201,183,169,0.3); border-radius:6px;">
                        <option value="">All Statuses</option>
                        <option value="Healthy">Healthy</option>
                        <option value="Pre-diabetic">Pre-diabetic</option>
                        <option value="Type 1 Diabetes">Type 1 Diabetes</option>
                        <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                        <option value="Gestational Diabetes">Gestational Diabetes</option>
                    </select>
                </div>
            </div>

            <div class="table-container">
                <table id="usersTable" class="data-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Health Status</th>
                            <th>Registration Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="7">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Healthcare Providers Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="providersSection" class="content-section">
            <div class="section-header">
                <h1>Healthcare Providers Management</h1>
                <p>Register and manage healthcare provider accounts and patient linkages</p>
                <div style="display:flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                    <button class="btn-primary" onclick="addProvider()">➕ Register Provider</button>
                    <button class="btn-secondary" onclick="loadProviders()">🔄 Refresh</button>
                </div>
            </div>

            <!-- Provider Overview Stats -->
            <div class="metrics-grid" style="margin-bottom: 30px;">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 id="totalProviders">0</h3>
                        <p>Total Providers</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 id="verifiedProviders">0</h3>
                        <p>Verified Providers</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 id="pendingProviders">0</h3>
                        <p>Pending Verification</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 id="totalPatientLinks">0</h3>
                        <p>Total Patient Links</p>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                <div>
                    <label style="font-size: 12px; opacity: 0.8; margin-right: 5px;">Status:</label>
                    <select id="providerVerifiedFilter" onchange="loadProviders()" style="padding: 6px 10px; background:#3d2a1d; color:#c9b7a9; border:1px solid rgba(201,183,169,0.3); border-radius:6px;">
                        <option value="">All Providers</option>
                        <option value="true">Verified Only</option>
                        <option value="false">Pending Verification</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 12px; opacity: 0.8; margin-right: 5px;">Search:</label>
                    <input type="text" id="providerSearchInput" placeholder="Search by name, hospital..." onkeyup="filterProvidersTable()" style="padding: 6px 10px; background:#3d2a1d; color:#c9b7a9; border:1px solid rgba(201,183,169,0.3); border-radius:6px; width: 250px;">
                </div>
            </div>

            <div class="table-container">
                <table id="providersTable" class="data-table">
                    <thead>
                        <tr>
                            <th>Provider ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>License Number</th>
                            <th>Specialization</th>
                            <th>Hospital/Clinic</th>
                            <th>Linked Patients</th>
                            <th>Status</th>
                            <th>Registered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="providersTableBody">
                        <tr><td colspan="10">Loading providers...</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
        <?php endif; ?>

        <!-- Device Management Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="devicesSection" class="content-section">
            <div id="devicesContent">
                <p class="no-data">Loading device management...</p>
            </div>
        </section>
        <?php endif; ?>

        <!-- Health Data Section -->
        <section id="healthDataSection" class="content-section">
            <div class="section-header">
                <h1>Health Data Management</h1>
            </div>
            <div class="health-tabs">
                <button class="tab-btn active" onclick="showHealthTab('sugar')">Sugar Intake</button>
                <button class="tab-btn" onclick="showHealthTab('glucose')">Glucose Levels</button>
                <button class="tab-btn" onclick="showHealthTab('weight')">Weight Trends</button>
            </div>
            <div id="healthDataContent" class="tab-content">
                <!-- Dynamic content loaded here -->
            </div>
        </section>

        <!-- Food Database Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="foodDatabaseSection" class="content-section">
            <div class="section-header">
                <h1>Food Database Management</h1>
                <div style="display:flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-secondary" onclick="loadFoodAnalytics()">Refresh Analytics</button>
                    <button class="btn-primary" onclick="addFood()">Add Food Item</button>
                </div>
            </div>

            <!-- Food Analytics -->
            <div class="health-breakdown" style="margin-bottom: 20px;">
                <h2>Food Analytics (Last <span id="foodAnalyticsDays">7</span> days)</h2>
                <div id="foodAnalyticsSummary" class="health-status-chart">
                    <p class="no-data">Loading analytics...</p>
                </div>
                <div style="margin-top: 15px;">
                    <label style="font-size: 12px; opacity: 0.8;">Period:</label>
                    <select id="foodAnalyticsPeriod" onchange="loadFoodAnalytics()" style="margin-left: 10px; padding: 6px 10px; background:#3d2a1d; color:#c9b7a9; border:1px solid rgba(201,183,169,0.3); border-radius:6px;">
                        <option value="7">Last 7 days</option>
                        <option value="14">Last 14 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                </div>
                <div id="foodAnalyticsDetails" style="margin-top: 20px;"></div>
            </div>

            <div class="table-container">
                <table id="foodTable" class="data-table">
                    <thead>
                        <tr>
                            <th>Food ID</th>
                            <th>Food Name</th>
                            <th>Category</th>
                            <th>Sugar/100g</th>
                            <th>Verified</th>
                            <th>Scan Count</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="foodTableBody">
                        <tr><td colspan="7">Loading food items...</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
        <?php endif; ?>

        <!-- Alerts & Notifications Section -->
        <section id="alertsSection" class="content-section">
            <div class="section-header">
                <h1>Alerts & Notifications</h1>
                <div style="display:flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-secondary" onclick="loadAlertsDashboard(true)">Refresh</button>
                    <button class="btn-primary" onclick="openBroadcastNotification()">Send Broadcast</button>
                </div>
            </div>

            <div class="health-breakdown" style="margin-bottom: 20px;">
                <h2>Alert Overview (Last 24 hours)</h2>
                <div id="alertsSummary" class="health-status-chart">
                    <p class="no-data">Loading alert summary...</p>
                </div>
            </div>

            <div class="table-container" style="margin-bottom: 20px;">
                <div style="display:flex; gap: 10px; align-items:center; flex-wrap: wrap; margin-bottom: 15px;">
                    <label style="font-size: 12px; opacity: 0.8;">Severity:</label>
                    <select id="alertSeverityFilter" onchange="loadAlertsDashboard(true)" style="padding: 6px 10px; background:#3d2a1d; color:#c9b7a9; border:1px solid rgba(201,183,169,0.3); border-radius:6px;">
                        <option value="">All</option>
                        <option value="Info">Info</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                    </select>

                    <label style="font-size: 12px; opacity: 0.8; margin-left: 10px;">Type:</label>
                    <select id="alertTypeFilter" onchange="loadAlertsDashboard(true)" style="padding: 6px 10px; background:#3d2a1d; color:#c9b7a9; border:1px solid rgba(201,183,169,0.3); border-radius:6px;">
                        <option value="">All</option>
                        <option value="Sugar Limit Warning">Sugar Limit Warning</option>
                        <option value="Sugar Limit Exceeded">Sugar Limit Exceeded</option>
                        <option value="Glucose High">Glucose High</option>
                        <option value="Glucose Low">Glucose Low</option>
                        <option value="Glucose Critical">Glucose Critical</option>
                        <option value="Device Disconnected">Device Disconnected</option>
                        <option value="Goal Achievement">Goal Achievement</option>
                        <option value="Health Tip">Health Tip</option>
                    </select>

                    <label style="font-size: 12px; opacity: 0.8; margin-left: 10px;">
                        <input type="checkbox" id="alertUnreadOnly" checked onchange="loadAlertsDashboard(true)" /> Unread only
                    </label>

                    <span class="refresh-indicator" style="margin-left:auto;" id="alertsRefreshIndicator">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                        </svg>
                        Auto-refresh: ON
                    </span>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Severity</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="alertsTableBody">
                        <tr><td colspan="7">Loading alerts...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="health-breakdown">
                <h2>Notification History</h2>
                <div id="notificationHistory" class="activity-feed">
                    <p class="no-data">Loading notification history...</p>
                </div>
            </div>
        </section>

        <!-- Daily Population Summary Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="dailySummarySection" class="content-section">
            <div class="section-header">
                <h1>Daily Population Summary</h1>
                <p>Comprehensive daily digest of population health metrics and trends</p>
            </div>
            
            <div id="dailySummaryContent">
                <p class="no-data">Loading daily summary...</p>
            </div>
        </section>
        <?php endif; ?>

        <!-- Reports Section -->
        <section id="reportsSection" class="content-section">
            <div id="reportsContent">
                <p class="no-data">Loading reports...</p>
            </div>
        </section>

        <!-- AI Analytics Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="aiAnalyticsSection" class="content-section">
            <div id="aiAnalyticsContent">
                <p class="no-data">Loading AI analytics...</p>
            </div>
        </section>
        <?php endif; ?>

        <!-- Predictive Analytics Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="predictiveAnalyticsSection" class="content-section">
            <div id="predictiveAnalyticsContent">
                <p class="no-data">Loading predictive analytics...</p>
            </div>
        </section>
        <?php endif; ?>

        <!-- Content Management Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="contentSection" class="content-section">
            <div class="section-header">
                <h1>Content Management</h1>
                <p>Manage health tips, recipes, educational articles, and FAQ content</p>
            </div>
            
            <div id="contentContent">
                <p class="no-data">Loading content management...</p>
            </div>
        </section>
        <?php endif; ?>

        <!-- Settings Section -->
        <?php if ($adminRole !== 'Healthcare Provider'): ?>
        <section id="settingsSection" class="content-section">
            <div class="section-header">
                <h1>System Settings</h1>
                <p>Configure application settings, AI models, and system integrations</p>
            </div>
            
            <div id="settingsContent">
                <p class="no-data">Loading system settings...</p>
            </div>
        </section>
        <?php endif; ?>

        <!-- Support Section -->
        <section id="supportSection" class="content-section">
            <div class="section-header">
                <h1>Support & Feedback</h1>
            </div>
            
            <div id="supportContent">
                <!-- Support Content -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <!-- Quick Help -->
                    <div class="metric-card" style="padding: 25px;">
                        <h3 style="margin-bottom: 15px; color: #362419;">📚 Documentation</h3>
                        <p style="margin-bottom: 15px; opacity: 0.8; color: #362419;">Access comprehensive guides and documentation</p>
                        <ul style="margin-bottom: 15px;">
                            <li><a href="#" onclick="openDoc('user-guide'); return false;" style="color: #362419;">User Guide</a></li>
                            <li><a href="#" onclick="openDoc('api-docs'); return false;" style="color: #362419;">API Documentation</a></li>
                            <li><a href="#" onclick="openDoc('faq'); return false;" style="color: #362419;">Frequently Asked Questions</a></li>
                            <?php if ($adminRole !== 'Healthcare Provider'): ?>
                            <li><a href="#" onclick="openDoc('admin-guide'); return false;" style="color: #362419;">Admin Guide</a></li>
                            <?php else: ?>
                            <li><a href="#" onclick="openDoc('provider-guide'); return false;" style="color: #362419;">Healthcare Provider Guide</a></li>
                            <?php endif; ?>
                        </ul>
                    </div>

                    <!-- Contact Support -->
                    <div class="metric-card" style="padding: 25px;">
                        <h3 style="margin-bottom: 15px; color: #362419;">💬 Contact Support</h3>
                        <p style="margin-bottom: 15px; opacity: 0.8; color: #362419;">Get help from our support team</p>
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #362419;">Email:</strong><br>
                            <a href="mailto:support@iscms.com" style="color: #3498db;">support@iscms.com</a>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #362419;">Phone:</strong><br>
                            <span style="opacity: 0.8; color: #362419;">+60 3-1234 5678</span>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #362419;">Support Hours:</strong><br>
                            <span style="opacity: 0.8; color: #362419;">Mon-Fri: 9:00 AM - 6:00 PM (MYT)</span>
                        </div>
                        <button class="btn-primary" onclick="openSupportTicket()">Submit Support Ticket</button>
                    </div>

                    <!-- System Information -->
                    <div class="metric-card" style="padding: 25px;">
                        <h3 style="margin-bottom: 15px; color: #362419;">ℹ️ System Info</h3>
                        <p style="margin-bottom: 15px; opacity: 0.8; color: #362419;">Current system information</p>
                        <div style="margin-bottom: 10px; color: #362419;">
                            <strong style="color: #362419;">Version:</strong> 1.0.0
                        </div>
                        <div style="margin-bottom: 10px; color: #362419;">
                            <strong style="color: #362419;">Your Role:</strong> <?= $adminRole ?>
                        </div>
                        <div style="margin-bottom: 10px; color: #362419;">
                            <strong style="color: #362419;">Account:</strong> <?= $adminEmail ?>
                        </div>
                        <div style="margin-bottom: 15px; color: #362419;">
                            <strong style="color: #362419;">Last Updated:</strong> Jan 12, 2026
                        </div>
                    </div>
                </div>

                <!-- Recent Updates / Changelog -->
                <div class="metric-card" style="padding: 25px; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px; color: #362419;">🆕 Recent Updates</h3>
                    
                    <div class="timeline-item" style="border-left-color: #2ecc71; margin-bottom: 15px;">
                        <strong style="color: #362419;">Version 1.0.0 - January 12, 2026</strong>
                        <ul style="margin-top: 10px; opacity: 0.9; color: #362419;">
                            <li>✅ Role-Based Access Control with 3 distinct roles</li>
                            <li>✅ Healthcare Provider features (Set Sugar Limits, Clinical Recommendations)</li>
                            <li>✅ Enhanced patient monitoring and reporting</li>
                            <li>✅ PDF export functionality for reports</li>
                            <li>✅ Comprehensive food database with 60+ items</li>
                            <li>✅ Real-time alerts and notifications system</li>
                        </ul>
                    </div>
                </div>

                <!-- Feedback Form -->
                <div class="metric-card" style="padding: 25px;">
                    <h3 style="margin-bottom: 15px; color: #362419;">📝 Send Feedback</h3>
                    <p style="margin-bottom: 15px; opacity: 0.8; color: #362419;">Help us improve iSCMS by sharing your feedback</p>
                    
                    <form id="feedbackForm" onsubmit="submitFeedback(event)" style="max-width: 600px;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #362419;">Feedback Type</label>
                            <select name="type" required style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                                <option value="">Select type</option>
                                <option value="Bug Report">Bug Report</option>
                                <option value="Feature Request">Feature Request</option>
                                <option value="Improvement Suggestion">Improvement Suggestion</option>
                                <option value="General Feedback">General Feedback</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #362419;">Subject</label>
                            <input type="text" name="subject" required placeholder="Brief description..."
                                   style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #362419;">Message</label>
                            <textarea name="message" rows="5" required placeholder="Please provide details..."
                                      style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;"></textarea>
                        </div>
                        
                        <button type="submit" class="btn-primary">Submit Feedback</button>
                    </form>
                </div>
            </div>
        </section>

        <!-- Security Section -->
        <?php if ($adminRole === 'Superadmin'): ?>
        <section id="securitySection" class="content-section">
            <div class="section-header">
                <h1>Security & Compliance</h1>
                <p>Monitor system security, access logs, and compliance metrics</p>
            </div>
            
            <div id="securityContent">
                <!-- Security Metrics -->
                <div class="metrics-grid" style="margin-bottom: 30px;">
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3 id="totalLogins">-</h3>
                            <p>Total Logins (7d)</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3 id="failedLogins">-</h3>
                            <p>Failed Attempts (7d)</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3 id="activeSessions">-</h3>
                            <p>Active Sessions</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3 id="securityAlerts">-</h3>
                            <p>Security Alerts</p>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(201,183,169,0.3);">
                    <button class="security-tab active" onclick="switchSecurityTab('audit-logs')">Audit Logs</button>
                    <button class="security-tab" onclick="switchSecurityTab('access-control')">Access Control</button>
                    <button class="security-tab" onclick="switchSecurityTab('compliance')">Compliance</button>
                    <button class="security-tab" onclick="switchSecurityTab('settings')">Security Settings</button>
                </div>

                <!-- Audit Logs Tab -->
                <div id="audit-logs-tab" class="security-tab-content active">
                    <h3 style="margin-bottom: 15px; color: #362419;">Recent Activity Logs</h3>
                    <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <select id="auditActionFilter" onchange="loadAuditLogs()" style="padding: 8px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                            <option value="">All Actions</option>
                            <option value="Login">Login</option>
                            <option value="Logout">Logout</option>
                            <option value="Create">Create</option>
                            <option value="Update">Update</option>
                            <option value="Delete">Delete</option>
                            <option value="View">View</option>
                        </select>
                        <input type="date" id="auditDateFilter" onchange="loadAuditLogs()" style="padding: 8px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                        <button class="btn-secondary" onclick="exportAuditLogs()">Export Logs</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Admin</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                    <th>Target</th>
                                    <th>Description</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody id="auditLogsTableBody">
                                <tr><td colspan="7">Loading audit logs...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Access Control Tab -->
                <div id="access-control-tab" class="security-tab-content" style="display: none;">
                    <h3 style="margin-bottom: 15px; color: #362419;">Role Permissions Matrix</h3>
                    <div id="permissionsMatrix" style="margin-bottom: 30px;">
                        <p style="opacity: 0.7;">Loading permissions...</p>
                    </div>

                    <h3 style="margin-bottom: 15px; color: #362419;">Active Admin Sessions</h3>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Admin</th>
                                    <th>Role</th>
                                    <th>Login Time</th>
                                    <th>Last Activity</th>
                                    <th>IP Address</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="activeSessionsTableBody">
                                <tr><td colspan="6">Loading sessions...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Compliance Tab -->
                <div id="compliance-tab" class="security-tab-content" style="display: none;">
                    <h3 style="margin-bottom: 15px; color: #362419;">HIPAA Compliance Checklist</h3>
                    <div class="metric-card" style="padding: 20px; margin-bottom: 20px;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" checked disabled> Access Control - Role-based authentication implemented
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" checked disabled> Audit Logging - All actions logged with timestamps
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" checked disabled> Data Encryption - Session-based secure authentication
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" checked disabled> Password Protection - Bcrypt hashing (cost 10)
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" disabled> Two-Factor Authentication - Not yet implemented
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" disabled> Data Encryption at Rest - Recommended for production
                            </label>
                        </div>
                    </div>

                    <h3 style="margin-bottom: 15px; color: #362419;">Data Access Reports</h3>
                    <p style="margin-bottom: 15px; opacity: 0.8; color: #362419;">Monitor who accessed patient data and when</p>
                    <button class="btn-primary" onclick="generateComplianceReport()">Generate Compliance Report</button>
                </div>

                <!-- Security Settings Tab -->
                <div id="settings-tab" class="security-tab-content" style="display: none;">
                    <h3 style="margin-bottom: 15px; color: #362419;">Security Configuration</h3>
                    
                    <div class="metric-card" style="padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 15px; color: #362419;">Session Settings</h4>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #362419;">Session Timeout (minutes)</label>
                            <input type="number" value="30" min="5" max="1440" style="padding: 8px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                            <small style="opacity: 0.7; color: #362419;">Current: 30 minutes</small>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" checked> Force logout on browser close
                            </label>
                        </div>
                        <button class="btn-primary">Save Settings</button>
                    </div>

                    <div class="metric-card" style="padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 15px; color: #362419;">Password Policy</h4>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #362419;">Minimum Password Length</label>
                            <input type="number" value="8" min="6" max="32" style="padding: 8px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" checked> Require special characters
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: #362419;">
                                <input type="checkbox" checked> Require numbers
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #362419;">Password Expiry (days)</label>
                            <input type="number" value="90" min="30" max="365" style="padding: 8px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                        </div>
                        <button class="btn-primary">Update Policy</button>
                    </div>

                    <div class="metric-card" style="padding: 20px;">
                        <h4 style="margin-bottom: 15px; color: #362419;">IP Restrictions</h4>
                        <p style="margin-bottom: 15px; opacity: 0.8; color: #362419;">Whitelist IP addresses for admin access</p>
                        <textarea rows="4" placeholder="Enter IP addresses (one per line)&#10;e.g. 192.168.1.1&#10;10.0.0.0/24" style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;"></textarea>
                        <button class="btn-primary" style="margin-top: 10px;">Save IP Whitelist</button>
                    </div>
                </div>
            </div>
        </section>
        <?php endif; ?>
    </main>

    <!-- User Profile Modal -->
    <?php include 'components/user_profile_modal.php'; ?>
    <?php include 'components/provider_profile_modal.php'; ?>

    <!-- Scripts -->
    <script>
        // Pass PHP session data to JavaScript
        const ADMIN_ROLE = '<?= $adminRole ?>';
        const ADMIN_NAME = '<?= $adminName ?>';
        const ADMIN_EMAIL = '<?= $adminEmail ?>';
        const IS_HEALTHCARE_PROVIDER = ADMIN_ROLE === 'Healthcare Provider';
        const IS_SUPERADMIN = ADMIN_ROLE === 'Superadmin';
        const IS_ADMIN = ADMIN_ROLE === 'Admin';
        
        console.log('Admin Role:', ADMIN_ROLE);
        console.log('Is Healthcare Provider:', IS_HEALTHCARE_PROVIDER);
    </script>
    <script src="assets/js/sidebar.js"></script>
    <script src="assets/js/main.js"></script>
</body>
</html>
