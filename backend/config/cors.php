<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://172.20.10.3:5173',  // Allow mobile access from local network
];

// Check if origin is a cloudflared tunnel
$isCloudflaredTunnel = strpos($origin, '.trycloudflare.com') !== false;
$isNgrokTunnel = strpos($origin, '.ngrok.io') !== false;

if (in_array($origin, $allowedOrigins) || $isCloudflaredTunnel || $isNgrokTunnel) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback to allow any origin for development (remove in production)
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

