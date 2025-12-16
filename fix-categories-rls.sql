-- Enable public access to categories table
-- This policy allows anyone to read categories without authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

-- Create public read policy for categories
CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (true);

-- Enable RLS on categories table (if not already enabled)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Optional: Restrict insert/update/delete to authenticated users only
CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');
