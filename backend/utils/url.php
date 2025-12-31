<?php

/**
 * Normalize an attraction image path from the database into an absolute URL.
 *
 * Accepted DB formats seen in this project:
 * - full URL: https://.../admin/uploads/file.jpg
 * - relative path: uploads/file.jpg
 * - relative path: admin/uploads/file.jpg
 * - bare filename: file.jpg
 */
function ktrek_normalize_image_url(?string $image): ?string {
    if (!$image) return null;

    $image = trim($image);
    if ($image === '') return null;

    // Already absolute URL
    if (preg_match('/^https?:\\/\\//i', $image)) {
        return $image;
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

    // If it starts with admin/uploads already, keep as-is

    return APP_BASE_URL . '/' . $path;
}
