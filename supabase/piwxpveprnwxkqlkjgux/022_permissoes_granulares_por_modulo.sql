-- Permissoes individuais por modulo, vinculadas ao usuario e a escola.
-- Target: piwxpveprnwxkqlkjgux. Requires 021_sincronizar_modulos_e_contratos.sql.
BEGIN;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS permissoes_modulos jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_permissoes_modulos_objeto;
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_permissoes_modulos_objeto
  CHECK (jsonb_typeof(permissoes_modulos) = 'object');

UPDATE public.usuarios u
SET permissoes_modulos = (
  SELECT COALESCE(jsonb_object_agg(mc.id,
    CASE
      WHEN u.role IN ('gestor','admin','superadmin') THEN true
      WHEN u.role IN ('secretaria','financeiro') AND mc.id IN ('core','financeiro','crm','captacao','portal_aluno') THEN true
      WHEN u.role = 'comercial' AND mc.id IN ('crm','captacao') THEN true
      WHEN u.role = 'pedagogico' AND mc.id IN ('core','success','captacao','portal_aluno') THEN true
      WHEN u.role = 'professor' AND mc.id IN ('core','portal_aluno') THEN true
      ELSE false
    END
  ), '{}'::jsonb)
  FROM public.modulos_catalogo mc
  WHERE mc.ativo
)
WHERE u.permissoes_modulos = '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.school_set_user_module_permissions(
  _school_id uuid,
  _user_id uuid,
  _permissions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_before jsonb;
  v_normalized jsonb;
BEGIN
  IF NOT private.is_member(_school_id, ARRAY['gestor']) THEN
    RAISE EXCEPTION 'Apenas o gestor pode alterar permissoes de colaboradores';
  END IF;
  IF jsonb_typeof(_permissions) <> 'object' THEN
    RAISE EXCEPTION 'Permissoes invalidas';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(_permissions) key
    WHERE NOT EXISTS (SELECT 1 FROM public.modulos_catalogo mc WHERE mc.id = key)
  ) THEN
    RAISE EXCEPTION 'Permissao contem modulo desconhecido';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_each_text(_permissions) item
    WHERE item.value NOT IN ('true','false')
  ) THEN
    RAISE EXCEPTION 'Cada permissao deve ser verdadeira ou falsa';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_each_text(_permissions) item
    WHERE item.value = 'true'
      AND NOT private.is_module_active(_school_id, item.key)
  ) THEN
    RAISE EXCEPTION 'Nao e permitido conceder um modulo inativo no contrato da escola';
  END IF;

  SELECT permissoes_modulos INTO v_before
  FROM public.usuarios
  WHERE id = _user_id AND escola_id = _school_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Colaborador nao encontrado nesta escola'; END IF;

  SELECT COALESCE(jsonb_object_agg(mc.id, COALESCE((_permissions->>mc.id)::boolean,false)), '{}'::jsonb)
  INTO v_normalized
  FROM public.modulos_catalogo mc
  WHERE mc.ativo;

  UPDATE public.usuarios
  SET permissoes_modulos = v_normalized, updated_at = now()
  WHERE id = _user_id AND escola_id = _school_id;

  INSERT INTO public.audit_logs (
    escola_id,actor_user_id,actor_kind,action,resource_type,resource_id,before_data,after_data
  ) VALUES (
    _school_id,auth.uid(),'usuario','user.module_permissions_changed','usuario',_user_id::text,
    jsonb_build_object('permissoes_modulos',v_before),
    jsonb_build_object('permissoes_modulos',v_normalized)
  );
  RETURN v_normalized;
END;
$function$;

CREATE OR REPLACE FUNCTION private.has_module_permission(_school_id uuid, _module_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_module_active(_school_id,_module_id)
    AND EXISTS (
      SELECT 1
      FROM public.escola_membros em
      LEFT JOIN public.usuarios u
        ON u.escola_id = em.escola_id AND u.auth_user_id = em.user_id
      WHERE em.escola_id = _school_id
        AND em.user_id = (SELECT auth.uid())
        AND em.status = 'ativo'
        AND (em.papel = 'gestor' OR COALESCE((u.permissoes_modulos->>_module_id)::boolean,false))
    );
$$;

REVOKE ALL ON FUNCTION public.school_set_user_module_permissions(uuid,uuid,jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.school_set_user_module_permissions(uuid,uuid,jsonb)
  TO authenticated;
REVOKE ALL ON FUNCTION private.has_module_permission(uuid,text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_module_permission(uuid,text) TO authenticated;

COMMIT;
