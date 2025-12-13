-- Verify model column and data
-- Run this to check if the model column was added successfully

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'listings' 
    AND column_name = 'model';

-- Show sample data with model
SELECT 
    id, 
    title, 
    model, 
    category_id,
    price,
    created_at
FROM listings 
WHERE model IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- Statistics
SELECT 
    COUNT(*) as total_listings,
    COUNT(model) as listings_with_model,
    ROUND((COUNT(model)::float / COUNT(*)::float) * 100, 2) as percentage_with_model
FROM listings;

-- Popular models
SELECT 
    model,
    COUNT(*) as count,
    AVG(price) as avg_price
FROM listings 
WHERE model IS NOT NULL 
GROUP BY model 
HAVING COUNT(*) > 1
ORDER BY count DESC 
LIMIT 10;

-- Search performance test
EXPLAIN ANALYZE 
SELECT * FROM listings 
WHERE model ILIKE '%iphone%' 
ORDER BY created_at DESC 
LIMIT 20;
