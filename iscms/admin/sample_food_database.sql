-- Sample Food Database Data for iSCMS Admin Panel
-- Populates the food_database table with Malaysian and common foods

USE iscms_db;

-- Insert Malaysian local foods
INSERT INTO food_database (
    food_name, food_name_malay, category, subcategory,
    sugar_per_100g, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g, fiber_per_100g,
    typical_serving_size, typical_serving_grams,
    is_malaysian_food, regional_variant, hawker_stall_common, is_verified, needs_review, is_active
) VALUES
-- Malaysian Breakfast Items
('Nasi Lemak', 'Nasi Lemak', 'Local Malaysian', 'Rice Dish', 2.5, 320, 45.0, 8.5, 15.0, 2.0, '1 plate', 300, 1, 'National', 1, 1, 0, 1),
('Roti Canai', 'Roti Canai', 'Local Malaysian', 'Flatbread', 1.8, 300, 38.0, 6.0, 14.0, 1.5, '1 piece', 120, 1, 'Mamak', 1, 1, 0, 1),
('Nasi Dagang', 'Nasi Dagang', 'Local Malaysian', 'Rice Dish', 3.0, 380, 52.0, 12.0, 14.0, 2.5, '1 plate', 350, 1, 'East Coast', 1, 1, 0, 1),
('Kuih Lapis', 'Kuih Lapis', 'Local Malaysian', 'Traditional Cake', 22.0, 280, 42.0, 4.0, 10.0, 1.0, '1 slice', 50, 1, 'National', 1, 1, 0, 1),
('Tosai', 'Tosai', 'Local Malaysian', 'Pancake', 1.5, 150, 28.0, 5.0, 2.5, 2.0, '1 piece', 100, 1, 'South Indian', 1, 1, 0, 1),

-- Malaysian Main Dishes
('Nasi Goreng Kampung', 'Nasi Goreng Kampung', 'Local Malaysian', 'Fried Rice', 3.5, 350, 48.0, 10.0, 14.0, 2.0, '1 plate', 300, 1, 'National', 1, 1, 0, 1),
('Mee Goreng Mamak', 'Mee Goreng Mamak', 'Local Malaysian', 'Fried Noodles', 4.0, 420, 55.0, 12.0, 18.0, 3.0, '1 plate', 350, 1, 'Mamak', 1, 1, 0, 1),
('Char Kuey Teow', 'Char Kuey Teow', 'Local Malaysian', 'Fried Noodles', 2.8, 450, 50.0, 14.0, 22.0, 2.5, '1 plate', 400, 1, 'Penang', 1, 1, 0, 1),
('Laksa', 'Laksa', 'Local Malaysian', 'Noodle Soup', 5.0, 380, 45.0, 15.0, 16.0, 3.0, '1 bowl', 500, 1, 'Various', 1, 1, 0, 1),
('Rendang Ayam', 'Rendang Ayam', 'Local Malaysian', 'Curry', 4.5, 280, 12.0, 22.0, 18.0, 2.0, '1 serving', 200, 1, 'Malay', 1, 1, 0, 1),
('Nasi Kerabu', 'Nasi Kerabu', 'Local Malaysian', 'Rice Dish', 3.2, 340, 48.0, 11.0, 12.0, 3.5, '1 plate', 300, 1, 'Kelantan', 1, 1, 0, 1),
('Ayam Percik', 'Ayam Percik', 'Local Malaysian', 'Grilled Chicken', 8.0, 250, 10.0, 28.0, 12.0, 1.0, '1 piece', 200, 1, 'Terengganu', 1, 1, 0, 1),

-- Malaysian Snacks
('Kuih Ketayap', 'Kuih Ketayap', 'Local Malaysian', 'Traditional Cake', 18.0, 220, 35.0, 3.5, 8.0, 2.0, '1 piece', 60, 1, 'National', 1, 1, 0, 1),
('Onde-Onde', 'Onde-Onde', 'Local Malaysian', 'Sweet Dumpling', 15.0, 180, 32.0, 2.5, 4.5, 1.5, '3 pieces', 60, 1, 'Peranakan', 1, 1, 0, 1),
('Curry Puff', 'Karipap', 'Local Malaysian', 'Pastry', 2.0, 240, 28.0, 5.0, 12.0, 1.5, '1 piece', 80, 1, 'National', 1, 1, 0, 1),
('Pisang Goreng', 'Pisang Goreng', 'Local Malaysian', 'Fried Banana', 12.0, 180, 30.0, 2.0, 6.0, 2.5, '3 pieces', 120, 1, 'National', 1, 1, 0, 1),

-- Malaysian Beverages
('Teh Tarik', 'Teh Tarik', 'Beverage', 'Hot Drink', 12.0, 90, 15.0, 2.5, 3.0, 0, '1 glass', 250, 1, 'Mamak', 1, 1, 0, 1),
('Milo Ais', 'Milo Ais', 'Beverage', 'Cold Drink', 18.0, 150, 28.0, 4.0, 3.5, 0, '1 glass', 300, 1, 'National', 1, 1, 0, 1),
('Sirap Bandung', 'Sirap Bandung', 'Beverage', 'Cold Drink', 22.0, 120, 28.0, 1.5, 2.0, 0, '1 glass', 250, 1, 'National', 1, 1, 0, 1),
('Air Tebu', 'Air Tebu', 'Beverage', 'Fresh Juice', 28.0, 140, 35.0, 0.5, 0, 0.5, '1 glass', 250, 1, 'National', 1, 1, 0, 1),

