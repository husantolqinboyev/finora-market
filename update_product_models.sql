-- Update existing products with models based on title and description patterns
-- This is a one-time script to populate model data for existing listings

-- Electronics - Phones
UPDATE listings 
SET model = 'iPhone 13' 
WHERE title ILIKE '%iphone 13%' OR (title ILIKE '%iphone%' AND description ILIKE '%13%');

UPDATE listings 
SET model = 'iPhone 14' 
WHERE title ILIKE '%iphone 14%' OR (title ILIKE '%iphone%' AND description ILIKE '%14%');

UPDATE listings 
SET model = 'iPhone 15' 
WHERE title ILIKE '%iphone 15%' OR (title ILIKE '%iphone%' AND description ILIKE '%15%');

UPDATE listings 
SET model = 'Samsung Galaxy S21' 
WHERE title ILIKE '%samsung%' AND title ILIKE '%galaxy%' AND title ILIKE '%s21%';

UPDATE listings 
SET model = 'Samsung Galaxy S22' 
WHERE title ILIKE '%samsung%' AND title ILIKE '%galaxy%' AND title ILIKE '%s22%';

UPDATE listings 
SET model = 'Samsung Galaxy S23' 
WHERE title ILIKE '%samsung%' AND title ILIKE '%galaxy%' AND title ILIKE '%s23%';

-- Electronics - Laptops
UPDATE listings 
SET model = 'MacBook Pro' 
WHERE title ILIKE '%macbook pro%' OR (title ILIKE '%macbook%' AND description ILIKE '%pro%');

UPDATE listings 
SET model = 'MacBook Air' 
WHERE title ILIKE '%macbook air%' OR (title ILIKE '%macbook%' AND description ILIKE '%air%');

UPDATE listings 
SET model = 'Dell XPS' 
WHERE title ILIKE '%dell%' AND title ILIKE '%xps%';

UPDATE listings 
SET model = 'HP Pavilion' 
WHERE title ILIKE '%hp%' AND title ILIKE '%pavilion%';

-- Cars
UPDATE listings 
SET model = 'Toyota Camry' 
WHERE title ILIKE '%toyota%' AND title ILIKE '%camry%';

UPDATE listings 
SET model = 'Toyota Corolla' 
WHERE title ILIKE '%toyota%' AND title ILIKE '%corolla%';

UPDATE listings 
SET model = 'Nissan Sentra' 
WHERE title ILIKE '%nissan%' AND title ILIKE '%sentra%';

UPDATE listings 
SET model = 'Chevrolet Malibu' 
WHERE title ILIKE '%chevrolet%' AND title ILIKE '%malibu%';

-- Clothing
UPDATE listings 
SET model = 'Nike Air Max' 
WHERE title ILIKE '%nike%' AND title ILIKE '%air max%';

UPDATE listings 
SET model = 'Adidas Ultra Boost' 
WHERE title ILIKE '%adidas%' AND title ILIKE '%ultra boost%';

UPDATE listings 
SET model = 'Puma Classic' 
WHERE title ILIKE '%puma%' AND title ILIKE '%classic%';

-- Generic updates for common patterns
UPDATE listings 
SET model = 'Smart TV' 
WHERE title ILIKE '%smart tv%' OR (title ILIKE '%televizor%' AND description ILIKE '%smart%');

UPDATE listings 
SET model = 'PlayStation 5' 
WHERE title ILIKE '%playstation 5%' OR title ILIKE '%ps5%';

UPDATE listings 
SET model = 'Xbox Series X' 
WHERE title ILIKE '%xbox%' AND title ILIKE '%series x%';

-- Check results
SELECT COUNT(*) as total_updated, model 
FROM listings 
WHERE model IS NOT NULL 
GROUP BY model 
ORDER BY total_updated DESC;
