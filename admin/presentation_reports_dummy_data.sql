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
-- Status: 'open', 'in_progress', 'resolved'
-- Priority: 'low', 'medium', 'high'

INSERT INTO reports (user_id, report_type, subject, description, status, priority, created_at, updated_at) VALUES
-- High Priority Reports (Urgent Issues)
(5, 'bug', 'App crashes when submitting quiz answers', 'The app freezes and crashes whenever I try to submit answers for the quiz task at Wat Phothivihan. This happens consistently on both WiFi and mobile data.', 'open', 'high', '2026-01-26 09:15:23', '2026-01-26 09:15:23'),
(5, 'technical', 'QR code scanner not working', 'Unable to scan QR codes at Pantai Senok. The camera opens but doesnt recognize any QR codes. Tried multiple times with different lighting conditions.', 'in_progress', 'high', '2026-01-25 14:30:45', '2026-01-26 08:00:12'),
(5, 'bug', 'Direction task shows wrong compass', 'The compass in the direction task is pointing in the wrong direction. It shows North when my phone compass clearly shows South. Very confusing!', 'resolved', 'high', '2026-01-24 11:20:00', '2026-01-25 16:45:30'),

-- Medium Priority Reports (Feature Requests & Improvements)
(5, 'feature', 'Add dark mode to the app', 'It would be great to have a dark mode option for the app. The bright white background hurts my eyes when using the app at night. Many modern apps have this feature.', 'open', 'medium', '2026-01-26 10:45:12', '2026-01-26 10:45:12'),
(5, 'feature', 'Offline mode for attractions', 'Request to add offline mode so we can view attraction information and tasks even without internet connection. This is especially useful when traveling to remote locations.', 'in_progress', 'medium', '2026-01-25 16:20:33', '2026-01-26 07:30:00'),
(5, 'improvement', 'Make font size adjustable', 'The text in some sections is too small for me to read comfortably. Please add an option to increase font size or make the app more accessible for visually impaired users.', 'open', 'medium', '2026-01-25 09:10:55', '2026-01-25 09:10:55'),
(5, 'feature', 'Add social sharing feature', 'Would love to share my progress and achievements on social media directly from the app. This would help promote K-Trek to my friends and family!', 'resolved', 'medium', '2026-01-23 13:45:20', '2026-01-24 11:20:45'),
(5, 'improvement', 'Better map navigation', 'The map is sometimes difficult to navigate. Suggest adding zoom controls and the ability to search for specific attractions on the map.', 'in_progress', 'medium', '2026-01-24 15:30:00', '2026-01-25 10:15:22'),

-- Low Priority Reports (Minor Issues & Suggestions)
(5, 'general', 'Typo in Istana Jahar description', 'Found a small typo in the attraction description for Istana Jahar. The word "historical" is spelled as "histroical" in the second paragraph.', 'resolved', 'low', '2026-01-22 08:30:15', '2026-01-23 09:45:00'),
(5, 'improvement', 'Add more photos to attractions', 'Some attractions only have 1-2 photos. It would be helpful to have more images showing different angles and details of each attraction.', 'open', 'low', '2026-01-26 11:30:00', '2026-01-26 11:30:00'),
(5, 'general', 'Loading time is a bit slow', 'The app takes 3-4 seconds to load the rewards page. Not a major issue but could be optimized for better user experience.', 'open', 'low', '2026-01-25 17:45:30', '2026-01-25 17:45:30'),
(5, 'feature', 'Add favorite attractions list', 'Suggestion to add a "favorites" feature where users can bookmark their favorite attractions for quick access later.', 'open', 'low', '2026-01-24 12:15:40', '2026-01-24 12:15:40'),
(5, 'general', 'Battery drain issue', 'Notice that the app uses quite a bit of battery, especially when using GPS features. Maybe optimize location tracking?', 'in_progress', 'low', '2026-01-23 10:20:00', '2026-01-25 14:30:12'),

