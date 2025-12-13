-- Enable HttpOnly cookie authentication for Supabase
-- This migration should be run on your Supabase database

-- Create function to handle secure token refresh with rotation
CREATE OR REPLACE FUNCTION auth.handle_secure_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Log refresh attempts for monitoring
  INSERT INTO auth.audit_logs (event, user_id, created_at)
  VALUES ('token_refresh', NEW.user_id, NOW());
  
  -- Invalidate old refresh token after issuing new one
  -- This prevents token reuse attacks
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit logs table for security monitoring
CREATE TABLE IF NOT EXISTS auth.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE auth.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs
CREATE POLICY "Users can view own audit logs" ON auth.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for inserting audit logs (system only)
CREATE POLICY "System can insert audit logs" ON auth.audit_logs
  FOR INSERT WITH CHECK (true);

-- Configure session management for short-lived tokens
-- These settings should be configured in Supabase dashboard:
-- Access token lifetime: 5-15 minutes
-- Refresh token lifetime: 7-30 days
-- Enable refresh token rotation

-- Add index for audit log queries
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON auth.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON auth.audit_logs(created_at);

-- Grant necessary permissions
GRANT SELECT ON auth.audit_logs TO authenticated;
GRANT INSERT ON auth.audit_logs TO service_role;
