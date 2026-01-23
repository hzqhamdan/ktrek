<?php
// iSCMS Admin Panel - Sidebar Component
// Reusable sidebar navigation for the admin panel

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

$adminRole = $_SESSION['admin_role'] ?? '';
$isSuperadmin = strcasecmp($adminRole, 'Superadmin') === 0;
$isAdmin = strcasecmp($adminRole, 'Admin') === 0;
$isHealthcareProvider = strcasecmp($adminRole, 'Healthcare Provider') === 0;

// Define sidebar menu items with role-based access control
$allMenuItems = [
    [
        'label' => 'Dashboard',
        'tab' => 'dashboard',
        'href' => '#',
        'icon' => 'dashboard',
        'roles' => ['Superadmin', 'Admin', 'Healthcare Provider'], // All roles
    ],
    [
        'label' => 'My Patients',
        'tab' => 'users',
        'href' => '#',
        'icon' => 'users',
        'roles' => ['Healthcare Provider'], // Provider sees "My Patients"
    ],
    [
        'label' => 'Users',
        'tab' => 'users',
        'href' => '#',
        'icon' => 'users',
        'roles' => ['Superadmin', 'Admin'], // Admin sees "Users"
    ],
    [
        'label' => 'Healthcare Providers',
        'tab' => 'providers',
        'href' => '#',
        'icon' => 'providers',
        'roles' => ['Superadmin', 'Admin'], // Only admins manage providers
    ],
    [
        'label' => 'Device Management',
        'tab' => 'devices',
        'href' => '#',
        'icon' => 'devices',
        'roles' => ['Superadmin', 'Admin'],
    ],
    [
        'label' => 'Health Data',
        'tab' => 'healthData',
        'href' => '#',
        'icon' => 'health',
        'roles' => ['Superadmin', 'Admin', 'Healthcare Provider'],
    ],
    [
        'label' => 'Food Database',
        'tab' => 'foodDatabase',
        'href' => '#',
        'icon' => 'food',
        'roles' => ['Superadmin', 'Admin'], // Providers don't need to view food database
    ],
    [
        'label' => 'Alerts & Notifications',
        'tab' => 'alerts',
        'href' => '#',
        'icon' => 'alerts',
        'roles' => ['Superadmin', 'Admin', 'Healthcare Provider'], // All roles can view alerts
    ],
    [
        'label' => 'Daily Summary',
        'tab' => 'dailySummary',
        'href' => '#',
        'icon' => 'calendar-days',
        'roles' => ['Superadmin', 'Admin'],
    ],
    [
        'label' => 'Reports',
        'tab' => 'reports',
        'href' => '#',
        'icon' => 'reports',
        'roles' => ['Superadmin', 'Admin', 'Healthcare Provider'], // Providers can generate patient reports
    ],
    [
        'label' => 'AI Analytics',
        'tab' => 'aiAnalytics',
        'href' => '#',
        'icon' => 'ai',
        'roles' => ['Superadmin', 'Admin'],
    ],
    [
        'label' => 'Predictive Analytics',
        'tab' => 'predictiveAnalytics',
        'href' => '#',
        'icon' => 'predictive',
        'roles' => ['Superadmin', 'Admin'],
    ],
    [
        'label' => 'Content',
        'tab' => 'content',
        'href' => '#',
        'icon' => 'content',
        'roles' => ['Superadmin', 'Admin'],
    ],
    [
        'label' => 'Settings',
        'tab' => 'settings',
        'href' => '#',
        'icon' => 'settings',
        'roles' => ['Superadmin', 'Admin'],
    ],
    [
        'label' => 'Support',
        'tab' => 'support',
        'href' => '#',
        'icon' => 'support',
        'roles' => ['Superadmin', 'Admin', 'Healthcare Provider'],
    ],
    [
        'label' => 'Security',
        'tab' => 'security',
        'href' => '#',
        'icon' => 'security',
        'roles' => ['Superadmin'], // Superadmin only
    ],
];

// Filter menu items based on user role
$sidebarLinks = [];
foreach ($allMenuItems as $item) {
    if (in_array($adminRole, $item['roles'])) {
        $sidebarLinks[] = $item;
    }
}

$adminName = $_SESSION['admin_full_name'] ?? ($_SESSION['admin_email'] ?? 'Admin');
$adminAvatarUrl = $_SESSION['admin_avatar_url'] ?? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop';

// SVG Icons
function iscms_sidebar_icon(string $name): string {
    switch ($name) {
        case 'dashboard':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>';
        case 'users':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>';
        case 'providers':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>';
        case 'devices':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>';
        case 'health':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>';
        case 'food':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 0 0 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/></svg>';
        case 'alerts':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';
        case 'calendar-days':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>';
        case 'reports':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>';
        case 'ai':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v7H6zm3-3h2v10H9zm3 6h2v4h-2zm3-3h2v7h-2z"/></svg>';
        case 'predictive':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/></svg>';
        case 'content':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
        case 'settings':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.488.488 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
        case 'support':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/></svg>';
        case 'security':
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>';
        default:
            return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
    }
}
?>

