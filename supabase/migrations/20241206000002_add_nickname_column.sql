-- Add nickname column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname VARCHAR(9) UNIQUE;

-- Create index for nickname
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- Add functions for nickname generation if they don't exist
CREATE OR REPLACE FUNCTION generate_unique_nickname()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_nickname TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789_';
    nickname_length INTEGER;
BEGIN
    -- Random length between 5 and 9
    nickname_length := floor(random() * 5) + 5; -- 5 to 9
    
    LOOP
        attempt := attempt + 1;
        
        -- Generate random nickname
        new_nickname := '';
        FOR i IN 1..nickname_length LOOP
            new_nickname := new_nickname || substring(chars, floor(random() * length(chars)) + 1, 1);
        END LOOP;
        
        -- Ensure it starts with a letter (not underscore or number)
        IF substring(new_nickname, 1, 1) IN ('_', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9') THEN
            new_nickname := 'a' || substring(new_nickname, 2, length(new_nickname) - 1);
        END IF;
        
        -- Check if unique
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE nickname = new_nickname) THEN
            EXIT;
        END IF;
        
        -- Safety check to prevent infinite loop
        IF attempt >= max_attempts THEN
            -- Generate with timestamp if all attempts failed
            new_nickname := 'user_' || extract(epoch from now())::bigint;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_nickname;
END;
$$;

-- Create trigger for nickname generation if not exists
CREATE OR REPLACE FUNCTION set_nickname_if_null()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.nickname IS NULL OR NEW.nickname = '' THEN
        NEW.nickname := generate_unique_nickname();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trigger_set_nickname ON profiles;
CREATE TRIGGER trigger_set_nickname
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_nickname_if_null();
