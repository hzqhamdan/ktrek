<?php
/**
 * Simple QR Code Generator using Google Charts API
 * Lightweight alternative that doesn't require external libraries
 */

class QRCodeGenerator {
    
    /**
     * Generate QR code URL using Google Charts API
     * 
     * @param string $data - Data to encode in QR
     * @param int $size - Size of QR code (default 300x300)
     * @return string - URL to QR code image
     */
    public static function generateURL($data, $size = 300) {
        $encodedData = urlencode($data);
        return "https://chart.googleapis.com/chart?chs={$size}x{$size}&cht=qr&chl={$encodedData}&choe=UTF-8";
    }
    
    /**
     * Generate a secure random QR code token
     * 
     * @param int $length - Length in bytes (default 32)
     * @return string - Hex encoded random token
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Stream QR code image directly (proxy from Google Charts)
     * 
     * @param string $data - Data to encode
     * @param int $size - Size of QR code
     */
    public static function streamImage($data, $size = 300) {
        $url = self::generateURL($data, $size);
        
        // Fetch image from Google Charts
        $imageData = @file_get_contents($url);
        
        if ($imageData === false) {
            // Fallback: generate simple error image
            header('Content-Type: image/png');
            $img = imagecreate(300, 300);
            $bg = imagecolorallocate($img, 255, 255, 255);
            $text = imagecolorallocate($img, 255, 0, 0);
            imagestring($img, 5, 50, 140, 'QR Generation Failed', $text);
            imagepng($img);
            imagedestroy($img);
            return;
        }
        
        // Stream the image
        header('Content-Type: image/png');
        header('Content-Length: ' . strlen($imageData));
        header('Cache-Control: public, max-age=86400'); // Cache for 1 day
        echo $imageData;
    }
    
    /**
     * Calculate distance between two GPS coordinates (Haversine formula)
     * 
     * @param float $lat1 - Latitude of point 1
     * @param float $lon1 - Longitude of point 1
     * @param float $lat2 - Latitude of point 2
     * @param float $lon2 - Longitude of point 2
     * @return float - Distance in meters
     */
    public static function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371000; // Earth radius in meters
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
    
    /**
     * Validate if user is within acceptable range of attraction
     * 
     * @param float $userLat - User's latitude
     * @param float $userLon - User's longitude
     * @param float $attractionLat - Attraction's latitude
     * @param float $attractionLon - Attraction's longitude
     * @param int $maxDistance - Max distance in meters (default 100m)
     * @return array - ['valid' => bool, 'distance' => float, 'message' => string]
     */
    public static function validateProximity($userLat, $userLon, $attractionLat, $attractionLon, $maxDistance = 100) {
        if (empty($attractionLat) || empty($attractionLon)) {
            return [
                'valid' => true, // Skip validation if attraction has no coordinates
                'distance' => null,
                'message' => 'Location validation skipped (no attraction coordinates)'
            ];
        }
        
        if (empty($userLat) || empty($userLon)) {
            return [
                'valid' => false,
                'distance' => null,
                'message' => 'Your location is required for check-in'
            ];
        }
        
        $distance = self::calculateDistance($userLat, $userLon, $attractionLat, $attractionLon);
        
        if ($distance <= $maxDistance) {
            return [
                'valid' => true,
                'distance' => round($distance, 2),
                'message' => 'Location verified'
            ];
        } else {
            return [
                'valid' => false,
                'distance' => round($distance, 2),
                'message' => "You must be within {$maxDistance}m of the attraction. You are " . round($distance) . "m away."
            ];
        }
    }
}
?>
