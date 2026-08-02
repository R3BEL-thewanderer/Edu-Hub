-- ============================================================
-- EduHub Migration 013: Update Student ID Format
-- ============================================================
-- Updates the `parse_student_id` function to support the exact
-- format used by TCET: YY-DEPTROLL-YY (e.g., 25-ITC61-29).
-- ============================================================

CREATE OR REPLACE FUNCTION parse_student_id(p_student_id TEXT)
RETURNS TABLE(batch INTEGER, dept public.department_code, roll INTEGER)
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_parts   TEXT[];
  v_batch   INTEGER;
  v_dept    TEXT;
  v_roll    INTEGER;
  v_valid_depts TEXT[] := ARRAY['ITC','CE','EXTC','ME','CSE','AI','EE'];
  v_dept_roll TEXT;
BEGIN
  -- Validate format: YY-DEPTROLL-YY (e.g., 25-ITC61-29)
  IF p_student_id !~ '^\d{2}-[A-Z]{2,4}\d{1,3}-\d{2}$' THEN
    RAISE EXCEPTION 'Invalid student ID format: %. Expected format: YY-DEPTROLL-YY (e.g. 25-ITC61-29)', p_student_id;
  END IF;

  v_parts := string_to_array(p_student_id, '-');
  v_batch := 2000 + v_parts[1]::INTEGER;
  v_dept_roll := v_parts[2];
  
  -- Extract department code (letters only)
  v_dept := substring(v_dept_roll from '^[A-Z]+');
  -- Extract roll number (digits only)
  v_roll := substring(v_dept_roll from '\d+$')::INTEGER;

  -- Validate department code against known list
  IF NOT (v_dept = ANY(v_valid_depts)) THEN
    RAISE EXCEPTION 'Invalid department code: %. Valid codes: ITC, CE, EXTC, ME, CSE, AI, EE', v_dept;
  END IF;

  -- Validate roll number range
  IF v_roll < 1 OR v_roll > 999 THEN
    RAISE EXCEPTION 'Invalid roll number: %. Must be between 1 and 999', v_roll;
  END IF;

  RETURN QUERY SELECT v_batch, v_dept::public.department_code, v_roll;
END;
$$;
