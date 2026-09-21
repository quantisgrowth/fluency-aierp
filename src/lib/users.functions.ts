import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Legacy endpoints targeted profiles/user_roles in another Supabase project.
 * They must fail closed until replaced by school-scoped operations targeting
 * the confirmed project (piwxpveprnwxkqlkjgux).
 */
function unavailable(): never {
  throw new Error("Gestão de usuários indisponível até a migração multiempresa.");
}

export const bootstrapCurrentUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(unavailable);
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(unavailable);
export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(unavailable);
export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(unavailable);
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(unavailable);
export const sendUserAccessEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(unavailable);
