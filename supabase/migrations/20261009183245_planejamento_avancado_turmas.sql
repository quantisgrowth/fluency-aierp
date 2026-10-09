-- Planejamento avançado das turmas: salas persistentes, múltiplos encontros
-- semanais e diretório acadêmico compartilhado.
BEGIN;

CREATE TABLE IF NOT EXISTS public.salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  capacidade integer CHECK (capacidade IS NULL OR capacidade > 0),
  bloco_ou_andar text,
  status text NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel','ocupada','manutencao','inativa')),
  responsavel text,
  recursos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id),
  UNIQUE (escola_id,nome)
);

ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS sala_id uuid;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'turmas_sala_mesma_escola'
      AND conrelid = 'public.turmas'::regclass
  ) THEN
    ALTER TABLE public.turmas
      ADD CONSTRAINT turmas_sala_mesma_escola
      FOREIGN KEY (escola_id,sala_id)
      REFERENCES public.salas(escola_id,id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'turmas_objetivos_limite'
      AND conrelid = 'public.turmas'::regclass
  ) THEN
    ALTER TABLE public.turmas
      ADD CONSTRAINT turmas_objetivos_limite
      CHECK (objetivos IS NULL OR char_length(objetivos) <= 500) NOT VALID;
  END IF;
END
$block$;

CREATE TABLE IF NOT EXISTS public.turma_encontros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL,
  dia_semana text NOT NULL
    CHECK (dia_semana IN ('segunda','terca','quarta','quinta','sexta','sabado','domingo')),
  horario_inicio time NOT NULL,
  horario_fim time NOT NULL,
  sala_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (horario_inicio < horario_fim),
  UNIQUE (escola_id,turma_id,dia_semana,horario_inicio),
  FOREIGN KEY (escola_id,turma_id)
    REFERENCES public.turmas(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,sala_id)
    REFERENCES public.salas(escola_id,id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS turma_encontros_turma_idx
  ON public.turma_encontros(escola_id,turma_id,dia_semana);
CREATE INDEX IF NOT EXISTS turma_encontros_professor_agenda_idx
  ON public.turma_encontros(escola_id,dia_semana,horario_inicio,horario_fim);

ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_encontros ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.salas, public.turma_encontros FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas, public.turma_encontros TO authenticated;
GRANT ALL ON public.salas, public.turma_encontros TO service_role;

CREATE POLICY salas_select ON public.salas
  FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY salas_write ON public.salas
  FOR ALL TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor','pedagogico']))
  WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico']));
CREATE POLICY turma_encontros_select ON public.turma_encontros
  FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY turma_encontros_write ON public.turma_encontros
  FOR ALL TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor','pedagogico']))
  WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico']));

-- Usuários criados no diretório da escola podem existir antes de aceitarem o convite.
CREATE POLICY usuarios_staff_insert ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (private.is_member(escola_id,ARRAY['gestor']));
CREATE POLICY usuarios_staff_update ON public.usuarios
  FOR UPDATE TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor']))
  WITH CHECK (private.is_member(escola_id,ARRAY['gestor']));
CREATE POLICY usuarios_staff_delete ON public.usuarios
  FOR DELETE TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor']));

COMMIT;
