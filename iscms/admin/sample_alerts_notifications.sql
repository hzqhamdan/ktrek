-- Sample Alerts and Notifications Data for iSCMS Admin Panel
-- This populates the user_alerts and notification_history tables

-- Insert sample user alerts
INSERT INTO user_alerts (user_id, alert_type, severity, title, message, alert_datetime, is_read) VALUES
-- Critical alerts
(1, 'Glucose Critical', 'Critical', 'Critical Blood Glucose Level', 'Blood glucose reading of 280 mg/dL detected. Immediate attention required.', DATE_SUB(NOW(), INTERVAL 2 HOUR), 0),
(3, 'Sugar Limit Exceeded', 'Critical', 'Daily Sugar Limit Significantly Exceeded', 'You have consumed 85g of sugar today, exceeding your 50g limit by 70%.', DATE_SUB(NOW(), INTERVAL 5 HOUR), 0),

-- Warning alerts
(2, 'Glucose High', 'Warning', 'High Blood Glucose Reading', 'Blood glucose reading of 165 mg/dL detected. Monitor closely.', DATE_SUB(NOW(), INTERVAL 3 HOUR), 0),
(1, 'Sugar Limit Warning', 'Warning', 'Approaching Daily Sugar Limit', 'You have consumed 42g of sugar today. Your limit is 50g.', DATE_SUB(NOW(), INTERVAL 6 HOUR), 1),
(4, 'Device Disconnected', 'Warning', 'CGM Device Disconnected', 'Your Freestyle Libre 3 has not synced in 4 hours.', DATE_SUB(NOW(), INTERVAL 8 HOUR), 0),

-- Info alerts
(2, 'Goal Achievement', 'Info', 'Weekly Goal Achieved!', 'Congratulations! You stayed within your sugar limit for 7 consecutive days.', DATE_SUB(NOW(), INTERVAL 1 DAY), 1),
(5, 'Health Tip', 'Info', 'Hydration Reminder', 'Remember to drink at least 8 glasses of water daily to help regulate blood sugar.', DATE_SUB(NOW(), INTERVAL 1 DAY), 0),
(3, 'Sugar Limit Warning', 'Warning', 'Evening Sugar Intake High', 'Your sugar intake this evening is higher than usual. Consider lighter options.', DATE_SUB(NOW(), INTERVAL 12 HOUR), 1),
(1, 'Glucose Low', 'Warning', 'Low Blood Glucose Alert', 'Blood glucose reading of 65 mg/dL detected. Have a quick sugar source if needed.', DATE_SUB(NOW(), INTERVAL 1 DAY), 1),
(4, 'Health Tip', 'Info', 'Exercise Benefits', 'Regular exercise can help improve insulin sensitivity and blood sugar control.', DATE_SUB(NOW(), INTERVAL 2 DAY), 1),

-- Additional recent alerts
(2, 'Sugar Limit Exceeded', 'Critical', 'Sugar Limit Exceeded', 'Daily sugar limit of 45g exceeded. Total consumption: 58g.', DATE_SUB(NOW(), INTERVAL 15 HOUR), 0),
(5, 'Glucose High', 'Warning', 'Elevated Glucose After Meal', 'Post-meal glucose reading of 175 mg/dL. Monitor carbohydrate intake.', DATE_SUB(NOW(), INTERVAL 18 HOUR), 0),
(3, 'Device Disconnected', 'Warning', 'Smart Scale Not Syncing', 'Your smart scale has not synced in 3 days. Check connection.', DATE_SUB(NOW(), INTERVAL 2 DAY), 1),
(1, 'Goal Achievement', 'Info', '30-Day Milestone', 'You have successfully tracked your data for 30 consecutive days!', DATE_SUB(NOW(), INTERVAL 3 DAY), 1),
(4, 'Sugar Limit Warning', 'Warning', 'High Sugar Breakfast', 'Breakfast contained 25g sugar, 50% of your daily limit.', DATE_SUB(NOW(), INTERVAL 20 HOUR), 1);

