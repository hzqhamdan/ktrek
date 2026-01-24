<?php
// backend/api/debug-db.php

// Debug: Log raw headers
error_reporting(E_ALL);
ini_set('display_errors', 1); // SHOW HTML errors for 500 debugging

// Basic CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/constants.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database object is null - connection failed inside class");
    }

    $query = "SELECT count(*) as count FROM attractions";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database Connected',
        'row_count' => $row['count'],
        'database_host' => 'localhost',
        'database_name' => 'ktrek_db'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
