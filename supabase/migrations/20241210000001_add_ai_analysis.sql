-- Add AI analysis columns to listings table
DO $$
BEGIN
    -- Add ai_analysis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='ai_analysis'
    ) THEN
        ALTER TABLE listings ADD COLUMN ai_analysis TEXT;
    END IF;

    -- Add ai_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='ai_score'
    ) THEN
        ALTER TABLE listings ADD COLUMN ai_score DECIMAL(3,2) CHECK (ai_score >= 0 AND ai_score <= 10);
    END IF;

    -- Add ai_analyzed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='ai_analyzed_at'
    ) THEN
        ALTER TABLE listings ADD COLUMN ai_analyzed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add ai_keywords column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='ai_keywords'
    ) THEN
        ALTER TABLE listings ADD COLUMN ai_keywords TEXT[];
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_ai_score ON listings(ai_score);
CREATE INDEX IF NOT EXISTS idx_listings_ai_analyzed_at ON listings(ai_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_listings_ai_keywords ON listings USING GIN(ai_keywords);

-- Add RLS policy for AI analysis (only admins can update AI analysis)
CREATE POLICY "Admins can update AI analysis" ON listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Add trigger to automatically set ai_analyzed_at when ai_analysis is updated
CREATE OR REPLACE FUNCTION update_ai_analyzed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ai_analysis IS NOT NULL AND OLD.ai_analysis IS NULL THEN
        NEW.ai_analyzed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_ai_analyzed_at ON listings;
CREATE TRIGGER trigger_update_ai_analyzed_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_analyzed_at();

COMMENT ON COLUMN listings.ai_analysis IS 'AI-generated analysis of the listing content';
COMMENT ON COLUMN listings.ai_score IS 'AI quality score (0-10) for the listing';
COMMENT ON COLUMN listings.ai_analyzed_at IS 'Timestamp when AI analysis was performed';
COMMENT ON COLUMN listings.ai_keywords IS 'AI-extracted keywords from the listing';
