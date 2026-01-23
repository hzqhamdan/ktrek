// iSCMS Admin Panel - Sidebar Navigation Script

document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
});

function initializeSidebar() {
    const sidebar = document.getElementById('iscmsSidebar');
    const openBtn = document.getElementById('iscmsSidebarOpenBtn');
    const closeBtn = document.getElementById('iscmsSidebarCloseBtn');
    const overlay = document.getElementById('iscmsSidebarOverlay');
    const navLinks = document.querySelectorAll('.iscms-sidebar-link');
    const mainContent = document.getElementById('mainContent');
    
    // Handle sidebar hover to expand main content
    if (sidebar && mainContent && window.innerWidth > 768) {
        sidebar.addEventListener('mouseenter', () => {
            mainContent.style.marginLeft = '260px';
        });
        
        sidebar.addEventListener('mouseleave', () => {
            mainContent.style.marginLeft = '80px';
        });
    }

    // Mobile menu toggle
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            overlay.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }

    // Close overlay when clicking outside
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    }

    // Navigation link handling
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const tab = this.getAttribute('data-tab');
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            showSection(tab + 'Section');
            
            // Close mobile menu
            if (overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Set dashboard as active by default
    const dashboardLink = document.querySelector('[data-tab="dashboard"]');
    if (dashboardLink) {
        dashboardLink.classList.add('active');
    }
}

function showSection(sectionId) {
    // Stop any auto-refresh timers when switching sections
    if (typeof stopDashboardAutoRefresh === 'function') stopDashboardAutoRefresh();
    if (typeof stopAlertsAutoRefresh === 'function') stopAlertsAutoRefresh();
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        loadSectionData(sectionId);
    }
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboardSection':
            loadDashboardData();
            // Start auto-refresh when dashboard is active
            startDashboardAutoRefresh(30); // Refresh every 30 seconds
            break;
        case 'usersSection':
            loadUsers();
            break;
        case 'providersSection':
            loadProviders();
            break;
        case 'devicesSection':
            loadDevices();
            break;
        case 'healthDataSection':
            showHealthTab('sugar');
            break;
        case 'foodDatabaseSection':
            loadFoodDatabase();
            loadFoodAnalytics();
            break;
        case 'alertsSection':
            loadAlertsDashboard();
            startAlertsAutoRefresh(30);
            break;
        case 'dailySummarySection':
            loadDailySummary();
            break;
        case 'contentSection':
            if (typeof loadContentManagement === 'function') {
                loadContentManagement();
            } else {
                console.error('loadContentManagement function not found');
            }
            break;
        case 'settingsSection':
            if (typeof loadSystemSettings === 'function') {
                loadSystemSettings();
            } else {
                console.error('loadSystemSettings function not found');
            }
            break;
        case 'reportsSection':
            loadReports();
            break;
        case 'aiAnalyticsSection':
            loadAIAnalytics();
            break;
        case 'predictiveAnalyticsSection':
            loadPredictiveAnalytics();
            break;
        case 'contentSection':
            loadContent();
            break;
        case 'settingsSection':
            loadSettings();
            break;
        case 'supportSection':
            loadSupport();
            break;
        case 'securitySection':
            loadSecurity();
            break;
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('api/logout.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                window.location.href = 'login.php';
            } else {
                alert('Logout failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Redirect anyway
            window.location.href = 'login.php';
        });
    }
}
