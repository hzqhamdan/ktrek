// main.js

// API Base URL - Update this to your PHP backend location
const API_BASE = 'api/';

let currentUser = null;
let currentAttractionIdForTaskGuide = null;
let taskCompletionChartInstance = null;
let userActivityChartInstance = null;
let engagementScatterChartInstance = null;
let attractionBubbleChartInstance = null;
let currentChartPeriod = 7; // Default to 7 days
let allTasks = []; // Store all tasks for filtering
let allGuides = []; // Store all guides for filtering
let allAttractions = []; // Store all attractions for sorting
let currentEditingTaskId = null; // Track which task is being edited for QR generation

function setupRoleBasedTaskAndGuideFilters() {
    // TASKS: Superadmin uses BOTH Attraction and Type filters; others use Type filter only
    const taskTypeGroup = document.getElementById('taskTypeFilterGroup');
    const taskAttractionGroup = document.getElementById('taskAttractionFilterGroup');

    // GUIDES: Superadmin can filter by Attraction; others do not see the Attraction filter
    const guideAttractionGroup = document.getElementById('guideAttractionFilterGroup');

    if (currentUser?.role === 'superadmin') {
        // Show BOTH filters for superadmin
        if (taskTypeGroup) taskTypeGroup.style.display = 'inline-block';
        if (taskAttractionGroup) taskAttractionGroup.style.display = 'inline-block';
        if (guideAttractionGroup) guideAttractionGroup.style.display = 'inline-block';

        // Populate attraction dropdowns
        loadAttractionFilterDropdown('taskAttractionFilter');
        loadAttractionFilterDropdown('guideAttractionFilter');
    } else {
        // Managers see only task type filter
        if (taskTypeGroup) taskTypeGroup.style.display = 'inline-block';
        if (taskAttractionGroup) taskAttractionGroup.style.display = 'none';
        if (guideAttractionGroup) guideAttractionGroup.style.display = 'none';

        // Ensure hidden filters don't affect results
        const taskAttractionSelect = document.getElementById('taskAttractionFilter');
        if (taskAttractionSelect) taskAttractionSelect.value = '';
        const guideAttractionSelect = document.getElementById('guideAttractionFilter');
        if (guideAttractionSelect) guideAttractionSelect.value = '';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    checkSession();
	
	const navLinks = document.querySelectorAll('.sidebar-nav .nav-link'); // Target links within the sidebar nav
    console.log("DOMContentLoaded: Found nav links:", navLinks.length); // Debug log

    // Attach click event listener to each link
    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default anchor behavior (jumping to top/href)
            console.log("Nav link clicked:", this.dataset.tab); // Debug log
            const tabName = this.dataset.tab; // Get the target tab name from data-tab attribute
            if (tabName) {
                switchTab(tabName); // Call the switchTab function with the target tab name
            } else {
                console.warn("Nav link clicked but no data-tab attribute found:", this); // Debug warning
            }
        });
    });

    // Add global click listener for profile dropdown close
    document.addEventListener('click', function (event) {
        const profileContainer = document.querySelector('.user-profile');
        const dropdown = document.getElementById('profileDropdown');
        if (profileContainer && dropdown && !profileContainer.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Add submit event listener for the edit profile form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfileSubmit);
        console.log("DOMContentLoaded: Added submit listener for editProfileForm.");
    } else {
        console.warn("DOMContentLoaded: editProfileForm not found.");
    }
});

function checkSession() {
    const session = sessionStorage.getItem('adminUser');
    const mustChange = sessionStorage.getItem('mustChangePassword');
    
    if (session) {
        currentUser = JSON.parse(session); // The parsed object should contain attraction_id
        console.log("checkSession: Retrieved currentUser object:", currentUser); // Debug log to confirm attraction_id is present
       
        // If must change password, show change password screen instead of dashboard
        if (mustChange === 'true') {
            showChangePasswordScreen();
        } else {
            showDashboard();
        }
    }
}


function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    // Check for pending reset when email is entered
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail) {
        loginEmail.addEventListener('blur', checkPendingReset);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) changePasswordForm.addEventListener('submit', handleChangePassword);
    
    const setNewPasswordForm = document.getElementById('setNewPasswordForm');
    if (setNewPasswordForm) setNewPasswordForm.addEventListener('submit', handleSetNewPassword);
    
    const attractionForm = document.getElementById('attractionForm');
    if (attractionForm) attractionForm.addEventListener('submit', handleAttractionSubmit);
    
    const taskForm = document.getElementById('taskForm');
    if (taskForm) taskForm.addEventListener('submit', handleTaskSubmit);
    
    const taskAndGuideForm = document.getElementById('taskAndGuideForm');
    if (taskAndGuideForm) taskAndGuideForm.addEventListener('submit', handleTaskAndGuideSubmit);
    
    const guideForm = document.getElementById('guideForm');
    if (guideForm) guideForm.addEventListener('submit', handleGuideSubmit);
    
    // rewardForm is now handled in rewards.js
    const replyForm = document.getElementById('replyForm');
    if (replyForm) replyForm.addEventListener('submit', handleReplySubmit);
    
    // Add event listener for attraction change in guide modal to load tasks
    const guideAttraction = document.getElementById('guideAttraction');
    if (guideAttraction) {
        guideAttraction.addEventListener('change', function() {
            const attractionId = this.value;
            if (attractionId) {
                loadTasksDropdown('guideTask', attractionId);
            } else {
                // Clear tasks dropdown if no attraction selected
                const guideTask = document.getElementById('guideTask');
                if (guideTask) guideTask.innerHTML = '<option value="">Select Task</option>';
            }
        });
    }
}

// Toggle between login and register forms
function showRegisterForm() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('forgotPasswordScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
}

function showForgotPasswordForm() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('forgotPasswordScreen').classList.remove('hidden');
}

function showChangePasswordScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('forgotPasswordScreen').classList.add('hidden');
    document.getElementById('changePasswordScreen').classList.remove('hidden');
}

// Handle forced password change
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    try {
        const response = await fetch(API_BASE + 'change_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                current_password: currentPassword, 
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showChangePasswordAlert('✅ Password changed successfully! Redirecting...', 'success');
            sessionStorage.removeItem('mustChangePassword');
            
            setTimeout(() => {
                document.getElementById('changePasswordScreen').classList.add('hidden');
                document.getElementById('changePasswordForm').reset();
                showDashboard();
            }, 2000);
        } else {
            showChangePasswordAlert(data.message || 'Error changing password', 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showChangePasswordAlert('Connection error. Please try again.', 'error');
    }
}

function showChangePasswordAlert(message, type) {
    const alert = document.getElementById('changePasswordAlert');
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
}

// Show set new password screen (after reset approval)
function showSetNewPasswordScreen(email) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('forgotPasswordScreen').classList.add('hidden');
    document.getElementById('changePasswordScreen').classList.add('hidden');
    document.getElementById('setNewPasswordScreen').classList.remove('hidden');
    
    // Store email for password reset
    document.getElementById('setPasswordEmail').value = email;
}

// Handle setting new password after reset approval
async function handleSetNewPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('setPasswordEmail').value;
    const newPassword = document.getElementById('setNewPassword').value;
    const confirmPassword = document.getElementById('setConfirmPassword').value;
    
    try {
        const response = await fetch(API_BASE + 'set_new_password_after_reset.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSetNewPasswordAlert('✅ ' + data.message + ' Redirecting to login...', 'success');
            
            setTimeout(() => {
                document.getElementById('setNewPasswordScreen').classList.add('hidden');
                document.getElementById('setNewPasswordForm').reset();
                showLoginForm();
                showLoginAlert('Password set successfully! You can now login with your new password.', 'success');
            }, 2000);
        } else {
            showSetNewPasswordAlert(data.message || 'Error setting password', 'error');
        }
    } catch (error) {
        console.error('Set password error:', error);
        showSetNewPasswordAlert('Connection error. Please try again.', 'error');
    }
}

