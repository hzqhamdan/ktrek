<?php
// iSCMS Admin Panel - Food Database API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all food items
            $search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
            $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : '';
            $verified = isset($_GET['verified']) ? sanitizeInput($_GET['verified']) : '';
            
            $query = "SELECT food_id, food_name, food_name_malay, category, sugar_per_100g, calories_per_100g, brand_name, is_verified, is_malaysian_food, scan_count, photo_count, is_active FROM food_database WHERE (is_active = 1 OR is_active IS NULL)";
            
            if ($search) {
                $query .= " AND (food_name LIKE '%$search%' OR food_name_malay LIKE '%$search%' OR brand_name LIKE '%$search%')";
            }
            if ($category) {
                $query .= " AND category = '$category'";
            }
            if ($verified === 'true') {
                $query .= " AND is_verified = 1";
            } elseif ($verified === 'false') {
                $query .= " AND is_verified = 0";
            }
            
            $query .= " ORDER BY scan_count DESC, food_name ASC LIMIT 100";
            
            $result = $conn->query($query);
            $foods = [];
            
            while ($row = $result->fetch_assoc()) {
                $foods[] = $row;
            }
            
            logAudit($conn, 'View', 'food_database', null, 'Viewed food database');
            $conn->close();
            sendResponse(true, $foods, 'Food items retrieved successfully');
            break;
            
        case 'POST':
            // Create new food item
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!validateRequired($input, ['food_name', 'category'])) {
                $conn->close();
                sendResponse(false, [], 'Food name and category are required');
            }
            
            $foodName = sanitizeInput($input['food_name']);
            $foodNameMalay = isset($input['food_name_malay']) ? sanitizeInput($input['food_name_malay']) : null;
            $category = sanitizeInput($input['category']);
            $sugarPer100g = isset($input['sugar_per_100g']) ? floatval($input['sugar_per_100g']) : null;
            $caloriesPer100g = isset($input['calories_per_100g']) ? intval($input['calories_per_100g']) : null;
            $carbsPer100g = isset($input['carbs_per_100g']) ? floatval($input['carbs_per_100g']) : null;
            $proteinPer100g = isset($input['protein_per_100g']) ? floatval($input['protein_per_100g']) : null;
            $fatPer100g = isset($input['fat_per_100g']) ? floatval($input['fat_per_100g']) : null;
            $brandName = isset($input['brand_name']) ? sanitizeInput($input['brand_name']) : null;
            $barcode = isset($input['barcode']) ? sanitizeInput($input['barcode']) : null;
            $isMalaysian = isset($input['is_malaysian_food']) ? intval($input['is_malaysian_food']) : 0;
            $isVerified = 1; // Admin-added items are auto-verified
            $verifiedBy = $_SESSION['admin_id'];
            
            $stmt = $conn->prepare("
                INSERT INTO food_database 
                (food_name, food_name_malay, category, sugar_per_100g, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g, brand_name, barcode, is_malaysian_food, is_verified, verified_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->bind_param(
                "sssdiiddsssii",
                $foodName,
                $foodNameMalay,
                $category,
                $sugarPer100g,
                $caloriesPer100g,
                $carbsPer100g,
                $proteinPer100g,
                $fatPer100g,
                $brandName,
                $barcode,
                $isMalaysian,
                $isVerified,
                $verifiedBy
            );
            
            if ($stmt->execute()) {
                $foodId = $stmt->insert_id;
                logAudit($conn, 'Create', 'food_database', $foodId, 'Food item created: ' . $foodName);
                $stmt->close();
                $conn->close();
                sendResponse(true, ['food_id' => $foodId], 'Food item created successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to create food item');
            }
            break;
            
        case 'PUT':
            // Update food item
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['food_id'])) {
                $conn->close();
                sendResponse(false, [], 'Food ID is required');
            }
            
            $foodId = intval($input['food_id']);
            
            // Build update query dynamically based on provided fields
            $updates = [];
            $types = "";
            $values = [];
            
            if (isset($input['food_name'])) {
                $updates[] = "food_name = ?";
                $types .= "s";
                $values[] = sanitizeInput($input['food_name']);
            }
            if (isset($input['food_name_malay'])) {
                $updates[] = "food_name_malay = ?";
                $types .= "s";
                $values[] = sanitizeInput($input['food_name_malay']);
            }
            if (isset($input['category'])) {
                $updates[] = "category = ?";
                $types .= "s";
                $values[] = sanitizeInput($input['category']);
            }
            if (isset($input['brand_name'])) {
                $updates[] = "brand_name = ?";
                $types .= "s";
                $values[] = sanitizeInput($input['brand_name']);
            }
            if (isset($input['barcode'])) {
                $updates[] = "barcode = ?";
                $types .= "s";
                $values[] = sanitizeInput($input['barcode']);
            }
            if (isset($input['sugar_per_100g'])) {
                $updates[] = "sugar_per_100g = ?";
                $types .= "d";
                $values[] = floatval($input['sugar_per_100g']);
            }
            if (isset($input['calories_per_100g'])) {
                $updates[] = "calories_per_100g = ?";
                $types .= "i";
                $values[] = intval($input['calories_per_100g']);
            }
            if (isset($input['carbs_per_100g'])) {
                $updates[] = "carbs_per_100g = ?";
                $types .= "d";
                $values[] = floatval($input['carbs_per_100g']);
            }
            if (isset($input['protein_per_100g'])) {
                $updates[] = "protein_per_100g = ?";
                $types .= "d";
                $values[] = floatval($input['protein_per_100g']);
            }
            if (isset($input['fat_per_100g'])) {
                $updates[] = "fat_per_100g = ?";
                $types .= "d";
                $values[] = floatval($input['fat_per_100g']);
            }
            if (isset($input['fiber_per_100g'])) {
                $updates[] = "fiber_per_100g = ?";
                $types .= "d";
                $values[] = floatval($input['fiber_per_100g']);
            }
            if (isset($input['is_malaysian_food'])) {
                $updates[] = "is_malaysian_food = ?";
                $types .= "i";
                $values[] = intval($input['is_malaysian_food']);
            }
            if (isset($input['regional_variant'])) {
                $updates[] = "regional_variant = ?";
                $types .= "s";
                $values[] = sanitizeInput($input['regional_variant']);
            }
            if (isset($input['hawker_stall_common'])) {
                $updates[] = "hawker_stall_common = ?";
                $types .= "i";
                $values[] = intval($input['hawker_stall_common']);
            }
            if (isset($input['is_verified'])) {
                $updates[] = "is_verified = ?";
                $types .= "i";
                $values[] = intval($input['is_verified']);
            }
            if (isset($input['is_active'])) {
                $updates[] = "is_active = ?";
                $types .= "i";
                $values[] = intval($input['is_active']);
            }
            
            if (empty($updates)) {
                $conn->close();
                sendResponse(false, [], 'No fields to update');
            }
            
            $types .= "i";
            $values[] = $foodId;
            
            $query = "UPDATE food_database SET " . implode(", ", $updates) . " WHERE food_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param($types, ...$values);
            
            if ($stmt->execute()) {
                logAudit($conn, 'Update', 'food_database', $foodId, 'Food item updated');
                $stmt->close();
                $conn->close();
                sendResponse(true, [], 'Food item updated successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to update food item');
            }
            break;
            
        case 'DELETE':
            // Delete food item (soft delete)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['food_id'])) {
                $conn->close();
                sendResponse(false, [], 'Food ID is required');
            }
            
            $foodId = intval($input['food_id']);
            
            $stmt = $conn->prepare("UPDATE food_database SET is_active = 0 WHERE food_id = ?");
            $stmt->bind_param("i", $foodId);
            
            if ($stmt->execute()) {
                logAudit($conn, 'Delete', 'food_database', $foodId, 'Food item deactivated');
                $stmt->close();
                $conn->close();
                sendResponse(true, [], 'Food item deleted successfully');
            } else {
                $stmt->close();
                $conn->close();
                sendResponse(false, [], 'Failed to delete food item');
            }
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
