SELECT *
FROM (VALUES
  ('tabela', 'salas', to_regclass('public.salas') IS NOT NULL),
  ('tabela', 'turma_encontros', to_regclass('public.turma_encontros') IS NOT NULL),
  ('coluna', 'turmas.sala_id', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'turmas' AND column_name = 'sala_id'
  )),
  ('rls', 'salas', COALESCE((
    SELECT relrowsecurity FROM pg_class
    WHERE oid = to_regclass('public.salas')
  ), false)),
  ('rls', 'turma_encontros', COALESCE((
    SELECT relrowsecurity FROM pg_class
    WHERE oid = to_regclass('public.turma_encontros')
  ), false)),
  ('policy', 'usuarios_staff_insert', EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'usuarios'
      AND policyname = 'usuarios_staff_insert'
  ))
) AS checks(tipo,nome,ok)
ORDER BY tipo,nome;
