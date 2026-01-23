// iSCMS Admin Panel - Main JavaScript

// API Base URL
const API_BASE = 'api/';

// Utility Functions
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div>';
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<p class="no-data" style="color: #e74c3c;">${message}</p>`;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-MY', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Dashboard Functions
let dashboardRefreshInterval = null;

async function loadDashboardData() {
    try {
        // Healthcare Providers see different dashboard
        if (typeof IS_HEALTHCARE_PROVIDER !== 'undefined' && IS_HEALTHCARE_PROVIDER) {
            loadProviderDashboard();
            return;
        }
        
        const response = await fetch(API_BASE + 'dashboard_stats.php');
        const result = await response.json();
        
        if (result.success) {
            updateDashboardMetrics(result.data);
            loadRecentActivity();
            
            // Display additional insights if available
            if (result.data.health_status_breakdown) {
                updateHealthStatusBreakdown(result.data.health_status_breakdown);
            }
        } else {
            console.error('Failed to load dashboard data:', result.message);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Healthcare Provider specific dashboard
async function loadProviderDashboard() {
    try {
        // Show provider-specific message
        const dashboardSection = document.getElementById('dashboardSection');
        const metricsGrid = dashboardSection.querySelector('.metrics-grid');
        
        if (metricsGrid) {
            metricsGrid.innerHTML = `
                <div class="metric-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <h2 style="color: #362419; margin-bottom: 20px;">Healthcare Provider Dashboard</h2>
                    <p style="margin-bottom: 30px;">Welcome! You have access to monitor your linked patients.</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;">
                        <div style="background: rgba(52, 152, 219, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #3498db;">
                            <h3 id="providerLinkedPatients">-</h3>
                            <p>Linked Patients</p>
                        </div>
                        <div style="background: rgba(46, 204, 113, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                            <h3 id="providerConsentedPatients">-</h3>
                            <p>With Consent</p>
                        </div>
                        <div style="background: rgba(243, 156, 18, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #f39c12;">
                            <h3 id="providerAvgSugar">-</h3>
                            <p>Avg Sugar (7d)</p>
                        </div>
                        <div style="background: rgba(231, 76, 60, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                            <h3 id="providerGlucoseSpikes">-</h3>
                            <p>Glucose Spikes (7d)</p>
                        </div>
                    </div>
                    <div style="margin-top: 30px;">
                        <button class="btn-primary" onclick="showSection('usersSection')">View My Patients</button>
                        <button class="btn-secondary" onclick="showSection('healthDataSection')" style="margin-left: 10px;">View Health Data</button>
                    </div>
                </div>
            `;
        }
        
        // Load provider stats
        const response = await fetch(API_BASE + 'dashboard_stats.php?provider_view=1');
        const result = await response.json();
        
        if (result.success && result.data) {
            document.getElementById('providerLinkedPatients').textContent = result.data.linked_patients || 0;
            document.getElementById('providerConsentedPatients').textContent = result.data.consented_patients || 0;
            document.getElementById('providerAvgSugar').textContent = (result.data.avg_patient_sugar || 0) + 'g';
            document.getElementById('providerGlucoseSpikes').textContent = result.data.glucose_spikes || 0;
        }
        
        // Load recent patient alerts
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading provider dashboard:', error);
    }
}

function startDashboardAutoRefresh(intervalSeconds = 30) {
    // Clear any existing interval
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
    }
    
    // Set up new interval
    dashboardRefreshInterval = setInterval(() => {
        loadDashboardData();
    }, intervalSeconds * 1000);
}

function stopDashboardAutoRefresh() {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
        dashboardRefreshInterval = null;
    }
}

function updateDashboardMetrics(data) {
    document.getElementById('totalUsers').textContent = data.total_users || 0;
    document.getElementById('newRegistrations').textContent = data.new_registrations || 0;
    document.getElementById('avgSugarIntake').textContent = (data.avg_sugar_intake || 0) + 'g';
    document.getElementById('exceedingUsers').textContent = (data.exceeding_users || 0) + '%';
    document.getElementById('highRiskUsers').textContent = data.high_risk_users || 0;
    document.getElementById('activeAlerts').textContent = data.active_alerts || 0;
    document.getElementById('cgmDevices').textContent = data.cgm_devices || 0;
    document.getElementById('goalAchievement').textContent = (data.goal_achievement || 0) + '%';
}

async function loadRecentActivity() {
    try {
        const response = await fetch(API_BASE + 'recent_activity.php?limit=20');
        const result = await response.json();
        
        const feedContainer = document.getElementById('activityFeed');
        
        if (result.success && result.data.length > 0) {
            feedContainer.innerHTML = result.data.map(item => {
                const typeIcon = getActivityIcon(item.type);
                const typeColor = getActivityColor(item.type, item.severity);
                
                return `
                    <div class="activity-item" style="border-left-color: ${typeColor}">
                        <div class="activity-header">
                            <span class="activity-icon" style="color: ${typeColor}">${typeIcon}</span>
                            <span class="activity-type">${formatActivityType(item.type)}</span>
                            <span class="time">${formatDateTime(item.timestamp)}</span>
                        </div>
                        <div class="description">${item.description}</div>
                    </div>
                `;
            }).join('');
        } else {
            feedContainer.innerHTML = '<p class="no-data">No recent activity</p>';
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

function getActivityIcon(type) {
    const icons = {
        'registration': '👤',
        'food_scan': '🍽️',
        'alert': '⚠️',
        'glucose_spike': '📈',
        'admin_action': '⚙️'
    };
    return icons[type] || '📋';
}

function getActivityColor(type, severity) {
    if (severity === 'Critical' || severity === 'High') {
        return '#e74c3c';
    }
    if (severity === 'Warning') {
        return '#f39c12';
    }
    
    const colors = {
        'registration': '#2ecc71',
        'food_scan': '#3498db',
        'alert': '#f39c12',
        'glucose_spike': '#e74c3c',
        'admin_action': '#9b59b6'
    };
    return colors[type] || '#c9b7a9';
}

function formatActivityType(type) {
    const types = {
        'registration': 'New Registration',
        'food_scan': 'Food Scan',
        'alert': 'Alert',
        'glucose_spike': 'Glucose Alert',
        'admin_action': 'Admin Action'
    };
    return types[type] || 'Activity';
}

function updateHealthStatusBreakdown(breakdown) {
    const container = document.getElementById('healthStatusChart');
    
    if (!breakdown || Object.keys(breakdown).length === 0) {
        container.innerHTML = '<p class="no-data">No health status data available</p>';
        return;
    }
    
    const colors = {
        'Healthy': '#2ecc71',
        'Pre-diabetic': '#f39c12',
        'Type 1 Diabetes': '#e74c3c',
        'Type 2 Diabetes': '#e74c3c',
        'Gestational Diabetes': '#e67e22'
    };
    
    container.innerHTML = Object.entries(breakdown).map(([status, count]) => {
        const color = colors[status] || '#c9b7a9';
        return `
            <div class="health-status-item" style="border-left-color: ${color}">
                <h3>${count}</h3>
                <p>${status}</p>
            </div>
        `;
    }).join('');
}

// User Management Functions
async function loadUsers() {
    showLoading('usersTableBody');
    
    try {
        const searchInput = document.getElementById('userSearchInput');
        const statusFilter = document.getElementById('userHealthStatusFilter');

        const search = searchInput ? searchInput.value : '';
        const healthStatus = statusFilter ? statusFilter.value : '';

        // Build Query Params
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (healthStatus) params.append('health_status', healthStatus);
        
        // Healthcare Providers see only their linked patients
        if (typeof IS_HEALTHCARE_PROVIDER !== 'undefined' && IS_HEALTHCARE_PROVIDER) {
            params.append('linked_only', '1');
        }
        
        let url = `${API_BASE}users.php`;
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        
        if (result.success && result.data.length > 0) {
            tbody.innerHTML = result.data.map(user => `
                <tr>
                    <td>${user.user_id}</td>
                    <td>${user.full_name}</td>
                    <td>${user.email || user.phone_number || 'N/A'}</td>
                    <td><span class="badge badge-${getHealthStatusBadge(user.health_status)}">${user.health_status}</span></td>
                    <td>${formatDate(user.registration_date)}</td>
                    <td><span class="badge badge-${user.is_active ? 'success' : 'danger'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn-secondary btn-small" onclick="viewUser(${user.user_id})">View</button>
                        <button class="btn-${user.is_active ? 'danger' : 'success'} btn-small" onclick="toggleUserStatus(${user.user_id}, ${user.is_active})">${user.is_active ? 'Deactivate' : 'Activate'}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
        }
    } catch (error) {
        showError('usersTableBody', 'Error loading users');
        console.error('Error loading users:', error);
    }
}

function getHealthStatusBadge(status) {
    switch(status) {
        case 'Healthy': return 'success';
        case 'Pre-diabetic': return 'warning';
        case 'Type 1 Diabetes':
        case 'Type 2 Diabetes':
        case 'Gestational Diabetes': return 'danger';
        default: return 'info';
    }
}

