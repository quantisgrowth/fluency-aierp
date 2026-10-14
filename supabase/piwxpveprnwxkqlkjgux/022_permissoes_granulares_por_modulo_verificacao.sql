SELECT
  e.nome AS escola,
  u.nome AS colaborador,
  u.role,
  permission.key AS modulo_id,
  permission.value::boolean AS permitido,
  COALESCE(em.status,'sem_registro') AS status_modulo,
  CASE
    WHEN permission.value::boolean = false THEN 'OK: sem acesso'
    WHEN em.status IN ('trial','ativo','cortesia') THEN 'OK: acesso permitido'
    ELSE 'REVISAR: permissao para modulo inativo'
  END AS diagnostico
FROM public.usuarios u
JOIN public.escolas e ON e.id = u.escola_id
CROSS JOIN LATERAL jsonb_each_text(u.permissoes_modulos) permission
LEFT JOIN public.escola_modulos em
  ON em.escola_id = u.escola_id AND em.modulo_id = permission.key
ORDER BY e.nome,u.nome,permission.key;

SELECT
  routine_schema,
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema IN ('public','private')
  AND routine_name IN ('school_set_user_module_permissions','has_module_permission')
ORDER BY routine_schema,routine_name;
