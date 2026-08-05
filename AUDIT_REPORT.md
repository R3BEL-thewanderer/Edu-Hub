# EduHub Debugging Audit Report

## Batch 1: Python Syntax & Type Errors

### Issue 1: `FastAPI` Dependency Missing
* **Severity:** High
* **Root cause:** Dependency missing from `requirements.txt` / not installed in the environment.
* **File:** `backend/main.py`
* **Line:** 1
* **Why it happens:** The Python process fails immediately upon importing `main` because `fastapi` isn't installed.
* **Recommended fix:** Add `fastapi` to `requirements.txt`.
* **Production Impact:** Breaks backend initialization.
* **Estimated effort:** Low (1 min)

### Issue 2: `pydantic[email]` Dependency Missing
* **Severity:** High
* **Root cause:** Dependency missing from `requirements.txt` / not installed in the environment.
* **File:** `backend/schemas/auth.py`
* **Line:** 5 (instantiation)
* **Why it happens:** Pydantic email validation is used but `email-validator` is not installed.
* **Recommended fix:** Add `pydantic[email]` to `requirements.txt`.
* **Production Impact:** Breaks auth schema loading and backend initialization.
* **Estimated effort:** Low (1 min)

### Issue 3: Duplicate module named "auth"
* **Severity:** Medium
* **Root cause:** Both `core.auth` and `dependencies.auth` exist, and `mypy` flags this as a collision in namespace mapping.
* **File:** `backend/dependencies/auth.py`
* **Line:** N/A
* **Why it happens:** `mypy` requires explicit `--explicit-package-bases` to resolve namespace collisions, or renaming.
* **Recommended fix:** Set up `mypy.ini` with `explicit_package_bases=True`.
* **Production Impact:** Breaks CI/CD static analysis.
* **Estimated effort:** Low (5 mins)

### Issue 4: Implicit Optionals
* **Severity:** Low
* **Root cause:** PEP 484 implicitly optional parameters.
* **File:** `backend/services/nvidia_ai.py` and `backend/services/gemini.py`
* **Line:** 12
* **Why it happens:** `history` defaults to `None`, but type hint is `list[Any]` instead of `list[Any] | None` or `Optional[list[Any]]`.
* **Recommended fix:** Add `Optional[...]` or specify type `list[Any] | None`.
* **Production Impact:** No runtime break, just typing lint.
* **Estimated effort:** Low (10 mins)

### Issue 5: Supabase Type Mapping Errors
* **Severity:** Medium
* **Root cause:** Indexing into Unions improperly (e.g. `res.data[0]`).
* **File:** `backend/services/supabase_client.py`
* **Line:** 25, 35
* **Why it happens:** The Supabase python client returns `APIResponse` whose `.data` is a Union of dict, list, scalar, etc. `mypy` complains about unvalidated indexing into Union types.
* **Recommended fix:** Explicitly cast `.data` or check `isinstance(data, list)` before indexing.
* **Production Impact:** Breaks CI/CD static analysis.
* **Estimated effort:** Low (20 mins)

## Batch 2: Backend Runtime Bugs

### Issue 6: Test Connection Failing Due To Missing "public.subjects"
* **Severity:** High
* **Root cause:** The test query searches for `public.subjects` but gets `PGRST205` error (table not found).
* **File:** `backend/test_connection.py`
* **Line:** N/A (runtime failure in DB execution)
* **Why it happens:** The database is not initialized with the tables specified in `schema.sql`, or the Supabase project configuration is pointing to an uninitialized environment.
* **Recommended fix:** Ensure that `schema.sql` is run in the Supabase instance, or fix migrations.
* **Production Impact:** Breaks `health` check and API startup validation, and many database routes.
* **Estimated effort:** Medium (30 mins to run setup/migrations)

### Issue 7: File Output UTF-8 Decoding Bug
* **Severity:** Medium
* **Root cause:** Python attempts to read `test_output.txt` with default utf-8, but it contains `\xff\xfe` (UTF-16 LE BOM).
* **File:** `backend/tests/conftest.py` / `pytest` collection
* **Line:** N/A
* **Why it happens:** `pytest` traverses the folder and attempts to load test files.
* **Recommended fix:** Rename `test_output.txt` or configure pytest to ignore `.txt` files.
* **Production Impact:** Breaks testing pipeline.
* **Estimated effort:** Low (1 min)

### Issue 8: `SUPABASE_URL` Initialization Crash
* **Severity:** Critical
* **Root cause:** `services/supabase_client.py` uses `settings.SUPABASE_URL` immediately, crashing if it's missing.
* **File:** `backend/services/supabase_client.py`
* **Line:** 10
* **Why it happens:** When running locally without a `.env` configured properly, `create_client` raises `SupabaseException("supabase_url is required")`.
* **Recommended fix:** Implement `.env` fallback, or add better validation/error handling in config loader.
* **Production Impact:** Dev setup / pipeline issue. Crash loops on missing env config.
* **Estimated effort:** Low (5 mins)

