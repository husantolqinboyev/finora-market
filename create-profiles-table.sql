-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) NOT NULL,
  full_name TEXT,
  phone TEXT,
  telegram_username TEXT,
  nickname VARCHAR(9) UNIQUE,
  avatar_url TEXT,
  address TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_new_user BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  daily_post_limit INTEGER DEFAULT 1,
  ai_analysis_limit INTEGER DEFAULT 10,
  premium_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_new_user ON profiles(is_new_user);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- Basic RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
