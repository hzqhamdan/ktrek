<?php

require_once __DIR__ . '/../config/constants.php';

class Upload {
    
    /**
     * Upload a photo file
     * 
     * @param array $file - The $_FILES array element
     * @param int $user_id - User ID for filename
     * @param int $task_id - Task ID for filename
     * @return array - ['success' => bool, 'message' => string, 'url' => string|null]
     */
    public static function uploadPhoto($file, $user_id, $task_id) {
        // Check if file was uploaded
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return [
                'success' => false,
                'message' => self::getUploadErrorMessage($file['error']),
                'url' => null
            ];
        }

        // Validate file type
        $validation = self::validateImage($file);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'message' => $validation['message'],
                'url' => null
            ];
        }

        // Generate unique filename
        $filename = self::generatePhotoFilename($user_id, $task_id, $file['name']);
        $filepath = UPLOAD_DIR . $filename;

        // Create upload directory if not exists
        if (!self::ensureDirectoryExists(UPLOAD_DIR)) {
            return [
                'success' => false,
                'message' => 'Failed to create upload directory',
                'url' => null
            ];
        }

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return [
                'success' => false,
                'message' => 'Failed to save file',
                'url' => null
            ];
        }

        // Generate URL
        $url = BASE_URL . '/uploads/photos/' . $filename;

        return [
            'success' => true,
            'message' => 'File uploaded successfully',
            'url' => $url
        ];
    }

    /**
     * Validate image file
     * 
     * @param array $file - The $_FILES array element
     * @return array - ['valid' => bool, 'message' => string]
     */
    private static function validateImage($file) {
        // Check file size
        if ($file['size'] > MAX_UPLOAD_SIZE) {
            $maxSizeMB = MAX_UPLOAD_SIZE / (1024 * 1024);
            return [
                'valid' => false,
                'message' => "File size exceeds maximum allowed size of {$maxSizeMB}MB"
            ];
        }

        // Check file type by MIME
        if (!in_array($file['type'], ALLOWED_IMAGE_TYPES)) {
            return [
                'valid' => false,
                'message' => 'Invalid file type. Only JPEG, JPG, and PNG images are allowed'
            ];
        }

        // Additional check: verify actual image using getimagesize
        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            return [
                'valid' => false,
                'message' => 'File is not a valid image'
            ];
        }

        // Verify MIME type matches actual image type
        $allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!in_array($imageInfo['mime'], $allowedMimeTypes)) {
            return [
                'valid' => false,
                'message' => 'Invalid image format detected'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Valid image'
        ];
    }

    /**
     * Generate unique filename for photo
     * 
     * @param int $user_id
     * @param int $task_id
     * @param string $original_name
     * @return string
     */
    private static function generatePhotoFilename($user_id, $task_id, $original_name) {
        $extension = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
        $timestamp = time();
        $random = bin2hex(random_bytes(4));
        
        return "photo_{$user_id}_{$task_id}_{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Ensure directory exists and is writable
     * 
     * @param string $directory
     * @return bool
     */
    private static function ensureDirectoryExists($directory) {
        if (!is_dir($directory)) {
            if (!mkdir($directory, 0777, true)) {
                return false;
            }
        }

        if (!is_writable($directory)) {
            chmod($directory, 0777);
        }

        return is_writable($directory);
    }

    /**
     * Delete a photo file
     * 
     * @param string $url - Full URL of the photo
     * @return bool
     */
    public static function deletePhoto($url) {
        // Extract filename from URL
        $filename = basename($url);
        $filepath = UPLOAD_DIR . $filename;

        // Check if file exists
        if (!file_exists($filepath)) {
            return false;
        }

        // Delete file
        return unlink($filepath);
    }

    /**
     * Get upload error message
     * 
     * @param int $error_code
     * @return string
     */
    private static function getUploadErrorMessage($error_code) {
        switch ($error_code) {
            case UPLOAD_ERR_INI_SIZE:
                return 'File exceeds upload_max_filesize directive in php.ini';
            case UPLOAD_ERR_FORM_SIZE:
                return 'File exceeds MAX_FILE_SIZE directive in HTML form';
            case UPLOAD_ERR_PARTIAL:
                return 'File was only partially uploaded';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Missing temporary folder';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file to disk';
            case UPLOAD_ERR_EXTENSION:
                return 'File upload stopped by PHP extension';
            default:
                return 'Unknown upload error';
        }
    }

    /**
     * Get file size in human-readable format
     * 
     * @param int $bytes
     * @return string
     */
    public static function formatFileSize($bytes) {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Validate multiple files upload (for future use)
     * 
     * @param array $files - $_FILES array
     * @param int $max_files - Maximum number of files allowed
     * @return array
     */
    public static function validateMultipleFiles($files, $max_files = 5) {
        if (!isset($files) || empty($files['name'][0])) {
            return [
                'valid' => false,
                'message' => 'No files uploaded'
            ];
        }

        $file_count = count($files['name']);
        
        if ($file_count > $max_files) {
            return [
                'valid' => false,
                'message' => "Maximum {$max_files} files allowed"
            ];
        }

        return [
            'valid' => true,
            'message' => 'Files valid',
            'count' => $file_count
        ];
    }

    /**
     * Upload multiple photos (for future use)
     * 
     * @param array $files - $_FILES array
     * @param int $user_id
     * @param int $task_id
     * @return array
     */
    public static function uploadMultiplePhotos($files, $user_id, $task_id) {
        $uploaded_urls = [];
        $errors = [];

        $file_count = count($files['name']);

        for ($i = 0; $i < $file_count; $i++) {
            $file = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i]
            ];

            $result = self::uploadPhoto($file, $user_id, $task_id);

            if ($result['success']) {
                $uploaded_urls[] = $result['url'];
            } else {
                $errors[] = [
                    'file' => $file['name'],
                    'error' => $result['message']
                ];
            }
        }

        return [
            'success' => count($uploaded_urls) > 0,
            'uploaded' => $uploaded_urls,
            'errors' => $errors,
            'total_uploaded' => count($uploaded_urls),
            'total_failed' => count($errors)
        ];
    }

    /**
     * Check if upload directory is writable
     * 
     * @return array
     */
    public static function checkUploadDirectory() {
        $upload_dir = UPLOAD_DIR;
        
        $checks = [
            'exists' => is_dir($upload_dir),
            'writable' => is_writable($upload_dir),
            'path' => $upload_dir
        ];

        $checks['status'] = $checks['exists'] && $checks['writable'] ? 'OK' : 'ERROR';

        return $checks;
    }

    /**
     * Get upload directory info
     * 
     * @return array
     */
    public static function getUploadDirectoryInfo() {
        $upload_dir = UPLOAD_DIR;
        
        $info = [
            'path' => $upload_dir,
            'exists' => is_dir($upload_dir),
            'writable' => is_writable($upload_dir),
            'files_count' => 0,
            'total_size' => 0,
            'free_space' => 0
        ];

        if ($info['exists']) {
            $files = glob($upload_dir . '*');
            $info['files_count'] = count($files);
            
            $total_size = 0;
            foreach ($files as $file) {
                if (is_file($file)) {
                    $total_size += filesize($file);
                }
            }
            $info['total_size'] = self::formatFileSize($total_size);
            $info['free_space'] = self::formatFileSize(disk_free_space($upload_dir));
        }

        return $info;
    }

    /**
     * Clean up old files (for maintenance)
     * 
     * @param int $days - Delete files older than X days
     * @return array
     */
    public static function cleanupOldFiles($days = 90) {
        $upload_dir = UPLOAD_DIR;
        $cutoff_time = time() - ($days * 24 * 60 * 60);
        
        $deleted_count = 0;
        $deleted_size = 0;
        $errors = [];

        if (!is_dir($upload_dir)) {
            return [
                'success' => false,
                'message' => 'Upload directory does not exist'
            ];
        }

        $files = glob($upload_dir . '*');
        
        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $cutoff_time) {
                $file_size = filesize($file);
                
                if (unlink($file)) {
                    $deleted_count++;
                    $deleted_size += $file_size;
                } else {
                    $errors[] = basename($file);
                }
            }
        }

        return [
            'success' => true,
            'deleted_count' => $deleted_count,
            'deleted_size' => self::formatFileSize($deleted_size),
            'errors' => $errors
        ];
    }

    /**
     * Compress image (for future optimization)
     * 
     * @param string $source - Source file path
     * @param string $destination - Destination file path
     * @param int $quality - Quality (0-100)
     * @return bool
     */
    public static function compressImage($source, $destination, $quality = 75) {
        $imageInfo = getimagesize($source);
        
        if ($imageInfo === false) {
            return false;
        }

        $mime = $imageInfo['mime'];

        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = imagecreatefromjpeg($source);
                $result = imagejpeg($image, $destination, $quality);
                break;
            case 'image/png':
                $image = imagecreatefrompng($source);
                // PNG quality is 0-9, convert from 0-100
                $png_quality = 9 - round(($quality / 100) * 9);
                $result = imagepng($image, $destination, $png_quality);
                break;
            default:
                return false;
        }

        if (isset($image)) {
            imagedestroy($image);
        }

        return $result;
    }

    /**
     * Resize image (for thumbnails or optimization)
     * 
     * @param string $source - Source file path
     * @param string $destination - Destination file path
     * @param int $max_width - Maximum width
     * @param int $max_height - Maximum height
     * @return bool
     */
    public static function resizeImage($source, $destination, $max_width = 1920, $max_height = 1080) {
        $imageInfo = getimagesize($source);
        
        if ($imageInfo === false) {
            return false;
        }

        list($width, $height) = $imageInfo;
        $mime = $imageInfo['mime'];

        // Calculate new dimensions
        $ratio = min($max_width / $width, $max_height / $height);
        
        // Only resize if image is larger than max dimensions
        if ($ratio >= 1) {
            return copy($source, $destination);
        }

        $new_width = round($width * $ratio);
        $new_height = round($height * $ratio);

        // Create new image
        $new_image = imagecreatetruecolor($new_width, $new_height);

        // Load source image
        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $source_image = imagecreatefromjpeg($source);
                break;
            case 'image/png':
                $source_image = imagecreatefrompng($source);
                // Preserve transparency
                imagealphablending($new_image, false);
                imagesavealpha($new_image, true);
                break;
            default:
                return false;
        }

        // Resize
        imagecopyresampled($new_image, $source_image, 0, 0, 0, 0, $new_width, $new_height, $width, $height);

        // Save resized image
        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $result = imagejpeg($new_image, $destination, 85);
                break;
            case 'image/png':
                $result = imagepng($new_image, $destination, 8);
                break;
            default:
                $result = false;
        }

        // Clean up
        imagedestroy($new_image);
        imagedestroy($source_image);

        return $result;
    }
}
?>


