<?php
/**
 * Image Proxy Endpoint
 * Serves images through the API to bypass ngrok interstitial warning
 */

require_once '../../config/cors.php';

// Get image path from query parameter
$path = $_GET['path'] ?? '';

if (empty($path)) {
    http_response_code(400);
    echo json_encode(['error' => 'Image path required']);
    exit;
}

// Security: Prevent directory traversal
$path = str_replace(['../', '..\\'], '', $path);

// Construct full path
$basePath = __DIR__ . '/../../../';
$fullPath = $basePath . $path;

// Check if file exists
if (!file_exists($fullPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Image not found']);
    exit;
}

// Check if it's actually an image
$imageInfo = @getimagesize($fullPath);
if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Not a valid image']);
    exit;
}

// Get mime type
$mimeType = $imageInfo['mime'];

// Set appropriate headers
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: public, max-age=31536000'); // Cache for 1 year
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

// Output the image
readfile($fullPath);
exit;
?>
