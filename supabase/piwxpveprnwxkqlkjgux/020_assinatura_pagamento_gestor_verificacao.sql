-- Execute após 020_assinatura_pagamento_gestor.sql.
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'contratos_escola'
  AND column_name IN ('forma_pagamento', 'pagamento_resumo')
ORDER BY column_name;

SELECT
  p.proname AS funcao,
  p.prosecdef AS security_definer,
  p.proconfig AS configuracao,
  has_function_privilege(
    'authenticated',
    p.oid,
    'EXECUTE'
  ) AS authenticated_executa
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'master_set_contract_payment';
