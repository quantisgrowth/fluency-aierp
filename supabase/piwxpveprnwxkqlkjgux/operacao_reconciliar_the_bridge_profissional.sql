-- Operação de dados para o cenário confirmado pelo responsável da conta.
-- Mantém ativos somente os módulos incluídos no plano atual da The Bridge.
BEGIN;

DO $preflight$
DECLARE
  v_school_count integer;
  v_plan_id text;
BEGIN
  SELECT count(*), min(plano)
  INTO v_school_count, v_plan_id
  FROM public.escolas
  WHERE lower(nome) = lower('The Bridge');

  IF v_school_count <> 1 THEN
    RAISE EXCEPTION 'Esperada exatamente uma escola chamada The Bridge; encontradas: %',
      v_school_count;
  END IF;
  IF v_plan_id <> 'profissional' THEN
    RAISE EXCEPTION 'A The Bridge não está no plano profissional; plano atual: %', v_plan_id;
  END IF;
END;
$preflight$;

WITH school AS (
  SELECT id, plano
  FROM public.escolas
  WHERE lower(nome) = lower('The Bridge')
),
expected AS (
  SELECT
    school.id AS escola_id,
    module.id AS modulo_id,
    module.requer_configuracao,
    link.incluido,
    COALESCE(link.preco_adicional, module.preco_base) AS preco_adicional
  FROM school
  JOIN public.modulos_catalogo module ON module.ativo
  JOIN public.plano_modulos link
    ON link.plano_id = school.plano
   AND link.modulo_id = module.id
)
UPDATE public.escola_modulos school_module
SET status = CASE
      WHEN expected.incluido AND expected.requer_configuracao THEN 'disponivel'
      WHEN expected.incluido THEN 'ativo'
      ELSE 'disponivel'
    END,
    preco_contratado = CASE
      WHEN expected.incluido THEN 0
      ELSE expected.preco_adicional
    END,
    desconto = 0,
    origem = 'plano',
    inicio_em = CASE
      WHEN expected.incluido AND NOT expected.requer_configuracao
        THEN COALESCE(school_module.inicio_em, now())
      ELSE NULL
    END,
    fim_em = NULL,
    updated_at = now()
FROM expected
WHERE school_module.escola_id = expected.escola_id
  AND school_module.modulo_id = expected.modulo_id;

DELETE FROM public.contrato_modulos contract_module
USING public.contratos_escola contract, public.escolas school
WHERE contract_module.contrato_id = contract.id
  AND contract.escola_id = school.id
  AND lower(school.nome) = lower('The Bridge');

INSERT INTO public.contrato_modulos (
  contrato_id, modulo_id, incluido_no_plano, valor_mensal
)
SELECT
  contract.id,
  school_module.modulo_id,
  plan_module.incluido,
  CASE WHEN plan_module.incluido THEN 0 ELSE school_module.preco_contratado END
FROM public.contratos_escola contract
JOIN public.escolas school ON school.id = contract.escola_id
JOIN public.escola_modulos school_module ON school_module.escola_id = school.id
JOIN public.plano_modulos plan_module
  ON plan_module.plano_id = contract.plano_id
 AND plan_module.modulo_id = school_module.modulo_id
WHERE lower(school.nome) = lower('The Bridge')
  AND school_module.status IN ('trial','ativo','cortesia');

COMMIT;

SELECT
  school.nome AS escola,
  contract.plano_id,
  catalog.nome AS modulo,
  school_module.status,
  school_module.origem,
  plan_module.incluido AS incluido_no_plano
FROM public.escolas school
JOIN public.contratos_escola contract ON contract.escola_id = school.id
JOIN public.escola_modulos school_module ON school_module.escola_id = school.id
JOIN public.modulos_catalogo catalog ON catalog.id = school_module.modulo_id
JOIN public.plano_modulos plan_module
  ON plan_module.plano_id = contract.plano_id
 AND plan_module.modulo_id = school_module.modulo_id
WHERE lower(school.nome) = lower('The Bridge')
ORDER BY catalog.ordem;
