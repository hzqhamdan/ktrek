-- =========================================================
-- K-Trek Report Simulation Data for Presentation
-- =========================================================
-- This file contains dummy data for the reports table
-- to showcase the reporting system during presentations
-- =========================================================

-- Clear existing test reports (optional - comment out if you want to keep existing data)
-- DELETE FROM reports WHERE id > 0;
-- ALTER TABLE reports AUTO_INCREMENT = 1;

-- Insert realistic dummy reports
-- Status: 'Pending', 'In Progress', 'Resolved'
-- Columns: user_id, attraction_id, message, reply, status, replied_at, created_at

INSERT INTO reports (user_id, attraction_id, message, reply, status, replied_at, created_at) VALUES
-- Urgent Issues (will be marked as Pending or In Progress)
(5, 10, '[BUG] App crashes when submitting quiz answers at Wat Phothivihan. The app freezes and crashes whenever I try to submit answers for the quiz task. This happens consistently on both WiFi and mobile data.', NULL, 'Pending', NULL, '2026-01-26 09:15:23'),

(5, 15, '[TECHNICAL] QR code scanner not working at Pantai Senok. Unable to scan QR codes. The camera opens but doesnt recognize any QR codes. Tried multiple times with different lighting conditions.', 'Our team is investigating this issue. Please ensure you have given camera permissions to the app and your phone camera is working properly.', 'In Progress', '2026-01-26 08:00:12', '2026-01-25 14:30:45'),

(5, NULL, '[BUG] Direction task shows wrong compass. The compass in the direction task is pointing in the wrong direction. It shows North when my phone compass clearly shows South. Very confusing!', 'Fixed in latest update! The direction task now uses a simple list format instead of compass. Please update your app.', 'Resolved', '2026-01-25 16:45:30', '2026-01-24 11:20:00'),

-- Feature Requests
(5, NULL, '[FEATURE REQUEST] Add dark mode to the app. It would be great to have a dark mode option. The bright white background hurts my eyes when using the app at night. Many modern apps have this feature.', NULL, 'Pending', NULL, '2026-01-26 10:45:12'),

(5, NULL, '[FEATURE] Offline mode for attractions. Request to add offline mode so we can view attraction information and tasks even without internet connection. This is especially useful when traveling to remote locations.', 'Great suggestion! We are working on implementing offline caching for basic attraction info. Expected in next major update.', 'In Progress', '2026-01-26 07:30:00', '2026-01-25 16:20:33'),

(5, NULL, '[IMPROVEMENT] Make font size adjustable. The text in some sections is too small for me to read comfortably. Please add an option to increase font size or make the app more accessible for visually impaired users.', NULL, 'Pending', NULL, '2026-01-25 09:10:55'),

(5, NULL, '[FEATURE] Add social sharing feature. Would love to share my progress and achievements on social media directly from the app. This would help promote K-Trek to my friends and family!', 'Implemented! You can now share your badges and achievements from the Rewards page. Check it out!', 'Resolved', '2026-01-24 11:20:45', '2026-01-23 13:45:20'),

(5, NULL, '[IMPROVEMENT] Better map navigation. The map is sometimes difficult to navigate. Suggest adding zoom controls and the ability to search for specific attractions on the map.', 'We are redesigning the map interface with better controls. Thank you for the feedback!', 'In Progress', '2026-01-25 10:15:22', '2026-01-24 15:30:00'),

-- Minor Issues
(5, 9, '[TYPO] Typo in Istana Jahar description. Found a small typo in the attraction description. The word "historical" is spelled as "histroical" in the second paragraph.', 'Thank you for catching that! Fixed.', 'Resolved', '2026-01-23 09:45:00', '2026-01-22 08:30:15'),

(5, NULL, '[SUGGESTION] Add more photos to attractions. Some attractions only have 1-2 photos. It would be helpful to have more images showing different angles and details of each attraction.', NULL, 'Pending', NULL, '2026-01-26 11:30:00'),

(5, NULL, '[PERFORMANCE] Loading time is a bit slow. The app takes 3-4 seconds to load the rewards page. Not a major issue but could be optimized for better user experience.', NULL, 'Pending', NULL, '2026-01-25 17:45:30'),

(5, NULL, '[FEATURE] Add favorite attractions list. Suggestion to add a "favorites" feature where users can bookmark their favorite attractions for quick access later.', NULL, 'Pending', NULL, '2026-01-24 12:15:40'),

