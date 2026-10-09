-- Execute depois de 016_fundacao_academica_universal.sql.
-- Todas as linhas devem retornar status = OK.
WITH objetos(nome, existe) AS (
  VALUES
    ('responsaveis', to_regclass('public.responsaveis') IS NOT NULL),
    ('aluno_responsaveis', to_regclass('public.aluno_responsaveis') IS NOT NULL),
    ('frameworks_competencias', to_regclass('public.frameworks_competencias') IS NOT NULL),
    ('competencias', to_regclass('public.competencias') IS NOT NULL),
    ('curso_competencias', to_regclass('public.curso_competencias') IS NOT NULL),
    ('aulas', to_regclass('public.aulas') IS NOT NULL),
    ('presencas', to_regclass('public.presencas') IS NOT NULL),
    ('avaliacoes', to_regclass('public.avaliacoes') IS NOT NULL),
    ('resultados_avaliacoes', to_regclass('public.resultados_avaliacoes') IS NOT NULL),
    ('materiais_academicos', to_regclass('public.materiais_academicos') IS NOT NULL),
    ('turma_materiais', to_regclass('public.turma_materiais') IS NOT NULL),
    ('historico_aluno', to_regclass('public.historico_aluno') IS NOT NULL)
),
colunas(nome, existe) AS (
  VALUES
    ('cursos.categoria', EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'cursos' AND column_name = 'categoria'
    )),
    ('turmas.coordenador_id', EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'turmas' AND column_name = 'coordenador_id'
    )),
    ('alunos.objetivo_aprendizagem', EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'alunos' AND column_name = 'objetivo_aprendizagem'
    ))
)
SELECT 'tabela' AS tipo, nome,
  CASE WHEN existe THEN 'OK' ELSE 'PENDENTE' END AS status
FROM objetos
UNION ALL
SELECT 'coluna', nome,
  CASE WHEN existe THEN 'OK' ELSE 'PENDENTE' END
FROM colunas
ORDER BY tipo, nome;
