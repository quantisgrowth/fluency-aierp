-- Target: piwxpveprnwxkqlkjgux. Requires 012_planos_cupons.sql.
-- Contratos comerciais, MRR, limites de plano e gestão real da equipe Master.
BEGIN;

CREATE TABLE public.contratos_escola (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL UNIQUE REFERENCES public.escolas(id) ON DELETE CASCADE,
  plano_id text NOT NULL REFERENCES public.planos_catalogo(id),
  plano_versao integer NOT NULL,
  ciclo text NOT NULL DEFAULT 'mensal' CHECK (ciclo IN ('mensal','anual')),
  status text NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('trial','ativo','inadimplente','suspenso','cancelado')),
  unidades_adicionais integer NOT NULL DEFAULT 0 CHECK (unidades_adicionais >= 0),
  blocos_100_alunos integer NOT NULL DEFAULT 0 CHECK (blocos_100_alunos >= 0),
  valor_base numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_base >= 0),
  valor_adicionais numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_adicionais >= 0),
  valor_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_total >= 0),
  mrr numeric(12,2) NOT NULL DEFAULT 0 CHECK (mrr >= 0),
  inicia_em date NOT NULL DEFAULT current_date,
  proxima_cobranca date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contrato_modulos (
  contrato_id uuid NOT NULL REFERENCES public.contratos_escola(id) ON DELETE CASCADE,
  modulo_id text NOT NULL REFERENCES public.modulos_catalogo(id),
  incluido_no_plano boolean NOT NULL DEFAULT false,
  valor_mensal numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_mensal >= 0),
  PRIMARY KEY (contrato_id, modulo_id)
);

CREATE TABLE public.contrato_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos_escola(id) ON DELETE CASCADE,
  versao integer NOT NULL,
  configuracao jsonb NOT NULL,
  alterado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contrato_id, versao)
);

CREATE INDEX contratos_escola_status_idx ON public.contratos_escola(status, escola_id);

