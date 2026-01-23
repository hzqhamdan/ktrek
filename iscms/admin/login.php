<?php
// iSCMS Admin Panel - Login Page
session_start();

// Redirect if already logged in
if (isset($_SESSION['admin_id'])) {
    header('Location: index.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iSCMS Admin Login</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/styles.css">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Playfair Display', Georgia, serif;
            background: #362419;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: #4a3326;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            padding: 40px;
            width: 100%;
            max-width: 420px;
            border: 1px solid rgba(201, 183, 169, 0.3);
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h1 {
            margin: 0 0 10px 0;
            color: #c9b7a9;
            font-size: 28px;
            font-weight: 700;
        }
        .login-header p {
            margin: 0;
            color: #c9b7a9;
            opacity: 0.8;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #c9b7a9;
            font-weight: 600;
            font-size: 14px;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            background: #3d2a1d;
            border: 1px solid rgba(201, 183, 169, 0.3);
            border-radius: 6px;
            font-size: 14px;
            font-family: 'Playfair Display', Georgia, serif;
            color: #c9b7a9;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #c9b7a9;
            background: #362419;
        }
        .form-group input::placeholder {
            color: #c9b7a9;
            opacity: 0.5;
        }
        .btn-login {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #c9b7a9 0%, #a89786 100%);
            color: #362419;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            font-family: 'Playfair Display', Georgia, serif;
        }
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(201, 183, 169, 0.5);
        }
        .btn-login:active {
            transform: translateY(0);
        }
        .alert {
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .alert-error {
            background: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
            border: 1px solid rgba(231, 76, 60, 0.4);
        }
        .alert-success {
            background: rgba(46, 204, 113, 0.2);
            color: #2ecc71;
            border: 1px solid rgba(46, 204, 113, 0.4);
        }
        .login-footer {
            text-align: center;
            margin-top: 20px;
            color: #c9b7a9;
            opacity: 0.7;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>iSCMS Admin</h1>
            <p>Sugar Intake Monitoring System</p>
        </div>
        
        <div id="alertMessage"></div>
        
        <form id="loginForm" onsubmit="handleLogin(event)">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="admin@iscms.com">
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="Enter your password">
            </div>
            
            <button type="submit" class="btn-login">Login</button>
        </form>
        
        <div class="login-footer">
            © 2026 iSCMS. All rights reserved.
        </div>
    </div>

    <script>
        async function handleLogin(event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const alertDiv = document.getElementById('alertMessage');
            
            try {
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';
                    setTimeout(() => {
                        window.location.href = 'index.php';
                    }, 1000);
                } else {
                    alertDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
                }
            } catch (error) {
                alertDiv.innerHTML = '<div class="alert alert-error">Login failed. Please try again.</div>';
            }
        }
    </script>
</body>
</html>
