-- Lançamentos manuais, restritos ao gestor e ao financeiro da escola.
BEGIN;

GRANT INSERT, UPDATE ON public.transacoes_financeiras TO authenticated;

CREATE POLICY transacoes_financeiro_insert ON public.transacoes_financeiras
  FOR INSERT TO authenticated
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','financeiro']));
CREATE POLICY transacoes_financeiro_update ON public.transacoes_financeiras
  FOR UPDATE TO authenticated
  USING (private.is_member(escola_id, ARRAY['gestor','financeiro']))
  WITH CHECK (private.is_member(escola_id, ARRAY['gestor','financeiro']));

COMMIT;
