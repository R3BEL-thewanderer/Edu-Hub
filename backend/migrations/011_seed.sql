-- ============================================================
-- EduHub Migration 011: Seed Data
-- ============================================================
-- Initial data required for the system to function:
-- roles, permissions, mappings, academic years, departments,
-- semesters, subjects, subscription plans, AI tiers.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. ROLES
-- ════════════════════════════════════════════════════════════

INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('super_admin',     'Super Admin',     'Full system control. Cannot be modified by admins.',       true),
  ('admin',           'Admin',           'User management, approvals, AI, analytics.',               true),
  ('faculty',         'Faculty',         'Upload official materials, verify content, create tests.',  true),
  ('content_manager', 'Content Manager', 'Department-scoped upload only. No publish or approve.',     true),
  ('student',         'Student',         'Consume content, take tests, use AI tutor.',                true)
ON CONFLICT (name) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 2. PERMISSIONS
-- ════════════════════════════════════════════════════════════

INSERT INTO permissions (code, display_name, description, category) VALUES
  -- Users
  ('view_users',            'View Users',            'View user profiles and lists',                  'users'),
  ('edit_users',            'Edit Users',            'Edit user profile information',                 'users'),
  ('block_users',           'Block Users',           'Block or suspend user accounts',                'users'),
  ('delete_users',          'Delete Users',          'Permanently delete user accounts',              'users'),

  -- Content
  ('upload_material',       'Upload Material',       'Upload study materials',                        'content'),
  ('approve_material',      'Approve Material',      'Approve pending material uploads',              'content'),
  ('reject_material',       'Reject Material',       'Reject pending material uploads',               'content'),
  ('archive_material',      'Archive Material',      'Archive study materials',                       'content'),
  ('delete_material',       'Delete Material',       'Delete study materials',                        'content'),
  ('verify_material',       'Verify Material',       'Verify and mark materials as official',         'content'),

  -- AI
  ('grant_ai',              'Grant AI Access',       'Grant AI tutor access to users',                'ai'),
  ('revoke_ai',             'Revoke AI Access',      'Revoke AI tutor access from users',             'ai'),
  ('modify_ai_limits',      'Modify AI Limits',      'Change AI usage limits and tier configs',       'ai'),

  -- Mock Tests
  ('create_mock',           'Create Mock Test',      'Create new mock tests',                         'mock_tests'),
  ('edit_mock',             'Edit Mock Test',        'Edit existing mock tests',                      'mock_tests'),
  ('publish_mock',          'Publish Mock Test',     'Publish mock tests for students',               'mock_tests'),
  ('delete_mock',           'Delete Mock Test',      'Delete mock tests',                             'mock_tests'),

  -- Analytics
  ('view_analytics',        'View Analytics',        'View platform analytics and reports',           'analytics'),
  ('export_reports',        'Export Reports',        'Export analytics reports',                       'analytics'),

  -- Academic
  ('manage_subjects',       'Manage Subjects',       'Create, edit, delete subjects',                 'academic'),
  ('manage_departments',    'Manage Departments',    'Create, edit, delete departments',              'academic'),
  ('manage_academic_years', 'Manage Academic Years', 'Create, edit academic year records',            'academic'),

  -- System
  ('manage_roles',          'Manage Roles',          'Assign and revoke user roles',                  'system'),
  ('manage_permissions',    'Manage Permissions',    'Configure role-permission mappings',            'system'),
  ('manage_settings',       'Manage Settings',       'Modify system-wide settings',                   'system'),
  ('manage_payments',       'Manage Payments',       'View and manage payments and subscriptions',    'system')
ON CONFLICT (code) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 3. ROLE ↔ PERMISSION MAPPINGS
-- ════════════════════════════════════════════════════════════

-- Super Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'view_users', 'edit_users', 'block_users',
  'upload_material', 'approve_material', 'reject_material', 'archive_material', 'delete_material', 'verify_material',
  'grant_ai', 'revoke_ai', 'modify_ai_limits',
  'create_mock', 'edit_mock', 'publish_mock', 'delete_mock',
  'view_analytics', 'export_reports',
  'manage_subjects',
  'manage_payments'
)
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Faculty permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'upload_material', 'verify_material',
  'create_mock', 'edit_mock', 'publish_mock',
  'view_analytics'
)
WHERE r.name = 'faculty'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Content Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'upload_material'
)
WHERE r.name = 'content_manager'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Student: no admin permissions (just auth-gated access via RLS)

-- ════════════════════════════════════════════════════════════
-- 4. ACADEMIC YEARS
-- ════════════════════════════════════════════════════════════

INSERT INTO academic_years (label, start_year, end_year, is_active) VALUES
  ('2025-26', 2025, 2026, true),
  ('2026-27', 2026, 2027, false)
ON CONFLICT (label) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 5. DEPARTMENTS
-- ════════════════════════════════════════════════════════════

INSERT INTO departments (code, name, short_name, total_years) VALUES
  ('ITC',  'Information Technology',             'IT',   4),
  ('CE',   'Computer Engineering',               'CE',   4),
  ('EXTC', 'Electronics & Telecommunication',    'EXTC', 4),
  ('ME',   'Mechanical Engineering',             'ME',   4),
  ('CSE',  'Computer Science & Engineering',     'CSE',  4),
  ('AI',   'AI & Data Science',                  'AIDS', 4),
  ('EE',   'Electrical Engineering',             'EE',   4)
