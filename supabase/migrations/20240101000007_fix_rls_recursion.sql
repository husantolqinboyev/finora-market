-- Fix RLS Infinite Recursion

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
DROP POLICY IF EXISTS "Admins can update all listings" ON listings;
DROP POLICY IF EXISTS "Admins can delete all listings" ON listings;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create simplified admin check function
CREATE OR REPLACE FUNCTION check_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

-- Listings Table - Fixed Policies
CREATE POLICY "Admins can view all listings" ON listings
  FOR SELECT USING (check_admin());

CREATE POLICY "Admins can update all listings" ON listings
  FOR UPDATE USING (check_admin());

CREATE POLICY "Admins can delete all listings" ON listings
  FOR DELETE USING (check_admin());

-- Categories Table - Fixed Policies
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (check_admin());

-- Profiles Table - Fixed Policies
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (check_admin());

-- Public policy for viewing approved listings
CREATE POLICY "Public can view approved listings" ON listings
  FOR SELECT USING (status = 'approved');
