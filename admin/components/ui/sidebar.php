<?php
// admin/components/ui/sidebar.php
// Reusable sidebar component for the admin panel.
// Menu items are defined via a PHP array to keep navigation centralized.

// Avoid "headers already sent" warnings: only start a session if headers are not sent yet.
// Ideally, the parent page should call session_start() before any HTML output.
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

// Keep these sections EXACTLY as in the existing admin panel.
// Role-based visibility: "Admin Users" is restricted to Superadmin.
$adminRole = $_SESSION['admin_role'] ?? '';
// Case-insensitive check for superadmin role
$isSuperadmin = strcasecmp($adminRole, 'Superadmin') === 0 || strcasecmp($adminRole, 'superadmin') === 0;

$sidebarLinks = [
    [
        'label' => 'Dashboard',
        'tab' => 'dashboard',
        'href' => '#',
        'icon' => 'dashboard',
    ],
    [
        'label' => 'Attractions',
        'tab' => 'attractions',
        'href' => '#',
        'icon' => 'attractions',
    ],
    [
        'label' => 'Tasks',
        'tab' => 'tasks',
        'href' => '#',
        'icon' => 'tasks',
    ],
    [
        'label' => 'Guides',
        'tab' => 'guides',
        'href' => '#',
        'icon' => 'guides',
    ],
    [
        'label' => 'Reports',
        'tab' => 'reports',
        'href' => '#',
        'icon' => 'reports',
        'id' => 'reportsTab',
    ],
    [
        'label' => 'User Progress',
        'tab' => 'userProgress',
        'href' => '#',
        'icon' => 'userProgress',
    ],
];

// Rewards (visibility enforced client-side based on role)
$sidebarLinks[] = [
    'label' => 'Rewards',
    'tab' => 'rewards',
    'href' => '#',
    'icon' => 'rewards',
];

// Admin Users (Superadmin only)
if ($isSuperadmin) {
    $sidebarLinks[] = [
        'label' => 'Admin Users',
        'tab' => 'adminUsers',
        'href' => '#',
        'icon' => 'adminUsers',
        'id' => 'adminUsersNavLink',
    ];
}

$adminName = $_SESSION['admin_full_name'] ?? ($_SESSION['admin_email'] ?? 'User');
// Display the actual role from session (capitalize first letter for display)
$adminRoleDisplay = ucfirst(strtolower($adminRole)) ?: 'User';

// Known public avatar (can be replaced with local uploads later)
$adminAvatarUrl = $_SESSION['admin_avatar_url'] ?? 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=96&h=96&q=80';

function kt_sidebar_icon(string $name): string
{
    // Minimal inline SVG set (replaces lucide-react/font-awesome)
    switch ($name) {
        case 'dashboard':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>';
        case 'attractions':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>';
        case 'tasks':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11H7V9h2v2zm0 6H7v-2h2v2zm0-12H7V3h2v2zm4 6h8V9h-8v2zm0 6h8v-2h-8v2zM13 5h8V3h-8v2z"/></svg>';
        case 'guides':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10V2zm-2 18H8V4h8v16zm-6-2h6v-2h-6v2zm0-4h6v-2h-6v2zm0-4h6V8h-6v2z"/></svg>';
        case 'rewards':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-3V4H7v3H4v4c0 2.21 1.79 4 4 4h.17A5.99 5.99 0 0 0 11 18.83V22h2v-3.17A5.99 5.99 0 0 0 15.83 15H16c2.21 0 4-1.79 4-4V7zM6 11V9h1v4.03C6.42 12.69 6 11.9 6 11zm12 0c0 .9-.42 1.69-1 2.03V9h1v2z"/></svg>';
        case 'reports':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H5.17L4 17.17V4zm2 2v8h12V6H6zm0 14h12v-2H8l-2 2z"/></svg>';
        case 'userProgress':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2v-4h-2v4zm4 0h2V4h-2v13zm4 0h2v-9h-2v9z"/></svg>';
        case 'adminUsers':
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h7v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>';
        default:
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2z"/></svg>';
    }
}
?>

