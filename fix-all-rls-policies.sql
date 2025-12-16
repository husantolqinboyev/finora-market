-- Fix all RLS policies for Supabase database
-- This will enable public access to read data while restricting write operations

-- Fix categories table
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fix profiles table
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fix listings table
DROP POLICY IF EXISTS "listings_select_policy" ON listings;
DROP POLICY IF EXISTS "listings_insert_policy" ON listings;
DROP POLICY IF EXISTS "listings_update_policy" ON listings;
DROP POLICY IF EXISTS "listings_delete_policy" ON listings;

CREATE POLICY "listings_select_policy" ON listings
  FOR SELECT USING (status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()));

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_insert_policy" ON listings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "listings_update_policy" ON listings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "listings_delete_policy" ON listings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fix messages table (public read for authenticated users)
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "messages_delete_policy" ON messages
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fix notifications table (authenticated users only)
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "notifications_delete_policy" ON notifications
  FOR DELETE USING (auth.role() = 'authenticated');
