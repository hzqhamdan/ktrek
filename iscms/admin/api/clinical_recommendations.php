<?php
// iSCMS Admin Panel - Clinical Recommendations API
// Healthcare Providers can provide educational clinical recommendations
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get recommendations for a specific patient
            requirePermission('provide_recommendations');
            
            $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
            
            if (!$userId) {
                sendResponse(false, [], 'User ID is required');
            }
            
            // Check if admin can access this patient
            if (!canAccessPatient($userId)) {
                sendResponse(false, [], 'You do not have permission to view this patient');
            }
            
            // Get recommendations
            $query = "
                SELECT cr.*,
                       hp.full_name as provider_name,
                       hp.specialization,
                       u.full_name as patient_name
                FROM clinical_recommendations cr
                JOIN healthcare_providers hp ON cr.provider_id = hp.provider_id
                JOIN users u ON cr.user_id = u.user_id
                WHERE cr.user_id = ?
                ORDER BY cr.created_at DESC
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $recommendations = [];
            while ($row = $result->fetch_assoc()) {
                $recommendations[] = $row;
            }
            
            $stmt->close();
            $conn->close();
            
            sendResponse(true, $recommendations, 'Recommendations retrieved successfully');
            break;
            
        case 'POST':
            // Add new clinical recommendation
            requirePermission('provide_recommendations');
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!validateRequired($input, ['user_id', 'recommendation_type', 'title', 'recommendation_text'])) {
                sendResponse(false, [], 'Required fields missing');
            }
            
            $userId = intval($input['user_id']);
            $recommendationType = sanitizeInput($input['recommendation_type']);
            $title = sanitizeInput($input['title']);
            $recommendationText = sanitizeInput($input['recommendation_text']);
            $priority = isset($input['priority']) ? sanitizeInput($input['priority']) : 'Medium';
            $effectiveDate = isset($input['effective_date']) ? sanitizeInput($input['effective_date']) : date('Y-m-d');
            $reviewDate = isset($input['review_date']) ? sanitizeInput($input['review_date']) : null;
            
            // Check if admin can access this patient
            if (!canAccessPatient($userId)) {
                sendResponse(false, [], 'You do not have permission to add recommendations for this patient');
            }
            
            // Get provider ID
            $providerId = getAdminProviderId();
            if (!$providerId) {
                sendResponse(false, [], 'Healthcare Provider ID not found. Only providers can add recommendations.');
            }
            
            // Validate recommendation type
            $validTypes = ['Diet', 'Exercise', 'Medication', 'Lifestyle', 'Monitoring', 'Other'];
            if (!in_array($recommendationType, $validTypes)) {
                sendResponse(false, [], 'Invalid recommendation type');
            }
            
            // Validate priority
            $validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
            if (!in_array($priority, $validPriorities)) {
                $priority = 'Medium';
            }
            
            // Insert recommendation
            $stmt = $conn->prepare("
                INSERT INTO clinical_recommendations 
                (user_id, provider_id, recommendation_type, title, recommendation_text, 
                 priority, effective_date, review_date, is_educational, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'Active')
            ");
            
            $stmt->bind_param(
                'iissssss',
                $userId,
                $providerId,
                $recommendationType,
                $title,
                $recommendationText,
                $priority,
                $effectiveDate,
                $reviewDate
            );
            
            if ($stmt->execute()) {
                $recommendationId = $stmt->insert_id;
                
                // Log the action
                logAudit(
                    $conn,
                    'Create',
                    'clinical_recommendations',
                    $recommendationId,
                    "Added clinical recommendation for user $userId: $title"
                );
                
                $stmt->close();
                $conn->close();
                
                sendResponse(true, ['recommendation_id' => $recommendationId], 'Recommendation added successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to add recommendation');
            }
            break;
            
        case 'PUT':
            // Update recommendation status
            requirePermission('provide_recommendations');
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['recommendation_id'])) {
                sendResponse(false, [], 'Recommendation ID is required');
            }
            
            $recommendationId = intval($input['recommendation_id']);
            $status = isset($input['status']) ? sanitizeInput($input['status']) : null;
            
            // Validate status
            $validStatuses = ['Active', 'Completed', 'Cancelled'];
            if (!$status || !in_array($status, $validStatuses)) {
                sendResponse(false, [], 'Invalid status');
            }
            
            // Check if provider owns this recommendation or if admin
            $role = $_SESSION['admin_role'] ?? '';
            $providerId = getAdminProviderId();
            
            if ($role === 'Healthcare Provider') {
                // Healthcare providers can only update their own recommendations
                if (!$providerId) {
                    $conn->close();
                    sendResponse(false, [], 'Provider ID not found');
                }
                
                $checkStmt = $conn->prepare("SELECT user_id FROM clinical_recommendations WHERE recommendation_id = ? AND provider_id = ?");
                $checkStmt->bind_param('ii', $recommendationId, $providerId);
                $checkStmt->execute();
                $checkResult = $checkStmt->get_result();
                
                if ($checkResult->num_rows === 0) {
                    $checkStmt->close();
                    $conn->close();
                    sendResponse(false, [], 'Recommendation not found or you do not have permission');
                }
                
                $checkStmt->close();
            } else {
                // Admins can update any recommendation, but verify it exists
                $checkStmt = $conn->prepare("SELECT user_id FROM clinical_recommendations WHERE recommendation_id = ?");
                $checkStmt->bind_param('i', $recommendationId);
                $checkStmt->execute();
                $checkResult = $checkStmt->get_result();
                
                if ($checkResult->num_rows === 0) {
                    $checkStmt->close();
                    $conn->close();
                    sendResponse(false, [], 'Recommendation not found');
                }
                
                $checkStmt->close();
            }
            
            // Update status
            $stmt = $conn->prepare("UPDATE clinical_recommendations SET status = ? WHERE recommendation_id = ?");
            $stmt->bind_param('si', $status, $recommendationId);
            $stmt->execute();
            
            logAudit($conn, 'Update', 'clinical_recommendations', $recommendationId, "Updated status to $status");
            
            $stmt->close();
            $conn->close();
            
            sendResponse(true, [], 'Recommendation updated successfully');
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
