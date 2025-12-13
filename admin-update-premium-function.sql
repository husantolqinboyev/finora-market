-- Admin premium update function
-- This function allows admins to update premium status for any user

CREATE OR REPLACE FUNCTION admin_update_user_premium(
  p_user_id UUID,
  p_is_premium BOOLEAN,
  p_premium_end_date TIMESTAMP WITH TIME ZONE,
  p_daily_post_limit INTEGER,
  p_ai_analysis_limit INTEGER
)
RETURNS TABLE (
  id UUID,
  is_premium BOOLEAN,
  premium_end_date TIMESTAMP WITH TIME ZONE,
  daily_post_limit INTEGER,
  ai_analysis_limit INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if the current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Only admins can update premium status';
  END IF;
  
  -- Update the user's premium status
  RETURN QUERY
  UPDATE profiles 
  SET 
    is_premium = p_is_premium,
    premium_end_date = p_premium_end_date,
    daily_post_limit = p_daily_post_limit,
    ai_analysis_limit = p_ai_analysis_limit,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING 
    id,
    is_premium,
    premium_end_date,
    daily_post_limit,
    ai_analysis_limit,
    updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_user_premium TO authenticated;