ON CONFLICT (code) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 6. SEMESTERS (FE common — no department)
-- ════════════════════════════════════════════════════════════

-- 2025-26: Semester 1 & 2 (First Year, common across departments)
INSERT INTO semesters (academic_year_id, department_id, number, label)
SELECT ay.id, NULL, 1, 'Semester 1'
FROM academic_years ay WHERE ay.label = '2025-26'
ON CONFLICT (academic_year_id, department_id, number) DO NOTHING;

INSERT INTO semesters (academic_year_id, department_id, number, label)
SELECT ay.id, NULL, 2, 'Semester 2'
FROM academic_years ay WHERE ay.label = '2025-26'
ON CONFLICT (academic_year_id, department_id, number) DO NOTHING;

-- 2026-27: IT Department Semester 3 & 4
INSERT INTO semesters (academic_year_id, department_id, number, label)
SELECT ay.id, d.id, 3, 'Semester 3'
FROM academic_years ay, departments d
WHERE ay.label = '2026-27' AND d.code = 'ITC'
ON CONFLICT (academic_year_id, department_id, number) DO NOTHING;

INSERT INTO semesters (academic_year_id, department_id, number, label)
SELECT ay.id, d.id, 4, 'Semester 4'
FROM academic_years ay, departments d
WHERE ay.label = '2026-27' AND d.code = 'ITC'
ON CONFLICT (academic_year_id, department_id, number) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 7. SUBJECTS (migrated from existing seed data)
-- ════════════════════════════════════════════════════════════

-- Semester 1 subjects (2025-26)
INSERT INTO subjects (semester_id, code, name, full_name, icon, description, display_order)
SELECT s.id, v.code, v.name, v.full_name, v.icon, v.description, v.display_order
FROM semesters s
JOIN academic_years ay ON ay.id = s.academic_year_id
CROSS JOIN (VALUES
  ('chemistry',              'Chemistry',             'Engineering Chemistry',                      '🧪', 'Engineering Chemistry — Units 1 to 5',               1),
  ('pps',                    'PPS',                   'Programming & Problem Solving',              '💻', 'Programming & Problem Solving — C Language',          2),
  ('maths1',                 'Maths 1',               'Engineering Mathematics 1',                  '📐', 'Engineering Mathematics 1 — Calculus & Algebra',      3),
  ('iiks',                   'IIKS',                  'Indian Institution & Knowledge System',      '📖', 'Indian Institution & Knowledge System',               4),
  ('engineering-mechanics',  'Engineering Mechanics',  'Engineering Mechanics',                     '⚙️', 'Engineering Mechanics — Statics & Dynamics',           5)
) AS v(code, name, full_name, icon, description, display_order)
WHERE ay.label = '2025-26' AND s.number = 1
ON CONFLICT (semester_id, code) DO NOTHING;

-- Semester 2 subjects (2025-26)
INSERT INTO subjects (semester_id, code, name, full_name, icon, description, display_order)
SELECT s.id, v.code, v.name, v.full_name, v.icon, v.description, v.display_order
FROM semesters s
JOIN academic_years ay ON ay.id = s.academic_year_id
CROSS JOIN (VALUES
  ('physics', 'Physics', 'Applied Physics',                          '⚡', 'Applied Physics — Waves, Optics, Quantum',     1),
  ('bee',     'BEE',     'Basic Electrical Engineering',             '🔋', 'Basic Electrical Engineering',                 2),
  ('egpc',    'EGPC',    'Engineering Graphics & Product Creation',  '🖥️', 'Engineering Graphics & Product Creation',       3),
  ('maths2',  'Maths 2', 'Engineering Mathematics 2',               '📐', 'Engineering Mathematics 2 — Differential Eq.',  4),
  ('egd',     'EGD',     'Engineering Graphics & Drawing',           '📏', 'Engineering Graphics & Drawing',               5)
) AS v(code, name, full_name, icon, description, display_order)
WHERE ay.label = '2025-26' AND s.number = 2
ON CONFLICT (semester_id, code) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 8. SUBSCRIPTION PLANS
-- ════════════════════════════════════════════════════════════

INSERT INTO subscription_plans (tier, name, description, price_inr, duration_days, features) VALUES
  ('free',     'Free Plan',     'Basic access with limited AI usage',          0,    NULL,  '{"ai_messages": 10, "downloads": true, "mock_tests": true}'),
  ('premium',  'Premium Plan',  'Full access with enhanced AI and features', 4900,    30,  '{"ai_messages": 100, "downloads": true, "mock_tests": true, "priority_support": true}'),
  ('lifetime', 'Lifetime Plan', 'Unlimited access forever',                 49900,  NULL,  '{"ai_messages": -1, "downloads": true, "mock_tests": true, "priority_support": true, "early_access": true}')
ON CONFLICT (tier) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 9. AI ACCESS TIERS
-- ════════════════════════════════════════════════════════════

INSERT INTO ai_access_tiers (tier, daily_message_limit, daily_token_limit, allowed_providers, context_window_size) VALUES
  ('free',     10,   50000,   ARRAY['nvidia']::ai_provider[],            4096),
  ('premium',  100,  500000,  ARRAY['nvidia', 'gemini']::ai_provider[],  8192),
  ('lifetime', -1,   -1,     ARRAY['nvidia', 'gemini']::ai_provider[],  16384)
ON CONFLICT (tier) DO NOTHING;
