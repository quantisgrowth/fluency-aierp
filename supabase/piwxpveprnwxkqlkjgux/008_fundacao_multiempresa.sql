-- RASCUNHO LOCAL. NAO APLICAR SEM INSPECAO DO BANCO REMOTO E APROVACAO.
-- Target: piwxpveprnwxkqlkjgux, depois de 001..007.
-- Objetivo: consolidar equipe master, acesso por unidade, convites e auditoria.

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.escolas') IS NULL
    OR to_regclass('public.unidades') IS NULL
    OR to_regclass('public.escola_membros') IS NULL
    OR to_regclass('public.platform_admins') IS NULL
    OR to_regclass('public.usuarios') IS NULL THEN
    RAISE EXCEPTION 'Fundação 001..004 incompleta; migração 008 cancelada';
  END IF;
  IF to_regclass('public.convites_acesso') IS NOT NULL
    OR to_regclass('public.audit_logs') IS NOT NULL
    OR to_regclass('public.escola_membro_unidades') IS NOT NULL THEN
    RAISE EXCEPTION 'Migração 008 já iniciada ou aplicada; revisão manual necessária';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.usuarios
    GROUP BY escola_id, lower(email) HAVING count(*) > 1
  ) OR EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_user_id IS NOT NULL
    GROUP BY escola_id, auth_user_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Usuários duplicados precisam ser corrigidos antes da migração 008';
  END IF;
END;
$preflight$;

-- Administradores da plataforma passam a ter papel e ciclo de vida explícitos.
ALTER TABLE public.platform_admins
  ADD COLUMN nome text,
  ADD COLUMN papel text NOT NULL DEFAULT 'administrador'
    CHECK (papel IN ('administrador','suporte','financeiro','comercial','tecnico')),
  ADD COLUMN status text NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('pendente','ativo','inativo','suspenso')),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE FUNCTION private.is_platform_admin(_roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins AS administrador
    WHERE administrador.user_id = (SELECT auth.uid())
      AND administrador.status = 'ativo'
      AND (_roles IS NULL OR administrador.papel = ANY(_roles))
  );
