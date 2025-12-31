<?php
// Application constants

define('APP_NAME', 'K-Trek');
define('SESSION_LIFETIME', 86400); // 24 hours in seconds
define('MAX_UPLOAD_SIZE', 5242880); // 5MB in bytes
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/jpg', 'image/png']);
define('UPLOAD_DIR', __DIR__ . '/../uploads/photos/');

/**
 * Compute the public-facing scheme/host for the current request.
 * Supports running locally, on LAN IPs, and behind HTTPS tunnels/proxies
 * (cloudflared/ngrok) via X-Forwarded-* headers.
 */
function ktrek_get_request_origin(): string {
    // Prefer forwarded headers when behind a proxy/tunnel
    $proto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null;
    if (!$proto) {
        $https = $_SERVER['HTTPS'] ?? '';
        $proto = (!empty($https) && strtolower($https) !== 'off') ? 'https' : 'http';
    }

    $host = $_SERVER['HTTP_X_FORWARDED_HOST']
        ?? $_SERVER['HTTP_HOST']
        ?? ($_SERVER['SERVER_NAME'] ?? 'localhost');

    // Some proxies may send multiple hosts, take the first
    if (strpos($host, ',') !== false) {
        $host = trim(explode(',', $host)[0]);
    }

    return $proto . '://' . $host;
}

// Public base URL for images and other assets (no trailing slash)
define('APP_BASE_URL', ktrek_get_request_origin());

// Public base URL for backend endpoints
// Assumes backend is served under /backend (as in this project structure).
define('BASE_URL', APP_BASE_URL . '/backend');
?>