-- Insert sample notification history
INSERT INTO notification_history (notification_type, channel, recipient_segment, title, message, sent_datetime, delivery_status) VALUES
-- Recent broadcasts
('Broadcast', 'Push', 'All Users', 'New Health Tips Available', 'Check out our latest health tips for managing blood sugar during festive seasons!', DATE_SUB(NOW(), INTERVAL 4 HOUR), 'Sent'),
('System Alert', 'Push', 'High Risk Users', 'Important Health Check Reminder', 'It has been 7 days since your last glucose reading. Please monitor your levels.', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Sent'),
('Promotional', 'Email', 'Premium Users', 'Premium Feature Update', 'New AI-powered meal suggestions now available in your premium plan!', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Sent'),

-- Educational content
('Educational', 'Push', 'All Users', 'Understanding GI Index', 'Learn how Glycemic Index affects your blood sugar. New article in Health Library.', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Sent'),
('Broadcast', 'Push', 'Type 2 Diabetes', 'Diabetes Management Workshop', 'Join our free online workshop on managing Type 2 Diabetes this Saturday.', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Sent'),

-- System notifications
('System Update', 'Push', 'All Users', 'App Update Available', 'Version 2.1.0 is now available with improved glucose tracking features.', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Sent'),
('Reminder', 'Push', 'Inactive Users', 'We Miss You!', 'It has been a while since you logged in. Your health journey matters to us.', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Sent'),
('Broadcast', 'Email', 'All Users', 'Monthly Health Report Ready', 'Your personalized monthly health report is now available in the app.', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Sent'),

-- Community and engagement
('Community', 'Push', 'All Users', 'New Recipe Added', 'Low-sugar Malaysian dessert recipe: Kuih Talam Pandan - Check it out!', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Sent'),
('Broadcast', 'Push', 'All Users', 'World Diabetes Day', 'Join us in raising awareness for World Diabetes Day. Share your success story!', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Sent'),

-- Health tips and alerts
('Health Tip', 'Push', 'Pre-diabetic', 'Prevention Tips', '5 simple lifestyle changes that can help prevent Type 2 Diabetes.', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Sent'),
('Alert', 'Push', 'CGM Users', 'Sensor Expiry Reminder', 'CGM sensors typically last 10-14 days. Check your sensor status.', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Sent'),
('Promotional', 'Email', 'Free Users', 'Try Premium Free', 'Get 30 days of Premium features free! Upgrade now for advanced analytics.', DATE_SUB(NOW(), INTERVAL 13 DAY), 'Sent'),
('Educational', 'Push', 'All Users', 'Carb Counting Guide', 'Master carb counting with our new interactive guide. Available now!', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Sent'),
('System Alert', 'Push', 'All Users', 'Maintenance Notice', 'Scheduled maintenance on Jan 15, 2:00 AM - 4:00 AM. App will be briefly unavailable.', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Sent');

-- Add more alerts for better testing
INSERT INTO user_alerts (user_id, alert_type, severity, title, message, alert_datetime, is_read)
SELECT 
    user_id,
    CASE 
        WHEN RAND() < 0.2 THEN 'Glucose Critical'
        WHEN RAND() < 0.4 THEN 'Glucose High'
        WHEN RAND() < 0.6 THEN 'Sugar Limit Warning'
        WHEN RAND() < 0.8 THEN 'Sugar Limit Exceeded'
        ELSE 'Health Tip'
    END as alert_type,
    CASE 
        WHEN RAND() < 0.2 THEN 'Critical'
        WHEN RAND() < 0.6 THEN 'Warning'
        ELSE 'Info'
    END as severity,
    'Automated Alert' as title,
    'This is an automated health monitoring alert.' as message,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 168) HOUR) as alert_datetime,
    FLOOR(RAND() * 2) as is_read
FROM users 
WHERE is_active = 1 
LIMIT 20;

-- Verify data
SELECT 'User Alerts Summary' as Info, COUNT(*) as Total, 
       SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as Critical,
       SUM(CASE WHEN severity = 'Warning' THEN 1 ELSE 0 END) as Warning,
       SUM(CASE WHEN severity = 'Info' THEN 1 ELSE 0 END) as Info,
       SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as Unread
FROM user_alerts;

SELECT 'Notification History Summary' as Info, COUNT(*) as Total
FROM notification_history;
