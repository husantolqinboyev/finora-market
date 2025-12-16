-- Enable public access to listings table
-- This policy allows anyone to read approved listings without authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "listings_select_policy" ON listings;
DROP POLICY IF EXISTS "listings_insert_policy" ON listings;
DROP POLICY IF EXISTS "listings_update_policy" ON listings;
DROP POLICY IF EXISTS "listings_delete_policy" ON listings;

-- Create public read policy for approved listings only
CREATE POLICY "listings_select_policy" ON listings
  FOR SELECT USING (status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()));

-- Enable RLS on listings table (if not already enabled)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Restrict insert/update/delete to authenticated users only
CREATE POLICY "listings_insert_policy" ON listings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "listings_update_policy" ON listings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "listings_delete_policy" ON listings
  FOR DELETE USING (auth.role() = 'authenticated');
