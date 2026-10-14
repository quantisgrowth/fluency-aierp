-- Target: piwxpveprnwxkqlkjgux. Requires 013_contratos_limites_e_equipe_master.sql.
-- Acrescenta à assinatura somente a descrição segura do meio de pagamento.
BEGIN;

ALTER TABLE public.contratos_escola
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS pagamento_resumo text;

ALTER TABLE public.contratos_escola
  DROP CONSTRAINT IF EXISTS contratos_escola_forma_pagamento_check;
ALTER TABLE public.contratos_escola
  ADD CONSTRAINT contratos_escola_forma_pagamento_check
  CHECK (
    forma_pagamento IS NULL
    OR forma_pagamento IN ('pix', 'boleto', 'cartao_credito', 'transferencia')
  );

ALTER TABLE public.contratos_escola
  DROP CONSTRAINT IF EXISTS contratos_escola_pagamento_resumo_check;
ALTER TABLE public.contratos_escola
  ADD CONSTRAINT contratos_escola_pagamento_resumo_check
  CHECK (
    pagamento_resumo IS NULL
    OR char_length(pagamento_resumo) BETWEEN 1 AND 80
  );

COMMENT ON COLUMN public.contratos_escola.forma_pagamento IS
  'Meio de pagamento da assinatura SaaS. Não representa cobranças dos alunos.';
COMMENT ON COLUMN public.contratos_escola.pagamento_resumo IS
  'Descrição mascarada para exibição, sem credenciais ou número completo do cartão.';

CREATE OR REPLACE FUNCTION public.master_set_contract_payment(
  _school_id uuid,
  _payment_method text,
  _payment_summary text DEFAULT NULL
)
RETURNS public.contratos_escola
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_before public.contratos_escola;
  v_after public.contratos_escola;
  v_summary text := NULLIF(pg_catalog.btrim(_payment_summary), '');
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF _payment_method IS NOT NULL
    AND _payment_method NOT IN ('pix','boleto','cartao_credito','transferencia') THEN
    RAISE EXCEPTION 'Forma de pagamento inválida';
  END IF;
  IF v_summary IS NOT NULL AND char_length(v_summary) > 80 THEN
    RAISE EXCEPTION 'Resumo do pagamento excede 80 caracteres';
  END IF;
  -- Evita que um número completo de cartão seja salvo por engano.
  IF v_summary ~ '[0-9]{8,}' THEN
    RAISE EXCEPTION 'Use somente uma identificação mascarada do pagamento';
  END IF;

  SELECT * INTO v_before
  FROM public.contratos_escola
  WHERE escola_id = _school_id
  FOR UPDATE;
  IF v_before.id IS NULL THEN RAISE EXCEPTION 'Contrato da escola não encontrado'; END IF;

  UPDATE public.contratos_escola
  SET forma_pagamento = _payment_method,
      pagamento_resumo = v_summary,
      updated_at = now()
  WHERE escola_id = _school_id
  RETURNING * INTO v_after;

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    before_data, after_data
  ) VALUES (
    _school_id, auth.uid(), 'plataforma', 'contract.payment_updated',
    'contrato', v_after.id::text,
    jsonb_build_object(
      'forma_pagamento', v_before.forma_pagamento,
      'pagamento_resumo', v_before.pagamento_resumo
    ),
    jsonb_build_object(
      'forma_pagamento', v_after.forma_pagamento,
      'pagamento_resumo', v_after.pagamento_resumo
    )
  );
  RETURN v_after;
END;
$function$;

REVOKE ALL ON FUNCTION public.master_set_contract_payment(uuid,text,text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_set_contract_payment(uuid,text,text)
  TO authenticated;

COMMIT;
