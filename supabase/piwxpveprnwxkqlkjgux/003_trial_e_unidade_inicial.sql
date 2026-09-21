-- Target: piwxpveprnwxkqlkjgux. Requires 001 and 002.
-- Self-service trial provisioning is a single transaction. The caller can
-- create only its own first school after confirming its email address.
BEGIN;

CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','inativa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id,id)
);
CREATE INDEX unidades_escola_idx ON public.unidades(escola_id);
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.unidades FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.unidades TO authenticated;
GRANT ALL ON public.unidades TO service_role;
CREATE POLICY unidades_select ON public.unidades FOR SELECT TO authenticated
  USING (private.is_member(escola_id));

CREATE FUNCTION public.create_trial_school(_school_name text, _manager_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_escola_id uuid;
  v_school_name text := btrim(_school_name);
  v_manager_name text := btrim(_manager_name);
  v_slug text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;
  IF v_school_name IS NULL OR char_length(v_school_name) NOT BETWEEN 3 AND 120
    OR v_manager_name IS NULL OR char_length(v_manager_name) NOT BETWEEN 3 AND 120 THEN
    RAISE EXCEPTION 'Informe os nomes da escola e do gestor';
  END IF;

  -- Serialize concurrent requests for the same account. One account may
  -- create one trial; additional schools require a managed account flow.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0));
  SELECT email INTO v_email FROM auth.users
    WHERE id = v_user_id AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Confirme seu e-mail antes de criar a escola';
  END IF;
  IF EXISTS (SELECT 1 FROM public.escola_membros WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Esta conta já possui uma escola';
  END IF;

  v_escola_id := gen_random_uuid();
  v_slug := pg_catalog.btrim(
    pg_catalog.regexp_replace(pg_catalog.lower(v_school_name),
      '[^a-z0-9]+', '-', 'g'), '-');
  v_slug := pg_catalog.left(coalesce(nullif(v_slug,''),'escola'), 60)
    || '-' || pg_catalog.substr(v_escola_id::text,1,8);

  INSERT INTO public.escolas (id,nome,slug,plano,status,ativa)
    VALUES (v_escola_id,v_school_name,v_slug,'trial','trial',true);
  INSERT INTO public.unidades (escola_id,nome)
    VALUES (v_escola_id,'Unidade principal');
  INSERT INTO public.escola_membros (escola_id,user_id,papel,status)
    VALUES (v_escola_id,v_user_id,'gestor','ativo');
  INSERT INTO public.usuarios (auth_user_id,escola_id,nome,email,cargo,role,status)
    VALUES (v_user_id,v_escola_id,v_manager_name,v_email,'Gestor','gestor','ativo');
  RETURN v_escola_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_trial_school(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_trial_school(text,text) TO authenticated;

COMMIT;
