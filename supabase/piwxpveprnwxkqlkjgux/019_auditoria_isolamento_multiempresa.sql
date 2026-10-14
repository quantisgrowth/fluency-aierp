-- Diagnostico somente leitura para o projeto piwxpveprnwxkqlkjgux.
-- Este arquivo nao altera dados nem estrutura. Execute no SQL Editor do Supabase
-- antes da proxima migracao de isolamento por escola e unidade.

-- 1. Inventario das tabelas expostas e situacao do RLS.
SELECT
  'rls' AS secao,
  n.nspname AS schema_name,
  c.relname AS objeto,
  CASE WHEN c.relrowsecurity THEN 'OK' ELSE 'SEM_RLS' END AS status,
  jsonb_build_object(
    'rls_habilitado', c.relrowsecurity,
    'rls_forcado', c.relforcerowsecurity,
    'politicas', count(p.policyname)
  ) AS detalhes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = n.nspname
 AND p.tablename = c.relname
WHERE n.nspname IN ('public', 'storage')
  AND c.relkind IN ('r', 'p')
  AND (n.nspname = 'public' OR c.relname = 'objects')
GROUP BY n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY
  CASE WHEN c.relrowsecurity AND count(p.policyname) > 0 THEN 1 ELSE 0 END,
  n.nspname,
  c.relname;

-- 2. Cobertura de escola e unidade nas tabelas operacionais.
WITH tabelas AS (
  SELECT c.table_name
  FROM information_schema.tables c
  WHERE c.table_schema = 'public'
    AND c.table_type = 'BASE TABLE'
), colunas AS (
  SELECT
    table_name,
    bool_or(column_name = 'escola_id') AS tem_escola_id,
    bool_or(column_name = 'unidade_id') AS tem_unidade_id
  FROM information_schema.columns
  WHERE table_schema = 'public'
  GROUP BY table_name
)
SELECT
  'escopo' AS secao,
  t.table_name AS objeto,
  CASE
    WHEN t.table_name IN (
      'escolas', 'platform_admins', 'modulos_catalogo', 'planos_catalogo',
      'plano_modulos', 'plano_versoes', 'cupons_desconto', 'cupom_planos'
    ) THEN 'GLOBAL_OU_RAIZ'
    WHEN coalesce(c.tem_escola_id, false) THEN 'OK_ESCOLA'
    ELSE 'REVISAR_SEM_ESCOLA'
  END AS status,
  jsonb_build_object(
    'tem_escola_id', coalesce(c.tem_escola_id, false),
    'tem_unidade_id', coalesce(c.tem_unidade_id, false)
  ) AS detalhes
FROM tabelas t
LEFT JOIN colunas c USING (table_name)
ORDER BY status DESC, objeto;

-- 3. Politicas efetivas. Ajuda a identificar operacoes liberadas sem filtro.
SELECT
  'politicas' AS secao,
  schemaname || '.' || tablename AS objeto,
  policyname AS politica,
  cmd AS operacao,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression,
  CASE
    WHEN coalesce(qual, '') ~* '^\s*true\s*$'
      OR coalesce(with_check, '') ~* '^\s*true\s*$'
      THEN 'REVISAR_TRUE'
    WHEN cmd IN ('INSERT', 'UPDATE', 'ALL') AND with_check IS NULL
      THEN 'REVISAR_WITH_CHECK'
    ELSE 'OK_ESTRUTURAL'
  END AS status
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- 4. Funcoes SECURITY DEFINER: devem ter search_path fixo e privilegios minimos.
SELECT
  'security_definer' AS secao,
  n.nspname || '.' || p.proname AS objeto,
  CASE
    WHEN NOT p.prosecdef THEN 'IGNORAR'
    WHEN coalesce(array_to_string(p.proconfig, ','), '') NOT ILIKE '%search_path=%'
      THEN 'REVISAR_SEARCH_PATH'
    WHEN has_function_privilege('anon', p.oid, 'EXECUTE')
      THEN 'REVISAR_ANON_EXECUTE'
    ELSE 'OK_ESTRUTURAL'
  END AS status,
  jsonb_build_object(
    'config', p.proconfig,
    'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
    'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) AS detalhes
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'private')
  AND p.prosecdef
ORDER BY status DESC, objeto;

-- 5. Views expostas devem executar com os direitos do chamador.
SELECT
  'views' AS secao,
  n.nspname || '.' || c.relname AS objeto,
  CASE
    WHEN coalesce(array_to_string(c.reloptions, ','), '') ILIKE '%security_invoker=true%'
      THEN 'OK'
    ELSE 'REVISAR_SECURITY_INVOKER'
  END AS status,
  c.reloptions AS detalhes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('v', 'm')
ORDER BY status DESC, objeto;

-- 6. Associacoes ambiguas. Um usuario com mais de uma escola ativa exige
-- seletor explicito; a aplicacao nao pode escolher LIMIT 1.
SELECT
  'membros_multiescola' AS secao,
  user_id AS objeto,
  'EXIGE_SELETOR_EXPLICITO' AS status,
  jsonb_build_object(
    'escolas_ativas', count(*),
    'escola_ids', jsonb_agg(escola_id ORDER BY escola_id)
  ) AS detalhes
FROM public.escola_membros
WHERE status = 'ativo'
GROUP BY user_id
HAVING count(*) > 1
ORDER BY count(*) DESC;

-- 7. Integridade dos vinculos entre escola, membro e unidade.
SELECT
  'vinculos_unidade' AS secao,
  emu.escola_membro_id AS objeto,
  'VINCULO_INCONSISTENTE' AS status,
  jsonb_build_object(
    'escola_vinculo', emu.escola_id,
    'escola_membro', em.escola_id,
    'unidade_id', emu.unidade_id,
    'escola_unidade', u.escola_id
  ) AS detalhes
FROM public.escola_membro_unidades emu
LEFT JOIN public.escola_membros em ON em.id = emu.escola_membro_id
LEFT JOIN public.unidades u ON u.id = emu.unidade_id
WHERE em.id IS NULL
   OR u.id IS NULL
   OR emu.escola_id IS DISTINCT FROM em.escola_id
   OR emu.escola_id IS DISTINCT FROM u.escola_id;

-- 8. Buckets e politicas de Storage. O prefixo esperado para documentos de
-- curso e <escola_id>/<curso_id>/arquivo.
SELECT
  'storage' AS secao,
  b.id AS objeto,
  CASE
    WHEN b.public THEN 'REVISAR_BUCKET_PUBLICO'
    WHEN count(p.policyname) = 0 THEN 'REVISAR_SEM_POLITICA'
    ELSE 'OK_ESTRUTURAL'
  END AS status,
  jsonb_build_object(
    'publico', b.public,
    'limite_bytes', b.file_size_limit,
    'politicas', count(p.policyname)
  ) AS detalhes
FROM storage.buckets b
LEFT JOIN pg_policies p
  ON p.schemaname = 'storage'
 AND p.tablename = 'objects'
 AND (coalesce(p.qual, '') ILIKE '%' || b.id || '%'
   OR coalesce(p.with_check, '') ILIKE '%' || b.id || '%')
GROUP BY b.id, b.public, b.file_size_limit
ORDER BY status DESC, objeto;