<?php
// ============================================
// USAGE EXAMPLES
// ============================================

/*

// Example 1: Upload a single photo in your API endpoint
// ---------------------------------------------------------

require_once '../../utils/upload.php';

if (isset($_FILES['photo'])) {
    $result = Upload::uploadPhoto($_FILES['photo'], $user_id, $task_id);
    
    if ($result['success']) {
        $photo_url = $result['url'];
        // Save $photo_url to database
    } else {
        echo $result['message'];
    }
}


// Example 2: Check upload directory status
// ---------------------------------------------------------

$directory_status = Upload::checkUploadDirectory();
print_r($directory_status);
// Output: ['exists' => true, 'writable' => true, 'status' => 'OK', 'path' => '...']


// Example 3: Get upload directory information
// ---------------------------------------------------------

$info = Upload::getUploadDirectoryInfo();
print_r($info);
// Output: ['path' => '...', 'exists' => true, 'files_count' => 42, 'total_size' => '15.3 MB', ...]


// Example 4: Delete a photo
// ---------------------------------------------------------

$photo_url = 'http://localhost/ktrek-backend/uploads/photos/photo_1_5_1234567890.jpg';
$deleted = Upload::deletePhoto($photo_url);

if ($deleted) {
    echo "Photo deleted successfully";
} else {
    echo "Failed to delete photo or photo not found";
}


// Example 5: Clean up old files (maintenance script)
// ---------------------------------------------------------

// Delete files older than 90 days
$cleanup_result = Upload::cleanupOldFiles(90);
print_r($cleanup_result);
// Output: ['success' => true, 'deleted_count' => 5, 'deleted_size' => '2.5 MB', 'errors' => []]


// Example 6: Upload and compress image
// ---------------------------------------------------------

if (isset($_FILES['photo'])) {
    $result = Upload::uploadPhoto($_FILES['photo'], $user_id, $task_id);
    
    if ($result['success']) {
        $filename = basename($result['url']);
        $source = UPLOAD_DIR . $filename;
        $compressed = UPLOAD_DIR . 'compressed_' . $filename;
        
        // Compress to 75% quality
        Upload::compressImage($source, $compressed, 75);
        
        // Optionally delete original and rename compressed
        unlink($source);
        rename($compressed, $source);
    }
}


// Example 7: Upload and resize image
// ---------------------------------------------------------

if (isset($_FILES['photo'])) {
    $result = Upload::uploadPhoto($_FILES['photo'], $user_id, $task_id);
    
    if ($result['success']) {
        $filename = basename($result['url']);
        $source = UPLOAD_DIR . $filename;
        $resized = UPLOAD_DIR . 'resized_' . $filename;
        
        // Resize to max 1920x1080
        Upload::resizeImage($source, $resized, 1920, 1080);
        
        // Replace original with resized
        unlink($source);
        rename($resized, $source);
    }
}


// Example 8: Upload multiple photos (future use)
// ---------------------------------------------------------

if (isset($_FILES['photos'])) {
    $validation = Upload::validateMultipleFiles($_FILES['photos'], 5);
    
    if ($validation['valid']) {
        $result = Upload::uploadMultiplePhotos($_FILES['photos'], $user_id, $task_id);
        
        echo "Uploaded: " . $result['total_uploaded'] . " photos\n";
        echo "Failed: " . $result['total_failed'] . " photos\n";
        
        foreach ($result['uploaded'] as $url) {
            echo "Saved: $url\n";
        }
        
        foreach ($result['errors'] as $error) {
            echo "Error: {$error['file']} - {$error['error']}\n";
        }
    } else {
        echo $validation['message'];
    }
}

*/
?>