async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
        const response = await fetch(API_BASE + 'users.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: userId, 
                action: 'toggle_status',
                is_active: !currentStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`User ${action}d successfully`);
            loadUsers();
        } else {
            alert('Failed to update user status: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

async function viewUser(userId) {
    // Show modal
    const modal = document.getElementById('userProfileModal');
    modal.classList.add('active');
    
    // Load user data
    try {
        const response = await fetch(API_BASE + 'user_detail.php?user_id=' + userId);
        const result = await response.json();
        
        if (result.success) {
            displayUserProfile(result.data);
        } else {
            document.getElementById('userProfileContent').innerHTML = 
                '<p class="no-data" style="color: #e74c3c;">Failed to load user details: ' + result.message + '</p>';
        }
    } catch (error) {
        console.error('Error loading user:', error);
        document.getElementById('userProfileContent').innerHTML = 
            '<p class="no-data" style="color: #e74c3c;">Error loading user details</p>';
    }
}

function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    modal.classList.remove('active');
}

function displayUserProfile(data) {
    const user = data.user;
    const initials = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const riskBadge = data.risk_info ? 
        `<span class="badge badge-danger">High Risk - ${data.risk_info.risk_level}</span>` : '';
    
    const html = `
        <div class="user-profile-header">
            <div class="user-avatar">${initials}</div>
            <div class="user-basic-info">
                <h3>${user.full_name} ${riskBadge}</h3>
                <p><strong>ID:</strong> ${user.user_id} | <strong>Status:</strong> ${user.is_active ? 'Active' : 'Inactive'}</p>
                <p><strong>Health Status:</strong> ${user.health_status} | <strong>Premium:</strong> ${user.is_premium ? 'Yes' : 'No'}</p>
                <p><strong>Contact:</strong> ${user.email || user.phone_number || 'N/A'} | <strong>Location:</strong> ${user.city || 'N/A'}, ${user.state || 'N/A'}</p>
            </div>
            ${typeof IS_HEALTHCARE_PROVIDER !== 'undefined' && IS_HEALTHCARE_PROVIDER ? `
            <div style="margin-left: auto; display: flex; flex-direction: column; gap: 10px;">
                <button class="btn-primary" onclick="openSetSugarLimitModal(${user.user_id}, ${user.daily_sugar_limit_g || 50})">Set Sugar Limit</button>
                <button class="btn-secondary" onclick="openAddRecommendationModal(${user.user_id})">Add Recommendation</button>
            </div>
            ` : ''}
        </div>
        
        <div class="profile-tabs">
            <button class="profile-tab-btn active" onclick="switchProfileTab('overview')">Overview</button>
            <button class="profile-tab-btn" onclick="switchProfileTab('today')">Today's Activity</button>
            <button class="profile-tab-btn" onclick="switchProfileTab('trends')">Weekly Trends</button>
            <button class="profile-tab-btn" onclick="switchProfileTab('health')">Health Data</button>
            <button class="profile-tab-btn" onclick="switchProfileTab('devices')">Devices</button>
            <button class="profile-tab-btn" onclick="switchProfileTab('alerts')">Alerts</button>
            <button class="profile-tab-btn" onclick="switchProfileTab('providers')">Healthcare Providers</button>
        </div>
        
        <!-- Overview Tab -->
        <div id="tab-overview" class="profile-tab-content active">
            <h3>Basic Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <label>Age</label>
                    <value>${user.age || 'N/A'}</value>
                </div>
                <div class="info-item">
                    <label>Gender</label>
                    <value>${user.gender || 'N/A'}</value>
                </div>
                <div class="info-item">
                    <label>Date of Birth</label>
                    <value>${user.date_of_birth || 'N/A'}</value>
                </div>
                <div class="info-item">
                    <label>Registered</label>
                    <value>${formatDate(user.registration_date)}</value>
                </div>
                <div class="info-item">
                    <label>Last Active</label>
                    <value>${user.last_active ? formatDateTime(user.last_active) : 'Never'}</value>
                </div>
                <div class="info-item">
                    <label>Device</label>
                    <value>${user.device_type || 'N/A'}</value>
                </div>
            </div>
            
            <h3>Sugar Intake Summary (Last 7 Days)</h3>
            <div class="info-grid">
                <div class="info-item">
                    <label>Average Daily Sugar</label>
                    <value>${data.sugar_summary.avg_daily_sugar}g</value>
                </div>
                <div class="info-item">
                    <label>Current Daily Limit</label>
                    <value id="currentSugarLimit_${user.user_id}">${user.daily_sugar_limit_g}g</value>
                </div>
                <div class="info-item">
                    <label>Compliance Rate</label>
                    <value>${data.sugar_summary.compliance_rate}%</value>
                </div>
            </div>
            
            ${typeof IS_HEALTHCARE_PROVIDER !== 'undefined' && IS_HEALTHCARE_PROVIDER ? `
            <div id="clinicalRecommendations_${user.user_id}" style="margin-top: 20px;">
                <h3>Clinical Recommendations</h3>
                <div id="recommendationsList_${user.user_id}">
                    <p style="opacity: 0.7;">Loading recommendations...</p>
                </div>
            </div>
            ` : ''}
        </div>
        
        <!-- Today's Activity Tab -->
        <div id="tab-today" class="profile-tab-content">
            <h3>Today's Activity Timeline</h3>
            ${data.today_activity && data.today_activity.length > 0 ? `
                <div class="timeline">
                    ${data.today_activity.map(activity => {
                        let activityColor = '#3498db';
                        let activityIcon = '📋';
                        
                        if (activity.activity_type === 'food') {
                            activityColor = '#f39c12';
                            activityIcon = '🍽️';
                        } else if (activity.activity_type === 'glucose') {
                            activityColor = activity.category === 'High' || activity.category === 'Critical' ? '#e74c3c' : 
                                          activity.category === 'Low' ? '#3498db' : '#2ecc71';
                            activityIcon = '📊';
                        } else if (activity.activity_type === 'weight') {
                            activityColor = '#9b59b6';
                            activityIcon = '⚖️';
                        } else if (activity.activity_type === 'exercise') {
                            activityColor = '#2ecc71';
                            activityIcon = '🏃';
                        }
                        
                        return `
                            <div class="timeline-item" style="border-left-color: ${activityColor}">
                                <div class="time">
                                    <span style="margin-right: 8px;">${activityIcon}</span>
                                    ${formatDateTime(activity.activity_time)}
                                </div>
                                <div class="content">
                                    <strong>${escapeHtml(activity.description)}</strong>
                                    ${activity.category ? `<br><small>Category: ${escapeHtml(activity.category)}</small>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : '<p class="no-data">No activity recorded today</p>'}
        </div>
        
        <!-- Weekly Trends Tab -->
        <div id="tab-trends" class="profile-tab-content">
            <h3>Weekly Glucose Trend</h3>
            ${data.weekly_trends && data.weekly_trends.glucose.length > 0 ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Avg Glucose</th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>Readings</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.weekly_trends.glucose.map(day => `
                                <tr>
                                    <td>${formatDate(day.reading_date)}</td>
                                    <td><strong>${Math.round(day.avg_glucose)} mg/dL</strong></td>
                                    <td>${Math.round(day.min_glucose)} mg/dL</td>
                                    <td>${Math.round(day.max_glucose)} mg/dL</td>
                                    <td>${day.reading_count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="no-data">No glucose data for the past 7 days</p>'}
            
            <h3 style="margin-top: 20px;">Weekly Weight Trend</h3>
            ${data.weekly_trends && data.weekly_trends.weight.length > 0 ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Weight</th>
                                <th>BMI</th>
                                <th>Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.weekly_trends.weight.map((day, index) => {
                                let weightChange = '';
                                if (index > 0) {
                                    const diff = day.weight_kg - data.weekly_trends.weight[index - 1].weight_kg;
                                    const diffColor = diff > 0 ? '#e74c3c' : diff < 0 ? '#2ecc71' : '#c9b7a9';
                                    weightChange = `<span style="color: ${diffColor};">${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg</span>`;
                                }
                                return `
                                    <tr>
                                        <td>${formatDate(day.log_date)}</td>
                                        <td><strong>${day.weight_kg} kg</strong></td>
                                        <td>${day.bmi}</td>
                                        <td>${weightChange}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="no-data">No weight data for the past 7 days</p>'}
            
            <h3 style="margin-top: 20px;">Weekly Sugar Intake Trend</h3>
            ${data.weekly_trends && data.weekly_trends.sugar.length > 0 ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total Sugar</th>
                                <th>Daily Limit</th>
                                <th>Compliance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.weekly_trends.sugar.map(day => {
                                const complianceColor = day.compliance_status === 'Within Limit' ? '#2ecc71' : '#e74c3c';
                                return `
                                    <tr>
                                        <td>${formatDate(day.log_date)}</td>
                                        <td><strong>${day.total_sugar_g}g</strong></td>
                                        <td>${user.daily_sugar_limit_g}g</td>
                                        <td>${day.limit_exceeded ? `<span style="color: #e74c3c;">+${day.total_sugar_g - user.daily_sugar_limit_g}g over</span>` : '<span style="color: #2ecc71;">Within limit</span>'}</td>
                                        <td><span class="badge badge-${day.compliance_status === 'Within Limit' ? 'success' : 'danger'}">${day.compliance_status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="no-data">No sugar intake data for the past 7 days</p>'}
        </div>
        
        <!-- Health Data Tab -->
        <div id="tab-health" class="profile-tab-content">
            <h3>Recent Food Entries</h3>
            <div class="timeline">
                ${data.recent_food_entries.length > 0 ? data.recent_food_entries.map(entry => `
                    <div class="timeline-item" style="border-left-color: #3498db">
                        <div class="time">${formatDateTime(entry.entry_datetime)}</div>
                        <div class="content">
                            <strong>${entry.food_name}</strong> (${entry.meal_type})<br>
                            Sugar: ${entry.sugar_content_g}g | Calories: ${entry.calories || 'N/A'} | Method: ${entry.recognition_method}
                        </div>
                    </div>
                `).join('') : '<p class="no-data">No food entries</p>'}
            </div>
            
            <h3>Weight Tracking</h3>
            <div class="info-grid">
                <div class="info-item">
                    <label>Current Weight</label>
                    <value>${user.current_weight_kg || 'N/A'} kg</value>
                </div>
                <div class="info-item">
                    <label>Target Weight</label>
                    <value>${user.target_weight_kg || 'N/A'} kg</value>
                </div>
                <div class="info-item">
                    <label>BMI</label>
                    <value>${user.bmi || 'N/A'}</value>
                </div>
                <div class="info-item">
                    <label>Height</label>
                    <value>${user.height_cm || 'N/A'} cm</value>
                </div>
            </div>
        </div>
        
        <!-- Devices Tab -->
        <div id="tab-devices" class="profile-tab-content">
            <h3>Connected Devices Summary</h3>
            <div class="info-grid">
                <div class="info-item">
                    <label>Total Devices</label>
                    <value>${data.devices.total_devices}</value>
                </div>
                <div class="info-item">
                    <label>CGM Devices</label>
                    <value>${data.devices.cgm_devices.length}</value>
                </div>
                <div class="info-item">
                    <label>Smart Scales</label>
                    <value>${data.devices.scale_devices.length}</value>
                </div>
            </div>
            
            <h3>Connected CGM Devices</h3>
            ${data.devices.cgm_devices.length > 0 ? data.devices.cgm_devices.map(device => {
                const statusBadge = device.connection_status === 'Connected' ? 'success' : 
                                  device.connection_status === 'Disconnected' ? 'danger' : 'warning';
                const batteryColor = device.battery_level <= 20 ? '#e74c3c' : 
                                   device.battery_level <= 50 ? '#f39c12' : '#2ecc71';
                const sensorColor = device.sensor_days_remaining <= 1 ? '#e74c3c' :
                                  device.sensor_days_remaining <= 3 ? '#f39c12' : '#2ecc71';
                return `
                    <div class="device-card">
                        <div class="device-info">
                            <h4>${device.device_name || 'CGM Device'}</h4>
                            <p>Model: ${device.device_model || 'N/A'} | Serial: ${device.serial_number || 'N/A'}</p>
                            <p>Last Sync: ${device.last_sync ? formatDateTime(device.last_sync) + ' (' + device.hours_since_sync + 'h ago)' : 'Never'}</p>
                            <p>Battery: <span style="color: ${batteryColor}; font-weight: 700;">${device.battery_level || 'N/A'}%</span> | 
                               Firmware: ${device.firmware_version || 'N/A'}</p>
                            ${device.sensor_expiry_date ? `<p>Sensor Expiry: <span style="color: ${sensorColor}; font-weight: 700;">${device.sensor_days_remaining} days remaining</span></p>` : ''}
                        </div>
                        <span class="badge badge-${statusBadge}">${device.connection_status}</span>
                    </div>
                `;
            }).join('') : '<p class="no-data">No CGM devices connected</p>'}
            
            <h3>Smart Scale Devices</h3>
            ${data.devices.scale_devices.length > 0 ? data.devices.scale_devices.map(device => {
                const statusBadge = device.connection_status === 'Connected' ? 'success' : 
                                  device.connection_status === 'Disconnected' ? 'danger' : 'warning';
                const batteryColor = device.battery_level <= 20 ? '#e74c3c' : 
                                   device.battery_level <= 50 ? '#f39c12' : '#2ecc71';
                return `
                    <div class="device-card">
                        <div class="device-info">
                            <h4>${device.device_name || 'Smart Scale'}</h4>
                            <p>Model: ${device.device_model || 'N/A'} | Serial: ${device.serial_number || 'N/A'}</p>
                            <p>Last Sync: ${device.last_sync ? formatDateTime(device.last_sync) + ' (' + device.hours_since_sync + 'h ago)' : 'Never'}</p>
                            <p>Battery: <span style="color: ${batteryColor}; font-weight: 700;">${device.battery_level || 'N/A'}%</span> | 
                               Firmware: ${device.firmware_version || 'N/A'}</p>
                        </div>
                        <span class="badge badge-${statusBadge}">${device.connection_status}</span>
                    </div>
                `;
            }).join('') : '<p class="no-data">No smart scale devices connected</p>'}
            
            <h3>Recent Glucose Readings</h3>
            <div class="timeline">
                ${data.glucose_readings.length > 0 ? data.glucose_readings.slice(0, 10).map(reading => {
                    const statusColor = reading.status === 'High' || reading.status === 'Critical' ? '#e74c3c' : 
                                      reading.status === 'Low' ? '#3498db' : '#2ecc71';
                    return `
                        <div class="timeline-item" style="border-left-color: ${statusColor}">
                            <div class="time">${formatDateTime(reading.reading_datetime)}</div>
                            <div class="content">
                                <strong>${reading.glucose_level} ${reading.unit}</strong> - ${reading.status}
                            </div>
                        </div>
                    `;
                }).join('') : '<p class="no-data">No glucose readings</p>'}
            </div>
        </div>
        
        <!-- Alerts Tab -->
        <div id="tab-alerts" class="profile-tab-content">
            <h3>Recent Alerts</h3>
            <div class="timeline">
                ${data.recent_alerts.length > 0 ? data.recent_alerts.map(alert => {
                    const severityColor = alert.severity === 'Critical' ? '#e74c3c' : (alert.severity === 'Warning' ? '#f39c12' : '#3498db');
                    return `
                        <div class="timeline-item" style="border-left-color: ${severityColor}">
                            <div class="time">${formatDateTime(alert.alert_datetime)}</div>
                            <div class="content">
                                <strong>${alert.title}</strong> (${alert.severity})<br>
                                ${alert.message}
                                ${alert.is_read ? '' : '<br><span class="badge badge-warning">Unread</span>'}
                            </div>
                        </div>
                    `;
                }).join('') : '<p class="no-data">No alerts</p>'}
            </div>
        </div>
        
        <!-- Healthcare Providers Tab -->
        <div id="tab-providers" class="profile-tab-content">
            <h3>Linked Healthcare Providers</h3>
            ${data.healthcare_providers.length > 0 ? data.healthcare_providers.map(provider => `
                <div class="device-card">
                    <div class="device-info">
                        <h4>${provider.full_name}</h4>
                        <p>Specialization: ${provider.specialization || 'N/A'}</p>
                        <p>Hospital/Clinic: ${provider.hospital_clinic || 'N/A'}</p>
                        <p>Access Level: ${provider.access_level}</p>
                    </div>
                    <span class="badge badge-${provider.consent_given ? 'success' : 'warning'}">
                        ${provider.consent_given ? 'Consent Given' : 'Pending Consent'}
                    </span>
                </div>
            `).join('') : '<p class="no-data">No healthcare providers linked</p>'}
        </div>
    `;
    
    document.getElementById('userProfileContent').innerHTML = html;
    
    // Load recommendations if Healthcare Provider
    if (typeof IS_HEALTHCARE_PROVIDER !== 'undefined' && IS_HEALTHCARE_PROVIDER) {
        loadClinicalRecommendations(user.user_id);
    }
}

function switchProfileTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.profile-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById('tab-' + tabName).classList.add('active');
    event.target.classList.add('active');
}

function exportUsers() {
    // Ask user for export format
    const format = prompt('Choose export format:\n1. CSV (default)\n2. JSON\n3. Excel\n\nEnter 1, 2, or 3:', '1');
    
    let exportFormat = 'csv';
    if (format === '2') {
        exportFormat = 'json';
    } else if (format === '3') {
        exportFormat = 'excel';
    }
    
    window.location.href = API_BASE + 'export_users.php?format=' + exportFormat;
}

// Healthcare Providers Functions
async function loadProviders() {
    showLoading('providersTableBody');
    
    try {
        const verifiedFilter = document.getElementById('providerVerifiedFilter')?.value || '';
        const url = verifiedFilter ? `${API_BASE}providers.php?verified=${verifiedFilter}` : `${API_BASE}providers.php`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        const tbody = document.getElementById('providersTableBody');
        
        if (result.success && result.data.length > 0) {
            // Calculate statistics
            const total = result.data.length;
            const verified = result.data.filter(p => p.is_verified == 1).length;
            const pending = total - verified;
            
            // Update stats cards
            document.getElementById('totalProviders').textContent = total;
            document.getElementById('verifiedProviders').textContent = verified;
            document.getElementById('pendingProviders').textContent = pending;
            
            // Get total patient links
            fetchProviderStats();
            
            tbody.innerHTML = result.data.map(provider => {
                const registeredDate = new Date(provider.created_at).toLocaleDateString();
                const verifiedBadge = provider.is_verified == 1 
                    ? '<span class="badge badge-success">Verified</span>' 
                    : '<span class="badge badge-warning">Pending</span>';
                
                return `
                <tr>
                    <td>${provider.provider_id}</td>
                    <td><strong>${provider.full_name}</strong></td>
                    <td>${provider.email}</td>
                    <td>${provider.license_number}</td>
                    <td>${provider.specialization || '-'}</td>
                    <td>${provider.hospital_clinic || '-'}</td>
                    <td><span class="badge badge-info" id="patientCount_${provider.provider_id}">-</span></td>
                    <td>${verifiedBadge}</td>
                    <td>${registeredDate}</td>
                    <td>
                        <button class="btn-secondary btn-small" onclick="viewProvider(${provider.provider_id})">View</button>
                        ${provider.is_verified != 1 ? `<button class="btn-success btn-small" onclick="verifyProvider(${provider.provider_id})">Verify</button>` : ''}
                    </td>
                </tr>
            `;
            }).join('');
            
            // Fetch patient counts for each provider
            result.data.forEach(provider => {
                fetchProviderPatientCount(provider.provider_id);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">No providers found</td></tr>';
            
            // Reset stats
            document.getElementById('totalProviders').textContent = '0';
            document.getElementById('verifiedProviders').textContent = '0';
            document.getElementById('pendingProviders').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading providers:', error);
        document.getElementById('providersTableBody').innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #e74c3c;">Error loading providers</td></tr>';
    }
}

async function fetchProviderStats() {
    try {
        const response = await fetch(API_BASE + 'providers.php');
        const result = await response.json();
        
        if (result.success) {
            let totalLinks = 0;
            for (const provider of result.data) {
                const detailResponse = await fetch(`${API_BASE}provider_detail.php?provider_id=${provider.provider_id}`);
                const detailResult = await detailResponse.json();
                if (detailResult.success) {
                    totalLinks += detailResult.data.stats.linked_patients || 0;
                }
            }
            document.getElementById('totalPatientLinks').textContent = totalLinks;
        }
    } catch (error) {
        console.error('Error fetching provider stats:', error);
        document.getElementById('totalPatientLinks').textContent = '0';
    }
}

async function fetchProviderPatientCount(providerId) {
    try {
        const response = await fetch(`${API_BASE}provider_detail.php?provider_id=${providerId}`);
        const result = await response.json();
        
        if (result.success) {
            const count = result.data.stats.linked_patients || 0;
            const element = document.getElementById(`patientCount_${providerId}`);
            if (element) {
                element.textContent = count;
                element.className = count > 0 ? 'badge badge-success' : 'badge badge-secondary';
            }
        }
    } catch (error) {
        console.error(`Error fetching patient count for provider ${providerId}:`, error);
    }
}

function filterProvidersTable() {
    const input = document.getElementById('providerSearchInput');
    if (!input) return;
    
    const filter = input.value.toUpperCase();
    const table = document.getElementById('providersTable');
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        
        if (cells.length > 0) {
            const name = cells[1]?.textContent || '';
            const email = cells[2]?.textContent || '';
            const license = cells[3]?.textContent || '';
            const specialization = cells[4]?.textContent || '';
            const hospital = cells[5]?.textContent || '';
            
            const combinedText = (name + ' ' + email + ' ' + license + ' ' + specialization + ' ' + hospital).toUpperCase();
            
            if (combinedText.indexOf(filter) > -1) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }
}

function addProvider() {
    const modalHTML = `
        <div id="addProviderModal" class="modal active">
            <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Register Healthcare Provider</h2>
                    <button class="modal-close" onclick="closeAddProviderModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addProviderForm" onsubmit="submitAddProvider(event)">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <!-- Basic Information -->
                            <div style="grid-column: 1 / -1;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Account Information</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>Full Name *</label>
                                <input type="text" name="full_name" required placeholder="e.g., Dr. Ahmad">
                            </div>
                            
                            <div class="form-group">
                                <label>Email Address *</label>
                                <input type="email" name="email" required placeholder="e.g., ahmad@hospital.com">
                            </div>
                            
                            <div class="form-group">
                                <label>Password *</label>
                                <input type="password" name="password" required placeholder="Set temporary password">
                            </div>
                            
                            <!-- Professional Information -->
                            <div style="grid-column: 1 / -1; margin-top: 15px;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Professional Information</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>License Number *</label>
                                <input type="text" name="license_number" required placeholder="MMC12345">
                            </div>
                            
                            <div class="form-group">
                                <label>Specialization</label>
                                <select name="specialization">
                                    <option value="">Select Specialization</option>
                                    <option value="Endocrinologist">Endocrinologist</option>
                                    <option value="Diabetologist">Diabetologist</option>
                                    <option value="General Practitioner">General Practitioner</option>
                                    <option value="Dietitian">Dietitian</option>
                                    <option value="Nutritionist">Nutritionist</option>
                                    <option value="Internal Medicine">Internal Medicine</option>
                                    <option value="Family Medicine">Family Medicine</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label>Hospital/Clinic Name</label>
                                <input type="text" name="hospital_clinic" placeholder="e.g., Hospital Kuala Lumpur">
                            </div>
                            
                            <div class="form-group">
                                <label>Phone Number</label>
                                <input type="tel" name="phone_number" placeholder="+60123456789">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_verified" value="1">
                                    <span>Verify immediately (skip verification)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                            <button type="button" class="btn-secondary" onclick="closeAddProviderModal()">Cancel</button>
                            <button type="submit" class="btn-primary">Register Provider</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('addProviderModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddProviderModal() {
    const modal = document.getElementById('addProviderModal');
    if (modal) {
        modal.remove();
    }
}

async function submitAddProvider(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {};
    formData.forEach((value, key) => {
        if (key === 'is_verified') {
            data[key] = value === '1' ? 1 : 0;
        } else {
            data[key] = value;
        }
    });
    
    if (!data.is_verified) data.is_verified = 0;
    
    try {
        const response = await fetch(API_BASE + 'providers.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Healthcare provider registered successfully!');
            closeAddProviderModal();
            loadProviders();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while registering the provider');
    }
}

async function viewProvider(providerId) {
    const modal = document.getElementById('providerProfileModal');
    modal.classList.add('active');

    const container = document.getElementById('providerProfileContent');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const res = await fetch(API_BASE + 'provider_detail.php?provider_id=' + providerId);
        const result = await res.json();

        if (!result.success) {
            container.innerHTML = `<p class="no-data" style="color:#e74c3c;">${result.message}</p>`;
            return;
        }

        const data = result.data;
        const p = data.provider;

        const statsCards = [
            { label: 'Linked Patients', value: data.stats.linked_patients, color: '#3498db' },
            { label: 'Consent Given', value: data.stats.consented_patients, color: '#2ecc71' },
            { label: 'Avg Sugar (7d)', value: (data.stats.avg_patient_sugar_7d ?? 0) + 'g', color: '#f39c12' },
            { label: 'Glucose Spikes (7d)', value: data.stats.glucose_spikes_7d ?? 0, color: '#e74c3c' },
        ];

        const patientsRows = (data.patients || []).map(pt => {
            const consentBadge = pt.consent_given ? '<span class="badge badge-success">Consent</span>' : '<span class="badge badge-warning">No Consent</span>';
            return `
                <tr>
                    <td>${escapeHtml(pt.full_name)} (ID: ${pt.user_id})</td>
                    <td><span class="badge badge-${getHealthStatusBadge(pt.health_status)}">${escapeHtml(pt.health_status)}</span></td>
                    <td>${escapeHtml((pt.city || 'N/A') + ', ' + (pt.state || 'N/A'))}</td>
                    <td>${consentBadge}</td>
                    <td>${escapeHtml(pt.access_level)}</td>
                    <td>${pt.last_active ? formatDateTime(pt.last_active) : 'Never'}</td>
                    <td><button class="btn-secondary btn-small" onclick="viewUser(${pt.user_id})">View User</button></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="7">No linked patients</td></tr>';

        container.innerHTML = `
            <div class="user-profile-header">
                <div class="user-avatar">👨‍⚕️</div>
                <div class="user-basic-info">
                    <h3>${escapeHtml(p.full_name)} <span class="badge badge-${p.is_verified ? 'success' : 'warning'}">${p.is_verified ? 'Verified' : 'Pending'}</span></h3>
                    <p><strong>Provider ID:</strong> ${p.provider_id} | <strong>License:</strong> ${escapeHtml(p.license_number || 'N/A')}</p>
                    <p><strong>Specialization:</strong> ${escapeHtml(p.specialization || 'N/A')} | <strong>Clinic:</strong> ${escapeHtml(p.hospital_clinic || 'N/A')}</p>
                    <p><strong>Email:</strong> ${escapeHtml(p.email)} | <strong>Phone:</strong> ${escapeHtml(p.phone_number || 'N/A')}</p>
                </div>
            </div>

            <h3>Provider Overview</h3>
            <div class="health-status-chart" style="margin-top: 10px;">
                ${statsCards.map(c => `
                    <div class="health-status-item" style="border-left-color: ${c.color}">
                        <h3>${c.value}</h3>
                        <p>${c.label}</p>
                    </div>
                `).join('')}
            </div>

            <h3 style="margin-top: 20px;">Linked Patients</h3>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Health Status</th>
                            <th>Location</th>
                            <th>Consent</th>
                            <th>Access</th>
                            <th>Last Active</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patientsRows}
                    </tbody>
                </table>
            </div>
        `;

    } catch (e) {
        container.innerHTML = '<p class="no-data" style="color:#e74c3c;">Failed to load provider details</p>';
    }
}

function closeProviderProfileModal() {
    document.getElementById('providerProfileModal')?.classList.remove('active');
}

async function verifyProvider(providerId) {
    if (!confirm('Verify this healthcare provider?')) return;

    try {
        const response = await fetch(API_BASE + 'providers.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider_id: providerId, action: 'verify' })
        });

        const result = await response.json();
        if (result.success) {
            alert('Provider verified successfully');
            loadProviders();
        } else {
            alert('Failed to verify provider: ' + result.message);
        }
    } catch (e) {
        alert('Failed to verify provider');
    }
}

// Health Data Functions
function showHealthTab(tab) {
    // Update active tab button
    const tabButtons = document.querySelectorAll('#healthDataSection .tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const content = document.getElementById('healthDataContent');
    
    switch(tab) {
        case 'sugar':
            loadSugarData();
            break;
        case 'glucose':
            loadGlucoseData();
            break;
        case 'weight':
            loadWeightData();
            break;
    }
}

async function loadSugarData() {
    const content = document.getElementById('healthDataContent');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'health_data.php?type=sugar');
        const result = await response.json();
        
        if (result.success) {
            content.innerHTML = `
                <h3>Sugar Intake Statistics</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3>${result.data.avg_daily_sugar}g</h3>
                            <p>Average Daily Sugar</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3>${result.data.compliance_rate}%</h3>
                            <p>Compliance Rate</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3>${result.data.users_exceeding}</h3>
                            <p>Users Exceeding Limit</p>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        content.innerHTML = '<p class="no-data">Error loading sugar data</p>';
    }
}

async function loadGlucoseData() {
    const content = document.getElementById('healthDataContent');
    content.innerHTML = '<div class="spinner"></div>';

    const days = 7;

    try {
        const res = await fetch(API_BASE + `glucose_analytics.php?days=${days}`);
        const result = await res.json();

        if (!result.success) {
            content.innerHTML = `<p class="no-data" style="color:#e74c3c;">${result.message}</p>`;
            return;
        }

        const data = result.data;

        const breakdownCards = (data.status_breakdown || []).map(s => {
            const color = s.status === 'Critical' ? '#e74c3c' : (s.status === 'High' ? '#f39c12' : (s.status === 'Low' ? '#3498db' : '#2ecc71'));
            return `
                <div class="health-status-item" style="border-left-color:${color}">
                    <h3>${s.count}</h3>
                    <p>${s.status}</p>
                </div>
            `;
        }).join('') || '<p class="no-data">No readings</p>';

        const spikesRows = (data.top_spikes || []).map(r => {
            const color = r.status === 'Critical' ? '#e74c3c' : '#f39c12';
            return `
                <tr>
                    <td>${formatDateTime(r.reading_datetime)}</td>
                    <td>${escapeHtml(r.full_name)} (ID: ${r.user_id})</td>
                    <td><span class="badge badge-${r.status === 'Critical' ? 'danger' : 'warning'}">${escapeHtml(r.status)}</span></td>
                    <td style="color:${color}; font-weight:700;">${r.glucose_level} ${escapeHtml(r.unit)}</td>
                    <td><button class="btn-secondary btn-small" onclick="viewUser(${r.user_id})">View User</button></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5">No spikes</td></tr>';

        content.innerHTML = `
            <h3>Population Glucose Overview (Last ${data.period_days} Days)</h3>
            <div class="metrics-grid" style="margin-top: 15px;">
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.total_readings}</h3>
                        <p>Total Readings</p>
                    </div>
                </div>
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.avg_glucose}</h3>
                        <p>Average (mg/dL)</p>
                    </div>
                </div>
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.cgm_users}</h3>
                        <p>Users with CGM</p>
                    </div>
                </div>
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.connected_devices}</h3>
                        <p>CGM Connected</p>
                    </div>
                </div>
            </div>

            <h3 style="margin-top: 10px;">Status Breakdown</h3>
            <div class="health-status-chart" style="margin-top: 10px;">
                ${breakdownCards}
            </div>

            <h3 style="margin-top: 20px;">Top High/Critical Spikes</h3>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Status</th>
                            <th>Value</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${spikesRows}
                    </tbody>
                </table>
            </div>
        `;

    } catch (e) {
        content.innerHTML = '<p class="no-data" style="color:#e74c3c;">Failed to load glucose analytics</p>';
    }
}

async function loadWeightData() {
    const content = document.getElementById('healthDataContent');
    content.innerHTML = '<div class="spinner"></div>';

    const days = 30; // Weight trends are better viewed over longer periods

    try {
        const res = await fetch(API_BASE + `weight_analytics.php?days=${days}`);
        const result = await res.json();

        if (!result.success) {
            content.innerHTML = `<p class="no-data" style="color:#e74c3c;">${result.message}</p>`;
            return;
        }

        const data = result.data;

        // BMI Distribution
        const bmiCards = (data.bmi_distribution || []).map(b => {
            let color = '#95a5a6'; // Default
            if (b.category === 'Normal') color = '#2ecc71';
            else if (b.category === 'Overweight') color = '#f39c12';
            else if (b.category === 'Obese') color = '#e74c3c';
            else if (b.category === 'Underweight') color = '#3498db';

            return `
                <div class="health-status-item" style="border-left-color:${color}">
                    <h3>${b.count}</h3>
                    <p>${b.category}</p>
                </div>
            `;
        }).join('') || '<p class="no-data">No BMI data available</p>';

        // Recent Logs Rows
        const recentRows = (data.recent_logs || []).map(r => {
            let bmiClass = 'secondary';
            if (r.bmi) {
                if (r.bmi < 18.5) bmiClass = 'info';
                else if (r.bmi < 25) bmiClass = 'success';
                else if (r.bmi < 30) bmiClass = 'warning';
                else bmiClass = 'danger';
            }
            return `
                <tr>
                    <td>${formatDateTime(r.log_date)}</td>
                    <td>${escapeHtml(r.full_name)} (ID: ${r.user_id})</td>
                    <td><strong>${r.weight_kg} kg</strong></td>
                    <td><span class="badge badge-${bmiClass}">${r.bmi ? r.bmi : 'N/A'}</span></td>
                    <td>${escapeHtml(r.source)}</td>
                    <td><button class="btn-secondary btn-small" onclick="viewUser(${r.user_id})">View User</button></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6">No recent logs</td></tr>';

        // Trend Rows (Limit to last 7 entries for brevity in table if list is long)
        const trendRows = (data.weight_trend || []).slice(-7).reverse().map(t => {
            return `
                <tr>
                    <td>${t.log_date}</td>
                    <td>${Number(t.daily_avg).toFixed(1)} kg</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="2">No trend data</td></tr>';


        content.innerHTML = `
            <h3>Population Weight Overview (Last ${data.period_days} Days)</h3>
            <div class="metrics-grid" style="margin-top: 15px;">
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.total_logs}</h3>
                        <p>Total Weight Logs</p>
                    </div>
                </div>
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.avg_weight}</h3>
                        <p>Avg Weight (kg)</p>
                    </div>
                </div>
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.avg_bmi}</h3>
                        <p>Avg BMI</p>
                    </div>
                </div>
                <div class="metric-card" style="gap:10px;">
                    <div class="metric-info">
                        <h3 style="text-align:center;">${data.users_with_goals}</h3>
                        <p>Users with Goals</p>
                    </div>
                </div>
            </div>

            <h3 style="margin-top: 20px;">BMI Distribution (Active Users)</h3>
            <div class="health-status-chart" style="margin-top: 10px;">
                ${bmiCards}
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                    <h3>Recent Weight Logs</h3>
                    <div class="table-container" style="margin-top: 10px;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Weight</th>
                                    <th>BMI</th>
                                    <th>Source</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentRows}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div>
                    <h3>Daily Trend (Last 7 Days)</h3>
                    <div class="table-container" style="margin-top: 10px;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Avg Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trendRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

    } catch (e) {
        console.error(e);
        content.innerHTML = '<p class="no-data" style="color:#e74c3c;">Failed to load weight analytics</p>';
    }
}

// Food Database Functions
async function loadFoodDatabase() {
    showLoading('foodTableBody');
    
    try {
        const response = await fetch(API_BASE + 'food_database.php');
        const result = await response.json();
        
        const tbody = document.getElementById('foodTableBody');
        
        if (result.success && result.data.length > 0) {
            tbody.innerHTML = result.data.map(food => `
                <tr>
                    <td>${food.food_id}</td>
                    <td>${food.food_name}</td>
                    <td>${food.category}</td>
                    <td>${food.sugar_per_100g ?? 'N/A'}g</td>
                    <td><span class="badge badge-${food.is_verified ? 'success' : 'warning'}">${food.is_verified ? 'Yes' : 'No'}</span></td>
                    <td>${food.scan_count || 0}</td>
                    <td>
                        <button class="btn-secondary btn-small" onclick="editFood(${food.food_id})">Edit</button>
                        <button class="btn-danger btn-small" onclick="deleteFood(${food.food_id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No food items found</td></tr>';
        }
    } catch (error) {
        showError('foodTableBody', 'Error loading food database');
    }
}

async function loadFoodAnalytics() {
    const periodSelect = document.getElementById('foodAnalyticsPeriod');
    const days = periodSelect ? parseInt(periodSelect.value, 10) : 7;

    const daysLabel = document.getElementById('foodAnalyticsDays');
    if (daysLabel) daysLabel.textContent = String(days);

    const summary = document.getElementById('foodAnalyticsSummary');
    const details = document.getElementById('foodAnalyticsDetails');

    if (!summary || !details) return;

    summary.innerHTML = '<div class="spinner"></div>';
    details.innerHTML = '';

    try {
        const res = await fetch(API_BASE + `food_analytics.php?days=${days}`);
        const result = await res.json();

        if (!result.success) {
            summary.innerHTML = `<p class="no-data" style="color:#e74c3c;">${result.message}</p>`;
            return;
        }

        const data = result.data;

        const cards = [
            { label: 'Total Scans', value: data.total_scans || 0, color: '#3498db' },
            { label: 'Food Items', value: (data.food_database && data.food_database.total_items) || 0, color: '#2ecc71' },
            { label: 'Verified Items', value: (data.food_database && data.food_database.verified_items) || 0, color: '#2ecc71' },
            { label: 'Needs Review', value: (data.food_database && data.food_database.needs_review) || 0, color: '#f39c12' },
            { label: 'Pending User Reports', value: (data.food_database && data.food_database.pending_user_reports) || 0, color: '#e67e22' },
        ];

        summary.innerHTML = cards.map(c => `
            <div class="health-status-item" style="border-left-color: ${c.color}">
                <h3>${c.value}</h3>
                <p>${c.label}</p>
            </div>
        `).join('');
        
        console.log('Food Analytics Data:', data); // Debug log

        const methodsHtml = (data.recognition_methods || []).map(m => `<li>${m.recognition_method || 'AI Recognition'}: <strong>${m.count}</strong></li>`).join('') || '<li>No data</li>';
        const topFoodsHtml = (data.top_scanned_foods || []).map(f => `<tr><td>${escapeHtml(f.food_name)}</td><td>${f.scans}</td></tr>`).join('') || '<tr><td colspan="2">No data</td></tr>';
        const highSugarHtml = (data.high_sugar_consumption || []).map(f => `<tr><td>${escapeHtml(f.food_name)}</td><td>${f.entries}</td><td>${f.avg_sugar}g</td><td>${f.total_sugar}g</td></tr>`).join('') || '<tr><td colspan="4">No data</td></tr>';

        details.innerHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <label>Recognition Methods</label>
                    <div style="padding-top:6px; font-size: 13px; color:#c9b7a9; opacity:0.9;">
                        <ul style="margin:0; padding-left: 18px;">
                            ${methodsHtml}
                        </ul>
                    </div>
                </div>
            </div>

            <h3 style="margin: 10px 0;">Top Scanned Foods</h3>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Food</th><th>Scans</th></tr></thead>
                    <tbody>${topFoodsHtml}</tbody>
                </table>
            </div>

            <h3 style="margin: 20px 0 10px;">Highest Total Sugar Consumption (Approx.)</h3>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Food</th><th>Entries</th><th>Avg Sugar</th><th>Total Sugar</th></tr></thead>
                    <tbody>${highSugarHtml}</tbody>
                </table>
            </div>
        `;

    } catch (e) {
        summary.innerHTML = '<p class="no-data" style="color:#e74c3c;">Failed to load analytics</p>';
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function addFood() {
    // Create modal HTML
    const modalHTML = `
        <div id="addFoodModal" class="modal active">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Add New Food Item</h2>
                    <button class="modal-close" onclick="closeAddFoodModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addFoodForm" onsubmit="submitAddFood(event)">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <!-- Basic Information -->
                            <div style="grid-column: 1 / -1;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Basic Information</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>Food Name *</label>
                                <input type="text" name="food_name" required placeholder="e.g., Nasi Lemak">
                            </div>
                            
                            <div class="form-group">
                                <label>Food Name (Malay)</label>
                                <input type="text" name="food_name_malay" placeholder="e.g., Nasi Lemak">
                            </div>
                            
                            <div class="form-group">
                                <label>Category *</label>
                                <select name="category" required>
                                    <option value="">Select Category</option>
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Dinner">Dinner</option>
                                    <option value="Snack">Snack</option>
                                    <option value="Beverage">Beverage</option>
                                    <option value="Dessert">Dessert</option>
                                    <option value="Fast Food">Fast Food</option>
                                    <option value="Local Malaysian">Local Malaysian</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Subcategory</label>
                                <input type="text" name="subcategory" placeholder="e.g., Rice Dish">
                            </div>
                            
                            <!-- Nutritional Information (per 100g) -->
                            <div style="grid-column: 1 / -1; margin-top: 15px;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Nutritional Information (per 100g)</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>Sugar (g) *</label>
                                <input type="number" name="sugar_per_100g" step="0.1" required placeholder="0.0">
                            </div>
                            
                            <div class="form-group">
                                <label>Calories (kcal) *</label>
                                <input type="number" name="calories_per_100g" required placeholder="0">
                            </div>
                            
                            <div class="form-group">
                                <label>Carbohydrates (g)</label>
                                <input type="number" name="carbs_per_100g" step="0.1" placeholder="0.0">
                            </div>
                            
                            <div class="form-group">
                                <label>Protein (g)</label>
                                <input type="number" name="protein_per_100g" step="0.1" placeholder="0.0">
                            </div>
                            
                            <div class="form-group">
                                <label>Fat (g)</label>
                                <input type="number" name="fat_per_100g" step="0.1" placeholder="0.0">
                            </div>
                            
                            <div class="form-group">
                                <label>Fiber (g)</label>
                                <input type="number" name="fiber_per_100g" step="0.1" placeholder="0.0">
                            </div>
                            
                            <!-- Serving Information -->
                            <div style="grid-column: 1 / -1; margin-top: 15px;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Serving Information</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>Typical Serving Size</label>
                                <input type="text" name="typical_serving_size" placeholder="e.g., 1 plate">
                            </div>
                            
                            <div class="form-group">
                                <label>Serving Size (grams)</label>
                                <input type="number" name="typical_serving_grams" step="0.1" placeholder="0.0">
                            </div>
                            
                            <!-- Product Information -->
                            <div style="grid-column: 1 / -1; margin-top: 15px;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Product Information (Optional)</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>Barcode</label>
                                <input type="text" name="barcode" placeholder="e.g., 9556001234567">
                            </div>
                            
                            <div class="form-group">
                                <label>Brand Name</label>
                                <input type="text" name="brand_name" placeholder="e.g., Nestle">
                            </div>
                            
                            <!-- Malaysian Food Specific -->
                            <div style="grid-column: 1 / -1; margin-top: 15px;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Malaysian Food Options</h3>
                            </div>
                            
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_malaysian_food" value="1" style="width: auto;">
                                    <span>This is a Malaysian food</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label>Regional Variant</label>
                                <input type="text" name="regional_variant" placeholder="e.g., Penang, Johor">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="hawker_stall_common" value="1" style="width: auto;">
                                    <span>Common at hawker stalls</span>
                                </label>
                            </div>
                            
                            <!-- Status -->
                            <div style="grid-column: 1 / -1; margin-top: 15px;">
                                <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Status</h3>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_verified" value="1" checked style="width: auto;">
                                    <span>Mark as verified</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_active" value="1" checked style="width: auto;">
                                    <span>Active (visible to users)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                            <button type="button" class="btn-secondary" onclick="closeAddFoodModal()">Cancel</button>
                            <button type="submit" class="btn-primary">Add Food Item</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('addFoodModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddFoodModal() {
    const modal = document.getElementById('addFoodModal');
    if (modal) {
        modal.remove();
    }
}

async function submitAddFood(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Convert FormData to JSON
    const data = {};
    formData.forEach((value, key) => {
        if (key === 'is_malaysian_food' || key === 'hawker_stall_common' || key === 'is_verified' || key === 'is_active') {
            data[key] = value === '1' ? 1 : 0;
        } else {
            data[key] = value;
        }
    });
    
    // Set defaults for unchecked checkboxes
    if (!data.is_malaysian_food) data.is_malaysian_food = 0;
    if (!data.hawker_stall_common) data.hawker_stall_common = 0;
    if (!data.is_verified) data.is_verified = 0;
    if (!data.is_active) data.is_active = 0;
    
    try {
        const response = await fetch(API_BASE + 'food_database.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Food item added successfully!');
            closeAddFoodModal();
            loadFoodDatabase(); // Reload the food database table
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the food item');
    }
}

async function editFood(foodId) {
    try {
        // Fetch food details
        const response = await fetch(API_BASE + 'food_database.php');
        const result = await response.json();
        
        if (!result.success) {
            alert('Failed to load food data');
            return;
        }
        
        const food = result.data.find(f => f.food_id == foodId);
        if (!food) {
            alert('Food item not found');
            return;
        }
        
        // Create edit modal with pre-filled data
        const modalHTML = `
            <div id="editFoodModal" class="modal active">
                <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Edit Food Item</h2>
                        <button class="modal-close" onclick="closeEditFoodModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editFoodForm" onsubmit="submitEditFood(event, ${foodId})">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <!-- Basic Information -->
                                <div style="grid-column: 1 / -1;">
                                    <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Basic Information</h3>
                                </div>
                                
                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label>Food Name (English) *</label>
                                    <input type="text" name="food_name" value="${food.food_name}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label>Food Name (Malay)</label>
                                    <input type="text" name="food_name_malay" value="${food.food_name_malay || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Category *</label>
                                    <select name="category" required>
                                        <option value="Beverages" ${food.category === 'Beverages' ? 'selected' : ''}>Beverages</option>
                                        <option value="Snacks" ${food.category === 'Snacks' ? 'selected' : ''}>Snacks</option>
                                        <option value="Meals" ${food.category === 'Meals' ? 'selected' : ''}>Meals</option>
                                        <option value="Desserts" ${food.category === 'Desserts' ? 'selected' : ''}>Desserts</option>
                                        <option value="Fruits" ${food.category === 'Fruits' ? 'selected' : ''}>Fruits</option>
                                        <option value="Condiments" ${food.category === 'Condiments' ? 'selected' : ''}>Condiments</option>
                                        <option value="Fast Food" ${food.category === 'Fast Food' ? 'selected' : ''}>Fast Food</option>
                                        <option value="Other" ${food.category === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Brand Name</label>
                                    <input type="text" name="brand_name" value="${food.brand_name || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Barcode</label>
                                    <input type="text" name="barcode" value="${food.barcode || ''}">
                                </div>
                                
                                <!-- Nutritional Information -->
                                <div style="grid-column: 1 / -1; margin-top: 15px;">
                                    <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Nutritional Information (per 100g)</h3>
                                </div>
                                
                                <div class="form-group">
                                    <label>Sugar Content (g) *</label>
                                    <input type="number" step="0.1" name="sugar_per_100g" value="${food.sugar_per_100g || ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label>Calories (kcal)</label>
                                    <input type="number" name="calories_per_100g" value="${food.calories_per_100g || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Carbohydrates (g)</label>
                                    <input type="number" step="0.1" name="carbs_per_100g" value="${food.carbs_per_100g || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Protein (g)</label>
                                    <input type="number" step="0.1" name="protein_per_100g" value="${food.protein_per_100g || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Fat (g)</label>
                                    <input type="number" step="0.1" name="fat_per_100g" value="${food.fat_per_100g || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Fiber (g)</label>
                                    <input type="number" step="0.1" name="fiber_per_100g" value="${food.fiber_per_100g || ''}">
                                </div>
                                
                                <!-- Malaysian Food Options -->
                                <div style="grid-column: 1 / -1; margin-top: 15px;">
                                    <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Malaysian Food Options</h3>
                                </div>
                                
                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" name="is_malaysian_food" value="1" ${food.is_malaysian_food ? 'checked' : ''} style="width: auto;">
                                        <span>This is a Malaysian food</span>
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>Regional Variant</label>
                                    <input type="text" name="regional_variant" value="${food.regional_variant || ''}" placeholder="e.g., Penang, Johor">
                                </div>
                                
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" name="hawker_stall_common" value="1" ${food.hawker_stall_common ? 'checked' : ''} style="width: auto;">
                                        <span>Common at hawker stalls</span>
                                    </label>
                                </div>
                                
                                <!-- Status -->
                                <div style="grid-column: 1 / -1; margin-top: 15px;">
                                    <h3 style="margin-bottom: 15px; color: #362419; border-bottom: 1px solid rgba(201,183,169,0.3); padding-bottom: 10px;">Status</h3>
                                </div>
                                
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" name="is_verified" value="1" ${food.is_verified ? 'checked' : ''} style="width: auto;">
                                        <span>Mark as verified</span>
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" name="is_active" value="1" ${food.is_active ? 'checked' : ''} style="width: auto;">
                                        <span>Active (visible to users)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                                <button type="button" class="btn-secondary" onclick="closeEditFoodModal()">Cancel</button>
                                <button type="submit" class="btn-primary">Update Food Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('editFoodModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error loading food for edit:', error);
        alert('An error occurred while loading the food item');
    }
}

function closeEditFoodModal() {
    const modal = document.getElementById('editFoodModal');
    if (modal) modal.remove();
}

async function submitEditFood(event, foodId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        food_id: foodId,
        food_name: formData.get('food_name'),
        food_name_malay: formData.get('food_name_malay'),
        category: formData.get('category'),
        brand_name: formData.get('brand_name'),
        barcode: formData.get('barcode'),
        sugar_per_100g: formData.get('sugar_per_100g'),
        calories_per_100g: formData.get('calories_per_100g'),
        carbs_per_100g: formData.get('carbs_per_100g'),
        protein_per_100g: formData.get('protein_per_100g'),
        fat_per_100g: formData.get('fat_per_100g'),
        fiber_per_100g: formData.get('fiber_per_100g'),
        is_malaysian_food: formData.get('is_malaysian_food') ? 1 : 0,
        regional_variant: formData.get('regional_variant'),
        hawker_stall_common: formData.get('hawker_stall_common') ? 1 : 0,
        is_verified: formData.get('is_verified') ? 1 : 0,
        is_active: formData.get('is_active') ? 1 : 0
    };
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    try {
        const response = await fetch(API_BASE + 'food_database.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Food item updated successfully!');
            closeEditFoodModal();
            loadFoodDatabase();
            if (typeof loadFoodAnalytics === 'function') {
                loadFoodAnalytics();
            }
        } else {
            alert('Failed to update food item: ' + result.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Food Item';
        }
    } catch (error) {
        console.error('Error updating food:', error);
        alert('An error occurred while updating the food item');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Food Item';
    }
}

async function deleteFood(foodId, foodName) {
    if (!confirm(`Are you sure you want to delete "${foodName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(API_BASE + 'food_database.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ food_id: foodId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Food item deleted successfully!');
            loadFoodDatabase();
            if (typeof loadFoodAnalytics === 'function') {
                loadFoodAnalytics();
            }
        } else {
            alert('Failed to delete food item: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting food:', error);
        alert('An error occurred while deleting the food item');
    }
}

// Alerts & Notifications Dashboard
let alertsRefreshInterval = null;

function startAlertsAutoRefresh(intervalSeconds = 30) {
    if (alertsRefreshInterval) clearInterval(alertsRefreshInterval);
    alertsRefreshInterval = setInterval(() => {
        loadAlertsDashboard(false);
    }, intervalSeconds * 1000);
}

function stopAlertsAutoRefresh() {
    if (alertsRefreshInterval) {
        clearInterval(alertsRefreshInterval);
        alertsRefreshInterval = null;
    }
}

async function loadAlertsDashboard(force = true) {
    const tbody = document.getElementById('alertsTableBody');
    const summary = document.getElementById('alertsSummary');

    if (force && tbody) tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';
    if (force && summary) summary.innerHTML = '<div class="spinner"></div>';

    const severity = document.getElementById('alertSeverityFilter')?.value || '';
    const type = document.getElementById('alertTypeFilter')?.value || '';
    const unreadOnly = document.getElementById('alertUnreadOnly')?.checked ?? true;

    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (type) params.set('type', type);
    if (unreadOnly) params.set('unread', 'true');

    try {
        const res = await fetch(API_BASE + 'alerts.php?' + params.toString());
        const result = await res.json();

        if (!result.success) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="no-data" style="color:#e74c3c;">${result.message}</td></tr>`;
            if (summary) summary.innerHTML = `<p class="no-data" style="color:#e74c3c;">${result.message}</p>`;
            return;
        }

        const alerts = result.data || [];

        // Summary cards
        const counts = { total: alerts.length, info: 0, warning: 0, critical: 0 };
        for (const a of alerts) {
            const s = (a.severity || '').toLowerCase();
            if (s === 'info') counts.info++;
            else if (s === 'warning') counts.warning++;
            else if (s === 'critical') counts.critical++;
        }

        if (summary) {
            const cards = [
                { label: 'Total Alerts', value: counts.total, color: '#3498db' },
                { label: 'Info', value: counts.info, color: '#3498db' },
                { label: 'Warning', value: counts.warning, color: '#f39c12' },
                { label: 'Critical', value: counts.critical, color: '#e74c3c' },
            ];

            summary.innerHTML = cards.map(c => `
                <div class="health-status-item" style="border-left-color: ${c.color}">
                    <h3>${c.value}</h3>
                    <p>${c.label}</p>
                </div>
            `).join('');
        }

        if (tbody) {
            if (alerts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="no-data">No alerts found</td></tr>';
            } else {
                tbody.innerHTML = alerts.map(a => {
                    const sevBadge = a.severity === 'Critical' ? 'danger' : (a.severity === 'Warning' ? 'warning' : 'info');
                    const statusBadge = a.is_read ? '<span class="badge badge-success">Read</span>' : '<span class="badge badge-warning">Unread</span>';
                    return `
                        <tr>
                            <td>${formatDateTime(a.alert_datetime)}</td>
                            <td>${escapeHtml(a.full_name)} (ID: ${a.user_id})</td>
                            <td>${escapeHtml(a.alert_type)}</td>
                            <td><span class="badge badge-${sevBadge}">${escapeHtml(a.severity)}</span></td>
                            <td>${escapeHtml(a.title)}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <button class="btn-secondary btn-small" onclick="viewUser(${a.user_id})">View User</button>
                                ${a.is_read ? '' : `<button class="btn-primary btn-small" onclick="markAlertRead(${a.alert_id})">Mark Read</button>`}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Load notification history (separately)
        loadNotificationHistory();

    } catch (e) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="no-data" style="color:#e74c3c;">Failed to load alerts</td></tr>';
        if (summary) summary.innerHTML = '<p class="no-data" style="color:#e74c3c;">Failed to load alert summary</p>';
    }
}

async function markAlertRead(alertId) {
    try {
        const res = await fetch(API_BASE + 'alerts.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alert_id: alertId })
        });
        const result = await res.json();
        if (result.success) {
            loadAlertsDashboard(true);
        } else {
            alert('Failed to mark read: ' + result.message);
        }
    } catch (e) {
        alert('Failed to mark alert as read');
    }
}

async function loadNotificationHistory() {
    const container = document.getElementById('notificationHistory');
    if (!container) return;

    try {
        const res = await fetch(API_BASE + 'notifications.php?limit=20');
        const result = await res.json();

        if (!result.success) {
            container.innerHTML = `<p class="no-data" style="color:#e74c3c;">${result.message}</p>`;
            return;
        }

        const items = result.data || [];
        if (items.length === 0) {
            container.innerHTML = '<p class="no-data">No notifications sent yet</p>';
            return;
        }

        container.innerHTML = items.map(n => `
            <div class="activity-item" style="border-left-color: #2ecc71">
                <div class="activity-header">
                    <span class="activity-icon" style="color:#2ecc71">📣</span>
                    <span class="activity-type">${escapeHtml(n.notification_type)} • ${escapeHtml(n.channel)}</span>
                    <span class="time">${formatDateTime(n.sent_datetime)}</span>
                </div>
                <div class="description"><strong>${escapeHtml(n.title || 'Notification')}</strong><br>${escapeHtml(n.message)}</div>
            </div>
        `).join('');

    } catch (e) {
        container.innerHTML = '<p class="no-data" style="color:#e74c3c;">Failed to load notification history</p>';
    }
}

function openBroadcastNotification() {
    const modalHTML = `
        <div id="broadcastModal" class="modal active">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Send Broadcast Notification</h2>
                    <button class="modal-close" onclick="closeBroadcastModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="broadcastForm" onsubmit="submitBroadcastNotification(event)">
                        <div class="form-group">
                            <label>Notification Title *</label>
                            <input type="text" name="title" required placeholder="e.g., System Maintenance Notice" maxlength="100">
                        </div>
                        
                        <div class="form-group">
                            <label>Message *</label>
                            <textarea name="message" rows="5" required placeholder="Enter your broadcast message here..." maxlength="500"></textarea>
                            <small style="opacity: 0.7; font-size: 12px;">Max 500 characters</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Target Audience</label>
                            <select name="segment" style="width: 100%; padding: 10px; background: #ffffff; border: 1px solid rgba(54, 36, 25, 0.3); border-radius: 6px; font-size: 14px;">
                                <option value="All Users">All Users</option>
                                <option value="Active Users">Active Users Only</option>
                                <option value="High Risk Users">High Risk Users</option>
                                <option value="Premium Users">Premium Users</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                            <button type="button" class="btn-secondary" onclick="closeBroadcastModal()">Cancel</button>
                            <button type="submit" class="btn-primary">Send Notification</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('broadcastModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeBroadcastModal() {
    const modal = document.getElementById('broadcastModal');
    if (modal) {
        modal.remove();
    }
}

async function submitBroadcastNotification(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        title: formData.get('title'),
        message: formData.get('message'),
        type: 'Broadcast',
        channel: 'Push',
        segment: formData.get('segment')
    };
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch(API_BASE + 'notifications.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Broadcast notification sent successfully!');
            closeBroadcastModal();
            // Reload notification history if on alerts page
            if (typeof loadNotificationHistory === 'function') {
                loadNotificationHistory();
            }
        } else {
            alert('Failed to send notification: ' + result.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Notification';
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        alert('An error occurred while sending the notification');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Notification';
    }
}

async function sendBroadcastNotification(title, message) {
    try {
        const res = await fetch(API_BASE + 'notifications.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, message, type: 'Broadcast', channel: 'Push', segment: 'All Users' })
        });
        const result = await res.json();
        if (result.success) {
            alert('Notification queued/sent successfully');
            loadNotificationHistory();
        } else {
            alert('Failed to send: ' + result.message);
        }
    } catch (e) {
        alert('Failed to send notification');
    }
}

// Device Management Functions
async function loadDevices() {
    showLoading('devicesContent');
    
    try {
        // Load device statistics
        const statsResponse = await fetch(API_BASE + 'devices.php?action=stats');
        const statsResult = await statsResponse.json();
        
        // Load device list
        const devicesResponse = await fetch(API_BASE + 'devices.php?action=list');
        const devicesResult = await devicesResponse.json();
        
        displayDeviceDashboard(statsResult, devicesResult);
    } catch (error) {
        showError('devicesContent', 'Error loading device data');
        console.error('Error loading devices:', error);
    }
}

function displayDeviceDashboard(stats, devices) {
    const content = document.getElementById('devicesContent');
    
    // Calculate additional stats
    const totalDevices = stats.total_devices || 0;
    const connectedDevices = stats.total_connected || 0;
    const disconnectedDevices = stats.total_disconnected || 0;
    const cgmLowBattery = stats.cgm_stats?.cgm_low_battery || 0;
    const scaleLowBattery = stats.scale_stats?.scales_low_battery || 0;
    const sensorsExpiringSoon = stats.cgm_stats?.sensors_expiring_soon || 0;
    const sensorsExpired = stats.cgm_stats?.sensors_expired || 0;
    
    content.innerHTML = `
        <div class="section-header">
            <h2>Device Management</h2>
            <div class="header-actions">
                <button class="btn-secondary" onclick="showDeviceTab('cgm')">CGM Devices</button>
                <button class="btn-secondary" onclick="showDeviceTab('scale')">Smart Scales</button>
                <button class="btn-secondary" onclick="showDeviceTab('alerts')">Device Alerts</button>
            </div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${totalDevices}</h3>
                    <p>Total Devices</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #2ecc71;">${connectedDevices}</h3>
                    <p>Connected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${disconnectedDevices}</h3>
                    <p>Disconnected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${cgmLowBattery + scaleLowBattery}</h3>
                    <p>Low Battery</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${sensorsExpiringSoon}</h3>
                    <p>Sensors Expiring Soon</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${sensorsExpired}</h3>
                    <p>Sensors Expired</p>
                </div>
            </div>
        </div>
        
        <div id="deviceTabContent" style="margin-top: 20px;">
            <h3>All Devices</h3>
            ${displayAllDevices(devices)}
        </div>
    `;
}

function displayAllDevices(devices) {
    const cgmDevices = devices.cgm_devices || [];
    const scaleDevices = devices.scale_devices || [];
    
    let html = '<h4 style="margin-top: 20px;">CGM Devices</h4>';
    
    if (cgmDevices.length > 0) {
        html += `
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Device Model</th>
                            <th>Status</th>
                            <th>Battery</th>
                            <th>Sensor Expiry</th>
                            <th>Last Sync</th>
                            <th>Alert</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cgmDevices.map(device => {
                            const statusBadge = device.connection_status === 'Connected' ? 'success' : 
                                              device.connection_status === 'Disconnected' ? 'danger' : 'warning';
                            const batteryColor = device.battery_level <= 20 ? '#e74c3c' : 
                                               device.battery_level <= 50 ? '#f39c12' : '#2ecc71';
                            const alertBadge = device.alert_status === 'Critical' ? 'danger' : 
                                             device.alert_status === 'Warning' ? 'warning' : 'success';
                            
                            const sensorInfo = device.sensor_days_remaining !== null ? 
                                `${device.sensor_days_remaining} days` : 'N/A';
                            const sensorColor = device.sensor_days_remaining <= 1 ? '#e74c3c' :
                                              device.sensor_days_remaining <= 3 ? '#f39c12' : '#2ecc71';
                            
                            return `
                                <tr>
                                    <td>${escapeHtml(device.full_name)}<br><small>${escapeHtml(device.email)}</small></td>
                                    <td>${escapeHtml(device.device_model || 'N/A')}</td>
                                    <td><span class="badge badge-${statusBadge}">${escapeHtml(device.connection_status)}</span></td>
                                    <td><span style="color: ${batteryColor}; font-weight: 700;">${device.battery_level || 'N/A'}%</span></td>
                                    <td><span style="color: ${sensorColor}; font-weight: 700;">${sensorInfo}</span></td>
                                    <td>${device.last_sync ? formatDateTime(device.last_sync) : 'Never'}</td>
                                    <td><span class="badge badge-${alertBadge}">${escapeHtml(device.alert_status)}</span></td>
                                    <td>
                                        <button class="btn-secondary btn-small" onclick="viewUser(${device.user_id})">View User</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += '<p class="no-data">No CGM devices found</p>';
    }
    
    html += '<h4 style="margin-top: 30px;">Smart Scale Devices</h4>';
    
    if (scaleDevices.length > 0) {
        html += `
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Device Model</th>
                            <th>Status</th>
                            <th>Battery</th>
                            <th>Last Sync</th>
                            <th>Alert</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${scaleDevices.map(device => {
                            const statusBadge = device.connection_status === 'Connected' ? 'success' : 
                                              device.connection_status === 'Disconnected' ? 'danger' : 'warning';
                            const batteryColor = device.battery_level <= 20 ? '#e74c3c' : 
                                               device.battery_level <= 50 ? '#f39c12' : '#2ecc71';
                            const alertBadge = device.alert_status === 'Critical' ? 'danger' : 
                                             device.alert_status === 'Warning' ? 'warning' : 'success';
                            
                            return `
                                <tr>
                                    <td>${escapeHtml(device.full_name)}<br><small>${escapeHtml(device.email)}</small></td>
                                    <td>${escapeHtml(device.device_model || 'N/A')}</td>
                                    <td><span class="badge badge-${statusBadge}">${escapeHtml(device.connection_status)}</span></td>
                                    <td><span style="color: ${batteryColor}; font-weight: 700;">${device.battery_level || 'N/A'}%</span></td>
                                    <td>${device.last_sync ? formatDateTime(device.last_sync) : 'Never'}</td>
                                    <td><span class="badge badge-${alertBadge}">${escapeHtml(device.alert_status)}</span></td>
                                    <td>
                                        <button class="btn-secondary btn-small" onclick="viewUser(${device.user_id})">View User</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += '<p class="no-data">No smart scale devices found</p>';
    }
    
    return html;
}

function updateDeviceMetrics(type, stats, alerts = []) {
    const metricsGrid = document.querySelector('#devicesContent .metrics-grid');
    if (!metricsGrid) return;
    
    let metricsHTML = '';
    
    if (type === 'cgm') {
        // CGM-specific metrics
        const cgm = stats.cgm_stats || {};
        metricsHTML = `
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${cgm.total_cgm || 0}</h3>
                    <p>Total CGM Devices</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #2ecc71;">${cgm.cgm_connected || 0}</h3>
                    <p>Connected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${cgm.cgm_disconnected || 0}</h3>
                    <p>Disconnected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${cgm.cgm_low_battery || 0}</h3>
                    <p>Low Battery</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${cgm.sensors_expiring_soon || 0}</h3>
                    <p>Sensors Expiring Soon</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${cgm.sensors_expired || 0}</h3>
                    <p>Sensors Expired</p>
                </div>
            </div>
        `;
    } else if (type === 'scale') {
        // Smart Scale-specific metrics
        const scale = stats.scale_stats || {};
        metricsHTML = `
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${scale.total_scales || 0}</h3>
                    <p>Total Smart Scales</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #2ecc71;">${scale.scales_connected || 0}</h3>
                    <p>Connected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${scale.scales_disconnected || 0}</h3>
                    <p>Disconnected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${scale.scales_low_battery || 0}</h3>
                    <p>Low Battery</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${Math.round(scale.avg_battery_level || 0)}%</h3>
                    <p>Avg Battery Level</p>
                </div>
            </div>
        `;
    } else if (type === 'alerts') {
        // Alert-specific metrics
        const cgm = stats.cgm_stats || {};
        const scale = stats.scale_stats || {};
        const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
        const warningCount = alerts.filter(a => a.severity === 'Warning').length;
        
        metricsHTML = `
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${criticalCount}</h3>
                    <p>Critical Alerts</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${warningCount}</h3>
                    <p>Warning Alerts</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${alerts.length}</h3>
                    <p>Total Unresolved</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${cgm.sensors_expired || 0}</h3>
                    <p>Expired Sensors</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${(cgm.cgm_low_battery || 0) + (scale.scales_low_battery || 0)}</h3>
                    <p>Low Battery Devices</p>
                </div>
            </div>
        `;
    } else {
        // All devices (default view)
        const totalDevices = stats.total_devices || 0;
        const connectedDevices = stats.total_connected || 0;
        const disconnectedDevices = stats.total_disconnected || 0;
        const cgmLowBattery = stats.cgm_stats?.cgm_low_battery || 0;
        const scaleLowBattery = stats.scale_stats?.scales_low_battery || 0;
        const sensorsExpiringSoon = stats.cgm_stats?.sensors_expiring_soon || 0;
        const sensorsExpired = stats.cgm_stats?.sensors_expired || 0;
        
        metricsHTML = `
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${totalDevices}</h3>
                    <p>Total Devices</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #2ecc71;">${connectedDevices}</h3>
                    <p>Connected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${disconnectedDevices}</h3>
                    <p>Disconnected</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${cgmLowBattery + scaleLowBattery}</h3>
                    <p>Low Battery</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${sensorsExpiringSoon}</h3>
                    <p>Sensors Expiring Soon</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${sensorsExpired}</h3>
                    <p>Sensors Expired</p>
                </div>
            </div>
        `;
    }
    
    metricsGrid.innerHTML = metricsHTML;
}

async function showDeviceTab(tab) {
    const tabContent = document.getElementById('deviceTabContent');
    
    switch(tab) {
        case 'cgm':
            await loadCGMDevices();
            break;
        case 'scale':
            await loadScaleDevices();
            break;
        case 'alerts':
            await loadDeviceAlerts();
            break;
    }
}

async function loadCGMDevices() {
    const tabContent = document.getElementById('deviceTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Fetch both stats and device details
        const statsResponse = await fetch(API_BASE + 'devices.php?action=stats');
        const statsResult = await statsResponse.json();
        
        const response = await fetch(API_BASE + 'devices.php?action=cgm_details');
        const devices = await response.json();
        
        // Update metrics to show only CGM stats
        updateDeviceMetrics('cgm', statsResult);
        
        
        if (devices.length > 0) {
            tabContent.innerHTML = `
                <h3>CGM Devices</h3>
                <div class="table-container" style="margin-top: 10px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Health Status</th>
                                <th>Device</th>
                                <th>Connection</th>
                                <th>Battery</th>
                                <th>Sensor Status</th>
                                <th>Readings (24h)</th>
                                <th>Last Sync</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${devices.map(d => {
                                const statusBadge = d.connection_status === 'Connected' ? 'success' : 
                                                  d.connection_status === 'Disconnected' ? 'danger' : 'warning';
                                const healthBadge = getHealthStatusBadge(d.health_status);
                                const batteryColor = d.battery_level <= 20 ? '#e74c3c' : d.battery_level <= 50 ? '#f39c12' : '#2ecc71';
                                
                                let sensorInfo = 'N/A';
                                let sensorColor = '#95a5a6';
                                if (d.sensor_status) {
                                    sensorInfo = `${d.sensor_status}`;
                                    if (d.expiry_date) {
                                        const daysLeft = Math.ceil((new Date(d.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                        sensorInfo += ` (${daysLeft}d)`;
                                        sensorColor = daysLeft <= 1 ? '#e74c3c' : daysLeft <= 3 ? '#f39c12' : '#2ecc71';
                                    }
                                }
                                
                                return `
                                    <tr>
                                        <td>${escapeHtml(d.full_name)}<br><small>${d.state || 'N/A'}, ${d.city || 'N/A'}</small></td>
                                        <td><span class="badge badge-${healthBadge}">${escapeHtml(d.health_status)}</span></td>
                                        <td>${escapeHtml(d.device_model || 'N/A')}<br><small>${escapeHtml(d.serial_number || '')}</small></td>
                                        <td><span class="badge badge-${statusBadge}">${escapeHtml(d.connection_status)}</span></td>
                                        <td><span style="color: ${batteryColor}; font-weight: 700;">${d.battery_level || 'N/A'}%</span></td>
                                        <td><span style="color: ${sensorColor};">${sensorInfo}</span></td>
                                        <td>${d.readings_24h || 0}</td>
                                        <td>${d.last_sync ? formatDateTime(d.last_sync) : 'Never'}</td>
                                        <td>
                                            <button class="btn-secondary btn-small" onclick="viewUser(${d.user_id})">View User</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tabContent.innerHTML = '<p class="no-data">No CGM devices found</p>';
        }
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading CGM devices</p>';
    }
}

async function loadScaleDevices() {
    const tabContent = document.getElementById('deviceTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Fetch both stats and device details
        const statsResponse = await fetch(API_BASE + 'devices.php?action=stats');
        const statsResult = await statsResponse.json();
        
        const response = await fetch(API_BASE + 'devices.php?action=scale_details');
        const devices = await response.json();
        
        // Update metrics to show only Scale stats
        updateDeviceMetrics('scale', statsResult);
        
        
        if (devices.length > 0) {
            tabContent.innerHTML = `
                <h3>Smart Scale Devices</h3>
                <div class="table-container" style="margin-top: 10px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Health Status</th>
                                <th>Device</th>
                                <th>Connection</th>
                                <th>Battery</th>
                                <th>Current Weight</th>
                                <th>BMI</th>
                                <th>Logs (30d)</th>
                                <th>Last Sync</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${devices.map(d => {
                                const statusBadge = d.connection_status === 'Connected' ? 'success' : 
                                                  d.connection_status === 'Disconnected' ? 'danger' : 'warning';
                                const healthBadge = getHealthStatusBadge(d.health_status);
                                const batteryColor = d.battery_level <= 20 ? '#e74c3c' : d.battery_level <= 50 ? '#f39c12' : '#2ecc71';
                                
                                return `
                                    <tr>
                                        <td>${escapeHtml(d.full_name)}<br><small>${escapeHtml(d.email)}</small></td>
                                        <td><span class="badge badge-${healthBadge}">${escapeHtml(d.health_status)}</span></td>
                                        <td>${escapeHtml(d.device_model || 'N/A')}<br><small>${escapeHtml(d.serial_number || '')}</small></td>
                                        <td><span class="badge badge-${statusBadge}">${escapeHtml(d.connection_status)}</span></td>
                                        <td><span style="color: ${batteryColor}; font-weight: 700;">${d.battery_level || 'N/A'}%</span></td>
                                        <td>${d.current_weight_kg ? d.current_weight_kg + ' kg' : 'N/A'}</td>
                                        <td>${d.bmi ? d.bmi : 'N/A'}</td>
                                        <td>${d.logs_30d || 0}</td>
                                        <td>${d.last_sync ? formatDateTime(d.last_sync) : 'Never'}</td>
                                        <td>
                                            <button class="btn-secondary btn-small" onclick="viewUser(${d.user_id})">View User</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tabContent.innerHTML = '<p class="no-data">No smart scale devices found</p>';
        }
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading smart scale devices</p>';
    }
}

async function loadDeviceAlerts() {
    const tabContent = document.getElementById('deviceTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Fetch both stats and alerts
        const statsResponse = await fetch(API_BASE + 'devices.php?action=stats');
        const statsResult = await statsResponse.json();
        
        const response = await fetch(API_BASE + 'devices.php?action=alerts');
        const alerts = await response.json();
        
        // Update metrics to show alert stats
        updateDeviceMetrics('alerts', statsResult, alerts);
        
        
        if (alerts.length > 0) {
            tabContent.innerHTML = `
                <h3>Device Alerts</h3>
                <div class="table-container" style="margin-top: 10px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Device Type</th>
                                <th>Device</th>
                                <th>Alert Type</th>
                                <th>Severity</th>
                                <th>Message</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${alerts.map(a => {
                                const severityBadge = a.severity === 'Critical' ? 'danger' : 
                                                    a.severity === 'Warning' ? 'warning' : 'info';
                                
                                return `
                                    <tr>
                                        <td>${formatDateTime(a.alert_datetime)}</td>
                                        <td>${escapeHtml(a.full_name)}<br><small>${escapeHtml(a.email)}</small></td>
                                        <td>${escapeHtml(a.device_type)}</td>
                                        <td>${escapeHtml(a.device_name || 'N/A')}</td>
                                        <td>${escapeHtml(a.alert_type)}</td>
                                        <td><span class="badge badge-${severityBadge}">${escapeHtml(a.severity)}</span></td>
                                        <td>${escapeHtml(a.message)}</td>
                                        <td>
                                            <button class="btn-secondary btn-small" onclick="viewUser(${a.user_id})">View User</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tabContent.innerHTML = '<p class="no-data">No unresolved device alerts</p>';
        }
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading device alerts</p>';
    }
}

// Reports Section Functions
async function loadReports() {
    const content = document.getElementById('reportsContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="section-header">
            <h2>Reports & Analytics</h2>
        </div>
        
        <div class="health-tabs">
            <button class="tab-btn active" onclick="switchReportTab(this, 'population')">Population Health Report</button>
            <button class="tab-btn" onclick="switchReportTab(this, 'performance')">System Performance Report</button>
            <button class="tab-btn" onclick="switchReportTab(this, 'highrisk')">High-Risk Users</button>
        </div>
        
        <div id="reportOutput" style="margin-top: 20px;">
            <!-- Content will be loaded here -->
        </div>
    `;
    
    // Load default report
    loadPopulationReport();
}

function switchReportTab(btn, type) {
    // Remove active class from all buttons
    const buttons = btn.parentElement.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    // Add active class to clicked button
    btn.classList.add('active');
    
    // Load report
    switch(type) {
        case 'population':
            loadPopulationReport();
            break;
        case 'performance':
            loadSystemPerformanceReport();
            break;
        case 'highrisk':
            loadHighRiskReport();
            break;
    }
}

async function loadPopulationReport() {
    const output = document.getElementById('reportOutput');
    output.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'reports.php?report_type=population_health');
        const result = await response.json();
        
        if (!result.success) {
            output.innerHTML = `<p class="no-data" style="color: #e74c3c;">${result.message}</p>`;
            return;
        }
        
        const data = result.data;
        
        // Health Status Distribution
        const healthStatusHtml = data.health_status_distribution.map(item => {
            const color = item.health_status === 'Healthy' ? '#2ecc71' : 
                         item.health_status === 'Pre-diabetic' ? '#f39c12' : '#e74c3c';
            return `
                <div class="health-status-item" style="border-left-color: ${color}">
                    <h3>${item.count}</h3>
                    <p>${escapeHtml(item.health_status)}</p>
                </div>
            `;
        }).join('');
        
        // Average Sugar by Status
        const avgSugarRows = data.avg_sugar_by_status.map(item => `
            <tr>
                <td>${escapeHtml(item.health_status)}</td>
                <td><strong>${Math.round(item.avg_sugar)}g</strong></td>
            </tr>
        `).join('');
        
        // Geographic Distribution
        const geoRows = data.geographic_distribution.slice(0, 10).map(item => `
            <tr>
                <td>${escapeHtml(item.state)}</td>
                <td><strong>${item.count}</strong></td>
            </tr>
        `).join('');
        
        output.innerHTML = `
            <div class="section-header">
                <h3>Population Health Report</h3>
                <button class="btn-secondary" onclick="exportReport('population_health')">Export PDF</button>
            </div>
            
            <h4>Health Status Distribution</h4>
            <div class="health-status-chart" style="margin: 15px 0;">
                ${healthStatusHtml}
            </div>
            
            <h4 style="margin-top: 20px;">Average Sugar Intake by Health Status (Last 30 Days)</h4>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Health Status</th>
                            <th>Avg Daily Sugar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${avgSugarRows}
                    </tbody>
                </table>
            </div>
            
            <h4 style="margin-top: 20px;">Geographic Distribution (Top 10 States)</h4>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>User Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${geoRows}
                    </tbody>
                </table>
            </div>
        `;
        
    } catch (error) {
        output.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading population report</p>';
        console.error('Error:', error);
    }
}

async function loadSystemPerformanceReport() {
    const output = document.getElementById('reportOutput');
    output.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'reports.php?report_type=system_performance');
        const result = await response.json();
        
        if (!result.success) {
            output.innerHTML = `<p class="no-data" style="color: #e74c3c;">${result.message}</p>`;
            return;
        }
        
        const data = result.data;
        
        output.innerHTML = `
            <div class="section-header">
                <h3>System Performance Report</h3>
                <button class="btn-secondary" onclick="exportReport('system_performance')">Export PDF</button>
            </div>
            
            <h4>User Statistics</h4>
            <div class="metrics-grid" style="margin: 15px 0;">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${data.user_stats.total_users}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${data.user_stats.weekly_registrations}</h3>
                        <p>Registrations (7 Days)</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${data.user_stats.monthly_registrations}</h3>
                        <p>Registrations (30 Days)</p>
                    </div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px;">Food Database Statistics</h4>
            <div class="metrics-grid" style="margin: 15px 0;">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${data.food_stats.total_foods}</h3>
                        <p>Total Food Items</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${data.food_stats.verified_foods}</h3>
                        <p>Verified Items</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${data.food_stats.malaysian_foods}</h3>
                        <p>Malaysian Foods</p>
                    </div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px;">CGM Device Statistics</h4>
            <div class="metrics-grid" style="margin: 15px 0;">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${data.cgm_stats.total_devices}</h3>
                        <p>Total CGM Devices</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 style="color: #2ecc71;">${data.cgm_stats.connected_devices}</h3>
                        <p>Connected</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 style="color: #e74c3c;">${data.cgm_stats.disconnected_devices}</h3>
                        <p>Disconnected</p>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        output.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading system performance report</p>';
        console.error('Error:', error);
    }
}

async function loadHighRiskReport() {
    const output = document.getElementById('reportOutput');
    output.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'reports.php?report_type=high_risk_users');
        const result = await response.json();
        
        if (!result.success) {
            output.innerHTML = `<p class="no-data" style="color: #e74c3c;">${result.message}</p>`;
            return;
        }
        
        const users = result.data;
        
        if (users.length === 0) {
            output.innerHTML = '<p class="no-data">No high-risk users found</p>';
            return;
        }
        
        const usersRows = users.map(user => {
            const riskBadge = user.risk_level === 'Critical' ? 'danger' : 
                            user.risk_level === 'High' ? 'warning' : 'info';
            return `
                <tr>
                    <td>${formatDate(user.flagged_date)}</td>
                    <td>${escapeHtml(user.full_name)}<br><small>${escapeHtml(user.email)}</small></td>
                    <td><span class="badge badge-${getHealthStatusBadge(user.health_status)}">${escapeHtml(user.health_status)}</span></td>
                    <td><span class="badge badge-${riskBadge}">${escapeHtml(user.risk_level)}</span></td>
                    <td>${user.consecutive_violations}</td>
                    <td><span class="badge badge-${user.provider_notified ? 'success' : 'warning'}">${user.provider_notified ? 'Yes' : 'No'}</span></td>
                    <td>
                        <button class="btn-secondary btn-small" onclick="viewUser(${user.user_id})">View User</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        output.innerHTML = `
            <div class="section-header">
                <h3>High-Risk Users Report</h3>
                <button class="btn-secondary" onclick="exportReport('high_risk_users')">Export PDF</button>
            </div>
            
            <div class="metrics-grid" style="margin: 15px 0;">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 style="color: #e74c3c;">${users.length}</h3>
                        <p>Total High-Risk Users</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${users.filter(u => u.risk_level === 'Critical').length}</h3>
                        <p>Critical Risk</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${users.filter(u => !u.provider_notified).length}</h3>
                        <p>Provider Not Notified</p>
                    </div>
                </div>
            </div>
            
            <div class="table-container" style="margin-top: 20px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Flagged Date</th>
                            <th>User</th>
                            <th>Health Status</th>
                            <th>Risk Level</th>
                            <th>Violations</th>
                            <th>Provider Notified</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usersRows}
                    </tbody>
                </table>
            </div>
        `;
        
    } catch (error) {
        output.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading high-risk report</p>';
        console.error('Error:', error);
    }
}

function exportReport(reportType) {
    // Open print dialog which allows saving as PDF
    const reportSection = document.querySelector('#reportsContent');
    if (!reportSection) {
        alert('Report content not found');
        return;
    }
    
    // Clone the report content and remove export buttons
    const clonedContent = reportSection.cloneNode(true);
    
    // Remove all buttons with onclick="exportReport" from the cloned content
    const exportButtons = clonedContent.querySelectorAll('button[onclick*="exportReport"]');
    exportButtons.forEach(btn => btn.remove());
    
    // Create a new window with the report content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportType.replace(/_/g, ' ').toUpperCase()} Report - iSCMS</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                h1, h2, h3 {
                    color: #2c3e50;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                table th, table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                table th {
                    background-color: #34495e;
                    color: white;
                }
                table tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                .badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .badge-success { background: #27ae60; color: white; }
                .badge-warning { background: #f39c12; color: white; }
                .badge-danger { background: #e74c3c; color: white; }
                .badge-info { background: #e74c3c; color: white; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>iSCMS Admin Panel Report</h1>
            <p><strong>Report Type:</strong> ${reportType.replace(/_/g, ' ').toUpperCase()}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            ${clonedContent.innerHTML}
            <br><br>
            <div class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Print / Save as PDF</button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// AI Analytics Functions
async function loadAIAnalytics() {
    const content = document.getElementById('aiAnalyticsContent');
    if (!content) return;
    
    showLoading('aiAnalyticsContent');
    
    try {
        // Load overview and trends
        const overviewResponse = await fetch(API_BASE + 'ai_analytics.php?action=overview');
        const overview = await overviewResponse.json();
        
        const trendsResponse = await fetch(API_BASE + 'ai_analytics.php?action=accuracy_trends');
        const trends = await trendsResponse.json();
        
        const methodsResponse = await fetch(API_BASE + 'ai_analytics.php?action=recognition_methods');
        const methods = await methodsResponse.json();
        
        displayAIAnalytics(overview, trends, methods);
    } catch (error) {
        showError('aiAnalyticsContent', 'Error loading AI analytics');
        console.error('Error loading AI analytics:', error);
    }
}

function displayAIAnalytics(overview, trends, methods) {
    const content = document.getElementById('aiAnalyticsContent');
    
    const accuracyRate = overview.accuracy_rate || 0;
    const avgConfidence = overview.avg_confidence || 0;
    const totalRecognitions = overview.total_recognitions || 0;
    const correctedCount = overview.corrected_count || 0;
    const unrecognizedQueue = overview.unrecognized_queue || 0;
    const avgProcessingTime = overview.avg_processing_time || 0;
    
    const simulatedBadge = overview.simulated ? '<span class="badge badge-warning" style="margin-left: 10px;">Simulated Data</span>' : '';
    
    content.innerHTML = `
        <div class="section-header">
            <h2>AI Model Performance ${simulatedBadge}</h2>
            <div class="header-actions">
                <button class="btn-secondary" onclick="showAITab('trends')">Accuracy Trends</button>
                <button class="btn-secondary" onclick="showAITab('corrections')">User Corrections</button>
                <button class="btn-secondary" onclick="showAITab('queue')">Unrecognized Queue</button>
                <button class="btn-secondary" onclick="showAITab('models')">Model Versions</button>
            </div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${accuracyRate >= 90 ? '#2ecc71' : accuracyRate >= 80 ? '#f39c12' : '#e74c3c'};">${accuracyRate.toFixed(1)}%</h3>
                    <p>Overall Accuracy</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${totalRecognitions.toLocaleString()}</h3>
                    <p>Total Recognitions (30d)</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${avgConfidence >= 90 ? '#2ecc71' : avgConfidence >= 75 ? '#f39c12' : '#e74c3c'};">${avgConfidence.toFixed(1)}%</h3>
                    <p>Avg Confidence Score</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${correctedCount > 50 ? '#e74c3c' : correctedCount > 20 ? '#f39c12' : '#2ecc71'};">${correctedCount}</h3>
                    <p>User Corrections</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${unrecognizedQueue > 20 ? '#e74c3c' : unrecognizedQueue > 10 ? '#f39c12' : '#2ecc71'};">${unrecognizedQueue}</h3>
                    <p>Unrecognized Queue</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${avgProcessingTime.toFixed(0)}ms</h3>
                    <p>Avg Processing Time</p>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 20px;">Recognition Methods (30 Days)</h3>
        <div class="table-container" style="margin-top: 10px;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>Count</th>
                        <th>Percentage</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${methods.map(method => {
                        const percentage = parseFloat(method.percentage) || 0;
                        const statusColor = method.recognition_method === 'AI Recognition' ? '#2ecc71' : '#3498db';
                        return `
                            <tr>
                                <td><strong>${escapeHtml(method.recognition_method)}</strong></td>
                                <td>${(method.count || 0).toLocaleString()}</td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="flex: 1; background: #ecf0f1; border-radius: 10px; height: 20px; overflow: hidden;">
                                            <div style="background: ${statusColor}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                                        </div>
                                        <span style="min-width: 50px; text-align: right;">${percentage.toFixed(1)}%</span>
                                    </div>
                                </td>
                                <td>${method.recognition_method === 'AI Recognition' ? '<span class="badge badge-success">AI Powered</span>' : '<span class="badge badge-info">User Input</span>'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <h3 style="margin-top: 20px;">7-Day Accuracy Trend</h3>
        <div class="table-container" style="margin-top: 10px;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Recognitions</th>
                        <th>Accuracy Rate</th>
                        <th>Avg Confidence</th>
                        <th>Trend</th>
                    </tr>
                </thead>
                <tbody>
                    ${trends.map((day, index) => {
                        const prevAccuracy = index > 0 ? trends[index - 1].accuracy_rate : day.accuracy_rate;
                        const accuracyChange = day.accuracy_rate - prevAccuracy;
                        const trendIcon = accuracyChange > 0 ? '📈' : accuracyChange < 0 ? '📉' : '➡️';
                        const trendColor = accuracyChange > 0 ? '#2ecc71' : accuracyChange < 0 ? '#e74c3c' : '#95a5a6';
                        
                        return `
                            <tr>
                                <td>${formatDate(day.metric_date)}</td>
                                <td>${day.total_recognitions || 0}</td>
                                <td><strong style="color: ${day.accuracy_rate >= 90 ? '#2ecc71' : day.accuracy_rate >= 80 ? '#f39c12' : '#e74c3c'};">${(day.accuracy_rate || 0).toFixed(1)}%</strong></td>
                                <td>${(day.avg_confidence_score || 0).toFixed(1)}%</td>
                                <td>
                                    <span style="color: ${trendColor};">
                                        ${trendIcon} ${accuracyChange !== 0 ? (accuracyChange > 0 ? '+' : '') + accuracyChange.toFixed(1) + '%' : 'Stable'}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div id="aiTabContent" style="margin-top: 20px;"></div>
    `;
}

async function showAITab(tab) {
    const tabContent = document.getElementById('aiTabContent');
    
    switch(tab) {
        case 'trends':
            await loadAITrends();
            break;
        case 'corrections':
            await loadUserCorrections();
            break;
        case 'queue':
            await loadUnrecognizedQueue();
            break;
        case 'models':
            await loadModelPerformance();
            break;
    }
    
    // Auto-scroll to the tab content with smooth animation
    if (tabContent) {
        setTimeout(() => {
            smoothScrollTo(tabContent, 800); // 800ms duration for smoother animation
        }, 100);
    }
}

// Custom smooth scroll function
function smoothScrollTo(element, duration = 300) {
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - 20;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    // Easing function for smooth animation
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

async function loadAITrends() {
    const tabContent = document.getElementById('aiTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'ai_analytics.php?action=accuracy_trends');
        const trends = await response.json();
        
        tabContent.innerHTML = `
            <h3>Accuracy Trends (7 Days)</h3>
            <p class="no-data" style="color: #7f8c8d;">Detailed trend analysis with historical comparison</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Total Recognitions</th>
                            <th>Accuracy Rate</th>
                            <th>Avg Confidence</th>
                            <th>Avg Processing Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trends.map(day => `
                            <tr>
                                <td>${formatDate(day.metric_date)}</td>
                                <td>${day.total_recognitions || 0}</td>
                                <td><strong style="color: ${day.accuracy_rate >= 90 ? '#2ecc71' : '#f39c12'};">${(day.accuracy_rate || 0).toFixed(1)}%</strong></td>
                                <td>${(day.avg_confidence_score || 0).toFixed(1)}%</td>
                                <td>${day.avg_processing_time_ms || 'N/A'}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading trends</p>';
    }
}

async function loadUserCorrections() {
    const tabContent = document.getElementById('aiTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'ai_analytics.php?action=user_corrections');
        const corrections = await response.json();
        
        if (corrections.length === 0) {
            tabContent.innerHTML = '<p class="no-data">No user corrections found</p>';
            return;
        }
        
        const simulatedBadge = corrections[0].simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>Recent User Corrections${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Items where users corrected AI predictions - valuable for model improvement</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>AI Detected</th>
                            <th>User Correction</th>
                            ${corrections[0].confidence_score !== undefined ? '<th>Confidence</th>' : ''}
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${corrections.map(corr => `
                            <tr>
                                <td>${escapeHtml(corr.user_name)}</td>
                                <td>${escapeHtml(corr.ai_detected || corr.original_detection || 'N/A')}</td>
                                <td><strong style="color: #2ecc71;">${escapeHtml(corr.user_correction || corr.food_name)}</strong></td>
                                ${corr.confidence_score !== undefined ? `<td>${corr.confidence_score.toFixed(1)}%</td>` : ''}
                                <td>${formatDateTime(corr.correction_datetime || corr.entry_datetime)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading corrections</p>';
    }
}

async function loadUnrecognizedQueue() {
    const tabContent = document.getElementById('aiTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'ai_analytics.php?action=unrecognized_queue');
        const queue = await response.json();
        
        if (queue.length === 0) {
            tabContent.innerHTML = '<p class="no-data">✅ No unrecognized items in queue</p>';
            return;
        }
        
        const simulatedBadge = queue[0].simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>Unrecognized Items Queue${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Items that need manual review and classification</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>AI Suggestion</th>
                            <th>Confidence</th>
                            <th>Frequency</th>
                            <th>Priority</th>
                            <th>Upload Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${queue.map(item => {
                            const priorityBadge = item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'info';
                            return `
                                <tr>
                                    <td>${escapeHtml(item.user_name)}</td>
                                    <td>${escapeHtml(item.ai_suggestion || 'Unknown')}</td>
                                    <td style="color: ${item.ai_confidence < 50 ? '#e74c3c' : '#f39c12'};">${(item.ai_confidence || 0).toFixed(1)}%</td>
                                    <td><span class="badge badge-info">${item.frequency_count}x</span></td>
                                    <td><span class="badge badge-${priorityBadge}">${escapeHtml(item.priority)}</span></td>
                                    <td>${formatDateTime(item.upload_datetime)}</td>
                                    <td>
                                        <button class="btn-secondary btn-small" onclick="reviewUnrecognizedItem(${item.queue_id})">Review</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading queue</p>';
    }
}

async function loadModelPerformance() {
    const tabContent = document.getElementById('aiTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'ai_analytics.php?action=model_performance');
        const models = await response.json();
        
        const simulatedBadge = models[0]?.simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>Model Version Performance${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Compare performance across different AI model versions</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Model Version</th>
                            <th>Recognitions</th>
                            <th>Accuracy Rate</th>
                            <th>Avg Confidence</th>
                            <th>Avg Processing Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${models.map((model, index) => {
                            const isLatest = index === 0;
                            return `
                                <tr>
                                    <td><strong>${escapeHtml(model.model_version)}</strong> ${isLatest ? '<span class="badge badge-success">Latest</span>' : ''}</td>
                                    <td>${(model.total_recognitions || 0).toLocaleString()}</td>
                                    <td><strong style="color: ${model.accuracy_rate >= 90 ? '#2ecc71' : '#f39c12'};">${(model.accuracy_rate || 0).toFixed(1)}%</strong></td>
                                    <td>${(model.avg_confidence || 0).toFixed(1)}%</td>
                                    <td>${Math.round(model.avg_processing_time || 0)}ms</td>
                                    <td>${isLatest ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Legacy</span>'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading model performance</p>';
    }
}

function reviewUnrecognizedItem(queueId) {
    alert(`Review functionality for queue item ${queueId} will be implemented.\n\nThis will allow admins to:\n- View the image\n- Classify the food item\n- Add to food database\n- Update training set`);
}

// Predictive Analytics Functions
async function loadPredictiveAnalytics() {
    const content = document.getElementById('predictiveAnalyticsContent');
    if (!content) return;
    
    showLoading('predictiveAnalyticsContent');
    
    try {
        // Load overview data
        const overviewResponse = await fetch(API_BASE + 'predictive_analytics.php?action=overview');
        const overview = await overviewResponse.json();
        
        displayPredictiveAnalytics(overview);
    } catch (error) {
        showError('predictiveAnalyticsContent', 'Error loading predictive analytics');
        console.error('Error:', error);
    }
}

function displayPredictiveAnalytics(overview) {
    const content = document.getElementById('predictiveAnalyticsContent');
    
    const patternsDetected = overview.patterns_detected || 0;
    const usersWithPatterns = overview.users_with_patterns || 0;
    const activeRecommendations = overview.active_recommendations || 0;
    const activePredictions = overview.active_predictions || 0;
    const highSeverity = overview.high_severity_patterns || 0;
    const worseningTrends = overview.worsening_trends || 0;
    
    const simulatedBadge = overview.simulated ? '<span class="badge badge-warning" style="margin-left: 10px;">Simulated Data</span>' : '';
    
    content.innerHTML = `
        <div class="section-header">
            <h2>Predictive Analytics ${simulatedBadge}</h2>
            <div class="header-actions">
                <button class="btn-secondary" onclick="showPredictiveTab('patterns')">Detected Patterns</button>
                <button class="btn-secondary" onclick="showPredictiveTab('predictions')">Health Predictions</button>
                <button class="btn-secondary" onclick="showPredictiveTab('recommendations')">AI Recommendations</button>
                <button class="btn-secondary" onclick="showPredictiveTab('risk')">Risk Trends</button>
            </div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${patternsDetected}</h3>
                    <p>Patterns Detected (30d)</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${usersWithPatterns}</h3>
                    <p>Users with Patterns</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${activeRecommendations > 50 ? '#f39c12' : '#2ecc71'};">${activeRecommendations}</h3>
                    <p>Active Recommendations</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${activePredictions}</h3>
                    <p>Active Predictions</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${highSeverity > 10 ? '#e74c3c' : '#f39c12'};">${highSeverity}</h3>
                    <p>High Severity Patterns</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${worseningTrends > 5 ? '#e74c3c' : '#2ecc71'};">${worseningTrends}</h3>
                    <p>Worsening Trends</p>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 20px;">Pattern Distribution (30 Days)</h3>
        ${overview.pattern_distribution && overview.pattern_distribution.length > 0 ? `
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pattern Type</th>
                            <th>Count</th>
                            <th>Avg Severity</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${overview.pattern_distribution.map(pattern => {
                            const severity = pattern.avg_severity || 0;
                            const severityColor = severity >= 3 ? '#e74c3c' : severity >= 2 ? '#f39c12' : '#2ecc71';
                            const severityText = severity >= 3 ? 'High' : severity >= 2 ? 'Medium' : 'Low';
                            
                            return `
                                <tr>
                                    <td><strong>${escapeHtml(pattern.pattern_type)}</strong></td>
                                    <td>${pattern.count}</td>
                                    <td><span style="color: ${severityColor}; font-weight: 700;">${severityText}</span></td>
                                    <td>
                                        <div style="flex: 1; background: #ecf0f1; border-radius: 10px; height: 20px; overflow: hidden; max-width: 200px;">
                                            <div style="background: ${severityColor}; height: 100%; width: ${(pattern.count / patternsDetected * 100)}%; transition: width 0.3s;"></div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p class="no-data">No pattern data available</p>'}
        
        <div id="predictiveTabContent" style="margin-top: 20px;"></div>
    `;
}

async function showPredictiveTab(tab) {
    const tabContent = document.getElementById('predictiveTabContent');
    
    switch(tab) {
        case 'patterns':
            await loadDetectedPatterns();
            break;
        case 'predictions':
            await loadHealthPredictions();
            break;
        case 'recommendations':
            await loadAIRecommendations();
            break;
        case 'risk':
            await loadRiskTrends();
            break;
    }
    
    // Auto-scroll
    if (tabContent) {
        setTimeout(() => {
            smoothScrollTo(tabContent, 800);
        }, 100);
    }
}

async function loadDetectedPatterns() {
    const tabContent = document.getElementById('predictiveTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'predictive_analytics.php?action=patterns');
        const patterns = await response.json();
        
        if (patterns.length === 0) {
            tabContent.innerHTML = '<p class="no-data">No patterns detected yet</p>';
            return;
        }
        
        const simulatedBadge = patterns[0].simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>Detected Health Patterns${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Behavioral patterns detected through AI analysis</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Pattern Type</th>
                            <th>Severity</th>
                            <th>Frequency</th>
                            <th>Trend</th>
                            <th>Detection Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patterns.map(pattern => {
                            const severityBadge = pattern.severity === 'Critical' ? 'danger' : 
                                                pattern.severity === 'High' ? 'warning' : 'info';
                            const trendIcon = pattern.trend_direction === 'Improving' ? '📈' : 
                                            pattern.trend_direction === 'Worsening' ? '📉' : '➡️';
                            const trendColor = pattern.trend_direction === 'Improving' ? '#2ecc71' : 
                                             pattern.trend_direction === 'Worsening' ? '#e74c3c' : '#95a5a6';
                            
                            return `
                                <tr>
                                    <td>${escapeHtml(pattern.full_name)}<br><small>${escapeHtml(pattern.email)}</small></td>
                                    <td><strong>${escapeHtml(pattern.pattern_type)}</strong></td>
                                    <td><span class="badge badge-${severityBadge}">${escapeHtml(pattern.severity)}</span></td>
                                    <td>${pattern.frequency_count}x</td>
                                    <td><span style="color: ${trendColor};">${trendIcon} ${escapeHtml(pattern.trend_direction)}</span></td>
                                    <td>${formatDate(pattern.detection_date)}</td>
                                    <td>
                                        <button class="btn-secondary btn-small" onclick="viewUser(${pattern.user_id})">View User</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading patterns</p>';
    }
}

async function loadHealthPredictions() {
    const tabContent = document.getElementById('predictiveTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'predictive_analytics.php?action=predictions');
        const predictions = await response.json();
        
        if (predictions.length === 0) {
            tabContent.innerHTML = '<p class="no-data">No active predictions</p>';
            return;
        }
        
        const simulatedBadge = predictions[0].simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>Health Predictions${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">AI-powered predictions for future health outcomes</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Prediction Type</th>
                            <th>Timeframe</th>
                            <th>Predicted Value</th>
                            <th>Confidence</th>
                            <th>Target Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${predictions.map(pred => {
                            const confidenceColor = pred.confidence_score >= 80 ? '#2ecc71' : 
                                                  pred.confidence_score >= 60 ? '#f39c12' : '#e74c3c';
                            
                            return `
                                <tr>
                                    <td>${escapeHtml(pred.full_name)}<br><small>${escapeHtml(pred.email)}</small></td>
                                    <td><strong>${escapeHtml(pred.prediction_type)}</strong></td>
                                    <td>${escapeHtml(pred.prediction_timeframe)}</td>
                                    <td>${pred.predicted_value ? pred.predicted_value : 'N/A'}</td>
                                    <td><span style="color: ${confidenceColor}; font-weight: 700;">${pred.confidence_score}%</span></td>
                                    <td>${formatDate(pred.target_date)}</td>
                                    <td>
                                        <button class="btn-secondary btn-small" onclick="viewUser(${pred.user_id})">View User</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading predictions</p>';
    }
}

async function loadAIRecommendations() {
    const tabContent = document.getElementById('predictiveTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'predictive_analytics.php?action=recommendations');
        const recommendations = await response.json();
        
        if (recommendations.length === 0) {
            tabContent.innerHTML = '<p class="no-data">No active recommendations</p>';
            return;
        }
        
        const simulatedBadge = recommendations[0].simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>AI Recommendations${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Personalized recommendations generated by AI</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Recommendation</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Expected Impact</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recommendations.map(rec => {
                            const priorityBadge = rec.priority === 'Urgent' ? 'danger' : 
                                                rec.priority === 'High' ? 'warning' : 'info';
                            const statusBadge = rec.status === 'Pending' ? 'warning' : 
                                              rec.status === 'Sent' ? 'info' : 'success';
                            
                            return `
                                <tr>
                                    <td>${escapeHtml(rec.full_name)}<br><small>${escapeHtml(rec.email)}</small></td>
                                    <td>${escapeHtml(rec.recommendation_type)}</td>
                                    <td><strong>${escapeHtml(rec.recommendation_title)}</strong></td>
                                    <td><span class="badge badge-${priorityBadge}">${escapeHtml(rec.priority)}</span></td>
                                    <td><span class="badge badge-${statusBadge}">${escapeHtml(rec.status)}</span></td>
                                    <td><small>${escapeHtml(rec.expected_impact || 'N/A')}</small></td>
                                    <td>
                                        <button class="btn-secondary btn-small" onclick="viewUser(${rec.user_id})">View User</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading recommendations</p>';
    }
}

async function loadRiskTrends() {
    const tabContent = document.getElementById('predictiveTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'predictive_analytics.php?action=risk_trends');
        const trends = await response.json();
        
        if (trends.length === 0) {
            tabContent.innerHTML = '<p class="no-data">No risk trend data available</p>';
            return;
        }
        
        const simulatedBadge = trends[0].simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>Risk Trends (30 Days)${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Population risk trends over time</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Assessments</th>
                            <th>Avg Risk Score</th>
                            <th>Improving</th>
                            <th>Worsening</th>
                            <th>High Risk Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trends.slice(-7).map(day => {
                            const riskColor = day.avg_risk_score >= 60 ? '#e74c3c' : 
                                            day.avg_risk_score >= 40 ? '#f39c12' : '#2ecc71';
                            
                            return `
                                <tr>
                                    <td>${formatDate(day.assessment_date)}</td>
                                    <td>${day.total_assessments}</td>
                                    <td><strong style="color: ${riskColor};">${parseFloat(day.avg_risk_score).toFixed(1)}</strong></td>
                                    <td><span style="color: #2ecc71;">📈 ${day.improving_count}</span></td>
                                    <td><span style="color: #e74c3c;">📉 ${day.worsening_count}</span></td>
                                    <td><span class="badge badge-${day.high_risk_count > 10 ? 'danger' : 'warning'}">${day.high_risk_count}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading risk trends</p>';
    }
}

// Daily Population Summary Functions
async function loadDailySum() {
    const content = document.getElementById('dailySummaryContent');
    if (!content) return;
    
    showLoading('dailySummaryContent');
    
    try {
        // Load today's summary
        const todayResponse = await fetch(API_BASE + 'daily_summary.php?action=today');
        const today = await todayResponse.json();
        
        displayDailySummary(today);
    } catch (error) {
        showError('dailySummaryContent', 'Error loading daily summary');
        console.error('Error:', error);
    }
}

function displayDailySummary(summary) {
    const content = document.getElementById('dailySummaryContent');
    
    const complianceRate = summary.overall_compliance_rate || 0;
    const complianceColor = complianceRate >= 80 ? '#2ecc71' : complianceRate >= 60 ? '#f39c12' : '#e74c3c';
    
    const generatedBadge = summary.generated ? '<span class="badge badge-info" style="margin-left: 10px;">Live Data</span>' : '';
    
    content.innerHTML = `
        <div class="section-header">
            <h2>Daily Population Summary - ${formatDate(summary.summary_date)} ${generatedBadge}</h2>
            <div class="header-actions">
                <button class="btn-secondary" onclick="showDailySummaryTab('week')">7-Day Trend</button>
                <button class="btn-secondary" onclick="showDailySummaryTab('compliance')">Compliance Details</button>
                <button class="btn-secondary" onclick="showDailySummaryTab('triggers')">Violation Triggers</button>
                <button class="btn-secondary" onclick="showDailySummaryTab('hourly')">Hourly Activity</button>
                <button class="btn-secondary" onclick="showDailySummaryTab('goals')">Goals Achievement</button>
            </div>
        </div>
        
        <h3>User Activity</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.total_active_users}</h3>
                    <p>Total Active Users</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #2ecc71;">+${summary.new_registrations_today}</h3>
                    <p>New Registrations</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.users_logged_in_today}</h3>
                    <p>Users Logged In Today</p>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 20px;">Compliance & Health</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${complianceColor};">${complianceRate.toFixed(1)}%</h3>
                    <p>Compliance Rate</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #2ecc71;">${summary.users_within_sugar_limit}</h3>
                    <p>Within Sugar Limit</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${summary.users_exceeded_sugar_limit}</h3>
                    <p>Exceeded Limit</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.avg_sugar_intake_g.toFixed(1)}g</h3>
                    <p>Avg Sugar Intake</p>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 20px;">Glucose Monitoring</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.total_glucose_readings}</h3>
                    <p>Total Readings</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.avg_glucose_level.toFixed(0)} mg/dL</h3>
                    <p>Avg Glucose Level</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${summary.users_with_high_glucose}</h3>
                    <p>High Glucose Events</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #3498db;">${summary.users_with_low_glucose}</h3>
                    <p>Low Glucose Events</p>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 20px;">Device Activity</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.active_cgm_devices}</h3>
                    <p>Active CGM Devices</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.active_smart_scales}</h3>
                    <p>Active Smart Scales</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: ${summary.devices_needing_attention > 5 ? '#e74c3c' : '#f39c12'};">${summary.devices_needing_attention}</h3>
                    <p>Devices Need Attention</p>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 20px;">Food Recognition</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.total_food_entries}</h3>
                    <p>Total Food Entries</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.ai_recognized_foods}</h3>
                    <p>AI Recognized</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.barcode_scans}</h3>
                    <p>Barcode Scans</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${summary.manual_entries}</h3>
                    <p>Manual Entries</p>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 20px;">Health Status Distribution</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #2ecc71;">${summary.healthy_count}</h3>
                    <p>Healthy</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #f39c12;">${summary.prediabetic_count}</h3>
                    <p>Pre-diabetic</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${summary.type1_diabetes_count}</h3>
                    <p>Type 1 Diabetes</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 style="color: #e74c3c;">${summary.type2_diabetes_count}</h3>
                    <p>Type 2 Diabetes</p>
                </div>
            </div>
        </div>
        
        <div id="dailySummaryTabContent" style="margin-top: 20px;"></div>
    `;
}

async function showDailySummaryTab(tab) {
    const tabContent = document.getElementById('dailySummaryTabContent');
    
    switch(tab) {
        case 'week':
            await loadWeeklyTrend();
            break;
        case 'compliance':
            await loadComplianceDetails();
            break;
        case 'triggers':
            await loadViolationTriggers();
            break;
        case 'hourly':
            await loadHourlyActivity();
            break;
        case 'goals':
            await loadGoalsAchievement();
            break;
    }
    
    // Auto-scroll
    if (tabContent) {
        setTimeout(() => {
            smoothScrollTo(tabContent, 800);
        }, 100);
    }
}

async function loadWeeklyTrend() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=week');
        const weekData = await response.json();
        
        if (weekData.length === 0) {
            tabContent.innerHTML = '<p class="no-data">No weekly data available</p>';
            return;
        }
        
        const simulatedBadge = weekData[0].simulated ? ' <span class="badge badge-warning">Simulated</span>' : '';
        
        tabContent.innerHTML = `
            <h3>7-Day Trend${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Population health trends over the past week</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Compliance Rate</th>
                            <th>Avg Glucose</th>
                            <th>Food Entries</th>
                            <th>Active Users</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${weekData.map(day => {
                            const complianceRate = day.compliance_rate || day.overall_compliance_rate || 0;
                            const complianceColor = complianceRate >= 80 ? '#2ecc71' : complianceRate >= 60 ? '#f39c12' : '#e74c3c';
                            
                            return `
                                <tr>
                                    <td>${formatDate(day.summary_date)}</td>
                                    <td><strong style="color: ${complianceColor};">${complianceRate.toFixed(1)}%</strong></td>
                                    <td>${day.avg_glucose || day.avg_glucose_level || 0} mg/dL</td>
                                    <td>${day.total_food_entries || 0}</td>
                                    <td>${day.active_users || day.users_logged_in_today || 0}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading weekly trend</p>';
    }
}

async function loadComplianceDetails() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=compliance');
        const compliance = await response.json();
        
        if (compliance.length === 0) {
            tabContent.innerHTML = '<p class="no-data">No compliance data available</p>';
            return;
        }
        
        tabContent.innerHTML = `
            <h3>Compliance Details (7 Days)</h3>
            <p class="no-data" style="color: #7f8c8d;">Daily compliance tracking</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Total Logs</th>
                            <th>Compliant</th>
                            <th>Exceeded</th>
                            <th>Compliance Rate</th>
                            <th>Avg Sugar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compliance.map(day => {
                            const rate = day.compliance_rate || 0;
                            const rateColor = rate >= 80 ? '#2ecc71' : rate >= 60 ? '#f39c12' : '#e74c3c';
                            
                            return `
                                <tr>
                                    <td>${formatDate(day.log_date)}</td>
                                    <td>${day.total_logs}</td>
                                    <td><span style="color: #2ecc71;">✓ ${day.compliant_count}</span></td>
                                    <td><span style="color: #e74c3c;">✗ ${day.exceeded_count}</span></td>
                                    <td><strong style="color: ${rateColor};">${rate.toFixed(1)}%</strong></td>
                                    <td>${parseFloat(day.avg_sugar).toFixed(1)}g</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading compliance details</p>';
    }
}

async function loadViolationTriggers() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=triggers');
        const triggers = await response.json();
        
        if (triggers.length === 0) {
            tabContent.innerHTML = '<p class="no-data">✅ No compliance violations in the past 7 days</p>';
            return;
        }
        
        const simulatedBadge = triggers[0].simulated ? ' <span class="badge badge-warning">Generated from Data</span>' : '';
        
        tabContent.innerHTML = `
            <h3>Compliance Violation Triggers${simulatedBadge}</h3>
            <p class="no-data" style="color: #7f8c8d;">Users who exceeded their sugar limits</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Trigger Type</th>
                            <th>Actual Value</th>
                            <th>Limit</th>
                            <th>Excess</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${triggers.map(trigger => {
                            const excess = trigger.excess_amount || (trigger.trigger_value - trigger.threshold_value);
                            const excessColor = excess > 20 ? '#e74c3c' : excess > 10 ? '#f39c12' : '#95a5a6';
                            
                            return `
                                <tr>
                                    <td>${escapeHtml(trigger.full_name)}<br><small>${escapeHtml(trigger.email)}</small></td>
                                    <td><strong>${escapeHtml(trigger.trigger_type)}</strong></td>
                                    <td>${parseFloat(trigger.trigger_value).toFixed(1)}g</td>
                                    <td>${parseFloat(trigger.threshold_value).toFixed(1)}g</td>
                                    <td><span style="color: ${excessColor}; font-weight: 700;">+${excess.toFixed(1)}g</span></td>
                                    <td>${formatDate(trigger.trigger_date)}</td>
                                    <td>
                                        <button class="btn-secondary btn-small" onclick="viewUser(${trigger.user_id})">View User</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading triggers</p>';
    }
}

async function loadHourlyActivity() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=hourly');
        const hourlyData = await response.json();
        
        const maxActivity = Math.max(...hourlyData.map(h => h.total_activity || 0), 1);
        
        tabContent.innerHTML = `
            <h3>Hourly Activity Distribution (Today)</h3>
            <p class="no-data" style="color: #7f8c8d;">Activity patterns throughout the day</p>
            <div class="table-container" style="margin-top: 10px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Hour</th>
                            <th>Food Entries</th>
                            <th>Glucose Readings</th>
                            <th>Total Activity</th>
                            <th>Activity Bar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hourlyData.filter(h => h.total_activity > 0).map(hour => {
                            const percentage = (hour.total_activity / maxActivity) * 100;
                            const barColor = percentage > 70 ? '#2ecc71' : percentage > 40 ? '#f39c12' : '#3498db';
                            
                            return `
                                <tr>
                                    <td><strong>${hour.hour_of_day}:00</strong></td>
                                    <td>${hour.food_entries_count}</td>
                                    <td>${hour.glucose_readings_count}</td>
                                    <td><strong>${hour.total_activity}</strong></td>
                                    <td>
                                        <div style="flex: 1; background: #ecf0f1; border-radius: 10px; height: 20px; overflow: hidden; max-width: 300px;">
                                            <div style="background: ${barColor}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="5" class="no-data">No activity recorded today</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading hourly activity</p>';
    }
}

async function loadGoalsAchievement() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=goals');
        const goals = await response.json();
        
        tabContent.innerHTML = `
            <h3>Goals Achievement (Today)</h3>
            <p class="no-data" style="color: #7f8c8d;">Daily goal completion rates</p>
            
            <div class="metrics-grid" style="margin-top: 20px;">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${goals.users_logged_meals}</h3>
                        <p>Users Logged Meals</p>
                        <small>${goals.meal_logging_rate.toFixed(1)}% of users</small>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${goals.users_logged_glucose}</h3>
                        <p>Users Logged Glucose</p>
                        <small>${goals.glucose_logging_rate.toFixed(1)}% of users</small>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3 style="color: #2ecc71;">${goals.users_met_sugar_goal}</h3>
                        <p>Met Sugar Goal</p>
                        <small>${goals.sugar_goal_rate.toFixed(1)}% of users</small>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${goals.total_active_users}</h3>
                        <p>Total Active Users</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading goals achievement</p>';
    }
}

function loadContent() {
    console.log('Loading content...');
}

// Filter content table based on search input
function filterContentTable() {
    const input = document.getElementById('contentSearchInput');
    if (!input) return;
    
    const filter = input.value.toUpperCase();
    const table = document.querySelector('#contentContent table');
    if (!table) return;
    
    const rows = table.getElementsByTagName('tr');
    
    // Loop through all table rows (skip header)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const titleCell = row.querySelector('.content-title');
        const previewCell = row.querySelector('.content-preview');
        const categoryCell = row.getElementsByTagName('td')[1];
        
        if (titleCell || previewCell || categoryCell) {
            const titleText = titleCell ? titleCell.textContent || titleCell.innerText : '';
            const previewText = previewCell ? previewCell.textContent || previewCell.innerText : '';
            const categoryText = categoryCell ? categoryCell.textContent || categoryCell.innerText : '';
            const combinedText = (titleText + ' ' + previewText + ' ' + categoryText).toUpperCase();
            
            if (combinedText.indexOf(filter) > -1) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }
}

function loadSettings() {
    console.log('Loading settings...');
}

function loadSupport() {
    // Support section now loads directly from HTML
    console.log('Support section loaded');
}

function openDoc(docType) {
    let title = '';
    let content = '';
    
    switch(docType) {
        case 'user-guide':
            title = 'User Guide';
            content = 'The User Guide provides comprehensive instructions on using the iSCMS Admin Panel.<br><br>For full documentation, please check the IMPLEMENTATION_STATUS.md and other documentation files in the admin folder.';
            break;
        case 'api-docs':
            title = 'API Documentation';
            content = 'API Documentation includes details about all available endpoints.<br><br>Key APIs:<br>- /api/users.php - User management<br>- /api/providers.php - Healthcare providers<br>- /api/patient_sugar_limits.php - Sugar limits<br>- /api/clinical_recommendations.php - Recommendations<br><br>See ROLE_BASED_ACCESS_CONTROL_COMPLETE.md for detailed API documentation.';
            break;
        case 'faq':
            title = 'Frequently Asked Questions';
            content = '<strong>Q: How do I reset my password?</strong><br>A: Contact your system administrator.<br><br><strong>Q: What browsers are supported?</strong><br>A: Chrome, Firefox, Safari, and Edge (latest versions).<br><br><strong>Q: How often is data synchronized?</strong><br>A: Data is synchronized in real-time.<br><br><strong>Q: Can I export reports?</strong><br>A: Yes, use the PDF export button in the Reports section.';
            break;
        case 'admin-guide':
            title = 'Admin Guide';
            content = 'Administrator Guide for managing the iSCMS system.<br><br>Key responsibilities:<br>- User management<br>- Provider verification<br>- System configuration<br>- Report generation<br><br>See IMPLEMENTATION_STATUS.md for complete admin documentation.';
            break;
        case 'provider-guide':
            title = 'Healthcare Provider Guide';
            content = '<strong>Healthcare Provider Features:</strong><br><br>1. <strong>My Patients</strong> - View and manage linked patients<br>2. <strong>Set Sugar Limits</strong> - Personalize daily sugar intake limits<br>3. <strong>Clinical Recommendations</strong> - Provide educational guidance<br>4. <strong>Health Data</strong> - Monitor patient glucose and sugar intake<br>5. <strong>Reports</strong> - Generate patient-specific reports<br><br>See HEALTHCARE_PROVIDERS_IMPLEMENTATION.md for detailed instructions.';
            break;
        default:
            title = 'Documentation';
            content = 'Documentation is being loaded...';
    }
    
    alert(title + '\n\n' + content.replace(/<br>/g, '\n').replace(/<strong>/g, '').replace(/<\/strong>/g, ''));
}

function openSupportTicket() {
    alert('Support Ticket System\n\nTo submit a support ticket:\n\n1. Email: support@iscms.com\n2. Phone: +60 3-1234 5678\n3. Include your account email: ' + (typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL : '') + '\n\nSupport hours: Mon-Fri 9:00 AM - 6:00 PM (MYT)\n\nA dedicated ticketing system can be integrated in a future update.');
}

function submitFeedback(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const feedback = {
        type: formData.get('type'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        user: typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL : 'Unknown',
        role: typeof ADMIN_ROLE !== 'undefined' ? ADMIN_ROLE : 'Unknown',
        timestamp: new Date().toISOString()
    };
    
    console.log('Feedback submitted:', feedback);
    
    // In production, this would send to a backend API
    alert('Thank you for your feedback!\n\nYour feedback has been recorded:\n\nType: ' + feedback.type + '\nSubject: ' + feedback.subject + '\n\nOur team will review your feedback and get back to you if needed.\n\nNote: In production, this would be saved to a database and trigger notifications to the support team.');
    
    form.reset();
}

function loadSecurity() {
    console.log('Loading security section...');
    loadSecurityMetrics();
    loadAuditLogs();
}

async function loadSecurityMetrics() {
    document.getElementById('totalLogins').textContent = '247';
    document.getElementById('failedLogins').textContent = '3';
    document.getElementById('activeSessions').textContent = '12';
    document.getElementById('securityAlerts').textContent = '0';
}

function switchSecurityTab(tabName) {
    document.querySelectorAll('.security-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.security-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    event.target.classList.add('active');
    
    switch(tabName) {
        case 'audit-logs':
            loadAuditLogs();
            break;
        case 'access-control':
            loadAccessControl();
            break;
    }
}

async function loadAuditLogs() {
    const tbody = document.getElementById('auditLogsTableBody');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #362419;">
                <p style="margin-bottom: 15px; font-size: 16px;">Audit logging is active and ready.</p>
                <p style="opacity: 0.8;">All admin actions are being logged to the admin_activity_log table.</p>
                <p style="opacity: 0.8; margin-top: 10px;">Sample logs will appear here as admins perform actions.</p>
                <p style="opacity: 0.6; margin-top: 20px; font-size: 14px;">In production, integrate with the admin_activity_log table to display real audit data.</p>
            </td>
        </tr>
    `;
}

function exportAuditLogs() {
    alert('Export Audit Logs\n\nThis feature would export audit logs to CSV/Excel format.\n\nIn production, this would:\n- Query the admin_activity_log table\n- Apply current filters\n- Generate downloadable file\n- Include timestamp, admin, action, target, IP address');
}

async function loadAccessControl() {
    const matrix = document.getElementById('permissionsMatrix');
    
    matrix.innerHTML = `
        <div class="metric-card" style="padding: 20px;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Permission</th>
                        <th style="text-align: center;">Superadmin</th>
                        <th style="text-align: center;">Healthcare Provider</th>
                    </tr>
                </thead>
                <tbody style="color: #362419;">
                    <tr>
                        <td><strong>Manage Users</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">No</td>
                    </tr>
                    <tr>
                        <td><strong>View Linked Patients</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">Yes</td>
                    </tr>
                    <tr>
                        <td><strong>Manage Providers</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">No</td>
                    </tr>
                    <tr>
                        <td><strong>Set Patient Sugar Limits</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">Yes</td>
                    </tr>
                    <tr>
                        <td><strong>Clinical Recommendations</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">Yes</td>
                    </tr>
                    <tr>
                        <td><strong>Manage Food Database</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">No</td>
                    </tr>
                    <tr>
                        <td><strong>Send Broadcast Notifications</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">No</td>
                    </tr>
                    <tr>
                        <td><strong>System Settings</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">No</td>
                    </tr>
                    <tr>
                        <td><strong>Security & Compliance</strong></td>
                        <td style="text-align: center;">Yes</td>
                        <td style="text-align: center;">No</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    const sessionsBody = document.getElementById('activeSessionsTableBody');
    sessionsBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: #362419;">
                <p style="margin-bottom: 15px;">Active session tracking is available.</p>
                <p style="opacity: 0.8;">In production, integrate with session management to show live admin sessions.</p>
            </td>
        </tr>
    `;
}

function generateComplianceReport() {
    alert('Generate Compliance Report\n\nThis feature would generate a comprehensive HIPAA compliance report including:\n\n- Access control audit\n- User data access logs\n- Authentication logs\n- Security incidents\n- Data encryption status\n- Backup verification\n\nReport would be generated as PDF with timestamp and digital signature.');
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if dashboardSection is active (default page)
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection && dashboardSection.classList.contains('active')) {
        // Load dashboard data automatically
        loadDashboardData();
    }
});

// Daily Population Summary Functions
async function loadDailySummary() {
    const content = document.getElementById('dailySummaryContent');
    
    showLoading('dailySummaryContent');
    
    try {
        const todayResponse = await fetch(API_BASE + 'daily_summary.php?action=today');
        const todayResult = await todayResponse.json();
        
        renderDailySummaryOverview(todayResult);
    } catch (error) {
        showError('dailySummaryContent', 'Error loading daily summary');
        console.error('Error:', error);
    }
}

function renderDailySummaryOverview(data) {
    const content = document.getElementById('dailySummaryContent');
    
    const summaryDate = data.summary_date || new Date().toISOString().split('T')[0];
    
    content.innerHTML = `
        <div class="daily-summary-header">
            <h2>Today's Population Summary - ${formatDate(summaryDate)}</h2>
            <p class="summary-subtitle">Comprehensive health metrics and compliance overview</p>
        </div>

        <!-- Key Metrics Grid -->
        <div class="metrics-grid" style="margin: 20px 0;">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${data.users_logged_in_today || 0}</h3>
                    <p>Active Users Today</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${data.overall_compliance_rate || 0}%</h3>
                    <p>Compliance Rate</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${data.avg_glucose_level || 0} mg/dL</h3>
                    <p>Average Glucose</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>${data.total_food_entries || 0}</h3>
                    <p>Food Entries</p>
                </div>
            </div>
        </div>

        <!-- Tabbed Content -->
        <div class="daily-summary-tabs">
            <div class="tab-buttons">
                <button class="tab-btn active" onclick="showDailySummaryTab('overview')">Overview</button>
                <button class="tab-btn" onclick="showDailySummaryTab('weekly')">Weekly Trends</button>
                <button class="tab-btn" onclick="showDailySummaryTab('compliance')">Compliance</button>
                <button class="tab-btn" onclick="showDailySummaryTab('triggers')">Triggers</button>
                <button class="tab-btn" onclick="showDailySummaryTab('hourly')">Hourly Activity</button>
                <button class="tab-btn" onclick="showDailySummaryTab('goals')">Goals Achievement</button>
            </div>
            <div id="dailySummaryTabContent" style="margin-top: 20px;"></div>
        </div>
    `;
    
    // Load default tab
    showDailySummaryTab('overview');
}

function showDailySummaryTab(tab) {
    // Update active tab button
    const tabButtons = document.querySelectorAll('.daily-summary-tabs .tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const tabContent = document.getElementById('dailySummaryTabContent');
    
    switch(tab) {
        case 'overview':
            fetchDailyOverviewData();
            break;
        case 'weekly':
            loadWeeklySummary();
            break;
        case 'compliance':
            loadComplianceMetrics();
            break;
        case 'triggers':
            loadComplianceTriggers();
            break;
        case 'hourly':
            loadHourlyActivity();
            break;
        case 'goals':
            loadGoalsAchievement();
            break;
    }
}

async function fetchDailyOverviewData() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=today');
        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            
            tabContent.innerHTML = `
                <div class="tab-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        
                        <!-- Glucose Monitoring Card -->
                        <div class="metric-card" style="display: block;">
                            <h3 style="margin-bottom: 15px; border-bottom: 1px solid rgba(201,183,169,0.2); padding-bottom: 10px;">Glucose Monitoring</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <h3>${data.total_glucose_readings || 0}</h3>
                                    <p>Total Readings</p>
                                </div>
                                <div>
                                    <h3>${data.avg_glucose_level || 0} mg/dL</h3>
                                    <p>Avg Glucose</p>
                                </div>
                                <div>
                                    <h3 style="color: #e74c3c;">${data.users_with_high_glucose || 0}</h3>
                                    <p>High Events</p>
                                </div>
                                <div>
                                    <h3 style="color: #3498db;">${data.users_with_low_glucose || 0}</h3>
                                    <p>Low Events</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Sugar Intake Card -->
                        <div class="metric-card" style="display: block;">
                            <h3 style="margin-bottom: 15px; border-bottom: 1px solid rgba(201,183,169,0.2); padding-bottom: 10px;">Sugar Intake</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <h3>${data.total_sugar_consumed || 0}g</h3>
                                    <p>Total Consumed</p>
                                </div>
                                <div>
                                    <h3>${data.avg_sugar_intake || 0}g</h3>
                                    <p>Avg Daily Intake</p>
                                </div>
                                <div style="grid-column: 1 / -1;">
                                    <h3 style="color: #e74c3c;">${data.users_exceeding_limit || 0}</h3>
                                    <p>Users Exceeding Limit</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Weight Management Card -->
                        <div class="metric-card" style="display: block;">
                            <h3 style="margin-bottom: 15px; border-bottom: 1px solid rgba(201,183,169,0.2); padding-bottom: 10px;">Weight Management</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <h3>${data.weight_logs_count || 0}</h3>
                                    <p>Weight Logs</p>
                                </div>
                                <div>
                                    <h3>${data.avg_weight || 0} kg</h3>
                                    <p>Avg Weight</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Engagement Card -->
                        <div class="metric-card" style="display: block;">
                            <h3 style="margin-bottom: 15px; border-bottom: 1px solid rgba(201,183,169,0.2); padding-bottom: 10px;">User Engagement</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <h3>${data.users_logged_in_today || 0}</h3>
                                    <p>Active Users</p>
                                </div>
                                <div>
                                    <h3>${data.new_registrations || 0}</h3>
                                    <p>New Signups</p>
                                </div>
                                <div style="grid-column: 1 / -1;">
                                    <h3>${data.active_devices || 0}</h3>
                                    <p>Devices Connected</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            `;
        } else {
            tabContent.innerHTML = `<p class="no-data" style="color:#e74c3c;">${result.message || 'Failed to load daily overview'}</p>`;
        }
    } catch (error) {
        console.error('Error loading daily overview:', error);
        tabContent.innerHTML = '<p class="no-data" style="color:#e74c3c;">An error occurred while loading data</p>';
    }
}

async function loadWeeklySummary() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=week');
        const result = await response.json();
        
        if (result && result.length > 0) {
            tabContent.innerHTML = `
                <h3>Weekly Trends (Last 7 Days)</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Compliance Rate</th>
                                <th>Avg Glucose</th>
                                <th>Food Entries</th>
                                <th>Active Users</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.map(day => `
                                <tr>
                                    <td>${formatDate(day.summary_date)}</td>
                                    <td><span class="badge badge-${day.overall_compliance_rate >= 80 ? 'success' : day.overall_compliance_rate >= 60 ? 'warning' : 'danger'}">${day.overall_compliance_rate || 'N/A'}%</span></td>
                                    <td>${day.avg_glucose_level || 'N/A'} mg/dL</td>
                                    <td>${day.total_food_entries || 'N/A'}</td>
                                    <td>${day.users_logged_in_today || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tabContent.innerHTML = '<p class="no-data">No weekly data available</p>';
        }
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading weekly summary</p>';
    }
}

async function loadComplianceMetrics() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=compliance');
        const result = await response.json();
        
        tabContent.innerHTML = `
            <h3>Compliance Analysis</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${result.users_within_sugar_limit || 0}</h3>
                        <p>Users Within Sugar Limit</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${result.users_exceeded_sugar_limit || 0}</h3>
                        <p>Users Exceeded Limit</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${result.avg_sugar_intake_g || 0}g</h3>
                        <p>Population Avg Sugar</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>${result.overall_compliance_rate || 0}%</h3>
                        <p>Overall Compliance</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading compliance metrics</p>';
    }
}

async function loadComplianceTriggers() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=triggers');
        const result = await response.json();
        
        if (result && result.length > 0) {
            tabContent.innerHTML = `
                <h3>Compliance Triggers (Today)</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Trigger Type</th>
                                <th>Value</th>
                                <th>Description</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.map(trigger => `
                                <tr>
                                    <td>${formatDateTime(trigger.created_at)}</td>
                                    <td>User ${trigger.user_id}</td>
                                    <td><span class="badge badge-warning">${trigger.trigger_type}</span></td>
                                    <td>${trigger.trigger_value || 'N/A'}</td>
                                    <td>${trigger.trigger_description || 'N/A'}</td>
                                    <td><span class="badge badge-${trigger.is_resolved ? 'success' : 'danger'}">${trigger.is_resolved ? 'Resolved' : 'Active'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tabContent.innerHTML = '<p class="no-data">No compliance triggers today</p>';
        }
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading triggers</p>';
    }
}

async function loadHourlyActivity() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=hourly');
        const result = await response.json();
        
        if (result && result.length > 0) {
            tabContent.innerHTML = `
                <h3>Hourly Activity Distribution (Today)</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Hour</th>
                                <th>Food Entries</th>
                                <th>Glucose Readings</th>
                                <th>Weight Logs</th>
                                <th>Active Users</th>
                                <th>Peak Hour</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.map(hour => `
                                <tr>
                                    <td>${hour.hour_of_day}:00</td>
                                    <td>${hour.food_entries_count || 0}</td>
                                    <td>${hour.glucose_readings_count || 0}</td>
                                    <td>${hour.weight_logs_count || 0}</td>
                                    <td>${hour.active_users_count || 0}</td>
                                    <td><span class="badge badge-${hour.is_peak_hour ? 'success' : 'secondary'}">${hour.is_peak_hour ? 'Peak' : '-'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tabContent.innerHTML = '<p class="no-data">No hourly activity data available</p>';
        }
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading hourly activity</p>';
    }
}

async function loadGoalsAchievement() {
    const tabContent = document.getElementById('dailySummaryTabContent');
    tabContent.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(API_BASE + 'daily_summary.php?action=goals');
        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            tabContent.innerHTML = `
                <h3>Daily Goals Achievement</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3>${data.users_met_sugar_goal || 0}</h3>
                            <p>Met Sugar Goals</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3>${data.users_logged_meals || 0}</h3>
                            <p>Logged Meals</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3>${data.users_logged_glucose || 0}</h3>
                            <p>Logged Glucose</p>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-info">
                            <h3>${data.users_with_7day_streak || 0}</h3>
                            <p>7-Day Streaks</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            tabContent.innerHTML = `<p class="no-data" style="color: #e74c3c;">${result.message || 'No goals data available'}</p>`;
        }
    } catch (error) {
        tabContent.innerHTML = '<p class="no-data" style="color: #e74c3c;">Error loading goals achievement</p>';
    }
}

// Content Management Functions
async function loadContentManagement() {
    const content = document.getElementById('contentContent');
    
    content.innerHTML = `
        <!-- Search Bar -->
        <div style="margin-bottom: 20px;">
            <input type="text" id="contentSearchInput" placeholder="Search content..." 
                   onkeyup="filterContentTable()" 
                   style="width: 100%; max-width: 400px; padding: 10px; background: #2c1810; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
        </div>
        
        <!-- Content Management Overview -->
        <div class="metrics-grid" style="margin-bottom: 30px;">
            <div class="metric-card">
                <div class="metric-info">
                    <h3 id="totalHealthTips">12</h3>
                    <p>Health Tips</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 id="totalRecipes">8</h3>
                    <p>Recipes</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 id="totalArticles">5</h3>
                    <p>Articles</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3 id="totalFAQs">15</h3>
                    <p>FAQs</p>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <h2>Content Management</h2>
            <div class="action-buttons">
                <button class="action-btn" onclick="showContentTab('health-tips')">
                    <span>&#128161;</span> Manage Health Tips
                </button>
                <button class="action-btn" onclick="showContentTab('recipes')">
                    <span>&#127869;</span> Manage Recipes
                </button>
                <button class="action-btn" onclick="showContentTab('articles')">
                    <span>&#128218;</span> Manage Articles
                </button>
                <button class="action-btn" onclick="showContentTab('faqs')">
                    <span>&#10067;</span> Manage FAQs
                </button>
                <button class="action-btn" onclick="showContentTab('announcements')">
                    <span>&#128226;</span> Manage Announcements
                </button>
            </div>
        </div>

        <!-- Content Tab Content -->
        <div id="contentTabContent"></div>
    `;
    
    // Load default tab
    showContentTab('health-tips');
}

function showContentTab(tab) {
    // Update active tab button
    const tabButtons = document.querySelectorAll('.content-management-tabs .tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const tabContent = document.getElementById('contentTabContent');
    
    switch(tab) {
        case 'health-tips':
            loadHealthTipsManager();
            break;
        case 'recipes':
            loadRecipesManager();
            break;
        case 'articles':
            loadArticlesManager();
            break;
        case 'faqs':
            loadFAQManager();
            break;
        case 'announcements':
            loadAnnouncementsManager();
            break;
    }
}

function loadHealthTipsManager() {
    const tabContent = document.getElementById('contentTabContent');
    
    tabContent.innerHTML = `
        <div class="health-breakdown">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Health Tips Library</h2>
                <button class="action-btn" onclick="showAddHealthTipModal()">
                    <span>+</span> Add New Tip
                </button>
            </div>
            
            <div class="table-container">
                <div class="table-header">
                    <div class="table-filters">
                        <input type="text" placeholder="Search health tips..." class="search-input" onkeyup="filterHealthTips(this.value)">
                        <select class="filter-select" onchange="filterHealthTipsByCategory(this.value)">
                            <option value="">All Categories</option>
                            <option value="nutrition">Nutrition</option>
                            <option value="exercise">Exercise</option>
                            <option value="glucose">Glucose Management</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="prevention">Prevention</option>
                        </select>
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="content-title">Monitor Blood Sugar Regularly</div>
                                <div class="content-preview">Regular blood sugar monitoring helps you understand how food, exercise, and medication affect your glucose levels...</div>
                            </td>
                            <td><span class="badge badge-info">Glucose Management</span></td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td>Jan 10, 2026</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="editHealthTip(1)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="toggleHealthTipStatus(1)" title="Deactivate">&#9208;</button>
                                <button class="btn-icon text-danger" onclick="deleteHealthTip(1)" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Choose Low-Sugar Snacks</div>
                                <div class="content-preview">Opt for nuts, seeds, vegetables with hummus, or fresh fruits instead of processed snacks high in added sugars...</div>
                            </td>
                            <td><span class="badge badge-primary">Nutrition</span></td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td>Jan 9, 2026</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="editHealthTip(2)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="toggleHealthTipStatus(2)" title="Deactivate">&#9208;</button>
                                <button class="btn-icon text-danger" onclick="deleteHealthTip(2)" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Stay Hydrated Daily</div>
                                <div class="content-preview">Drinking adequate water helps maintain proper blood sugar levels and supports overall metabolic health...</div>
                            </td>
                            <td><span class="badge badge-secondary">Lifestyle</span></td>
                            <td><span class="badge badge-warning">Inactive</span></td>
                            <td>Jan 8, 2026</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="editHealthTip(3)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="toggleHealthTipStatus(3)" title="Activate">&#9654;</button>
                                <button class="btn-icon text-danger" onclick="deleteHealthTip(3)" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="content-item">
                    <div class="content-header">
                        <h4>Monitor Blood Sugar Regularly</h4>
                        <span class="content-status active">Active</span>
                    </div>
                    <p class="content-preview">Regular blood sugar monitoring helps you understand how food, exercise, and medication affect your glucose levels...</p>
                    <div class="content-meta">
                        <span class="content-category">Glucose Management</span>
                        <span class="content-date">Updated: Jan 10, 2026</span>
                        <div class="content-actions">
                            <button class="btn-icon" onclick="editHealthTip(1)" title="Edit">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="toggleHealthTipStatus(1)" title="Deactivate">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </button>
                            <button class="btn-icon text-danger" onclick="deleteHealthTip(1)" title="Delete">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="content-item">
                    <div class="content-header">
                        <h4>Choose Low-Sugar Snacks</h4>
                        <span class="content-status active">Active</span>
                    </div>
                    <p class="content-preview">Opt for nuts, seeds, vegetables with hummus, or fresh fruits instead of processed snacks high in added sugars...</p>
                    <div class="content-meta">
                        <span class="content-category">Nutrition</span>
                        <span class="content-date">Updated: Jan 9, 2026</span>
                        <div class="content-actions">
                            <button class="btn-icon" onclick="editHealthTip(2)" title="Edit">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="toggleHealthTipStatus(2)" title="Deactivate">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </button>
                            <button class="btn-icon text-danger" onclick="deleteHealthTip(2)" title="Delete">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="content-item">
                    <div class="content-header">
                        <h4>Stay Hydrated Daily</h4>
                        <span class="content-status inactive">Inactive</span>
                    </div>
                    <p class="content-preview">Drinking adequate water helps maintain proper blood sugar levels and supports overall metabolic health...</p>
                    <div class="content-meta">
                        <span class="content-category">Lifestyle</span>
                        <span class="content-date">Updated: Jan 8, 2026</span>
                        <div class="content-actions">
                            <button class="btn-icon" onclick="editHealthTip(3)" title="Edit">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="toggleHealthTipStatus(3)" title="Activate">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </button>
                            <button class="btn-icon text-danger" onclick="deleteHealthTip(3)" title="Delete">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadRecipesManager() {
    const tabContent = document.getElementById('contentTabContent');
    
    tabContent.innerHTML = `
        <div class="content-manager">
            <div class="manager-header">
                <h3>Low-Sugar Recipe Database</h3>
                <button class="btn btn-primary" onclick="showAddRecipeModal()">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add New Recipe
                </button>
            </div>
            
            <div class="search-filters">
                <input type="text" placeholder="Search recipes..." class="search-input" onkeyup="filterRecipes(this.value)">
                <select class="filter-select" onchange="filterRecipesByMealType(this.value)">
                    <option value="">All Meal Types</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snacks</option>
                    <option value="dessert">Desserts</option>
                </select>
                <select class="filter-select" onchange="filterRecipesByDiet(this.value)">
                    <option value="">All Diets</option>
                    <option value="diabetic">Diabetic-Friendly</option>
                    <option value="low-carb">Low-Carb</option>
                    <option value="keto">Keto</option>
                    <option value="vegetarian">Vegetarian</option>
                </select>
            </div>
            
            <div id="recipesList" class="content-list">
                <div class="content-item recipe-item">
                    <div class="recipe-image">
                        <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop" alt="Recipe">
                    </div>
                    <div class="recipe-content">
                        <div class="content-header">
                            <h4>Grilled Chicken with Cauliflower Rice</h4>
                            <span class="content-status active">Active</span>
                        </div>
                        <p class="content-preview">A delicious low-carb meal perfect for maintaining stable blood sugar levels...</p>
                        <div class="recipe-nutrition">
                            <span class="nutrition-item"><strong>Sugar:</strong> 3g</span>
                            <span class="nutrition-item"><strong>Carbs:</strong> 8g</span>
                            <span class="nutrition-item"><strong>Protein:</strong> 35g</span>
                            <span class="nutrition-item"><strong>Prep:</strong> 30 min</span>
                        </div>
                        <div class="content-meta">
                            <span class="content-category">Dinner</span>
                            <span class="recipe-difficulty">Easy</span>
                            <div class="content-actions">
                                <button class="btn-icon" onclick="viewRecipe(1)" title="View Full Recipe">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                </button>
                                <button class="btn-icon" onclick="editRecipe(1)" title="Edit">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                </button>
                                <button class="btn-icon text-danger" onclick="deleteRecipe(1)" title="Delete">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadArticlesManager() {
    const tabContent = document.getElementById('contentTabContent');
    
    tabContent.innerHTML = `
        <div class="content-manager">
            <div class="manager-header">
                <h3>Educational Articles</h3>
                <button class="btn btn-primary" onclick="showAddArticleModal()">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add New Article
                </button>
            </div>
            
            <div id="articlesList" class="content-list">
                <div class="content-item">
                    <div class="content-header">
                        <h4>Understanding Pre-Diabetes: Prevention and Management</h4>
                        <span class="content-status active">Published</span>
                    </div>
                    <p class="content-preview">Learn about the early warning signs of diabetes and effective strategies for prevention through lifestyle changes...</p>
                    <div class="content-meta">
                        <span class="content-category">Prevention</span>
                        <span class="content-date">Published: Jan 5, 2026</span>
                        <span class="article-readtime">8 min read</span>
                        <div class="content-actions">
                            <button class="btn-icon" onclick="editArticle(1)" title="Edit">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="btn-icon text-danger" onclick="deleteArticle(1)" title="Delete">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadFAQManager() {
    const tabContent = document.getElementById('contentTabContent');
    
    tabContent.innerHTML = `
        <div class="content-manager">
            <div class="manager-header">
                <h3>FAQ Management</h3>
                <button class="btn btn-primary" onclick="showAddFAQModal()">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add New FAQ
                </button>
            </div>
            
            <div id="faqsList" class="content-list">
                <div class="content-item">
                    <div class="content-header">
                        <h4>How often should I monitor my blood sugar?</h4>
                        <span class="content-status active">Active</span>
                    </div>
                    <p class="content-preview">The frequency of blood sugar monitoring depends on your health status and doctor's recommendations...</p>
                    <div class="content-meta">
                        <span class="content-category">Monitoring</span>
                        <span class="faq-views">1,234 views</span>
                        <div class="content-actions">
                            <button class="btn-icon" onclick="editFAQ(1)" title="Edit">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="toggleFAQStatus(1)" title="Deactivate">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </button>
                            <button class="btn-icon text-danger" onclick="deleteFAQ(1)" title="Delete">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadAnnouncementsManager() {
    const tabContent = document.getElementById('contentTabContent');
    
    tabContent.innerHTML = `
        <div class="content-manager">
            <div class="manager-header">
                <h3>System Announcements</h3>
                <button class="btn btn-primary" onclick="showAddAnnouncementModal()">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add Announcement
                </button>
            </div>
            
            <div id="announcementsList" class="content-list">
                <div class="content-item">
                    <div class="content-header">
                        <h4>New AI Food Recognition Update Available</h4>
                        <span class="content-status active">Active</span>
                    </div>
                    <p class="content-preview">We've improved our AI food recognition accuracy by 15%. Update your app to get the latest features...</p>
                    <div class="content-meta">
                        <span class="content-category">System Update</span>
                        <span class="announcement-priority">Medium</span>
                        <span class="content-date">Expires: Jan 20, 2026</span>
                        <div class="content-actions">
                            <button class="btn-icon" onclick="editAnnouncement(1)" title="Edit">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="btn-icon text-danger" onclick="deleteAnnouncement(1)" title="Delete">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Content Management Helper Functions
function showAddHealthTipModal() {
    alert('Add Health Tip modal would open here. This would connect to a backend API to create new health tips.');
}

function editHealthTip(id) {
    alert('Edit Health Tip modal would open here for tip ID: ' + id);
}

function toggleHealthTipStatus(id) {
    alert('Toggle status for health tip ID: ' + id);
}

function deleteHealthTip(id) {
    if (confirm('Are you sure you want to delete this health tip?')) {
        alert('Health tip ID ' + id + ' would be deleted via API call.');
    }
}

function filterHealthTips(searchTerm) {
    // Implement search functionality
    console.log('Filtering health tips by:', searchTerm);
}

function filterHealthTipsByCategory(category) {
    // Implement category filtering
    console.log('Filtering health tips by category:', category);
}

// System Settings Functions
async function loadSystemSettings() {
    const content = document.getElementById('settingsContent');
    
    content.innerHTML = `
        <!-- System Settings Tabs -->
        <div class="settings-tabs">
            <div class="tab-buttons">
                <button class="tab-btn active" onclick="showSettingsTab('application')">Application Settings</button>
                <button class="tab-btn" onclick="showSettingsTab('ai-models')">AI Model Management</button>
                <button class="tab-btn" onclick="showSettingsTab('integrations')">Integrations</button>
                <button class="tab-btn" onclick="showSettingsTab('notifications')">Notification Settings</button>
                <button class="tab-btn" onclick="showSettingsTab('security')">Security</button>
            </div>
            <div id="settingsTabContent" style="margin-top: 20px;"></div>
        </div>
    `;
    
    // Load default tab
    showSettingsTab('application');
}

function showSettingsTab(tab) {
    // Update active tab button
    const tabButtons = document.querySelectorAll('.settings-tabs .tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const tabContent = document.getElementById('settingsTabContent');
    
    switch(tab) {
        case 'application':
            loadApplicationSettings();
            break;
        case 'ai-models':
            loadAIModelManagement();
            break;
        case 'integrations':
            loadIntegrationSettings();
            break;
        case 'notifications':
            loadNotificationSettings();
            break;
        case 'security':
            loadSecuritySettings();
            break;
    }
}

function loadApplicationSettings() {
    const tabContent = document.getElementById('settingsTabContent');
    
    tabContent.innerHTML = `
        <div class="settings-panel">
            <div class="settings-section">
                <h3>Health Status Sugar Limits</h3>
                <p class="settings-description">Configure default daily sugar intake limits for different health statuses</p>
                
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Healthy Users (g/day)</label>
                        <input type="number" value="30" class="setting-input" onchange="updateSugarLimit('healthy', this.value)">
                        <small>Recommended for users with normal blood sugar levels</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Pre-diabetic Users (g/day)</label>
                        <input type="number" value="25" class="setting-input" onchange="updateSugarLimit('prediabetic', this.value)">
                        <small>Stricter limit for users at risk of diabetes</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Type 1 Diabetes (g/day)</label>
                        <input type="number" value="20" class="setting-input" onchange="updateSugarLimit('type1', this.value)">
                        <small>Careful monitoring required for insulin management</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Type 2 Diabetes (g/day)</label>
                        <input type="number" value="15" class="setting-input" onchange="updateSugarLimit('type2', this.value)">
                        <small>Most restrictive limit for optimal glucose control</small>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Glucose Range Definitions</h3>
                <p class="settings-description">Define glucose level ranges for classification and alerts</p>
                
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Normal Range (mg/dL)</label>
                        <div class="range-inputs">
                            <input type="number" value="70" class="setting-input small" onchange="updateGlucoseRange('normal', 'min', this.value)">
                            <span>to</span>
                            <input type="number" value="140" class="setting-input small" onchange="updateGlucoseRange('normal', 'max', this.value)">
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <label>High Range (mg/dL)</label>
                        <div class="range-inputs">
                            <input type="number" value="141" class="setting-input small" onchange="updateGlucoseRange('high', 'min', this.value)">
                            <span>to</span>
                            <input type="number" value="199" class="setting-input small" onchange="updateGlucoseRange('high', 'max', this.value)">
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <label>Critical Range (mg/dL)</label>
                        <div class="range-inputs">
                            <input type="number" value="200" class="setting-input small" onchange="updateGlucoseRange('critical', 'min', this.value)">
                            <span>and above</span>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <label>Low Range (mg/dL)</label>
                        <div class="range-inputs">
                            <input type="number" value="69" class="setting-input small" onchange="updateGlucoseRange('low', 'max', this.value)">
                            <span>and below</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Alert Threshold Configurations</h3>
                <p class="settings-description">Configure when alerts should be triggered</p>
                
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Sugar Limit Exceeded Alert (%)</label>
                        <input type="number" value="80" class="setting-input" onchange="updateAlertThreshold('sugar', this.value)">
                        <small>Alert when users reach this percentage of their daily limit</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>High Glucose Alert Delay (minutes)</label>
                        <input type="number" value="15" class="setting-input" onchange="updateAlertThreshold('glucose_delay', this.value)">
                        <small>Wait time before sending high glucose alerts</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Missed Meal Alert (hours)</label>
                        <input type="number" value="6" class="setting-input" onchange="updateAlertThreshold('missed_meal', this.value)">
                        <small>Alert if no meal logged within this timeframe</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Inactive User Alert (days)</label>
                        <input type="number" value="3" class="setting-input" onchange="updateAlertThreshold('inactive_user', this.value)">
                        <small>Alert for users who haven't logged data</small>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Unit Preferences</h3>
                <p class="settings-description">Configure default units for the system</p>
                
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Glucose Units</label>
                        <select class="setting-select" onchange="updateUnitPreference('glucose', this.value)">
                            <option value="mg/dL" selected>mg/dL (US Standard)</option>
                            <option value="mmol/L">mmol/L (International)</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label>Weight Units</label>
                        <select class="setting-select" onchange="updateUnitPreference('weight', this.value)">
                            <option value="kg" selected>Kilograms (kg)</option>
                            <option value="lbs">Pounds (lbs)</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label>Language</label>
                        <select class="setting-select" onchange="updateUnitPreference('language', this.value)">
                            <option value="en" selected>English</option>
                            <option value="ms">Bahasa Malaysia</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label>Time Zone</label>
                        <select class="setting-select" onchange="updateUnitPreference('timezone', this.value)">
                            <option value="Asia/Kuala_Lumpur" selected>Malaysia (GMT+8)</option>
                            <option value="Asia/Singapore">Singapore (GMT+8)</option>
                            <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-primary" onclick="saveApplicationSettings()">Save All Settings</button>
                <button class="btn btn-secondary" onclick="resetApplicationSettings()">Reset to Defaults</button>
            </div>
        </div>
    `;
}

function loadAIModelManagement() {
    const tabContent = document.getElementById('settingsTabContent');
    
    tabContent.innerHTML = `
        <div class="settings-panel">
            <div class="settings-section">
                <h3>Food Recognition AI Model</h3>
                <p class="settings-description">Manage the AI model used for food recognition and classification</p>
                
                <div class="ai-model-status">
                    <div class="model-info">
                        <div class="model-details">
                            <h4>Current Model: FoodNet v2.1.3</h4>
                            <p>Last Updated: January 8, 2026</p>
                            <div class="model-metrics">
                                <span class="metric">Accuracy: <strong>94.2%</strong></span>
                                <span class="metric">Processing Speed: <strong>1.2s avg</strong></span>
                                <span class="metric">Foods Recognized: <strong>12,847</strong></span>
                            </div>
                        </div>
                        <div class="model-actions">
                            <button class="btn btn-primary" onclick="checkModelUpdates()">Check for Updates</button>
                            <button class="btn btn-secondary" onclick="testModelAccuracy()">Test Accuracy</button>
                        </div>
                    </div>
                </div>
                
                <div class="model-settings">
                    <div class="setting-item">
                        <label>Confidence Threshold (%)</label>
                        <input type="number" value="85" min="50" max="99" class="setting-input" onchange="updateModelSetting('confidence_threshold', this.value)">
                        <small>Minimum confidence required for automatic food recognition</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Auto-retrain Frequency</label>
                        <select class="setting-select" onchange="updateModelSetting('retrain_frequency', this.value)">
                            <option value="weekly">Weekly</option>
                            <option value="monthly" selected>Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="manual">Manual Only</option>
                        </select>
                        <small>How often to retrain the model with new data</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Training Data Validation</label>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="validate_training_data" checked onchange="updateModelSetting('validate_training_data', this.checked)">
                            <label for="validate_training_data">Enable automatic validation of new training data</label>
                        </div>
                    </div>
                </div>
                
                <div class="training-data-section">
                    <h4>Training Data Management</h4>
                    <div class="training-stats">
                        <div class="stat-item">
                            <span class="stat-value">156,423</span>
                            <span class="stat-label">Training Images</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">89.7%</span>
                            <span class="stat-label">Validation Accuracy</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">2,341</span>
                            <span class="stat-label">Pending Validation</span>
                        </div>
                    </div>
                    
                    <div class="training-actions">
                        <button class="btn btn-primary" onclick="uploadTrainingData()">Upload New Training Data</button>
                        <button class="btn btn-secondary" onclick="validatePendingData()">Validate Pending Data</button>
                        <button class="btn btn-warning" onclick="triggerRetrain()">Trigger Manual Retrain</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadIntegrationSettings() {
    const tabContent = document.getElementById('settingsTabContent');
    
    tabContent.innerHTML = `
        <div class="settings-panel">
            <div class="settings-section">
                <h3>Device Integrations</h3>
                <p class="settings-description">Configure connections to external devices and services</p>
                
                <div class="integration-list">
                    <div class="integration-item">
                        <div class="integration-info">
                            <h4>Continuous Glucose Monitors (CGM)</h4>
                            <p>Connect to popular CGM devices for real-time glucose monitoring</p>
                            <div class="integration-status connected">Connected</div>
                        </div>
                        <div class="integration-config">
                            <div class="config-item">
                                <label>Sync Frequency</label>
                                <select class="setting-select" onchange="updateIntegration('cgm', 'sync_frequency', this.value)">
                                    <option value="realtime" selected>Real-time</option>
                                    <option value="5min">Every 5 minutes</option>
                                    <option value="15min">Every 15 minutes</option>
                                    <option value="30min">Every 30 minutes</option>
                                </select>
                            </div>
                            <div class="config-item">
                                <label>API Endpoint</label>
                                <input type="url" value="https://api.cgm-provider.com/v2" class="setting-input" onchange="updateIntegration('cgm', 'api_endpoint', this.value)">
                            </div>
                            <div class="config-item">
                                <label>API Key</label>
                                <input type="password" value="����������������" class="setting-input" onchange="updateIntegration('cgm', 'api_key', this.value)">
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="testIntegration('cgm')">Test Connection</button>
                        </div>
                    </div>
                    
                    <div class="integration-item">
                        <div class="integration-info">
                            <h4>Smart Scale Devices</h4>
                            <p>Integrate with smart scales for automatic weight tracking</p>
                            <div class="integration-status connected">Connected</div>
                        </div>
                        <div class="integration-config">
                            <div class="config-item">
                                <label>Sync Frequency</label>
                                <select class="setting-select" onchange="updateIntegration('scale', 'sync_frequency', this.value)">
                                    <option value="immediate" selected>Immediate</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="testIntegration('scale')">Test Connection</button>
                        </div>
                    </div>
                    
                    <div class="integration-item">
                        <div class="integration-info">
                            <h4>Healthcare Provider Systems</h4>
                            <p>Connect to hospital and clinic management systems</p>
                            <div class="integration-status disconnected">Not Connected</div>
                        </div>
                        <div class="integration-config">
                            <div class="config-item">
                                <label>FHIR Endpoint</label>
                                <input type="url" placeholder="https://hospital-system.com/fhir" class="setting-input" onchange="updateIntegration('healthcare', 'fhir_endpoint', this.value)">
                            </div>
                            <div class="config-item">
                                <label>Client ID</label>
                                <input type="text" placeholder="Enter client ID" class="setting-input" onchange="updateIntegration('healthcare', 'client_id', this.value)">
                            </div>
                            <div class="config-item">
                                <label>Client Secret</label>
                                <input type="password" placeholder="Enter client secret" class="setting-input" onchange="updateIntegration('healthcare', 'client_secret', this.value)">
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="connectIntegration('healthcare')">Connect</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Third-Party Analytics</h3>
                <p class="settings-description">Configure connections to analytics and monitoring services</p>
                
                <div class="analytics-integrations">
                    <div class="setting-item">
                        <label>Google Analytics Tracking ID</label>
                        <input type="text" value="G-XXXXXXXX" class="setting-input" onchange="updateAnalytics('google_analytics', this.value)">
                        <small>For web analytics and user behavior tracking</small>
                    </div>
                    
                    <div class="setting-item">
                        <label>Enable Crash Reporting</label>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="crash_reporting" checked onchange="updateAnalytics('crash_reporting', this.checked)">
                            <label for="crash_reporting">Automatically report app crashes and errors</label>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <label>Performance Monitoring</label>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="performance_monitoring" checked onchange="updateAnalytics('performance_monitoring', this.checked)">
                            <label for="performance_monitoring">Monitor app performance and response times</label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-primary" onclick="saveIntegrationSettings()">Save All Integrations</button>
                <button class="btn btn-secondary" onclick="testAllIntegrations()">Test All Connections</button>
            </div>
        </div>
    `;
}

// Settings Helper Functions
function updateSugarLimit(type, value) {
    console.log('Updating sugar limit for', type, 'to', value);
    // API call to update sugar limit
}

function updateGlucoseRange(type, bound, value) {
    console.log('Updating glucose range', type, bound, 'to', value);
    // API call to update glucose ranges
}

function updateAlertThreshold(type, value) {
    console.log('Updating alert threshold', type, 'to', value);
    // API call to update alert thresholds
}

function updateUnitPreference(type, value) {
    console.log('Updating unit preference', type, 'to', value);
    // API call to update unit preferences
}

function saveApplicationSettings() {
    alert('Application settings would be saved to the backend API.');
}

function resetApplicationSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        alert('Settings would be reset to default values.');
    }
}

function checkModelUpdates() {
    alert('Checking for AI model updates...');
}

function testModelAccuracy() {
    alert('Running model accuracy test...');
}

function updateModelSetting(setting, value) {
    console.log('Updating model setting', setting, 'to', value);
}

function uploadTrainingData() {
    alert('Training data upload interface would open here.');
}

function validatePendingData() {
    alert('Validating pending training data...');
}

function triggerRetrain() {
    if (confirm('This will retrain the AI model and may take several hours. Continue?')) {
        alert('Model retraining initiated...');
    }
}

function updateIntegration(type, setting, value) {
    console.log('Updating integration', type, setting, 'to', value);
}

function testIntegration(type) {
    alert('Testing ' + type + ' integration connection...');
}

function connectIntegration(type) {
    alert('Connecting to ' + type + ' integration...');
}

function updateAnalytics(setting, value) {
    console.log('Updating analytics setting', setting, 'to', value);
}

function saveIntegrationSettings() {
    alert('Integration settings would be saved.');
}

function testAllIntegrations() {
    alert('Testing all integration connections...');
}

// Enhanced Reports System Functions
function showReportsTab(tab) {
    const tabContent = document.getElementById('reportsTabContent');
    
    switch(tab) {
        case 'population':
            loadPopulationHealthReports();
            break;
        case 'system':
            loadSystemPerformanceReports();
            break;
        case 'compliance':
            loadComplianceReports();
            break;
        case 'custom':
            loadCustomReportBuilder();
            break;
        case 'scheduled':
            loadScheduledReports();
            break;
        case 'templates':
            loadReportTemplates();
            break;
    }
}

function loadPopulationHealthReports() {
    const tabContent = document.getElementById('reportsTabContent');
    
    tabContent.innerHTML = `
        <div class="health-breakdown">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Population Health Reports</h2>
                <button class="action-btn" onclick="generatePopulationReport()">
                    <span>+</span> Generate New Report
                </button>
            </div>
            
            <div class="table-container">
                <div class="table-header">
                    <div class="table-filters">
                        <input type="text" placeholder="Search reports..." class="search-input">
                        <select class="filter-select">
                            <option value="">All Time Periods</option>
                            <option value="daily">Daily Reports</option>
                            <option value="weekly">Weekly Reports</option>
                            <option value="monthly">Monthly Reports</option>
                            <option value="quarterly">Quarterly Reports</option>
                        </select>
                        <select class="filter-select">
                            <option value="">All Health Status</option>
                            <option value="healthy">Healthy</option>
                            <option value="prediabetic">Pre-diabetic</option>
                            <option value="diabetes">Diabetes</option>
                        </select>
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report Name</th>
                            <th>Period</th>
                            <th>Health Focus</th>
                            <th>Generated</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="content-title">Weekly Diabetes Population Summary</div>
                                <div class="content-preview">Comprehensive analysis of diabetic population health metrics for Week 2, January 2026</div>
                            </td>
                            <td><span class="badge badge-info">Weekly</span></td>
                            <td><span class="badge badge-warning">Diabetes</span></td>
                            <td>Jan 12, 2026 09:30</td>
                            <td><span class="badge badge-success">Completed</span></td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="viewReport('population', 1)" title="View">&#128065;</button>
                                <button class="btn-icon" onclick="downloadReport(1, 'pdf')" title="Download PDF">&#128196;</button>
                                <button class="btn-icon" onclick="downloadReport(1, 'excel')" title="Download Excel">&#128200;</button>
                                <button class="btn-icon" onclick="scheduleReport(1)" title="Schedule">&#128337;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Monthly Compliance Trends Analysis</div>
                                <div class="content-preview">Sugar intake compliance patterns across different health status groups for December 2025</div>
                            </td>
                            <td><span class="badge badge-primary">Monthly</span></td>
                            <td><span class="badge badge-info">Compliance</span></td>
                            <td>Jan 10, 2026 14:15</td>
                            <td><span class="badge badge-success">Completed</span></td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="viewReport('population', 2)" title="View">&#128065;</button>
                                <button class="btn-icon" onclick="downloadReport(2, 'pdf')" title="Download PDF">&#128196;</button>
                                <button class="btn-icon" onclick="downloadReport(2, 'excel')" title="Download Excel">&#128200;</button>
                                <button class="btn-icon" onclick="scheduleReport(2)" title="Schedule">&#128337;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Daily Population Health Overview</div>
                                <div class="content-preview">Real-time snapshot of population health indicators and alert trends for January 11, 2026</div>
                            </td>
                            <td><span class="badge badge-success">Daily</span></td>
                            <td><span class="badge badge-secondary">Overall</span></td>
                            <td>Jan 11, 2026 23:45</td>
                            <td><span class="badge badge-warning">Processing</span></td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="viewReport('population', 3)" title="View">&#128065;</button>
                                <button class="btn-icon" disabled title="Download PDF">&#128196;</button>
                                <button class="btn-icon" disabled title="Download Excel">&#128200;</button>
                                <button class="btn-icon" onclick="scheduleReport(3)" title="Schedule">&#128337;</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    `;

}



function loadSystemPerformanceReports() {
    const tabContent = document.getElementById('reportsTabContent');
    
    tabContent.innerHTML = `
        <div class="health-breakdown">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">System Performance Reports</h2>
                <button class="action-btn" onclick="generateSystemReport()">
                    <span>+</span> Generate System Report
                </button>
            </div>
            
            <div class="metrics-grid" style="margin-bottom: 30px;">
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>99.7%</h3>
                        <p>System Uptime</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>1.2s</h3>
                        <p>Avg Response Time</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>0.03%</h3>
                        <p>Error Rate</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-info">
                        <h3>847</h3>
                        <p>Daily Active Users</p>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report Type</th>
                            <th>Time Period</th>
                            <th>Key Metrics</th>
                            <th>Status</th>
                            <th>Last Generated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="content-title">Server Performance Analysis</div>
                                <div class="content-preview">CPU, memory, disk usage and network performance metrics</div>
                            </td>
                            <td><span class="badge badge-info">Last 24h</span></td>
                            <td>Uptime: 99.9%, CPU: 23%, Memory: 67%</td>
                            <td><span class="badge badge-success">Healthy</span></td>
                            <td>2 hours ago</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="viewReport('system', 'server')" title="View">&#128065;</button>
                                <button class="btn-icon" onclick="downloadReport('server', 'pdf')" title="Download">&#128196;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Database Performance Report</div>
                                <div class="content-preview">Query performance, connection pools, and storage analytics</div>
                            </td>
                            <td><span class="badge badge-primary">Last 7d</span></td>
                            <td>Avg Query: 45ms, Connections: 23/100</td>
                            <td><span class="badge badge-success">Optimal</span></td>
                            <td>6 hours ago</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="viewReport('system', 'database')" title="View">&#128065;</button>
                                <button class="btn-icon" onclick="downloadReport('database', 'pdf')" title="Download">&#128196;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">API Endpoint Health Check</div>
                                <div class="content-preview">Response times, error rates, and endpoint availability</div>
                            </td>
                            <td><span class="badge badge-success">Real-time</span></td>
                            <td>Success Rate: 99.97%, Avg: 1.2s</td>
                            <td><span class="badge badge-success">All Green</span></td>
                            <td>15 min ago</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="viewReport('system', 'api')" title="View">&#128065;</button>
                                <button class="btn-icon" onclick="downloadReport('api', 'pdf')" title="Download">&#128196;</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    `;

}



function loadCustomReportBuilder() {


    const tabContent = document.getElementById('reportsTabContent');

    

    tabContent.innerHTML = `

        <div class="health-breakdown">
            <h2 style="margin-bottom: 20px;">Custom Report Builder</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div class="settings-panel">
                    <h3>Report Configuration</h3>
                    
                    <div class="setting-item">
                        <label>Report Name</label>
                        <input type="text" class="setting-input" placeholder="Enter report name" id="reportName">
                    </div>
                    
                    <div class="setting-item">
                        <label>Report Type</label>
                        <select class="setting-select" id="reportType" onchange="updateReportOptions()">
                            <option value="">Select Report Type</option>
                            <option value="population">Population Health</option>
                            <option value="compliance">Compliance Analysis</option>
                            <option value="glucose">Glucose Analytics</option>
                            <option value="food">Food Database Analysis</option>
                            <option value="device">Device Performance</option>
                            <option value="usage">System Usage</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label>Time Period</label>
                        <select class="setting-select" id="timePeriod">
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last7days">Last 7 Days</option>
                            <option value="last30days">Last 30 Days</option>
                            <option value="thisMonth">This Month</option>
                            <option value="lastMonth">Last Month</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>
                    
                    <div class="setting-item" id="customDateRange" style="display: none;">
                        <label>Date Range</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="date" class="setting-input" id="startDate">
                            <input type="date" class="setting-input" id="endDate">
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <label>Health Status Filter</label>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="filterHealthy" checked>
                            <label for="filterHealthy">Healthy</label>
                        </div>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="filterPrediabetic" checked>
                            <label for="filterPrediabetic">Pre-diabetic</label>
                        </div>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="filterType1" checked>
                            <label for="filterType1">Type 1 Diabetes</label>
                        </div>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="filterType2" checked>
                            <label for="filterType2">Type 2 Diabetes</label>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <label>Export Format</label>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="exportPDF" checked>
                            <label for="exportPDF">PDF Report</label>
                        </div>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="exportExcel">
                            <label for="exportExcel">Excel Spreadsheet</label>
                        </div>
                        <div class="checkbox-setting">
                            <input type="checkbox" id="exportCSV">
                            <label for="exportCSV">CSV Data</label>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; display: flex; gap: 12px;">
                        <button class="btn btn-primary" onclick="generateCustomReport()">Generate Report</button>
                        <button class="btn btn-secondary" onclick="previewReport()">Preview</button>
                        <button class="btn btn-secondary" onclick="saveReportTemplate()">Save as Template</button>
                    </div>
                </div>
                
                <div class="settings-panel">
                    <h3>Report Preview</h3>
                    <div id="reportPreview" style="min-height: 400px; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; background: #f8f9fa;">
                        <p class="no-data">Configure report settings to see preview</p>
                    </div>
                </div>
            </div>
        </div>

    `;

}



function loadScheduledReports() {

    const tabContent = document.getElementById('reportsTabContent');

    

    tabContent.innerHTML = `

        <div class="health-breakdown">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Scheduled Reports</h2>
                <button class="action-btn" onclick="createScheduledReport()">
                    <span>+</span> Schedule New Report
                </button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report Name</th>
                            <th>Type</th>
                            <th>Schedule</th>
                            <th>Next Run</th>
                            <th>Last Run</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="content-title">Daily Population Summary</div>
                                <div class="content-preview">Automated daily health metrics report sent to admin team</div>
                            </td>
                            <td><span class="badge badge-info">Population</span></td>
                            <td>Daily at 6:00 AM</td>
                            <td>Tomorrow 6:00 AM</td>
                            <td>Today 6:00 AM</td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="editSchedule(1)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="pauseSchedule(1)" title="Pause">&#9208;</button>
                                <button class="btn-icon" onclick="runNow(1)" title="Run Now">&#9654;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Weekly Compliance Report</div>
                                <div class="content-preview">Weekly sugar compliance analysis for healthcare providers</div>
                            </td>
                            <td><span class="badge badge-warning">Compliance</span></td>
                            <td>Weekly on Monday 8:00 AM</td>
                            <td>Next Mon 8:00 AM</td>
                            <td>Last Mon 8:00 AM</td>
                            <td><span class="badge badge-success">Active</span></td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="editSchedule(2)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="pauseSchedule(2)" title="Pause">&#9208;</button>
                                <button class="btn-icon" onclick="runNow(2)" title="Run Now">&#9654;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Monthly System Performance</div>
                                <div class="content-preview">Comprehensive system health and performance analysis</div>
                            </td>
                            <td><span class="badge badge-primary">System</span></td>
                            <td>Monthly on 1st at 9:00 AM</td>
                            <td>Feb 1 9:00 AM</td>
                            <td>Jan 1 9:00 AM</td>
                            <td><span class="badge badge-warning">Paused</span></td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="editSchedule(3)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="resumeSchedule(3)" title="Resume">&#9654;</button>
                                <button class="btn-icon" onclick="runNow(3)" title="Run Now">&#9654;</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    `;

}



// Report Helper Functions
function generatePopulationReport() {
    alert('Population report generation would start here. This connects to backend APIs for data aggregation.');
}

function generateSystemReport() {
    alert('System performance report generation initiated. This would collect server metrics and performance data.');
}

function viewReport(type, id) {
    alert('View report: ' + type + ' (ID: ' + id + ') - This would open the report in a new window or modal.');
}

function downloadReport(id, format) {
    alert('Download report ID: ' + id + ' in ' + format.toUpperCase() + ' format');
    // window.location.href = API_BASE + 'reports.php?action=download&id=' + id + '&format=' + format;
}

function scheduleReport(id) {
    alert('Schedule report ID: ' + id + ' - This would open scheduling configuration modal.');
}

function generateCustomReport() {
    const reportName = document.getElementById('reportName').value;
    const reportType = document.getElementById('reportType').value;
    
    if (!reportName || !reportType) {
        alert('Please enter a report name and select a report type.');
        return;
    }
    
    alert('Generating custom report: ' + reportName + ' (' + reportType + ')');
    // Implementation would collect all form data and send to backend
}

function previewReport() {
    const reportType = document.getElementById('reportType').value;
    const timePeriod = document.getElementById('timePeriod').value;
    
    if (!reportType) {
        alert('Please select a report type first.');
        return;
    }
    
    const preview = document.getElementById('reportPreview');
    preview.innerHTML = `

        <h4>Report Preview: ${reportType} Report</h4>
        <p><strong>Time Period:</strong> ${timePeriod}</p>
        <p><strong>Status:</strong> This is a sample preview. The actual report would contain:</p>
        <ul>
            <li>Data tables with filtered results</li>
            <li>Charts and visualizations</li>
            <li>Summary statistics</li>
            <li>Trend analysis</li>
            <li>Export options</li>
        </ul>
        <p><em>Click "Generate Report" to create the full report with real data.</em></p>

    `;

}

function saveReportTemplate() {
    alert('Save report configuration as template for future use.');
}

function loadReportTemplates() {

    const tabContent = document.getElementById('reportsTabContent');

    

    tabContent.innerHTML = `

        <div class="health-breakdown">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Report Templates</h2>
                <button class="action-btn" onclick="createNewTemplate()">
                    <span>+</span> Create New Template
                </button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Template Name</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Usage Count</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="content-title">Weekly Population Health Summary</div>
                                <div class="content-preview">Comprehensive weekly overview of population health metrics</div>
                            </td>
                            <td><span class="badge badge-info">Population</span></td>
                            <td>Weekly health status distribution with trend analysis</td>
                            <td>23 times</td>
                            <td>Jan 1, 2026</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="useTemplate(1)" title="Use Template">&#128190;</button>
                                <button class="btn-icon" onclick="editTemplate(1)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="cloneTemplate(1)" title="Clone">&#128203;</button>
                                <button class="btn-icon text-danger" onclick="deleteTemplate(1)" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">Monthly Compliance Analysis</div>
                                <div class="content-preview">Detailed monthly analysis of sugar intake compliance</div>
                            </td>
                            <td><span class="badge badge-warning">Compliance</span></td>
                            <td>Focus on pre-diabetic and diabetic users compliance patterns</td>
                            <td>15 times</td>
                            <td>Jan 2, 2026</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="useTemplate(2)" title="Use Template">&#128190;</button>
                                <button class="btn-icon" onclick="editTemplate(2)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="cloneTemplate(2)" title="Clone">&#128203;</button>
                                <button class="btn-icon text-danger" onclick="deleteTemplate(2)" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="content-title">System Performance Dashboard</div>
                                <div class="content-preview">Real-time system health and performance monitoring</div>
                            </td>
                            <td><span class="badge badge-primary">System</span></td>
                            <td>24-hour system metrics with alerts and performance indicators</td>
                            <td>42 times</td>
                            <td>Jan 3, 2026</td>
                            <td class="action-cell">
                                <button class="btn-icon" onclick="useTemplate(3)" title="Use Template">&#128190;</button>
                                <button class="btn-icon" onclick="editTemplate(3)" title="Edit">&#9998;</button>
                                <button class="btn-icon" onclick="cloneTemplate(3)" title="Clone">&#128203;</button>
                                <button class="btn-icon text-danger" onclick="deleteTemplate(3)" title="Delete">&#128465;</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    `;

}



// Additional Helper Functions for Reports
function createNewTemplate() {
    alert('Create new template modal would open here. This would allow users to define reusable report configurations.');
}

function useTemplate(templateId) {
    alert('Use template ' + templateId + ' - This would load the template configuration in the custom report builder.');
}

function editTemplate(templateId) {
    alert('Edit template ' + templateId + ' - This would open the template editor.');
}

function cloneTemplate(templateId) {
    alert('Clone template ' + templateId + ' - This would create a copy for modification.');
}

function deleteTemplate(templateId) {
    if (confirm('Are you sure you want to delete this template?')) {
        alert('Template ' + templateId + ' would be deleted.');
    }
}

function updateReportOptions() {
    const reportType = document.getElementById('reportType').value;
    const preview = document.getElementById('reportPreview');
    
    if (reportType) {
        preview.innerHTML = `

            <h4>Report Configuration: ${reportType} Report</h4>

            <p><strong>Available Metrics:</strong></p>

            <ul id="availableMetrics"></ul>

            <p><em>Select time period and filters to see detailed preview.</em></p>

        `;
        
        const metricsList = document.getElementById('availableMetrics');
        let metrics = [];
        
        switch(reportType) {
            case 'population':
                metrics = ['Total Users', 'Active Users', 'Health Status Distribution', 'Compliance Rates', 'Geographic Distribution'];
                break;
            case 'compliance':
                metrics = ['Sugar Intake Compliance', 'Limit Violations', 'Trend Analysis', 'Risk Factors', 'Improvement Metrics'];
                break;
            case 'glucose':
                metrics = ['Average Glucose Levels', 'Reading Frequency', 'Status Distribution', 'Spike Analysis', 'Device Performance'];
                break;
            case 'system':
                metrics = ['Server Uptime', 'Response Times', 'Error Rates', 'Resource Usage', 'User Activity'];
                break;
        }
        
        metricsList.innerHTML = metrics.map(metric => `<li>${metric}</li>`).join('');
    }
}

function createScheduledReport() {
    alert('Create scheduled report modal would open here. This would allow setting up automated report generation and delivery.');
}

function editSchedule(scheduleId) {
    alert('Edit schedule ' + scheduleId + ' - This would open the schedule configuration modal.');
}

function pauseSchedule(scheduleId) {
    alert('Pause schedule ' + scheduleId + ' - This would temporarily disable the scheduled report.');
}

function resumeSchedule(scheduleId) {
    alert('Resume schedule ' + scheduleId + ' - This would re-enable the paused scheduled report.');
}

function runNow(scheduleId) {
    alert('Run now schedule ' + scheduleId + ' - This would immediately generate and send the scheduled report.');
}

// Content Management Search/Filter Implementation
function filterHealthTips(searchTerm) {
    const rows = document.querySelectorAll('#healthTipsList tr, .content-list .content-item');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function filterHealthTipsByCategory(category) {
    const rows = document.querySelectorAll('#healthTipsList tr, .content-list .content-item');
    
    rows.forEach(row => {
        if (!category) {
            row.style.display = '';
            return;
        }
        
        const badges = row.querySelectorAll('.badge');
        let matchFound = false;
        
        badges.forEach(badge => {
            if (badge.textContent.toLowerCase().includes(category.toLowerCase())) {
                matchFound = true;
            }
        });
        
        row.style.display = matchFound ? '' : 'none';
    });
}

function filterRecipes(searchTerm) {
    const items = document.querySelectorAll('#recipesList .content-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? '' : 'none';
    });
}

function filterRecipesByMealType(mealType) {
    const items = document.querySelectorAll('#recipesList .content-item');
    
    items.forEach(item => {
        if (!mealType) {
            item.style.display = '';
            return;
        }
        
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(mealType.toLowerCase()) ? '' : 'none';
    });
}

function filterRecipesByDiet(diet) {
    const items = document.querySelectorAll('#recipesList .content-item');
    
    items.forEach(item => {
        if (!diet) {
            item.style.display = '';
            return;
        }
        
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(diet.toLowerCase()) ? '' : 'none';
    });
}

// Healthcare Provider Features - Sugar Limits & Recommendations

async function loadClinicalRecommendations(userId) {
    try {
        const response = await fetch(`${API_BASE}clinical_recommendations.php?user_id=${userId}`);
        const result = await response.json();
        
        const container = document.getElementById(`recommendationsList_${userId}`);
        if (!container) return;
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(rec => {
                const priorityColor = rec.priority === 'Urgent' ? '#e74c3c' : 
                                    rec.priority === 'High' ? '#e67e22' : 
                                    rec.priority === 'Medium' ? '#f39c12' : '#3498db';
                const statusBadge = rec.status === 'Active' ? 'success' : 
                                  rec.status === 'Completed' ? 'info' : 'secondary';
                
                return `
                    <div class="timeline-item" style="border-left-color: ${priorityColor}; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong style="color: #c9b7a9;">${rec.title}</strong>
                                <span class="badge badge-${statusBadge}" style="margin-left: 10px;">${rec.status}</span>
                                <span class="badge" style="background: ${priorityColor}; color: white; margin-left: 5px;">${rec.priority}</span>
                            </div>
                            <small style="opacity: 0.7; color: #c9b7a9;">${formatDate(rec.created_at)}</small>
                        </div>
                        <p style="margin: 8px 0; font-size: 13px; color: #c9b7a9;">${rec.recommendation_text}</p>
                        <small style="opacity: 0.6; color: #c9b7a9;">
                            Type: ${rec.recommendation_type} | 
                            Provider: ${rec.provider_name} (${rec.specialization})
                            ${rec.review_date ? ` | Review: ${formatDate(rec.review_date)}` : ''}
                        </small>
                        ${rec.status === 'Active' ? `
                        <div style="margin-top: 10px;">
                            <button class="btn-success btn-small" onclick="updateRecommendationStatus(${rec.recommendation_id}, 'Completed', ${userId})">Mark Completed</button>
                            <button class="btn-danger btn-small" onclick="updateRecommendationStatus(${rec.recommendation_id}, 'Cancelled', ${userId})">Cancel</button>
                        </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p style="opacity: 0.7; font-style: italic; color: #c9b7a9;">No recommendations yet. Click "Add Recommendation" to create one.</p>';
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        const container = document.getElementById(`recommendationsList_${userId}`);
        if (container) {
            container.innerHTML = '<p style="color: #c9b7a9; opacity: 0.8;">Error loading recommendations</p>';
        }
    }
}

function openSetSugarLimitModal(userId, currentLimit) {
    const modalHTML = `
        <div id="setSugarLimitModal" class="modal active">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Set Patient Sugar Limit</h2>
                    <button class="modal-close" onclick="closeSugarLimitModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; opacity: 0.8;">Set a personalized daily sugar intake limit for this patient.</p>
                    <form id="setSugarLimitForm" onsubmit="submitSugarLimit(event, ${userId})">
                        <div class="form-group">
                            <label>Daily Sugar Limit (grams) *</label>
                            <input type="number" name="daily_limit_g" step="0.1" min="0" max="200" 
                                   value="${currentLimit}" required 
                                   style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                            <small style="opacity: 0.7;">Recommended range: 25-50g for diabetics, 30-60g for pre-diabetics</small>
                        </div>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Reason for this limit *</label>
                            <select name="reason" required style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                                <option value="">Select reason</option>
                                <option value="Type 2 Diabetes">Type 2 Diabetes Management</option>
                                <option value="Pre-diabetic condition">Pre-diabetic Condition</option>
                                <option value="Weight management">Weight Management</option>
                                <option value="High risk patient">High Risk Patient</option>
                                <option value="Recent high glucose readings">Recent High Glucose Readings</option>
                                <option value="Patient request">Patient Request</option>
                                <option value="Clinical adjustment">Clinical Adjustment</option>
                            </select>
                        </div>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Effective From</label>
                            <input type="date" name="effective_from" value="${new Date().toISOString().split('T')[0]}" 
                                   style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                        </div>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Clinical Notes (Optional)</label>
                            <textarea name="notes" rows="3" placeholder="Additional notes or instructions for the patient..."
                                      style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                            <button type="button" class="btn-secondary" onclick="closeSugarLimitModal()">Cancel</button>
                            <button type="submit" class="btn-primary">Set Sugar Limit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSugarLimitModal() {
    const modal = document.getElementById('setSugarLimitModal');
    if (modal) modal.remove();
}

async function submitSugarLimit(event, userId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        user_id: userId,
        daily_limit_g: parseFloat(formData.get('daily_limit_g')),
        reason: formData.get('reason'),
        effective_from: formData.get('effective_from'),
        notes: formData.get('notes')
    };
    
    try {
        const response = await fetch(API_BASE + 'patient_sugar_limits.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeSugarLimitModal();
            
            // Update the displayed limit
            const limitElement = document.getElementById(`currentSugarLimit_${userId}`);
            if (limitElement) {
                limitElement.textContent = data.daily_limit_g + 'g';
                
                // Highlight the change with animation
                limitElement.style.background = 'rgba(46, 204, 113, 0.3)';
                limitElement.style.padding = '5px 10px';
                limitElement.style.borderRadius = '4px';
                limitElement.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    limitElement.style.background = 'transparent';
                }, 2000);
            }
            
            alert('SUCCESS: Sugar limit updated!\n\nNew daily limit: ' + data.daily_limit_g + 'g\nReason: ' + data.reason + '\nEffective from: ' + data.effective_from + '\n\nThe limit is now visible in the "Current Daily Limit" field in the Overview tab.');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while setting sugar limit');
    }
}

function openAddRecommendationModal(userId) {
    const modalHTML = `
        <div id="addRecommendationModal" class="modal active">
            <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Add Clinical Recommendation</h2>
                    <button class="modal-close" onclick="closeRecommendationModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; opacity: 0.8; font-style: italic;">
                        <strong>For Educational Purposes:</strong> These recommendations are for patient education and guidance only.
                    </p>
                    <form id="addRecommendationForm" onsubmit="submitRecommendation(event, ${userId})">
                        <div class="form-group">
                            <label>Recommendation Type *</label>
                            <select name="recommendation_type" required style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                                <option value="">Select type</option>
                                <option value="Diet">Diet</option>
                                <option value="Exercise">Exercise</option>
                                <option value="Medication">Medication</option>
                                <option value="Lifestyle">Lifestyle</option>
                                <option value="Monitoring">Monitoring</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Title *</label>
                            <input type="text" name="title" required placeholder="e.g., Reduce Refined Carbohydrates"
                                   style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                        </div>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Recommendation Text * <small>(Educational purpose)</small></label>
                            <textarea name="recommendation_text" rows="5" required 
                                      placeholder="For educational purposes: Describe the recommendation in detail..."
                                      style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;"></textarea>
                            <small style="opacity: 0.7;">Be specific and provide actionable guidance for the patient.</small>
                        </div>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Priority</label>
                            <select name="priority" style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                                <option value="Medium">Medium (Default)</option>
                                <option value="Low">Low</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                            <div class="form-group">
                                <label>Effective Date</label>
                                <input type="date" name="effective_date" value="${new Date().toISOString().split('T')[0]}"
                                       style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                            </div>
                            
                            <div class="form-group">
                                <label>Review Date (Optional)</label>
                                <input type="date" name="review_date"
                                       style="width: 100%; padding: 10px; background: #3d2a1d; color: #c9b7a9; border: 1px solid rgba(201,183,169,0.3); border-radius: 6px;">
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                            <button type="button" class="btn-secondary" onclick="closeRecommendationModal()">Cancel</button>
                            <button type="submit" class="btn-primary">Add Recommendation</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeRecommendationModal() {
    const modal = document.getElementById('addRecommendationModal');
    if (modal) modal.remove();
}

async function submitRecommendation(event, userId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        user_id: userId,
        recommendation_type: formData.get('recommendation_type'),
        title: formData.get('title'),
        recommendation_text: formData.get('recommendation_text'),
        priority: formData.get('priority') || 'Medium',
        effective_date: formData.get('effective_date'),
        review_date: formData.get('review_date') || null
    };
    
    try {
        const response = await fetch(API_BASE + 'clinical_recommendations.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Clinical recommendation added successfully!');
            closeRecommendationModal();
            
            // Reload recommendations list
            loadClinicalRecommendations(userId);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding recommendation');
    }
}

async function updateRecommendationStatus(recommendationId, newStatus, userId) {
    if (!confirm(`Are you sure you want to mark this recommendation as ${newStatus}?`)) return;
    
    try {
        const response = await fetch(API_BASE + 'clinical_recommendations.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recommendation_id: recommendationId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Recommendation status updated!');
            loadClinicalRecommendations(userId);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating status');
    }
}