$$;
REVOKE ALL ON FUNCTION private.is_platform_admin(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_platform_admin(text[]) TO authenticated;

-- Um membro pode operar uma ou várias unidades da escola.
ALTER TABLE public.escola_membros
  ADD CONSTRAINT escola_membros_id_escola_key UNIQUE (id, escola_id);

CREATE TABLE public.escola_membro_unidades (
  escola_membro_id uuid NOT NULL,
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  unidade_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (escola_membro_id, unidade_id),
  CONSTRAINT membro_vinculo_mesma_escola
    FOREIGN KEY (escola_membro_id, escola_id)
    REFERENCES public.escola_membros(id, escola_id) ON DELETE CASCADE,
  CONSTRAINT membro_unidade_mesma_escola
    FOREIGN KEY (escola_id, unidade_id)
    REFERENCES public.unidades(escola_id, id) ON DELETE CASCADE
);
CREATE INDEX escola_membro_unidades_escola_idx
  ON public.escola_membro_unidades(escola_id, unidade_id);

CREATE FUNCTION private.can_access_unit(_escola_id uuid, _unidade_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_platform_admin()
    OR (
      private.is_member(_escola_id)
      AND EXISTS (
      SELECT 1
      FROM public.escola_membros AS membro
      LEFT JOIN public.escola_membro_unidades AS acesso
        ON acesso.escola_membro_id = membro.id
      WHERE membro.escola_id = _escola_id
        AND membro.user_id = (SELECT auth.uid())
        AND membro.status = 'ativo'
        AND (acesso.unidade_id = _unidade_id OR acesso.unidade_id IS NULL)
      )
    );
$$;
REVOKE ALL ON FUNCTION private.can_access_unit(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_access_unit(uuid,uuid) TO authenticated;

-- O convite visível não contém segredo. O hash fica no schema private.
CREATE TABLE public.convites_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(btrim(email))),
  nome text,
  papel text NOT NULL CHECK (papel IN
    ('gestor','secretaria','financeiro','pedagogico','comercial',
     'professor','aluno','responsavel')),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','aceito','expirado','cancelado')),
  convidado_por uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, escola_id),
  CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX convites_acesso_pendente_idx
  ON public.convites_acesso(escola_id, lower(email))
  WHERE status = 'pendente';
CREATE INDEX convites_acesso_expiracao_idx
  ON public.convites_acesso(status, expires_at);

CREATE TABLE private.convite_tokens (
  convite_id uuid PRIMARY KEY
    REFERENCES public.convites_acesso(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.convite_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.convite_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.convite_tokens TO service_role;

CREATE TABLE public.convite_unidades (
  convite_id uuid NOT NULL,
  escola_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  CONSTRAINT convite_unidade_convite_mesma_escola
    FOREIGN KEY (convite_id, escola_id)
    REFERENCES public.convites_acesso(id, escola_id) ON DELETE CASCADE,
  CONSTRAINT convite_unidade_mesma_escola
    FOREIGN KEY (escola_id, unidade_id)
    REFERENCES public.unidades(escola_id, id) ON DELETE CASCADE,
  PRIMARY KEY (convite_id, unidade_id)
);

-- Auditoria append-only. Payloads sensíveis devem ser removidos pelo servidor.
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid REFERENCES public.escolas(id) ON DELETE SET NULL,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_kind text NOT NULL CHECK (actor_kind IN ('usuario','plataforma','sistema','integracao')),
  action text NOT NULL CHECK (char_length(action) BETWEEN 3 AND 120),
  resource_type text NOT NULL CHECK (char_length(resource_type) BETWEEN 2 AND 80),
  resource_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet,
  user_agent text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_escola_data_idx
  ON public.audit_logs(escola_id, occurred_at DESC);
CREATE INDEX audit_logs_actor_data_idx
  ON public.audit_logs(actor_user_id, occurred_at DESC);
CREATE INDEX audit_logs_action_data_idx
  ON public.audit_logs(action, occurred_at DESC);

-- O e-mail deixa de ser globalmente único: a mesma pessoa pode integrar mais
-- de uma escola. Mantemos unicidade por escola e por conta autenticada.
ALTER TABLE public.usuarios DROP CONSTRAINT usuarios_email_key;
ALTER TABLE public.usuarios DROP CONSTRAINT usuarios_role_check;
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_role_check CHECK (role IN
    ('superadmin','admin','gestor','secretaria','financeiro','pedagogico',
     'comercial','professor','aluno','responsavel'));
CREATE UNIQUE INDEX usuarios_email_por_escola_idx
  ON public.usuarios(escola_id, lower(email));
CREATE UNIQUE INDEX usuarios_auth_por_escola_idx
  ON public.usuarios(escola_id, auth_user_id)
  WHERE auth_user_id IS NOT NULL;

ALTER TABLE public.escola_membro_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convite_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.escola_membro_unidades, public.convites_acesso,
  public.convite_unidades, public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.escola_membro_unidades, public.convites_acesso,
  public.convite_unidades, public.audit_logs TO authenticated;
GRANT ALL ON public.escola_membro_unidades, public.convites_acesso,
  public.convite_unidades, public.audit_logs TO service_role;

-- A equipe master ativa enxerga o catálogo global; usuários escolares continuam
-- restritos à sua própria escola.
DROP POLICY escolas_select ON public.escolas;
CREATE POLICY escolas_select ON public.escolas FOR SELECT TO authenticated
  USING (private.is_platform_admin() OR private.is_member(id));

DROP POLICY platform_admin_self ON public.platform_admins;
CREATE POLICY platform_admin_select ON public.platform_admins FOR SELECT TO authenticated
  USING (private.is_platform_admin() OR user_id = (SELECT auth.uid()));

DROP POLICY membros_select ON public.escola_membros;
CREATE POLICY membros_select ON public.escola_membros FOR SELECT TO authenticated
  USING (
    private.is_platform_admin()
    OR (
      private.is_member(escola_id)
      AND (
        user_id = (SELECT auth.uid())
        OR private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico'])
      )
    )
  );

DROP POLICY unidades_select ON public.unidades;
CREATE POLICY unidades_select ON public.unidades FOR SELECT TO authenticated
  USING (private.is_platform_admin() OR private.is_member(escola_id));

CREATE POLICY membro_unidades_select ON public.escola_membro_unidades
  FOR SELECT TO authenticated
  USING (
    private.is_platform_admin()
    OR private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico'])
    OR EXISTS (
      SELECT 1 FROM public.escola_membros AS membro
      WHERE membro.id = escola_membro_id
        AND membro.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY convites_select ON public.convites_acesso FOR SELECT TO authenticated
  USING (
    private.is_platform_admin()
    OR private.is_member(escola_id, ARRAY['gestor','secretaria'])
  );

CREATE POLICY convite_unidades_select ON public.convite_unidades FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.convites_acesso AS convite
      WHERE convite.id = convite_id
        AND (
          private.is_platform_admin()
          OR private.is_member(convite.escola_id, ARRAY['gestor','secretaria'])
        )
    )
  );

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (
    private.is_platform_admin()
    OR private.is_member(escola_id, ARRAY['gestor'])
  );

COMMIT;
