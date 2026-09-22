-- Permite a operação acadêmica por usuários ativos da própria escola.
BEGIN;

GRANT INSERT, UPDATE ON public.cursos, public.turmas,
  public.alunos, public.matriculas TO authenticated;

CREATE POLICY cursos_staff_insert ON public.cursos FOR INSERT TO authenticated
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','pedagogico']));
CREATE POLICY cursos_staff_update ON public.cursos FOR UPDATE TO authenticated
  USING (private.is_member(escola_id, ARRAY['gestor','pedagogico']))
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','pedagogico']));

CREATE POLICY turmas_staff_insert ON public.turmas FOR INSERT TO authenticated
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','pedagogico']));
CREATE POLICY turmas_staff_update ON public.turmas FOR UPDATE TO authenticated
  USING (private.is_member(escola_id, ARRAY['gestor','pedagogico']))
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','pedagogico']));

CREATE POLICY alunos_staff_insert ON public.alunos FOR INSERT TO authenticated
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY alunos_staff_update ON public.alunos FOR UPDATE TO authenticated
  USING (private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']))
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']));

CREATE POLICY matriculas_staff_insert ON public.matriculas FOR INSERT TO authenticated
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']));
CREATE POLICY matriculas_staff_update ON public.matriculas FOR UPDATE TO authenticated
  USING (private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']))
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','secretaria','pedagogico']));

-- A associação entre aluno e turma também deve respeitar a mesma escola.
ALTER TABLE public.matriculas
  ADD CONSTRAINT matriculas_aluno_turma_presentes
  CHECK (aluno_id IS NOT NULL AND turma_id IS NOT NULL);

COMMIT;