-- Malaysian Desserts
('Cendol', 'Cendol', 'Dessert', 'Shaved Ice', 25.0, 180, 42.0, 1.5, 2.5, 1.0, '1 bowl', 300, 1, 'National', 1, 1, 0, 1),
('Ais Kacang', 'Ais Kacang', 'Dessert', 'Shaved Ice', 28.0, 200, 48.0, 2.0, 1.5, 2.0, '1 bowl', 350, 1, 'National', 1, 1, 0, 1),
('Kuih Talam', 'Kuih Talam', 'Dessert', 'Steamed Cake', 16.0, 160, 30.0, 2.5, 4.0, 1.5, '1 piece', 70, 1, 'National', 1, 1, 0, 1),
('Sago Gula Melaka', 'Sago Gula Melaka', 'Dessert', 'Pudding', 20.0, 180, 38.0, 1.0, 3.5, 0.5, '1 bowl', 150, 1, 'National', 1, 1, 0, 1),

-- Western/Common Foods
('White Bread', 'Roti Putih', 'Breakfast', 'Bread', 4.0, 265, 49.0, 9.0, 3.2, 2.4, '2 slices', 60, 0, NULL, 0, 1, 0, 1),
('Whole Wheat Bread', 'Roti Gandum', 'Breakfast', 'Bread', 3.5, 247, 41.0, 13.0, 3.0, 7.0, '2 slices', 60, 0, NULL, 0, 1, 0, 1),
('Scrambled Eggs', 'Telur Hancur', 'Breakfast', 'Eggs', 1.0, 148, 2.0, 12.5, 10.0, 0, '2 eggs', 100, 0, NULL, 0, 1, 0, 1),
('Oatmeal', 'Oat', 'Breakfast', 'Cereal', 1.0, 68, 12.0, 2.5, 1.5, 1.7, '1 cup cooked', 240, 0, NULL, 0, 1, 0, 1),

-- Rice & Noodles
('Steamed White Rice', 'Nasi Putih', 'Lunch', 'Rice', 0.1, 130, 28.0, 2.7, 0.3, 0.4, '1 cup', 200, 0, NULL, 0, 1, 0, 1),
('Brown Rice', 'Nasi Perang', 'Lunch', 'Rice', 0.5, 111, 23.0, 2.6, 0.9, 1.8, '1 cup', 200, 0, NULL, 0, 1, 0, 1),
('Instant Noodles', 'Mi Segera', 'Snack', 'Noodles', 1.5, 380, 52.0, 9.0, 14.0, 2.0, '1 pack', 85, 0, NULL, 1, 1, 0, 1),

-- Proteins
('Chicken Breast (Grilled)', 'Dada Ayam Bakar', 'Lunch', 'Meat', 0, 165, 0, 31.0, 3.6, 0, '100g', 100, 0, NULL, 0, 1, 0, 1),
('Salmon (Grilled)', 'Ikan Salmon Bakar', 'Dinner', 'Fish', 0, 206, 0, 22.0, 13.0, 0, '100g', 100, 0, NULL, 0, 1, 0, 1),
('Tofu', 'Tauhu', 'Lunch', 'Protein', 0.6, 76, 1.9, 8.0, 4.8, 1.0, '100g', 100, 0, NULL, 0, 1, 0, 1),

-- Vegetables
('Mixed Vegetables (Stir-fried)', 'Sayur Campur Goreng', 'Lunch', 'Vegetables', 3.5, 80, 12.0, 3.0, 3.0, 4.0, '1 cup', 150, 0, NULL, 0, 1, 0, 1),
('Kailan (Stir-fried)', 'Kailan Goreng', 'Lunch', 'Vegetables', 1.0, 45, 6.0, 3.5, 1.5, 2.5, '1 cup', 100, 0, NULL, 0, 1, 0, 1),

-- Fast Food
('Hamburger', 'Hamburger', 'Fast Food', 'Burger', 6.0, 250, 31.0, 12.0, 9.0, 2.0, '1 burger', 200, 0, NULL, 1, 1, 0, 1),
('French Fries', 'Kentang Goreng', 'Fast Food', 'Fried', 0.3, 312, 41.0, 3.4, 15.0, 3.8, 'Medium', 117, 0, NULL, 1, 1, 0, 1),
('Pizza (Cheese)', 'Pizza Keju', 'Fast Food', 'Pizza', 3.5, 266, 33.0, 11.0, 10.0, 2.3, '1 slice', 107, 0, NULL, 1, 1, 0, 1),
('Fried Chicken', 'Ayam Goreng', 'Fast Food', 'Fried Chicken', 0.5, 320, 12.0, 24.0, 20.0, 0.5, '1 piece', 150, 0, NULL, 1, 1, 0, 1),

