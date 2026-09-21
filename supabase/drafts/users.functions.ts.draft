import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["admin", "operador", "professor", "coordenador"]);
const permissionsSchema = z.object({
  crm: z.boolean(),
  financeiro: z.boolean(),
  pedagogico: z.boolean(),
  success: z.boolean(),
});
const userInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: roleSchema,
  companies: z.array(z.string().trim().min(1)).max(50),
  permissions: permissionsSchema,
});
const userIdSchema = z.object({ id: z.string().uuid() });

type UserRole = z.infer<typeof roleSchema>;
type UserPermissions = z.infer<typeof permissionsSchema>;

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  companies: string[];
  permissions: unknown;
  invitation_status: string;
};

type RoleRow = { user_id: string; role: UserRole };

function normalizePermissions(value: unknown): UserPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { crm: false, financeiro: false, pedagogico: true, success: false };
  }
  const permissions = value as Record<string, unknown>;
  return {
    crm: permissions.crm === true,
    financeiro: permissions.financeiro === true,
    pedagogico: permissions.pedagogico === true,
    success: permissions.success === true,
  };
}

function appOrigin() {
  const request = getRequest();
  return request ? new URL(request.url).origin : "https://fluencyai.online";
}

async function assertAdmin(context: {
  supabase: { from: (table: "user_roles") => any };
  userId: string;
}) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Apenas administradores podem gerenciar usuários.");
}

export const bootstrapCurrentUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name?: string }) => z.object({ name: z.string().trim().min(2).max(120).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();
    if (existingProfile) return { ready: true };

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true });
    if (countError) throw new Error("Não foi possível validar o acesso inicial.");
    if ((count ?? 0) > 0) throw new Error("Esta conta ainda não recebeu um convite de acesso.");

    const email = typeof context.claims.email === "string" ? context.claims.email : "";
    if (!email) throw new Error("A conta autenticada não possui um e-mail válido.");
    const name = data.name ?? email.split("@")[0] ?? "Administrador";
    const fullPermissions = { crm: true, financeiro: true, pedagogico: true, success: true };

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: context.userId,
      name,
      email,
      companies: [],
      permissions: fullPermissions,
      invitation_status: "accepted",
    });
    if (profileError) throw new Error("Não foi possível criar o perfil administrativo.");
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: context.userId,
      role: "admin",
    });
    if (roleError) {
      await supabaseAdmin.from("profiles").delete().eq("id", context.userId);
      throw new Error("Não foi possível liberar o acesso administrativo.");
    }
    return { ready: true };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
      context.supabase.from("profiles").select("id,name,email,companies,permissions,invitation_status").order("name"),
      context.supabase.from("user_roles").select("user_id,role"),
    ]);
    if (profilesError || rolesError) throw new Error("Não foi possível carregar os usuários.");
    const roleByUser = new Map((roles as RoleRow[] | null)?.map((item) => [item.user_id, item.role]) ?? []);
    return ((profiles ?? []) as ProfileRow[]).map((profile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      companies: profile.companies,
      permissions: normalizePermissions(profile.permissions),
      role: roleByUser.get(profile.id) ?? "professor",
      invitationStatus: profile.invitation_status,
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const redirectTo = `${appOrigin()}/login?invited=1`;
    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo,
      data: { name: data.name },
    });
    if (inviteError || !invited.user) {
      if (inviteError?.message.toLowerCase().includes("already")) {
        throw new Error("Já existe uma conta cadastrada com este e-mail.");
      }
      throw new Error(inviteError?.message ?? "Não foi possível enviar o convite.");
    }

    const userId = invited.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      name: data.name,
      email: data.email,
      companies: data.companies,
      permissions: data.permissions,
      invitation_status: "pending",
    });
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    if (profileError || roleError) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("O convite não pôde ser concluído. Tente novamente.");
    }
    return { id: userId, email: data.email };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userInputSchema.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      email: data.email,
      user_metadata: { name: data.name },
    });
    if (authError) throw new Error(authError.message);
    const { error: profileError } = await supabaseAdmin.from("profiles").update({
      name: data.name,
      email: data.email,
      companies: data.companies,
      permissions: data.permissions,
    }).eq("id", data.id);
    if (profileError) throw new Error("Não foi possível atualizar o perfil.");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role });
    if (roleError) throw new Error("Não foi possível atualizar o cargo.");
    return { updated: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error("Não foi possível excluir a conta.");
    return { deleted: true };
  });

export const sendUserAccessEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles").select("email").eq("id", data.id).maybeSingle();
    if (profileError || !profile) throw new Error("Usuário não encontrado.");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${appOrigin()}/login?invited=1`,
    });
    if (error) throw new Error(error.message);
    return { sent: true, email: profile.email };
  });
