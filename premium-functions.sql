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
  -- Get user's daily limit
  SELECT daily_post_limit INTO v_limit
  FROM profiles
  WHERE id = p_user_id;
  
  -- Get today's usage
  SELECT COALESCE(posts_count, 0) INTO v_used
  FROM user_daily_limits
  WHERE user_id = p_user_id AND date = v_today;
  
  -- Return true if limit not reached
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
  -- Get user's AI limit
  SELECT ai_analysis_limit INTO v_limit
  FROM profiles
  WHERE id = p_user_id;
  
  -- Get today's usage
  SELECT COALESCE(ai_analysis_count, 0) INTO v_used
  FROM user_daily_limits
  WHERE user_id = p_user_id AND date = v_today;
  
  -- Return true if limit not reached
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

-- Update category rankings for a specific category
CREATE OR REPLACE FUNCTION update_category_rankings(p_category_id UUID)
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  rank_counter INTEGER := 1;
BEGIN
  -- Create a temporary table with user listing counts
  CREATE TEMP TABLE temp_user_counts AS
  SELECT 
    owner_id,
    COUNT(*) as listing_count,
    MAX(created_at) as latest_post
  FROM listings
  WHERE category_id = p_category_id AND status = 'approved'
  GROUP BY owner_id
  ORDER BY listing_count DESC, latest_post DESC;
  
  -- Update rankings for top 10 users
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
  
  -- Drop temporary table
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

-- Schedule cleanup function to run daily (this would be set up in Supabase Dashboard)
-- SELECT cron.schedule('cleanup-expired-premium', '0 2 * * *', 'SELECT cleanup_expired_premium();');
