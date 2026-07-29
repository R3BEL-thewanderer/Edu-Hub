-- ============================================
-- EduHub Database Schema for Supabase
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  college TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  -- Subscription fields
  is_paid BOOLEAN DEFAULT false,
  plan TEXT CHECK (plan IN ('monthly', 'semester')),
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  -- AI usage tracking
  ai_messages_today INTEGER DEFAULT 0,
  ai_last_reset_at TIMESTAMPTZ DEFAULT now()
);

-- Table: subjects
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  icon TEXT,
  description TEXT,
  is_locked BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes_count INTEGER DEFAULT 0,
  pdfs_count INTEGER DEFAULT 0,
  pyqs_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  UNIQUE(year, semester, id)
);

-- Table: files (notes, pdfs, pyqs)
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('notes', 'pdfs', 'pyqs')),
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT DEFAULT 'application/pdf',
  exam_year TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0
);

-- Table: videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  title TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'hosted')),
  youtube_url TEXT,
  storage_path TEXT,
  duration TEXT,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  views INTEGER DEFAULT 0
);

-- Table: chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Table: chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'bot')),
  content TEXT NOT NULL,
  sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'semester')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- ============================================
-- Performance Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_files_subject_lookup ON files(subject_id, year, semester, content_type);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users: can only read/write own row
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Subjects: anyone can read (public catalog)
CREATE POLICY "Anyone can read subjects" ON subjects FOR SELECT USING (true);

-- Files: authenticated users can read
CREATE POLICY "Auth users can read files" ON files FOR SELECT USING (auth.role() = 'authenticated');

-- Videos: authenticated users can read
CREATE POLICY "Auth users can read videos" ON videos FOR SELECT USING (auth.role() = 'authenticated');

-- Chat sessions: own sessions only
CREATE POLICY "Users can read own sessions" ON chat_sessions FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own sessions" ON chat_sessions FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Chat messages: own session messages only
CREATE POLICY "Users can read own messages" ON chat_messages FOR SELECT USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())));

-- Payments: own payments only
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================
-- Helper function for admin to increment stats
-- ============================================

CREATE OR REPLACE FUNCTION increment_subject_stat(p_subject_id TEXT, p_column TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE subjects SET %I = %I + 1 WHERE id = $1', p_column, p_column) USING p_subject_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Seed: Insert subjects for Sem 1 and Sem 2
-- ============================================

INSERT INTO subjects (id, year, semester, name, full_name, icon, description, is_locked, display_order) VALUES
  ('chemistry', '2025-26', 'sem1', 'Chemistry', 'Engineering Chemistry', '🧪', 'Engineering Chemistry — Units 1 to 5', false, 1),
  ('pps', '2025-26', 'sem1', 'PPS', 'Programming & Problem Solving', '💻', 'Programming & Problem Solving — C Language', false, 2),
  ('maths1', '2025-26', 'sem1', 'Maths 1', 'Engineering Mathematics 1', '📐', 'Engineering Mathematics 1 — Calculus & Algebra', false, 3),
  ('iiks', '2025-26', 'sem1', 'IIKS', 'Indian Institution & Knowledge System', '📖', 'Indian Institution & Knowledge System', false, 4),
  ('engineering-mechanics', '2025-26', 'sem1', 'Engineering Mechanics', 'Engineering Mechanics', '⚙️', 'Engineering Mechanics — Statics & Dynamics', false, 5),
  ('physics', '2025-26', 'sem2', 'Physics', 'Applied Physics', '⚡', 'Applied Physics — Waves, Optics, Quantum', false, 1),
  ('bee', '2025-26', 'sem2', 'BEE', 'Basic Electrical Engineering', '🔋', 'Basic Electrical Engineering', false, 2),
  ('egpc', '2025-26', 'sem2', 'EGPC', 'Engineering Graphics & Product Creation', '🖥️', 'Engineering Graphics & Product Creation', false, 3),
  ('maths2', '2025-26', 'sem2', 'Maths 2', 'Engineering Mathematics 2', '📐', 'Engineering Mathematics 2 — Differential Equations', false, 4),
  ('egd', '2025-26', 'sem2', 'EGD', 'Engineering Graphics & Drawing', '📏', 'Engineering Graphics & Drawing', false, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Auto-create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create user profile when someone signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