### Issue 9: `get_or_create_user` Missing Auth ID Validation
* **Severity:** Medium
* **Root cause:** It expects a string `auth_id` but type hinting/usage in `chat.py` sends `uid` which might be None if the auth token is malformed.
* **File:** `backend/routes/chat.py`
* **Line:** 49
* **Why it happens:** `uid = user.get("sub")` can return `None`, breaking `eq("auth_id", auth_id)`.
* **Recommended fix:** Validate `uid is not None` before attempting to DB query.
* **Production Impact:** Unhandled internal server error during AI chat initialization for missing sessions.
* **Estimated effort:** Low (5 mins)

### Issue 10: `test_connection.py` uses `urllib3` inside `supabase` improperly
* **Severity:** Medium
* **Root cause:** The `httpx.ConnectError` due to malformed fake domain.
* **File:** `backend/test_connection.py`
* **Line:** 28
* **Why it happens:** DNS resolution fails for `test` when trying to contact `SUPABASE_URL`.
* **Recommended fix:** Don't run connection integration tests with invalid mock URLs without proper patching.
* **Production Impact:** CI failure.
* **Estimated effort:** Low (5 mins)


## Batch 3: Frontend React Anti-Patterns & Compilation Issues

### Issue 11: `setState` Called Synchronously Within Effect (Cascading Render)
* **Severity:** Medium
* **Root cause:** `setIsMobile(mq.matches)` and `setScale(isMobile ? 0.25 : 1.0)` are being called directly in the `useEffect` body synchronously.
* **File:** `frontend/app/src/components/subject/PDFViewer.tsx`
* **Line:** 31, 47
* **Why it happens:** React linting rules (`react-hooks/set-state-in-effect`) recommend against synchronous `setState` in effects unless responding to an external event because it triggers a double render.
* **Recommended fix:** Only call `setState` in event handlers or async callbacks inside the effect. Calculate the initial state directly in the state initialization or before render, instead of using an effect.
* **Production Impact:** Performance degradation (unnecessary cascading re-renders).
* **Estimated effort:** Low (15 mins)

### Issue 12: `setState` Called Synchronously Within Effect (Cascading Render)
* **Severity:** Medium
* **Root cause:** `setDisplayName` and other setters are being called directly in the `useEffect` body synchronously.
* **File:** `frontend/app/src/pages/ProfilePage.tsx`
* **Line:** 50
* **Why it happens:** Setting multiple states in an effect without an event loop tick causes cascading renders.
* **Recommended fix:** Group state updates or derive state directly during render without using `useEffect` for syncing props/global state to local state.
* **Production Impact:** Performance degradation (unnecessary cascading re-renders).
* **Estimated effort:** Low (15 mins)

### Issue 13: Component Created During Render (Nested Component Anti-Pattern)
* **Severity:** High
* **Root cause:** The `ErrorState` component is defined inside the render function of `PDFViewer` (or another hook).
* **File:** `frontend/app/src/components/subject/PDFViewer.tsx`
* **Line:** 107
* **Why it happens:** Re-creating a component function on every render destroys its state and forces a complete unmount/remount of the DOM tree it renders.
* **Recommended fix:** Move `ErrorState` outside of the `PDFViewer` component, or change it to a standard function that returns JSX rather than a component (e.g. `renderErrorState()`).
* **Production Impact:** Breaks component state, kills performance on re-renders, and violates `react-hooks/static-components`.
* **Estimated effort:** Low (10 mins)

### Issue 14: Impure Function During Render (`Math.random()`)
* **Severity:** Medium
* **Root cause:** `Math.random()` is used to calculate width inside a `useMemo` block or render path.
* **File:** `frontend/app/src/components/ui/sidebar.tsx`
* **Line:** 611
* **Why it happens:** Calling an impure function like `Math.random` during render produces unstable results and violates React's strict mode idempotency rules.
* **Recommended fix:** Move the random generation to a `useEffect` on mount, or pass it in as a prop.
* **Production Impact:** Hydration mismatches during SSR, or visual jitter on re-renders.
* **Estimated effort:** Low (10 mins)

### Issue 15: Fast Refresh Only Works When a File Only Exports Components
* **Severity:** Low
* **Root cause:** Components and standard functions/constants are being exported from the same file.
* **File:** Various UI components (`badge.tsx`, `button.tsx`, `form.tsx`, etc.)
* **Line:** N/A
* **Why it happens:** `react-refresh/only-export-components` requires that files with React components only export React components to maintain Hot Module Replacement state.
* **Recommended fix:** Move utility exports to a separate file, or disable the lint rule if unavoidable.
* **Production Impact:** No production impact. Only breaks HMR during local dev.
* **Estimated effort:** Low (20 mins)
