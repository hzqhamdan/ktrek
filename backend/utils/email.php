<?php
/**
 * Email utility class for sending emails via SendGrid API
 */
class Email {
    private static $apiKey;
    private static $fromEmail;
    private static $fromName;
    
    /**
     * Initialize email configuration
     */
    public static function init() {
        // Load configuration
        $configFile = __DIR__ . '/../config/email-config.php';
        if (file_exists($configFile)) {
            require_once $configFile;
            self::$apiKey = defined('SENDGRID_API_KEY') ? SENDGRID_API_KEY : '';
            self::$fromEmail = defined('SENDGRID_FROM_EMAIL') ? SENDGRID_FROM_EMAIL : 'noreply@ktrek.com';
            self::$fromName = defined('SENDGRID_FROM_NAME') ? SENDGRID_FROM_NAME : 'K-Trek Team';
        } else {
            error_log("Email config file not found: " . $configFile);
            self::$apiKey = '';
            self::$fromEmail = 'noreply@ktrek.com';
            self::$fromName = 'K-Trek Team';
        }
    }
    
    /**
     * Send email via SendGrid API
     * 
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $htmlContent HTML email content
     * @param string $textContent Plain text email content (optional)
     * @return bool Success status
     */
    public static function send($to, $subject, $htmlContent, $textContent = '') {
        self::init();
        
        if (empty($textContent)) {
            $textContent = strip_tags($htmlContent);
        }
        
        $data = [
            'personalizations' => [
                [
                    'to' => [
                        ['email' => $to]
                    ],
                    'subject' => $subject
                ]
            ],
            'from' => [
                'email' => self::$fromEmail,
                'name' => self::$fromName
            ],
            'content' => [
                [
                    'type' => 'text/plain',
                    'value' => $textContent
                ],
                [
                    'type' => 'text/html',
                    'value' => $htmlContent
                ]
            ]
        ];
        
        $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . self::$apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return true;
        } else {
            error_log("SendGrid API Error: " . $response);
            return false;
        }
    }
    
    /**
     * Send password reset email
     * 
     * @param string $to Recipient email address
     * @param string $resetToken Reset token
     * @param string $appUrl Application URL
     * @return bool Success status
     */
    public static function sendPasswordReset($to, $resetToken, $appUrl = 'http://localhost:5173') {
        $resetLink = $appUrl . '/reset-password?token=' . $resetToken;
        
        $subject = 'Reset Your K-Trek Password';
        
        $htmlContent = self::getPasswordResetHtml($resetLink);
        
        $textContent = "
Hello,

You recently requested to reset your password for your K-Trek account.

Click the link below to reset your password:
{$resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Thanks,
The K-Trek Team
        ";
        
        return self::send($to, $subject, $htmlContent, $textContent);
    }
    
    /**
     * Get HTML template for password reset email
     * 
     * @param string $resetLink Reset link URL
     * @return string HTML content
     */
    private static function getPasswordResetHtml($resetLink) {
        return '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #120c07;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f1eee7;
        }
        .container {
            background: rgba(255, 255, 255, 0.85);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(18, 12, 7, 0.08);
            border: 1px solid rgba(249, 115, 22, 0.18);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: 800;
            color: #f97316;
            margin-bottom: 10px;
        }
        h1 {
            color: #120c07;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 9999px;
            font-weight: 700;
            text-align: center;
            box-shadow: 0 10px 20px rgba(249, 115, 22, 0.25);
        }
        .button:hover {
            opacity: 0.9;
        }
        .link-text {
            color: #6b7280;
            font-size: 12px;
            word-break: break-all;
            margin-top: 20px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(249, 115, 22, 0.2);
            color: #6b7280;
            font-size: 14px;
            text-align: center;
        }
        .warning {
            background: rgba(249, 115, 22, 0.10);
            border-left: 4px solid #f97316;
            padding: 12px;
            margin-top: 20px;
            border-radius: 10px;
            font-size: 14px;
            color: #120c07;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🗺️ K-Trek</div>
            <h1>Reset Your Password</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            <p>You recently requested to reset your password for your K-Trek account. Click the button below to reset it:</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="' . $resetLink . '" class="button">Reset Your Password</a>
            </p>
            
            <p class="link-text">
                Or copy and paste this link into your browser:<br>
                <a href="' . $resetLink . '">' . $resetLink . '</a>
            </p>
            
            <div class="warning">
                ⏱️ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
        </div>
        
        <div class="footer">
            <p>If you didn\'t request this password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Thanks,<br>The K-Trek Team</p>
        </div>
    </div>
</body>
</html>
        ';
    }
}
?>
