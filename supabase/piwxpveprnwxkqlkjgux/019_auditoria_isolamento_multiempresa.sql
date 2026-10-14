-- Diagnostico somente leitura para o projeto piwxpveprnwxkqlkjgux.
-- Retorna uma unica grade para facilitar a exportacao no SQL Editor.
-- Nao altera dados nem estrutura.

WITH
rls_check AS (
  SELECT '01_RLS'::text AS secao, n.nspname || '.' || c.relname AS objeto,
    CASE WHEN c.relrowsecurity AND count(p.policyname) > 0 THEN 'OK'
      WHEN NOT c.relrowsecurity THEN 'CRITICO_SEM_RLS'
      ELSE 'CRITICO_SEM_POLITICA' END AS status,
    jsonb_build_object('rls_habilitado', c.relrowsecurity,
      'rls_forcado', c.relforcerowsecurity, 'politicas', count(p.policyname)) AS detalhes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
  WHERE n.nspname IN ('public', 'storage') AND c.relkind IN ('r', 'p')
    AND (n.nspname = 'public' OR c.relname = 'objects')
  GROUP BY n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
),
column_scope AS (
  SELECT table_name, bool_or(column_name = 'escola_id') AS tem_escola_id,
    bool_or(column_name = 'unidade_id') AS tem_unidade_id
  FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name
),
scope_check AS (
  SELECT '02_ESCOPO'::text AS secao, t.table_name::text AS objeto,
    CASE WHEN t.table_name IN (
      'escolas', 'platform_admins', 'modulos_catalogo', 'planos_catalogo',
      'plano_modulos', 'plano_versoes', 'cupons_desconto', 'cupom_planos',
      'profiles', 'user_roles', 'contrato_modulos', 'contrato_versoes'
    ) THEN 'GLOBAL_OU_RAIZ'
    WHEN coalesce(c.tem_escola_id, false) THEN 'OK_ESCOLA'
    ELSE 'REVISAR_SEM_ESCOLA' END AS status,
    jsonb_build_object('tem_escola_id', coalesce(c.tem_escola_id, false),
      'tem_unidade_id', coalesce(c.tem_unidade_id, false)) AS detalhes
  FROM information_schema.tables t LEFT JOIN column_scope c USING (table_name)
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
),
policy_check AS (
  SELECT '03_POLITICAS'::text AS secao,
    schemaname || '.' || tablename || '.' || policyname AS objeto,
    CASE WHEN tablename IN ('modulos_catalogo', 'planos_catalogo', 'plano_modulos')
      AND cmd = 'SELECT' AND coalesce(qual, '') ~* '^[[:space:]]*true[[:space:]]*$'
      THEN 'GLOBAL_CATALOGO_AUTENTICADO'
    WHEN coalesce(qual, '') ~* '^[[:space:]]*true[[:space:]]*$'
      OR coalesce(with_check, '') ~* '^[[:space:]]*true[[:space:]]*$' THEN 'REVISAR_TRUE'
    WHEN cmd IN ('INSERT', 'UPDATE', 'ALL') AND with_check IS NULL
      THEN 'REVISAR_WITH_CHECK' ELSE 'OK_ESTRUTURAL' END AS status,
    jsonb_build_object('operacao', cmd, 'roles', to_jsonb(roles),
      'using', qual, 'with_check', with_check) AS detalhes
  FROM pg_policies WHERE schemaname IN ('public', 'storage')
),
definer_check AS (
  SELECT '04_SECURITY_DEFINER'::text AS secao,
    n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS objeto,
    CASE WHEN coalesce(array_to_string(p.proconfig, ','), '') NOT ILIKE '%search_path=%'
      THEN 'CRITICO_SEARCH_PATH'
    WHEN has_function_privilege('anon', p.oid, 'EXECUTE') THEN 'REVISAR_ANON_EXECUTE'
    ELSE 'OK_ESTRUTURAL' END AS status,
    jsonb_build_object('config', to_jsonb(p.proconfig),
      'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS detalhes
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private') AND p.prosecdef
),
view_check AS (
  SELECT '05_VIEWS'::text AS secao, n.nspname || '.' || c.relname AS objeto,
    CASE WHEN coalesce(array_to_string(c.reloptions, ','), '') ILIKE '%security_invoker=true%'
      THEN 'OK' ELSE 'REVISAR_SECURITY_INVOKER' END AS status,
    jsonb_build_object('opcoes', to_jsonb(c.reloptions)) AS detalhes
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')
),
multischool_check AS (
  SELECT '06_MEMBROS_MULTIEMPRESA'::text AS secao, user_id::text AS objeto,
    'EXIGE_SELETOR_EXPLICITO'::text AS status,
    jsonb_build_object('escolas_ativas', count(*),
      'escola_ids', jsonb_agg(escola_id ORDER BY escola_id)) AS detalhes
  FROM public.escola_membros WHERE status = 'ativo'
  GROUP BY user_id HAVING count(*) > 1
),
unit_link_check AS (
  SELECT '07_VINCULOS_UNIDADE'::text AS secao, emu.escola_membro_id::text AS objeto,
    'CRITICO_VINCULO_INCONSISTENTE'::text AS status,
    jsonb_build_object('escola_vinculo', emu.escola_id, 'escola_membro', em.escola_id,
      'unidade_id', emu.unidade_id, 'escola_unidade', u.escola_id) AS detalhes
  FROM public.escola_membro_unidades emu
  LEFT JOIN public.escola_membros em ON em.id = emu.escola_membro_id
  LEFT JOIN public.unidades u ON u.id = emu.unidade_id
  WHERE em.id IS NULL OR u.id IS NULL OR emu.escola_id IS DISTINCT FROM em.escola_id
    OR emu.escola_id IS DISTINCT FROM u.escola_id
),
storage_check AS (
  SELECT '08_STORAGE'::text AS secao, b.id::text AS objeto,
    CASE WHEN b.public THEN 'CRITICO_BUCKET_PUBLICO'
      WHEN count(p.policyname) = 0 THEN 'CRITICO_SEM_POLITICA' ELSE 'OK' END AS status,
    jsonb_build_object('publico', b.public, 'limite_bytes', b.file_size_limit,
      'politicas', count(p.policyname)) AS detalhes
  FROM storage.buckets b
  LEFT JOIN pg_policies p ON p.schemaname = 'storage' AND p.tablename = 'objects'
    AND (coalesce(p.qual, '') ILIKE '%' || b.id || '%'
      OR coalesce(p.with_check, '') ILIKE '%' || b.id || '%')
  GROUP BY b.id, b.public, b.file_size_limit
),
all_checks AS (
  SELECT * FROM rls_check UNION ALL SELECT * FROM scope_check
  UNION ALL SELECT * FROM policy_check UNION ALL SELECT * FROM definer_check
  UNION ALL SELECT * FROM view_check UNION ALL SELECT * FROM multischool_check
  UNION ALL SELECT * FROM unit_link_check UNION ALL SELECT * FROM storage_check
)
SELECT secao, objeto, status, detalhes FROM all_checks
ORDER BY CASE WHEN status LIKE 'CRITICO%' THEN 1
  WHEN status LIKE 'REVISAR%' OR status LIKE 'EXIGE%' THEN 2
  WHEN status IN ('GLOBAL_OU_RAIZ', 'GLOBAL_CATALOGO_AUTENTICADO') THEN 3 ELSE 4 END,
  secao, objeto;
