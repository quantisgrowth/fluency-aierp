-- Target: piwxpveprnwxkqlkjgux. Requires 010_catalogo_planos_modulos.sql.
-- Remove o vínculo de uma conta com uma escola sem apagar a conta Auth ou o acesso Master.
BEGIN;

CREATE FUNCTION public.master_remove_school_member(
  _school_id uuid,
  _member_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_member public.escola_membros;
  v_profile jsonb;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','suporte']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;

  SELECT * INTO v_member
  FROM public.escola_membros
  WHERE id = _member_id AND escola_id = _school_id
  FOR UPDATE;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'Usuário da escola não encontrado';
  END IF;

  SELECT to_jsonb(usuario) INTO v_profile
  FROM public.usuarios AS usuario
  WHERE usuario.escola_id = _school_id
    AND usuario.auth_user_id = v_member.user_id;

  DELETE FROM public.usuarios
  WHERE escola_id = _school_id AND auth_user_id = v_member.user_id;
  DELETE FROM public.escola_membros WHERE id = _member_id;

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    before_data, metadata
  ) VALUES (
    _school_id, auth.uid(), 'plataforma', 'member.removed', 'escola_membro',
    _member_id::text, to_jsonb(v_member),
    jsonb_build_object(
      'removed_user_id', v_member.user_id,
      'profile', COALESCE(v_profile, '{}'::jsonb),
      'auth_account_preserved', true
    )
  );

  RETURN _member_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.master_remove_school_member(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_remove_school_member(uuid,uuid) TO authenticated;

COMMIT;
