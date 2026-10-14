SELECT
  e.nome AS escola,
  u.nome AS colaborador,
  permission.key AS modulo_id,
  permission.value::boolean AS permitido,
  COALESCE(em.status,'sem_registro') AS status_modulo,
  CASE
    WHEN permission.value::boolean = false THEN 'OK: sem acesso'
    WHEN em.status IN ('trial','ativo','cortesia')
      AND (em.fim_em IS NULL OR em.fim_em > now()) THEN 'OK: acesso permitido'
    ELSE 'REVISAR: permissao para modulo inativo'
  END AS diagnostico
FROM public.usuarios u
JOIN public.escolas e ON e.id = u.escola_id
CROSS JOIN LATERAL jsonb_each_text(u.permissoes_modulos) permission
LEFT JOIN public.escola_modulos em
  ON em.escola_id = u.escola_id AND em.modulo_id = permission.key
ORDER BY e.nome,u.nome,permission.key;
