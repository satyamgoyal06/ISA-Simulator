-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- This creates all tables needed for the ISA Test Platform

-- 1. User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  tests_completed INT DEFAULT 0,
  practice_sessions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Per-topic statistics
CREATE TABLE IF NOT EXISTS topic_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  total_attempted INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  recent_wrong_ids TEXT[] DEFAULT '{}',
  last_attempted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, topic_slug)
);

-- 3. Test / practice / review history
CREATE TABLE IF NOT EXISTS test_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  mode TEXT NOT NULL,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  weak_topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — users can only access their own data
CREATE POLICY "Users read own profile"   ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users read own stats"   ON topic_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stats" ON topic_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stats" ON topic_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own history"   ON test_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON test_history FOR INSERT WITH CHECK (auth.uid() = user_id);
