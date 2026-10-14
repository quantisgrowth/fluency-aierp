-- Mantem plano, modulos contratados e valores do contrato sincronizados.
-- Target: piwxpveprnwxkqlkjgux. Requires 020_assinatura_pagamento_gestor.sql.
BEGIN;

CREATE OR REPLACE FUNCTION private.refresh_school_contract_totals(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_contract public.contratos_escola;
  v_plan public.planos_catalogo;
  v_units numeric(12,2);
  v_students numeric(12,2);
  v_modules numeric(12,2);
  v_monthly_addons numeric(12,2);
  v_total numeric(12,2);
BEGIN
  SELECT * INTO v_contract
  FROM public.contratos_escola
  WHERE escola_id = _school_id
  FOR UPDATE;

  IF v_contract.id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_plan
  FROM public.planos_catalogo
  WHERE id = v_contract.plano_id;

  v_units := v_contract.unidades_adicionais * COALESCE(v_plan.preco_unidade_adicional, 0);
  v_students := v_contract.blocos_100_alunos * COALESCE(v_plan.preco_100_alunos_adicionais, 0);

  SELECT COALESCE(sum(valor_mensal), 0)
  INTO v_modules
  FROM public.contrato_modulos
  WHERE contrato_id = v_contract.id
    AND incluido_no_plano = false;

  v_monthly_addons := v_units + v_students + v_modules;
  v_total := CASE
    WHEN v_contract.ciclo = 'anual'
      THEN v_contract.valor_base + (v_monthly_addons * 12)
    ELSE v_contract.valor_base + v_monthly_addons
  END;

  UPDATE public.contratos_escola
  SET valor_adicionais = v_monthly_addons,
      valor_total = v_total,
      mrr = CASE WHEN ciclo = 'anual' THEN v_total / 12 ELSE v_total END,
      updated_at = now()
  WHERE id = v_contract.id;
END;
$function$;

REVOKE ALL ON FUNCTION private.refresh_school_contract_totals(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.refresh_school_contract_totals(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.master_save_contract(
  _school_id uuid,
  _plan_id text,
  _cycle text DEFAULT 'mensal',
  _additional_units integer DEFAULT 0,
  _student_blocks integer DEFAULT 0
)
RETURNS public.contratos_escola
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_plan public.planos_catalogo;
  v_contract public.contratos_escola;
  v_base numeric(12,2);
  v_version integer;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF _cycle NOT IN ('mensal','anual') THEN RAISE EXCEPTION 'Ciclo invalido'; END IF;
  IF COALESCE(_additional_units,0) < 0 OR COALESCE(_student_blocks,0) < 0 THEN
    RAISE EXCEPTION 'Adicionais invalidos';
  END IF;

  SELECT * INTO v_plan FROM public.planos_catalogo WHERE id = _plan_id AND ativo;
  IF v_plan.id IS NULL THEN RAISE EXCEPTION 'Plano ativo nao encontrado'; END IF;

  v_base := CASE WHEN _cycle = 'anual'
    THEN COALESCE(v_plan.preco_anual, v_plan.preco_base * 12)
    ELSE v_plan.preco_base END;

  -- A alteracao do plano dispara a inicializacao dos modulos antes de montar o contrato.
  UPDATE public.escolas SET plano = v_plan.id, updated_at = now() WHERE id = _school_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Escola nao encontrada'; END IF;

  INSERT INTO public.contratos_escola (
    escola_id,plano_id,plano_versao,ciclo,status,unidades_adicionais,
    blocos_100_alunos,valor_base,valor_adicionais,valor_total,mrr,proxima_cobranca
  ) VALUES (
    _school_id,v_plan.id,v_plan.versao,_cycle,
    CASE WHEN v_plan.id = 'trial' THEN 'trial' ELSE 'ativo' END,
    COALESCE(_additional_units,0),COALESCE(_student_blocks,0),v_base,0,v_base,
    CASE WHEN _cycle = 'anual' THEN v_base / 12 ELSE v_base END,
    current_date + CASE WHEN _cycle = 'anual' THEN 365 ELSE 30 END
  ) ON CONFLICT (escola_id) DO UPDATE SET
    plano_id=EXCLUDED.plano_id,plano_versao=EXCLUDED.plano_versao,ciclo=EXCLUDED.ciclo,
    status=EXCLUDED.status,unidades_adicionais=EXCLUDED.unidades_adicionais,
    blocos_100_alunos=EXCLUDED.blocos_100_alunos,valor_base=EXCLUDED.valor_base,
    proxima_cobranca=EXCLUDED.proxima_cobranca,updated_at=now()
  RETURNING * INTO v_contract;

  DELETE FROM public.contrato_modulos WHERE contrato_id = v_contract.id;
  INSERT INTO public.contrato_modulos (contrato_id,modulo_id,incluido_no_plano,valor_mensal)
  SELECT
    v_contract.id,
    em.modulo_id,
    COALESCE(pm.incluido,false),
    CASE
      WHEN COALESCE(pm.incluido,false) THEN 0
      ELSE GREATEST(COALESCE(em.preco_contratado, pm.preco_adicional, mc.preco_base, 0) - COALESCE(em.desconto,0), 0)
    END
  FROM public.escola_modulos em
  JOIN public.modulos_catalogo mc ON mc.id = em.modulo_id
  LEFT JOIN public.plano_modulos pm ON pm.plano_id = v_plan.id AND pm.modulo_id = em.modulo_id
  WHERE em.escola_id = _school_id
    AND em.status IN ('trial','ativo','cortesia')
    AND (COALESCE(pm.incluido,false) OR em.origem = 'manual');

  PERFORM private.refresh_school_contract_totals(_school_id);
  SELECT * INTO v_contract FROM public.contratos_escola WHERE id = v_contract.id;

  SELECT COALESCE(max(versao),0)+1 INTO v_version
  FROM public.contrato_versoes WHERE contrato_id = v_contract.id;
  INSERT INTO public.contrato_versoes (contrato_id,versao,configuracao,alterado_por)
  VALUES (v_contract.id,v_version,to_jsonb(v_contract),auth.uid());

  INSERT INTO public.audit_logs (
    escola_id,actor_user_id,actor_kind,action,resource_type,resource_id,after_data
  ) VALUES (
    _school_id,auth.uid(),'plataforma','contract.saved','contrato',v_contract.id::text,to_jsonb(v_contract)
  );
  RETURN v_contract;
END;
$function$;

CREATE OR REPLACE FUNCTION public.master_set_school_module(
  _escola_id uuid,
  _modulo_id text,
  _status text,
  _preco_contratado numeric DEFAULT NULL,
  _desconto numeric DEFAULT NULL
)
RETURNS public.escola_modulos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_before public.escola_modulos;
  v_after public.escola_modulos;
  v_contract public.contratos_escola;
  v_included boolean := false;
  v_price numeric(12,2);
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF _status NOT IN ('disponivel','trial','ativo','cortesia','suspenso','cancelado') THEN
    RAISE EXCEPTION 'Status de modulo invalido';
  END IF;

  SELECT * INTO v_before FROM public.escola_modulos
  WHERE escola_id = _escola_id AND modulo_id = _modulo_id FOR UPDATE;
  IF v_before.escola_id IS NULL THEN RAISE EXCEPTION 'Modulo da escola nao encontrado'; END IF;

  SELECT * INTO v_contract FROM public.contratos_escola WHERE escola_id = _escola_id FOR UPDATE;
  IF v_contract.id IS NULL THEN RAISE EXCEPTION 'Contrato da escola nao encontrado'; END IF;

  SELECT COALESCE(pm.incluido,false),
         COALESCE(_preco_contratado, pm.preco_adicional, mc.preco_base, 0)
  INTO v_included, v_price
  FROM public.modulos_catalogo mc
  LEFT JOIN public.plano_modulos pm
    ON pm.plano_id = v_contract.plano_id AND pm.modulo_id = mc.id
  WHERE mc.id = _modulo_id;

  IF v_included AND _status NOT IN ('trial','ativo','cortesia') THEN
    RAISE EXCEPTION 'Modulo incluido no plano nao pode ser desativado individualmente';
  END IF;

  UPDATE public.escola_modulos
  SET status = _status,
      preco_contratado = CASE WHEN v_included THEN 0 ELSE v_price END,
      desconto = COALESCE(_desconto, desconto),
      origem = CASE WHEN v_included THEN 'plano' ELSE 'manual' END,
      inicio_em = CASE WHEN _status IN ('trial','ativo','cortesia') THEN COALESCE(inicio_em, now()) ELSE NULL END,
      fim_em = CASE WHEN _status IN ('cancelado') THEN now() ELSE NULL END,
      atualizado_por = auth.uid(),
      updated_at = now()
  WHERE escola_id = _escola_id AND modulo_id = _modulo_id
  RETURNING * INTO v_after;

  IF _status IN ('trial','ativo','cortesia') THEN
    INSERT INTO public.contrato_modulos (contrato_id,modulo_id,incluido_no_plano,valor_mensal)
    VALUES (
      v_contract.id,_modulo_id,v_included,
      CASE WHEN v_included THEN 0 ELSE GREATEST(v_price - COALESCE(v_after.desconto,0),0) END
    )
    ON CONFLICT (contrato_id,modulo_id) DO UPDATE SET
      incluido_no_plano=EXCLUDED.incluido_no_plano,
      valor_mensal=EXCLUDED.valor_mensal;
  ELSE
    DELETE FROM public.contrato_modulos
    WHERE contrato_id = v_contract.id AND modulo_id = _modulo_id;
  END IF;

  PERFORM private.refresh_school_contract_totals(_escola_id);

  INSERT INTO public.audit_logs (
    escola_id, actor_user_id, actor_kind, action, resource_type, resource_id,
    before_data, after_data
  ) VALUES (
    _escola_id, auth.uid(), 'plataforma', 'module.status_changed',
    'escola_modulo', _modulo_id, to_jsonb(v_before), to_jsonb(v_after)
  );
  RETURN v_after;
END;
$function$;

REVOKE ALL ON FUNCTION public.master_save_contract(uuid,text,text,integer,integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_save_contract(uuid,text,text,integer,integer)
  TO authenticated;
REVOKE ALL ON FUNCTION public.master_set_school_module(uuid,text,text,numeric,numeric)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_set_school_module(uuid,text,text,numeric,numeric)
  TO authenticated;

COMMIT;
