<?php

/**
 * Normalize an attraction image path from the database into a relative path.
 *
 * Accepted DB formats seen in this project:
 * - full URL: http://localhost/admin/uploads/file.jpg
 * - full URL: https://.../admin/uploads/file.jpg
 * - relative path: uploads/file.jpg
 * - relative path: admin/uploads/file.jpg
 * - bare filename: file.jpg
 * 
 * Returns just the relative path for frontend to handle URL construction
 */
function ktrek_normalize_image_url(?string $image): ?string {
    if (!$image) return null;

    $image = trim($image);
    if ($image === '') return null;

    // If it's a full URL (localhost or otherwise), extract just the path
    if (preg_match('/^https?:\/\//i', $image)) {
        // Extract path from URL
        $parsedUrl = parse_url($image);
        if (isset($parsedUrl['path'])) {
            $image = ltrim($parsedUrl['path'], '/');
        } else {
            // Can't parse URL, return null
            return null;
        }
    }

    // Remove leading slashes
    $path = ltrim($image, '/');

    // If it's just a filename (no slashes), it is most likely stored in admin/uploads
    if (strpos($path, '/') === false) {
        $path = 'admin/uploads/' . $path;
    }

    // If it starts with uploads/, make it admin/uploads/
    if (strpos($path, 'uploads/') === 0) {
        $path = 'admin/' . $path;
    }

    // Return just the relative path - frontend will construct the full URL
    return $path;
}
