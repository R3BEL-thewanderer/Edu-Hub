-- ============================================================
-- EduHub Migration 010: Row Level Security (RLS)
-- ============================================================
-- Comprehensive RLS policies for all tables using RBAC
-- helper functions. Soft-delete filtering is enforced at
-- the policy level so application code doesn't need to
-- add WHERE deleted_at IS NULL.
--
-- DESIGN NOTES:
-- 1. All helper functions (has_role, is_staff, etc.) are
--    SECURITY DEFINER → bypass RLS → no recursion.
-- 2. Nested IN-subqueries replaced with SECURITY DEFINER
--    boolean helpers (can_view_mock_test, owns_mock_attempt,
--    owns_ai_session) for performance.
-- 3. audit_logs and activity_logs are append-only: no
--    UPDATE or DELETE policies exist.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- Enable RLS on ALL tables
-- ════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_department_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_access_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (
    auth.uid() = id AND deleted_at IS NULL
  );

-- Staff can read all non-deleted profiles
CREATE POLICY profiles_select_staff ON profiles
  FOR SELECT USING (
    is_staff(auth.uid()) AND deleted_at IS NULL
  );

-- Users can update their own profile
-- (identity fields are protected by the protect_identity_fields trigger)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id AND deleted_at IS NULL);

-- Admins can update any profile
CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::user_role[])
  );

-- Super admin can soft-delete profiles
CREATE POLICY profiles_delete_super ON profiles
  FOR DELETE USING (is_super_admin(auth.uid()));

-- Profile INSERT: handle_new_user() is SECURITY DEFINER (bypasses RLS).
-- This policy allows admin-created profiles and service-role operations.
CREATE POLICY profiles_insert_admin ON profiles
  FOR INSERT WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::user_role[])
  );

-- ════════════════════════════════════════════════════════════
-- USER PREFERENCES
-- ════════════════════════════════════════════════════════════

CREATE POLICY prefs_select_own ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY prefs_update_own ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY prefs_insert_own ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- RBAC TABLES (read-only for authenticated, write for super)
-- ════════════════════════════════════════════════════════════

CREATE POLICY roles_select ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY permissions_select ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY role_perms_select ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY user_roles_select ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only super admin can modify roles/permissions
CREATE POLICY roles_insert ON roles
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY roles_update ON roles
  FOR UPDATE USING (is_super_admin(auth.uid()));
CREATE POLICY roles_delete ON roles
  FOR DELETE USING (is_super_admin(auth.uid()));

CREATE POLICY user_roles_insert ON user_roles
  FOR INSERT WITH CHECK (
    is_super_admin(auth.uid())
    OR has_permission(auth.uid(), 'manage_roles')
  );
CREATE POLICY user_roles_delete ON user_roles
  FOR DELETE USING (
    is_super_admin(auth.uid())
    OR has_permission(auth.uid(), 'manage_roles')
  );

-- Staff department access
CREATE POLICY staff_dept_select ON staff_department_access
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY staff_dept_write ON staff_department_access
  FOR ALL USING (is_super_admin(auth.uid()));

-- ════════════════════════════════════════════════════════════
-- ACADEMIC TABLES (public read)
-- ════════════════════════════════════════════════════════════

CREATE POLICY academic_years_select ON academic_years
  FOR SELECT USING (true);

CREATE POLICY academic_years_write ON academic_years
  FOR ALL USING (has_permission(auth.uid(), 'manage_academic_years'));

CREATE POLICY departments_select ON departments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY departments_write ON departments
  FOR ALL USING (has_permission(auth.uid(), 'manage_departments'));

CREATE POLICY semesters_select ON semesters
  FOR SELECT USING (true);

CREATE POLICY semesters_write ON semesters
  FOR ALL USING (has_permission(auth.uid(), 'manage_subjects'));

CREATE POLICY subjects_select ON subjects
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY subjects_write ON subjects
  FOR ALL USING (has_permission(auth.uid(), 'manage_subjects'));

-- ════════════════════════════════════════════════════════════
-- STUDY MATERIALS
-- ════════════════════════════════════════════════════════════

-- Students see only approved, current, non-deleted materials
CREATE POLICY materials_select_student ON study_materials
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      -- Staff see all
      is_staff(auth.uid())
      -- Students see materials that have a current approved version
      OR current_version_id IS NOT NULL
    )
  );

-- Staff with upload_material can insert
CREATE POLICY materials_insert ON study_materials
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'upload_material'));

-- Staff with upload_material or the uploader can update
CREATE POLICY materials_update ON study_materials
  FOR UPDATE USING (
    has_permission(auth.uid(), 'upload_material')
    OR uploaded_by = auth.uid()
  );

CREATE POLICY materials_delete ON study_materials
  FOR DELETE USING (has_permission(auth.uid(), 'delete_material'));

-- Material versions: staff see all, students see approved+current
CREATE POLICY versions_select ON material_versions
  FOR SELECT USING (
    is_staff(auth.uid())
    OR (approval_status = 'approved' AND is_current = true)
  );

CREATE POLICY versions_insert ON material_versions
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'upload_material'));

-- Material reviews: only staff with approve/verify permissions
CREATE POLICY reviews_select ON material_reviews
  FOR SELECT USING (
    has_permission(auth.uid(), 'approve_material')
    OR has_permission(auth.uid(), 'verify_material')
  );

CREATE POLICY reviews_insert ON material_reviews
  FOR INSERT WITH CHECK (
    has_permission(auth.uid(), 'approve_material')
    OR has_permission(auth.uid(), 'verify_material')
  );

-- Material ratings: anyone authenticated can read; own write
CREATE POLICY ratings_select ON material_ratings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY ratings_insert ON material_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ratings_update ON material_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY ratings_delete ON material_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- AI TABLES
-- ════════════════════════════════════════════════════════════

