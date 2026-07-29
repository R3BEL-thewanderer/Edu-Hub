-- ============================================================
-- EduHub Migration 003: Role-Based Access Control (RBAC)
-- ============================================================
-- Complete RBAC system with 5 roles, 25+ granular permissions,
-- role-permission mappings, user-role assignments, and
-- staff department access scoping.
-- ============================================================

-- ─── Table: roles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         user_role UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description  TEXT,
  is_system    BOOLEAN DEFAULT false,   -- prevents deletion of built-in roles
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: permissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,     -- e.g. 'upload_material'
  display_name TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL,            -- e.g. 'content', 'users', 'ai'
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: role_permissions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ─── Table: user_roles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role_id)
);

-- ─── Table: staff_department_access ──────────────────────────
-- Only applies to admin, faculty, and content_manager roles.
-- Students derive their department from student_id.
CREATE TABLE IF NOT EXISTS staff_department_access (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL,  -- FK added after departments table exists (004)
  granted_by    UUID REFERENCES profiles(id),
  granted_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, department_id)
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_staff_dept_access_user ON staff_department_access(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_dept_access_dept ON staff_department_access(department_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- ─── Function: has_role ──────────────────────────────────────
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role_name user_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND r.name = p_role_name
  );
$$;

-- ─── Function: has_any_role ──────────────────────────────────
CREATE OR REPLACE FUNCTION has_any_role(p_user_id UUID, p_role_names user_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND r.name = ANY(p_role_names)
  );
$$;

-- ─── Function: has_permission ────────────────────────────────
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.code = p_permission_code
  );
$$;

-- ─── Function: has_department_access ─────────────────────────
CREATE OR REPLACE FUNCTION has_department_access(p_user_id UUID, p_department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM staff_department_access
    WHERE user_id = p_user_id
      AND department_id = p_department_id
  );
$$;

-- ─── Function: is_super_admin ────────────────────────────────
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(p_user_id, 'super_admin');
$$;

-- ─── Function: is_staff ─────────────────────────────────────
-- Returns true if user has any staff role (not student).
CREATE OR REPLACE FUNCTION is_staff(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_any_role(
    p_user_id,
    ARRAY['super_admin', 'admin', 'faculty', 'content_manager']::user_role[]
  );
$$;

-- ─── Function: can_view_mock_test ──────────────────────────
-- SECURITY DEFINER: bypasses RLS on mock_tests to avoid
-- nested IN-subqueries in mock_questions/mock_options RLS.
CREATE OR REPLACE FUNCTION can_view_mock_test(p_user_id UUID, p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mock_tests
    WHERE id = p_test_id
      AND deleted_at IS NULL
      AND (
        is_published = true
        OR created_by = p_user_id
        OR has_any_role(p_user_id, ARRAY['super_admin', 'admin']::user_role[])
      )
  );
$$;

-- ─── Function: owns_mock_attempt ───────────────────────────
-- SECURITY DEFINER: bypasses RLS on mock_attempts to avoid
-- nested IN-subqueries in mock_answers RLS.
CREATE OR REPLACE FUNCTION owns_mock_attempt(p_user_id UUID, p_attempt_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mock_attempts
    WHERE id = p_attempt_id AND user_id = p_user_id
  );
$$;

-- ─── Function: owns_ai_session ─────────────────────────────
-- SECURITY DEFINER: bypasses RLS on ai_chat_sessions to avoid
-- nested IN-subqueries in ai_chat_messages RLS.
CREATE OR REPLACE FUNCTION owns_ai_session(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM ai_chat_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  );
$$;

-- ════════════════════════════════════════════════════════════
-- NOTE: All helper functions above use SECURITY DEFINER.
-- This means they execute with the privileges of the function
-- owner (postgres), bypassing RLS on the tables they query.
-- This is intentional: it prevents infinite RLS recursion
-- (e.g. profiles → is_staff → user_roles → profiles → ∞).
-- ════════════════════════════════════════════════════════════
