<?php
// iSCMS Admin Panel - Content Management API
require_once '../config.php';

checkAdminAuth();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $contentType = isset($_GET['type']) ? sanitizeInput($_GET['type']) : 'health_tips';
    
    switch ($method) {
        case 'GET':
            switch ($contentType) {
                case 'health_tips':
                    $query = "
                        SELECT 
                            tip_id, title, title_malay, content, category, 
                            target_audience, is_featured, is_active, view_count, created_at
                        FROM health_tips
                        ORDER BY display_order ASC, created_at DESC
                        LIMIT 50
                    ";
                    break;
                    
                case 'recipes':
                    $query = "
                        SELECT 
                            recipe_id, recipe_name, recipe_name_malay, category,
                            prep_time_minutes, cook_time_minutes, servings,
                            sugar_per_serving, calories_per_serving,
                            is_malaysian, is_featured, is_active, view_count
                        FROM recipes
                        ORDER BY created_at DESC
                        LIMIT 50
                    ";
                    break;
                    
                case 'articles':
                    $query = "
                        SELECT 
                            article_id, title, title_malay, slug, summary,
                            category, author_name, reading_time_minutes,
                            is_published, published_date, view_count
                        FROM articles
                        ORDER BY published_date DESC
                        LIMIT 50
                    ";
                    break;
                    
                case 'faqs':
                    $query = "
                        SELECT 
                            faq_id, question, question_malay, answer, answer_malay,
                            category, display_order, is_active, view_count, helpful_count
                        FROM faqs
                        ORDER BY category ASC, display_order ASC
                    ";
                    break;
                    
                default:
                    $conn->close();
                    sendResponse(false, [], 'Invalid content type');
            }
            
            $result = $conn->query($query);
            $content = [];
            
            while ($row = $result->fetch_assoc()) {
                $content[] = $row;
            }
            
            $conn->close();
            sendResponse(true, $content, 'Content retrieved successfully');
            break;
            
        case 'POST':
            // Create new content
            $input = json_decode(file_get_contents('php://input'), true);
            
            switch ($contentType) {
                case 'health_tips':
                    if (!validateRequired($input, ['title', 'content', 'category'])) {
                        $conn->close();
                        sendResponse(false, [], 'Required fields missing');
                    }
                    
                    $stmt = $conn->prepare("
                        INSERT INTO health_tips 
                        (title, title_malay, content, content_malay, category, target_audience, created_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ");
                    
                    $titleMalay = $input['title_malay'] ?? null;
                    $contentMalay = $input['content_malay'] ?? null;
                    $targetAudience = $input['target_audience'] ?? 'All';
                    $createdBy = $_SESSION['admin_id'];
                    
                    $stmt->bind_param(
                        "ssssssi",
                        $input['title'],
                        $titleMalay,
                        $input['content'],
                        $contentMalay,
                        $input['category'],
                        $targetAudience,
                        $createdBy
                    );
                    
                    if ($stmt->execute()) {
                        $id = $stmt->insert_id;
                        logAudit($conn, 'Create', 'health_tips', $id, 'Health tip created');
                        $stmt->close();
                        $conn->close();
                        sendResponse(true, ['tip_id' => $id], 'Health tip created successfully');
                    }
                    break;
                    
                default:
                    $conn->close();
                    sendResponse(false, [], 'Content creation not implemented for this type');
            }
            break;
            
        case 'PUT':
            // Update content
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Generic update logic would go here
            $conn->close();
            sendResponse(false, [], 'Content update not fully implemented');
            break;
            
        case 'DELETE':
            // Delete content (soft delete)
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Generic delete logic would go here
            $conn->close();
            sendResponse(false, [], 'Content deletion not fully implemented');
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
