-- Add rejected_expiry_date column to listings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='rejected_expiry_date'
    ) THEN
        ALTER TABLE listings ADD COLUMN rejected_expiry_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create function to delete expired rejected listings
CREATE OR REPLACE FUNCTION delete_expired_rejected_listings()
RETURNS void AS $$
BEGIN
    DELETE FROM listings 
    WHERE rejected_expiry_date IS NOT NULL 
    AND rejected_expiry_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create index for rejected_expiry_date
CREATE INDEX IF NOT EXISTS idx_listings_rejected_expiry_date ON listings(rejected_expiry_date);

-- Note: This function should be called by a scheduled job (cron job) or Supabase Edge Function
-- You can create a Supabase Edge Function that calls this function periodically
