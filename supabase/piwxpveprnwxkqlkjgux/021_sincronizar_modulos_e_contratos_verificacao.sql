SELECT
  e.nome AS escola,
  c.plano_id,
  c.status AS contrato_status,
  c.mrr,
  mc.nome AS modulo,
  COALESCE(em.status,'sem_registro') AS status_modulo,
  em.origem,
  COALESCE(pm.incluido,false) AS incluido_no_plano,
  cm.valor_mensal AS valor_adicional,
  CASE
    WHEN pm.incluido AND c.status = 'trial' AND em.status = 'trial' THEN 'OK: incluido no trial'
    WHEN pm.incluido AND mc.requer_configuracao AND em.status = 'disponivel' THEN 'OK: requer configuracao'
    WHEN pm.incluido AND em.status IN ('ativo','cortesia') THEN 'OK: incluido no plano'
    WHEN NOT COALESCE(pm.incluido,false) AND em.status IN ('ativo','trial','cortesia') AND cm.modulo_id IS NOT NULL
      THEN 'OK: adicional contratado'
    WHEN NOT COALESCE(pm.incluido,false) AND COALESCE(em.status,'disponivel') = 'disponivel'
      THEN 'OK: disponivel para contratacao'
    ELSE 'REVISAR'
  END AS diagnostico
FROM public.escolas e
JOIN public.contratos_escola c ON c.escola_id = e.id
CROSS JOIN public.modulos_catalogo mc
LEFT JOIN public.escola_modulos em ON em.escola_id = e.id AND em.modulo_id = mc.id
LEFT JOIN public.plano_modulos pm ON pm.plano_id = c.plano_id AND pm.modulo_id = mc.id
LEFT JOIN public.contrato_modulos cm ON cm.contrato_id = c.id AND cm.modulo_id = mc.id
WHERE mc.ativo
ORDER BY e.nome, mc.ordem;
