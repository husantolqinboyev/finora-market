-- Premium Audit Logging System
-- This script creates a comprehensive audit trail for premium user changes

-- Create premium audit log table
CREATE TABLE IF NOT EXISTS premium_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('assigned', 'removed', 'extended', 'modified')),
  old_premium_end_date TIMESTAMP WITH TIME ZONE,
  new_premium_end_date TIMESTAMP WITH TIME ZONE,
  old_daily_post_limit INTEGER,
  new_daily_post_limit INTEGER,
  old_ai_analysis_limit INTEGER,
  new_ai_analysis_limit INTEGER,
  premium_days_added INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE premium_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_premium_audit_user_id ON premium_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_audit_admin_id ON premium_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_premium_audit_created_at ON premium_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_premium_audit_action ON premium_audit_log(action);

-- RLS Policies
CREATE POLICY "Admins can view all premium audit logs" ON premium_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can insert premium audit logs" ON premium_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Function to log premium changes
CREATE OR REPLACE FUNCTION log_premium_change(
  p_user_id UUID,
  p_admin_id UUID,
  p_action VARCHAR(20),
  p_old_premium_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_new_premium_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_old_daily_post_limit INTEGER DEFAULT NULL,
  p_new_daily_post_limit INTEGER DEFAULT NULL,
  p_old_ai_analysis_limit INTEGER DEFAULT NULL,
  p_new_ai_analysis_limit INTEGER DEFAULT NULL,
  p_premium_days_added INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO premium_audit_log (
    user_id,
    admin_id,
    action,
    old_premium_end_date,
    new_premium_end_date,
    old_daily_post_limit,
    new_daily_post_limit,
    old_ai_analysis_limit,
    new_ai_analysis_limit,
    premium_days_added,
    notes
  ) VALUES (
    p_user_id,
    p_admin_id,
    p_action,
    p_old_premium_end_date,
    p_new_premium_end_date,
    p_old_daily_post_limit,
    p_new_daily_post_limit,
    p_old_ai_analysis_limit,
    p_new_ai_analysis_limit,
    p_premium_days_added,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get premium audit history for a user
CREATE OR REPLACE FUNCTION get_premium_audit_history(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  admin_id UUID,
  admin_name TEXT,
  action VARCHAR(20),
  old_premium_end_date TIMESTAMP WITH TIME ZONE,
  new_premium_end_date TIMESTAMP WITH TIME ZONE,
  old_daily_post_limit INTEGER,
  new_daily_post_limit INTEGER,
  old_ai_analysis_limit INTEGER,
  new_ai_analysis_limit INTEGER,
  premium_days_added INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pal.id,
    pal.admin_id,
    p.full_name || ' (@' || COALESCE(p.nickname, 'unknown') || ')' as admin_name,
    pal.action,
    pal.old_premium_end_date,
    pal.new_premium_end_date,
    pal.old_daily_post_limit,
    pal.new_daily_post_limit,
    pal.old_ai_analysis_limit,
    pal.new_ai_analysis_limit,
    pal.premium_days_added,
    pal.notes,
    pal.created_at
  FROM premium_audit_log pal
  LEFT JOIN profiles p ON pal.admin_id = p.id
  WHERE pal.user_id = p_user_id
  ORDER BY pal.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all recent premium changes (for admin dashboard)
CREATE OR REPLACE FUNCTION get_recent_premium_changes(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_name TEXT,
  admin_id UUID,
  admin_name TEXT,
  action VARCHAR(20),
  premium_days_added INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pal.id,
    pal.user_id,
    u.full_name || ' (@' || COALESCE(u.nickname, 'unknown') || ')' as user_name,
    pal.admin_id,
    p.full_name || ' (@' || COALESCE(p.nickname, 'unknown') || ')' as admin_name,
    pal.action,
    pal.premium_days_added,
    pal.notes,
    pal.created_at
  FROM premium_audit_log pal
  LEFT JOIN profiles u ON pal.user_id = u.id
  LEFT JOIN profiles p ON pal.admin_id = p.id
  WHERE pal.created_at >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY pal.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON premium_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_premium_change TO authenticated;
GRANT EXECUTE ON FUNCTION get_premium_audit_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_premium_changes TO authenticated;
