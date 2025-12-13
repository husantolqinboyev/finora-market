-- Add expiry_date column to listings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='expiry_date'
    ) THEN
        ALTER TABLE listings ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
    END IF;
END $$;

-- Create index for expiry_date
CREATE INDEX IF NOT EXISTS idx_listings_expiry_date ON listings(expiry_date);

-- Create function to automatically delete expired listings
CREATE OR REPLACE FUNCTION delete_expired_listings()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by a scheduled job
    DELETE FROM listings 
    WHERE expiry_date < NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic cleanup (optional - for immediate cleanup on certain operations)
-- DROP TRIGGER IF EXISTS cleanup_expired_listings_trigger ON listings;
-- CREATE TRIGGER cleanup_expired_listings_trigger
--   AFTER INSERT OR UPDATE ON listings
--   FOR EACH STATEMENT EXECUTE FUNCTION delete_expired_listings();
