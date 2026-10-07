-- Target: piwxpveprnwxkqlkjgux. Requires 010_catalogo_planos_modulos.sql.
-- Gestão comercial de planos, versões e cupons no Console Master.
BEGIN;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'planos_catalogo' AND column_name = 'descricao'
  ) OR to_regclass('public.cupons_desconto') IS NOT NULL THEN
    RAISE EXCEPTION 'Migração 012 já iniciada ou aplicada; revisão manual necessária';
  END IF;
END;
$preflight$;

ALTER TABLE public.planos_catalogo
  ADD COLUMN descricao text,
  ADD COLUMN destaque text,
  ADD COLUMN recomendado boolean NOT NULL DEFAULT false,
  ADD COLUMN preco_anual numeric(12,2) CHECK (preco_anual IS NULL OR preco_anual >= 0),
  ADD COLUMN taxa_implantacao numeric(12,2) NOT NULL DEFAULT 0 CHECK (taxa_implantacao >= 0),
  ADD COLUMN limite_usuarios integer CHECK (limite_usuarios IS NULL OR limite_usuarios > 0),
  ADD COLUMN armazenamento_mb integer CHECK (armazenamento_mb IS NULL OR armazenamento_mb > 0),
  ADD COLUMN trial_dias smallint NOT NULL DEFAULT 14 CHECK (trial_dias BETWEEN 0 AND 90),
  ADD COLUMN desconto_anual numeric(5,2) NOT NULL DEFAULT 0 CHECK (desconto_anual BETWEEN 0 AND 100),
  ADD COLUMN preco_unidade_adicional numeric(12,2) NOT NULL DEFAULT 0 CHECK (preco_unidade_adicional >= 0),
  ADD COLUMN preco_100_alunos_adicionais numeric(12,2) NOT NULL DEFAULT 0 CHECK (preco_100_alunos_adicionais >= 0),
  ADD COLUMN white_label boolean NOT NULL DEFAULT false,
  ADD COLUMN dominio_personalizado boolean NOT NULL DEFAULT false,
  ADD COLUMN suporte text NOT NULL DEFAULT 'email'
    CHECK (suporte IN ('email','prioritario','dedicado')),
  ADD COLUMN versao integer NOT NULL DEFAULT 1 CHECK (versao > 0);

UPDATE public.planos_catalogo SET
  descricao = CASE id
    WHEN 'trial' THEN 'Conheça a plataforma durante 14 dias.'
    WHEN 'essencial' THEN 'Operação acadêmica e financeira para escolas menores.'
    WHEN 'profissional' THEN 'Gestão completa para escolas em crescimento.'
    WHEN 'enterprise' THEN 'Redes de escolas com white label e atendimento dedicado.'
  END,
  destaque = CASE WHEN id = 'profissional' THEN 'Mais escolhido' END,
  recomendado = id = 'profissional',
  preco_base = CASE id
    WHEN 'trial' THEN 0 WHEN 'essencial' THEN 189
    WHEN 'profissional' THEN 389 WHEN 'enterprise' THEN 1290 END,
  preco_anual = CASE id
    WHEN 'trial' THEN 0 WHEN 'essencial' THEN 1927.80
    WHEN 'profissional' THEN 3967.80 WHEN 'enterprise' THEN 13158 END,
  limite_alunos = CASE id
    WHEN 'trial' THEN 30 WHEN 'essencial' THEN 75
    WHEN 'profissional' THEN 250 WHEN 'enterprise' THEN 1500 END,
  limite_professores = CASE id
    WHEN 'trial' THEN 5 WHEN 'essencial' THEN 20
    WHEN 'profissional' THEN 80 ELSE NULL END,
  limite_unidades = CASE id
    WHEN 'trial' THEN 1 WHEN 'essencial' THEN 1
    WHEN 'profissional' THEN 2 WHEN 'enterprise' THEN 10 END,
  limite_usuarios = CASE id
    WHEN 'trial' THEN 3 WHEN 'essencial' THEN 5
    WHEN 'profissional' THEN 15 WHEN 'enterprise' THEN 80 END,
  trial_dias = CASE WHEN id = 'trial' THEN 14 ELSE 0 END,
  desconto_anual = CASE WHEN id = 'trial' THEN 0 ELSE 15 END,
  preco_unidade_adicional = CASE WHEN id IN ('profissional','enterprise') THEN 99 ELSE 0 END,
  preco_100_alunos_adicionais = CASE WHEN id IN ('profissional','enterprise') THEN 79 ELSE 0 END,
  white_label = id = 'enterprise',
  dominio_personalizado = id = 'enterprise',
  suporte = CASE WHEN id = 'enterprise' THEN 'dedicado' WHEN id = 'profissional' THEN 'prioritario' ELSE 'email' END;

CREATE TABLE public.plano_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id text NOT NULL REFERENCES public.planos_catalogo(id),
  versao integer NOT NULL,
  configuracao jsonb NOT NULL,
  alterado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plano_id, versao)
);

