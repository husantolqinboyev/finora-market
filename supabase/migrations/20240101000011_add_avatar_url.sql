-- Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN avatar_url TEXT;

-- Create index for better performance
CREATE INDEX idx_profiles_avatar_url ON profiles(avatar_url) WHERE avatar_url IS NOT NULL;