-- Beverages
('Coca-Cola', 'Coca-Cola', 'Beverage', 'Soft Drink', 10.6, 42, 10.6, 0, 0, 0, '1 can', 330, 0, NULL, 0, 1, 0, 1),
('Orange Juice', 'Jus Oren', 'Beverage', 'Juice', 8.4, 45, 10.4, 0.7, 0.2, 0.2, '1 glass', 240, 0, NULL, 0, 1, 0, 1),
('Green Tea (Unsweetened)', 'Teh Hijau', 'Beverage', 'Tea', 0, 1, 0, 0, 0, 0, '1 cup', 240, 0, NULL, 0, 1, 0, 1),
('Coffee (Black)', 'Kopi Hitam', 'Beverage', 'Coffee', 0, 2, 0, 0.3, 0, 0, '1 cup', 240, 0, NULL, 0, 1, 0, 1),
('Milk (Full Cream)', 'Susu Penuh Krim', 'Beverage', 'Dairy', 5.0, 61, 4.8, 3.2, 3.3, 0, '1 glass', 244, 0, NULL, 0, 1, 0, 1),

-- Snacks
('Potato Chips', 'Kerepek Kentang', 'Snack', 'Chips', 1.0, 536, 53.0, 6.6, 34.0, 4.5, '1 pack', 50, 0, NULL, 1, 1, 0, 1),
('Chocolate Bar', 'Bar Coklat', 'Snack', 'Candy', 48.0, 535, 59.0, 5.0, 30.0, 3.0, '1 bar', 43, 0, NULL, 1, 1, 0, 1),
('Banana', 'Pisang', 'Snack', 'Fruit', 12.2, 89, 23.0, 1.1, 0.3, 2.6, '1 medium', 118, 0, NULL, 0, 1, 0, 1),
('Apple', 'Epal', 'Snack', 'Fruit', 10.4, 52, 14.0, 0.3, 0.2, 2.4, '1 medium', 182, 0, NULL, 0, 1, 0, 1),

-- Desserts
('Ice Cream (Vanilla)', 'Ais Krim Vanila', 'Dessert', 'Ice Cream', 21.0, 207, 24.0, 3.5, 11.0, 0.7, '1 scoop', 100, 0, NULL, 1, 1, 0, 1),
('Chocolate Cake', 'Kek Coklat', 'Dessert', 'Cake', 32.0, 352, 50.0, 5.0, 15.0, 2.0, '1 slice', 95, 0, NULL, 1, 1, 0, 1),
('Cheesecake', 'Kek Keju', 'Dessert', 'Cake', 23.0, 321, 26.0, 5.5, 22.0, 0.8, '1 slice', 125, 0, NULL, 1, 1, 0, 1);

-- Add some items that need review
INSERT INTO food_database (
    food_name, category, subcategory,
    sugar_per_100g, calories_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g,
    typical_serving_size, typical_serving_grams,
    is_malaysian_food, is_verified, needs_review, is_active
) VALUES
('Nasi Kandar Mix', 'Local Malaysian', 'Rice Dish', 3.0, 450, 55.0, 15.0, 20.0, '1 plate', 400, 1, 0, 1, 1),
('Mamak Roti Tissue', 'Local Malaysian', 'Dessert', 35.0, 380, 62.0, 6.0, 12.0, '1 piece', 150, 1, 0, 1, 1),
('Teh Tarik Special', 'Beverage', 'Hot Drink', 18.0, 140, 22.0, 3.0, 4.5, '1 glass', 300, 1, 0, 1, 1),
('Maggi Goreng Mamak', 'Local Malaysian', 'Fried Noodles', 3.5, 480, 58.0, 12.0, 22.0, '1 plate', 350, 1, 0, 1, 1),
('Nasi Lemak Ayam Rendang', 'Local Malaysian', 'Rice Dish', 4.0, 520, 58.0, 25.0, 24.0, '1 plate', 450, 1, 0, 1, 1);

-- Update scan counts for popular items (simulate usage)
UPDATE food_database SET scan_count = FLOOR(100 + RAND() * 500) WHERE is_malaysian_food = 1;
UPDATE food_database SET scan_count = FLOOR(50 + RAND() * 300) WHERE is_malaysian_food = 0;
UPDATE food_database SET photo_count = FLOOR(scan_count * 0.3);

-- Verify the data
SELECT 'Food Database Summary' as Info, 
       COUNT(*) as Total,
       SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as Verified,
       SUM(CASE WHEN is_malaysian_food = 1 THEN 1 ELSE 0 END) as Malaysian_Foods,
       SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) as Needs_Review,
       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as Active_Items
FROM food_database;

SELECT 'Food Categories' as Info, category, COUNT(*) as Count
FROM food_database
GROUP BY category
ORDER BY Count DESC;

SELECT 'Top 10 Most Scanned Foods' as Info, food_name, scan_count
FROM food_database
ORDER BY scan_count DESC
LIMIT 10;
