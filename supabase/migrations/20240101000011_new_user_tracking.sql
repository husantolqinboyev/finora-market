-- Add user registration status tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='is_new_user'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_new_user BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Create index for new user tracking
CREATE INDEX IF NOT EXISTS idx_profiles_is_new_user ON profiles(is_new_user);

-- Function to mark user as completed setup
CREATE OR REPLACE FUNCTION complete_user_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND
       NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        NEW.is_new_user = FALSE;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for setup completion
DROP TRIGGER IF EXISTS trigger_complete_user_setup ON profiles;
CREATE TRIGGER trigger_complete_user_setup
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION complete_user_setup();
