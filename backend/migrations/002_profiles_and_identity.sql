-- ============================================================
-- EduHub Migration 002: Profiles & Identity
-- ============================================================
-- Core identity layer. Replaces old `users` table.
-- profiles.id = auth.users.id (canonical Supabase pattern).
-- Includes student ID parsing and auto-provisioning trigger.
-- ============================================================

-- ─── Table: profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,

  -- Student identification (nullable for staff/admin accounts)
  student_id      TEXT,                          -- e.g. '25-ITC-29'
  admission_batch INTEGER,                       -- derived: 2025
  department_code department_code,               -- derived: ITC
  roll_number     INTEGER,                       -- derived: 29

  -- Profile info
  college         TEXT DEFAULT 'TCET',
  phone           TEXT,
  bio             TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  last_active_at  TIMESTAMPTZ DEFAULT now(),

  -- Soft delete
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID
);

-- ─── Table: user_preferences ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme                TEXT DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  language             TEXT DEFAULT 'en',
  preferred_ai_model   ai_provider DEFAULT 'nvidia',
  email_notifications  BOOLEAN DEFAULT true,
  push_notifications   BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_code) WHERE department_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_not_deleted ON profiles(id) WHERE deleted_at IS NULL;

-- ─── Function: parse_student_id ──────────────────────────────
-- Validates and parses student ID format: '25-ITC-29'
-- Returns TABLE(batch INT, dept department_code, roll INT)
-- Uses explicit IF checks instead of EXCEPTION blocks for performance.
CREATE OR REPLACE FUNCTION parse_student_id(p_student_id TEXT)
RETURNS TABLE(batch INTEGER, dept department_code, roll INTEGER)
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_parts   TEXT[];
  v_batch   INTEGER;
  v_dept    TEXT;
  v_roll    INTEGER;
  v_valid_depts TEXT[] := ARRAY['ITC','CE','EXTC','ME','CSE','AI','EE'];
BEGIN
  -- Validate format: 2-digit batch, 2-4 letter dept, 1-3 digit roll
  IF p_student_id !~ '^\d{2}-[A-Z]{2,4}-\d{1,3}$' THEN
    RAISE EXCEPTION 'Invalid student ID format: %. Expected format: YY-DEPT-ROLL (e.g. 25-ITC-29)', p_student_id;
  END IF;

  v_parts := string_to_array(p_student_id, '-');
  v_batch := 2000 + v_parts[1]::INTEGER;
  v_dept  := v_parts[2];
  v_roll  := v_parts[3]::INTEGER;

  -- Validate department code against known list (avoids EXCEPTION subtransaction)
  IF NOT (v_dept = ANY(v_valid_depts)) THEN
    RAISE EXCEPTION 'Invalid department code: %. Valid codes: ITC, CE, EXTC, ME, CSE, AI, EE', v_dept;
  END IF;

  -- Validate roll number range
  IF v_roll < 1 OR v_roll > 999 THEN
    RAISE EXCEPTION 'Invalid roll number: %. Must be between 1 and 999', v_roll;
  END IF;

  RETURN QUERY SELECT v_batch, v_dept::department_code, v_roll;
END;
$$;

-- ─── Function: calculate_current_year ────────────────────────
-- Computes FE/SE/TE/BE/Alumni dynamically from admission batch
-- using the active academic year.
CREATE OR REPLACE FUNCTION calculate_current_year(p_admission_batch INTEGER)
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_active_start INTEGER;
  v_diff         INTEGER;
BEGIN
  -- Get the start year of the active academic year
  SELECT start_year INTO v_active_start
  FROM academic_years
  WHERE is_active = true
  LIMIT 1;

  IF v_active_start IS NULL THEN
    RETURN 'Unknown';
  END IF;

  v_diff := v_active_start - p_admission_batch;

  RETURN CASE
    WHEN v_diff = 0 THEN 'FE'    -- First Year
    WHEN v_diff = 1 THEN 'SE'    -- Second Year
    WHEN v_diff = 2 THEN 'TE'    -- Third Year
    WHEN v_diff = 3 THEN 'BE'    -- Final Year
    WHEN v_diff >= 4 THEN 'Alumni'
    ELSE 'Unknown'
  END;
END;
$$;

-- ─── Function: handle_new_user ───────────────────────────────
-- Auto-provisioning trigger on auth.users INSERT.
-- 1. Validates @tcetmumbai.in domain
-- 2. Creates profile + preferences
-- 3. Auto-assigns super_admin for designated email, else student
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email         TEXT;
  v_display_name  TEXT;
  v_avatar_url    TEXT;
  v_student_id    TEXT;
  v_batch         INTEGER;
  v_dept          department_code;
  v_roll          INTEGER;
  v_role_name     user_role;
  v_role_id       UUID;
BEGIN
  v_email := NEW.email;

  -- 1. Validate email domain
  IF v_email NOT LIKE '%@tcetmumbai.in' THEN
    RAISE EXCEPTION 'Only @tcetmumbai.in email addresses are allowed. Got: %', v_email;
  END IF;

  -- 2. Extract display name and avatar from OAuth metadata
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(v_email, '@', 1)
  );
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- 3. Try to parse student ID from the email prefix (e.g. 1032250973)
  --    Student ID is set later via profile update, not from email.
  --    For now, leave student_id fields NULL.

  -- 4. Insert profile
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, v_email, v_display_name, v_avatar_url);

  -- 5. Create default preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  -- 6. Assign role
  IF v_email = '1032250973@tcetmumbai.in' THEN
    v_role_name := 'super_admin';
  ELSE
    v_role_name := 'student';
  END IF;

  SELECT id INTO v_role_id FROM roles WHERE name = v_role_name;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (NEW.id, v_role_id, NEW.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── Trigger: auto-create profile on signup ──────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Function: update profile updated_at ─────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── Function: protect_identity_fields ───────────────────────
-- BEFORE UPDATE trigger that prevents non-admin users from
-- modifying immutable identity fields on profiles.
CREATE OR REPLACE FUNCTION protect_identity_fields()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If any identity field is being changed...
  IF (
    NEW.student_id      IS DISTINCT FROM OLD.student_id OR
    NEW.admission_batch IS DISTINCT FROM OLD.admission_batch OR
    NEW.department_code IS DISTINCT FROM OLD.department_code OR
    NEW.roll_number     IS DISTINCT FROM OLD.roll_number
  ) THEN
    -- Allow only super_admin or admin to make these changes
    IF NOT has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::user_role[]) THEN
      RAISE EXCEPTION 'Permission denied: identity fields (student_id, admission_batch, department_code, roll_number) are immutable. Only admins can modify them.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_identity
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_identity_fields();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
