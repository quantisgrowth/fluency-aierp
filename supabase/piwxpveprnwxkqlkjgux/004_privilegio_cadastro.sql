-- Target: piwxpveprnwxkqlkjgux. Requires 003.
-- Keep the privileged implementation outside exposed API schemas.
BEGIN;

ALTER FUNCTION public.create_trial_school(text,text) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.create_trial_school(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.create_trial_school(text,text) TO authenticated;

CREATE FUNCTION public.create_trial_school(_school_name text, _manager_name text)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  SELECT private.create_trial_school(_school_name, _manager_name);
$$;
REVOKE ALL ON FUNCTION public.create_trial_school(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_trial_school(text,text) TO authenticated;

COMMIT;
