-- Fundação acadêmica universal para idiomas, cursos profissionalizantes,
-- cursos livres e preparatórios. Preserva os registros atuais.
BEGIN;

ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'idioma'
    CHECK (categoria IN ('idioma','profissionalizante','livre','preparatorio','outro')),
  ADD COLUMN IF NOT EXISTS modelo_pedagogico text NOT NULL DEFAULT 'competencias',
  ADD COLUMN IF NOT EXISTS exige_nivelamento boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exige_avaliacao_pratica boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exige_estagio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exige_projeto_final boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emite_certificado boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS frequencia_minima numeric(5,2) NOT NULL DEFAULT 75
    CHECK (frequencia_minima BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS configuracao jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS coordenador_id uuid,
  ADD COLUMN IF NOT EXISTS coordenador_nome text,
  ADD COLUMN IF NOT EXISTS faixa_etaria text,
  ADD COLUMN IF NOT EXISTS criterio_entrada text,
  ADD COLUMN IF NOT EXISTS ementa text,
  ADD COLUMN IF NOT EXISTS objetivos text,
  ADD COLUMN IF NOT EXISTS frequencia_minima numeric(5,2)
    CHECK (frequencia_minima IS NULL OR frequencia_minima BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS configuracao jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'turmas_coordenador_mesma_escola'
      AND conrelid = 'public.turmas'::regclass
  ) THEN
    ALTER TABLE public.turmas
      ADD CONSTRAINT turmas_coordenador_mesma_escola
      FOREIGN KEY (escola_id,coordenador_id)
      REFERENCES public.usuarios(escola_id,id);
  END IF;
END
$block$;

ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS nome_social text,
  ADD COLUMN IF NOT EXISTS nacionalidade text,
  ADD COLUMN IF NOT EXISTS profissao_ou_escola text,
  ADD COLUMN IF NOT EXISTS idioma_principal text,
  ADD COLUMN IF NOT EXISTS necessidades_acessibilidade text,
  ADD COLUMN IF NOT EXISTS contato_emergencia_nome text,
  ADD COLUMN IF NOT EXISTS contato_emergencia_telefone text,
  ADD COLUMN IF NOT EXISTS objetivo_aprendizagem text,
  ADD COLUMN IF NOT EXISTS meta_academica text,
  ADD COLUMN IF NOT EXISTS preferencias_comunicacao jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  parentesco text,
  data_nascimento date,
  cpf text,
  rg text,
  email text,
  telefone text,
  whatsapp text,
  endereco text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id)
);

CREATE TABLE IF NOT EXISTS public.aluno_responsaveis (
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  responsavel_id uuid NOT NULL,
  responsavel_financeiro boolean NOT NULL DEFAULT false,
  responsavel_pedagogico boolean NOT NULL DEFAULT true,
  contato_emergencia boolean NOT NULL DEFAULT false,
  autorizado_retirada boolean NOT NULL DEFAULT false,
  recebe_notas boolean NOT NULL DEFAULT true,
  recebe_faltas boolean NOT NULL DEFAULT true,
  recebe_cobrancas boolean NOT NULL DEFAULT false,
  guarda_legal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (escola_id,aluno_id,responsavel_id),
  FOREIGN KEY (escola_id,aluno_id) REFERENCES public.alunos(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,responsavel_id) REFERENCES public.responsaveis(escola_id,id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.frameworks_competencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'personalizado',
  descricao text,
  escala jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id),
  UNIQUE (escola_id,nome)
);

CREATE TABLE IF NOT EXISTS public.competencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  framework_id uuid NOT NULL,
  codigo text NOT NULL,
  nome text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id),
  UNIQUE (escola_id,framework_id,codigo),
  FOREIGN KEY (escola_id,framework_id) REFERENCES public.frameworks_competencias(escola_id,id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.curso_competencias (
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  curso_id uuid NOT NULL,
  competencia_id uuid NOT NULL,
  obrigatoria boolean NOT NULL DEFAULT true,
  peso numeric(7,4) NOT NULL DEFAULT 1 CHECK (peso >= 0),
  meta text,
  PRIMARY KEY (escola_id,curso_id,competencia_id),
  FOREIGN KEY (escola_id,curso_id) REFERENCES public.cursos(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,competencia_id) REFERENCES public.competencias(escola_id,id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL,
  professor_id uuid,
  professor_nome text,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'planejada'
    CHECK (status IN ('planejada','realizada','parcial','cancelada','reposta')),
  conteudo_previsto text,
  conteudo_realizado text,
  tarefa_casa text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id),
  CHECK (fim > inicio),
  FOREIGN KEY (escola_id,turma_id) REFERENCES public.turmas(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,professor_id) REFERENCES public.usuarios(escola_id,id)
);

CREATE TABLE IF NOT EXISTS public.presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  aula_id uuid NOT NULL,
  aluno_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'presente'
    CHECK (status IN ('presente','ausente','justificada','atraso','reposicao')),
  minutos_frequentados integer CHECK (minutos_frequentados IS NULL OR minutos_frequentados >= 0),
  justificativa text,
  comprovante_url text,
  registrado_por uuid REFERENCES auth.users(id),
  registrado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,aula_id,aluno_id),
  FOREIGN KEY (escola_id,aula_id) REFERENCES public.aulas(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,aluno_id) REFERENCES public.alunos(escola_id,id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  curso_id uuid,
  turma_id uuid,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'formativa'
    CHECK (tipo IN ('nivelamento','diagnostica','formativa','somativa','pratica','projeto','simulado','final')),
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  valor_maximo numeric(8,2),
  peso numeric(7,4) NOT NULL DEFAULT 1 CHECK (peso >= 0),
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id),
  FOREIGN KEY (escola_id,curso_id) REFERENCES public.cursos(escola_id,id),
  FOREIGN KEY (escola_id,turma_id) REFERENCES public.turmas(escola_id,id)
);

