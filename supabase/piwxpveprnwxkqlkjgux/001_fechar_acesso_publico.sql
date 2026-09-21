-- Target: piwxpveprnwxkqlkjgux only.
-- The connected database currently has no rows in public tables and no auth
-- users, but broad PUBLIC/ALL policies plus anon grants expose future data.
-- Apply as a reviewed migration; this script does not delete table data.
BEGIN;

DO $lockdown$
DECLARE
  target_table text;
  policy_count integer;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'escolas', 'usuarios', 'niveis_educacionais', 'cursos', 'turmas',
    'alunos', 'matriculas', 'leads', 'crm_atividades',
    'transacoes_financeiras', 'inventario_materiais'
  ] LOOP
    SELECT count(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = target_table;
    IF policy_count <> 1 OR NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table
        AND policyname = 'Public access for all on ' || target_table
        AND cmd = 'ALL'
        AND qual = 'true'
        AND with_check = 'true'
    ) THEN
      RAISE EXCEPTION 'Unexpected policy state for public.%', target_table;
    END IF;
    EXECUTE format('DROP POLICY %I ON public.%I',
      'Public access for all on ' || target_table, target_table);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
    EXECUTE format(
      'REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      target_table
    );
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', target_table);
  END LOOP;
END;
$lockdown$;

COMMIT;