<aside class="sidebar iscms-sidebar" id="iscmsSidebar" data-collapsed="true">
    <!-- Mobile top bar -->
    <div class="iscms-sidebar-mobilebar" id="iscmsSidebarMobileBar">
        <button class="iscms-sidebar-mobilebtn" type="button" id="iscmsSidebarOpenBtn" aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>
        </button>
        <span class="mobile-title">iSCMS Admin</span>
    </div>

    <!-- Mobile overlay panel -->
    <div class="iscms-sidebar-overlay" id="iscmsSidebarOverlay" aria-hidden="true">
        <div class="iscms-sidebar-overlay-inner">
            <button class="iscms-sidebar-close" type="button" id="iscmsSidebarCloseBtn" aria-label="Close menu">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3 1.42 1.42z"/></svg>
            </button>

            <div class="iscms-sidebar-content">
                <div class="sidebar-logo">
                    <img src="logo/logo.png" alt="iSCMS Logo" class="sidebar-logo-img sidebar-logo-expanded">
                    <p>Admin Panel</p>
                </div>
                <nav class="sidebar-nav iscms-sidebar-nav" aria-label="Admin navigation">
                    <ul class="iscms-sidebar-list">
                        <?php foreach ($sidebarLinks as $item): ?>
                            <li>
                                <a
                                    href="<?= htmlspecialchars($item['href']) ?>"
                                    class="nav-link iscms-sidebar-link"
                                    data-tab="<?= htmlspecialchars($item['tab']) ?>"
                                    <?php if (!empty($item['id'])): ?>id="<?= htmlspecialchars($item['id']) ?>"<?php endif; ?>
                                >
                                    <span class="iscms-sidebar-icon" aria-hidden="true"><?= iscms_sidebar_icon($item['icon']) ?></span>
                                    <span class="iscms-sidebar-label"><?= htmlspecialchars($item['label']) ?></span>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </nav>

                <div class="iscms-sidebar-footer">
                    <a href="#" class="iscms-sidebar-user" onclick="return false;">
                        <img src="<?= htmlspecialchars($adminAvatarUrl) ?>" alt="User avatar" class="iscms-sidebar-avatar">
                        <div style="display: flex; flex-direction: column;">
                            <span class="iscms-sidebar-username"><?= htmlspecialchars($adminName) ?></span>
                            <span style="font-size: 11px; opacity: 0.7;"><?= htmlspecialchars($adminRole) ?></span>
                        </div>
                    </a>
                    <button class="logout-btn" onclick="handleLogout()">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Desktop sidebar body (hover expand) -->
    <div class="iscms-sidebar-desktop">
        <div class="sidebar-logo">
            <img src="logo/logo_collapsed.png" alt="iSCMS Logo" class="sidebar-logo-img sidebar-logo-collapsed">
            <img src="logo/logo.png" alt="iSCMS Logo" class="sidebar-logo-img sidebar-logo-expanded">
        </div>
        <nav class="sidebar-nav iscms-sidebar-nav" aria-label="Admin navigation">
            <ul class="iscms-sidebar-list">
                <?php foreach ($sidebarLinks as $item): ?>
                    <li>
                        <a
                            href="<?= htmlspecialchars($item['href']) ?>"
                            class="nav-link iscms-sidebar-link"
                            data-tab="<?= htmlspecialchars($item['tab']) ?>"
                            <?php if (!empty($item['id'])): ?>id="<?= htmlspecialchars($item['id']) ?>"<?php endif; ?>
                        >
                            <span class="iscms-sidebar-icon" aria-hidden="true"><?= iscms_sidebar_icon($item['icon']) ?></span>
                            <span class="iscms-sidebar-label"><?= htmlspecialchars($item['label']) ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </nav>

        <div class="iscms-sidebar-footer">
            <a href="#" class="iscms-sidebar-user" onclick="return false;">
                <img src="<?= htmlspecialchars($adminAvatarUrl) ?>" alt="User avatar" class="iscms-sidebar-avatar">
                <div style="display: flex; flex-direction: column;">
                    <span class="iscms-sidebar-username"><?= htmlspecialchars($adminName) ?></span>
                    <span style="font-size: 11px; opacity: 0.7;"><?= htmlspecialchars($adminRole) ?></span>
                </div>
            </a>
            <button class="logout-btn" onclick="handleLogout()">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                Logout
            </button>
        </div>
    </div>
</aside>
