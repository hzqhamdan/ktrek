<?php
// Use dynamic CORS configuration that supports any localhost port
require_once '../../config/cors.php';

require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/security.php';

// Log for debugging
error_log("Google auth endpoint called");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

$data = json_decode(file_get_contents("php://input"), true);
error_log("Received data: " . print_r($data, true));

if (!isset($data['credential']) || empty($data['credential'])) {
    Response::error("Google credential is required", 400);
}

// Google can return either:
// - an ID token (JWT: 3 dot-separated parts) via Google Identity Services
// - an OAuth access_token (opaque string) via useGoogleLogin
$credential = $data['credential'];
$tokenParts = explode(".", $credential);

$google_id = null;
$email = null;
$full_name = null;
$profile_picture = null;

if (count($tokenParts) === 3) {
    // Treat as ID token (JWT) and decode payload (NOTE: we are not verifying signature here)
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1])), true);
    error_log("Google JWT payload: " . print_r($payload, true));

    if (!$payload) {
        Response::error("Failed to decode Google token", 400);
    }

    $google_id = $payload['sub'] ?? null;
    $email = $payload['email'] ?? null;
    $full_name = $payload['name'] ?? null;
    $profile_picture = $payload['picture'] ?? null;
} else {
    // Treat as OAuth access token and fetch userinfo from Google
    $ch = curl_init('https://openidconnect.googleapis.com/v1/userinfo');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $credential,
        'Accept: application/json'
    ]);

    $userinfoRaw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($userinfoRaw === false) {
        error_log("Google userinfo curl error: " . $curlErr);
        Response::error("Failed to verify Google token", 400);
    }

    $userinfo = json_decode($userinfoRaw, true);
    error_log("Google userinfo ($httpCode): " . $userinfoRaw);

    if ($httpCode !== 200 || !$userinfo) {
        Response::error("Invalid Google access token", 400);
    }

    $google_id = $userinfo['sub'] ?? null;
    $email = $userinfo['email'] ?? null;
    $full_name = $userinfo['name'] ?? null;
    $profile_picture = $userinfo['picture'] ?? null;
}

if (!$google_id || !$email) {
    Response::error("Invalid Google user data", 400);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError("Database connection failed");
}

try {
    // Check if user exists by Google ID or email
    $query = "SELECT * FROM users WHERE google_id = :google_id OR email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':google_id', $google_id);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $isFirstLogin = false;
    
    if ($stmt->rowCount() > 0) {
        // User exists - LOGIN
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        error_log("User found: " . $user['username']);
        
        // Check if this is first login (last_login is NULL)
        $isFirstLogin = ($user['last_login'] === null);
        
        // Update Google ID if not set
        if (empty($user['google_id'])) {
            $updateQuery = "UPDATE users SET google_id = :google_id WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':google_id', $google_id);
            $updateStmt->bindParam(':id', $user['id']);
            $updateStmt->execute();
        }
        
        // Update last login
        $updateLoginQuery = "UPDATE users SET last_login = NOW() WHERE id = :id";
        $updateLoginStmt = $db->prepare($updateLoginQuery);
        $updateLoginStmt->bindParam(':id', $user['id']);
        $updateLoginStmt->execute();
        
    } else {
        // User doesn't exist - REGISTER (this is always a first login)
        $isFirstLogin = true;
        error_log("Creating new user for: " . $email);
        
        // Generate unique username from email
        $username = strtolower(explode('@', $email)[0]) . rand(100, 999);
        
        // Check if username exists
        $checkQuery = "SELECT id FROM users WHERE username = :username";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':username', $username);
        $checkStmt->execute();
        
        // If exists, add more random numbers
        while ($checkStmt->rowCount() > 0) {
            $username = strtolower(explode('@', $email)[0]) . rand(1000, 9999);
            $checkStmt->bindParam(':username', $username);
            $checkStmt->execute();
        }
        
        $insertQuery = "INSERT INTO users 
                       (username, email, google_id, full_name, profile_picture, auth_provider, is_active) 
                       VALUES 
                       (:username, :email, :google_id, :full_name, :profile_picture, 'google', 1)";
        
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':username', $username);
        $insertStmt->bindParam(':email', $email);
        $insertStmt->bindParam(':google_id', $google_id);
        $insertStmt->bindParam(':full_name', $full_name);
        $insertStmt->bindParam(':profile_picture', $profile_picture);
        
        if (!$insertStmt->execute()) {
            error_log("Failed to insert user: " . print_r($insertStmt->errorInfo(), true));
            Response::serverError("Failed to create user account");
        }
        
        $user_id = $db->lastInsertId();
        error_log("New user created with ID: " . $user_id);
        
        // Fetch the newly created user
        $fetchQuery = "SELECT * FROM users WHERE id = :id";
        $fetchStmt = $db->prepare($fetchQuery);
        $fetchStmt->bindParam(':id', $user_id);
        $fetchStmt->execute();
        $user = $fetchStmt->fetch(PDO::FETCH_ASSOC);
    }

    // Generate JWT token
		$token = Security::generateJWT($user['id']);
		error_log("Generated token for user ID: " . $user['id']);
		
		// Check if sessions table exists and has correct structure
		try {
			$sessionQuery = "INSERT INTO sessions (user_id, token, expires_at) 
							 VALUES (:user_id, :token, DATE_ADD(NOW(), INTERVAL 30 DAY))";
			$sessionStmt = $db->prepare($sessionQuery);
			$sessionStmt->bindParam(':user_id', $user['id']);
			$sessionStmt->bindParam(':token', $token);
			
			if (!$sessionStmt->execute()) {
				error_log("Session insert failed: " . print_r($sessionStmt->errorInfo(), true));
				// Continue anyway - token will still work without session table
			}
		} catch (PDOException $sessionError) {
			error_log("Session creation error: " . $sessionError->getMessage());
			// Continue anyway - we can still return the token
		}

		// Remove sensitive data
		unset($user['password']);

		Response::success([
			'user' => $user,
			'token' => $token,
			'is_first_login' => $isFirstLogin
		], "Google authentication successful", 200);

	} catch (PDOException $e) {
		error_log("Google auth error: " . $e->getMessage());
		Response::serverError("Authentication failed: " . $e->getMessage());
	}
?>