INSERT INTO public.plano_versoes (plano_id, versao, configuracao)
SELECT id, versao, to_jsonb(plano) FROM public.planos_catalogo AS plano;

CREATE TABLE public.cupons_desconto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE CHECK (codigo ~ '^[A-Z0-9_-]{3,30}$'),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('percentual','valor_fixo')),
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  duracao text NOT NULL DEFAULT 'primeira_cobranca'
    CHECK (duracao IN ('primeira_cobranca','meses','permanente')),
  duracao_meses smallint CHECK (duracao_meses IS NULL OR duracao_meses BETWEEN 1 AND 36),
  inicio_em timestamptz NOT NULL DEFAULT now(),
  fim_em timestamptz,
  limite_usos integer CHECK (limite_usos IS NULL OR limite_usos > 0),
  usos integer NOT NULL DEFAULT 0 CHECK (usos >= 0),
  somente_novos_clientes boolean NOT NULL DEFAULT true,
  ciclo text NOT NULL DEFAULT 'ambos' CHECK (ciclo IN ('mensal','anual','ambos')),
  cumulativo boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fim_em IS NULL OR fim_em > inicio_em),
  CHECK (tipo <> 'percentual' OR valor <= 100),
  CHECK (duracao = 'meses' OR duracao_meses IS NULL)
);

CREATE TABLE public.cupom_planos (
  cupom_id uuid NOT NULL REFERENCES public.cupons_desconto(id) ON DELETE CASCADE,
  plano_id text NOT NULL REFERENCES public.planos_catalogo(id) ON DELETE CASCADE,
  PRIMARY KEY (cupom_id, plano_id)
);

