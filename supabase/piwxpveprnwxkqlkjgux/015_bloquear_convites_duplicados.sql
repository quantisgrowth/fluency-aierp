CREATE OR REPLACE FUNCTION public.master_create_school_invite_existing(
  _school_id uuid,
  _name text,
  _email text,
  _role text,
  _unit_ids uuid[],
  _token_hash text,
  _expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_invite_id uuid := gen_random_uuid();
  v_email text := pg_catalog.lower(pg_catalog.btrim(_email));
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','comercial','suporte']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.escolas WHERE id = _school_id) THEN
    RAISE EXCEPTION 'Escola não encontrada';
  END IF;
  IF _role NOT IN ('gestor','secretaria','financeiro','pedagogico','comercial','professor','aluno','responsavel')
    OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Dados do convite inválidos';
  END IF;
  IF _expires_at <= now() OR _expires_at > now() + interval '30 days' THEN
    RAISE EXCEPTION 'Validade do convite inválida';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE escola_id = _school_id
      AND pg_catalog.lower(email) = v_email
      AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Este e-mail já possui acesso ativo a esta escola';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.convites_acesso
    WHERE escola_id = _school_id
      AND pg_catalog.lower(email) = v_email
      AND status = 'pendente'
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Já existe um convite pendente para este e-mail';
  END IF;

  INSERT INTO public.convites_acesso (
    id, escola_id, email, nome, papel, convidado_por, expires_at
  ) VALUES (
    v_invite_id, _school_id, v_email, NULLIF(pg_catalog.btrim(_name), ''),
    _role, auth.uid(), _expires_at
  );
  INSERT INTO private.convite_tokens (convite_id, token_hash)
  VALUES (v_invite_id, _token_hash);

  IF COALESCE(array_length(_unit_ids, 1), 0) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM unnest(_unit_ids) AS requested(id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.unidades
        WHERE unidades.id = requested.id AND unidades.escola_id = _school_id
      )
    ) THEN
      RAISE EXCEPTION 'Uma das unidades não pertence à escola';
    END IF;
    INSERT INTO public.convite_unidades (convite_id, escola_id, unidade_id)
    SELECT v_invite_id, _school_id, id FROM unnest(_unit_ids) AS selected(id);
  END IF;

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id, metadata
  ) VALUES (
    _school_id, auth.uid(), 'plataforma', 'invite.created', 'convite',
    v_invite_id::text, jsonb_build_object('email', v_email, 'papel', _role)
  );
  RETURN v_invite_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.master_create_school_invite_existing(uuid,text,text,text,uuid[],text,timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_create_school_invite_existing(uuid,text,text,text,uuid[],text,timestamptz)
  TO authenticated;
