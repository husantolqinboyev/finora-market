-- Drop existing profile policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies for profiles table
-- Allow everyone (including guests) to view all profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = id
  );

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = id
  );

-- Allow authenticated users to delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = id
  );
