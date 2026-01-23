-- Fix guide task_id associations
-- This script links guides to their corresponding tasks

-- Attraction 8: Kampung Kraftangan
UPDATE guides SET task_id = 5 WHERE id = 5;  -- Batik Detective (photo task)
UPDATE guides SET task_id = 7 WHERE id = 7;  -- Mini Batik Challenge (photo task)
UPDATE guides SET task_id = 12 WHERE id = 12;  -- Kelantan Craft Knowledge Quiz
UPDATE guides SET task_id = 28 WHERE title = 'Arrival at Kampung Kraftangan' AND attraction_id = 8;  -- Check-in guide

-- Attraction 9: Istana Jahar
UPDATE guides SET task_id = 10 WHERE id = 10;  -- Cultural Selfie (photo task)
UPDATE guides SET task_id = 30 WHERE id = 26;  -- Royal Palace Check-in (this was the wrong guide showing!)
UPDATE guides SET task_id = 13 WHERE title LIKE '%Royal Heritage%' AND attraction_id = 9;  -- Quiz guide if exists

-- Attraction 10: Wat Phothivihan
UPDATE guides SET task_id = 14 WHERE id = 14;  -- Symbol Search (photo task)
UPDATE guides SET task_id = 15 WHERE title LIKE '%Buddhist Symbolism%' AND attraction_id = 10;  -- Quiz guide if exists
UPDATE guides SET task_id = 31 WHERE title LIKE '%Temple Arrival%' AND attraction_id = 10;  -- Check-in guide if exists

-- Attraction 11: Pantai Melawi
UPDATE guides SET task_id = 18 WHERE id = 18;  -- Beach Clean Quest (photo task 18)
-- Note: Guides 16 and 17 will be deleted below

-- Attraction 12: Bank Kerapu
UPDATE guides SET task_id = 21 WHERE id = 21;  -- Outside the museum (photo task)
UPDATE guides SET task_id = 20 WHERE title LIKE '%World War II%' AND attraction_id = 12;  -- Quiz guide if exists
UPDATE guides SET task_id = 33 WHERE title LIKE '%War Museum Check-in%' AND attraction_id = 12;  -- Check-in guide if exists

-- Attraction 13: Wat Machimmaram
UPDATE guides SET task_id = 22 WHERE id = 22;  -- Main statue area (photo task)
UPDATE guides SET task_id = 23 WHERE title LIKE '%Buddhist Culture Quiz%' AND attraction_id = 13;  -- Quiz guide if exists
UPDATE guides SET task_id = 34 WHERE title LIKE '%Temple Grounds Check-in%' AND attraction_id = 13;  -- Check-in guide if exists

-- Attraction 14: Kampung Laut Old Mosque
UPDATE guides SET task_id = 24 WHERE id = 24;  -- Mosque compound (photo task)
UPDATE guides SET task_id = 25 WHERE title LIKE '%Islamic Heritage%' AND attraction_id = 14;  -- Quiz guide if exists
UPDATE guides SET task_id = 27 WHERE title LIKE '%Historic Mosque Check-in%' AND attraction_id = 14;  -- Check-in guide if exists

-- Attraction 15: Pantai Senok
UPDATE guides SET task_id = 35 WHERE id = 27;  -- Tree Tunnel Shot (photo task)
UPDATE guides SET task_id = 37 WHERE id = 29;  -- Beach Clean Quest (photo task)

-- Delete guides that should have been deleted earlier
DELETE FROM guides WHERE id IN (16, 17, 28);  -- Seashell Collector, Sunset Moment, Wind Chime Craft

-- Delete empty guides (no title and no content)
DELETE FROM guides WHERE (title IS NULL OR title = '') AND (content IS NULL OR content = '');

-- Verify the updates
SELECT g.id, g.attraction_id, g.task_id, g.title, t.name as task_name, t.type as task_type
FROM guides g
LEFT JOIN tasks t ON g.task_id = t.id
ORDER BY g.attraction_id, g.task_id;