CREATE POLICY ai_tiers_select ON ai_access_tiers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY ai_tiers_write ON ai_access_tiers
  FOR ALL USING (has_permission(auth.uid(), 'modify_ai_limits'));

CREATE POLICY ai_usage_select ON ai_usage_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ai_usage_insert ON ai_usage_daily
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ai_usage_update ON ai_usage_daily
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY ai_sessions_select ON ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY ai_sessions_insert ON ai_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ai_sessions_update ON ai_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- OPTIMIZED: uses owns_ai_session() SECURITY DEFINER helper
-- instead of nested IN-subquery to avoid per-row subquery evaluation.
CREATE POLICY ai_messages_select ON ai_chat_messages
  FOR SELECT USING (
    owns_ai_session(auth.uid(), session_id)
  );

CREATE POLICY ai_messages_insert ON ai_chat_messages
  FOR INSERT WITH CHECK (
    owns_ai_session(auth.uid(), session_id)
  );

-- ════════════════════════════════════════════════════════════
-- MOCK TESTS
-- ════════════════════════════════════════════════════════════

-- Published tests visible to all auth; unpublished to creator + admins
CREATE POLICY mock_tests_select ON mock_tests
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      is_published = true
      OR created_by = auth.uid()
      OR has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::user_role[])
    )
  );

CREATE POLICY mock_tests_insert ON mock_tests
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'create_mock'));

CREATE POLICY mock_tests_update ON mock_tests
  FOR UPDATE USING (
    created_by = auth.uid()
    OR has_permission(auth.uid(), 'edit_mock')
  );

CREATE POLICY mock_tests_delete ON mock_tests
  FOR DELETE USING (has_permission(auth.uid(), 'delete_mock'));

-- OPTIMIZED: uses can_view_mock_test() SECURITY DEFINER helper
-- instead of nested IN-subquery. Evaluates once per unique test_id
-- in the query plan instead of once per row.
CREATE POLICY mock_questions_select ON mock_questions
  FOR SELECT USING (
    can_view_mock_test(auth.uid(), test_id)
  );

CREATE POLICY mock_questions_write ON mock_questions
  FOR ALL USING (has_permission(auth.uid(), 'create_mock'));

-- OPTIMIZED: uses can_view_mock_test() via a single join path
-- (question → test) instead of 3-level nested subquery.
CREATE POLICY mock_options_select ON mock_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mock_questions mq
      WHERE mq.id = question_id
        AND can_view_mock_test(auth.uid(), mq.test_id)
    )
  );

CREATE POLICY mock_options_write ON mock_options
  FOR ALL USING (has_permission(auth.uid(), 'create_mock'));

-- Attempts & answers: own data only
CREATE POLICY mock_attempts_select ON mock_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY mock_attempts_insert ON mock_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY mock_attempts_update ON mock_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- OPTIMIZED: uses owns_mock_attempt() SECURITY DEFINER helper
CREATE POLICY mock_answers_select ON mock_answers
  FOR SELECT USING (
    owns_mock_attempt(auth.uid(), attempt_id)
  );

CREATE POLICY mock_answers_insert ON mock_answers
  FOR INSERT WITH CHECK (
    owns_mock_attempt(auth.uid(), attempt_id)
  );

-- ════════════════════════════════════════════════════════════
-- PAYMENTS & SUBSCRIPTIONS
-- ════════════════════════════════════════════════════════════

CREATE POLICY sub_plans_select ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY sub_plans_write ON subscription_plans
  FOR ALL USING (has_permission(auth.uid(), 'manage_payments'));

CREATE POLICY payment_orders_select ON payment_orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR has_permission(auth.uid(), 'manage_payments')
  );

CREATE POLICY payment_orders_insert ON payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY payment_txns_select ON payment_transactions
  FOR SELECT USING (
    auth.uid() = user_id
    OR has_permission(auth.uid(), 'manage_payments')
  );

CREATE POLICY user_subs_select ON user_subscriptions
  FOR SELECT USING (
    auth.uid() = user_id
    OR has_permission(auth.uid(), 'manage_payments')
  );

-- ════════════════════════════════════════════════════════════
-- ANALYTICS & ENGAGEMENT
-- ════════════════════════════════════════════════════════════

CREATE POLICY downloads_select ON analytics_downloads
  FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY downloads_insert ON analytics_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY views_select ON analytics_views
  FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY views_insert ON analytics_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY bookmarks_select ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY bookmarks_insert ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY bookmarks_delete ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY progress_select ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY progress_upsert ON user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY recent_select ON recently_viewed
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY recent_upsert ON recently_viewed
  FOR ALL USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ════════════════════════════════════════════════════════════

CREATE POLICY notif_select ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notif_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);  -- mark as read

CREATE POLICY notif_delete ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY notif_insert_admin ON notifications
  FOR INSERT WITH CHECK (
    is_staff(auth.uid())
  );

-- ════════════════════════════════════════════════════════════
-- LOGS (APPEND-ONLY — no UPDATE or DELETE policies)
-- ════════════════════════════════════════════════════════════

-- Activity logs: users can read own; admins read all; anyone auth can insert.
-- NO UPDATE or DELETE policies = immutable log.
CREATE POLICY activity_select ON activity_logs
  FOR SELECT USING (
    auth.uid() = user_id
    OR has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::user_role[])
  );

CREATE POLICY activity_insert ON activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Audit logs: admins can read; staff can insert.
-- NO UPDATE or DELETE policies = tamper-proof audit trail.
CREATE POLICY audit_select ON audit_logs
  FOR SELECT USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::user_role[])
  );

CREATE POLICY audit_insert ON audit_logs
  FOR INSERT WITH CHECK (is_staff(auth.uid()));