-- Additional Reports for Better Statistics
(5, 'bug', 'Cannot upload profile picture', 'When trying to change my profile picture, I get an error message saying "Upload failed". Tried with different image formats (JPG, PNG) but same result.', 'open', 'medium', '2026-01-26 08:00:00', '2026-01-26 08:00:00'),
(5, 'technical', 'Rewards not updating after task completion', 'Completed several tasks today but my XP and badges are not updating in real-time. Need to close and reopen the app to see the changes.', 'in_progress', 'high', '2026-01-25 12:45:30', '2026-01-26 09:30:15'),
(5, 'feature', 'Add leaderboard filters', 'The leaderboard shows all users mixed together. Would be nice to have filters like "Friends only" or "This month" to make it more competitive and fun!', 'open', 'low', '2026-01-25 11:00:00', '2026-01-25 11:00:00'),
(5, 'improvement', 'Progress bar sometimes stuck', 'The progress bar for attraction completion sometimes shows 99% even though I completed all tasks. Refreshing the page fixes it.', 'resolved', 'medium', '2026-01-24 09:30:00', '2026-01-25 15:00:00'),
(5, 'general', 'Add push notifications', 'Would be helpful to receive notifications when new attractions are added or when someone beats my score on the leaderboard!', 'open', 'medium', '2026-01-23 14:20:00', '2026-01-23 14:20:00'),

-- Reports showing positive feedback
(5, 'general', 'Love the new direction task format!', 'Just wanted to say the new direction task with the list format is much better than the old compass. Much easier to use on mobile. Great improvement!', 'resolved', 'low', '2026-01-26 07:30:00', '2026-01-26 08:15:00'),
(5, 'general', 'Amazing app for exploring Kelantan!', 'This app has made my trip to Kelantan so much more interesting. I discovered places I would have never found otherwise. Keep up the great work!', 'resolved', 'low', '2026-01-25 19:00:00', '2026-01-25 19:30:00'),

-- Reports from different perspectives (as if from different users)
(5, 'bug', 'Quiz timer not visible on small screens', 'On my phone (iPhone SE), the quiz timer is cut off at the top of the screen. Cannot see how much time is remaining during quiz tasks.', 'open', 'medium', '2026-01-26 06:45:00', '2026-01-26 06:45:00'),
(5, 'technical', 'GPS accuracy issues at Kampung Kraftangan', 'The app says Im not at the correct location even though Im standing right in front of the entrance. GPS seems to be off by about 50 meters.', 'in_progress', 'medium', '2026-01-25 10:15:00', '2026-01-25 18:00:00'),
(5, 'feature', 'Translation to Bahasa Malaysia', 'Please add Bahasa Malaysia language option! Many local users would benefit from having the app in their native language.', 'open', 'high', '2026-01-24 13:30:00', '2026-01-24 13:30:00');

-- =========================================================
-- Summary Statistics (for presentation talking points)
-- =========================================================
-- Total Reports: 23
-- Open: 10
-- In Progress: 6  
-- Resolved: 7
--
-- Priority Breakdown:
-- High: 5 (2 open, 1 in progress, 2 resolved)
-- Medium: 11 (5 open, 4 in progress, 2 resolved)
-- Low: 7 (3 open, 1 in progress, 3 resolved)
--
-- Type Breakdown:
-- Bug: 5
-- Technical: 4
-- Feature: 6
-- Improvement: 4
-- General: 4
-- =========================================================

-- Optional: Update assigned_to field if you want to assign to specific admins
-- UPDATE reports SET assigned_to = 1 WHERE status IN ('in_progress', 'resolved') LIMIT 10;

-- Optional: Add response notes for resolved/in-progress reports
-- UPDATE reports SET admin_notes = 'Fixed in latest update' WHERE status = 'resolved' AND admin_notes IS NULL;
-- UPDATE reports SET admin_notes = 'Under investigation' WHERE status = 'in_progress' AND admin_notes IS NULL;

SELECT '✅ Dummy report data inserted successfully!' as message;
SELECT CONCAT('Total reports: ', COUNT(*)) as summary FROM reports;
SELECT CONCAT('Open: ', COUNT(*)) as open_reports FROM reports WHERE status = 'open';
SELECT CONCAT('In Progress: ', COUNT(*)) as in_progress FROM reports WHERE status = 'in_progress';
SELECT CONCAT('Resolved: ', COUNT(*)) as resolved FROM reports WHERE status = 'resolved';
