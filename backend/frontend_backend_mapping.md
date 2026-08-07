# Frontend to Backend Mapping

| Endpoint | Frontend Files | Status |
|----------|----------------|--------|
| `/api/auth/me` | None | ❌ Never called |
| `/api/auth/login/google` | None | ❌ Never called |
| `/api/auth/logout` | None | ❌ Never called |
| `/api/files/signed-url` | c:\fe-notes\frontend\app\src\lib\supabaseData.ts | ✅ Used |
| `/api/chat` | c:\fe-notes\frontend\app\src\lib\chatApi.ts | ✅ Used |
| `/api/chat/history/{session_id}` | None | ❌ Never called |
| `/api/chat/new-session` | None | ❌ Never called |
| `/api/payment/create-order` | None | ❌ Never called |
| `/api/payment/verify` | None | ❌ Never called |
| `/api/payment/webhook` | None | ❌ Never called |
| `/api/admin/dashboard` | c:\fe-notes\frontend\app\src\api\hooks\useAdmin.ts | ✅ Used |
| `/api/admin/health` | c:\fe-notes\frontend\app\src\api\hooks\useAdmin.ts | ✅ Used |
| `/api/admin/analytics` | None | ❌ Never called |
| `/api/admin/users` | c:\fe-notes\frontend\app\src\api\hooks\useAdmin.ts | ✅ Used |
| `/api/admin/users/{user_id}` | c:\fe-notes\frontend\app\src\api\hooks\useAdmin.ts | ✅ Used |
| `/api/admin/subjects` | None | ❌ Never called |
| `/api/admin/subjects/{subject_id}` | None | ❌ Never called |
| `/api/admin/upload` | None | ❌ Never called |
| `/api/admin/content/{file_id}` | None | ❌ Never called |
| `/api/admin/payments` | None | ❌ Never called |
| `/api/admin/announcements` | c:\fe-notes\frontend\app\src\api\hooks\useAdmin.ts | ✅ Used |
| `/api/admin/announcements/{anc_id}` | c:\fe-notes\frontend\app\src\api\hooks\useAdmin.ts | ✅ Used |
| `/api/admin/settings` | c:\fe-notes\frontend\app\src\api\hooks\useAdmin.ts | ✅ Used |
| `/api/admin/export/users` | None | ❌ Never called |
| `/api/user/profile` | None | ❌ Never called |
| `/api/user/account` | None | ❌ Never called |
| `/api/user/subscription` | None | ❌ Never called |
| `/api/subjects/{year}/{semester}` | c:\fe-notes\frontend\app\src\lib\supabaseData.ts | ✅ Used |
| `/api/subjects/{year}/{semester}/{subject_id}` | c:\fe-notes\frontend\app\src\lib\supabaseData.ts | ✅ Used |
| `/api/subjects/{year}/{semester}/{subject_id}/files` | c:\fe-notes\frontend\app\src\lib\supabaseData.ts | ✅ Used |
| `/api/departments` | None | ❌ Never called |
| `/api/academic-years` | None | ❌ Never called |
| `/api/semesters` | None | ❌ Never called |
| `/api/subjects` | c:\fe-notes\frontend\app\src\lib\supabaseData.ts | ✅ Used |
| `/api/subjects/{id}` | c:\fe-notes\frontend\app\src\lib\supabaseData.ts | ✅ Used |
| `/api/materials` | c:\fe-notes\frontend\app\src\api\hooks\useMaterials.ts | ✅ Used |
| `/api/materials/pending` | c:\fe-notes\frontend\app\src\api\hooks\useMaterials.ts | ✅ Used |
| `/api/materials/{id}` | c:\fe-notes\frontend\app\src\api\hooks\useMaterials.ts | ✅ Used |
| `/api/materials/{id}/submit` | None | ❌ Never called |
| `/api/materials/{id}/approve` | c:\fe-notes\frontend\app\src\api\hooks\useMaterials.ts | ✅ Used |
| `/api/materials/{id}/reject` | c:\fe-notes\frontend\app\src\api\hooks\useMaterials.ts | ✅ Used |
| `/api/materials/{id}/rating` | c:\fe-notes\frontend\app\src\api\hooks\useMaterials.ts | ✅ Used |
| `/api/materials/{id}/ratings` | None | ❌ Never called |
| `/api/bookmarks/{material_id}` | None | ❌ Never called |
| `/api/bookmarks` | None | ❌ Never called |
| `/api/storage/upload` | None | ❌ Never called |
| `/api/storage/signed-url` | None | ❌ Never called |
| `/api/storage/file` | None | ❌ Never called |
| `/api/storage/replace` | None | ❌ Never called |
| `/api/storage/precreate-hierarchy` | None | ❌ Never called |
| `/api/ai/chat/stream` | None | ❌ Never called |
| `/api/ai/conversations` | None | ❌ Never called |
| `/api/ai/conversations/{session_id}` | None | ❌ Never called |
| `/api/ai/usage` | None | ❌ Never called |
| `/api/assessment/tests` | c:\fe-notes\frontend\app\src\pages\MockTestsPage.tsx | ✅ Used |
| `/api/assessment/tests/{test_id}` | c:\fe-notes\frontend\app\src\pages\MockTestsPage.tsx | ✅ Used |
| `/api/assessment/tests/{test_id}/start` | c:\fe-notes\frontend\app\src\pages\MockTestsPage.tsx | ✅ Used |
| `/api/assessment/attempts/{attempt_id}/save` | None | ❌ Never called |
| `/api/assessment/attempts/{attempt_id}/submit` | None | ❌ Never called |
| `/api/assessment/analytics/student` | None | ❌ Never called |
| `/api/assessment/author/tests` | None | ❌ Never called |
| `/api/assessment/author/tests/{test_id}/duplicate` | None | ❌ Never called |
| `/api/assessment/author/tests/{test_id}/publish` | None | ❌ Never called |
| `/api/assessment/author/tests/{test_id}/questions` | None | ❌ Never called |
| `/api/assessment/author/tests/{test_id}/questions/import` | None | ❌ Never called |
| `/api/assessment/author/questions` | None | ❌ Never called |
| `/api/assessment/author/answers/{answer_id}/evaluate` | None | ❌ Never called |
| `/api/assessment/analytics/admin` | None | ❌ Never called |
| `/api/assessment/leaderboards/global` | None | ❌ Never called |
| `/api/assessment/leaderboards/{test_id}` | None | ❌ Never called |
| `/api/activity/` | c:\fe-notes\frontend\app\src\pages\ActivityFeedPage.tsx | ✅ Used |
| `/api/activity/recent` | None | ❌ Never called |
| `/api/activity/platform` | None | ❌ Never called |
| `/api/notifications/` | c:\fe-notes\frontend\app\src\components\notifications\NotificationBell.tsx | ✅ Used |
| `/api/notifications/{notification_id}/read` | c:\fe-notes\frontend\app\src\components\notifications\NotificationBell.tsx | ✅ Used |
| `/health` | None | ❌ Never called |