CREATE FUNCTION public.master_save_plan(_plan_id text, _changes jsonb, _modules jsonb)
RETURNS public.planos_catalogo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_before public.planos_catalogo;
  v_after public.planos_catalogo;
  v_next_version integer;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  IF _plan_id !~ '^[a-z0-9_]{2,40}$' THEN RAISE EXCEPTION 'Código de plano inválido'; END IF;

  SELECT * INTO v_before FROM public.planos_catalogo WHERE id = _plan_id FOR UPDATE;
  v_next_version := COALESCE(v_before.versao, 0) + 1;

  INSERT INTO public.planos_catalogo (
    id, nome, descricao, destaque, recomendado, preco_base, preco_anual,
    taxa_implantacao, limite_alunos, limite_professores, limite_unidades,
    limite_usuarios, armazenamento_mb, trial_dias, desconto_anual,
    preco_unidade_adicional, preco_100_alunos_adicionais, white_label,
    dominio_personalizado, suporte, ativo, versao
  ) VALUES (
    _plan_id, _changes->>'nome', _changes->>'descricao', NULLIF(_changes->>'destaque',''),
    COALESCE((_changes->>'recomendado')::boolean,false), COALESCE((_changes->>'preco_base')::numeric,0),
    NULLIF(_changes->>'preco_anual','')::numeric, COALESCE((_changes->>'taxa_implantacao')::numeric,0),
    NULLIF(_changes->>'limite_alunos','')::integer, NULLIF(_changes->>'limite_professores','')::integer,
    NULLIF(_changes->>'limite_unidades','')::integer, NULLIF(_changes->>'limite_usuarios','')::integer,
    NULLIF(_changes->>'armazenamento_mb','')::integer, COALESCE((_changes->>'trial_dias')::smallint,0),
    COALESCE((_changes->>'desconto_anual')::numeric,0),
    COALESCE((_changes->>'preco_unidade_adicional')::numeric,0),
    COALESCE((_changes->>'preco_100_alunos_adicionais')::numeric,0),
    COALESCE((_changes->>'white_label')::boolean,false),
    COALESCE((_changes->>'dominio_personalizado')::boolean,false),
    COALESCE(NULLIF(_changes->>'suporte',''),'email'), COALESCE((_changes->>'ativo')::boolean,true),
    v_next_version
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, destaque = EXCLUDED.destaque,
    recomendado = EXCLUDED.recomendado, preco_base = EXCLUDED.preco_base,
    preco_anual = EXCLUDED.preco_anual, taxa_implantacao = EXCLUDED.taxa_implantacao,
    limite_alunos = EXCLUDED.limite_alunos, limite_professores = EXCLUDED.limite_professores,
    limite_unidades = EXCLUDED.limite_unidades, limite_usuarios = EXCLUDED.limite_usuarios,
    armazenamento_mb = EXCLUDED.armazenamento_mb, trial_dias = EXCLUDED.trial_dias,
    desconto_anual = EXCLUDED.desconto_anual,
    preco_unidade_adicional = EXCLUDED.preco_unidade_adicional,
    preco_100_alunos_adicionais = EXCLUDED.preco_100_alunos_adicionais,
    white_label = EXCLUDED.white_label, dominio_personalizado = EXCLUDED.dominio_personalizado,
    suporte = EXCLUDED.suporte, ativo = EXCLUDED.ativo, versao = EXCLUDED.versao,
    updated_at = now()
  RETURNING * INTO v_after;

  DELETE FROM public.plano_modulos WHERE plano_id = _plan_id;
  INSERT INTO public.plano_modulos (plano_id, modulo_id, incluido, preco_adicional)
  SELECT _plan_id, item->>'modulo_id', COALESCE((item->>'incluido')::boolean,false),
    NULLIF(item->>'preco_adicional','')::numeric
  FROM jsonb_array_elements(COALESCE(_modules,'[]'::jsonb)) AS item;

  INSERT INTO public.plano_versoes (plano_id, versao, configuracao, alterado_por)
  VALUES (_plan_id, v_next_version,
    jsonb_build_object('plano',to_jsonb(v_after),'modulos',COALESCE(_modules,'[]'::jsonb)), auth.uid());
  PERFORM private.initialize_school_modules(escola.id, _plan_id)
  FROM public.escolas AS escola WHERE escola.plano = _plan_id;
  INSERT INTO public.audit_logs (
    actor_user_id, actor_kind, action, resource_type, resource_id, before_data, after_data
  ) VALUES (
    auth.uid(), 'plataforma', CASE WHEN v_before.id IS NULL THEN 'plan.created' ELSE 'plan.updated' END,
    'plano', _plan_id, to_jsonb(v_before), to_jsonb(v_after)
  );
  RETURN v_after;
END;
$function$;

CREATE FUNCTION public.master_save_coupon(_coupon_id uuid, _data jsonb, _plan_ids text[])
RETURNS public.cupons_desconto
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_id uuid := COALESCE(_coupon_id, gen_random_uuid());
  v_after public.cupons_desconto;
BEGIN
  IF NOT private.is_platform_admin(ARRAY['administrador','financeiro','comercial']) THEN
    RAISE EXCEPTION 'Acesso master insuficiente';
  END IF;
  INSERT INTO public.cupons_desconto (
    id,codigo,nome,tipo,valor,duracao,duracao_meses,inicio_em,fim_em,
    limite_usos,somente_novos_clientes,ciclo,cumulativo,ativo
  ) VALUES (
    v_id, upper(btrim(_data->>'codigo')), _data->>'nome', _data->>'tipo',
    (_data->>'valor')::numeric, COALESCE(_data->>'duracao','primeira_cobranca'),
    NULLIF(_data->>'duracao_meses','')::smallint,
    COALESCE(NULLIF(_data->>'inicio_em','')::timestamptz,now()),
    NULLIF(_data->>'fim_em','')::timestamptz, NULLIF(_data->>'limite_usos','')::integer,
    COALESCE((_data->>'somente_novos_clientes')::boolean,true),
    COALESCE(_data->>'ciclo','ambos'), COALESCE((_data->>'cumulativo')::boolean,false),
    COALESCE((_data->>'ativo')::boolean,true)
  ) ON CONFLICT (id) DO UPDATE SET
    codigo=EXCLUDED.codigo,nome=EXCLUDED.nome,tipo=EXCLUDED.tipo,valor=EXCLUDED.valor,
    duracao=EXCLUDED.duracao,duracao_meses=EXCLUDED.duracao_meses,
    inicio_em=EXCLUDED.inicio_em,fim_em=EXCLUDED.fim_em,limite_usos=EXCLUDED.limite_usos,
    somente_novos_clientes=EXCLUDED.somente_novos_clientes,ciclo=EXCLUDED.ciclo,
    cumulativo=EXCLUDED.cumulativo,ativo=EXCLUDED.ativo,updated_at=now()
  RETURNING * INTO v_after;
  DELETE FROM public.cupom_planos WHERE cupom_id = v_id;
  INSERT INTO public.cupom_planos (cupom_id,plano_id)
  SELECT v_id, id FROM unnest(COALESCE(_plan_ids,ARRAY[]::text[])) AS selected(id);
  INSERT INTO public.audit_logs (
    actor_user_id,actor_kind,action,resource_type,resource_id,after_data
  ) VALUES (auth.uid(),'plataforma','coupon.saved','cupom',v_id::text,to_jsonb(v_after));
  RETURN v_after;
END;
$function$;

ALTER TABLE public.plano_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons_desconto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupom_planos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.plano_versoes,public.cupons_desconto,public.cupom_planos FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.plano_versoes,public.cupons_desconto,public.cupom_planos TO authenticated;
GRANT ALL ON public.plano_versoes,public.cupons_desconto,public.cupom_planos TO service_role;
CREATE POLICY plano_versoes_master_select ON public.plano_versoes FOR SELECT TO authenticated USING (private.is_platform_admin());
CREATE POLICY cupons_master_select ON public.cupons_desconto FOR SELECT TO authenticated USING (private.is_platform_admin());
CREATE POLICY cupom_planos_master_select ON public.cupom_planos FOR SELECT TO authenticated USING (private.is_platform_admin());
REVOKE ALL ON FUNCTION public.master_save_plan(text,jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.master_save_coupon(uuid,jsonb,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.master_save_plan(text,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.master_save_coupon(uuid,jsonb,text[]) TO authenticated;

COMMIT;
