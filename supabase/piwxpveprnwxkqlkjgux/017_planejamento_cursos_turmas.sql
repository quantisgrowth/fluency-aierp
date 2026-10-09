-- Planejamento estruturado de cursos e turmas.
-- Execute depois de 016_fundacao_academica_universal.sql.
BEGIN;

ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS criterio_entrada text,
  ADD COLUMN IF NOT EXISTS ementa text;

CREATE TABLE IF NOT EXISTS public.curso_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  curso_id uuid NOT NULL,
  codigo text NOT NULL,
  nome text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id),
  UNIQUE (escola_id,curso_id,id),
  UNIQUE (escola_id,curso_id,codigo),
  FOREIGN KEY (escola_id,curso_id)
    REFERENCES public.cursos(escola_id,id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.curso_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  curso_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'ementa'
    CHECK (tipo IN ('modelo_ementa','ementa','plano_ensino','material_complementar')),
  titulo text NOT NULL,
  storage_path text NOT NULL,
  versao integer NOT NULL DEFAULT 1 CHECK (versao > 0),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (escola_id,id),
  UNIQUE (escola_id,curso_id,tipo,versao),
  FOREIGN KEY (escola_id,curso_id)
    REFERENCES public.cursos(escola_id,id) ON DELETE CASCADE
);

ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS curso_etapa_id uuid,
  ADD COLUMN IF NOT EXISTS idade_minima smallint,
  ADD COLUMN IF NOT EXISTS idade_maxima smallint,
  ADD COLUMN IF NOT EXISTS plataforma_online text,
  ADD COLUMN IF NOT EXISTS link_online text;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'turmas_etapa_do_curso'
      AND conrelid = 'public.turmas'::regclass
  ) THEN
    ALTER TABLE public.turmas
      ADD CONSTRAINT turmas_etapa_do_curso
      FOREIGN KEY (escola_id,curso_id,curso_etapa_id)
      REFERENCES public.curso_etapas(escola_id,curso_id,id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'turmas_modalidade_valida'
      AND conrelid = 'public.turmas'::regclass
  ) THEN
    ALTER TABLE public.turmas
      ADD CONSTRAINT turmas_modalidade_valida
      CHECK (modalidade IS NULL OR modalidade IN ('presencial','online','hibrida')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'turmas_faixa_etaria_valida'
      AND conrelid = 'public.turmas'::regclass
  ) THEN
    ALTER TABLE public.turmas
      ADD CONSTRAINT turmas_faixa_etaria_valida
      CHECK (
        (idade_minima IS NULL OR idade_minima BETWEEN 0 AND 120)
        AND (idade_maxima IS NULL OR idade_maxima BETWEEN 0 AND 120)
        AND (idade_minima IS NULL OR idade_maxima IS NULL OR idade_minima <= idade_maxima)
      );
  END IF;
END
$block$;

CREATE INDEX IF NOT EXISTS curso_etapas_curso_idx
  ON public.curso_etapas(escola_id,curso_id,ordem) WHERE ativo;
CREATE INDEX IF NOT EXISTS curso_documentos_curso_idx
  ON public.curso_documentos(escola_id,curso_id,tipo,versao DESC) WHERE ativo;
CREATE INDEX IF NOT EXISTS turmas_professor_agenda_idx
  ON public.turmas(escola_id,professor_id,data_inicio,data_fim,horario_inicio,horario_fim)
  WHERE status IN ('planejamento','matriculas_abertas','ativa');

ALTER TABLE public.curso_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_documentos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.curso_etapas, public.curso_documentos
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curso_etapas, public.curso_documentos
  TO authenticated;
GRANT ALL ON public.curso_etapas, public.curso_documentos TO service_role;

CREATE POLICY curso_etapas_select ON public.curso_etapas
  FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY curso_etapas_write ON public.curso_etapas
  FOR ALL TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor','pedagogico']))
  WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico']));
CREATE POLICY curso_documentos_select ON public.curso_documentos
  FOR SELECT TO authenticated USING (private.is_member(escola_id));
CREATE POLICY curso_documentos_write ON public.curso_documentos
  FOR ALL TO authenticated
  USING (private.is_member(escola_id,ARRAY['gestor','pedagogico']))
  WITH CHECK (private.is_member(escola_id,ARRAY['gestor','pedagogico']));

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES (
  'curso-documentos',
  'curso-documentos',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY curso_documentos_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'curso-documentos'
    AND private.is_member(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY curso_documentos_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'curso-documentos'
    AND private.is_member(
      ((storage.foldername(name))[1])::uuid,
      ARRAY['gestor','pedagogico']
    )
  );
CREATE POLICY curso_documentos_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'curso-documentos'
    AND private.is_member(
      ((storage.foldername(name))[1])::uuid,
      ARRAY['gestor','pedagogico']
    )
  )
  WITH CHECK (
    bucket_id = 'curso-documentos'
    AND private.is_member(
      ((storage.foldername(name))[1])::uuid,
      ARRAY['gestor','pedagogico']
    )
  );
CREATE POLICY curso_documentos_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'curso-documentos'
    AND private.is_member(
      ((storage.foldername(name))[1])::uuid,
      ARRAY['gestor','pedagogico']
    )
  );

COMMIT;
