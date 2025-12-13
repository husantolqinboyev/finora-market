-- Add model column to listings table
ALTER TABLE listings 
ADD COLUMN model TEXT;

-- Create index for better search performance
CREATE INDEX idx_listings_model ON listings(model);

-- Add comment to describe the column
COMMENT ON COLUMN listings.model IS 'Product model, brand, or type for better search and categorization';

-- Example update statements (optional - for existing data)
-- UPDATE listings SET model = 'iPhone 13' WHERE title ILIKE '%iphone 13%' AND description ILIKE '%apple%';
-- UPDATE listings SET model = 'Samsung Galaxy S21' WHERE title ILIKE '%samsung%' AND title ILIKE '%galaxy%';
-- UPDATE listings SET model = 'Toyota Camry' WHERE title ILIKE '%camry%' AND description ILIKE '%toyota%';

-- Query to verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'listings' AND column_name = 'model';
