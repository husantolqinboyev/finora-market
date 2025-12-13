-- Premium System Deployment Script
-- Run this script in Supabase SQL Editor to set up the complete premium system

-- Step 1: Update profiles table with premium fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS daily_post_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ai_analysis_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS premium_end_date TIMESTAMP WITH TIME ZONE;

-- Step 2: Create premium users table
CREATE TABLE IF NOT EXISTS premium_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  premium_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  premium_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  daily_post_limit INTEGER DEFAULT 2,
  ai_analysis_limit INTEGER DEFAULT 50,
  auto_renewal BOOLEAN DEFAULT FALSE,
  premium_type VARCHAR(20) DEFAULT 'basic' CHECK (premium_type IN ('basic', 'premium', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create user daily limits table
CREATE TABLE IF NOT EXISTS user_daily_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  ai_analysis_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Step 4: Create category rankings table
CREATE TABLE IF NOT EXISTS category_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rank_position INTEGER NOT NULL,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, user_id)
);

-- Step 5: Enable RLS
ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rankings ENABLE ROW LEVEL SECURITY;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_premium_users_end_date ON premium_users(premium_end_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_limits_user_date ON user_daily_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_category_rankings_category ON category_rankings(category_id);
CREATE INDEX IF NOT EXISTS idx_category_rankings_rank ON category_rankings(rank_position);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Step 7: RLS Policies for premium_users
DROP POLICY IF EXISTS "Users can view own premium status" ON premium_users;
CREATE POLICY "Users can view own premium status" ON premium_users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all premium users" ON premium_users;
CREATE POLICY "Admins can manage all premium users" ON premium_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Step 8: RLS Policies for user_daily_limits
DROP POLICY IF EXISTS "Users can view own daily limits" ON user_daily_limits;
CREATE POLICY "Users can view own daily limits" ON user_daily_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all daily limits" ON user_daily_limits;
CREATE POLICY "Admins can manage all daily limits" ON user_daily_limits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Step 9: RLS Policies for category_rankings
DROP POLICY IF EXISTS "Everyone can view category rankings" ON category_rankings;
CREATE POLICY "Everyone can view category rankings" ON category_rankings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage category rankings" ON category_rankings;
CREATE POLICY "Admins can manage category rankings" ON category_rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Step 10: Create all functions
-- Increment daily post count function
CREATE OR REPLACE FUNCTION increment_daily_post_count(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_daily_limits (user_id, date, posts_count, ai_analysis_count)
  VALUES (p_user_id, p_date, 1, 0)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    posts_count = user_daily_limits.posts_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Increment AI analysis count function
CREATE OR REPLACE FUNCTION increment_ai_analysis_count(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_daily_limits (user_id, date, posts_count, ai_analysis_count)
  VALUES (p_user_id, p_date, 0, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    ai_analysis_count = user_daily_limits.ai_analysis_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Check if user can post today
CREATE OR REPLACE FUNCTION can_post_today(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT daily_post_limit INTO v_limit
  FROM profiles
  WHERE id = p_user_id;
  
  SELECT COALESCE(posts_count, 0) INTO v_used
  FROM user_daily_limits
  WHERE user_id = p_user_id AND date = v_today;
  
  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Check if user can use AI analysis
CREATE OR REPLACE FUNCTION can_use_ai_analysis(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT ai_analysis_limit INTO v_limit
  FROM profiles
  WHERE id = p_user_id;
  
  SELECT COALESCE(ai_analysis_count, 0) INTO v_used
  FROM user_daily_limits
  WHERE user_id = p_user_id AND date = v_today;
  
  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Get user's remaining daily limits
CREATE OR REPLACE FUNCTION get_user_limits(p_user_id UUID)
RETURNS TABLE(
  daily_post_limit INTEGER,
  daily_posts_used INTEGER,
  daily_posts_remaining INTEGER,
  ai_analysis_limit INTEGER,
  ai_analysis_used INTEGER,
  ai_analysis_remaining INTEGER,
  is_premium BOOLEAN,
  premium_days_left INTEGER
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT 
    p.daily_post_limit,
    COALESCE(l.posts_count, 0) as daily_posts_used,
    GREATEST(0, p.daily_post_limit - COALESCE(l.posts_count, 0)) as daily_posts_remaining,
    p.ai_analysis_limit,
    COALESCE(l.ai_analysis_count, 0) as ai_analysis_used,
    GREATEST(0, p.ai_analysis_limit - COALESCE(l.ai_analysis_count, 0)) as ai_analysis_remaining,
    p.is_premium AND (p.premium_end_date IS NULL OR p.premium_end_date > NOW()) as is_premium,
    CASE 
      WHEN p.premium_end_date IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(DAY FROM p.premium_end_date - NOW()))
    END as premium_days_left
  FROM profiles p
  LEFT JOIN user_daily_limits l ON p.id = l.user_id AND l.date = v_today
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Update category rankings
CREATE OR REPLACE FUNCTION update_category_rankings(p_category_id UUID)
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  rank_counter INTEGER := 1;
BEGIN
  CREATE TEMP TABLE temp_user_counts AS
  SELECT 
    owner_id,
    COUNT(*) as listing_count,
    MAX(created_at) as latest_post
  FROM listings
  WHERE category_id = p_category_id AND status = 'approved'
  GROUP BY owner_id
  ORDER BY listing_count DESC, latest_post DESC;
  
  FOR user_record IN 
    SELECT owner_id, listing_count 
    FROM temp_user_counts 
    LIMIT 10
  LOOP
    INSERT INTO category_rankings (
      category_id, 
      user_id, 
      rank_position, 
      total_score,
      updated_at
    ) VALUES (
      p_category_id,
      user_record.owner_id,
      rank_counter,
      user_record.listing_count,
      NOW()
    )
    ON CONFLICT (category_id, user_id) 
    DO UPDATE SET 
      rank_position = rank_counter,
      total_score = user_record.listing_count,
      updated_at = NOW();
    
    rank_counter := rank_counter + 1;
  END LOOP;
  
  DROP TABLE temp_user_counts;
END;
$$ LANGUAGE plpgsql;

-- Get user's rank in category
CREATE OR REPLACE FUNCTION get_user_category_rank(p_user_id UUID, p_category_id UUID)
RETURNS TABLE(
  rank_position INTEGER,
  total_score INTEGER,
  total_users INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.rank_position,
    cr.total_score,
    (SELECT COUNT(*) FROM category_rankings WHERE category_id = p_category_id)
  FROM category_rankings cr
  WHERE cr.user_id = p_user_id AND cr.category_id = p_category_id;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired premium users
CREATE OR REPLACE FUNCTION cleanup_expired_premium()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_premium = FALSE,
    daily_post_limit = 1,
    ai_analysis_limit = 10,
    premium_end_date = NULL,
    updated_at = NOW()
  WHERE is_premium = TRUE 
  AND premium_end_date IS NOT NULL 
  AND premium_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create triggers
DROP TRIGGER IF EXISTS update_premium_users_updated_at ON premium_users;
CREATE TRIGGER update_premium_users_updated_at BEFORE UPDATE ON premium_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_daily_limits_updated_at ON user_daily_limits;
CREATE TRIGGER update_user_daily_limits_updated_at BEFORE UPDATE ON user_daily_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_category_rankings_updated_at ON category_rankings;
CREATE TRIGGER update_category_rankings_updated_at BEFORE UPDATE ON category_rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON premium_users TO authenticated;
GRANT ALL ON user_daily_limits TO authenticated;
GRANT SELECT ON category_rankings TO anon, authenticated;
GRANT ALL ON category_rankings TO authenticated;

-- Step 13: Create sample premium user (for testing)
-- This creates a premium user for testing purposes
-- Uncomment the following lines to create a test premium user:
/*
INSERT INTO profiles (id, auth_user_id, full_name, nickname, is_premium, premium_end_date, daily_post_limit, ai_analysis_limit)
VALUES (
  'test-user-id', 
  'test-user-id', 
  'Test Premium User', 
  'testpremium',
  TRUE,
  NOW() + INTERVAL '30 days',
  5,
  100
) ON CONFLICT (id) DO UPDATE SET
  is_premium = TRUE,
  premium_end_date = NOW() + INTERVAL '30 days',
  daily_post_limit = 5,
  ai_analysis_limit = 100;
*/

-- Deployment complete!
-- Premium system is now ready to use.
