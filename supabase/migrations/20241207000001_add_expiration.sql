-- Add expiration functionality to listings table
ALTER TABLE listings 
ADD COLUMN expiration_days INTEGER DEFAULT 7,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Add daily post limit to profiles table  
ALTER TABLE profiles
ADD COLUMN daily_post_limit INTEGER DEFAULT 1;

-- Create index on expires_at for efficient filtering
CREATE INDEX idx_listings_expires_at ON listings(expires_at);

-- Update existing listings to have default expiration (7 days from creation)
UPDATE listings 
SET expires_at = created_at + INTERVAL '7 days',
    expiration_days = 7
WHERE expires_at IS NULL;

-- Update existing profiles to have default daily post limit
UPDATE profiles
SET daily_post_limit = 1
WHERE daily_post_limit IS NULL;
