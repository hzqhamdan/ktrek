<?php
// backend/api/debug-data.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

require_once '../config/constants.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT * FROM attractions LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'raw_data_sample' => $row,
        'php_types' => [
            'latitude' => gettype($row['latitude'] ?? null),
            'longitude' => gettype($row['longitude'] ?? null),
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