<aside class="sidebar kt-sidebar" id="ktSidebar" data-collapsed="true">
    <!-- Mobile top bar -->
    <div class="kt-sidebar-mobilebar" id="ktSidebarMobileBar">
        <button class="kt-sidebar-mobilebtn" type="button" id="ktSidebarOpenBtn" aria-label="Open menu">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>
        </button>
    </div>

    <!-- Mobile overlay panel -->
    <div class="kt-sidebar-overlay" id="ktSidebarOverlay" aria-hidden="true">
        <div class="kt-sidebar-overlay-inner">
            <button class="kt-sidebar-close" type="button" id="ktSidebarCloseBtn" aria-label="Close menu">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3 1.42 1.42z"/></svg>
            </button>

            <div class="kt-sidebar-content">
                <nav class="sidebar-nav kt-sidebar-nav" aria-label="Admin navigation">
                    <ul class="kt-sidebar-list">
                        <?php foreach ($sidebarLinks as $item): ?>
                            <li>
                                <a
                                    href="<?= htmlspecialchars($item['href']) ?>"
                                    class="nav-link kt-sidebar-link"
                                    data-tab="<?= htmlspecialchars($item['tab']) ?>"
                                    <?php if (!empty($item['id'])): ?>id="<?= htmlspecialchars($item['id']) ?>"<?php endif; ?>
                                >
                                    <span class="kt-sidebar-icon" aria-hidden="true"><?= kt_sidebar_icon($item['icon']) ?></span>
                                    <span class="kt-sidebar-label"><?= htmlspecialchars($item['label']) ?></span>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </nav>

                <div class="kt-sidebar-footer">
                    <a href="#" class="kt-sidebar-user" id="ktSidebarUserLink" onclick="if (typeof editProfile === 'function') { editProfile(); } return false;">
                        <img src="<?= htmlspecialchars($adminAvatarUrl) ?>" alt="User avatar" class="kt-sidebar-avatar">
                        <div class="kt-sidebar-user-info">
                            <span class="kt-sidebar-username"><?= htmlspecialchars($adminName) ?></span>
                            <span class="kt-sidebar-role"><?= htmlspecialchars($adminRoleDisplay) ?></span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Desktop sidebar body (hover expand) -->
    <div class="kt-sidebar-desktop">
        <nav class="sidebar-nav kt-sidebar-nav" aria-label="Admin navigation">
            <ul class="kt-sidebar-list">
                <?php foreach ($sidebarLinks as $item): ?>
                    <li>
                        <a
                            href="<?= htmlspecialchars($item['href']) ?>"
                            class="nav-link kt-sidebar-link"
                            data-tab="<?= htmlspecialchars($item['tab']) ?>"
                            <?php if (!empty($item['id'])): ?>id="<?= htmlspecialchars($item['id']) ?>"<?php endif; ?>
                        >
                            <span class="kt-sidebar-icon" aria-hidden="true"><?= kt_sidebar_icon($item['icon']) ?></span>
                            <span class="kt-sidebar-label"><?= htmlspecialchars($item['label']) ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </nav>

        <div class="kt-sidebar-footer">
            <a href="#" class="kt-sidebar-user" id="ktSidebarUserLinkDesktop" onclick="if (typeof editProfile === 'function') { editProfile(); } return false;">
                <img src="<?= htmlspecialchars($adminAvatarUrl) ?>" alt="User avatar" class="kt-sidebar-avatar">
                <div class="kt-sidebar-user-info">
                    <span class="kt-sidebar-username"><?= htmlspecialchars($adminName) ?></span>
                    <span class="kt-sidebar-role"><?= htmlspecialchars($adminRoleDisplay) ?></span>
                </div>
            </a>
        </div>
    </div>
</aside>