function showSetNewPasswordAlert(message, type) {
    const alert = document.getElementById('setNewPasswordAlert');
    alert.innerHTML = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();

    const formData = {
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        full_name: document.getElementById('registerFullName').value,
        // role is now automatically set to 'manager' on the backend
    };

    try {
        const response = await fetch(API_BASE + 'register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        // Read response as text first (so we can use it for both JSON parsing and error messages)
        const responseText = await response.text();

        // Check if response is OK
        if (!response.ok) {
            console.error('Registration error:', response.status, responseText);
            showRegisterAlert(`Server error (${response.status}). Please try again.`, 'error');
            return;
        }

        // Try to parse JSON response
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError, 'Response:', responseText);
            showRegisterAlert('Invalid response from server. Please check console for details.', 'error');
            return;
        }

        if (data.success) {
            showRegisterAlert(data.message || 'Registration successful! You can now log in.', 'success');
            setTimeout(() => {
                showLoginForm();
                document.getElementById('registerForm').reset();
            }, 2000); // Adjust timeout if needed
        } else {
            showRegisterAlert(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration network error:', error);
        showRegisterAlert('Connection error. Please check your internet connection and try again.', 'error');
    }
}

// Handle forgot password request
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotPasswordEmail').value;
    const message = document.getElementById('forgotPasswordMessage').value;
    
    try {
        const response = await fetch(API_BASE + 'password_reset_request.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, message })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show enhanced success message
            const successMessage = `
                <div style="text-align: left;">
                    <div style="font-weight: 600; margin-bottom: 10px;">✅ ${data.message}</div>
                    ${data.instructions ? `<div style="margin-bottom: 8px;">📋 ${data.instructions}</div>` : ''}
                    ${data.urgent_contact ? `
                        <div style="margin-top: 12px; padding: 10px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
                            <strong>Need urgent access?</strong><br>
                            Contact Superadmin: <a href="tel:${data.urgent_contact}" style="color: #d97706; font-weight: 600;">${data.urgent_contact}</a>
                            <br><small style="color: #92400e;">(Call/WhatsApp available)</small>
                        </div>
                    ` : ''}
                    ${data.request_id ? `<div style="margin-top: 10px; font-size: 12px; color: #6b7280;">Request ID: #${data.request_id}</div>` : ''}
                </div>
            `;
            showForgotPasswordAlert(successMessage, 'success');
            
            // Return to login after 8 seconds (longer to read the message)
            setTimeout(() => {
                showLoginForm();
                document.getElementById('forgotPasswordForm').reset();
            }, 8000);
        } else {
            showForgotPasswordAlert(data.message || 'Error submitting request', 'error');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showForgotPasswordAlert('Connection error. Please try again.', 'error');
    }
}

// Check for pending password reset on login page
async function checkPendingReset() {
    const email = document.getElementById('loginEmail').value;
    
    if (!email || !email.includes('@')) return;
    
    try {
        const response = await fetch(API_BASE + 'check_pending_reset.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success && data.has_pending) {
            const timeAgo = data.minutes_ago < 60 
                ? `${data.minutes_ago} minutes ago` 
                : `${Math.floor(data.minutes_ago / 60)} hours ago`;
            
            showLoginAlert(
                `⏳ You have a pending password reset request (submitted ${timeAgo}). ` +
                `Please wait for admin approval or contact 019-2590381 for urgent access.`,
                'info'
            );
        }
    } catch (error) {
        // Silently fail - don't disrupt login
        console.log('Could not check pending reset status');
    }
}

// Login function
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // First check if user has an approved password reset
    try {
        const checkResponse = await fetch(API_BASE + 'check_approved_reset.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const checkData = await checkResponse.json();
        
        if (checkData.success && checkData.has_approved_reset) {
            // Show set new password screen instead of attempting login
            showSetNewPasswordScreen(email);
            return;
        }
    } catch (error) {
        console.log('Could not check approved reset status, continuing with normal login');
    }

    // Normal login flow
    try {
        const response = await fetch(API_BASE + 'login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Check if password change is required
            if (data.must_change_password) {
                // Store user temporarily but show password change screen
                currentUser = data.user;
                sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
                sessionStorage.setItem('mustChangePassword', 'true');
                showChangePasswordScreen();
                return;
            }
            
            // --- CRITICAL: Ensure attraction_id is captured from the response ---
            currentUser = data.user; // data.user now contains id, email, full_name, role, AND attraction_id
            console.log("handleLogin: Stored currentUser object:", currentUser); // Debug log to confirm attraction_id is present
            // --- END CRITICAL ---

            sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
            sessionStorage.removeItem('mustChangePassword');
            showDashboard();
        } else {
            showLoginAlert(data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showLoginAlert('Connection error. Please try again.', 'error');
    }
}

function showDashboard() {
    console.log("showDashboard: Function called. currentUser:", currentUser); // Debug log

    setupRoleBasedTaskAndGuideFilters();

    // Superadmin-only: show attractions sort
    const attractionSortGroup = document.getElementById('attractionSortGroup');
    if (attractionSortGroup) {
        attractionSortGroup.style.display = (currentUser?.role === 'superadmin') ? 'flex' : 'none';
    }
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');

    // Populate user name in the header
    if (currentUser) {
        document.getElementById('userNameDisplay').textContent = currentUser.full_name || currentUser.email || 'User'; // Show name if available, otherwise email, otherwise default
    }

    // Hide Admin Users, Reports, and Rewards tabs/links for managers
    if (currentUser?.role === 'manager') {
        console.log("showDashboard: Hiding Admin Users, Reports, and Rewards links for Manager.");
        const adminUsersLink = document.getElementById('adminUsersNavLink');
        const reportsTabLink = document.getElementById('reportsTab');

        if (adminUsersLink) {
            adminUsersLink.style.display = 'none'; // Hide Admin Users link (sidebar)
        }

        if (reportsTabLink) {
            reportsTabLink.style.display = 'none'; // Hide Reports link (sidebar)
        }

        // Hide Rewards link (sidebar) and section
        document.querySelectorAll('.nav-link[data-tab="rewards"]').forEach(link => {
            link.style.display = 'none';
        });
        const rewardsSection = document.getElementById('rewards');
        if (rewardsSection) {
            rewardsSection.style.display = 'none';
        }

        // Hide Add Task and Add Guide buttons for managers
        const addTaskBtn = document.querySelector('#tasks .section-header .add-btn'); // Find button within tasks section header
        const addGuideBtn = document.querySelector('#guides .section-header .add-btn'); // Find button within guides section header

        // COMMENTED OUT - Allow managers to add tasks/guides
        // if (addTaskBtn) {
        //     addTaskBtn.style.display = 'none';
        // } else {
        //     console.warn("showDashboard: Add Task button not found!");
        // }

        // if (addGuideBtn) {
        //     addGuideBtn.style.display = 'none';
        // } else {
        //     console.warn("showDashboard: Add Guide button not found!");
        // }

    } else if (currentUser?.role === 'superadmin') {
        console.log("showDashboard: Showing Admin Users, Reports, and Rewards links for SuperAdmin.");
        // Show them (in case they were hidden before) for superadmins
        const adminUsersLink = document.getElementById('adminUsersNavLink');
        const reportsTabLink = document.getElementById('reportsTab');

        console.log("DEBUG: adminUsersLink element found?", adminUsersLink);
        if (adminUsersLink) {
            adminUsersLink.style.display = ''; // Show Admin Users link
            console.log("DEBUG: Set adminUsersLink display to empty string (should be visible now)");
        } else {
            console.error("DEBUG: adminUsersNavLink element NOT FOUND in DOM!");
        }

        if (reportsTabLink) {
            reportsTabLink.style.display = ''; // Show Reports link
        }

        // Show Rewards link (sidebar) and section
        document.querySelectorAll('.nav-link[data-tab="rewards"]').forEach(link => {
            link.style.display = '';
        });
        const rewardsSection = document.getElementById('rewards');
        if (rewardsSection) {
            rewardsSection.style.display = '';
        }

        // Show Add Task and Add Guide buttons for superadmins (or leave them visible if they were)
        const addTaskBtn = document.querySelector('#tasks .section-header .add-btn');
        const addGuideBtn = document.querySelector('#guides .section-header .add-btn');

        if (addTaskBtn) {
            addTaskBtn.style.display = ''; // Show Add Task button
        }

        if (addGuideBtn) {
            addGuideBtn.style.display = ''; // Show Add Guide button
        }

    } else {
        // Shouldn't happen if user is properly logged in, but log it
        console.warn("showDashboard: currentUser.role is not 'manager' or 'superadmin'. Role:", currentUser?.role);
        // Default to hiding for safety if role is unknown/invalid
        const adminUsersLink = document.getElementById('adminUsersNavLink');
        const reportsTabLink = document.getElementById('reportsTab');
        const addTaskBtn = document.querySelector('#tasks .section-header .add-btn');
        const addGuideBtn = document.querySelector('#guides .section-header .add-btn');

        if (adminUsersLink) {
            adminUsersLink.style.display = 'none';
        }
        if (reportsTabLink) {
            reportsTabLink.style.display = 'none';
        }

        document.querySelectorAll('.nav-link[data-tab="rewards"]').forEach(link => {
            link.style.display = 'none';
        });
        const rewardsSection = document.getElementById('rewards');
        if (rewardsSection) {
            rewardsSection.style.display = 'none';
        }

        // COMMENTED OUT - Allow this role to add tasks/guides
        // if (addTaskBtn) {
        //     addTaskBtn.style.display = 'none';
        // }
        // if (addGuideBtn) {
        //     addGuideBtn.style.display = 'none';
        // }
    }

    // Load the right dashboard per role
    if (currentUser?.role === 'superadmin') {
        showSuperadminDashboard();
    } else {
        showManagerDashboard();
    }
}

function showManagerDashboard() {
    const sa = document.getElementById('superadminDashboard');
    if (sa) sa.style.display = 'none';

    // Show legacy dashboard content blocks
    document.querySelectorAll('#dashboard > :not(#superadminDashboard)').forEach(el => {
        if (el && el.style) el.style.display = '';
    });

    // Show Recent Changes section for managers
    const recentChangesSection = document.getElementById('managerRecentChanges');
    if (recentChangesSection) {
        recentChangesSection.style.display = 'block';
    }

    loadDashboardStats();
    loadManagerRecentChanges();
}

function showSuperadminDashboard() {
    const sa = document.getElementById('superadminDashboard');
    if (sa) sa.style.display = 'block';

    // Hide legacy dashboard content blocks
    document.querySelectorAll('#dashboard > :not(#superadminDashboard)').forEach(el => {
        if (el && el.style) el.style.display = 'none';
    });

    // Hide Recent Changes section for superadmins
    const recentChangesSection = document.getElementById('managerRecentChanges');
    if (recentChangesSection) {
        recentChangesSection.style.display = 'none';
    }

    loadSuperadminDashboard();
    loadPendingResetRequests(); // Load pending password reset requests on dashboard
}

let saUsersChart = null;
let saAttractionsChart = null;
let saEngagementChart = null;
let saManagerPerformanceChart = null;
let saEfficiencyScatterChart = null;
let saActivityBubbleChart = null;
let saReportPolarChart = null;

async function loadSuperadminDashboard(periodDays = 30) {
    try {
        const response = await fetch(API_BASE + `superadmin_dashboard.php?action=get&period_days=${periodDays}`);
        const data = await response.json();

        if (!data.success) {
            showAlert(data.message || 'Failed to load superadmin dashboard', 'error');
            return;
        }

        const payload = data.data;
        const overview = payload.manager_overview;

        const total = overview.total || 0;
        const active = overview.active || 0;
        const inactive = (overview.inactive || 0) + (overview.suspended || 0);

        document.getElementById('saTotalManagers').textContent = total;
        document.getElementById('saActiveManagers').textContent = active;
        document.getElementById('saInactiveManagers').textContent = inactive;
        document.getElementById('saNewManagers').textContent = overview.new_in_period || 0;

        renderSaRisk(payload.risk_indicators, payload.meta);
        renderSaManagersTable(payload.manager_performance);
        renderSaGrowth(payload.growth);
        renderSaNewCharts(payload); // Render new creative charts
        renderSaRecent(payload.recent_activity);

    } catch (e) {
        console.error('loadSuperadminDashboard error:', e);
        showAlert('Error loading superadmin dashboard', 'error');
    }
}

function saBadge(status) {
    const map = {
        active: { bg: '#10b981', text: 'Active' },
        deactivated: { bg: '#ef4444', text: 'Deactivated' },
        suspended: { bg: '#f59e0b', text: 'Suspended' },
    };
    const v = map[status] || { bg: '#6b7280', text: status || 'Unknown' };
    return `<span style="padding: 4px 8px; border-radius: 6px; background: ${v.bg}; color: white; font-size: 12px;">${v.text}</span>`;
}

function saFmtDate(ts) {
    if (!ts) return '-';
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return ts;
    }
}

function renderSaRisk(risks, meta) {
    const container = document.getElementById('saRiskContainer');
    if (!container) return;

    if (!risks || risks.length === 0) {
        container.innerHTML = '<div style="padding: 12px; border-radius: 8px; background:#f0fdf4; border: 1px solid #bbf7d0; color:#166534; font-weight: 600;">No risk alerts detected.</div>';
        return;
    }

    const severityColor = (sev) => {
        if (sev === 'high') return '#ef4444';
        if (sev === 'medium') return '#f59e0b';
        return '#3b82f6';
    };

    container.innerHTML = risks.slice(0, 12).map(r => {
        const flags = (r.flags || []).map(f => {
            let label = f.type;
            if (f.type === 'overdue_reports') label = `Overdue reports (${meta.overdue_days}d+)`;
            if (f.type === 'inactive') label = `Long inactivity (${meta.inactive_days}d+)`;
            if (f.type === 'high_complaints') label = `High complaints (last ${meta.period_days}d)`;
            if (f.type === 'low_engagement') label = `Low engagement (last ${meta.period_days}d)`;
            return `<span style="display:inline-block; padding: 4px 8px; margin: 4px 6px 0 0; border-radius: 999px; background:${severityColor(f.severity)}; color:#fff; font-size: 12px;">${label}</span>`;
        }).join('');

        return `
            <div style="background:#fff; border: 2px solid #E3F2FD; border-radius: 10px; padding: 14px;">
                <div style="display:flex; justify-content: space-between; align-items:center; gap: 10px;">
                    <div>
                        <div style="font-weight: 800; color:#111827;">${r.full_name}</div>
                        <div style="color:#6b7280; font-size: 12px;">${r.email}</div>
                    </div>
                    <button class="action-btn view-btn" onclick="switchTab('adminUsers')">View</button>
                </div>
                <div style="margin-top: 8px;">${flags}</div>
            </div>
        `;
    }).join('');
}

function renderSaManagersTable(rows) {
    const tbody = document.getElementById('saManagersTable');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No managers found.</td></tr>';
        return;
    }

    const sorted = [...rows].sort((a, b) => (b.reports_open || 0) - (a.reports_open || 0));

    tbody.innerHTML = sorted.map(m => {
        const avg = (m.avg_response_minutes == null) ? '-' : m.avg_response_minutes;
        return `
            <tr>
                <td>
                    <div style="font-weight: 700;">${m.full_name || ''}</div>
                    <div style="color:#6b7280; font-size: 12px;">${m.email || ''}</div>
                </td>
                <td>${saBadge(m.account_status)}</td>
                <td>${saFmtDate(m.last_login)}</td>
                <td>${m.attractions_added}</td>
                <td>${m.tasks_created}</td>
                <td style="font-weight: 800; color:${(m.reports_open || 0) > 0 ? '#ef4444' : '#111827'};">${m.reports_open}</td>
                <td>${avg}</td>
                <td><button class="action-btn edit-btn" onclick="switchTab('adminUsers')">Manage</button></td>
            </tr>
        `;
    }).join('');
}

function saRenderLineChart(canvasId, existingChart, labels, series, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return existingChart;

    const ctx = canvas.getContext('2d');

    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: series,
                borderColor: color,
                backgroundColor: color + '33',
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#6b7280' }, grid: { display: false } },
                y: { ticks: { color: '#6b7280' }, grid: { display: false }, beginAtZero: true }
            }
        }
    });
}

function renderSaGrowth(growth) {
    if (!growth) return;

    const labels = (growth.labels || []).map(d => {
        try {
            const dt = new Date(d);
            return `${dt.getMonth() + 1}/${dt.getDate()}`;
        } catch {
            return d;
        }
    });

    // Convert to area charts
    saUsersChart = saRenderAreaChart('saUsersGrowthChart', saUsersChart, labels, growth.users_new || [], '#36a2eb');
    saAttractionsChart = saRenderAreaChart('saAttractionsGrowthChart', saAttractionsChart, labels, growth.attractions_new || [], '#5E35B1');
    saEngagementChart = saRenderLineChart('saEngagementChart', saEngagementChart, labels, growth.task_submissions || [], '#10b981');
}

function saRenderAreaChart(canvasId, existingChart, labels, series, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return existingChart;

    const ctx = canvas.getContext('2d');

    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: series,
                borderColor: color,
                backgroundColor: color + '33',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    titleColor: '#e0e0e0',
                    bodyColor: '#ccc'
                }
            },
            scales: {
                x: { ticks: { color: '#888' }, grid: { color: '#E0E0E0', drawBorder: false } },
                y: { ticks: { color: '#888' }, grid: { color: '#E0E0E0', drawBorder: false }, beginAtZero: true }
            }
        }
    });
}

function renderSaNewCharts(payload) {
    const managers = payload.manager_performance || [];
    
    // 1. Radar Chart - Manager Performance
    const radarCtx = document.getElementById('saManagerPerformanceChart');
    if (radarCtx) {
        if (saManagerPerformanceChart) saManagerPerformanceChart.destroy();
        
        const topManagers = managers.slice(0, 5);
        const metrics = ['Attractions', 'Tasks', 'Reports Handled', 'Response Time', 'Activity'];
        
        const radarData = topManagers.map((m, i) => {
            const colors = ['rgba(94, 53, 177, 0.3)', 'rgba(33, 150, 243, 0.3)', 'rgba(76, 175, 80, 0.3)', 'rgba(255, 152, 0, 0.3)', 'rgba(244, 67, 54, 0.3)'];
            return {
                label: m.full_name || `Manager ${i+1}`,
                data: [
                    m.attractions_added || 0,
                    m.tasks_created || 0,
                    (m.reports_open || 0) > 0 ? 100 - (m.reports_open * 10) : 100,
                    m.avg_response_minutes ? Math.max(0, 100 - m.avg_response_minutes) : 50,
                    m.last_login ? 80 : 20
                ],
                backgroundColor: colors[i],
                borderColor: colors[i].replace('0.3', '1'),
                borderWidth: 2
            };
        });
        
        saManagerPerformanceChart = new Chart(radarCtx, {
            type: 'radar',
            data: { labels: metrics, datasets: radarData },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { color: '#888', backdropColor: 'transparent' },
                        grid: { color: '#E0E0E0' },
                        angleLines: { color: '#E0E0E0' },
                        pointLabels: { color: '#555', font: { size: 10 } }
                    }
                },
                plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }
            }
        });
    }
    
    // 2. Scatter Chart - Manager Efficiency
    const scatterCtx = document.getElementById('saEfficiencyScatterChart');
    if (scatterCtx) {
        if (saEfficiencyScatterChart) saEfficiencyScatterChart.destroy();
        
        const scatterData = managers.map(m => ({
            x: m.attractions_added || 0,
            y: m.tasks_created || 0,
            name: m.full_name || m.email
        }));
        
        saEfficiencyScatterChart = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: scatterData,
                    backgroundColor: 'rgba(33, 150, 243, 0.6)',
                    borderColor: '#2196F3',
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const p = scatterData[ctx.dataIndex];
                                return [p.name, `Attractions: ${p.x}`, `Tasks: ${p.y}`];
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Attractions Added', color: '#555' }, ticks: { color: '#888' }, grid: { color: '#E0E0E0' }, beginAtZero: true },
                    y: { title: { display: true, text: 'Tasks Created', color: '#555' }, ticks: { color: '#888' }, grid: { color: '#E0E0E0' }, beginAtZero: true }
                }
            }
        });
    }
    
    // 3. Bubble Chart - Manager Activity
    const bubbleCtx = document.getElementById('saActivityBubbleChart');
    if (bubbleCtx) {
        if (saActivityBubbleChart) saActivityBubbleChart.destroy();
        
        const bubbleData = managers.slice(0, 8).map((m, i) => ({
            x: i + 1,
            y: (m.attractions_added || 0) + (m.tasks_created || 0),
            r: (m.reports_open || 0) + 5,
            name: m.full_name || m.email
        }));
        
        const colors = ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)'];
        
        saActivityBubbleChart = new Chart(bubbleCtx, {
            type: 'bubble',
            data: {
                datasets: [{
                    data: bubbleData,
                    backgroundColor: bubbleData.map((_, i) => colors[i])
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const p = bubbleData[ctx.dataIndex];
                                return [p.name, `Total Work: ${p.y}`, `Open Reports: ${p.r - 5}`];
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Manager Rank', color: '#555' }, ticks: { color: '#888' }, grid: { color: '#E0E0E0' } },
                    y: { title: { display: true, text: 'Total Work Items', color: '#555' }, ticks: { color: '#888' }, grid: { color: '#E0E0E0' }, beginAtZero: true }
                }
            }
        });
    }
    
    // 4. Polar Area Chart - Report Distribution
    const polarCtx = document.getElementById('saReportPolarChart');
    if (polarCtx) {
        if (saReportPolarChart) saReportPolarChart.destroy();
        
        const topReportManagers = managers.filter(m => (m.reports_open || 0) > 0).slice(0, 8);
        
        saReportPolarChart = new Chart(polarCtx, {
            type: 'polarArea',
            data: {
                labels: topReportManagers.map(m => (m.full_name || m.email || '').substring(0, 15)),
                datasets: [{
                    data: topReportManagers.map(m => m.reports_open || 0),
                    backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 10 } } }
                },
                scales: {
                    r: {
                        ticks: { color: '#888', backdropColor: 'transparent' },
                        grid: { color: '#E0E0E0' }
                    }
                }
            }
        });
    }
}

function renderSaRecent(recent) {
    const ra = document.getElementById('saRecentAttractions');
    const rt = document.getElementById('saRecentTasks');
    if (!ra || !rt) return;

    const list = (items, render) => {
        if (!items || items.length === 0) return '<p style="color:#6b7280;">No recent items</p>';
        return items.map(render).join('');
    };

    ra.innerHTML = list(recent.recent_attractions, (a) => {
        return `<div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight:700;">${a.name}</div>
            <div style="color:#6b7280; font-size:12px;">By: ${a.manager_name || 'Unknown'} • Updated: ${saFmtDate(a.updated_at)}</div>
        </div>`;
    });

    rt.innerHTML = list(recent.recent_tasks, (t) => {
        return `<div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight:700;">${t.name} <span style="color:#6b7280; font-weight:500;">(${t.type})</span></div>
            <div style="color:#6b7280; font-size:12px;">${t.attraction_name} • By: ${t.manager_name || 'Unknown'} • Updated: ${saFmtDate(t.updated_at)}</div>
        </div>`;
    });
}

function logout() {
    currentUser = null;
    sessionStorage.clear(); // Clear all session storage
    
    // Also clear any cached data
    allTasks = [];
    allGuides = [];
    allAttractions = [];
    
    // Reset the login form
    document.getElementById('loginForm').reset();
    
    // Force page reload to clear all cached state
    window.location.reload();
}

// Function to toggle the profile dropdown
function toggleProfileDropdown() {
    console.log("toggleProfileDropdown: Clicked!"); // Debug log
    const dropdown = document.getElementById('profileDropdown');
    if (!dropdown) {
        console.error("toggleProfileDropdown: Dropdown element with ID 'profileDropdown' not found!");
        return;
    }

    // Check if dropdown is currently visible
    const isVisible = dropdown.style.display === 'block';

    // Hide all dropdowns first (in case there are others)
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d !== dropdown) { // Don't hide the one we are about to toggle
            d.style.display = 'none';
            console.log("toggleProfileDropdown: Hid another dropdown:", d.id); // Debug log
        }
    });

    // If it was visible, hide it (clicking again closes it). Otherwise, show it.
    if (isVisible) {
        dropdown.style.display = 'none';
        console.log("toggleProfileDropdown: Hiding the dropdown."); // Debug log
    } else {
        // Ensure it's positioned correctly before showing
        dropdown.style.display = 'block';
        console.log("toggleProfileDropdown: Showing the dropdown."); // Debug log
    }
}

// Function to handle "Edit Profile" - Opens the modal
function editProfile() {
    console.log("editProfile: Opening modal.");
    // Close the profile dropdown menu
    document.getElementById('profileDropdown').style.display = 'none';

    const modal = document.getElementById('editProfileModal');
    const form = document.getElementById('editProfileForm');

    // Reset the form and any previous alerts
    form.reset();
    clearFormAlerts(form); // Clear alerts inside the form

    // Pre-fill the form with current user data
    if (currentUser) {
        document.getElementById('editProfileEmail').value = currentUser.email || '';
        document.getElementById('editProfileFullName').value = currentUser.full_name || '';
        // Password fields are intentionally left blank
    } else {
        console.warn("editProfile: currentUser is null or undefined.");
        showAlert('Unable to load profile data.', 'error');
        return; // Don't open modal if user data is missing
    }

    // Show the modal
    modal.classList.add('active');
}

// Function to close the Edit Profile modal
function closeEditProfileModal() {
    console.log("closeEditProfileModal: Closing modal.");
    document.getElementById('editProfileModal').classList.remove('active');
    // Optional: Clear the form when closing
    // document.getElementById('editProfileForm').reset();
}

// Function to handle the Edit Profile form submission
async function handleEditProfileSubmit(event) {
    event.preventDefault();
    console.log("handleEditProfileSubmit: Form submitted.");

    const form = event.target; // Get the form element
    const formData = new FormData(form);
    const fullName = formData.get('full_name')?.trim();
    const password = formData.get('password')?.trim();
    const confirmPassword = formData.get('confirm_password')?.trim(); // Assuming you add a name="confirm_password" to the confirm input

    // Basic client-side validation
    if (!fullName) {
        showFormAlert(form, 'Full Name is required.', 'error');
        return;
    }

    if (password && password.length < 6) {
        showFormAlert(form, 'Password must be at least 6 characters long.', 'error');
        return;
    }

    if (password && password !== confirmPassword) {
        showFormAlert(form, 'Passwords do not match.', 'error');
        return;
    }

    // Prepare data for sending to the backend
    const updateData = {
        action: 'update_profile',
        full_name: fullName,
        // Only send password if it's provided
        ...(password && { password: password })
        // Note: We don't send email as it's not editable
    };

    console.log("handleEditProfileSubmit: Sending ", updateData);

    try {
        const response = await fetch(API_BASE + 'edit_profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        console.log("handleEditProfileSubmit: Received response:", data);

        if (data.success) {
            showFormAlert(form, data.message || 'Profile updated successfully.', 'success');

            // Update the currentUser object in memory and session storage
            if (data.updated_user) {
                currentUser.full_name = data.updated_user.full_name;
                // Update session storage
                sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
                // Update the display name in the header
                document.getElementById('userNameDisplay').textContent = currentUser.full_name || currentUser.email || 'User';
            }

            // Optional: Close the modal after a short delay
            setTimeout(() => {
                closeEditProfileModal();
                // Optional: Reload dashboard stats if name affects them (unlikely)
                // loadDashboardStats();
            }, 1500); // Close after 1.5 seconds

        } else {
            showFormAlert(form, data.message || 'Error updating profile.', 'error');
        }
    } catch (error) {
        console.error("handleEditProfileSubmit: Fetch error:", error);
        showFormAlert(form, 'Connection error. Please try again.', 'error');
    }
}

// Helper function to show alerts within a specific form (similar to global showAlert)
function showFormAlert(formElement, message, type) {
    // Find or create an alert div within the form
    let alertDiv = formElement.querySelector('.form-alert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.className = 'form-alert';
        // Insert it at the top of the form, before the first child
        formElement.insertBefore(alertDiv, formElement.firstChild);
    }
    alertDiv.textContent = message;
    alertDiv.className = `form-alert ${type} active`; // Set class and make active

    // Auto-hide the alert after a few seconds (optional)
    setTimeout(() => {
        alertDiv.classList.remove('active');
    }, 5000); // Hide after 5 seconds
}

// Helper function to clear alerts within a specific form
function clearFormAlerts(formElement) {
    const alertDiv = formElement.querySelector('.form-alert');
    if (alertDiv) {
        alertDiv.classList.remove('active');
        alertDiv.textContent = ''; // Clear text
    }
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    // Add active class to the clicked link
    const activeLink = document.querySelector(`.nav-link[data-tab="${tabName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

    // Show the selected content section
    const section = document.getElementById(tabName);
    if (section) {
        section.classList.add('active');
    }

    // Load data for the tab
    if (tabName === 'dashboard') {
        // Ensure the correct dashboard is shown for the role
        if (currentUser?.role === 'superadmin') {
            showSuperadminDashboard();
        } else {
            showManagerDashboard();
        }
    } else {
        loadTabData(tabName);
    }
}

// Load tab data
function loadTabData(tabName) {
    switch (tabName) {
        case 'attractions':
            loadAttractions();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'guides':
            loadGuides();
            break;
        case 'rewards':
            loadRewards();
            break;
        case 'reports':
            loadReports();
            break;
        case 'userProgress':
            loadUserProgress();
            break;
        case 'adminUsers':
            loadAdminUsers();
            break;
        default:
            console.warn("No loader function for tab:", tabName);
    }
}


// Helper function to format time ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
}

// Toggle chart period function
function toggleChartPeriod(period) {
    currentChartPeriod = period;
    
    // Update button styles
    const btn7Days = document.getElementById('toggle7Days');
    const btn30Days = document.getElementById('toggle30Days');
    
    if (period === 7) {
        btn7Days.style.background = '#5E35B1';
        btn7Days.style.color = '#fff';
        btn30Days.style.background = '#E0E0E0';
        btn30Days.style.color = '#666';
    } else {
        btn7Days.style.background = '#E0E0E0';
        btn7Days.style.color = '#666';
        btn30Days.style.background = '#5E35B1';
        btn30Days.style.color = '#fff';
    }
    
    // Reload dashboard stats with new period
    loadDashboardStats();
}

// Load Recent Changes for Managers
async function loadManagerRecentChanges() {
    try {
        const response = await fetch(API_BASE + 'audit_log.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_recent_changes', limit: 20 })
        });

        const data = await response.json();
        console.log('Recent Changes API Response:', data);

        const container = document.getElementById('recentChangesContainer');
        
        if (data.success && data.data.changes && data.data.changes.length > 0) {
            const changes = data.data.changes;
            
            let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
            
            changes.forEach(change => {
                const actionIcon = {
                    'create': '<i class="fas fa-plus-circle" style="color: #10b981;"></i>',
                    'update': '<i class="fas fa-edit" style="color: #3b82f6;"></i>',
                    'delete': '<i class="fas fa-trash-alt" style="color: #ef4444;"></i>'
                };
                
                const entityIcon = {
                    'attraction': '<i class="fas fa-map-marker-alt"></i>',
                    'task': '<i class="fas fa-tasks"></i>',
                    'guide': '<i class="fas fa-book"></i>',
                    'reward': '<i class="fas fa-trophy"></i>'
                };
                
                const actionColor = {
                    'create': '#10b981',
                    'update': '#3b82f6',
                    'delete': '#ef4444'
                };
                
                const timeAgo = getTimeAgo(change.created_at);
                
                html += `
                    <div style="background: #f8f9fa; border-left: 4px solid ${actionColor[change.action_type] || '#6b7280'}; padding: 12px 16px; border-radius: 8px; transition: all 0.2s ease;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                ${actionIcon[change.action_type] || ''}
                                <span style="font-weight: 700; color: #1f2937; text-transform: capitalize;">${change.action_type}</span>
                                ${entityIcon[change.entity_type] || ''}
                                <span style="color: #6b7280; font-weight: 500;">${change.entity_type}</span>
                            </div>
                            <span style="color: #9ca3af; font-size: 12px; white-space: nowrap;">${timeAgo}</span>
                        </div>
                        <div style="margin-left: 0px;">
                            <div style="color: #374151; font-weight: 600; margin-bottom: 4px;">${change.entity_name || 'Unknown'}</div>
                            ${change.attraction_name ? `<div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;"><i class="fas fa-map-marker-alt" style="font-size: 11px;"></i> ${change.attraction_name}</div>` : ''}
                            ${change.changes_summary ? `<div style="color: #6b7280; font-size: 13px; font-style: italic;">${change.changes_summary}</div>` : ''}
                            <div style="color: #9ca3af; font-size: 12px; margin-top: 6px;">
                                <i class="fas fa-user-shield"></i> by ${change.admin_name || 'Superadmin'}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                    <i class="fas fa-history" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px; margin: 0;">No recent changes found</p>
                    <p style="font-size: 13px; margin-top: 8px;">Changes made by superadmins to your attractions will appear here</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recent changes:', error);
        const container = document.getElementById('recentChangesContainer');
        
        // Check if it's a table not exists error
        if (data && !data.success && data.message && data.message.includes('does not exist')) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #f59e0b;">
                    <i class="fas fa-info-circle" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <p>Recent Changes feature is not set up yet.</p>
                    <p style="font-size: 13px; margin-top: 8px;">Please contact your administrator to run the setup script.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <p>Error loading recent changes. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Dashboard stats (Modified to also load the chart)
async function loadDashboardStats() {
    try {
        const response = await fetch(API_BASE + `dashboard_stats.php?action=get_stats&period=${currentChartPeriod}`);

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('loadDashboardStats: Non-JSON response from server:', response.status, responseText);
            alert(`Error loading dashboard stats (HTTP ${response.status}). Check server logs.`);
            return;
        }

        console.log('Dashboard API Response:', data); // Debug log

        if (data.success) {
            document.getElementById('totalAttractions').textContent = data.stats.attractions;
            document.getElementById('totalTasks').textContent = data.stats.tasks;
            document.getElementById('totalUsers').textContent = data.stats.users;
            document.getElementById('pendingReports').textContent = data.stats.pending_reports;

            // Hide pending approvals card as it's no longer applicable
            document.getElementById('pendingApprovalsCard').style.display = 'none';

            // Populate engagement metrics
            document.getElementById('activeUsersToday').textContent = data.stats.active_users_today;
            document.getElementById('activeUsersWeek').textContent = data.stats.active_users_week;
            document.getElementById('completionRate').textContent = data.stats.completion_rate + '%';
            document.getElementById('avgTimeSpent').textContent = data.stats.avg_time_minutes + ' min';

            // Display alerts
            const alertsContainer = document.getElementById('alertsContainer');
            if (data.stats.alerts && data.stats.alerts.length > 0) {
                alertsContainer.style.display = 'block';
                alertsContainer.innerHTML = '';
                data.stats.alerts.forEach(alert => {
                    const alertDiv = document.createElement('div');
                    alertDiv.style.cssText = 'padding: 15px; background: #ff9800; color: #1e1e1e; border-radius: 8px; margin-bottom: 10px; font-weight: bold;';
                    alertDiv.innerHTML = `⚠️ ${alert.message}`;
                    alertsContainer.appendChild(alertDiv);
                });
            } else {
                alertsContainer.style.display = 'none';
            }

            // Display recent reports
            const recentReportsContainer = document.getElementById('recentReportsContainer');
            if (data.stats.recent_reports && data.stats.recent_reports.length > 0) {
                recentReportsContainer.innerHTML = '';
                data.stats.recent_reports.forEach(report => {
                    const reportItem = document.createElement('div');
                    reportItem.style.cssText = 'padding: 10px; border-bottom: 1px solid #3a3a3a; margin-bottom: 8px;';
                    
                    const timeAgo = getTimeAgo(report.created_at);
                    const attractionInfo = report.attraction_name ? `<span style="color: #888;"> - ${report.attraction_name}</span>` : '';
                    
                    reportItem.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="color: #4a9eff; font-weight: bold;">${report.report_type}</div>
                                <div style="color: #ccc; font-size: 13px; margin-top: 3px;">${report.description.substring(0, 60)}${report.description.length > 60 ? '...' : ''}</div>
                                <div style="color: #888; font-size: 12px; margin-top: 5px;">By: ${report.user_name || 'Unknown'}${attractionInfo}</div>
                            </div>
                            <div style="color: #888; font-size: 11px; white-space: nowrap;">${timeAgo}</div>
                        </div>
                    `;
                    recentReportsContainer.appendChild(reportItem);
                });
            } else {
                recentReportsContainer.innerHTML = '<p style="color: #888;">No recent reports</p>';
            }

            // Display recent task completions
            const recentCompletionsContainer = document.getElementById('recentCompletionsContainer');
            if (data.stats.recent_completions && data.stats.recent_completions.length > 0) {
                recentCompletionsContainer.innerHTML = '';
                data.stats.recent_completions.forEach(completion => {
                    const completionItem = document.createElement('div');
                    completionItem.style.cssText = 'padding: 10px; border-bottom: 1px solid #3a3a3a; margin-bottom: 8px;';
                    
                    const timeAgo = getTimeAgo(completion.submitted_at);
                    const attractionInfo = completion.attraction_name ? `<span style="color: #888;"> - ${completion.attraction_name}</span>` : '';
                    
                    // Task type emoji
                    let typeEmoji = '✅';
                    if (completion.task_type === 'quiz') typeEmoji = '📝';
                    if (completion.task_type === 'checkin') typeEmoji = '📍';
                    if (completion.task_type === 'observation_match') typeEmoji = '👁️';
                    if (completion.task_type === 'count_confirm') typeEmoji = '🔢';
                    if (completion.task_type === 'direction') typeEmoji = '🧭';
                    if (completion.task_type === 'time_based') typeEmoji = '⏱️';
                    
                    completionItem.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="color: #4a9eff; font-weight: bold;">${typeEmoji} ${completion.task_title}</div>
                                <div style="color: #888; font-size: 12px; margin-top: 5px;">By: ${completion.user_name || 'Unknown'}${attractionInfo}</div>
                            </div>
                            <div style="color: #888; font-size: 11px; white-space: nowrap;">${timeAgo}</div>
                        </div>
                    `;
                    recentCompletionsContainer.appendChild(completionItem);
                });
            } else {
                recentCompletionsContainer.innerHTML = '<p style="color: #888;">No recent completions</p>';
            }

            // Update chart titles based on period
            document.getElementById('taskCompletionChartTitle').textContent = `Task Completions (Last ${currentChartPeriod} Days)`;
            document.getElementById('userActivityChartTitle').textContent = `Active Users (Last ${currentChartPeriod} Days)`;
            
            // Render charts
            renderTaskCompletionChart(data.stats.task_completion_chart);
            renderUserActivityChart(data.stats.user_activity_chart);
            renderEngagementScatterChart(data.stats);
            renderAttractionBubbleChart(data.stats);
            
            // Render leaderboard
            renderLeaderboard(data.stats.leaderboard);
        } else {
            console.error('Dashboard API returned success=false:', data);
            alert('Error loading dashboard: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        alert('Error loading dashboard: ' + error.message);
    }
}

// Function to render Task Completion Chart (Area Chart)
function renderTaskCompletionChart(chartData) {
    const ctx = document.getElementById('taskCompletionChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (taskCompletionChartInstance) {
        taskCompletionChartInstance.destroy();
    }
    
    taskCompletionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Task Completions',
                data: chartData.data,
                backgroundColor: 'rgba(94, 53, 177, 0.2)',
                borderColor: '#5E35B1',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#5E35B1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    titleColor: '#e0e0e0',
                    bodyColor: '#ccc',
                    borderColor: '#5E35B1',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Completions: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#888',
                        stepSize: 1
                    },
                    grid: {
                        color: '#E0E0E0',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: '#E0E0E0',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// Function to render User Activity Chart (Radar Chart)
function renderUserActivityChart(chartData) {
    const ctx = document.getElementById('userActivityChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (userActivityChartInstance) {
        userActivityChartInstance.destroy();
    }
    
    userActivityChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Daily Activity',
                data: chartData.data,
                backgroundColor: 'rgba(46, 125, 50, 0.2)',
                borderColor: '#2E7D32',
                borderWidth: 3,
                pointBackgroundColor: '#2E7D32',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#2E7D32',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    titleColor: '#e0e0e0',
                    bodyColor: '#ccc',
                    borderColor: '#2E7D32',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Active Users: ' + context.parsed.r;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        color: '#888',
                        backdropColor: 'transparent',
                        stepSize: 1
                    },
                    grid: {
                        color: '#E0E0E0'
                    },
                    angleLines: {
                        color: '#E0E0E0'
                    },
                    pointLabels: {
                        color: '#555',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Function to render Engagement Scatter Chart
function renderEngagementScatterChart(statsData) {
    const ctx = document.getElementById('engagementScatterChart');
    if (!ctx) return; // Chart element doesn't exist
    
    // Destroy existing chart if it exists
    if (engagementScatterChartInstance) {
        engagementScatterChartInstance.destroy();
    }
    
    // Create scatter data from leaderboard (users)
    const scatterData = (statsData.leaderboard || []).map((user, index) => ({
        x: user.task_count || 0,
        y: user.points || 0,
        label: user.name
    }));
    
    engagementScatterChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Users',
                data: scatterData,
                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                borderColor: '#2196F3',
                borderWidth: 2,
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    titleColor: '#e0e0e0',
                    bodyColor: '#ccc',
                    borderColor: '#2196F3',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const point = scatterData[context.dataIndex];
                            return [
                                point.label,
                                `Tasks: ${point.x}`,
                                `Points: ${point.y}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tasks Completed',
                        color: '#555',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#888',
                        stepSize: 1
                    },
                    grid: {
                        color: '#E0E0E0',
                        drawBorder: false
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Points Earned',
                        color: '#555',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: '#E0E0E0',
                        drawBorder: false
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to render Attraction Bubble Chart
function renderAttractionBubbleChart(statsData) {
    const ctx = document.getElementById('attractionBubbleChart');
    if (!ctx) return; // Chart element doesn't exist
    
    // Destroy existing chart if it exists
    if (attractionBubbleChartInstance) {
        attractionBubbleChartInstance.destroy();
    }
    
    // Mock data - in reality this should come from API
    // For now, we'll create bubbles based on leaderboard data
    const bubbleData = (statsData.leaderboard || []).slice(0, 8).map((user, index) => ({
        x: index + 1,
        y: user.task_count || 0,
        r: (user.points || 0) / 5, // Bubble size based on points
        label: user.name
    }));
    
    const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)',
        'rgba(83, 102, 255, 0.6)'
    ];
    
    attractionBubbleChartInstance = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'User Activity',
                data: bubbleData,
                backgroundColor: bubbleData.map((_, i) => colors[i % colors.length])
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const point = bubbleData[context.dataIndex];
                            return [
                                point.label,
                                `Tasks: ${point.y}`,
                                `Points: ${Math.round(point.r * 5)}`,
                                'Bubble size = points'
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'User Rank',
                        color: '#555',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#888',
                        stepSize: 1
                    },
                    grid: {
                        color: '#E0E0E0',
                        drawBorder: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Tasks Completed',
                        color: '#555',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: '#E0E0E0',
                        drawBorder: false
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to render Leaderboard
function renderLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboardContainer');
    
    if (!leaderboard || leaderboard.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">No users found yet</p>';
        return;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    leaderboard.forEach((user, index) => {
        // Medal emojis for top 3
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        else medal = `${index + 1}.`;
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #F5F5F5; border-radius: 6px; border: 1px solid #E0E0E0;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px; min-width: 30px;">${medal}</span>
                    <span style="color: #333; font-weight: bold;">${user.name}</span>
                </div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <div style="text-align: right;">
                        <div style="color: #1976D2; font-weight: bold;">${user.task_count}</div>
                        <div style="color: #666; font-size: 12px;">Tasks</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #F57C00; font-weight: bold;">${user.points}</div>
                        <div style="color: #666; font-size: 12px;">Points</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Helper function for navigation (used by Quick Actions)
// The dashboard uses tab IDs like: dashboard, attractions, tasks, guides, rewards, reports, userProgress, adminUsers
// Some Quick Actions call showSection('users') etc. Provide a compatibility wrapper.
function showSection(section) {
    const map = {
        users: 'userProgress', // "Check User Activity"
        userProgress: 'userProgress',
        reports: 'reports',
        dashboard: 'dashboard',
        attractions: 'attractions',
        tasks: 'tasks',
        guides: 'guides',
        rewards: 'rewards',
        adminUsers: 'adminUsers'
    };

    const tab = map[section] || section;
    if (typeof switchTab === 'function') {
        switchTab(tab);
    } else {
        console.warn('showSection: switchTab() not found. Requested:', section);
    }
}

function navigateTo(section) {
    showSection(section);
}

// Attractions functions
async function loadAttractions() {
    showTableLoading('attractionsTable'); // Show loading before fetch
    try {
        const response = await fetch(API_BASE + 'attractions.php?action=list');
        const data = await response.json();

        const tbody = document.getElementById('attractionsTable');
        if (data.success && data.attractions.length > 0) {
            allAttractions = data.attractions;
            displayAttractions(allAttractions);
        } else if (data.success && data.attractions.length === 0) {
             // Handle case where the backend returned success but the list is empty
             allAttractions = [];
             tbody.innerHTML = '<tr><td colspan="6">No attractions found.</td></tr>';
        } else {
            // Handle backend errors
             console.error("Error loading attractions:", data.message);
             showAlert(data.message || 'Error loading attractions', 'error');
             tbody.innerHTML = `<tr><td colspan="6">Error: ${data.message || 'Unknown error'}</td></tr>`;
        }
    } catch (error) {
        // Handle network/fetch errors
        console.error("Fetch error in loadAttractions:", error);
        showAlert('Connection error while loading attractions. Please try again.', 'error');
        const tbody = document.getElementById('attractionsTable');
        allAttractions = [];
        tbody.innerHTML = '<tr><td colspan="6">Connection error.</td></tr>';
    }
}

// Helper function to fetch attractions list (for use in other functions)
async function fetchAttractionsList() {
    try {
        const response = await fetch(API_BASE + 'attractions.php?action=list');
        const data = await response.json();
        if (data.success && data.attractions) {
            return data.attractions;
        } else {
            console.error("Error fetching attractions list:", data.message);
            return [];
        }
    } catch (error) {
        console.error("Fetch error in fetchAttractionsList:", error);
        return [];
    }
}

function displayAttractions(attractions) {
    const tbody = document.getElementById('attractionsTable');
    if (!tbody) return;

    // Apply superadmin-selected sort
    let list = Array.isArray(attractions) ? [...attractions] : [];
    if (currentUser?.role === 'superadmin') {
        list = sortAttractions(list);
    }

    if (list.length > 0) {
        tbody.innerHTML = list.map(attr => `
            <tr>
                <td>${attr.id}</td>
                <td>${attr.name}</td>
                <td>${attr.location}</td>
                <td>${(attr.description || '').substring(0, 50)}...</td>
                <td>${attr.image ? `<img src="${attr.image}" alt="Attraction Image" style="max-width: 50px; max-height: 50px;">` : 'No Image'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editAttraction(${attr.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteAttraction(${attr.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="6">No attractions found.</td></tr>';
    }
}

function sortAttractions(attractions) {
    const sortValue = document.getElementById('attractionSortBy')?.value || '';

    const idAsc = (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0);

    switch (sortValue) {
        case 'name_asc':
            return attractions.sort((a, b) => {
                const cmp = String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
                return cmp !== 0 ? cmp : idAsc(a, b);
            });
        case 'name_desc':
            return attractions.sort((a, b) => {
                const cmp = String(b.name || '').localeCompare(String(a.name || ''), undefined, { sensitivity: 'base' });
                return cmp !== 0 ? cmp : idAsc(a, b);
            });
        case 'id_asc':
            return attractions.sort(idAsc);
        case 'id_desc':
            return attractions.sort((a, b) => idAsc(b, a));
        default:
            return attractions;
    }
}

function applyAttractionSort() {
    displayAttractions(allAttractions);
}

async function openAttractionModal(id = null) {
    if (id) {
        // Don't reset form when editing - load data FIRST, then show modal
        await loadAttractionData(id);
    } else {
        // Reset form only when adding new attraction
        document.getElementById('attractionForm').reset();
        document.getElementById('attractionModalTitle').textContent = 'Add Attraction';
        // Clear all fields for new attraction
        document.getElementById('attractionId').value = '';
        document.getElementById('attractionLatitude').value = '';
        document.getElementById('attractionLongitude').value = '';
        document.getElementById('attractionNavigationLink').value = '';
        document.getElementById('attractionImageFile').value = '';
        document.getElementById('attractionImage').value = '';
        document.getElementById('currentAttractionImageContainer').style.display = 'none';
    }
    
    // Show modal AFTER data is loaded
    document.getElementById('attractionModal').classList.add('active');
}

async function loadAttractionData(id) {
    try {
        const response = await fetch(API_BASE + `attractions.php?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('attractionModalTitle').textContent = 'Edit Attraction';
            document.getElementById('attractionId').value = data.attraction.id;
            document.getElementById('attractionName').value = data.attraction.name;
            document.getElementById('attractionLocation').value = data.attraction.location;
            document.getElementById('attractionLatitude').value = data.attraction.latitude || '';
            document.getElementById('attractionLongitude').value = data.attraction.longitude || '';
            document.getElementById('attractionDescription').value = data.attraction.description;
            document.getElementById('attractionNavigationLink').value = data.attraction.navigation_link || '';
            const existingImagePath = data.attraction.image || '';
            document.getElementById('attractionImage').value = existingImagePath; // Set hidden field

            if (existingImagePath) {
                document.getElementById('currentAttractionImage').src = existingImagePath; // Set preview image src
                document.getElementById('currentAttractionImageContainer').style.display = 'block'; // Show preview container
            } else {
                document.getElementById('currentAttractionImageContainer').style.display = 'none'; // Hide if no existing image
            }
            // Clear the file input if it was previously selected
            document.getElementById('attractionImageFile').value = '';
        }
    } catch (error) {
        showAlert('Error loading attraction data', 'error');
    }
}

function closeAttractionModal() {
    document.getElementById('attractionModal').classList.remove('active');
}

async function handleAttractionSubmit(e) {
    console.log('=== handleAttractionSubmit CALLED ===');
    e.preventDefault();
    const id = document.getElementById('attractionId').value;
    const name = document.getElementById('attractionName').value;
    const location = document.getElementById('attractionLocation').value;
    const latitude = document.getElementById('attractionLatitude').value;
    const longitude = document.getElementById('attractionLongitude').value;
    const description = document.getElementById('attractionDescription').value;
    const navigationLink = document.getElementById('attractionNavigationLink').value;
    
    console.log('Form values:', { id, name, location, latitude, longitude });

    // Validate coordinates if provided
    let lat = null;
    let lng = null;
    
    // Check if coordinates are actually provided (not empty strings)
    const hasLatitude = latitude && latitude.trim() !== '';
    const hasLongitude = longitude && longitude.trim() !== '';
    
    if (hasLatitude || hasLongitude) {
        // If one is provided, both must be provided
        if (!hasLatitude || !hasLongitude) {
            showAlert('Please enter both latitude and longitude, or leave both empty', 'error');
            return;
        }

        lat = parseFloat(latitude);
        lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            showAlert('Invalid coordinates. Please enter valid numbers', 'error');
            return;
        }

        if (lat < -90 || lat > 90) {
            showAlert('Latitude must be between -90 and 90', 'error');
            return;
        }

        if (lng < -180 || lng > 180) {
            showAlert('Longitude must be between -180 and 180', 'error');
            return;
        }
    }

    // Upload image if selected
    let image_path = null;
    if (document.getElementById('attractionImageFile').files[0]) { // Assume new file input added to form
        image_path = await uploadFile('attractionImageFile');
        if (image_path === null) {
            // Upload failed, stop submission
            return;
        }
    } else {
        // If no new file selected, use the existing image URL from the hidden field (if editing)
        image_path = document.getElementById('attractionImage').value; // This should hold the existing path if editing
    }


    // Basic navigation link validation (optional field)
    const navLinkTrimmed = (navigationLink || '').trim();
    if (navLinkTrimmed) {
        // Accept typical absolute URLs only
        try {
            const url = new URL(navLinkTrimmed);
            if (!url.protocol || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
                showAlert('Navigation link must start with http:// or https://', 'error');
                return;
            }
        } catch (e) {
            showAlert('Navigation link must be a valid URL', 'error');
            return;
        }
    }

    const formData = {
        name: name,
        location: location,
        description: description,
        navigation_link: navLinkTrimmed || null,
        image: image_path // Use the uploaded path or existing path
    };

    // Only add coordinates if they are provided
    if (lat !== null && lng !== null) {
        formData.latitude = lat;
        formData.longitude = lng;
    }

    const requestData = {
        action: id ? 'update' : 'create',
        id: id || undefined,
        ...formData
    };

    console.log('Sending to backend:', requestData);

    try {
        const response = await fetch(API_BASE + 'attractions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert(id ? 'Attraction updated successfully' : 'Attraction added successfully', 'success');
            closeAttractionModal();
            loadAttractions();
            loadDashboardStats();

            // --- CRITICAL: Update currentUser object if a new attraction was created ---
            if (!id) { // Only update if this was a CREATE action
                 // Get the new attraction ID from the response
                 const newAttractionId = data.id; // Assuming the PHP script returns the new ID like {'id': 123}

                 if (newAttractionId) {
                     // Update the global currentUser object
                     if (currentUser) {
                         currentUser.attraction_id = newAttractionId;
                         console.log("handleAttractionSubmit: Updated currentUser.attraction_id to:", newAttractionId);
                     }
                     // Update the stored session data
                     sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
                 } else {
                     console.warn("handleAttractionSubmit: New attraction ID not returned by backend.");
                 }
            }
            // --- End of Update currentUser ---

        } else {
            showAlert(data.message || 'Error saving attraction', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

function editAttraction(id) {
    openAttractionModal(id);
}

async function deleteAttraction(id) {
    if (!confirm('Are you sure you want to delete this attraction?')) return;

    try {
        const response = await fetch(API_BASE + 'attractions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Attraction deleted successfully', 'success');
            loadAttractions();
            loadDashboardStats();
        } else {
            showAlert(data.message || 'Error deleting attraction', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Tasks functions
async function loadTasks() {
    showTableLoading('tasksTable'); // Show loading before fetch
    try {
        const response = await fetch(API_BASE + 'tasks.php?action=list');
        const data = await response.json();

        const tbody = document.getElementById('tasksTable');
        if (data.success && data.tasks.length > 0) {
            allTasks = data.tasks; // Store all tasks for filtering
            displayTasks(allTasks);
        } else if (data.success && data.tasks.length === 0) {
             // Handle case where the backend returned success but the list is empty
             allTasks = [];
             tbody.innerHTML = '<tr><td colspan="5">No tasks found.</td></tr>';
        } else {
            // Handle backend errors
             console.error("Error loading tasks:", data.message);
             showAlert(data.message || 'Error loading tasks', 'error');
             tbody.innerHTML = `<tr><td colspan="5">Error: ${data.message || 'Unknown error'}</td></tr>`;
        }
    } catch (error) {
        // Handle network/fetch errors
        console.error("Fetch error in loadTasks:", error);
        showAlert('Connection error while loading tasks. Please try again.', 'error');
        const tbody = document.getElementById('tasksTable');
        tbody.innerHTML = '<tr><td colspan="5">Connection error.</td></tr>';
    }
}

// Helper function to display tasks
function displayTasks(tasks) {
    const tbody = document.getElementById('tasksTable');
    if (tasks.length > 0) {
        tbody.innerHTML = tasks.map(task => `
            <tr>
                <td>${task.id}</td>
                <td>${task.name}</td>
                <td>${task.attraction_name || 'N/A'}</td>
                <td>${task.type}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTask(${task.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5">No tasks match the filter criteria.</td></tr>';
    }
}

// Apply task filters
function applyTaskFilters() {
    const searchTerm = (document.getElementById('taskSearchInput')?.value || '').toLowerCase();

    let filteredTasks = allTasks;

    // Filter by search term (task name)
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            (task.name || '').toLowerCase().includes(searchTerm)
        );
    }

    // Filter by attraction (for superadmins)
    if (currentUser?.role === 'superadmin') {
        const attractionFilter = document.getElementById('taskAttractionFilter')?.value || '';
        if (attractionFilter) {
            filteredTasks = filteredTasks.filter(task =>
                String(task.attraction_id || '') === String(attractionFilter)
            );
        }
    }

    // Filter by task type (for everyone - both managers and superadmins)
    const typeFilter = (document.getElementById('taskTypeFilter')?.value || '').toLowerCase();
    if (typeFilter) {
        filteredTasks = filteredTasks.filter(task =>
            (task.type || '').toLowerCase() === typeFilter
        );
    }

    displayTasks(filteredTasks);
}

// Clear task filters
function clearTaskFilters() {
    const searchInput = document.getElementById('taskSearchInput');
    if (searchInput) searchInput.value = '';

    if (currentUser?.role === 'superadmin') {
        const attractionSelect = document.getElementById('taskAttractionFilter');
        if (attractionSelect) attractionSelect.value = '';
    } else {
        const typeSelect = document.getElementById('taskTypeFilter');
        if (typeSelect) typeSelect.value = '';
    }

    displayTasks(allTasks);
}

async function openTaskModal(id = null) {
    await loadAttractionDropdown('taskAttraction');

    if (id) {
        // Don't reset form when editing - load data FIRST, then show modal
        await loadTaskData(id);
    } else {
        // Reset form only when adding new task
        document.getElementById('taskForm').reset();
        // Clear quiz questions
        document.getElementById('quizQuestionsList').innerHTML = '';
        document.getElementById('quizQuestionsSection').style.display = 'none';
        document.getElementById('qrActionsContainer').style.display = 'none';
        
        document.getElementById('taskModalTitle').textContent = 'Add Task';
        // Ensure this is a CREATE flow: clear hidden taskId if present
        const taskIdInput = document.getElementById('taskId');
        if (taskIdInput) taskIdInput.value = '';
        // Clear QR and media inputs
        document.getElementById('taskQRString').value = '';
        document.getElementById('taskMediaFile').value = '';
        document.getElementById('currentQRContainer').style.display = 'none';
        document.getElementById('currentMediaContainer').style.display = 'none';
        document.getElementById('downloadQRBtn').disabled = true;
    }
    
    // Show modal AFTER data is loaded
    document.getElementById('taskModal').classList.add('active');
}

function handleTaskTypeChange() {
    const taskType = document.getElementById('taskType').value;
    const quizSection = document.getElementById('quizQuestionsSection');
    const countConfirmSection = document.getElementById('countConfirmSection');
    const directionSection = document.getElementById('directionSection');
    const timeBasedSection = document.getElementById('timeBasedSection');
    const qrActionsContainer = document.getElementById('qrActionsContainer');
    let observationMatchSection = document.getElementById('observationMatchSection');

    // Hide all task-specific sections first
    quizSection.style.display = 'none';
    if (countConfirmSection) countConfirmSection.style.display = 'none';
    if (directionSection) directionSection.style.display = 'none';
    if (timeBasedSection) timeBasedSection.style.display = 'none';
    if (qrActionsContainer) qrActionsContainer.style.display = 'none';
    if (observationMatchSection) observationMatchSection.style.display = 'none';
    
    // Show relevant section based on task type
    if (taskType === 'observation_match') {
        if (!observationMatchSection) {
            const sectionHTML = renderObservationMatchSection();
            const taskForm = document.getElementById('taskForm');
            const submitBtn = taskForm.querySelector('button[type="submit"]');
            submitBtn.insertAdjacentHTML('beforebegin', sectionHTML);
            observationMatchSection = document.getElementById('observationMatchSection');
        }
        observationMatchSection.style.display = 'block';
        if (document.getElementById('observationQuestionsList').children.length === 0) {
            observationQuestionCounter = 0;
            addObservationMatchQuestion();
        }
    } else if (taskType === 'quiz') {
        quizSection.style.display = 'block';
        // Add at least one question by default
        if (document.getElementById('quizQuestionsList').children.length === 0) {
            addQuizQuestion();
        }
    } else if (taskType === 'count_confirm') {
        if (countConfirmSection) countConfirmSection.style.display = 'block';
    } else if (taskType === 'direction') {
        if (directionSection) directionSection.style.display = 'block';
    } else if (taskType === 'time_based') {
        if (timeBasedSection) timeBasedSection.style.display = 'block';
    } else if (taskType === 'checkin') {
        if (qrActionsContainer) qrActionsContainer.style.display = 'block';
    }
}

let questionCounter = 0;
let matchPairCounter = 0;
let observationQuestionCounter = 0;

function addObservationMatchQuestion() {
    observationQuestionCounter++;
    const list = document.getElementById('observationQuestionsList');
    if (!list) return;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'observation-question';
    questionDiv.id = `observation-question-${observationQuestionCounter}`;
    questionDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #1a202c; border-radius: 5px; border: 1px solid #4a5568;';

    questionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h5 style="color: #e0e0e0; margin: 0;">Observable Item ${observationQuestionCounter}</h5>
            <button type="button" class="btn" onclick="removeObservationMatchQuestion(${observationQuestionCounter})" 
                    style="background: #ef4444; padding: 5px 10px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="form-group">
            <label>Observable Item*</label>
            <textarea class="observation-question-text" required style="background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568;"></textarea>
        </div>
        <div class="form-group">
            <label>Answer Options (select the correct answer)</label>
            <div class="observation-options" id="observation-options-${observationQuestionCounter}">
                ${createObservationOptionHTML(observationQuestionCounter, 1)}
                ${createObservationOptionHTML(observationQuestionCounter, 2)}
                ${createObservationOptionHTML(observationQuestionCounter, 3)}
                ${createObservationOptionHTML(observationQuestionCounter, 4)}
            </div>
        </div>
    `;

    list.appendChild(questionDiv);
}

function createObservationOptionHTML(questionNum, optionNum) {
    return `
        <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
            <input type="radio" name="observation-correct-${questionNum}" value="${optionNum}" 
                   style="width: auto;">
            <input type="text" class="observation-option" placeholder="Option ${optionNum}" required
                   style="flex: 1; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 8px; border-radius: 4px;">
        </div>
    `;
}

function removeObservationMatchQuestion(id) {
    const questionDiv = document.getElementById(`observation-question-${id}`);
    if (questionDiv) {
        questionDiv.remove();
    }
}

function addQuizQuestion() {
    questionCounter++;
    const questionsList = document.getElementById('quizQuestionsList');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';
    questionDiv.id = `question-${questionCounter}`;
    questionDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #1a202c; border-radius: 5px; border: 1px solid #4a5568;';
    
    questionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h5 style="color: #e0e0e0; margin: 0;">Question ${questionCounter}</h5>
            <button type="button" class="btn" onclick="removeQuizQuestion(${questionCounter})" 
                    style="background: #ef4444; padding: 5px 10px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="form-group">
            <label>Question Text*</label>
            <textarea class="quiz-question-text" required style="background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568;"></textarea>
        </div>
        <div class="form-group">
            <label>Answer Options (check the correct answer)</label>
            <div class="quiz-options" id="options-${questionCounter}">
                ${createOptionHTML(questionCounter, 1)}
                ${createOptionHTML(questionCounter, 2)}
                ${createOptionHTML(questionCounter, 3)}
                ${createOptionHTML(questionCounter, 4)}
            </div>
        </div>
    `;
    
    questionsList.appendChild(questionDiv);
}

// ============================================
// OBSERVATION MATCH TASK FUNCTIONS
// ============================================

function addObservationMatchOption() {
    matchPairCounter++;
    const matchPairsList = document.getElementById('matchPairsList');
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'match-pair observation-option';
    optionDiv.id = `match-pair-${matchPairCounter}`;
    optionDiv.dataset.pairId = matchPairCounter;
    optionDiv.style.cssText = 'margin-bottom: 10px; padding: 12px; background: #1a202c; border-radius: 8px; border: 2px solid #4a5568;';
    
    optionDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="flex-shrink: 0;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #9ca3af;">
                    <input type="checkbox" class="observation-correct-checkbox" onchange="updateObservationMatchCount()"
                           style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="font-size: 12px;">Correct</span>
                </label>
            </div>
            <input type="text" class="match-item-text observation-option-text" placeholder="Option ${matchPairCounter} - e.g., A golden dragon statue" 
                   style="flex: 1; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 10px; border-radius: 4px;">
            <button type="button" class="btn" onclick="removeObservationMatchOption(${matchPairCounter})" 
                    style="background: #ef4444; padding: 8px 12px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    matchPairsList.appendChild(optionDiv);
    updateObservationMatchCount();
}

function removeObservationMatchOption(id) {
    const optionDiv = document.getElementById(`match-pair-${id}`);
    if (optionDiv) {
        optionDiv.remove();
        updateObservationMatchCount();
    }
}

function updateObservationMatchCount() {
    const checkboxes = document.querySelectorAll('.observation-correct-checkbox:checked');
    const countSpan = document.getElementById('matchPairCount');
    if (countSpan) {
        countSpan.textContent = checkboxes.length;
        countSpan.style.color = checkboxes.length >= 2 ? '#10b981' : '#ef4444';
    }
}

// Legacy function kept for backwards compatibility
function addMatchPair() {
    addObservationMatchOption();
}

function _legacyAddMatchPair() {
    matchPairCounter++;
    const matchPairsList = document.getElementById('matchPairsList');
    
    const pairDiv = document.createElement('div');
    pairDiv.className = 'match-pair';
    pairDiv.id = `match-pair-${matchPairCounter}`;
    pairDiv.dataset.pairId = matchPairCounter;
    pairDiv.style.cssText = 'margin-bottom: 15px; padding: 15px; background: #1a202c; border-radius: 8px; border: 2px solid #4a5568;';
    
    pairDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h5 style="color: #e0e0e0; margin: 0; display: flex; align-items: center; gap: 8px;">
                <span style="background: #5E35B1; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Pair ${matchPairCounter}</span>
            </h5>
            <button type="button" class="btn" onclick="removeMatchPair(${matchPairCounter})" 
                    style="background: #ef4444; padding: 5px 10px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group" style="margin-bottom: 0;">
                <label style="color: #10b981; font-weight: 600;">
                    <i class="fas fa-eye"></i> Observable Item*
                </label>
                <input type="text" class="match-item-text" placeholder="e.g., 🐉 Dragon carving on pillars" required
                       style="background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 10px; border-radius: 4px;">
                <small style="color: #9ca3af; font-size: 11px;">Use emojis 🏛️ or text descriptions</small>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label style="color: #3b82f6; font-weight: 600;">
                    <i class="fas fa-info-circle"></i> Meaning/Function*
                </label>
                <input type="text" class="match-function-text" placeholder="e.g., Symbolizes imperial power" required
                       style="background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 10px; border-radius: 4px;">
                <small style="color: #9ca3af; font-size: 11px;">Cultural/historical explanation</small>
            </div>
        </div>
    `;
    
    matchPairsList.appendChild(pairDiv);
    updateMatchPairCount();
}

function removeMatchPair(id) {
    const pairDiv = document.getElementById(`match-pair-${id}`);
    if (pairDiv) {
        pairDiv.remove();
        updateMatchPairCount();
    }
}

function updateMatchPairCount() {
    const countSpan = document.getElementById('matchPairCount');
    const pairCount = document.querySelectorAll('.match-pair').length;
    if (countSpan) {
        countSpan.textContent = pairCount;
        // Update color based on count
        if (pairCount < 3) {
            countSpan.style.color = '#ef4444'; // Red - need more
        } else if (pairCount <= 8) {
            countSpan.style.color = '#10b981'; // Green - good
        } else {
            countSpan.style.color = '#f59e0b'; // Orange - too many
        }
    }
}

function collectMatchPairs() {
    // Check if this is the new observation match format (with checkboxes)
    const observationOptions = document.querySelectorAll('.observation-option');
    
    if (observationOptions.length > 0) {
        // New format: collect options with is_correct flag
        const options = [];
        let optionOrder = 0;
        
        observationOptions.forEach((optionDiv) => {
            const optionText = optionDiv.querySelector('.observation-option-text').value.trim();
            const isCorrect = optionDiv.querySelector('.observation-correct-checkbox')?.checked || false;
            
            if (optionText) {
                options.push({
                    option_text: optionText,
                    is_correct: isCorrect,
                    option_order: optionOrder++
                });
            }
        });
        
        return options;
    }
    
    // Legacy format: match pairs (item + function)
    const pairs = [];
    const pairDivs = document.querySelectorAll('.match-pair:not(.observation-option)');
    
    pairDivs.forEach((pairDiv) => {
        const pairId = parseInt(pairDiv.dataset.pairId);
        const itemText = pairDiv.querySelector('.match-item-text')?.value?.trim();
        const functionText = pairDiv.querySelector('.match-function-text')?.value?.trim();
        
        if (itemText && functionText) {
            pairs.push({
                pair_id: pairId,
                item_text: itemText,
                function_text: functionText
            });
        }
    });
    
    return pairs;
}

function renderObservationMatchSection() {
    return `
        <div id="observationMatchSection" style="display: none; margin-top: 20px;">
            <div style="background: #1e293b; border-radius: 8px; padding: 20px; border: 2px solid #5E35B1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h4 style="color: #e0e0e0; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-eye" style="color: #5E35B1;"></i>
                            Observation Match - Multiple Choice
                        </h4>
                        <p style="color: #9ca3af; font-size: 13px; margin: 5px 0 0 0;">
                            Add observable items, each with answer options. This is a dedicated section (not the Quiz modal).
                        </p>
                    </div>
                </div>

                <div style="background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
                    <p style="color: #93c5fd; font-size: 13px; margin: 0;">
                        <i class="fas fa-info-circle"></i> <strong>Guidelines:</strong>
                        Add at least one observable item and choose the correct answer for each.
                    </p>
                </div>

                <div id="observationQuestionsList"></div>
                <button type="button" class="btn" onclick="addObservationMatchQuestion()" 
                        style="background: #3b82f6; color: white; margin-top: 10px; width: 100%;">
                    <i class="fas fa-plus"></i> Add Observable Item
                </button>
            </div>
        </div>
    `;
}

function createOptionHTML(questionNum, optionNum) {
    return `
        <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
            <input type="radio" name="correct-${questionNum}" value="${optionNum}" 
                   style="width: auto;">
            <input type="text" class="quiz-option" placeholder="Option ${optionNum}" required
                   style="flex: 1; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 8px; border-radius: 4px;">
        </div>
    `;
}

function removeQuizQuestion(id) {
    const questionDiv = document.getElementById(`question-${id}`);
    if (questionDiv) {
        questionDiv.remove();
    }
}

// Task & Guide Quiz Functions
let taskAndGuideQuestionCounter = 0;

function handleTaskAndGuideTypeChange() {
    const taskType = document.getElementById('taskAndGuideTaskType').value;
    const quizSection = document.getElementById('taskAndGuideQuizSection');
    const countConfirmSection = document.getElementById('taskAndGuideCountConfirmSection');
    const directionSection = document.getElementById('taskAndGuideDirectionSection');
    const timeBasedSection = document.getElementById('taskAndGuideTimeBasedSection');
    const observationMatchSection = document.getElementById('taskAndGuideObservationMatchSection');
    // Obsolete task type sections removed: riddle, memory_recall, route_completion, photo
    const guideTitleInput = document.getElementById('taskAndGuideGuideTitle');
    const guideContentInput = document.getElementById('taskAndGuideGuideContent');
    const guideTitleLabel = document.getElementById('guideTitleLabel');
    const guideContentLabel = document.getElementById('guideContentLabel');
    const guideInfoHeader = document.getElementById('guideInfoHeader');
    
    // Hide all task-specific sections first
    if (quizSection) quizSection.style.display = 'none';
    if (countConfirmSection) countConfirmSection.style.display = 'none';
    if (directionSection) directionSection.style.display = 'none';
    if (timeBasedSection) timeBasedSection.style.display = 'none';
    if (observationMatchSection) observationMatchSection.style.display = 'none';
    // Obsolete sections cleanup removed (memoryRecallSection, routeCompletionSection, riddleSection)
    
    // Show the relevant section based on task type
    switch (taskType) {
        case 'quiz':
            if (quizSection) {
                quizSection.style.display = 'block';
                // Add at least one question by default
                if (document.getElementById('taskAndGuideQuizList').children.length === 0) {
                    addTaskAndGuideQuizQuestion();
                }
            }
            break;
        case 'count_confirm':
            if (countConfirmSection) countConfirmSection.style.display = 'block';
            break;
        case 'direction':
            if (directionSection) directionSection.style.display = 'block';
            break;
        case 'observation_match':
            if (observationMatchSection) {
                observationMatchSection.style.display = 'block';
                if (document.getElementById('taskAndGuideObservationQuestionsList').children.length === 0) {
                    taskAndGuideObservationQuestionCounter = 0;
                    addTaskAndGuideObservationMatchQuestion();
                }
            }
            break;
        case 'time_based':
            if (timeBasedSection) {
                timeBasedSection.style.display = 'block';
            }
            break;
    }
    
    // Handle guide requirements
    if (taskType === 'quiz') {
        // Make guide optional for quiz
        if (guideTitleInput) guideTitleInput.removeAttribute('required');
        if (guideContentInput) guideContentInput.removeAttribute('required');
        if (guideTitleLabel) guideTitleLabel.textContent = 'Guide Title (Optional)';
        if (guideContentLabel) guideContentLabel.textContent = 'Guide Content (Optional)';
        if (guideInfoHeader) guideInfoHeader.innerHTML = 'Guide Information <span style="color: #9ca3af; font-size: 14px;">(Optional for Quiz)</span>';
    } else {
        // Make guide required for other types
        if (guideTitleInput) guideTitleInput.setAttribute('required', 'required');
        if (guideContentInput) guideContentInput.setAttribute('required', 'required');
        if (guideTitleLabel) guideTitleLabel.textContent = 'Guide Title*';
        if (guideContentLabel) guideContentLabel.textContent = 'Guide Content*';
        if (guideInfoHeader) guideInfoHeader.textContent = 'Guide Information';
    }
}

function addTaskAndGuideQuizQuestion() {
    taskAndGuideQuestionCounter++;
    const questionsList = document.getElementById('taskAndGuideQuizList');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'taskguide-quiz-question';
    questionDiv.id = `taskguide-question-${taskAndGuideQuestionCounter}`;
    questionDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #1a202c; border-radius: 5px; border: 1px solid #4a5568;';
    
    questionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h5 style="color: #e0e0e0; margin: 0;">Question ${taskAndGuideQuestionCounter}</h5>
            <button type="button" class="btn" onclick="removeTaskAndGuideQuizQuestion(${taskAndGuideQuestionCounter})" 
                    style="background: #ef4444; padding: 5px 10px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="form-group">
            <label>Question Text*</label>
            <textarea class="taskguide-quiz-question-text" required style="background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568;"></textarea>
        </div>
        <div class="form-group">
            <label>Answer Options (check the correct answer)</label>
            <div class="taskguide-quiz-options">
                ${createTaskAndGuideOptionHTML(taskAndGuideQuestionCounter, 1)}
                ${createTaskAndGuideOptionHTML(taskAndGuideQuestionCounter, 2)}
                ${createTaskAndGuideOptionHTML(taskAndGuideQuestionCounter, 3)}
                ${createTaskAndGuideOptionHTML(taskAndGuideQuestionCounter, 4)}
            </div>
        </div>
    `;
    
    questionsList.appendChild(questionDiv);
}

function createTaskAndGuideOptionHTML(questionNum, optionNum) {
    return `
        <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
            <input type="radio" name="taskguide-correct-${questionNum}" value="${optionNum}" 
                   style="width: auto;">
            <input type="text" class="taskguide-quiz-option" placeholder="Option ${optionNum}" required
                   style="flex: 1; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 8px; border-radius: 4px;">
        </div>
    `;
}

function removeTaskAndGuideQuizQuestion(id) {
    const questionDiv = document.getElementById(`taskguide-question-${id}`);
    if (questionDiv) {
        questionDiv.remove();
    }
}

// Task & Guide Modal - Observation Match helper functions
let taskAndGuideMatchPairCounter = 0;
let taskAndGuideObservationQuestionCounter = 0;

function addTaskAndGuideObservationMatchQuestion() {
    taskAndGuideObservationQuestionCounter++;
    const list = document.getElementById('taskAndGuideObservationQuestionsList');
    if (!list) return;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'taskguide-observation-question';
    questionDiv.id = `taskguide-observation-question-${taskAndGuideObservationQuestionCounter}`;
    questionDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #1a202c; border-radius: 5px; border: 1px solid #4a5568;';

    questionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h5 style="color: #e0e0e0; margin: 0;">Observable Item ${taskAndGuideObservationQuestionCounter}</h5>
            <button type="button" class="btn" onclick="removeTaskAndGuideObservationMatchQuestion(${taskAndGuideObservationQuestionCounter})" 
                    style="background: #ef4444; padding: 5px 10px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        <div class="form-group">
            <label>Observable Item*</label>
            <textarea class="taskguide-observation-question-text" required style="background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568;"></textarea>
        </div>
        <div class="form-group">
            <label>Answer Options (select the correct answer)</label>
            <div class="taskguide-observation-options" id="taskguide-observation-options-${taskAndGuideObservationQuestionCounter}">
                ${createTaskAndGuideObservationOptionHTML(taskAndGuideObservationQuestionCounter, 1)}
                ${createTaskAndGuideObservationOptionHTML(taskAndGuideObservationQuestionCounter, 2)}
                ${createTaskAndGuideObservationOptionHTML(taskAndGuideObservationQuestionCounter, 3)}
                ${createTaskAndGuideObservationOptionHTML(taskAndGuideObservationQuestionCounter, 4)}
            </div>
        </div>
    `;

    list.appendChild(questionDiv);
}

function createTaskAndGuideObservationOptionHTML(questionNum, optionNum) {
    return `
        <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
            <input type="radio" name="taskguide-observation-correct-${questionNum}" value="${optionNum}" 
                   style="width: auto;">
            <input type="text" class="taskguide-observation-option" placeholder="Option ${optionNum}" required
                   style="flex: 1; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 8px; border-radius: 4px;">
        </div>
    `;
}

function removeTaskAndGuideObservationMatchQuestion(id) {
    const questionDiv = document.getElementById(`taskguide-observation-question-${id}`);
    if (questionDiv) {
        questionDiv.remove();
    }
}

function addTaskAndGuideObservationMatchOption() {
    taskAndGuideMatchPairCounter++;
    const matchPairsList = document.getElementById('taskAndGuideMatchPairsList');
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'match-pair taskguide-observation-option';
    optionDiv.id = `taskguide-match-pair-${taskAndGuideMatchPairCounter}`;
    optionDiv.dataset.pairId = taskAndGuideMatchPairCounter;
    optionDiv.style.cssText = 'margin-bottom: 10px; padding: 12px; background: #1a202c; border-radius: 8px; border: 2px solid #4a5568;';
    
    optionDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="flex-shrink: 0;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #9ca3af;">
                    <input type="checkbox" class="taskguide-observation-correct-checkbox" onchange="updateTaskAndGuideObservationMatchCount()"
                           style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="font-size: 12px;">Correct</span>
                </label>
            </div>
            <input type="text" class="taskguide-observation-option-text" placeholder="Option ${taskAndGuideMatchPairCounter} - e.g., A golden dragon statue" 
                   style="flex: 1; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 10px; border-radius: 4px;">
            <button type="button" class="btn" onclick="removeTaskAndGuideObservationMatchOption(${taskAndGuideMatchPairCounter})" 
                    style="background: #ef4444; padding: 8px 12px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    matchPairsList.appendChild(optionDiv);
    updateTaskAndGuideObservationMatchCount();
}

function removeTaskAndGuideObservationMatchOption(id) {
    const optionDiv = document.getElementById(`taskguide-match-pair-${id}`);
    if (optionDiv) {
        optionDiv.remove();
        updateTaskAndGuideObservationMatchCount();
    }
}

function updateTaskAndGuideObservationMatchCount() {
    const checkboxes = document.querySelectorAll('.taskguide-observation-correct-checkbox:checked');
    const countSpan = document.getElementById('taskAndGuideMatchPairCount');
    if (countSpan) {
        countSpan.textContent = checkboxes.length;
        countSpan.style.color = checkboxes.length >= 2 ? '#10b981' : '#ef4444';
    }
}

function collectTaskAndGuideObservationMatchOptions() {
    const options = [];
    let optionOrder = 0;
    
    const observationOptions = document.querySelectorAll('.taskguide-observation-option');
    observationOptions.forEach((optionDiv) => {
        const optionText = optionDiv.querySelector('.taskguide-observation-option-text').value.trim();
        const isCorrect = optionDiv.querySelector('.taskguide-observation-correct-checkbox')?.checked || false;
        
        if (optionText) {
            options.push({
                option_text: optionText,
                is_correct: isCorrect,
                option_order: optionOrder++
            });
        }
    });
    
    return options;
}

// Task & Guide Modal - Route Completion helper functions
let taskAndGuideRouteCheckpointCounter = 0;

function addTaskAndGuideRouteCheckpoint() {
    taskAndGuideRouteCheckpointCounter++;
    const checkpointsList = document.getElementById('taskAndGuideRouteCheckpoints');
    
    const checkpointDiv = document.createElement('div');
    checkpointDiv.className = 'taskguide-route-checkpoint';
    checkpointDiv.id = `taskguide-checkpoint-${taskAndGuideRouteCheckpointCounter}`;
    checkpointDiv.style.cssText = 'margin-bottom: 10px; padding: 12px; background: #1a202c; border-radius: 8px; border: 1px solid #4a5568;';
    
    checkpointDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #9ca3af; font-weight: bold;">${taskAndGuideRouteCheckpointCounter}.</span>
            <input type="text" class="taskguide-checkpoint-name" placeholder="Checkpoint name (e.g., Main Gate)" 
                   style="flex: 1; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 10px; border-radius: 4px;">
            <input type="text" class="taskguide-checkpoint-qr" placeholder="QR Code" 
                   style="width: 150px; background: #2d3748; color: #e0e0e0; border: 1px solid #4a5568; padding: 10px; border-radius: 4px;">
            <button type="button" class="btn" onclick="removeTaskAndGuideRouteCheckpoint(${taskAndGuideRouteCheckpointCounter})" 
                    style="background: #ef4444; padding: 8px 12px; font-size: 12px; width: auto; min-width: auto;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    checkpointsList.appendChild(checkpointDiv);
}

function removeTaskAndGuideRouteCheckpoint(id) {
    const checkpointDiv = document.getElementById(`taskguide-checkpoint-${id}`);
    if (checkpointDiv) {
        checkpointDiv.remove();
    }
}

function collectTaskAndGuideRouteCheckpoints() {
    const checkpoints = [];
    let order = 0;
    
    const checkpointDivs = document.querySelectorAll('.taskguide-route-checkpoint');
    checkpointDivs.forEach((div) => {
        const name = div.querySelector('.taskguide-checkpoint-name').value.trim();
        const qr = div.querySelector('.taskguide-checkpoint-qr').value.trim();
        
        if (name) {
            checkpoints.push({
                name: name,
                qr_code: qr,
                order: order++
            });
        }
    });
    
    return checkpoints;
}

async function loadTaskData(id) {
    try {
        const response = await fetch(API_BASE + `tasks.php?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
            // Debug logging
            console.log('=== EDIT TASK DATA ===');
            console.log('Task Type:', data.task.type);
            console.log('Task Questions:', data.task.questions);
            console.log('Task Config:', data.task.task_config);
            console.log('======================');
            
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('taskId').value = data.task.id;
            document.getElementById('taskName').value = data.task.name;
            document.getElementById('taskAttraction').value = data.task.attraction_id;
            document.getElementById('taskType').value = data.task.type;
            document.getElementById('taskDescription').value = data.task.description;
            
            // Handle QR code
            const existingQRCode = data.task.qr_code || '';
            document.getElementById('taskQRString').value = existingQRCode;

            if (existingQRCode) {
                showQRPreview(existingQRCode); // This will show deep link since taskId exists
                document.getElementById('downloadQRBtn').disabled = false;
            } else {
                document.getElementById('currentQRContainer').style.display = 'none';
                document.getElementById('downloadQRBtn').disabled = true;
            }
            
            // Show QR actions if check-in type
            if (data.task.type === 'checkin') {
                document.getElementById('qrActionsContainer').style.display = 'block';
            }
            
            // Handle media
            const existingMediaPath = data.task.media_url || '';
            document.getElementById('taskMedia').value = existingMediaPath;

            if (existingMediaPath) {
                document.getElementById('currentMedia').src = existingMediaPath;
                document.getElementById('currentMediaContainer').style.display = 'block';
            } else {
                document.getElementById('currentMediaContainer').style.display = 'none';
            }
            
            // Clear media file input
            document.getElementById('taskMediaFile').value = '';
            
            // Trigger task type change to show relevant sections FIRST
            handleTaskTypeChange();
            
            // Load quiz questions from data.task.questions (separate from task_config)
            if (data.task.type === 'quiz' && data.task.questions && data.task.questions.length > 0) {
                console.log('Loading quiz questions...');
                const questionsList = document.getElementById('quizQuestionsList');
                questionsList.innerHTML = ''; // Clear existing
                questionCounter = 0; // Reset the counter used by addQuizQuestion
                
                data.task.questions.forEach((q, index) => {
                    console.log(`Adding question ${index + 1}:`, q.question_text);
                    addQuizQuestion(); // This increments questionCounter
                });
                
                // Now populate the data after all questions are added (use setTimeout to ensure DOM is ready)
                setTimeout(() => {
                    const questionDivs = questionsList.querySelectorAll('.quiz-question');
                    console.log(`Found ${questionDivs.length} question divs`);
                    
                    data.task.questions.forEach((q, index) => {
                        const questionDiv = questionDivs[index];
                        if (!questionDiv) {
                            console.error(`Question div ${index} not found`);
                            return;
                        }
                        
                        console.log(`Populating question ${index + 1}:`, q.question_text);
                        
                        // Find the textarea within this question div
                        const questionTextarea = questionDiv.querySelector('.quiz-question-text');
                        if (questionTextarea) {
                            questionTextarea.value = q.question_text || '';
                            console.log(`Set question text for #${index + 1}`);
                        } else {
                            console.error(`Question textarea not found for #${index + 1}`);
                        }
                        
                        // Find all option inputs within this question div
                        const optionInputs = questionDiv.querySelectorAll('.quiz-option');
                        const options = q.options || [];
                        console.log(`Question ${index + 1} has ${optionInputs.length} option inputs, ${options.length} option data`);
                        
                        // Populate each option
                        optionInputs.forEach((input, optIndex) => {
                            if (options[optIndex]) {
                                input.value = options[optIndex].option_text || '';
                                console.log(`Set option ${optIndex + 1}: ${options[optIndex].option_text}`);
                            }
                        });
                        
                        // Find which option is correct and check the radio button
                        const correctIndex = options.findIndex(opt => opt.is_correct == 1);
                        if (correctIndex >= 0) {
                            const radioButtons = questionDiv.querySelectorAll('input[type="radio"]');
                            if (radioButtons[correctIndex]) {
                                radioButtons[correctIndex].checked = true;
                                console.log(`Set correct answer for #${index + 1}: Option ${correctIndex + 1}`);
                            }
                        }
                    });
                    console.log('Finished loading quiz questions');
                }, 100); // 100ms delay to ensure DOM is ready
            }
            
            // Load direction questions from data.task.questions (same structure as observation match)
            if (data.task.type === 'direction') {
                // Always clear direction fields first
                const directionQuestionInput = document.getElementById('directionQuestion');
                const directionInput = document.getElementById('directionCorrect');
                
                if (directionQuestionInput) directionQuestionInput.value = '';
                if (directionInput) directionInput.value = '';
                console.log('Cleared direction fields');
                
                if (data.task.questions && data.task.questions.length > 0) {
                    console.log('Loading direction questions...');
                    const question = data.task.questions[0]; // Direction tasks have only 1 question
                
                if (question && question.options) {
                    console.log('Direction question:', question.question_text);
                    console.log('Direction options:', question.options);
                    
                    // Set the direction question text
                    const directionQuestionInput = document.getElementById('directionQuestion');
                    if (directionQuestionInput) {
                        directionQuestionInput.value = question.question_text || '';
                        console.log('Set direction question:', question.question_text);
                    }
                    
                    // Find the correct direction option
                    const correctOption = question.options.find(opt => opt.is_correct == 1);
                    if (correctOption) {
                        const directionInput = document.getElementById('directionCorrect');
                        if (directionInput) {
                            directionInput.value = correctOption.option_text;
                            console.log('Set direction:', correctOption.option_text);
                        } else {
                            console.error('directionCorrect input not found');
                        }
                    }
                } // Close if (question && question.options)
            } // Close if (data.task.questions && data.task.questions.length > 0)
            else {
                console.log('No direction questions found for this task');
            }
        } // Close if (data.task.type === 'direction')
            
            // Load observation match questions from data.task.questions
            if (data.task.type === 'observation_match') {
                const observationsList = document.getElementById('observationQuestionsList');
                observationsList.innerHTML = ''; // Clear existing FIRST, regardless of question count
                observationQuestionCounter = 0;
                
                if (data.task.questions && data.task.questions.length > 0) {
                    console.log('Loading observation match questions...');
                
                data.task.questions.forEach((q, index) => {
                    console.log(`Adding observation ${index + 1}:`, q.question_text);
                    addObservationMatchQuestion();
                });
                
                // Now populate the data after all observations are added (use setTimeout to ensure DOM is ready)
                setTimeout(() => {
                    const observationDivs = observationsList.querySelectorAll('.observation-question');
                    console.log(`Found ${observationDivs.length} observation divs`);
                    
                    data.task.questions.forEach((q, index) => {
                        const observationDiv = observationDivs[index];
                        if (!observationDiv) {
                            console.error(`Observation div ${index} not found`);
                            return;
                        }
                        
                        console.log(`Populating observation ${index + 1}:`, q.question_text);
                        
                        // Find the textarea within this observation div
                        const observationTextarea = observationDiv.querySelector('.observation-question-text');
                        if (observationTextarea) {
                            observationTextarea.value = q.question_text || '';
                            console.log(`Set observation text for #${index + 1}`);
                        } else {
                            console.error(`Observation textarea not found for #${index + 1}`);
                        }
                        
                        // Find all option inputs within this observation div
                        const optionInputs = observationDiv.querySelectorAll('.observation-option');
                        const options = q.options || [];
                        console.log(`Observation ${index + 1} has ${optionInputs.length} option inputs, ${options.length} option data`);
                        
                        // Populate each option
                        optionInputs.forEach((input, optIndex) => {
                            if (options[optIndex]) {
                                input.value = options[optIndex].option_text || '';
                                console.log(`Set observation option ${optIndex + 1}: ${options[optIndex].option_text}`);
                            }
                        });
                        
                        // Find which option is correct and check the radio button
                        const correctIndex = options.findIndex(opt => opt.is_correct == 1);
                        if (correctIndex >= 0) {
                            const radioButtons = observationDiv.querySelectorAll('input[type="radio"]');
                            if (radioButtons[correctIndex]) {
                                radioButtons[correctIndex].checked = true;
                                console.log(`Set correct observation answer for #${index + 1}: Option ${correctIndex + 1}`);
                            }
                        }
                    });
                    console.log('Finished loading observation match questions');
                }, 100); // 100ms delay to ensure DOM is ready
            } // Close if (data.task.questions && data.task.questions.length > 0)
            else {
                console.log('No observation match questions found for this task');
            }
        } // Close if (data.task.type === 'observation_match')
            
        // Clear and populate count_confirm fields
            if (data.task.type === 'count_confirm') {
                console.log('Processing count_confirm task...');
                // Always clear fields first, regardless of task_config
                const targetObjectInput = document.getElementById('countTargetObject');
                const correctCountInput = document.getElementById('countCorrectCount');
                const toleranceInput = document.getElementById('countTolerance');
                
                console.log('Found inputs:', {targetObjectInput, correctCountInput, toleranceInput});
                
                if (targetObjectInput) targetObjectInput.value = '';
                if (correctCountInput) correctCountInput.value = '';
                if (toleranceInput) toleranceInput.value = '0';
                
                console.log('Cleared all count_confirm fields');
                
                // Then populate with data if task_config exists
                if (data.task.task_config) {
                    console.log('task_config exists:', data.task.task_config);
                    console.log('task_config type:', typeof data.task.task_config);
                    try {
                        let taskConfig = JSON.parse(data.task.task_config);
                        console.log('First parse result:', JSON.stringify(taskConfig));
                        console.log('First parse type:', typeof taskConfig);
                        
                        // Check if it's still a string (double-encoded), parse again
                        if (typeof taskConfig === 'string') {
                            console.log('task_config is double-encoded, parsing again...');
                            taskConfig = JSON.parse(taskConfig);
                            console.log('Second parse result:', JSON.stringify(taskConfig));
                        }
                        
                        console.log('taskConfig.target_object:', taskConfig.target_object);
                        console.log('taskConfig.correct_count:', taskConfig.correct_count);
                        
                        console.log('Checking target_object:', taskConfig.target_object, 'Input exists:', !!targetObjectInput);
                        if (taskConfig.target_object && targetObjectInput) {
                            targetObjectInput.value = taskConfig.target_object;
                            console.log('Set target object:', taskConfig.target_object);
                        } else {
                            console.log('Skipped target_object');
                        }
                        
                        console.log('Checking correct_count:', taskConfig.correct_count, 'Input exists:', !!correctCountInput);
                        if (taskConfig.correct_count && correctCountInput) {
                            correctCountInput.value = taskConfig.correct_count;
                            console.log('Set correct count:', taskConfig.correct_count);
                        } else {
                            console.log('Skipped correct_count');
                        }
                        
                        console.log('Checking tolerance:', taskConfig.tolerance, 'Input exists:', !!toleranceInput);
                        if (taskConfig.tolerance && toleranceInput) {
                            toleranceInput.value = taskConfig.tolerance;
                            console.log('Set tolerance:', taskConfig.tolerance);
                        } else {
                            console.log('Skipped tolerance');
                        }
                    } catch (e) {
                        console.error('Failed to parse count_confirm task_config:', e);
                    }
                }
            }
            
            // Populate task_config fields for other task types AFTER sections are visible
            if (data.task.task_config) {
                try {
                    const taskConfig = JSON.parse(data.task.task_config);
                    
                    // For direction tasks
                    if (data.task.type === 'direction' && taskConfig.correct_direction) {
                        const directionInput = document.getElementById('directionCorrectDirection');
                        if (directionInput) {
                            directionInput.value = taskConfig.correct_direction;
                            console.log('Set correct direction:', taskConfig.correct_direction);
                        } else {
                            console.error('directionCorrectDirection input not found');
                        }
                    }
                    
                    // For time_based tasks
                    if (data.task.type === 'time_based' && taskConfig.start_time && taskConfig.end_time) {
                        // Remove seconds if present (convert HH:mm:ss to HH:mm for time input)
                        const startTime = taskConfig.start_time.substring(0, 5);
                        const endTime = taskConfig.end_time.substring(0, 5);
                        
                        document.getElementById('timeStartTime').value = startTime;
                        document.getElementById('timeEndTime').value = endTime;
                        if (taskConfig.min_duration) {
                            document.getElementById('timeMinDuration').value = taskConfig.min_duration;
                        }
                    }
                    
                } catch (parseError) {
                    console.error('Failed to parse task_config:', parseError);
                }
            } // Close if (data.task.task_config)
        } // Close if (data.success)
    } catch (error) {
        showAlert('Error loading task data', 'error');
    }
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    console.log('🔍🔍🔍 handleTaskSubmit called! Version: 2026-01-29 06:43');
    const id = document.getElementById('taskId').value;
    console.log('🔍 Task ID:', id);
    const name = document.getElementById('taskName').value;
    const attraction_id = document.getElementById('taskAttraction').value;
    const type = document.getElementById('taskType').value;
    const description = document.getElementById('taskDescription').value;
    
    // Get QR code token from input field
    const qr_code_input = document.getElementById('taskQRString').value || null;

    // Upload general media if selected (e.g., for photo tasks)
    let media_path = null;
    if (document.getElementById('taskMediaFile') && document.getElementById('taskMediaFile').files[0]) { // Assume new file input for media
        media_path = await uploadFile('taskMediaFile');
        if (media_path === null) {
            // Upload failed, stop submission
            return;
        }
    } else {
        // If no new media selected, use the existing media URL from the hidden field (if editing)
        media_path = document.getElementById('taskMedia').value; // This should hold the existing path if editing
    }

    const formData = {
        name: name,
        attraction_id: attraction_id,
        type: type,
        description: description,
        qr_code: qr_code_input, // Use the QR path (uploaded or existing)
        media_url: media_path  // Use the media path (uploaded or existing)
    };
    
    // If quiz type, collect quiz questions
    if (type === 'quiz') {
        const questions = [];
        const questionDivs = document.querySelectorAll('.quiz-question');
        
        questionDivs.forEach((questionDiv, index) => {
            const questionText = questionDiv.querySelector('.quiz-question-text').value;
            const optionInputs = questionDiv.querySelectorAll('.quiz-option');
            const correctRadio = questionDiv.querySelector('input[type="radio"]:checked');
            
            if (!correctRadio) {
                showAlert(`Please select the correct answer for Question ${index + 1}`, 'error');
                throw new Error('Missing correct answer');
            }
            
            const options = [];
            optionInputs.forEach((optionInput, optIndex) => {
                if (optionInput.value.trim()) {
                    options.push({
                        option_text: optionInput.value,
                        is_correct: correctRadio.value == (optIndex + 1) ? 1 : 0
                    });
                }
            });
            
            if (questionText && options.length >= 2) {
                questions.push({
                    question_text: questionText,
                    options: options
                });
            }
        });
        
        if (questions.length === 0) {
            showAlert('Please add at least one question for the quiz', 'error');
            return;
        }
        
        formData.questions = questions;
    }
    
    // If observation_match type, collect questions from dedicated section
    if (type === 'observation_match') {
        const questions = [];
        const questionDivs = document.querySelectorAll('.observation-question');

        questionDivs.forEach((questionDiv, index) => {
            const questionText = questionDiv.querySelector('.observation-question-text').value;
            const optionInputs = questionDiv.querySelectorAll('.observation-option');
            const correctRadio = questionDiv.querySelector('input[type="radio"]:checked');

            if (!correctRadio) {
                showAlert(`Please select the correct answer for Observable Item ${index + 1}`, 'error');
                throw new Error('Missing correct answer');
            }

            const options = [];
            optionInputs.forEach((optionInput, optIndex) => {
                if (optionInput.value.trim()) {
                    options.push({
                        option_text: optionInput.value,
                        is_correct: correctRadio.value == (optIndex + 1) ? 1 : 0
                    });
                }
            });

            if (questionText && options.length >= 2) {
                questions.push({
                    question_text: questionText,
                    options: options
                });
            }
        });

        if (questions.length === 0) {
            showAlert('Please add at least one observable item for the Observation Match task', 'error');
            return;
        }

        formData.questions = questions;
    }
    
    if (type === 'count_confirm') {
        const targetObject = document.getElementById('countTargetObject')?.value;
        const correctCount = document.getElementById('countCorrectCount')?.value;
        const tolerance = document.getElementById('countTolerance')?.value || 0;

        if (!targetObject || !correctCount) {
            showAlert('Please fill in all Count & Confirm fields', 'error');
            return;
        }

        formData['task_config'] = JSON.stringify({
            target_object: targetObject,
            correct_count: parseInt(correctCount),
            tolerance: parseInt(tolerance)
        });
    }
	
    if (type === 'direction') {
        const question = document.getElementById('directionQuestion')?.value;
        const correctDirection = document.getElementById('directionCorrect')?.value;

        if (!question || !correctDirection) {
            showAlert('Please fill in all Direction & Orientation fields', 'error');
            return;
        }

        const allDirections = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];

        const questionData = {
            question_text: question,
            question_order: 1
        };

        const optionsData = allDirections.map((dir, index) => ({
            option_text: dir,
            is_correct: dir === correctDirection ? 1 : 0,
            option_order: index + 1
        }));

        formData['questions'] = [questionData];
        formData['options'] = optionsData;
    }
    
    if (type === 'time_based') {
        const startTime = document.getElementById('timeStartTime')?.value;
        const endTime = document.getElementById('timeEndTime')?.value;
        const minDuration = document.getElementById('timeMinDuration')?.value || 10;
        
        if (!startTime || !endTime) {
            showAlert('Please fill in start and end times', 'error');
            return;
        }
        
        // Send as time_config object (not task_config string) - backend will convert to task_config
        const normalizedStartTime = startTime.length === 5 ? startTime + ':00' : startTime;
        const normalizedEndTime = endTime.length === 5 ? endTime + ':00' : endTime;
        
        formData['time_config'] = {
            start_time: normalizedStartTime,
            end_time: normalizedEndTime,
            min_duration: parseInt(minDuration)
        };
    }

    try {
        const payload = {
            action: id ? 'update' : 'create',
            id: id || undefined,
            ...formData
        };
        console.log('🔍 SENDING PAYLOAD:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(API_BASE + 'tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('handleTaskSubmit: Non-JSON response from server:', response.status, responseText);
            showAlert(`Server returned an invalid response (HTTP ${response.status}). Check server logs.`, 'error');
            return;
        }

        if (data.success) {
            // If creating a new task, update the currentEditingTaskId and form
            if (!id && data.id) {
                currentEditingTaskId = data.id;
                document.getElementById('taskId').value = data.id;
                console.log('handleTaskSubmit: New task created with ID:', data.id);
                
                // Show QR generation section for checkin tasks
                if (taskType === 'checkin') {
                    const qrSection = document.getElementById('qrTokenSection');
                    if (qrSection) {
                        qrSection.style.display = 'block';
                    }
                }
            }

            showAlert(id ? 'Task updated successfully' : 'Task added successfully', 'success');
            
            // Close the modal after saving
            closeTaskModal();
            
            loadTasks();
            loadDashboardStats();
        } else {
            console.error('handleTaskSubmit: Server error:', data.message);
            showAlert(data.message || 'Error saving task', 'error');
        }
    } catch (error) {
        console.error('handleTaskSubmit: Network/fetch error:', error);
        showAlert('Connection error. Please try again.', 'error');
    }
}

function editTask(id) {
    openTaskModal(id);
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(API_BASE + 'tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Task deleted successfully', 'success');
            loadTasks();
            loadDashboardStats();
        } else {
            showAlert(data.message || 'Error deleting task', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Guides functions
async function loadGuides() {
    showTableLoading('guidesTable'); // Show loading before fetch
    try {
        const response = await fetch(API_BASE + 'guides.php?action=list');
        const data = await response.json();

        const tbody = document.getElementById('guidesTable');
        if (data.success && data.guides.length > 0) {
            allGuides = data.guides; // Store all guides for filtering
            displayGuides(allGuides);
        } else if (data.success && data.guides.length === 0) {
             // Handle case where the backend returned success but the list is empty
             allGuides = [];
             tbody.innerHTML = '<tr><td colspan="5">No guides found.</td></tr>';
        } else {
            // Handle backend errors
             console.error("Error loading guides:", data.message);
             showAlert(data.message || 'Error loading guides', 'error');
             tbody.innerHTML = `<tr><td colspan="5">Error: ${data.message || 'Unknown error'}</td></tr>`;
        }
    } catch (error) {
        // Handle network/fetch errors
        console.error("Fetch error in loadGuides:", error);
        showAlert('Connection error while loading guides. Please try again.', 'error');
        const tbody = document.getElementById('guidesTable');
        tbody.innerHTML = '<tr><td colspan="5">Connection error.</td></tr>';
    }
}

// Helper function to display guides
function displayGuides(guides) {
    const tbody = document.getElementById('guidesTable');
    if (guides.length > 0) {
        tbody.innerHTML = guides.map(guide => `
            <tr>
                <td>${guide.id}</td>
                <td>${guide.title}</td>
                <td>${guide.attraction_name || 'N/A'}</td>
                <td>${(guide.content || '').substring(0, 50)}...</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editGuide(${guide.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteGuide(${guide.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5">No guides match the filter criteria.</td></tr>';
    }
}

// Apply guide filters
function applyGuideFilters() {
    const searchTerm = (document.getElementById('guideSearchInput')?.value || '').toLowerCase();

    let filteredGuides = allGuides;

    // Filter by search term (title or content)
    if (searchTerm) {
        filteredGuides = filteredGuides.filter(guide =>
            ((guide.title || '').toLowerCase().includes(searchTerm)) ||
            ((guide.content || '').toLowerCase().includes(searchTerm))
        );
    }

    // Superadmin-only: Filter by attraction
    if (currentUser?.role === 'superadmin') {
        const attractionFilter = document.getElementById('guideAttractionFilter')?.value || '';
        if (attractionFilter) {
            filteredGuides = filteredGuides.filter(guide =>
                String(guide.attraction_id || '') === String(attractionFilter)
            );
        }
    }

    displayGuides(filteredGuides);
}

// Clear guide filters
function clearGuideFilters() {
    const searchInput = document.getElementById('guideSearchInput');
    if (searchInput) searchInput.value = '';

    if (currentUser?.role === 'superadmin') {
        const attractionSelect = document.getElementById('guideAttractionFilter');
        if (attractionSelect) attractionSelect.value = '';
    }

    displayGuides(allGuides);
}

async function openGuideModal(id = null) {
    await loadAttractionDropdown('guideAttraction');

    if (id) {
        // Don't reset form when editing - load data FIRST, then show modal
        await loadGuideData(id);
    } else {
        // Reset form only when adding new guide
        document.getElementById('guideForm').reset();
        document.getElementById('guideModalTitle').textContent = 'Add Guide';
    }
    
    // Show modal AFTER data is loaded
    document.getElementById('guideModal').classList.add('active');
}

async function loadGuideData(id) {
    try {
        const response = await fetch(API_BASE + `guides.php?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('guideModalTitle').textContent = 'Edit Guide';
            document.getElementById('guideId').value = data.guide.id;
            document.getElementById('guideTitle').value = data.guide.title;
            document.getElementById('guideAttraction').value = data.guide.attraction_id;
            document.getElementById('guideContent').value = data.guide.content;
            
            // Load tasks for the selected attraction and set the task value
            if (data.guide.attraction_id) {
                await loadTasksDropdown('guideTask', data.guide.attraction_id);
                if (data.guide.task_id) {
                    document.getElementById('guideTask').value = data.guide.task_id;
                }
            }
        }
    } catch (error) {
        showAlert('Error loading guide data', 'error');
    }
}

function closeGuideModal() {
    document.getElementById('guideModal').classList.remove('active');
}

async function handleGuideSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('guideId').value;
    const title = document.getElementById('guideTitle').value;
    const attraction_id = document.getElementById('guideAttraction').value;
    const task_id = document.getElementById('guideTask').value;
    const content = document.getElementById('guideContent').value;

    const formData = {
        title: title,
        attraction_id: attraction_id,
        task_id: task_id || null, // Send null if no task selected
        content: content
    };

    try {
        const response = await fetch(API_BASE + 'guides.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: id ? 'update' : 'create',
                id: id || undefined,
                ...formData
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(id ? 'Guide updated successfully' : 'Guide added successfully', 'success');
            closeGuideModal();
            loadGuides();
        } else {
            showAlert(data.message || 'Error saving guide', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

function editGuide(id) {
    openGuideModal(id);
}

async function deleteGuide(id) {
    if (!confirm('Are you sure you want to delete this guide?')) return;

    try {
        const response = await fetch(API_BASE + 'guides.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Guide deleted successfully', 'success');
            loadGuides();
        } else {
            showAlert(data.message || 'Error deleting guide', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Rewards functions
/* === OLD REWARD FUNCTIONS - REPLACED BY rewards.js ===
async function loadRewards() {
    showTableLoading('rewardsTable'); // Show loading before fetch
    try {
        const response = await fetch(API_BASE + 'rewards.php?action=list');
        const data = await response.json();

        const tbody = document.getElementById('rewardsTable');
        if (data.success && data.rewards.length > 0) {
            tbody.innerHTML = data.rewards.map(reward => `
                <tr>
                    <td>${reward.id}</td>
                    <td>${reward.title}</td>
                    <td>${reward.attraction_name || 'N/A'}</td>
                    <td>${reward.description.substring(0, 50)}...</td>
                    <td>${reward.image ? `<img src="${reward.image}" alt="Reward Image" style="max-width: 50px; max-height: 50px;">` : 'No Image'}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editReward(${reward.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteReward(${reward.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else if (data.success && data.rewards.length === 0) {
             // Handle case where the backend returned success but the list is empty
             tbody.innerHTML = '<tr><td colspan="6">No rewards found.</td></tr>';
        } else {
            // Handle backend errors
             console.error("Error loading rewards:", data.message);
             showAlert(data.message || 'Error loading rewards', 'error');
             tbody.innerHTML = `<tr><td colspan="6">Error: ${data.message || 'Unknown error'}</td></tr>`;
        }
    } catch (error) {
        // Handle network/fetch errors
        console.error("Fetch error in loadRewards:", error);
        showAlert('Connection error while loading rewards. Please try again.', 'error');
        const tbody = document.getElementById('rewardsTable');
        tbody.innerHTML = '<tr><td colspan="6">Connection error.</td></tr>';
    }
}

async function openRewardModal(id = null) {
    await loadAttractionDropdown('rewardAttraction');
    document.getElementById('rewardModal').classList.add('active');
    document.getElementById('rewardForm').reset();

    if (id) {
        loadRewardData(id);
    } else {
        document.getElementById('rewardModalTitle').textContent = 'Add Reward';
        // Clear the file input and current image preview if adding new
        document.getElementById('rewardImageFile').value = '';
        document.getElementById('currentRewardImageContainer').style.display = 'none';
    }
}

async function loadRewardData(id) {
    try {
        const response = await fetch(API_BASE + `rewards.php?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('rewardModalTitle').textContent = 'Edit Reward';
            document.getElementById('rewardId').value = data.reward.id;
            document.getElementById('rewardTitle').value = data.reward.title;
            document.getElementById('rewardAttraction').value = data.reward.attraction_id;
            document.getElementById('rewardDescription').value = data.reward.description;
            const existingImagePath = data.reward.image || '';
            document.getElementById('rewardImage').value = existingImagePath; // Set hidden field

            if (existingImagePath) {
                document.getElementById('currentRewardImage').src = existingImagePath; // Set preview image src
                document.getElementById('currentRewardImageContainer').style.display = 'block'; // Show preview container
            } else {
                document.getElementById('currentRewardImageContainer').style.display = 'none'; // Hide if no existing image
            }
            // Clear the file input if it was previously selected
            document.getElementById('rewardImageFile').value = '';
        }
    } catch (error) {
        showAlert('Error loading reward data', 'error');
    }
}

function closeRewardModal() {
    document.getElementById('rewardModal').classList.remove('active');
}

async function handleRewardSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('rewardId').value;
    const title = document.getElementById('rewardTitle').value;
    const attraction_id = document.getElementById('rewardAttraction').value;
    const description = document.getElementById('rewardDescription').value;

    // Upload image if selected
    let image_path = null;
    if (document.getElementById('rewardImageFile').files[0]) { // Assume new file input added to form
        image_path = await uploadFile('rewardImageFile');
        if (image_path === null) {
            // Upload failed, stop submission
            return;
        }
    } else {
        // If no new file selected, use the existing image URL from the hidden field (if editing)
        image_path = document.getElementById('rewardImage').value; // This should hold the existing path if editing
    }

    const formData = {
        title: title,
        attraction_id: attraction_id,
        description: description,
        image: image_path // Use the uploaded path or existing path
    };

    try {
        const response = await fetch(API_BASE + 'rewards.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: id ? 'update' : 'create',
                id: id || undefined,
                ...formData
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(id ? 'Reward updated successfully' : 'Reward added successfully', 'success');
            closeRewardModal();
            loadRewards();
        } else {
            showAlert(data.message || 'Error saving reward', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

function editReward(id) {
    openRewardModal(id);
}

async function deleteReward(id) {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
        const response = await fetch(API_BASE + 'rewards.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Reward deleted successfully', 'success');
            loadRewards();
        } else {
            showAlert(data.message || 'Error deleting reward', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}
=== END OLD REWARD FUNCTIONS === */


// Reports functions
async function loadReports() {
    showTableLoading('reportsTable'); // Show loading before fetch
    try {
        const response = await fetch(API_BASE + 'reports.php?action=list');
        const data = await response.json();

        const tbody = document.getElementById('reportsTable');
        if (data.success && data.reports.length > 0) {
            tbody.innerHTML = data.reports.map(report => `
                <tr>
                    <td>${report.id}</td>
                    <td>${report.user_name || report.user_email || report.username || 'User #' + report.user_id}</td>
                    <td>${report.attraction_name || 'General'}</td>
                    <td>${report.message.substring(0, 50)}...</td>
                    <td>${report.created_at}</td>
                    <td>${report.status || 'Pending'}</td>
                    <td>
                        <button class="action-btn view-btn" onclick="viewReport(${report.id})">View</button>
                        ${!report.replied_at ? `<button class="action-btn reply-btn" onclick="openReplyModal(${report.id})">Reply</button>` : ''}
                    </td>
                </tr>
            `).join('');
        } else if (data.success && data.reports.length === 0) {
             // Handle case where the backend returned success but the list is empty
             tbody.innerHTML = '<tr><td colspan="7">No reports found.</td></tr>';
        } else {
            // Handle backend errors
             console.error("Error loading reports:", data.message);
             showAlert(data.message || 'Error loading reports', 'error');
             tbody.innerHTML = `<tr><td colspan="7">Error: ${data.message || 'Unknown error'}</td></tr>`;
        }
    } catch (error) {
        // Handle network/fetch errors
        console.error("Fetch error in loadReports:", error);
        showAlert('Connection error while loading reports. Please try again.', 'error');
        const tbody = document.getElementById('reportsTable');
        tbody.innerHTML = '<tr><td colspan="7">Connection error.</td></tr>';
    }
}

function viewReport(id) {
    fetch(API_BASE + `reports.php?action=get&id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const userInfo = data.report.firebase_user_email || data.report.firebase_user_id;
                alert(`Report Details:\n\nUser: ${userInfo}\nAttraction: ${data.report.attraction_name}\nMessage: ${data.report.message}\n\nDate: ${data.report.created_at}`);
            }
        });
}

function openReplyModal(id) {
    document.getElementById('replyReportId').value = id;
    document.getElementById('replyModal').classList.add('active');
    document.getElementById('replyForm').reset();
}

function closeReplyModal() {
    document.getElementById('replyModal').classList.remove('active');
}

async function handleReplySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('replyReportId').value;
    const reply = document.getElementById('replyMessage').value;

    try {
        const response = await fetch(API_BASE + 'reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reply', id, reply })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Reply sent successfully', 'success');
            closeReplyModal();
            loadReports();
            loadDashboardStats();
        } else {
            showAlert(data.message || 'Error sending reply', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Admin Users functions
async function loadAdminUsers() {
    console.log("loadAdminUsers: Function called.");
    showTableLoading('adminUsersTable'); // Show loading state in the table before fetching data
    
    // Load pending password reset requests if superadmin
    if (currentUser?.role === 'superadmin') {
        loadPendingResetRequests();
    }
    
    try {
        console.log("loadAdminUsers: Fetching admin users from API...");
        const response = await fetch(API_BASE + 'admin_users.php?action=list');
        console.log("loadAdminUsers: Received response from API, status:", response.status);

        const data = await response.json();
        console.log("loadAdminUsers: Parsed JSON response:", data); // Debug log

        const tbody = document.getElementById('adminUsersTable');
        if (data.success && data.admins.length > 0) {
            console.log("loadAdminUsers: Data success, populating table...");
            // Filter out the current user from the list before displaying (assumes backend already does this, but client-side filter is safer)
            // const filteredAdmins = data.admins.filter(admin => admin.id !== currentUser.id);

            tbody.innerHTML = data.admins.map(admin => {
                // --- CRITICAL FIX: Define isCurrentUser INSIDE the map callback ---
                const isCurrentUser = admin.id === currentUser.id;
                // --- END CRITICAL FIX ---

                // Determine status display text/color based on is_active
                let statusText = admin.is_active ? 'Active' : 'Inactive';
                let statusBgColor = admin.is_active ? '#10b981' : '#ef4444'; // Green for active, red for inactive

                // Return the HTML string for this row, using the defined variable
                return `
                <tr>
                    <td>${admin.id}</td>
                    <td>${admin.full_name}</td>
                    <td>${admin.email}</td>
                    <td><span style="padding: 4px 8px; border-radius: 4px; background: ${admin.role === 'superadmin' ? '#667eea' : '#10b981'}; color: white; font-size: 12px;">${admin.role}</span></td>
                    <td>${admin.attraction_name || 'No Attraction Assigned'}</td> <!-- Display the fetched attraction name -->
                    <td>
                        <span style="padding: 4px 8px; border-radius: 4px; background: ${statusBgColor}; color: white; font-size: 12px;">${statusText}</span>
                    </td>
                    <td>${admin.last_login ? new Date(admin.last_login).toLocaleString() : '-'}</td>
                    <td>${new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="toggleAdminStatus(${admin.id})">${admin.is_active ? 'Deactivate' : 'Activate'}</button>
                        ${!isCurrentUser ? `<button class="action-btn delete-btn" onclick="deleteAdminUser(${admin.id})">Delete</button>` : ''} <!-- Use the defined variable here -->
                        ${admin.role === 'manager' ? `<button class="action-btn" onclick="resetManagerPassword(${admin.id}, '${admin.full_name.replace(/'/g, "\\'")}', '${admin.email}')" style="background: #ef4444; color: white;">Reset Password</button>` : ''}
                    </td>
                </tr>
            `;
            }).join(''); // Join the mapped array of strings into a single HTML string

        } else if (data.success && data.admins.length === 0) {
             // Handle case where the backend returned success but the list is empty (after filtering current user)
             console.log("loadAdminUsers: API returned success but list is empty.");
             tbody.innerHTML = '<tr><td colspan="8">No other admin users found.</td></tr>';
        } else {
            // Handle backend errors (e.g., API returned { success: false, message: "..." })
             console.error("loadAdminUsers: Backend error received:", data.message);
             showAlert(data.message || 'Error loading admin users', 'error');
             tbody.innerHTML = `<tr><td colspan="8">Error: ${data.message || 'Unknown error'}</td></tr>`;
        }
    } catch (error) {
        // Handle network/fetch errors (e.g., server down, connection failed)
        console.error("loadAdminUsers: Fetch or JSON parsing error:", error);
        showAlert('Connection error while loading admin users. Please try again.', 'error');
        const tbody = document.getElementById('adminUsersTable');
        tbody.innerHTML = '<tr><td colspan="8">Connection error.</td></tr>';
    }
}

async function toggleAdminStatus(id) {
    if (!confirm('Are you sure you want to change this user\'s status?')) return;

    try {
        const response = await fetch(API_BASE + 'admin_users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_status', id })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Status updated successfully', 'success');
            loadAdminUsers();
        } else {
            showAlert(data.message || 'Error updating status', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Reset manager password
async function resetManagerPassword(adminId, managerName, managerEmail) {
    const confirmed = confirm(`Are you sure you want to reset the password for ${managerName}?\n\nThis will generate a new temporary password and the manager will be required to change it on next login.`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(API_BASE + 'reset_manager_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: adminId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message with temporary password
            const tempPassword = data.temporary_password;
            alert(`✅ Password reset successfully!\n\n` +
                  `Manager: ${data.manager_name}\n` +
                  `Email: ${data.manager_email}\n\n` +
                  `Temporary Password: ${tempPassword}\n\n` +
                  `⚠️ IMPORTANT:\n` +
                  `• Please share this password with the manager securely\n` +
                  `• They will be required to change it on next login\n` +
                  `• This password cannot be recovered later`);
            
            loadAdminUsers(); // Reload the table
        } else {
            showAlert(data.message || 'Error resetting password', 'error');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Load pending password reset requests
async function loadPendingResetRequests() {
    try {
        const response = await fetch(API_BASE + 'get_reset_requests.php?status=pending');
        const data = await response.json();
        
        if (!data.success) return;
        
        const requests = data.requests || [];
        const panel = document.getElementById('pendingResetRequests');
        const count = document.getElementById('pendingCount');
        const list = document.getElementById('pendingRequestsList');
        
        if (requests.length === 0) {
            panel.style.display = 'none';
            return;
        }
        
        panel.style.display = 'block';
        count.textContent = requests.length;
        
        list.innerHTML = requests.map(req => `
            <div style="background: white; border-radius: 6px; padding: 16px; margin-bottom: 10px; border-left: 4px solid #ef4444;">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 16px; color: #1f2937; margin-bottom: 6px;">
                            ${req.manager_name}
                        </div>
                        <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
                            📧 ${req.manager_email}
                        </div>
                        <div style="color: #9ca3af; font-size: 12px; margin-bottom: 8px;">
                            ⏰ Requested: ${new Date(req.requested_at).toLocaleString()}
                        </div>
                        ${req.request_message ? `
                            <div style="margin-top: 8px; padding: 10px; background: #f9fafb; border-radius: 4px; border-left: 3px solid #d1d5db;">
                                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Message:</div>
                                <div style="font-style: italic; color: #374151; font-size: 14px;">"${req.request_message}"</div>
                            </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; gap: 8px; flex-direction: column;">
                        <button class="action-btn" onclick="approveResetRequest(${req.id}, ${req.admin_id}, '${req.manager_name.replace(/'/g, "\\'")}', '${req.manager_email}')" 
                                style="background: #10b981; color: white; white-space: nowrap; padding: 10px 20px; font-weight: 600;">
                            ✅ Approve Request
                        </button>
                        <button class="action-btn" onclick="rejectResetRequest(${req.id}, '${req.manager_name.replace(/'/g, "\\'")}')" 
                                style="background: #6b7280; color: white; white-space: nowrap; padding: 10px 20px; font-weight: 600;">
                            ❌ Reject
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading pending requests:', error);
    }
}

// Approve password reset request
async function approveResetRequest(requestId, adminId, managerName, managerEmail) {
    const confirmed = confirm(`Approve password reset request for ${managerName}?\n\n` +
                             `They will be able to set a new password on their next login attempt.`);
    if (!confirmed) return;
    
    try {
        const response = await fetch(API_BASE + 'reset_manager_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                admin_id: adminId,
                request_id: requestId,
                action: 'approve_request'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`✅ Password reset approved for ${managerName}!\n\n` +
                     `They can now set a new password on their next login attempt.`, 'success');
            
            loadPendingResetRequests(); // Reload requests
            loadAdminUsers(); // Reload admin users table
        } else {
            showAlert(data.message || 'Error approving request', 'error');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Reject password reset request
async function rejectResetRequest(requestId, managerName) {
    const reason = prompt(`Reject password reset request for ${managerName}?\n\nOptional: Enter a reason for rejection:`);
    
    // If user cancels, return
    if (reason === null) return;
    
    try {
        const response = await fetch(API_BASE + 'reject_reset_request.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                request_id: requestId,
                reason: reason || 'No reason provided'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`Request from ${managerName} has been rejected.`, 'success');
            loadPendingResetRequests(); // Reload requests
        } else {
            showAlert(data.message || 'Error rejecting request', 'error');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        showAlert('Connection error. Please try again.', 'error');
    }
}

async function deleteAdminUser(id) {
    if (!confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) return;

    try {
        const response = await fetch(API_BASE + 'admin_users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Admin user deleted successfully', 'success');
            loadAdminUsers();
        } else {
            showAlert(data.message || 'Error deleting admin user', 'error');
        }
    } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Chart instances (to destroy before recreating)
let overallProgressChart = null;
let attractionCompletionChart = null;
let progressTrendChart = null;
let userRadarChart = null;
let polarAreaChart = null;
let scatterChart = null;
let bubbleChart = null;

// User Progress functions
async function loadUserProgress() {
    showTableLoading('progressTable'); // Show loading before fetch
    try {
        const response = await fetch(API_BASE + 'progress.php?action=list');
        const data = await response.json();

        const tbody = document.getElementById('progressTable');
        if (data.success && data.progress.length > 0) {
            // Populate table
            tbody.innerHTML = data.progress.map(record => `
                <tr>
                    <td>${record.user_id}</td>
                    <td>${record.attraction_name || 'N/A'}</td>
                    <td>${record.completed_tasks}</td>
                    <td>${record.total_tasks}</td>
                    <td>${record.progress_percentage}%</td>
                    <td>${record.is_unlocked ? 'Yes' : 'No'}</td>
                    <td>${new Date(record.updated_at).toLocaleString()}</td>
                </tr>
            `).join('');
            
            // Generate charts
            createProgressCharts(data.progress);
        } else if (data.success && data.progress.length === 0) {
            // Handle case where the backend returned success but the list is empty
            tbody.innerHTML = '<tr><td colspan="7">No user progress data found.</td></tr>';
        } else {
            // Handle backend errors
            console.error("Error loading user progress:", data.message);
            showAlert(data.message || 'Error loading user progress', 'error');
            tbody.innerHTML = `<tr><td colspan="7">Error: ${data.message || 'Unknown error'}</td></tr>`;
        }
    } catch (error) {
        // Handle network/fetch errors
        console.error("Fetch error in loadUserProgress:", error);
        showAlert('Connection error while loading user progress. Please try again.', 'error');
        const tbody = document.getElementById('progressTable');
        tbody.innerHTML = '<tr><td colspan="7">Connection error.</td></tr>';
    }
}

// Create progress charts
function createProgressCharts(progressData) {
    // Calculate statistics
    const totalCompleted = progressData.reduce((sum, p) => sum + parseInt(p.completed_tasks), 0);
    const totalTasks = progressData.reduce((sum, p) => sum + parseInt(p.total_tasks), 0);
    const totalPending = totalTasks - totalCompleted;
    
    const completedAttractions = progressData.filter(p => parseFloat(p.progress_percentage) >= 100).length;
    const inProgressAttractions = progressData.filter(p => parseFloat(p.progress_percentage) > 0 && parseFloat(p.progress_percentage) < 100).length;
    const notStartedAttractions = progressData.filter(p => parseFloat(p.progress_percentage) === 0).length;
    
    // Group by user
    const userProgress = {};
    progressData.forEach(p => {
        if (!userProgress[p.user_id]) {
            userProgress[p.user_id] = { completed: 0, total: 0 };
        }
        userProgress[p.user_id].completed += parseInt(p.completed_tasks);
        userProgress[p.user_id].total += parseInt(p.total_tasks);
    });
    
    // Group by attraction (needed for multiple charts)
    const attractionProgress = {};
    progressData.forEach(p => {
        const key = p.attraction_name || 'Unknown';
        if (!attractionProgress[key]) {
            attractionProgress[key] = {
                completed: 0,
                total: 0,
                percentage: 0
            };
        }
        attractionProgress[key].completed += parseInt(p.completed_tasks);
        attractionProgress[key].total += parseInt(p.total_tasks);
    });
    
    // 1. Overall Progress Chart (Doughnut)
    const overallCtx = document.getElementById('overallProgressChart');
    if (overallProgressChart) overallProgressChart.destroy();
    overallProgressChart = new Chart(overallCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed Tasks', 'Pending Tasks'],
            datasets: [{
                data: [totalCompleted, totalPending],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = totalCompleted + totalPending;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // 2. Attraction Completion Chart (Pie)
    const attractionCtx = document.getElementById('attractionCompletionChart');
    if (attractionCompletionChart) attractionCompletionChart.destroy();
    attractionCompletionChart = new Chart(attractionCtx, {
        type: 'pie',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [completedAttractions, inProgressAttractions, notStartedAttractions],
                backgroundColor: ['#4CAF50', '#2196F3', '#9E9E9E'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return `${label}: ${value} attractions`;
                        }
                    }
                }
            }
        }
    });
    
    // 3. Radar Chart - User Engagement Comparison
    const radarCtx = document.getElementById('userRadarChart');
    if (userRadarChart) userRadarChart.destroy();
    
    const userIds = Object.keys(userProgress);
    const topUsers = userIds.slice(0, 5); // Show top 5 users
    
    // Get top attractions
    const topAttractions = Object.keys(attractionProgress).slice(0, 8);
    
    // Create datasets for each user
    const radarDatasets = topUsers.map((userId, index) => {
        const colors = [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
        ];
        
        // Get user's progress for each attraction
        const userAttractionProgress = topAttractions.map(attraction => {
            const records = progressData.filter(p => 
                p.user_id == userId && p.attraction_name === attraction
            );
            if (records.length > 0) {
                return parseFloat(records[0].progress_percentage);
            }
            return 0;
        });
        
        return {
            label: `User ${userId}`,
            data: userAttractionProgress,
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace('0.5', '1'),
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
        };
    });
    
    userRadarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: topAttractions.map(name => name.substring(0, 15) + '...'),
            datasets: radarDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // 4. Polar Area Chart - Attraction Engagement
    const polarCtx = document.getElementById('polarAreaChart');
    if (polarAreaChart) polarAreaChart.destroy();
    
    const attractionNames = Object.keys(attractionProgress).slice(0, 10);
    const attractionEngagement = attractionNames.map(name => {
        return attractionProgress[name].completed;
    });
    
    polarAreaChart = new Chart(polarCtx, {
        type: 'polarArea',
        data: {
            labels: attractionNames.map(name => name.substring(0, 20)),
            datasets: [{
                data: attractionEngagement,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(199, 199, 199, 0.6)',
                    'rgba(83, 102, 255, 0.6)',
                    'rgba(255, 102, 178, 0.6)',
                    'rgba(102, 255, 178, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.r} tasks completed`;
                        }
                    }
                }
            }
        }
    });
    
    // 5. Scatter Chart - Complexity vs Completion
    const scatterCtx = document.getElementById('scatterChart');
    if (scatterChart) scatterChart.destroy();
    
    const scatterData = Object.keys(attractionProgress).map(name => ({
        x: attractionProgress[name].total, // Total tasks (complexity)
        y: attractionProgress[name].completed, // Completed tasks
        name: name
    }));
    
    scatterChart = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Attractions',
                data: scatterData,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Total Tasks (Complexity)'
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Completed Tasks'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = scatterData[context.dataIndex];
                            const percentage = point.x > 0 ? ((point.y / point.x) * 100).toFixed(1) : 0;
                            return [
                                point.name,
                                `Total: ${point.x} tasks`,
                                `Completed: ${point.y} tasks`,
                                `Progress: ${percentage}%`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    // 6. Bubble Chart - User Activity
    const bubbleCtx = document.getElementById('bubbleChart');
    if (bubbleChart) bubbleChart.destroy();
    
    const bubbleData = userIds.map((userId, index) => {
        const up = userProgress[userId];
        const completionRate = up.total > 0 ? (up.completed / up.total) * 100 : 0;
        
        return {
            x: index + 1, // User position
            y: completionRate, // Completion rate
            r: up.total / 2, // Bubble size based on total tasks
            userId: userId,
            completed: up.completed,
            total: up.total
        };
    });
    
    bubbleChart = new Chart(bubbleCtx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'User Activity',
                data: bubbleData,
                backgroundColor: bubbleData.map((_, i) => {
                    const colors = [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ];
                    return colors[i % colors.length];
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'User Index'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Completion Rate (%)'
                    },
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = bubbleData[context.dataIndex];
                            return [
                                `User ${point.userId}`,
                                `Completion: ${point.y.toFixed(1)}%`,
                                `Tasks: ${point.completed}/${point.total}`,
                                `Bubble size = total tasks`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    // 4. Progress Trend Line Chart
    const trendCtx = document.getElementById('progressTrendChart');
    if (progressTrendChart) progressTrendChart.destroy();
    
    // Calculate percentages and sort
    const attractions = Object.keys(attractionProgress).map(name => ({
        name: name,
        completed: attractionProgress[name].completed,
        total: attractionProgress[name].total,
        percentage: attractionProgress[name].total > 0 
            ? ((attractionProgress[name].completed / attractionProgress[name].total) * 100).toFixed(1)
            : 0
    })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    
    // Create datasets for completed and total tasks
    progressTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: attractions.map(a => a.name),
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: attractions.map(a => a.completed),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Total Tasks',
                    data: attractions.map(a => a.total),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            const attraction = attractions[index];
                            return `Progress: ${attraction.percentage}%`;
                        }
                    }
                }
            }
        }
    });
}

// Toggle progress table visibility
function toggleProgressTable() {
    const container = document.getElementById('progressTableContainer');
    if (container.style.display === 'none') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// Helper functions
// Populate attractions for filter dropdown (starts with 'All Attractions')
async function loadAttractionFilterDropdown(selectId) {
    try {
        const response = await fetch(API_BASE + 'attractions.php?action=list');
        const data = await response.json();
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">All Attractions</option>';
        if (data.success) {
            data.attractions.forEach(attr => {
                const option = document.createElement('option');
                option.value = attr.id;
                option.textContent = attr.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading attractions filter dropdown:', error);
    }
}

async function loadAttractionDropdown(selectId) {
    try {
        const response = await fetch(API_BASE + 'attractions.php?action=list');
        const data = await response.json();

        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Attraction</option>';

        if (data.success) {
            data.attractions.forEach(attr => {
                const option = document.createElement('option');
                option.value = attr.id;
                option.textContent = attr.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading attractions dropdown:', error);
    }
}

// Load tasks dropdown based on attraction
async function loadTasksDropdown(selectId, attractionId) {
    try {
        console.log("loadTasksDropdown: Fetching tasks for attraction:", attractionId);
        const response = await fetch(API_BASE + `tasks.php?action=list`);
        const data = await response.json();

        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            console.error("Error loading tasks dropdown: Select element with ID", selectId, "not found!");
            return;
        }

        if (data.success && data.tasks.length > 0) {
            // Filter tasks by attraction_id
            const filteredTasks = data.tasks.filter(task => task.attraction_id == attractionId);
            
            if (filteredTasks.length > 0) {
                selectElement.innerHTML = '<option value="">Select Task</option>' +
                    filteredTasks.map(task => `<option value="${task.id}">${task.name}</option>`).join('');
            } else {
                selectElement.innerHTML = '<option value="">No tasks available for this attraction</option>';
            }
        } else {
            selectElement.innerHTML = '<option value="">No tasks available</option>';
        }
    } catch (error) {
        console.error('Error loading tasks dropdown:', error);
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Error loading tasks</option>';
        }
    }
}

// Helper function to upload a single file
async function uploadFile(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput.files[0];

    if (!file) {
        return null; // No file selected, return null
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(API_BASE + 'upload.php', {
            method: 'POST',
            // Don't set Content-Type header, let the browser set it with boundary for multipart/form-data
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.filePath; // Return the path to the uploaded file
        } else {
            showAlert(data.message || 'Error uploading file', 'error');
            return null; // Indicate failure
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('Connection error during upload. Please try again.', 'error');
        return null; // Indicate failure
    }
}

// Generate QR token for check-in task
async function generateQRToken() {
    const taskId = document.getElementById('taskId').value;
    
    if (!taskId) {
        // If no task ID (new task), generate token but disable download
        const token = generateSecureToken();
        document.getElementById('taskQRString').value = token;
        document.getElementById('downloadQRBtn').disabled = true;
        showQRPreview(token);
        showAlert('QR token generated! SAVE THE TASK FIRST, then download the QR code.', 'warning');
        return;
    }
    
    // If editing existing task, generate and save token
    try {
        const response = await fetch(API_BASE + 'generate_qr_token.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate_token',
                task_id: taskId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('taskQRString').value = data.qr_code;
            document.getElementById('downloadQRBtn').disabled = false;
            showQRPreview(data.qr_code);
            showAlert('QR token generated successfully!', 'success');
        } else {
            showAlert(data.message || 'Failed to generate QR token', 'error');
        }
    } catch (error) {
        console.error('Generate QR error:', error);
        showAlert('Connection error. Please try again.', 'error');
    }
}

// Generate secure random token
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Show QR code preview
function showQRPreview(token) {
    const qrContainer = document.getElementById('currentQRContainer');
    const qrImg = document.getElementById('currentQR');
    const taskId = document.getElementById('taskId').value;
    
    // IMPORTANT: QR code should contain ONLY the token, not a URL
    // The app's QR scanner expects just the raw token string
    let qrData = token;
    let isDeepLink = false;
    
    // Always use just the token for QR codes
    // This ensures the QR scanner can verify it against the database
    qrData = token;
    
    // Use QR Server API (more reliable, no CORS issues for images)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    qrImg.src = qrUrl;
    qrContainer.style.display = 'block';
    
    // Show info about what the QR contains
    const infoDiv = document.getElementById('qrInfoText');
    if (infoDiv) {
        infoDiv.innerHTML = `✅ <strong>QR Code Token:</strong> ${qrData.substring(0, 30)}...`;
        infoDiv.style.color = '#059669';
    }
}

// Download QR code as PNG
function downloadQRCode() {
    const token = document.getElementById('taskQRString').value;
    const taskName = document.getElementById('taskName').value || 'task';
    const taskId = document.getElementById('taskId').value;
    
    if (!token) {
        showAlert('No QR code available. Generate a token first.', 'error');
        return;
    }
    
    // Method 1: Use backend API if task is saved
    if (taskId) {
        // Use backend endpoint (no CORS issues)
        const backendUrl = `../backend/api/qr/generate.php?task_id=${taskId}`;
        const a = document.createElement('a');
        a.href = backendUrl;
        a.download = `qr_${taskName.replace(/\s+/g, '_')}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert('QR code download started!', 'success');
    } else {
        // Method 2: For unsaved tasks, use QR server API directly in new tab (bypasses CORS)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(token)}`;
        
        // Open in new tab and trigger download
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `qr_${taskName.replace(/\s+/g, '_')}_${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('QR code opened in new tab. Right-click to save.', 'info');
    }
}

// Helper function to show loading indicator in a specific table body
function showTableLoading(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="100%" class="loading">Loading...</td></tr>'; // Use 100% or a high number for colspan
    }
}

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert ${type} active`;
    setTimeout(() => {
        alert.classList.remove('active');
    }, 3000);
}

function showLoginAlert(message, type) {
    const alert = document.getElementById('loginAlert');
    alert.textContent = message;
    alert.className = `alert ${type} active`;
    setTimeout(() => {
        alert.classList.remove('active');
    }, 3000);
}

function showRegisterAlert(message, type) {
    const alert = document.getElementById('registerAlert');
    alert.textContent = message;
    alert.className = `alert ${type} active`;
    setTimeout(() => {
        alert.classList.remove('active');
    }, 3000);
}

function showForgotPasswordAlert(message, type) {
    const alert = document.getElementById('forgotPasswordAlert');
    alert.textContent = message;
    alert.className = `alert ${type} active`;
    setTimeout(() => {
        alert.classList.remove('active');
    }, 5000);
}

// Global counters for dynamic task/guide inputs
let taskCounter = 0;
let guideCounter = 0;

// Function to add a new task input group
function addTaskInput() {
    const container = document.getElementById('initialTasksContainer');
    const taskGroup = document.createElement('div');
    taskGroup.className = 'task-input-group';
    taskGroup.id = `taskGroup_${taskCounter}`;

    taskGroup.innerHTML = `
        <div class="form-group">
            <label>Task Name* (Task ${taskCounter + 1})</label>
            <input type="text" name="initial_task_name" required>
        </div>
        <div class="form-group">
            <label>Type* (Task ${taskCounter + 1})</label>
            <select name="initial_task_type" required>
                <option value="">Select Type</option>
                <option value="quiz">Quiz</option>
                <option value="photo">Photo Upload</option>
                <option value="checkin">Check-in</option>
            </select>
        </div>
        <div class="form-group">
            <label>Description* (Task ${taskCounter + 1})</label>
            <textarea name="initial_task_description" required></textarea>
        </div>
        <div class="form-group">
            <label>QR Code File (Task ${taskCounter + 1})</label>
            <input type="file" name="initial_task_qr_file" accept="image/*">
            <small style="color: #666; font-size: 12px;">Upload a QR code image (JPEG, PNG, GIF, WEBP)</small>
        </div>
        <div class="form-group" id="currentTaskQRContainer_${taskCounter}" style="display: none;">
            <label>Current QR Code (Task ${taskCounter + 1}):</label>
            <img id="currentTaskQR_${taskCounter}" src="" alt="Current QR Code" style="max-width: 200px; max-height: 200px; display: block; margin-top: 5px;">
        </div>
        <div class="form-group">
            <label>QR Code String (Fallback/Editing) (Task ${taskCounter + 1})</label>
            <input type="text" name="initial_task_qr_string"> <!-- Keep text input for editing existing path or fallback -->
        </div>
        <div class="form-group">
            <label>Media File (for Photo Tasks) (Task ${taskCounter + 1})</label>
            <input type="file" name="initial_task_media_file" accept="image/*"> <!-- New file input for media -->
            <small style="color: #666; font-size: 12px;">Upload a media file (JPEG, PNG, GIF, WEBP)</small>
        </div>
        <div class="form-group" id="currentTaskMediaContainer_${taskCounter}" style="display: none;">
            <label>Current Media (Task ${taskCounter + 1}):</label>
            <img id="currentTaskMedia_${taskCounter}" src="" alt="Current Media" style="max-width: 200px; max-height: 200px; display: block; margin-top: 5px;">
        </div>
        <button type="button" class="btn" onclick="removeTaskInput('${taskGroup.id}')" style="background: #ef4444; color: white; margin-bottom: 10px;">Remove Task</button>
        <hr style="margin: 10px 0;">
    `;

    container.appendChild(taskGroup);
    taskCounter++;
}

// Function to remove a task input group
function removeTaskInput(groupId) {
    const group = document.getElementById(groupId);
    if (group) {
        group.remove();
    }
}

// Function to add a new guide input group
function addGuideInput() {
    const container = document.getElementById('initialGuidesContainer');
    const guideGroup = document.createElement('div');
    guideGroup.className = 'guide-input-group';
    guideGroup.id = `guideGroup_${guideCounter}`;

    guideGroup.innerHTML = `
        <div class="form-group">
            <label>Title* (Guide ${guideCounter + 1})</label>
            <input type="text" name="initial_guide_title" required>
        </div>
        <div class="form-group">
            <label>Content* (Guide ${guideCounter + 1})</label>
            <textarea name="initial_guide_content" required></textarea>
        </div>
        <button type="button" class="btn" onclick="removeGuideInput('${guideGroup.id}')" style="background: #ef4444; color: white; margin-bottom: 10px;">Remove Guide</button>
        <hr style="margin: 10px 0;">
    `;

    container.appendChild(guideGroup);
    guideCounter++;
}

// Function to remove a guide input group
function removeGuideInput(groupId) {
    const group = document.getElementById(groupId);
    if (group) {
        group.remove();
    }
}

// Helper function to collect initial task data from the form
function collectInitialTaskData() {
    const taskGroups = document.querySelectorAll('#initialTasksContainer .task-input-group');
    const tasks = [];

    for (let i = 0; i < taskGroups.length; i++) {
        const group = taskGroups[i];
        const taskData = {
            name: group.querySelector('[name="initial_task_name"]').value,
            type: group.querySelector('[name="initial_task_type"]').value,
            description: group.querySelector('[name="initial_task_description"]').value,
            qr_string: group.querySelector('[name="initial_task_qr_string"]').value, // Use the string input
            // File inputs will be handled separately via uploadFile
            qr_file_input_name: group.querySelector('[name="initial_task_qr_file"]') ? `initial_task_qr_file_${i}` : null,
            media_file_input_name: group.querySelector('[name="initial_task_media_file"]') ? `initial_task_media_file_${i}` : null,
        };
        tasks.push(taskData);
    }
    return tasks;
}

// Helper function to collect initial guide data from the form
function collectInitialGuideData() {
    const guideGroups = document.querySelectorAll('#initialGuidesContainer .guide-input-group');
    const guides = [];

    for (let i = 0; i < guideGroups.length; i++) {
        const group = guideGroups[i];
        const guideData = {
            title: group.querySelector('[name="initial_guide_title"]').value,
            content: group.querySelector('[name="initial_guide_content"]').value,
        };
        guides.push(guideData);
    }
    return guides;
}

// Duplicate function removed - using the main handleAttractionSubmit above with coordinates support

async function openTaskAndGuideModal(attractionId = null) {
    console.log("openTaskAndGuideModal: Called. Current User:", currentUser); // Debug log

    // --- Determine the Attraction ID to Use ---
    let finalAttractionId = attractionId;

    if (!finalAttractionId) {
        if (currentUser?.role === 'manager') {
             // Managers should have created an attraction.
             // Fetch the list of attractions to find the one created by this manager.
             try {
                 const response = await fetch(API_BASE + 'attractions.php?action=list'); // Fetch attractions accessible to this manager
                 if (!response.ok) {
                     throw new Error(`HTTP ${response.status}`);
                 }
                 const data = await response.json();

                 if (data?.success && Array.isArray(data.attractions) && data.attractions.length > 0) {
                     // The manager should only see attractions they created (based on updated attractions.php logic)
                     // So, there should be only one attraction in the list for them.
                     if (data.attractions.length === 1) {
                         finalAttractionId = data.attractions[0].id;
                         console.log("openTaskAndGuideModal: Manager has one attraction. Using ID:", finalAttractionId);
                     } else if (data.attractions.length === 0) {
                         // Manager has no attractions created yet
                         console.warn("openTaskAndGuideModal: Manager has no attractions created.");
                         showAlert("You have not created an attraction yet. Please create an attraction first.", "error");
                         return; // Stop opening modal
                     } else {
                         // This shouldn't happen for a manager if the attractions.php GET list logic is correct (only showing manager's own attractions)
                         console.warn("openTaskAndGuideModal: Manager has multiple attractions accessible (unexpected).", data.attractions.length);
                         // Prompt selection using a simple prompt or a more complex dropdown modal
                         // For now, let's prompt.
                         const attractionNames = data.attractions.map(att => `${att.id}: ${att.name}`).join('\n');
                         const selectedIdStr = prompt(`You are a Manager. Please select the Attraction ID for the task/guide.\n\nAvailable Attractions:\n${attractionNames}`);
                         const selectedIdNum = parseInt(selectedIdStr, 10);
                         if (!isNaN(selectedIdNum) && data.attractions.some(att => att.id === selectedIdNum)) {
                             finalAttractionId = selectedIdNum;
                         } else {
                              console.warn("openTaskAndGuideModal: Invalid or non-existent attraction ID provided via prompt for Manager.");
                              showAlert("Invalid Attraction ID provided.", "error");
                              return; // Stop opening modal if invalid ID
                         }
                     }
                 } else if (data?.success && Array.isArray(data.attractions) && data.attractions.length === 0) {
                     console.warn("openTaskAndGuideModal: Manager has no attractions available.");
                     showAlert("No attractions found for your account. Please create an attraction first.", "error");
                     return;
                } else {
                     // Handle API error / unexpected payload
                     console.warn("openTaskAndGuideModal: Error fetching attractions.", data?.message, data);
                     showAlert(data?.message || "Error fetching attractions. Please try again.", "error");
                     return; // Stop opening modal
                 }
             } catch (error) {
                 console.error("openTaskAndGuideModal: Fetch error for attractions list:", error);
                 showAlert("Connection error while fetching attractions. Please try again.", "error");
                 return; // Stop opening modal
             }
        } else if (currentUser?.role === 'superadmin') {
             // Superadmin needs to select an attraction. Prompt or use a dropdown modal.
             // For now, let's prompt.
             try {
                 const attractions = await fetchAttractionsList(); // Reuse existing helper to get attractions
                 if (attractions && attractions.length > 0) {
                     const attractionNames = attractions.map(att => `${att.id}: ${att.name}`).join('\n');
                     const selectedIdStr = prompt(`You are a Super Admin. Please enter the Attraction ID for the task/guide.\n\nAvailable Attractions:\n${attractionNames}`);
                     const selectedIdNum = parseInt(selectedIdStr, 10);
                     if (!isNaN(selectedIdNum) && attractions.some(att => att.id === selectedIdNum)) {
                         finalAttractionId = selectedIdNum;
                     } else {
                          console.warn("openTaskAndGuideModal: Invalid or non-existent attraction ID provided via prompt for Super Admin.");
                          showAlert("Invalid Attraction ID provided.", "error");
                          return; // Stop opening modal if invalid ID
                     }
                 } else {
                     // No attractions exist at all
                     console.warn("openTaskAndGuideModal: No attractions found for Super Admin to select.");
                     showAlert("No attractions exist yet. Please create an attraction first.", "error");
                     return; // Stop opening modal
                 }
             } catch (error) {
                 console.error("openTaskAndGuideModal: Fetch error for attractions list (superadmin):", error);
                 showAlert("Connection error while fetching attractions. Please try again.", "error");
                 return; // Stop opening modal
             }
        } else {
             // Shouldn't happen if user is properly logged in, but log it
             console.warn("openTaskAndGuideModal: currentUser.role is not 'manager' or 'superadmin'. Role:", currentUser?.role);
             showAlert("Access denied.", "error");
             return; // Stop opening modal
        }
    }

    console.log("openTaskAndGuideModal: Determined finalAttractionId:", finalAttractionId);

    // Store the ID globally for this session (used when submitting the form)
    currentAttractionIdForTaskGuide = finalAttractionId;

    // --- Get Modal Elements ---
    const modal = document.getElementById('taskAndGuideModal');
    const form = document.getElementById('taskAndGuideForm');

    // Check if the modal element exists
    if (!modal) {
        console.error("openTaskAndGuideModal: Element with ID 'taskAndGuideModal' not found in the HTML!");
        showAlert("An error occurred: Modal element not found.", "error");
        return; // Stop if modal doesn't exist
    }

    if (!form) {
        console.error("openTaskAndGuideModal: Element with ID 'taskAndGuideForm' not found in the HTML!");
        showAlert("An error occurred: Form element not found.", "error");
        return; // Stop if form doesn't exist
    }

    // --- Reset and Populate the Modal ---
    form.reset(); // Clear all form fields (including file inputs)
    
    // Clear quiz questions
    document.getElementById('taskAndGuideQuizList').innerHTML = '';
    document.getElementById('taskAndGuideQuizSection').style.display = 'none';
    
    // Reset guide fields to required (will be changed if quiz is selected)
    const guideTitleInput = document.getElementById('taskAndGuideGuideTitle');
    const guideContentInput = document.getElementById('taskAndGuideGuideContent');
    const guideTitleLabel = document.getElementById('guideTitleLabel');
    const guideContentLabel = document.getElementById('guideContentLabel');
    const guideInfoHeader = document.getElementById('guideInfoHeader');
    
    guideTitleInput.setAttribute('required', 'required');
    guideContentInput.setAttribute('required', 'required');
    guideTitleLabel.textContent = 'Title*';
    guideContentLabel.textContent = 'Content*';
    guideInfoHeader.textContent = 'Guide Details';

    // Set the hidden field for the attraction ID
    const attractionIdInput = document.getElementById('taskAndGuideAttractionId');
    if (attractionIdInput) {
        attractionIdInput.value = finalAttractionId;
    } else {
        console.error("openTaskAndGuideModal: Hidden input 'taskAndGuideAttractionId' not found!");
        // This is critical for the backend to know which attraction the task/guide belongs to.
        showAlert("An error occurred: Required form field not found.", "error");
        return; // Stop if the hidden input doesn't exist
    }
    
    // Remove existing event listener to avoid duplicates
    const taskTypeSelect = document.getElementById('taskAndGuideTaskType');
    taskTypeSelect.removeEventListener('change', handleTaskAndGuideTypeChange);
    // Add event listener for task type change
    taskTypeSelect.addEventListener('change', handleTaskAndGuideTypeChange);
    
    // Trigger the change event to set initial state based on selected type
    handleTaskAndGuideTypeChange();

    // Clear any previous alerts within the form
    clearFormAlerts(form); // Assuming you have a helper function for this, or just clear the specific alert div

    // Set the modal title
    document.getElementById('taskAndGuideModalTitle').textContent = `Add Task & Guide for Attraction ID: ${finalAttractionId}`;

    // Hide image preview containers initially (in case they were shown from a previous edit)
    document.getElementById('currentTaskAndGuideQRContainer').style.display = 'none';
    document.getElementById('currentTaskAndGuideMediaContainer').style.display = 'none';

    // --- Show the Modal ---
    modal.classList.add('active'); // Assuming your CSS uses the 'active' class to show the modal

    // Optional: Focus the first input field
    document.getElementById('taskAndGuideTaskName')?.focus();
}

// Helper function to clear alerts within a specific form element (optional, if you have form-specific alerts)
function clearFormAlerts(formElement) {
    const alertDiv = formElement.querySelector('.form-alert'); // Adjust selector if needed
    if (alertDiv) {
        alertDiv.classList.remove('active');
        alertDiv.textContent = ''; // Clear text content
    }
}

async function handleTaskAndGuideSubmit(e) {
    e.preventDefault();
    alert('🔍 Form submitted! Check console for debug info.');
    console.log("handleTaskAndGuideSubmit: Submitting task and guide...");

    const taskType = document.getElementById('taskAndGuideTaskType').value;
    
    // Validate required fields - guide fields are optional for quiz
    const fieldsToValidate = ['taskAndGuideTaskName', 'taskAndGuideTaskType', 'taskAndGuideTaskDescription'];
    
    // Only validate guide fields if NOT quiz type
    if (taskType !== 'quiz') {
        fieldsToValidate.push('taskAndGuideGuideTitle', 'taskAndGuideGuideContent');
    }
    
    if (!validateFormFields(fieldsToValidate)) {
        console.log("handleTaskAndGuideSubmit: Validation failed.");
        return; // Stop if validation fails
    }
    console.log("handleTaskAndGuideSubmit: Validation passed.");

    const taskId = document.getElementById('taskAndGuideTaskId').value;
    const guideId = document.getElementById('taskAndGuideGuideId').value;
    const attraction_id = document.getElementById('taskAndGuideAttractionId').value; // Get from hidden field
    
    console.log('🔍 DEBUG START: taskAndGuideTaskId element =', document.getElementById('taskAndGuideTaskId'));
    console.log('🔍 DEBUG START: taskId value =', taskId);
    console.log('🔍 DEBUG START: guideId value =', guideId);
    const taskName = document.getElementById('taskAndGuideTaskName').value;
    // taskType already declared above on line 2297
    const taskDescription = document.getElementById('taskAndGuideTaskDescription').value;
    const guideTitle = document.getElementById('taskAndGuideGuideTitle').value;
    const guideContent = document.getElementById('taskAndGuideGuideContent').value;

    // Upload QR code if selected
    let qr_path = null;
    if (document.getElementById('taskAndGuideQRFile').files[0]) {
         console.log("handleTaskAndGuideSubmit: Uploading QR file...");
         qr_path = await uploadFile('taskAndGuideQRFile');
         if (qr_path === null) {
             // Upload failed, stop submission
             console.error("handleTaskAndGuideSubmit: QR upload failed.");
             return;
         }
         console.log("handleTaskAndGuideSubmit: QR upload successful. Path:", qr_path);
    } else {
        // If no new file selected, use the existing QR path from the hidden field (if editing)
        qr_path = document.getElementById('taskAndGuideQR').value; // This holds the existing path if editing
        console.log("handleTaskAndGuideSubmit: No new QR file selected. Using existing path or null:", qr_path);
    }

    // Upload media if selected
    let media_path = null;
    if (document.getElementById('taskAndGuideMediaFile').files[0]) {
         console.log("handleTaskAndGuideSubmit: Uploading Media file...");
         media_path = await uploadFile('taskAndGuideMediaFile');
         if (media_path === null) {
             // Upload failed, stop submission
             console.error("handleTaskAndGuideSubmit: Media upload failed.");
             return;
         }
         console.log("handleTaskAndGuideSubmit: Media upload successful. Path:", media_path);
    } else {
        // If no new file selected, use the existing media path from the hidden field (if editing)
        media_path = document.getElementById('taskAndGuideMedia').value; // This holds the existing path if editing
        console.log("handleTaskAndGuideSubmit: No new Media file selected. Using existing path or null:", media_path);
    }

    // Prepare data objects for task and guide
    const taskDataObject = {
        attraction_id: attraction_id,
        name: taskName,
        type: taskType,
        description: taskDescription,
        qr_code: qr_path, // Use the uploaded path or existing path
        media_url: media_path // Use the uploaded path or existing path
    };
    
    // If quiz type, collect quiz questions
    if (taskType === 'quiz') {
        const questions = [];
        const questionDivs = document.querySelectorAll('.taskguide-quiz-question');
        
        questionDivs.forEach((questionDiv, index) => {
            const questionText = questionDiv.querySelector('.taskguide-quiz-question-text').value;
            const optionInputs = questionDiv.querySelectorAll('.taskguide-quiz-option');
            const correctRadio = questionDiv.querySelector('input[type="radio"]:checked');
            
            if (!correctRadio) {
                showAlert(`Please select the correct answer for Question ${index + 1}`, 'error');
                throw new Error('Missing correct answer');
            }
            
            const options = [];
            optionInputs.forEach((optionInput, optIndex) => {
                if (optionInput.value.trim()) {
                    options.push({
                        option_text: optionInput.value,
                        is_correct: correctRadio.value == (optIndex + 1) ? 1 : 0
                    });
                }
            });
            
            if (questionText && options.length >= 2) {
                questions.push({
                    question_text: questionText,
                    options: options
                });
            }
        });
        
        if (questions.length === 0) {
            showAlert('Please add at least one question for the quiz', 'error');
            return;
        }
        
        taskDataObject.questions = questions;
    }
    
    // Handle count_confirm type
    if (taskType === 'count_confirm') {
        const targetObject = document.getElementById('taskAndGuideCountTargetObject')?.value?.trim();
        const correctCount = document.getElementById('taskAndGuideCountCorrectCount')?.value;
        const tolerance = document.getElementById('taskAndGuideCountTolerance')?.value || 0;
        
        if (!targetObject || !correctCount) {
            showAlert('Please fill in all Count & Confirm fields', 'error');
            return;
        }
        
        taskDataObject.count_config = {
            target_object: targetObject,
            correct_count: parseInt(correctCount),
            tolerance: parseInt(tolerance)
        };
    }
    
    // Handle direction type
    if (taskType === 'direction') {
        const question = document.getElementById('taskAndGuideDirectionQuestion')?.value?.trim();
        const correctDirection = document.getElementById('taskAndGuideDirectionCorrect')?.value;
        
        if (!question || !correctDirection) {
            showAlert('Please fill in all Direction & Orientation fields', 'error');
            return;
        }
        
        taskDataObject.direction_config = {
            question: question,
            correct_direction: correctDirection
        };
    }
    
    // Handle time_based type
    if (taskType === 'time_based') {
        const startTime = document.getElementById('taskAndGuideTimeStartTime')?.value;
        const endTime = document.getElementById('taskAndGuideTimeEndTime')?.value;
        const minDuration = document.getElementById('taskAndGuideTimeMinDuration')?.value || 10;
        
        if (!startTime || !endTime) {
            showAlert('Please fill in all Time-Based Challenge fields', 'error');
            return;
        }
        
        // Normalize time format to HH:mm:ss (add :00 seconds if not present)
        const normalizedStartTime = startTime.length === 5 ? startTime + ':00' : startTime;
        const normalizedEndTime = endTime.length === 5 ? endTime + ':00' : endTime;
        
        taskDataObject.time_config = {
            start_time: normalizedStartTime,
            end_time: normalizedEndTime,
            min_duration: parseInt(minDuration)
        };
    }
    
    // Obsolete task types removed: riddle, memory_recall, route_completion, photo
    // Only the following task types are supported:
    // - checkin (required first)
    // - quiz
    // - observation_match
    // - count_confirm
    // - direction
    // - time_based
    
    // Handle observation_match type (dedicated section)
    if (taskType === 'observation_match') {
        const questions = [];
        const questionDivs = document.querySelectorAll('.taskguide-observation-question');

        questionDivs.forEach((questionDiv, index) => {
            const questionText = questionDiv.querySelector('.taskguide-observation-question-text').value;
            const optionInputs = questionDiv.querySelectorAll('.taskguide-observation-option');
            const correctRadio = questionDiv.querySelector('input[type="radio"]:checked');

            if (!correctRadio) {
                showAlert(`Please select the correct answer for Observable Item ${index + 1}`, 'error');
                throw new Error('Missing correct answer');
            }

            const options = [];
            optionInputs.forEach((optionInput, optIndex) => {
                if (optionInput.value.trim()) {
                    options.push({
                        option_text: optionInput.value,
                        is_correct: correctRadio.value == (optIndex + 1) ? 1 : 0
                    });
                }
            });

            if (questionText && options.length >= 2) {
                questions.push({
                    question_text: questionText,
                    options: options
                });
            }
        });

        if (questions.length === 0) {
            showAlert('Please add at least one observable item for the Observation Match task', 'error');
            return;
        }

        taskDataObject.questions = questions;
    }
    
    // Obsolete task type handling code removed above

    const guideDataObject = {
        attraction_id: attraction_id, // Link guide to the same attraction
        title: guideTitle,
        content: guideContent
    };

    try {
        let taskSuccess = false;
        let guideSuccess = false;
        let newTaskId = null; // To hold the ID of a newly created task, needed if creating a guide linked to it
        let newGuideId = null; // To hold the ID of a newly created guide

        // Submit Task (Create or Update)
        if (taskId) { // If editing an existing task
             console.log("handleTaskAndGuideSubmit: Updating existing task with ID:", taskId);
             const taskUpdateResponse = await fetch(API_BASE + 'tasks.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: taskId,
                    ...taskDataObject // Spread the task data object
                })
            });
            const taskResponseData = await taskUpdateResponse.json();

            if (taskResponseData.success) {
                taskSuccess = true;
                console.log("handleTaskAndGuideSubmit: Task updated successfully.");
            } else {
                throw new Error(`Task update failed: ${taskResponseData.message || 'Unknown error'}`);
            }
        } else { // If creating a new task
             console.log("handleTaskAndGuideSubmit: Creating new task.");
             const taskCreateResponse = await fetch(API_BASE + 'tasks.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    ...taskDataObject // Spread the task data object
                })
            });
            const taskResponseData = await taskCreateResponse.json();

            if (taskResponseData.success) {
                taskSuccess = true;
                newTaskId = taskResponseData.id; // Get the ID of the newly created task
                console.log("handleTaskAndGuideSubmit: New task created successfully. ID:", newTaskId);
            } else {
                throw new Error(`Task creation failed: ${taskResponseData.message || 'Unknown error'}`);
            }
        }

        // Submit Guide (Create or Update) - Link it to the *same* attraction ID as the task
        // Note: The guide is linked to the attraction, not directly to the task in this model.
        // If you want a direct link between guide and task, you'd need a 'task_id' column in the guides table.
        if (guideId) { // If editing an existing guide
             console.log("handleTaskAndGuideSubmit: Updating existing guide with ID:", guideId);
             const guideUpdateResponse = await fetch(API_BASE + 'guides.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: guideId,
                    ...guideDataObject // Spread the guide data object
                })
            });
            const guideResponseData = await guideUpdateResponse.json();

            if (guideResponseData.success) {
                guideSuccess = true;
                console.log("handleTaskAndGuideSubmit: Guide updated successfully.");
            } else {
                throw new Error(`Guide update failed: ${guideResponseData.message || 'Unknown error'}`);
            }
        } else { // If creating a new guide
             console.log("handleTaskAndGuideSubmit: Creating new guide.");
             const guideCreateResponse = await fetch(API_BASE + 'guides.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    ...guideDataObject // Spread the guide data object
                })
            });
            const guideResponseData = await guideCreateResponse.json();

            if (guideResponseData.success) {
                guideSuccess = true;
                newGuideId = guideResponseData.id; // Get the ID of the newly created guide
                console.log("handleTaskAndGuideSubmit: New guide created successfully. ID:", newGuideId);
            } else {
                throw new Error(`Guide creation failed: ${guideResponseData.message || 'Unknown error'}`);
            }
        }

        // If both task and guide operations were successful
        if (taskSuccess && guideSuccess) {
            console.log("handleTaskAndGuideSubmit: Both task and guide operations successful. Showing success alert.");
            showAlert(
                (taskId ? 'Task updated' : 'Task created') + ' and ' +
                (guideId ? 'Guide updated' : 'Guide created') + ' successfully!',
                'success'
            );
            console.log("handleTaskAndGuideSubmit: Calling closeTaskAndGuideModal().");
            closeTaskAndGuideModal(); // This should close the modal
            console.log("handleTaskAndGuideSubmit: Calling loadTasks().");
            loadTasks(); // Reload tasks table
            console.log("handleTaskAndGuideSubmit: Calling loadGuides().");
            loadGuides(); // Reload guides table
            console.log("handleTaskAndGuideSubmit: Reloaded tasks and guides. Finished.");
        } else {
             // This case might occur if one succeeds and the other fails, but the try/catch should catch failures
             // If both failed, the catch block would execute
             console.warn("handleTaskAndGuideSubmit: Warning - taskSuccess:", taskSuccess, "guideSuccess:", guideSuccess);
             // In theory, if we reach here, it means one succeeded and one failed, which should have thrown an error in the if blocks above.
             // This block might be unreachable with the current error handling.
        }

    } catch (error) {
        console.error("handleTaskAndGuideSubmit: Error:", error);
        showAlert(error.message || 'Error saving task and guide. Please try again.', 'error');
    }
    console.log("handleTaskAndGuideSubmit: Function ended (either via success path or catch block).");
}

// Function to close the Task & Guide modal
function closeTaskAndGuideModal() {
    console.log("closeTaskAndGuideModal: Closing modal.");
    document.getElementById('taskAndGuideModal').classList.remove('active');
    // Optionally reset the global variable when closing
    currentAttractionIdForTaskGuide = null;
}

// Helper function for basic form field validation
function validateFormFields(fieldIds) {
    for (const fieldId of fieldIds) {
        const element = document.getElementById(fieldId);
        if (!element || !element.value.trim()) { // Check if element exists AND its trimmed value is not empty
            // Optional: Show an alert specific to the missing field
            const fieldName = element?.previousElementSibling?.textContent?.replace('*', '') || fieldId; // Try to get label text, fallback to ID
            showAlert(`Please fill in the required field: ${fieldName}`, 'error');
            element?.focus(); // Focus the first invalid field
            return false; // Indicate validation failed
        }
    }
    return true; // Indicate validation passed
}

// Function to handle "Add More Task & Guide" button click
async function addMoreTaskAndGuide() {
    console.log("addMoreTaskAndGuide: Clicked. Validating and saving current task/guide before adding another.");

    // Re-use the validation logic from the submit function
    if (!validateFormFields(['taskAndGuideTaskName', 'taskAndGuideTaskType', 'taskAndGuideTaskDescription', 'taskAndGuideGuideTitle', 'taskAndGuideGuideContent'])) {
        return; // Stop if validation fails
    }

    // Get form values (similar to handleTaskAndGuideSubmit)
    const taskId = document.getElementById('taskAndGuideTaskId').value;
    const guideId = document.getElementById('taskAndGuideGuideId').value;
    const attraction_id = document.getElementById('taskAndGuideAttractionId').value;
    const taskName = document.getElementById('taskAndGuideTaskName').value;
    const taskType = document.getElementById('taskAndGuideTaskType').value;
    const taskDescription = document.getElementById('taskAndGuideTaskDescription').value;
    const guideTitle = document.getElementById('taskAndGuideGuideTitle').value;
    const guideContent = document.getElementById('taskAndGuideGuideContent').value;

    // Upload QR code if selected (similar logic)
    let qr_path = null;
    const qrFileInput = document.getElementById('taskAndGuideQRFile');
    if (qrFileInput.files[0]) {
         qr_path = await uploadFile('taskAndGuideQRFile');
         if (qr_path === null) return; // Stop if upload fails
    } else {
        // Handle existing QR path if editing (as discussed previously)
        // const existingQRPath = document.getElementById('taskAndGuideQRExisting').value;
        // qr_path = existingQRPath || null;
        qr_path = document.getElementById('taskAndGuideQR').value; // Use the value from the hidden field holding existing path
    }

    // Upload media if selected (similar logic)
    let media_path = null;
    const mediaFileInput = document.getElementById('taskAndGuideMediaFile');
    if (mediaFileInput.files[0]) {
         media_path = await uploadFile('taskAndGuideMediaFile');
         if (media_path === null) return; // Stop if upload fails
    } else {
        // Handle existing media path if editing (as discussed previously)
        // const existingMediaPath = document.getElementById('taskAndGuideMediaExisting').value;
        // media_path = existingMediaPath || null;
        media_path = document.getElementById('taskAndGuideMedia').value; // Use the value from the hidden field holding existing path
    }

    // Prepare data objects (similar to handleTaskAndGuideSubmit)
    const taskDataObject = {
        attraction_id: attraction_id,
        name: taskName,
        type: taskType,
        description: taskDescription,
        qr_code: qr_path, // Use the uploaded path or existing path
        media_url: media_path // Use the uploaded path or existing path
    };

    const guideDataObject = {
        attraction_id: attraction_id, // Link guide to the same attraction
        title: guideTitle,
        content: guideContent
    };

    try {
        let taskSuccess = false;
        let guideSuccess = false;

        console.log('🔍 DEBUG: taskId =', taskId);
        console.log('🔍 DEBUG: taskDataObject =', JSON.stringify(taskDataObject, null, 2));

        // --- Save Task ---
        if (taskId) { // If editing existing task
            console.log('🔍 DEBUG: Entering UPDATE branch (taskId exists)');
            const updatePayload = { action: 'update', id: taskId, ...taskDataObject };
            console.log('🔍 DEBUG: Sending UPDATE request with payload:', JSON.stringify(updatePayload, null, 2));
            const taskUpdateResponse = await fetch(API_BASE + 'tasks.php', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(updatePayload)
           });
           const taskResponseData = await taskUpdateResponse.json();
           if (taskResponseData.success) {
               taskSuccess = true;
               // Success message for update can be shown here if desired, but usually done after both are saved.
               // showAlert(`Task updated successfully.`, 'success');
           } else {
               throw new Error(`Task update failed: ${taskResponseData.message || 'Unknown error'}`);
           }
        } else { // If creating new task
            console.log('🔍 DEBUG: Entering CREATE branch (no taskId)');
            const createPayload = { action: 'create', ...taskDataObject };
            console.log('🔍 DEBUG: Sending CREATE request with payload:', JSON.stringify(createPayload, null, 2));
            const taskCreateResponse = await fetch(API_BASE + 'tasks.php', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'create', ...taskDataObject })
           });
           const taskResponseData = await taskCreateResponse.json();
           if (taskResponseData.success) {
               taskSuccess = true;
               newTaskId = taskResponseData.id; // Capture new ID if needed for potential rollback or linking (less likely here)
               // Success message for creation can be shown here if desired, but usually done after both are saved.
               // showAlert(`Task created successfully with ID: ${newTaskId}.`, 'success');
           } else {
               throw new Error(`Task creation failed: ${taskResponseData.message || 'Unknown error'}`);
           }
        }

        // --- Save Guide ---
        if (guideId) { // If editing existing guide
            const guideUpdateResponse = await fetch(API_BASE + 'guides.php', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'update', id: guideId, ...guideDataObject })
           });
           const guideResponseData = await guideUpdateResponse.json();
           if (guideResponseData.success) {
               guideSuccess = true;
               // showAlert(`Guide updated successfully.`, 'success');
           } else {
               throw new Error(`Guide update failed: ${guideResponseData.message || 'Unknown error'}`);
           }
        } else { // If creating new guide
            const guideCreateResponse = await fetch(API_BASE + 'guides.php', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'create', ...guideDataObject })
           });
           const guideResponseData = await guideCreateResponse.json();
           if (guideResponseData.success) {
               guideSuccess = true;
               newGuideId = guideResponseData.id; // Capture new ID if needed for potential rollback
               // showAlert(`Guide created successfully with ID: ${newGuideId}.`, 'success');
           } else {
               throw new Error(`Guide creation failed: ${guideResponseData.message || 'Unknown error'}`);
           }
        }

        // --- Handle Success for "Add More" ---
        if (taskSuccess && guideSuccess) {
            // Show a success message specific to "Add More"
            showAlert(
                (taskId ? 'Task updated' : 'Task created') + ' and ' +
                (guideId ? 'Guide updated' : 'Guide created') + ' successfully! Ready for the next one.',
                'success'
            );

            // ** CRITICAL PART FOR 'ADD MORE' **:
            // Reset the form fields for the *next* task/guide, but keep the attraction_id
            document.getElementById('taskAndGuideForm').reset(); // This clears all fields, including the hidden attraction_id
            document.getElementById('taskAndGuideAttractionId').value = attraction_id; // Re-set the hidden attraction_id
            // Clear previews
            document.getElementById('currentTaskAndGuideQRContainer').style.display = 'none';
            document.getElementById('currentTaskAndGuideMediaContainer').style.display = 'none';
            // Don't close the modal, don't reload tables yet
        }

    } catch (error) {
        console.error("addMoreTaskAndGuide: Error saving current task/guide:", error);
        showAlert(error.message || 'Error saving current task/guide. Please try again.', 'error');
        // Do not reset the form or proceed if saving failed
    }
}