CREATE TABLE IF NOT EXISTS public.resultados_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  avaliacao_id uuid NOT NULL,
  aluno_id uuid NOT NULL,
  competencia_id uuid,
  nota numeric(8,2),
  conceito text,
  nivel_resultado text,
  feedback text,
  evidencia_url text,
  avaliado_por uuid REFERENCES auth.users(id),
  avaliado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,avaliacao_id,aluno_id,competencia_id),
  FOREIGN KEY (escola_id,avaliacao_id) REFERENCES public.avaliacoes(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,aluno_id) REFERENCES public.alunos(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,competencia_id) REFERENCES public.competencias(escola_id,id)
);

CREATE TABLE IF NOT EXISTS public.materiais_academicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('livro','apostila','kit','equipamento','arquivo','link','uniforme','outro')),
  codigo text,
  descricao text,
  url text,
  obrigatorio boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id)
);

CREATE TABLE IF NOT EXISTS public.turma_materiais (
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL,
  material_id uuid NOT NULL,
  quantidade numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  observacoes text,
  PRIMARY KEY (escola_id,turma_id,material_id),
  FOREIGN KEY (escola_id,turma_id) REFERENCES public.turmas(escola_id,id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id,material_id) REFERENCES public.materiais_academicos(escola_id,id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.historico_aluno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  referencia_tipo text,
  referencia_id uuid,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  autor_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (escola_id,aluno_id) REFERENCES public.alunos(escola_id,id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS responsaveis_escola_idx ON public.responsaveis(escola_id,nome);
CREATE INDEX IF NOT EXISTS competencias_framework_idx ON public.competencias(escola_id,framework_id,ordem);
CREATE INDEX IF NOT EXISTS aulas_turma_inicio_idx ON public.aulas(escola_id,turma_id,inicio);
CREATE INDEX IF NOT EXISTS presencas_aluno_idx ON public.presencas(escola_id,aluno_id,registrado_em DESC);
CREATE INDEX IF NOT EXISTS resultados_aluno_idx ON public.resultados_avaliacoes(escola_id,aluno_id,avaliado_em DESC);
CREATE INDEX IF NOT EXISTS historico_aluno_idx ON public.historico_aluno(escola_id,aluno_id,created_at DESC);

ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frameworks_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_aluno ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.responsaveis, public.aluno_responsaveis,
  public.frameworks_competencias, public.competencias, public.curso_competencias,
  public.aulas, public.presencas, public.avaliacoes, public.resultados_avaliacoes,
  public.materiais_academicos, public.turma_materiais, public.historico_aluno
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.responsaveis, public.aluno_responsaveis,
  public.frameworks_competencias, public.competencias, public.curso_competencias,
  public.aulas, public.presencas, public.avaliacoes, public.resultados_avaliacoes,
  public.materiais_academicos, public.turma_materiais TO authenticated;
GRANT SELECT, INSERT ON public.historico_aluno TO authenticated;
GRANT ALL ON public.responsaveis, public.aluno_responsaveis,
  public.frameworks_competencias, public.competencias, public.curso_competencias,
  public.aulas, public.presencas, public.avaliacoes, public.resultados_avaliacoes,
  public.materiais_academicos, public.turma_materiais, public.historico_aluno TO service_role;

CREATE POLICY responsaveis_select ON public.responsaveis FOR SELECT TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY responsaveis_write ON public.responsaveis FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','secretaria'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','secretaria']));
CREATE POLICY aluno_responsaveis_select ON public.aluno_responsaveis FOR SELECT TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY aluno_responsaveis_write ON public.aluno_responsaveis FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','secretaria'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','secretaria']));
CREATE POLICY frameworks_select ON public.frameworks_competencias FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY frameworks_write ON public.frameworks_competencias FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','pedagogico'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico']));
CREATE POLICY competencias_select ON public.competencias FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY competencias_write ON public.competencias FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','pedagogico'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico']));
CREATE POLICY curso_competencias_select ON public.curso_competencias FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY curso_competencias_write ON public.curso_competencias FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','pedagogico'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico']));
CREATE POLICY aulas_select ON public.aulas FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY aulas_write ON public.aulas FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor']));
CREATE POLICY presencas_select ON public.presencas FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY presencas_write ON public.presencas FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor']));
CREATE POLICY avaliacoes_select ON public.avaliacoes FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY avaliacoes_write ON public.avaliacoes FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor']));
CREATE POLICY resultados_select ON public.resultados_avaliacoes FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY resultados_write ON public.resultados_avaliacoes FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico','professor']));
CREATE POLICY materiais_select ON public.materiais_academicos FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY materiais_write ON public.materiais_academicos FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY turma_materiais_select ON public.turma_materiais FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY turma_materiais_write ON public.turma_materiais FOR ALL TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico'])) WITH CHECK (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY historico_select ON public.historico_aluno FOR SELECT TO authenticated USING (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico','professor']));
CREATE POLICY historico_insert ON public.historico_aluno FOR INSERT TO authenticated WITH CHECK (private.is_member(escola_id,ARRAY['gestor','secretaria','pedagogico','professor']));

COMMIT;
