-- Admin can update any profile policy
-- This allows admins to update premium status for any user

-- First, drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies that allow both user and admin updates
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );
