-- Target: piwxpveprnwxkqlkjgux, after 001_fechar_acesso_publico.sql.
-- Adapted to the existing escolas/usuarios/academic tables. No CREATE TABLE
-- IF NOT EXISTS masking a mismatch with the current schema.
BEGIN;

-- The live schema was empty when inspected. Refuse a structural change if
-- records have appeared since then; they would need a tenant backfill first.
DO $preflight$
DECLARE
  target_table text;
  has_rows boolean;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'escolas','usuarios','niveis_educacionais','cursos','turmas','alunos',
    'matriculas','leads','crm_atividades','transacoes_financeiras',
    'inventario_materiais'
  ] LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I)', target_table)
      INTO has_rows;
    IF has_rows THEN
      RAISE EXCEPTION 'Tenant backfill required before migration: public.%', target_table;
    END IF;
  END LOOP;
END;
$preflight$;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER TABLE public.escolas
  ADD COLUMN status text NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial','ativa','vencida','suspensa','cancelada')),
  ADD COLUMN trial_starts_at timestamptz,
  ADD COLUMN trial_ends_at timestamptz;

CREATE TABLE public.escola_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel text NOT NULL CHECK (papel IN
    ('gestor','secretaria','financeiro','pedagogico','comercial',
     'professor','aluno','responsavel')),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','ativo','inativo','suspenso')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,user_id)
);
CREATE INDEX escola_membros_user_idx ON public.escola_membros(user_id,escola_id)
  WHERE status = 'ativo';
CREATE INDEX escola_membros_escola_idx ON public.escola_membros(escola_id,papel)
  WHERE status = 'ativo';

CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- These helpers inspect the authenticated user internally. A caller cannot
-- claim another user ID. SECURITY DEFINER avoids recursive membership RLS.
CREATE FUNCTION private.is_member(_escola_id uuid, _roles text[] DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.escola_membros
    WHERE escola_id = _escola_id
      AND user_id = (SELECT auth.uid())
      AND status = 'ativo'
      AND (_roles IS NULL OR papel = ANY(_roles))
  );
$$;
REVOKE ALL ON FUNCTION private.is_member(uuid,text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_member(uuid,text[]) TO authenticated;

ALTER TABLE public.escola_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.escola_membros, public.platform_admins
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.escola_membros, public.platform_admins TO authenticated;
GRANT ALL ON public.escola_membros, public.platform_admins TO service_role;

CREATE POLICY membros_select ON public.escola_membros FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())
    OR private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY platform_admin_self ON public.platform_admins FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY escolas_select ON public.escolas FOR SELECT TO authenticated
  USING (private.is_member(id));
GRANT SELECT ON public.escolas TO authenticated;

-- Existing tables have zero rows. Reject future rows with no tenant.
ALTER TABLE public.usuarios ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.niveis_educacionais ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.cursos ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.turmas ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.alunos ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.matriculas ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.transacoes_financeiras ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.inventario_materiais ALTER COLUMN escola_id SET NOT NULL;
ALTER TABLE public.crm_atividades
  ADD COLUMN escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE;

-- Composite keys prevent linking a row from one school to a row in another.
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_escola_id_id_key UNIQUE(escola_id,id);
ALTER TABLE public.cursos ADD CONSTRAINT cursos_escola_id_id_key UNIQUE(escola_id,id);
ALTER TABLE public.turmas ADD CONSTRAINT turmas_escola_id_id_key UNIQUE(escola_id,id);
ALTER TABLE public.alunos ADD CONSTRAINT alunos_escola_id_id_key UNIQUE(escola_id,id);
ALTER TABLE public.leads ADD CONSTRAINT leads_escola_id_id_key UNIQUE(escola_id,id);
ALTER TABLE public.turmas ADD CONSTRAINT turmas_curso_mesma_escola
  FOREIGN KEY (escola_id,curso_id) REFERENCES public.cursos(escola_id,id);
ALTER TABLE public.turmas ADD CONSTRAINT turmas_professor_mesma_escola
  FOREIGN KEY (escola_id,professor_id) REFERENCES public.usuarios(escola_id,id);
ALTER TABLE public.alunos ADD CONSTRAINT alunos_turma_mesma_escola
  FOREIGN KEY (escola_id,turma_atual_id) REFERENCES public.turmas(escola_id,id);
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_aluno_mesma_escola
  FOREIGN KEY (escola_id,aluno_id) REFERENCES public.alunos(escola_id,id);
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_turma_mesma_escola
  FOREIGN KEY (escola_id,turma_id) REFERENCES public.turmas(escola_id,id);
ALTER TABLE public.leads ADD CONSTRAINT leads_responsavel_mesma_escola
  FOREIGN KEY (escola_id,responsavel_id) REFERENCES public.usuarios(escola_id,id);
ALTER TABLE public.crm_atividades ADD CONSTRAINT crm_lead_mesma_escola
  FOREIGN KEY (escola_id,lead_id) REFERENCES public.leads(escola_id,id);
ALTER TABLE public.transacoes_financeiras ADD CONSTRAINT transacoes_aluno_mesma_escola
  FOREIGN KEY (escola_id,aluno_id) REFERENCES public.alunos(escola_id,id);

-- No public writes in this phase. Server endpoints will check role and school
-- before using service_role. Student/guardian access needs explicit links.
CREATE POLICY usuarios_self_or_staff ON public.usuarios FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()) OR
    private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY niveis_staff_select ON public.niveis_educacionais FOR SELECT TO authenticated
  USING (private.is_member(escola_id,
    ARRAY['gestor','secretaria','pedagogico','professor']));
CREATE POLICY cursos_staff_select ON public.cursos FOR SELECT TO authenticated
  USING (private.is_member(escola_id,
    ARRAY['gestor','secretaria','pedagogico','professor']));
CREATE POLICY turmas_staff_select ON public.turmas FOR SELECT TO authenticated
  USING (private.is_member(escola_id,
    ARRAY['gestor','secretaria','pedagogico','professor']));
CREATE POLICY alunos_staff_select ON public.alunos FOR SELECT TO authenticated
  USING (private.is_member(escola_id,
    ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY matriculas_staff_select ON public.matriculas FOR SELECT TO authenticated
  USING (private.is_member(escola_id,
    ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY leads_comercial_select ON public.leads FOR SELECT TO authenticated
  USING (private.is_member(escola_id,
    ARRAY['gestor','secretaria','comercial']));
CREATE POLICY crm_comercial_select ON public.crm_atividades FOR SELECT TO authenticated
  USING (private.is_member(escola_id,
    ARRAY['gestor','secretaria','comercial']));
CREATE POLICY transacoes_financeiro_select ON public.transacoes_financeiras
  FOR SELECT TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor','financeiro']));
CREATE POLICY inventario_staff_select ON public.inventario_materiais
  FOR SELECT TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor','secretaria','financeiro']));

GRANT SELECT ON public.usuarios, public.niveis_educacionais, public.cursos,
  public.turmas, public.alunos, public.matriculas, public.leads,
  public.crm_atividades, public.transacoes_financeiras,
  public.inventario_materiais TO authenticated;

COMMIT;
