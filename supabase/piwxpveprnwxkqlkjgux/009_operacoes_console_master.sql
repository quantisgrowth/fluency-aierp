-- Target: piwxpveprnwxkqlkjgux. Requires 008_fundacao_multiempresa.sql.
BEGIN;

CREATE FUNCTION public.master_create_school_invite(
  _school_name text,
  _slug text,
  _plan text,
  _manager_name text,
  _manager_email text,
  _token_hash text,
  _expires_at timestamptz
)
RETURNS TABLE (school_id uuid, invite_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_school_id uuid := gen_random_uuid();
  v_invite_id uuid := gen_random_uuid();
  v_school_name text := pg_catalog.btrim(_school_name);
  v_slug text := pg_catalog.lower(pg_catalog.btrim(_slug));
  v_email text := pg_catalog.lower(pg_catalog.btrim(_manager_email));
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF char_length(v_school_name) NOT BETWEEN 3 AND 120 THEN
    RAISE EXCEPTION 'Nome da escola inválido';
  END IF;
  IF v_slug !~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$' THEN
    RAISE EXCEPTION 'Subdomínio inválido';
  END IF;
  IF _plan NOT IN ('trial','essencial','profissional','enterprise') THEN
    RAISE EXCEPTION 'Plano inválido';
  END IF;
  IF char_length(pg_catalog.btrim(_manager_name)) NOT BETWEEN 3 AND 120
     OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Dados do gestor inválidos';
  END IF;
  IF _expires_at <= now() OR _expires_at > now() + interval '30 days' THEN
    RAISE EXCEPTION 'Validade do convite inválida';
  END IF;

  INSERT INTO public.escolas (id, nome, slug, plano, status, ativa)
  VALUES (v_school_id, v_school_name, v_slug, _plan, 'trial', true);

  INSERT INTO public.unidades (escola_id, nome)
  VALUES (v_school_id, 'Unidade principal');

  INSERT INTO public.convites_acesso (
    id, escola_id, email, nome, papel, convidado_por, expires_at
  ) VALUES (
    v_invite_id, v_school_id, v_email, pg_catalog.btrim(_manager_name),
    'gestor', auth.uid(), _expires_at
  );

  INSERT INTO private.convite_tokens (convite_id, token_hash)
  VALUES (v_invite_id, _token_hash);

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    after_data, metadata
  ) VALUES (
    v_school_id, auth.uid(), 'plataforma', 'school.created', 'escola',
    v_school_id::text,
    jsonb_build_object('nome', v_school_name, 'slug', v_slug, 'plano', _plan),
    jsonb_build_object('invite_id', v_invite_id, 'manager_email', v_email)
  );

  RETURN QUERY SELECT v_school_id, v_invite_id;
END;
$function$;

CREATE FUNCTION public.master_update_school(_school_id uuid, _changes jsonb)
RETURNS public.escolas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_before public.escolas;
  v_after public.escolas;
  v_allowed_keys text[] := ARRAY['nome','slug','plano','status','ativa'];
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial','suporte']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(_changes) AS key
    WHERE NOT (key = ANY(v_allowed_keys))
  ) THEN
    RAISE EXCEPTION 'Alteração contém campos não permitidos';
  END IF;

  SELECT * INTO v_before FROM public.escolas WHERE id = _school_id FOR UPDATE;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'Escola não encontrada'; END IF;

  UPDATE public.escolas
  SET nome = COALESCE(NULLIF(pg_catalog.btrim(_changes->>'nome'), ''), nome),
      slug = COALESCE(NULLIF(pg_catalog.lower(pg_catalog.btrim(_changes->>'slug')), ''), slug),
      plano = COALESCE(NULLIF(_changes->>'plano', ''), plano),
      status = COALESCE(NULLIF(_changes->>'status', ''), status),
      ativa = CASE WHEN _changes ? 'ativa' THEN (_changes->>'ativa')::boolean ELSE ativa END,
      updated_at = now()
  WHERE id = _school_id
  RETURNING * INTO v_after;

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    before_data, after_data
  ) VALUES (
    _school_id, auth.uid(), 'plataforma', 'school.updated', 'escola',
    _school_id::text, to_jsonb(v_before), to_jsonb(v_after)
  );
  RETURN v_after;
END;
$function$;

CREATE FUNCTION public.master_cancel_invite(_invite_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_school_id uuid;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','comercial','suporte']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  UPDATE public.convites_acesso
  SET status = 'cancelado', updated_at = now()
  WHERE id = _invite_id AND status = 'pendente'
  RETURNING escola_id INTO v_school_id;
  IF v_school_id IS NULL THEN RAISE EXCEPTION 'Convite pendente não encontrado'; END IF;

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id
  ) VALUES (
    v_school_id, auth.uid(), 'plataforma', 'invite.cancelled', 'convite', _invite_id::text
  );
  RETURN _invite_id;
END;
$function$;

CREATE FUNCTION public.accept_school_invite(_token_hash text, _display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite public.convites_acesso;
  v_member_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT pg_catalog.lower(email) INTO v_email
  FROM auth.users WHERE id = v_user_id AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar o convite'; END IF;

  SELECT convite.* INTO v_invite
  FROM private.convite_tokens AS token
  JOIN public.convites_acesso AS convite ON convite.id = token.convite_id
  WHERE token.token_hash = _token_hash
  FOR UPDATE OF convite;

  IF v_invite.id IS NULL OR v_invite.status <> 'pendente' OR v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  IF v_invite.email <> v_email THEN RAISE EXCEPTION 'Este convite pertence a outro e-mail'; END IF;

  INSERT INTO public.escola_membros (escola_id, user_id, papel, status)
  VALUES (v_invite.escola_id, v_user_id, v_invite.papel, 'ativo')
  ON CONFLICT (escola_id, user_id)
  DO UPDATE SET papel = EXCLUDED.papel, status = 'ativo', updated_at = now()
  RETURNING id INTO v_member_id;

  INSERT INTO public.usuarios (auth_user_id, escola_id, nome, email, cargo, role, status)
  VALUES (
    v_user_id, v_invite.escola_id,
    COALESCE(NULLIF(pg_catalog.btrim(_display_name), ''), v_invite.nome, v_email),
    v_email, initcap(v_invite.papel), v_invite.papel, 'ativo'
  )
  ON CONFLICT (escola_id, auth_user_id) WHERE auth_user_id IS NOT NULL
  DO UPDATE SET nome = EXCLUDED.nome, role = EXCLUDED.role, status = 'ativo', updated_at = now();

  INSERT INTO public.escola_membro_unidades (escola_membro_id, escola_id, unidade_id)
  SELECT v_member_id, unidade.escola_id, unidade.id
  FROM public.unidades AS unidade WHERE unidade.escola_id = v_invite.escola_id
  ON CONFLICT DO NOTHING;

  UPDATE public.convites_acesso
  SET status = 'aceito', accepted_at = now(), accepted_by = v_user_id, updated_at = now()
  WHERE id = v_invite.id;

  DELETE FROM private.convite_tokens WHERE convite_id = v_invite.id;
  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    metadata
  ) VALUES (
    v_invite.escola_id, v_user_id, 'usuario', 'invite.accepted', 'convite',
    v_invite.id::text, jsonb_build_object('papel', v_invite.papel)
  );
  RETURN v_invite.escola_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.master_create_school_invite(text,text,text,text,text,text,timestamptz)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.master_update_school(uuid,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.master_cancel_invite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_school_invite(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_create_school_invite(text,text,text,text,text,text,timestamptz)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.master_update_school(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.master_cancel_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_school_invite(text,text) TO authenticated;

COMMIT;
