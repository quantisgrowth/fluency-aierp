-- Target: piwxpveprnwxkqlkjgux. Requires 009_operacoes_console_master.sql.
-- Catálogo compartilhado e habilitação de módulos por escola.
BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.escolas') IS NULL
    OR to_regclass('public.convites_acesso') IS NULL
    OR to_regclass('public.audit_logs') IS NULL THEN
    RAISE EXCEPTION 'Migrações 008 e 009 precisam estar aplicadas antes da 010';
  END IF;
  IF to_regclass('public.modulos_catalogo') IS NOT NULL
    OR to_regclass('public.escola_modulos') IS NOT NULL THEN
    RAISE EXCEPTION 'Migração 010 já iniciada ou aplicada; revisão manual necessária';
  END IF;
END;
$preflight$;

CREATE TABLE public.modulos_catalogo (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9_]{2,40}$'),
  nome text NOT NULL,
  descricao text,
  preco_base numeric(12,2) NOT NULL DEFAULT 0 CHECK (preco_base >= 0),
  requer_configuracao boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  ordem smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.planos_catalogo (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9_]{2,40}$'),
  nome text NOT NULL,
  preco_base numeric(12,2) NOT NULL DEFAULT 0 CHECK (preco_base >= 0),
  limite_alunos integer CHECK (limite_alunos IS NULL OR limite_alunos > 0),
  limite_professores integer CHECK (limite_professores IS NULL OR limite_professores > 0),
  limite_unidades integer CHECK (limite_unidades IS NULL OR limite_unidades > 0),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.plano_modulos (
  plano_id text NOT NULL REFERENCES public.planos_catalogo(id) ON DELETE CASCADE,
  modulo_id text NOT NULL REFERENCES public.modulos_catalogo(id) ON DELETE CASCADE,
  incluido boolean NOT NULL DEFAULT false,
  preco_adicional numeric(12,2) CHECK (preco_adicional IS NULL OR preco_adicional >= 0),
  PRIMARY KEY (plano_id, modulo_id)
);

