<?php
// iSCMS Admin Panel - Export Users API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();

try {
    // Get export format (default to CSV)
    $format = isset($_GET['format']) ? sanitizeInput($_GET['format']) : 'csv';
    
    // Get all users
    $query = "
        SELECT 
            user_id,
            full_name,
            email,
            phone_number,
            date_of_birth,
            age,
            gender,
            health_status,
            height_cm,
            current_weight_kg,
            target_weight_kg,
            bmi,
            daily_sugar_limit_g,
            daily_calorie_limit,
            state,
            city,
            is_active,
            is_premium,
            premium_until,
            device_type,
            app_version,
            registration_date,
            last_active
        FROM users
        ORDER BY registration_date DESC
    ";
    
    $result = $conn->query($query);
    
    if ($format === 'csv') {
        // Export as CSV
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="iscms_users_' . date('Y-m-d_H-i-s') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // Write CSV headers
        fputcsv($output, [
            'User ID',
            'Full Name',
            'Email',
            'Phone Number',
            'Date of Birth',
            'Age',
            'Gender',
            'Health Status',
            'Height (cm)',
            'Current Weight (kg)',
            'Target Weight (kg)',
            'BMI',
            'Daily Sugar Limit (g)',
            'Daily Calorie Limit',
            'State',
            'City',
            'Status',
            'Premium',
            'Premium Until',
            'Device Type',
            'App Version',
            'Registration Date',
            'Last Active'
        ]);
        
        // Write data rows
        while ($row = $result->fetch_assoc()) {
            fputcsv($output, [
                $row['user_id'],
                $row['full_name'],
                $row['email'] ?: 'N/A',
                $row['phone_number'] ?: 'N/A',
                $row['date_of_birth'] ?: 'N/A',
                $row['age'] ?: 'N/A',
                $row['gender'] ?: 'N/A',
                $row['health_status'],
                $row['height_cm'] ?: 'N/A',
                $row['current_weight_kg'] ?: 'N/A',
                $row['target_weight_kg'] ?: 'N/A',
                $row['bmi'] ?: 'N/A',
                $row['daily_sugar_limit_g'],
                $row['daily_calorie_limit'],
                $row['state'] ?: 'N/A',
                $row['city'] ?: 'N/A',
                $row['is_active'] ? 'Active' : 'Inactive',
                $row['is_premium'] ? 'Yes' : 'No',
                $row['premium_until'] ?: 'N/A',
                $row['device_type'] ?: 'N/A',
                $row['app_version'] ?: 'N/A',
                $row['registration_date'],
                $row['last_active'] ?: 'Never'
            ]);
        }
        
        fclose($output);
        
        // Log the export
        logAudit($conn, 'Export', 'users', null, 'Exported users to CSV');
        
    } elseif ($format === 'json') {
        // Export as JSON
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="iscms_users_' . date('Y-m-d_H-i-s') . '.json"');
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        echo json_encode([
            'export_date' => date('Y-m-d H:i:s'),
            'total_users' => count($users),
            'users' => $users
        ], JSON_PRETTY_PRINT);
        
        // Log the export
        logAudit($conn, 'Export', 'users', null, 'Exported users to JSON');
        
    } elseif ($format === 'excel') {
        // Export as Excel (HTML table that Excel can open)
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment; filename="iscms_users_' . date('Y-m-d_H-i-s') . '.xls"');
        
        echo '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
        echo '<head>';
        echo '<meta charset="UTF-8">';
        echo '<xml>';
        echo '<x:ExcelWorkbook>';
        echo '<x:ExcelWorksheets>';
        echo '<x:ExcelWorksheet>';
        echo '<x:Name>iSCMS Users</x:Name>';
        echo '<x:WorksheetOptions>';
        echo '<x:Print><x:ValidPrinterInfo/></x:Print>';
        echo '</x:WorksheetOptions>';
        echo '</x:ExcelWorksheet>';
        echo '</x:ExcelWorksheets>';
        echo '</x:ExcelWorkbook>';
        echo '</xml>';
        echo '</head>';
        echo '<body>';
        echo '<table border="1">';
        echo '<thead>';
        echo '<tr>';
        echo '<th>User ID</th>';
        echo '<th>Full Name</th>';
        echo '<th>Email</th>';
        echo '<th>Phone Number</th>';
        echo '<th>Date of Birth</th>';
        echo '<th>Age</th>';
        echo '<th>Gender</th>';
        echo '<th>Health Status</th>';
        echo '<th>Height (cm)</th>';
        echo '<th>Current Weight (kg)</th>';
        echo '<th>Target Weight (kg)</th>';
        echo '<th>BMI</th>';
        echo '<th>Daily Sugar Limit (g)</th>';
        echo '<th>Daily Calorie Limit</th>';
        echo '<th>State</th>';
        echo '<th>City</th>';
        echo '<th>Status</th>';
        echo '<th>Premium</th>';
        echo '<th>Premium Until</th>';
        echo '<th>Device Type</th>';
        echo '<th>App Version</th>';
        echo '<th>Registration Date</th>';
        echo '<th>Last Active</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        
        while ($row = $result->fetch_assoc()) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($row['user_id']) . '</td>';
            echo '<td>' . htmlspecialchars($row['full_name']) . '</td>';
            echo '<td>' . htmlspecialchars($row['email'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['phone_number'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['date_of_birth'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['age'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['gender'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['health_status']) . '</td>';
            echo '<td>' . htmlspecialchars($row['height_cm'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['current_weight_kg'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['target_weight_kg'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['bmi'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['daily_sugar_limit_g']) . '</td>';
            echo '<td>' . htmlspecialchars($row['daily_calorie_limit']) . '</td>';
            echo '<td>' . htmlspecialchars($row['state'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['city'] ?: 'N/A') . '</td>';
            echo '<td>' . ($row['is_active'] ? 'Active' : 'Inactive') . '</td>';
            echo '<td>' . ($row['is_premium'] ? 'Yes' : 'No') . '</td>';
            echo '<td>' . htmlspecialchars($row['premium_until'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['device_type'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['app_version'] ?: 'N/A') . '</td>';
            echo '<td>' . htmlspecialchars($row['registration_date']) . '</td>';
            echo '<td>' . htmlspecialchars($row['last_active'] ?: 'Never') . '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        echo '</body>';
        echo '</html>';
        
        // Log the export
        logAudit($conn, 'Export', 'users', null, 'Exported users to Excel');
    } else {
        // Invalid format
        $conn->close();
        sendResponse(false, [], 'Invalid export format. Use: csv, json, or excel');
    }
    
    $conn->close();
    exit();
    
} catch (Exception $e) {
    $conn->close();
    
    // Send error response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Error exporting users: ' . $e->getMessage()
    ]);
    exit();
}
?>
