<?php
class AuthMiddleware {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Verify Bearer token from Authorization header
     */
    public function verifySession() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader) {
            $this->unauthorized('Authorization header missing');
        }
        
        if (strpos($authHeader, 'Bearer ') !== 0) {
            $this->unauthorized('Invalid authorization format');
        }
        
        $token = substr($authHeader, 7);
        
        if (empty($token)) {
            $this->unauthorized('Token missing');
        }
        
        try {
            $query = "SELECT u.id, u.username, u.email, u.phone_number, u.full_name, 
                             u.date_of_birth, u.profile_picture, u.auth_provider, 
                             u.is_active, u.created_at, s.expires_at
                      FROM users u 
                      INNER JOIN sessions s ON u.id = s.user_id 
                      WHERE s.token = :token 
                      AND s.expires_at > NOW() 
                      AND u.is_active = 1
                      LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                $this->unauthorized('Invalid or expired session');
            }
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            return $user;
            
        } catch (PDOException $e) {
            error_log("Auth middleware error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Authentication error'
            ]);
            exit;
        }
    }
    
    /**
     * Optional authentication - returns user if authenticated, null if not
     * Does NOT exit/throw error if no auth provided
     */
    public function optionalSession() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        // No auth header = return null (guest user)
        if (!$authHeader) {
            return null;
        }
        
        // Invalid format = return null
        if (strpos($authHeader, 'Bearer ') !== 0) {
            return null;
        }
        
        $token = substr($authHeader, 7);
        
        if (empty($token)) {
            return null;
        }
        
        try {
            $query = "SELECT u.id, u.username, u.email, u.phone_number, u.full_name, 
                             u.date_of_birth, u.profile_picture, u.auth_provider, 
                             u.is_active, u.created_at, s.expires_at
                      FROM users u 
                      INNER JOIN sessions s ON u.id = s.user_id 
                      WHERE s.token = :token 
                      AND s.expires_at > NOW() 
                      AND u.is_active = 1
                      LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                return null; // Invalid/expired token = guest
            }
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            return $user;
            
        } catch (PDOException $e) {
            error_log("Optional auth error: " . $e->getMessage());
            return null; // Error = treat as guest
        }
    }
    
    /**
     * Send unauthorized response
     */
    private function unauthorized($message) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }
    
    /**
     * Alias for verifySession
     */
    public function requireAuth() {
        return $this->verifySession();
    }
}
?>