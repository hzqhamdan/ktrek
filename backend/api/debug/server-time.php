<?php
require_once '../../config/cors.php';
require_once '../../utils/response.php';

// Simple endpoint to check server time
$server_time = date('H:i:s');
$server_date = date('Y-m-d H:i:s');
$timezone = date_default_timezone_get();

Response::success([
    'server_time' => $server_time,
    'server_datetime' => $server_date,
    'timezone' => $timezone,
    'timestamp' => time()
], "Server time retrieved");
?>