CREATE FUNCTION public.master_save_contract(
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
  v_addons numeric(12,2);
  v_total numeric(12,2);
  v_mrr numeric(12,2);
  v_version integer;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF _cycle NOT IN ('mensal','anual') THEN RAISE EXCEPTION 'Ciclo inválido'; END IF;
  IF COALESCE(_additional_units,0) < 0 OR COALESCE(_student_blocks,0) < 0 THEN
    RAISE EXCEPTION 'Adicionais inválidos';
  END IF;

  SELECT * INTO v_plan FROM public.planos_catalogo WHERE id = _plan_id AND ativo;
  IF v_plan.id IS NULL THEN RAISE EXCEPTION 'Plano ativo não encontrado'; END IF;

  v_base := CASE WHEN _cycle = 'anual'
    THEN COALESCE(v_plan.preco_anual, v_plan.preco_base * 12)
    ELSE v_plan.preco_base END;
  v_addons := (COALESCE(_additional_units,0) * v_plan.preco_unidade_adicional)
    + (COALESCE(_student_blocks,0) * v_plan.preco_100_alunos_adicionais);
  v_total := v_base + CASE WHEN _cycle = 'anual' THEN v_addons * 12 ELSE v_addons END;
  v_mrr := CASE WHEN _cycle = 'anual' THEN v_total / 12 ELSE v_total END;

  INSERT INTO public.contratos_escola (
    escola_id,plano_id,plano_versao,ciclo,status,unidades_adicionais,
    blocos_100_alunos,valor_base,valor_adicionais,valor_total,mrr,proxima_cobranca
  ) VALUES (
    _school_id,v_plan.id,v_plan.versao,_cycle,
    CASE WHEN v_plan.id = 'trial' THEN 'trial' ELSE 'ativo' END,
    COALESCE(_additional_units,0),COALESCE(_student_blocks,0),v_base,v_addons,v_total,v_mrr,
    current_date + CASE WHEN _cycle = 'anual' THEN 365 ELSE 30 END
  ) ON CONFLICT (escola_id) DO UPDATE SET
    plano_id=EXCLUDED.plano_id,plano_versao=EXCLUDED.plano_versao,ciclo=EXCLUDED.ciclo,
    status=EXCLUDED.status,unidades_adicionais=EXCLUDED.unidades_adicionais,
    blocos_100_alunos=EXCLUDED.blocos_100_alunos,valor_base=EXCLUDED.valor_base,
    valor_adicionais=EXCLUDED.valor_adicionais,valor_total=EXCLUDED.valor_total,
    mrr=EXCLUDED.mrr,proxima_cobranca=EXCLUDED.proxima_cobranca,updated_at=now()
  RETURNING * INTO v_contract;

  DELETE FROM public.contrato_modulos WHERE contrato_id = v_contract.id;
  INSERT INTO public.contrato_modulos (contrato_id,modulo_id,incluido_no_plano,valor_mensal)
  SELECT v_contract.id, em.modulo_id, COALESCE(pm.incluido,false),
    CASE WHEN COALESCE(pm.incluido,false) THEN 0 ELSE COALESCE(pm.preco_adicional,mc.preco_base,0) END
  FROM public.escola_modulos em
  JOIN public.modulos_catalogo mc ON mc.id = em.modulo_id
  LEFT JOIN public.plano_modulos pm ON pm.plano_id = v_plan.id AND pm.modulo_id = em.modulo_id
  WHERE em.escola_id = _school_id AND em.status IN ('trial','ativo','cortesia');

  SELECT COALESCE(max(versao),0)+1 INTO v_version
  FROM public.contrato_versoes WHERE contrato_id = v_contract.id;
  INSERT INTO public.contrato_versoes (contrato_id,versao,configuracao,alterado_por)
  VALUES (v_contract.id,v_version,to_jsonb(v_contract),auth.uid());

  UPDATE public.escolas SET plano = v_plan.id, updated_at = now() WHERE id = _school_id;
  INSERT INTO public.audit_logs (
    escola_id,actor_user_id,actor_kind,action,resource_type,resource_id,after_data
  ) VALUES (
    _school_id,auth.uid(),'plataforma','contract.saved','contrato',v_contract.id::text,to_jsonb(v_contract)
  );
  RETURN v_contract;
END;
$function$;

CREATE FUNCTION public.master_update_platform_admin(
  _user_id uuid, _name text, _role text, _status text
)
RETURNS public.platform_admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE v_after public.platform_admins;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador']) THEN
    RAISE EXCEPTION 'Acesso exclusivo do administrador Master';
  END IF;
  IF char_length(btrim(_name)) NOT BETWEEN 3 AND 120 THEN RAISE EXCEPTION 'Nome inválido'; END IF;
  IF _role NOT IN ('administrador','suporte','financeiro','comercial','tecnico') THEN
    RAISE EXCEPTION 'Cargo inválido';
  END IF;
  IF _status NOT IN ('ativo','inativo','suspenso') THEN RAISE EXCEPTION 'Status inválido'; END IF;
  IF _user_id = auth.uid() AND _status <> 'ativo' THEN
    RAISE EXCEPTION 'Você não pode suspender o próprio acesso';
  END IF;
  UPDATE public.platform_admins
  SET nome=btrim(_name),papel=_role,status=_status,updated_at=now()
  WHERE user_id=_user_id RETURNING * INTO v_after;
  IF v_after.user_id IS NULL THEN RAISE EXCEPTION 'Colaborador Master não encontrado'; END IF;
  INSERT INTO public.audit_logs (actor_user_id,actor_kind,action,resource_type,resource_id,after_data)
  VALUES (auth.uid(),'plataforma','platform_admin.updated','platform_admin',_user_id::text,to_jsonb(v_after));
  RETURN v_after;
END;
$function$;

CREATE FUNCTION public.master_remove_platform_admin(_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador']) THEN
    RAISE EXCEPTION 'Acesso exclusivo do administrador Master';
  END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'Você não pode remover o próprio acesso'; END IF;
  UPDATE public.platform_admins SET status='inativo',updated_at=now() WHERE user_id=_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Colaborador Master não encontrado'; END IF;
  INSERT INTO public.audit_logs (actor_user_id,actor_kind,action,resource_type,resource_id)
  VALUES (auth.uid(),'plataforma','platform_admin.removed','platform_admin',_user_id::text);
  RETURN _user_id;
END;
$function$;

-- Cria contratos iniciais para as escolas existentes; pode ser executado novamente com segurança.
INSERT INTO public.contratos_escola (
  escola_id,plano_id,plano_versao,ciclo,status,valor_base,valor_total,mrr,proxima_cobranca
)
SELECT e.id,p.id,p.versao,'mensal',CASE WHEN p.id='trial' THEN 'trial' ELSE 'ativo' END,
  p.preco_base,p.preco_base,p.preco_base,current_date + 30
FROM public.escolas e JOIN public.planos_catalogo p ON p.id=e.plano
ON CONFLICT (escola_id) DO NOTHING;

ALTER TABLE public.contratos_escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_versoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contratos_escola,public.contrato_modulos,public.contrato_versoes FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.contratos_escola,public.contrato_modulos,public.contrato_versoes TO authenticated;
GRANT ALL ON public.contratos_escola,public.contrato_modulos,public.contrato_versoes TO service_role;
CREATE POLICY contratos_master_select ON public.contratos_escola FOR SELECT TO authenticated USING (private.is_platform_admin() OR private.is_member(escola_id,ARRAY['gestor','financeiro']));
CREATE POLICY contrato_modulos_master_select ON public.contrato_modulos FOR SELECT TO authenticated USING (private.is_platform_admin());
CREATE POLICY contrato_versoes_master_select ON public.contrato_versoes FOR SELECT TO authenticated USING (private.is_platform_admin());
REVOKE ALL ON FUNCTION public.master_save_contract(uuid,text,text,integer,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.master_update_platform_admin(uuid,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.master_remove_platform_admin(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.master_save_contract(uuid,text,text,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.master_update_platform_admin(uuid,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.master_remove_platform_admin(uuid) TO authenticated;

COMMIT;
