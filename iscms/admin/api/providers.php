<?php
// iSCMS Admin Panel - Healthcare Providers API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all healthcare providers
            $verified = isset($_GET['verified']) ? sanitizeInput($_GET['verified']) : '';
            
            $query = "SELECT provider_id, full_name, email, license_number, specialization, hospital_clinic, phone_number, is_verified, is_active, created_at FROM healthcare_providers WHERE 1=1";
            
            if ($verified === 'true') {
                $query .= " AND is_verified = 1";
            } elseif ($verified === 'false') {
                $query .= " AND is_verified = 0";
            }
            
            $query .= " ORDER BY created_at DESC";
            
            $result = $conn->query($query);
            $providers = [];
            
            while ($row = $result->fetch_assoc()) {
                $providers[] = $row;
            }
            
            logAudit($conn, 'View', 'healthcare_providers', null, 'Viewed providers list');
            $conn->close();
            sendResponse(true, $providers, 'Providers retrieved successfully');
            break;
            
        case 'POST':
            // Create new provider
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!validateRequired($input, ['email', 'password', 'full_name', 'license_number'])) {
                $conn->close();
                sendResponse(false, [], 'Required fields missing');
            }
            
            $email = sanitizeInput($input['email']);
            $passwordHash = hashPassword($input['password']);
            $fullName = sanitizeInput($input['full_name']);
            $licenseNumber = sanitizeInput($input['license_number']);
            $specialization = isset($input['specialization']) ? sanitizeInput($input['specialization']) : null;
            $hospitalClinic = isset($input['hospital_clinic']) ? sanitizeInput($input['hospital_clinic']) : null;
            $phoneNumber = isset($input['phone_number']) ? sanitizeInput($input['phone_number']) : null;
            
            $stmt = $conn->prepare("INSERT INTO healthcare_providers (email, password_hash, full_name, license_number, specialization, hospital_clinic, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssss", $email, $passwordHash, $fullName, $licenseNumber, $specialization, $hospitalClinic, $phoneNumber);
            
            if ($stmt->execute()) {
                $providerId = $stmt->insert_id;
                logAudit($conn, 'Create', 'healthcare_providers', $providerId, 'Provider created: ' . $fullName);
                $stmt->close();
                $conn->close();
                sendResponse(true, ['provider_id' => $providerId], 'Provider created successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to create provider');
            }
            break;
            
        case 'PUT':
            // Update provider (verify)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['provider_id'])) {
                $conn->close();
                sendResponse(false, [], 'Provider ID is required');
            }
            
            $providerId = intval($input['provider_id']);
            
            if ($input['action'] === 'verify') {
                $stmt = $conn->prepare("UPDATE healthcare_providers SET is_verified = 1, verification_date = NOW() WHERE provider_id = ?");
                $stmt->bind_param("i", $providerId);
                $stmt->execute();
                
                logAudit($conn, 'Update', 'healthcare_providers', $providerId, 'Provider verified');
                $stmt->close();
                $conn->close();
                sendResponse(true, [], 'Provider verified successfully');
            }
            
            $conn->close();
            sendResponse(false, [], 'Invalid action');
            break;
            
        default:
            $conn->close();
            sendResponse(false, [], 'Method not allowed');
    }
} catch (Exception $e) {
    $conn->close();
    sendResponse(false, [], 'Error: ' . $e->getMessage());
}
?>
