-- ============================================================
-- EduHub Migration 012: Strict Domain Restrictions
-- ============================================================
-- Enforces that ONLY @tcetmumbai.in email addresses can
-- register or exist in the system at the database level.
-- ============================================================

CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email NOT LIKE '%@tcetmumbai.in' THEN
    RAISE EXCEPTION 'Only @tcetmumbai.in accounts are permitted to register.';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if it previously existed
DROP TRIGGER IF EXISTS enforce_email_domain ON auth.users;

-- Re-create the trigger for BEFORE INSERT and BEFORE UPDATE
CREATE TRIGGER enforce_email_domain
BEFORE INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION check_email_domain();
