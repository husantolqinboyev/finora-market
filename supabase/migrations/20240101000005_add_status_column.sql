-- Add status column to listings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='status'
    ) THEN
        ALTER TABLE listings ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