CREATE TABLE public.escola_modulos (
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  modulo_id text NOT NULL REFERENCES public.modulos_catalogo(id),
  status text NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel','trial','ativo','cortesia','suspenso','cancelado')),
  preco_contratado numeric(12,2) NOT NULL DEFAULT 0 CHECK (preco_contratado >= 0),
  desconto numeric(12,2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  origem text NOT NULL DEFAULT 'plano'
    CHECK (origem IN ('plano','manual','checkout','integracao','migracao')),
  inicio_em timestamptz,
  fim_em timestamptz,
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  atualizado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (escola_id, modulo_id),
  CHECK (desconto <= preco_contratado)
);
CREATE INDEX escola_modulos_status_idx ON public.escola_modulos(escola_id, status);

INSERT INTO public.modulos_catalogo
  (id, nome, descricao, preco_base, requer_configuracao, ordem)
VALUES
  ('core', 'Core Pedagógico', 'Cursos, turmas, alunos, matrículas e professores.', 289, false, 10),
  ('financeiro', 'Financeiro', 'Contas a receber, cobranças e fluxo financeiro.', 189, false, 20),
  ('crm', 'CRM Comercial', 'Leads, funil comercial e conversão de matrículas.', 149, false, 30),
  ('success', 'Retenção e Success', 'Indicadores de risco, acompanhamento e retenção.', 249, false, 40),
  ('captacao', 'Captação e Nivelamento', 'Formulários, testes e entrada de novos leads.', 149, false, 50),
  ('portal_aluno', 'Portal do Aluno', 'Desempenho, tarefas, notas, assiduidade e responsáveis.', 149, false, 60),
  ('asaas', 'Integração ASAAS', 'Cobrança recorrente, Pix, boleto e webhooks.', 99, true, 70),
  ('nota_fiscal', 'Emissão de Nota Fiscal', 'Emissão e acompanhamento fiscal por integração.', 99, true, 80);

INSERT INTO public.planos_catalogo
  (id, nome, preco_base, limite_alunos, limite_professores, limite_unidades)
VALUES
  ('trial', 'Teste gratuito', 0, 100, 20, 1),
  ('essencial', 'Essencial', 289, 150, 20, 1),
  ('profissional', 'Profissional', 587, 500, 80, 3),
  ('enterprise', 'Enterprise', 999, NULL, NULL, NULL);

INSERT INTO public.plano_modulos (plano_id, modulo_id, incluido, preco_adicional)
SELECT plano.id, modulo.id,
  CASE
    WHEN plano.id = 'trial' AND modulo.id NOT IN ('asaas','nota_fiscal') THEN true
    WHEN plano.id = 'essencial' AND modulo.id IN ('core','captacao','portal_aluno') THEN true
    WHEN plano.id = 'profissional' AND modulo.id IN ('core','captacao','portal_aluno','crm','financeiro') THEN true
    WHEN plano.id = 'enterprise' THEN true
    ELSE false
  END,
  modulo.preco_base
FROM public.planos_catalogo AS plano
CROSS JOIN public.modulos_catalogo AS modulo;

CREATE FUNCTION private.initialize_school_modules(_escola_id uuid, _plano text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.escola_modulos (
    escola_id, modulo_id, status, preco_contratado, origem, inicio_em
  )
  SELECT
    _escola_id,
    modulo.id,
    CASE
      WHEN vinculo.incluido AND modulo.requer_configuracao THEN 'disponivel'
      WHEN vinculo.incluido AND _plano = 'trial' THEN 'trial'
      WHEN vinculo.incluido THEN 'ativo'
      ELSE 'disponivel'
    END,
    CASE WHEN vinculo.incluido THEN 0 ELSE COALESCE(vinculo.preco_adicional, modulo.preco_base) END,
    'plano',
    CASE WHEN vinculo.incluido AND NOT modulo.requer_configuracao THEN now() ELSE NULL END
  FROM public.modulos_catalogo AS modulo
  LEFT JOIN public.plano_modulos AS vinculo
    ON vinculo.modulo_id = modulo.id AND vinculo.plano_id = _plano
  WHERE modulo.ativo
  ON CONFLICT (escola_id, modulo_id) DO UPDATE
  SET status = EXCLUDED.status,
      preco_contratado = EXCLUDED.preco_contratado,
      inicio_em = EXCLUDED.inicio_em,
      fim_em = NULL,
      updated_at = now()
  WHERE escola_modulos.origem = 'plano';
END;
$function$;
REVOKE ALL ON FUNCTION private.initialize_school_modules(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.initialize_school_modules(uuid,text) TO service_role;

CREATE FUNCTION private.initialize_school_modules_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM private.initialize_school_modules(NEW.id, NEW.plano);
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.initialize_school_modules_trigger() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER escolas_initialize_modules
AFTER INSERT OR UPDATE OF plano ON public.escolas
FOR EACH ROW EXECUTE FUNCTION private.initialize_school_modules_trigger();

SELECT private.initialize_school_modules(escola.id, escola.plano)
FROM public.escolas AS escola;

CREATE FUNCTION private.is_module_active(_escola_id uuid, _modulo_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.escola_modulos
    WHERE escola_id = _escola_id
      AND modulo_id = _modulo_id
      AND status IN ('trial','ativo','cortesia')
      AND (fim_em IS NULL OR fim_em > now())
  );
$$;
REVOKE ALL ON FUNCTION private.is_module_active(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_module_active(uuid,text) TO authenticated;

CREATE FUNCTION public.master_set_school_module(
  _escola_id uuid,
  _modulo_id text,
  _status text,
  _preco_contratado numeric DEFAULT NULL,
  _desconto numeric DEFAULT NULL
)
RETURNS public.escola_modulos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_before public.escola_modulos;
  v_after public.escola_modulos;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF _status NOT IN ('disponivel','trial','ativo','cortesia','suspenso','cancelado') THEN
    RAISE EXCEPTION 'Status de módulo inválido';
  END IF;
  SELECT * INTO v_before FROM public.escola_modulos
  WHERE escola_id = _escola_id AND modulo_id = _modulo_id FOR UPDATE;
  IF v_before.escola_id IS NULL THEN RAISE EXCEPTION 'Módulo da escola não encontrado'; END IF;

  UPDATE public.escola_modulos
  SET status = _status,
      preco_contratado = COALESCE(_preco_contratado, preco_contratado),
      desconto = COALESCE(_desconto, desconto),
      origem = 'manual',
      inicio_em = CASE WHEN _status IN ('trial','ativo','cortesia') THEN COALESCE(inicio_em, now()) ELSE inicio_em END,
      fim_em = CASE WHEN _status IN ('cancelado') THEN now() ELSE NULL END,
      atualizado_por = auth.uid(),
      updated_at = now()
  WHERE escola_id = _escola_id AND modulo_id = _modulo_id
  RETURNING * INTO v_after;

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    before_data, after_data
  ) VALUES (
    _escola_id, auth.uid(), 'plataforma', 'module.status_changed',
    'escola_modulo', _modulo_id, to_jsonb(v_before), to_jsonb(v_after)
  );
  RETURN v_after;
END;
$function$;
REVOKE ALL ON FUNCTION public.master_set_school_module(uuid,text,text,numeric,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_set_school_module(uuid,text,text,numeric,numeric) TO authenticated;

CREATE FUNCTION public.master_create_school_invite_existing(
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

CREATE FUNCTION public.master_update_school_member(
  _school_id uuid,
  _member_id uuid,
  _role text,
  _status text,
  _unit_ids uuid[]
)
RETURNS public.escola_membros
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_before public.escola_membros;
  v_after public.escola_membros;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','suporte']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF _role NOT IN ('gestor','secretaria','financeiro','pedagogico','comercial','professor','aluno','responsavel')
    OR _status NOT IN ('pendente','ativo','inativo','suspenso') THEN
    RAISE EXCEPTION 'Papel ou status inválido';
  END IF;
  SELECT * INTO v_before FROM public.escola_membros
  WHERE id = _member_id AND escola_id = _school_id FOR UPDATE;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'Usuário da escola não encontrado'; END IF;

  UPDATE public.escola_membros
  SET papel = _role, status = _status, updated_at = now()
  WHERE id = _member_id RETURNING * INTO v_after;
  UPDATE public.usuarios
  SET role = _role, status = _status, cargo = initcap(_role), updated_at = now()
  WHERE escola_id = _school_id AND auth_user_id = v_after.user_id;

  DELETE FROM public.escola_membro_unidades WHERE escola_membro_id = _member_id;
  IF COALESCE(array_length(_unit_ids, 1), 0) > 0 THEN
    INSERT INTO public.escola_membro_unidades (escola_membro_id, escola_id, unidade_id)
    SELECT _member_id, _school_id, unidade.id
    FROM public.unidades AS unidade
    WHERE unidade.escola_id = _school_id AND unidade.id = ANY(_unit_ids);
  END IF;

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    before_data, after_data
  ) VALUES (
    _school_id, auth.uid(), 'plataforma', 'member.updated', 'escola_membro',
    _member_id::text, to_jsonb(v_before), to_jsonb(v_after)
  );
  RETURN v_after;
END;
$function$;
REVOKE ALL ON FUNCTION public.master_update_school_member(uuid,uuid,text,text,uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_update_school_member(uuid,uuid,text,text,uuid[]) TO authenticated;

-- Convites com unidades selecionadas respeitam o escopo configurado pelo Master.
-- Gestores sem seleção explícita recebem todas as unidades da escola.
CREATE OR REPLACE FUNCTION public.accept_school_invite(_token_hash text, _display_name text)
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
  SELECT pg_catalog.lower(email) INTO v_email FROM auth.users
  WHERE id = v_user_id AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar o convite'; END IF;

  SELECT convite.* INTO v_invite
  FROM private.convite_tokens AS token
  JOIN public.convites_acesso AS convite ON convite.id = token.convite_id
  WHERE token.token_hash = _token_hash FOR UPDATE OF convite;
  IF v_invite.id IS NULL OR v_invite.status <> 'pendente' OR v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  IF v_invite.email <> v_email THEN RAISE EXCEPTION 'Este convite pertence a outro e-mail'; END IF;

  INSERT INTO public.escola_membros (escola_id, user_id, papel, status)
  VALUES (v_invite.escola_id, v_user_id, v_invite.papel, 'ativo')
  ON CONFLICT (escola_id, user_id) DO UPDATE
    SET papel = EXCLUDED.papel, status = 'ativo', updated_at = now()
  RETURNING id INTO v_member_id;
  INSERT INTO public.usuarios (auth_user_id, escola_id, nome, email, cargo, role, status)
  VALUES (v_user_id, v_invite.escola_id,
    COALESCE(NULLIF(pg_catalog.btrim(_display_name), ''), v_invite.nome, v_email),
    v_email, initcap(v_invite.papel), v_invite.papel, 'ativo')
  ON CONFLICT (escola_id, auth_user_id) WHERE auth_user_id IS NOT NULL DO UPDATE
    SET nome = EXCLUDED.nome, role = EXCLUDED.role, status = 'ativo', updated_at = now();

  INSERT INTO public.escola_membro_unidades (escola_membro_id, escola_id, unidade_id)
  SELECT v_member_id, unidade.escola_id, unidade.id
  FROM public.unidades AS unidade
  WHERE unidade.escola_id = v_invite.escola_id
    AND (
      unidade.id IN (SELECT unidade_id FROM public.convite_unidades WHERE convite_id = v_invite.id)
      OR (v_invite.papel = 'gestor' AND NOT EXISTS (
        SELECT 1 FROM public.convite_unidades WHERE convite_id = v_invite.id
      ))
    )
  ON CONFLICT DO NOTHING;

  UPDATE public.convites_acesso SET status = 'aceito', accepted_at = now(),
    accepted_by = v_user_id, updated_at = now() WHERE id = v_invite.id;
  DELETE FROM private.convite_tokens WHERE convite_id = v_invite.id;
  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id, metadata
  ) VALUES (
    v_invite.escola_id, v_user_id, 'usuario', 'invite.accepted', 'convite',
    v_invite.id::text, jsonb_build_object('papel', v_invite.papel)
  );
  RETURN v_invite.escola_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.accept_school_invite(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_school_invite(text,text) TO authenticated;

ALTER TABLE public.modulos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escola_modulos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.modulos_catalogo, public.planos_catalogo, public.plano_modulos,
  public.escola_modulos FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.modulos_catalogo, public.planos_catalogo, public.plano_modulos,
  public.escola_modulos TO authenticated;
GRANT ALL ON public.modulos_catalogo, public.planos_catalogo, public.plano_modulos,
  public.escola_modulos TO service_role;

CREATE POLICY modulos_catalogo_select ON public.modulos_catalogo FOR SELECT TO authenticated
  USING (true);
CREATE POLICY planos_catalogo_select ON public.planos_catalogo FOR SELECT TO authenticated
  USING (true);
CREATE POLICY plano_modulos_select ON public.plano_modulos FOR SELECT TO authenticated
  USING (true);
CREATE POLICY escola_modulos_select ON public.escola_modulos FOR SELECT TO authenticated
  USING (private.is_platform_admin() OR private.is_member(escola_id));

COMMIT;
