-- Evita códigos de curso repetidos e matrículas ativas duplicadas.
BEGIN;

CREATE UNIQUE INDEX cursos_codigo_por_escola_idx
  ON public.cursos (escola_id, lower(codigo));
CREATE UNIQUE INDEX matriculas_ativas_por_turma_idx
  ON public.matriculas (escola_id, aluno_id, turma_id)
  WHERE status = 'ativa';

COMMIT;
