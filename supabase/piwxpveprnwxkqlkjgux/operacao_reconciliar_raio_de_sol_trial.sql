-- Remove adicionais nao contratados da Raio de Sol e mantem os modulos do trial.
BEGIN;

DO $preflight$
DECLARE
  v_school_count integer;
  v_plan_id text;
BEGIN
  SELECT count(*), min(COALESCE(c.plano_id, e.plano))
  INTO v_school_count, v_plan_id
  FROM public.escolas e
  LEFT JOIN public.contratos_escola c ON c.escola_id = e.id
  WHERE lower(e.nome) = lower('Raio de Sol');

  IF v_school_count <> 1 THEN
    RAISE EXCEPTION 'Esperada exatamente uma escola chamada Raio de Sol; encontradas: %', v_school_count;
  END IF;
  IF v_plan_id <> 'trial' THEN
    RAISE EXCEPTION 'A Raio de Sol nao esta no plano trial; plano atual: %', v_plan_id;
  END IF;
END;
$preflight$;

WITH school AS (
  SELECT e.id, COALESCE(c.plano_id, e.plano) AS plano_id
  FROM public.escolas e
  LEFT JOIN public.contratos_escola c ON c.escola_id = e.id
  WHERE lower(e.nome) = lower('Raio de Sol')
), expected AS (
  SELECT s.id AS escola_id, mc.id AS modulo_id, mc.requer_configuracao,
         COALESCE(pm.incluido,false) AS incluido,
         COALESCE(pm.preco_adicional,mc.preco_base,0) AS preco_adicional
  FROM school s
  CROSS JOIN public.modulos_catalogo mc
  LEFT JOIN public.plano_modulos pm
    ON pm.plano_id = s.plano_id AND pm.modulo_id = mc.id
  WHERE mc.ativo
)
UPDATE public.escola_modulos em
SET status = CASE
      WHEN expected.incluido AND expected.requer_configuracao THEN 'disponivel'
      WHEN expected.incluido THEN 'trial'
      ELSE 'disponivel'
    END,
    origem = 'plano',
    preco_contratado = CASE WHEN expected.incluido THEN 0 ELSE expected.preco_adicional END,
    desconto = 0,
    inicio_em = CASE WHEN expected.incluido AND NOT expected.requer_configuracao THEN COALESCE(em.inicio_em,now()) ELSE NULL END,
    fim_em = NULL,
    updated_at = now()
FROM expected
WHERE em.escola_id = expected.escola_id AND em.modulo_id = expected.modulo_id;

DELETE FROM public.contrato_modulos cm
USING public.contratos_escola c, public.escolas e
WHERE cm.contrato_id = c.id
  AND c.escola_id = e.id
  AND lower(e.nome) = lower('Raio de Sol');

INSERT INTO public.contrato_modulos (contrato_id,modulo_id,incluido_no_plano,valor_mensal)
SELECT c.id, em.modulo_id, true, 0
FROM public.contratos_escola c
JOIN public.escolas e ON e.id = c.escola_id
JOIN public.escola_modulos em ON em.escola_id = e.id
JOIN public.plano_modulos pm
  ON pm.plano_id = c.plano_id AND pm.modulo_id = em.modulo_id AND pm.incluido
WHERE lower(e.nome) = lower('Raio de Sol')
  AND em.status IN ('trial','ativo','cortesia');

SELECT private.refresh_school_contract_totals(
  (SELECT id FROM public.escolas WHERE lower(nome) = lower('Raio de Sol'))
);

COMMIT;

SELECT e.nome AS escola, c.plano_id, mc.nome AS modulo, em.status, em.origem,
       COALESCE(pm.incluido,false) AS incluido_no_plano, c.mrr
FROM public.escolas e
JOIN public.contratos_escola c ON c.escola_id = e.id
JOIN public.escola_modulos em ON em.escola_id = e.id
JOIN public.modulos_catalogo mc ON mc.id = em.modulo_id
LEFT JOIN public.plano_modulos pm ON pm.plano_id = c.plano_id AND pm.modulo_id = em.modulo_id
WHERE lower(e.nome) = lower('Raio de Sol')
ORDER BY mc.ordem;