(5, NULL, '[ISSUE] Battery drain issue. Notice that the app uses quite a bit of battery, especially when using GPS features. Maybe optimize location tracking?', 'We are optimizing GPS usage to reduce battery consumption. Update coming soon.', 'In Progress', '2026-01-25 14:30:12', '2026-01-23 10:20:00'),

-- Additional Reports
(5, NULL, '[BUG] Cannot upload profile picture. When trying to change my profile picture, I get an error message saying "Upload failed". Tried with different image formats (JPG, PNG) but same result.', NULL, 'Pending', NULL, '2026-01-26 08:00:00'),

(5, NULL, '[URGENT] Rewards not updating after task completion. Completed several tasks today but my XP and badges are not updating in real-time. Need to close and reopen the app to see the changes.', 'Investigating this issue. Can you tell us which tasks you completed?', 'In Progress', '2026-01-26 09:30:15', '2026-01-25 12:45:30'),

(5, NULL, '[FEATURE] Add leaderboard filters. The leaderboard shows all users mixed together. Would be nice to have filters like "Friends only" or "This month" to make it more competitive and fun!', NULL, 'Pending', NULL, '2026-01-25 11:00:00'),

(5, 17, '[BUG] Progress bar sometimes stuck at Pantai Kemayang. The progress bar for attraction completion sometimes shows 99% even though I completed all tasks. Refreshing the page fixes it.', 'This was a calculation bug. We have recalculated all progress data. Should be fixed now!', 'Resolved', '2026-01-25 15:00:00', '2026-01-24 09:30:00'),

(5, NULL, '[FEATURE] Add push notifications. Would be helpful to receive notifications when new attractions are added or when someone beats my score on the leaderboard!', NULL, 'Pending', NULL, '2026-01-23 14:20:00'),

-- Positive Feedback
(5, NULL, '[FEEDBACK] Love the new direction task format! Just wanted to say the new direction task with the list format is much better than the old compass. Much easier to use on mobile. Great improvement!', 'Thank you so much for the positive feedback! We are glad you like the new format.', 'Resolved', '2026-01-26 08:15:00', '2026-01-26 07:30:00'),

(5, NULL, '[PRAISE] Amazing app for exploring Kelantan! This app has made my trip to Kelantan so much more interesting. I discovered places I would have never found otherwise. Keep up the great work!', 'Thank you! Comments like these motivate us to keep improving K-Trek. Happy exploring!', 'Resolved', '2026-01-25 19:30:00', '2026-01-25 19:00:00'),

-- More Issues
(5, NULL, '[BUG] Quiz timer not visible on small screens. On my phone (iPhone SE), the quiz timer is cut off at the top of the screen. Cannot see how much time is remaining during quiz tasks.', NULL, 'Pending', NULL, '2026-01-26 06:45:00'),

(5, 8, '[TECHNICAL] GPS accuracy issues at Kampung Kraftangan. The app says Im not at the correct location even though Im standing right in front of the entrance. GPS seems to be off by about 50 meters.', 'GPS accuracy depends on your phone and environment. Try enabling high accuracy mode in your phone settings.', 'In Progress', '2026-01-25 18:00:00', '2026-01-25 10:15:00'),

(5, NULL, '[FEATURE] Translation to Bahasa Malaysia. Please add Bahasa Malaysia language option! Many local users would benefit from having the app in their native language.', NULL, 'Pending', NULL, '2026-01-24 13:30:00');

-- =========================================================
-- Summary Statistics (for presentation talking points)
-- =========================================================
-- Total Reports: 23
-- Pending: 11
-- In Progress: 6  
-- Resolved: 6
--
-- Report Categories:
-- Bugs: 6
-- Technical Issues: 3
-- Feature Requests: 6
-- Improvements: 3
-- Performance: 1
-- Positive Feedback: 2
-- General: 2
-- =========================================================

SELECT '✅ Dummy report data inserted successfully!' as message;
SELECT CONCAT('Total reports: ', COUNT(*)) as summary FROM reports;
SELECT CONCAT('Pending: ', COUNT(*)) as pending_reports FROM reports WHERE status = 'Pending';
SELECT CONCAT('In Progress: ', COUNT(*)) as in_progress FROM reports WHERE status = 'In Progress';
SELECT CONCAT('Resolved: ', COUNT(*)) as resolved FROM reports WHERE status = 'Resolved';
