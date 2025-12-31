// main.js

// API Base URL - Update this to your PHP backend location
const API_BASE = 'api/';

let currentUser = null;
let currentAttractionIdForTaskGuide = null;
let taskCompletionChartInstance = null;
let userActivityChartInstance = null;
let currentChartPeriod = 7; // Default to 7 days
let allTasks = []; // Store all tasks for filtering
let allGuides = []; // Store all guides for filtering
let allAttractions = []; // Store all attractions for sorting
let currentEditingTaskId = null; // Track which task is being edited for QR generation

function setupRoleBasedTaskAndGuideFilters() {
    // TASKS: Superadmin uses Attraction filter; others use Type filter
    const taskTypeGroup = document.getElementById('taskTypeFilterGroup');
    const taskAttractionGroup = document.getElementById('taskAttractionFilterGroup');

    // GUIDES: Superadmin can filter by Attraction; others do not see the Attraction filter
    const guideAttractionGroup = document.getElementById('guideAttractionFilterGroup');

    if (currentUser?.role === 'superadmin') {
        if (taskTypeGroup) taskTypeGroup.style.display = 'none';
        if (taskAttractionGroup) taskAttractionGroup.style.display = 'inline-block';
        if (guideAttractionGroup) guideAttractionGroup.style.display = 'inline-block';

        // Populate dropdowns
        loadAttractionFilterDropdown('taskAttractionFilter');
        loadAttractionFilterDropdown('guideAttractionFilter');
    } else {
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
    if (session) {
        currentUser = JSON.parse(session); // The parsed object should contain attraction_id
        console.log("checkSession: Retrieved currentUser object:", currentUser); // Debug log to confirm attraction_id is present
       
        showDashboard();
    }
}


function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('attractionForm').addEventListener('submit', handleAttractionSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('taskAndGuideForm').addEventListener('submit', handleTaskAndGuideSubmit);
    document.getElementById('guideForm').addEventListener('submit', handleGuideSubmit);
    document.getElementById('rewardForm').addEventListener('submit', handleRewardSubmit);
    document.getElementById('replyForm').addEventListener('submit', handleReplySubmit);
    
    // Add event listener for attraction change in guide modal to load tasks
    document.getElementById('guideAttraction').addEventListener('change', function() {
        const attractionId = this.value;
        if (attractionId) {
            loadTasksDropdown('guideTask', attractionId);
        } else {
            // Clear tasks dropdown if no attraction selected
            document.getElementById('guideTask').innerHTML = '<option value="">Select Task</option>';
        }
    });
}

// Toggle between login and register forms
function showRegisterForm() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
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

// Login function
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(API_BASE + 'login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // --- CRITICAL: Ensure attraction_id is captured from the response ---
            currentUser = data.user; // data.user now contains id, email, full_name, role, AND attraction_id
            console.log("handleLogin: Stored currentUser object:", currentUser); // Debug log to confirm attraction_id is present
            // --- END CRITICAL ---

            sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
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

    // Hide Admin Users and Reports tabs/links for managers
    if (currentUser?.role === 'manager') {
        console.log("showDashboard: Hiding Admin Users and Reports links for Manager.");
        const adminUsersLink = document.getElementById('adminUsersNavLink');
        const reportsTabLink = document.getElementById('reportsTab');

        if (adminUsersLink) {
            adminUsersLink.style.display = 'none'; // Hide Admin Users link (sidebar)
        }

        if (reportsTabLink) {
            reportsTabLink.style.display = 'none'; // Hide Reports link (sidebar)
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
        console.log("showDashboard: Showing Admin Users and Reports links for SuperAdmin.");
        // Show them (in case they were hidden before) for superadmins
        const adminUsersLink = document.getElementById('adminUsersNavLink');
        const reportsTabLink = document.getElementById('reportsTab');

        if (adminUsersLink) {
            adminUsersLink.style.display = ''; // Show Admin Users link
        }

        if (reportsTabLink) {
            reportsTabLink.style.display = ''; // Show Reports link
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

    loadDashboardStats();
}

function showSuperadminDashboard() {
    const sa = document.getElementById('superadminDashboard');
    if (sa) sa.style.display = 'block';

    // Hide legacy dashboard content blocks
    document.querySelectorAll('#dashboard > :not(#superadminDashboard)').forEach(el => {
        if (el && el.style) el.style.display = 'none';
    });

    loadSuperadminDashboard();
}

let saUsersChart = null;
let saAttractionsChart = null;
let saEngagementChart = null;

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

    saUsersChart = saRenderLineChart('saUsersGrowthChart', saUsersChart, labels, growth.users_new || [], '#36a2eb');
    saAttractionsChart = saRenderLineChart('saAttractionsGrowthChart', saAttractionsChart, labels, growth.attractions_new || [], '#5E35B1');
    saEngagementChart = saRenderLineChart('saEngagementChart', saEngagementChart, labels, growth.task_submissions || [], '#10b981');
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
    sessionStorage.removeItem('adminUser');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('loginForm').reset();
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
                    if (completion.task_type === 'photo') typeEmoji = '📸';
                    if (completion.task_type === 'checkin') typeEmoji = '📍';
                    
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

// Function to render Task Completion Chart
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
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#5E35B1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
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
                    padding: 10,
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
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Function to render User Activity Chart
function renderUserActivityChart(chartData) {
    const ctx = document.getElementById('userActivityChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (userActivityChartInstance) {
        userActivityChartInstance.destroy();
    }
    
    userActivityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Active Users',
                data: chartData.data,
                backgroundColor: '#E8F5E9',
                borderColor: '#2E7D32',
                borderWidth: 2,
                borderRadius: 5
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
                    borderColor: '#36a2eb',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Active Users: ' + context.parsed.y;
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
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        display: false
                    }
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

function openAttractionModal(id = null) {
    document.getElementById('attractionModal').classList.add('active');
    document.getElementById('attractionForm').reset();

    if (id) {
        loadAttractionData(id);
    } else {
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

    // Superadmin: filter by attraction (instead of type)
    if (currentUser?.role === 'superadmin') {
        const attractionFilter = document.getElementById('taskAttractionFilter')?.value || '';
        if (attractionFilter) {
            filteredTasks = filteredTasks.filter(task =>
                String(task.attraction_id || '') === String(attractionFilter)
            );
        }
    } else {
        // Managers (and others): filter by type
        const typeFilter = (document.getElementById('taskTypeFilter')?.value || '').toLowerCase();
        if (typeFilter) {
            filteredTasks = filteredTasks.filter(task =>
                (task.type || '').toLowerCase() === typeFilter
            );
        }
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
    document.getElementById('taskModal').classList.add('active');
    document.getElementById('taskForm').reset();
    
    // Clear quiz questions
    document.getElementById('quizQuestionsList').innerHTML = '';
    document.getElementById('quizQuestionsSection').style.display = 'none';
    document.getElementById('qrActionsContainer').style.display = 'none';

    if (id) {
        loadTaskData(id);
    } else {
        document.getElementById('taskModalTitle').textContent = 'Add Task';
        // Clear QR and media inputs
        document.getElementById('taskQRString').value = '';
        document.getElementById('taskMediaFile').value = '';
        document.getElementById('currentQRContainer').style.display = 'none';
        document.getElementById('currentMediaContainer').style.display = 'none';
        document.getElementById('downloadQRBtn').disabled = true;
    }
    
    // Add event listener for task type change
    document.getElementById('taskType').addEventListener('change', handleTaskTypeChange);
}

function handleTaskTypeChange() {
    const taskType = document.getElementById('taskType').value;
    const quizSection = document.getElementById('quizQuestionsSection');
    const qrActionsContainer = document.getElementById('qrActionsContainer');
    
    if (taskType === 'quiz') {
        quizSection.style.display = 'block';
        // Add at least one question by default
        if (document.getElementById('quizQuestionsList').children.length === 0) {
            addQuizQuestion();
        }
    } else {
        quizSection.style.display = 'none';
    }
    
    // Show QR actions only for check-in tasks
    if (taskType === 'checkin') {
        qrActionsContainer.style.display = 'block';
    } else {
        qrActionsContainer.style.display = 'none';
    }
}

let questionCounter = 0;

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
    const guideTitleInput = document.getElementById('taskAndGuideGuideTitle');
    const guideContentInput = document.getElementById('taskAndGuideGuideContent');
    const guideTitleLabel = document.getElementById('guideTitleLabel');
    const guideContentLabel = document.getElementById('guideContentLabel');
    const guideInfoHeader = document.getElementById('guideInfoHeader');
    
    if (taskType === 'quiz') {
        quizSection.style.display = 'block';
        // Add at least one question by default
        if (document.getElementById('taskAndGuideQuizList').children.length === 0) {
            addTaskAndGuideQuizQuestion();
        }
        
        // Make guide optional for quiz
        guideTitleInput.removeAttribute('required');
        guideContentInput.removeAttribute('required');
        guideTitleLabel.textContent = 'Guide Title (Optional)';
        guideContentLabel.textContent = 'Guide Content (Optional)';
        guideInfoHeader.innerHTML = 'Guide Information <span style="color: #9ca3af; font-size: 14px;">(Optional for Quiz)</span>';
    } else {
        quizSection.style.display = 'none';
        
        // Make guide required for other types
        guideTitleInput.setAttribute('required', 'required');
        guideContentInput.setAttribute('required', 'required');
        guideTitleLabel.textContent = 'Guide Title*';
        guideContentLabel.textContent = 'Guide Content*';
        guideInfoHeader.textContent = 'Guide Information';
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

async function loadTaskData(id) {
    try {
        const response = await fetch(API_BASE + `tasks.php?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
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
            
            // Trigger task type change to show relevant sections
            handleTaskTypeChange();
        }
    } catch (error) {
        showAlert('Error loading task data', 'error');
    }
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
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

    try {
        const response = await fetch(API_BASE + 'tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: id ? 'update' : 'create',
                id: id || undefined,
                ...formData
            })
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
            
            // Don't close modal if it was a new task creation - user may want to generate QR
            if (id) {
                closeTaskModal();
            }
            
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
    document.getElementById('guideModal').classList.add('active');
    document.getElementById('guideForm').reset();

    if (id) {
        loadGuideData(id);
    } else {
        document.getElementById('guideModalTitle').textContent = 'Add Guide';
    }
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
                    <td>${report.firebase_user_email || report.firebase_user_id}</td>
                    <td>${report.attraction_name || 'N/A'}</td>
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

// User Progress functions
async function loadUserProgress() {
    showTableLoading('progressTable'); // Show loading before fetch
    try {
        const response = await fetch(API_BASE + 'progress.php?action=list');
        const data = await response.json();

        const tbody = document.getElementById('progressTable');
        if (data.success && data.progress.length > 0) {
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
    
    // Create deep link URL that opens the app
    // Format: https://yourapp.com/qr-checkin?code=TOKEN&task=ID
    let qrData = token;
    let isDeepLink = false;
    
    // If task is saved, create a deep link
    if (taskId) {
        // Get the frontend URL - adjust this for your environment
        let appUrl = window.location.origin;
        
        // Development: Replace localhost with network IP for mobile access
        if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
            // Option 1: Use your computer's IP address (works on same network)
            // Get IP from user or use stored value
            const savedIP = localStorage.getItem('frontend_ip');
            if (savedIP) {
                appUrl = `http://${savedIP}:5173`;
            } else {
                // Fallback: use localhost (you can manually set IP)
                appUrl = 'http://localhost:5173';
                
                // Show warning to set IP
                console.warn('For mobile access, set your IP: localStorage.setItem("frontend_ip", "192.168.X.X")');
            }
        }
        
        qrData = `${appUrl}/qr-checkin?code=${encodeURIComponent(token)}&task=${taskId}`;
        isDeepLink = true;
    }
    
    // Use QR Server API (more reliable, no CORS issues for images)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    qrImg.src = qrUrl;
    qrContainer.style.display = 'block';
    
    // Show info about what the QR contains
    const infoDiv = document.getElementById('qrInfoText');
    if (infoDiv) {
        if (isDeepLink) {
            infoDiv.innerHTML = `✅ <strong>Scannable QR:</strong> ${qrData}`;
            infoDiv.style.color = '#059669';
        } else {
            infoDiv.innerHTML = `⚠️ <strong>Token only (not scannable):</strong> Save task first!`;
            infoDiv.style.color = '#dc2626';
        }
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
        const backendUrl = `../../backend/api/qr/generate.php?task_id=${taskId}`;
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
                 const response = await fetch(API_BASE + 'attractions.php?action=list'); // Fetch all attractions accessible to the manager (which should be just theirs now)
                 const data = await response.json();

                 if (data.success && data.attractions && data.attractions.length > 0) {
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
                 } else {
                     // Handle API error or empty list
                     console.warn("openTaskAndGuideModal: Error fetching attractions or list is empty.", data?.message);
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

        // --- Save Task ---
        if (taskId) { // If editing existing task
            const taskUpdateResponse = await fetch(API_BASE + 'tasks.php', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'update', id: taskId, ...taskDataObject })
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
