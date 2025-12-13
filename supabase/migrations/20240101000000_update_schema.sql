-- Add is_admin column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add description column to categories table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='categories' 
        AND column_name='description'
    ) THEN
        ALTER TABLE categories ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add created_at and updated_at columns to categories if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='categories' 
        AND column_name='created_at'
    ) THEN
        ALTER TABLE categories ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='categories' 
        AND column_name='updated_at'
    ) THEN
        ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add status column to existing listings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='status'
    ) THEN
        ALTER TABLE listings ADD COLUMN status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Add image_url_1 and image_url_2 columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='image_url_1'
    ) THEN
        ALTER TABLE listings ADD COLUMN image_url_1 VARCHAR(500);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='image_url_2'
    ) THEN
        ALTER TABLE listings ADD COLUMN image_url_2 VARCHAR(500);
    END IF;
END $$;

-- Add terms_agreed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='terms_agreed'
    ) THEN
        ALTER TABLE listings ADD COLUMN terms_agreed BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
END $$;

-- Add unique constraint to categories.name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name='categories' 
        AND constraint_name='categories_name_unique'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
    END IF;
END $$;

-- Insert default categories using safe method (no ON CONFLICT)
INSERT INTO categories (name, description) 
SELECT 'Kiyim-kechak', 'Kiyim-kechak va boshqa tekstil mahsulotlari'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Kiyim-kechak');

INSERT INTO categories (name, description) 
SELECT 'Poyabzal', 'Oyoq kiyimlari'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Poyabzal');

INSERT INTO categories (name, description) 
SELECT 'Aksessuarlar', 'Turli xil aksessuarlar va bezaklar'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Aksessuarlar');

INSERT INTO categories (name, description) 
SELECT 'Uy jihozlari', 'Uy uchun jihozlar va buyumlar'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Uy jihozlari');

INSERT INTO categories (name, description) 
SELECT 'Elektronika', 'Elektronika va gadjetlar'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Elektronika');

INSERT INTO categories (name, description) 
SELECT 'Boshqa', 'Boshqa turdagi tovarlar'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Boshqa');

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Enable RLS on tables if not already enabled
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view all approved listings" ON listings;
DROP POLICY IF EXISTS "Users can view own listings regardless of status" ON listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Admins can update all listings" ON listings;
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Create RLS Policies for listings
CREATE POLICY "Users can view all approved listings" ON listings
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own listings regardless of status" ON listings
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Admins can update all listings" ON listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- RLS Policies for categories
CREATE POLICY "Everyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;

-- Create storage policies
-- Allow public access to view images
CREATE POLICY "Public images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'listing-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow admins to manage all images
CREATE POLICY "Admins can manage all images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'listing-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );
