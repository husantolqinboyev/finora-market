-- Premium userlar uchun jadval
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

-- Premium userlar limitlari
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

-- Kategoriya bo'yicha reytinglar
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

-- Enable RLS
ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rankings ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_premium_users_end_date ON premium_users(premium_end_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_limits_user_date ON user_daily_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_category_rankings_category ON category_rankings(category_id);
CREATE INDEX IF NOT EXISTS idx_category_rankings_rank ON category_rankings(rank_position);

-- RLS Policies for premium_users
CREATE POLICY "Users can view own premium status" ON premium_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all premium users" ON premium_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- RLS Policies for user_daily_limits
CREATE POLICY "Users can view own daily limits" ON user_daily_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all daily limits" ON user_daily_limits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- RLS Policies for category_rankings
CREATE POLICY "Everyone can view category rankings" ON category_rankings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage category rankings" ON category_rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Triggers
CREATE TRIGGER update_premium_users_updated_at BEFORE UPDATE ON premium_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_limits_updated_at BEFORE UPDATE ON user_daily_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_rankings_updated_at BEFORE UPDATE ON category_rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
