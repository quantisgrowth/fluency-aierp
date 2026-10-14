-- Remove flags residuais e revoga permissoes quando um modulo deixa de estar ativo.
-- Target: piwxpveprnwxkqlkjgux. Requires 022_permissoes_granulares_por_modulo.sql.
BEGIN;

WITH normalized AS (
  SELECT COALESCE(
    jsonb_object_agg(
      mc.id,
      COALESCE(
        COALESCE((u.permissoes_modulos->>mc.id)::boolean,false)
        AND em.status IN ('trial','ativo','cortesia')
        AND (em.fim_em IS NULL OR em.fim_em > now()),
        false
      )
    ),
    '{}'::jsonb
  ) AS permissions, u.id AS user_id
  FROM public.usuarios u
  CROSS JOIN public.modulos_catalogo mc
  LEFT JOIN public.escola_modulos em
    ON em.escola_id = u.escola_id AND em.modulo_id = mc.id
  WHERE mc.ativo
  GROUP BY u.id,u.permissoes_modulos
)
UPDATE public.usuarios u
SET permissoes_modulos = normalized.permissions,
    updated_at = now()
FROM normalized
WHERE u.id = normalized.user_id
  AND u.permissoes_modulos IS DISTINCT FROM normalized.permissions;

CREATE OR REPLACE FUNCTION private.revoke_inactive_module_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF OLD.status IN ('trial','ativo','cortesia')
     AND NEW.status NOT IN ('trial','ativo','cortesia') THEN
    UPDATE public.usuarios
    SET permissoes_modulos = jsonb_set(
          permissoes_modulos,
          ARRAY[NEW.modulo_id],
          'false'::jsonb,
          true
        ),
        updated_at = now()
    WHERE escola_id = NEW.escola_id
      AND COALESCE((permissoes_modulos->>NEW.modulo_id)::boolean,false);

    INSERT INTO public.audit_logs (
      escola_id,actor_user_id,actor_kind,action,resource_type,resource_id,metadata
    ) VALUES (
      NEW.escola_id,auth.uid(),'sistema','module.permissions_revoked','escola_modulo',
      NEW.modulo_id,jsonb_build_object('status_anterior',OLD.status,'status_atual',NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS escola_modulo_revoke_permissions ON public.escola_modulos;
CREATE TRIGGER escola_modulo_revoke_permissions
AFTER UPDATE OF status ON public.escola_modulos
FOR EACH ROW
EXECUTE FUNCTION private.revoke_inactive_module_permissions();

REVOKE ALL ON FUNCTION private.revoke_inactive_module_permissions()
  FROM PUBLIC,anon,authenticated;

COMMIT;
