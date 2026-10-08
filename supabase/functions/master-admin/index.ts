import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const appUrl = (Deno.env.get("APP_URL") ?? "http://localhost:5173").replace(/\/$/, "");
const allowedOrigins = new Set(
  (Deno.env.get("APP_ORIGINS") ?? `${appUrl},http://localhost:5173`)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : appUrl,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    return json({ error: "Autenticação necessária" }, 401, origin);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Configuração do servidor incompleta" }, 500, origin);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "Sessão inválida" }, 401, origin);

  const { data: platformAdmin } = await adminClient
    .from("platform_admins")
    .select("user_id,nome,papel,status")
    .eq("user_id", authData.user.id)
    .eq("status", "ativo")
    .maybeSingle();
  if (!platformAdmin) return json({ error: "Acesso master não autorizado" }, 403, origin);

  try {
    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "overview") {
      const results = await Promise.all([
        adminClient
          .from("escolas")
          .select("id,nome,slug,plano,status,ativa,trial_ends_at")
          .order("created_at"),
        adminClient.from("alunos").select("escola_id"),
        adminClient.from("unidades").select("escola_id"),
        adminClient.from("escola_membros").select("escola_id,papel,status"),
        adminClient.from("convites_acesso").select("escola_id,status"),
        adminClient
          .from("escola_modulos")
          .select("escola_id,modulo_id,status,preco_contratado,desconto,origem"),
        adminClient.from("escola_membros").select("id,escola_id,user_id,papel,status,created_at"),
        adminClient.from("usuarios").select("escola_id,auth_user_id,nome,email"),
        adminClient.from("unidades").select("id,escola_id,nome,status"),
        adminClient.from("escola_membro_unidades").select("escola_membro_id,escola_id,unidade_id"),
        adminClient
          .from("convites_acesso")
          .select(
            "id,escola_id,nome,email,papel,status,expires_at,created_at,email_status,email_error,email_requested_at",
          )
          .order("created_at", { ascending: false }),
        adminClient.from("platform_admins").select("user_id,nome,papel,status").order("created_at"),
        adminClient.from("modulos_catalogo").select("*").order("ordem"),
        adminClient.from("planos_catalogo").select("*").order("preco_base"),
        adminClient.from("plano_modulos").select("plano_id,modulo_id,incluido,preco_adicional"),
        adminClient.from("cupons_desconto").select("*").order("created_at", { ascending: false }),
        adminClient.from("cupom_planos").select("cupom_id,plano_id"),
        adminClient.from("contratos_escola").select("*"),
        adminClient
          .from("audit_logs")
          .select(
            "id,escola_id,actor_user_id,actor_kind,action,resource_type,resource_id,metadata,occurred_at",
          )
          .order("occurred_at", { ascending: false })
          .limit(100),
      ]);
      const [
        schoolsResult,
        studentsResult,
        unitsResult,
        membersResult,
        invitesResult,
        modulesResult,
        schoolMembersResult,
        usersResult,
        schoolUnitsResult,
        memberUnitsResult,
        schoolInvitesResult,
        teamResult,
        moduleCatalogResult,
        planCatalogResult,
        planModulesResult,
        couponsResult,
        couponPlansResult,
        contractsResult,
        logsResult,
      ] = results;
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;

      const countBySchool = (rows: Array<{ escola_id: string }> = []) =>
        rows.reduce<Record<string, number>>((counts, row) => {
          counts[row.escola_id] = (counts[row.escola_id] ?? 0) + 1;
          return counts;
        }, {});
      const students = countBySchool(studentsResult.data ?? []);
      const units = countBySchool(unitsResult.data ?? []);
      const managers = countBySchool(
        (membersResult.data ?? []).filter(
          (row) => row.papel === "gestor" && row.status === "ativo",
        ),
      );
      const pendingInvites = countBySchool(
        (invitesResult.data ?? []).filter((row) => row.status === "pendente"),
      );
      const team = await Promise.all(
        (teamResult.data ?? []).map(async (member) => {
          const { data } = await adminClient.auth.admin.getUserById(member.user_id);
          return { ...member, email: data.user?.email ?? null };
        }),
      );
      const schools = (schoolsResult.data ?? []).map((school) => ({
        ...school,
        students_count: students[school.id] ?? 0,
        units_count: units[school.id] ?? 0,
        managers_count: managers[school.id] ?? 0,
        pending_invites_count: pendingInvites[school.id] ?? 0,
        modules: (modulesResult.data ?? []).filter((row) => row.escola_id === school.id),
        members: (schoolMembersResult.data ?? [])
          .filter((member) => member.escola_id === school.id)
          .map((member) => {
            const profile = (usersResult.data ?? []).find(
              (user) => user.escola_id === school.id && user.auth_user_id === member.user_id,
            );
            return {
              ...member,
              nome: profile?.nome ?? null,
              email: profile?.email ?? null,
              unit_ids: (memberUnitsResult.data ?? [])
                .filter((access) => access.escola_membro_id === member.id)
                .map((access) => access.unidade_id),
            };
          }),
        units: (schoolUnitsResult.data ?? []).filter((row) => row.escola_id === school.id),
        invites: (schoolInvitesResult.data ?? []).filter((row) => row.escola_id === school.id),
        contract: (contractsResult.data ?? []).find((row) => row.escola_id === school.id) ?? null,
      }));
      const plans = (planCatalogResult.data ?? []).map((plan) => ({
        ...plan,
        modules: (planModulesResult.data ?? []).filter((item) => item.plano_id === plan.id),
      }));
      const coupons = (couponsResult.data ?? []).map((coupon) => ({
        ...coupon,
        plan_ids: (couponPlansResult.data ?? [])
          .filter((item) => item.cupom_id === coupon.id)
          .map((item) => item.plano_id),
      }));
      return json(
        {
          schools,
          team,
          plans,
          module_catalog: moduleCatalogResult.data ?? [],
          coupons,
          mrr: (contractsResult.data ?? [])
            .filter((contract) => ["trial", "ativo"].includes(contract.status))
            .reduce((total, contract) => total + Number(contract.mrr ?? 0), 0),
          audit_logs: logsResult.data ?? [],
        },
        200,
        origin,
      );
    }

    if (action === "list_audit_logs") {
      const filters = body.filters ?? {};
      const page = Math.max(Number(filters.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(filters.page_size ?? 20), 1), 500);
      const start = (page - 1) * pageSize;
      let query = adminClient
        .from("audit_logs")
        .select(
          "id,escola_id,actor_user_id,actor_kind,action,resource_type,resource_id,before_data,after_data,metadata,occurred_at",
          { count: "exact" },
        );
      if (filters.school_id) query = query.eq("escola_id", filters.school_id);
      if (filters.actor_user_id) query = query.eq("actor_user_id", filters.actor_user_id);
      if (filters.action)
        query = query.ilike("action", `%${String(filters.action).replaceAll("%", "")}%`);
      if (filters.from) query = query.gte("occurred_at", `${filters.from}T00:00:00.000Z`);
      if (filters.to) query = query.lte("occurred_at", `${filters.to}T23:59:59.999Z`);
      const { data, error, count } = await query
        .order("occurred_at", { ascending: false })
        .range(start, start + pageSize - 1);
      if (error) throw error;
      const actors = new Map<string, { name: string | null; email: string | null }>();
      await Promise.all(
        [...new Set((data ?? []).map((log) => log.actor_user_id).filter(Boolean))].map(
          async (id) => {
            const [{ data: authUser }, { data: platform }, { data: profile }] = await Promise.all([
              adminClient.auth.admin.getUserById(String(id)),
              adminClient.from("platform_admins").select("nome").eq("user_id", id).maybeSingle(),
              adminClient
                .from("usuarios")
                .select("nome,email")
                .eq("auth_user_id", id)
                .limit(1)
                .maybeSingle(),
            ]);
            actors.set(String(id), {
              name: platform?.nome ?? profile?.nome ?? null,
              email: authUser.user?.email ?? profile?.email ?? null,
            });
          },
        ),
      );
      return json(
        {
          logs: (data ?? []).map((log) => ({
            ...log,
            actor_name: log.actor_user_id ? (actors.get(log.actor_user_id)?.name ?? null) : null,
            actor_email: log.actor_user_id ? (actors.get(log.actor_user_id)?.email ?? null) : null,
          })),
          total: count ?? 0,
          page,
          page_size: pageSize,
        },
        200,
        origin,
      );
    }

    if (action === "create_school") {
      const input = body.input ?? {};
      const token = createToken();
      const expiresInDays = Math.min(Math.max(Number(input.expires_in_days ?? 7), 1), 30);
      const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();
      const { data, error } = await userClient.rpc("master_create_school_invite", {
        _school_name: input.school_name,
        _slug: input.slug,
        _plan: input.plan,
        _manager_name: input.manager_name,
        _manager_email: String(input.manager_email ?? "")
          .trim()
          .toLowerCase(),
        _token_hash: await sha256(token),
        _expires_at: expiresAt,
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      const inviteUrl = `${appUrl}/aceitar-convite?token=${encodeURIComponent(token)}`;
      const managerEmail = String(input.manager_email ?? "")
        .trim()
        .toLowerCase();
      const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(managerEmail, {
        redirectTo: inviteUrl,
        data: { name: input.manager_name, school_id: result.school_id, role: "gestor" },
      });
      await adminClient.from("audit_logs").insert({
        escola_id: result.school_id,
        actor_user_id: authData.user.id,
        actor_kind: "plataforma",
        action: emailError ? "invite.email_failed" : "invite.email_sent",
        resource_type: "convite",
        resource_id: String(result.invite_id),
        metadata: { email: managerEmail, error: emailError?.message ?? null },
      });
      await adminClient
        .from("convites_acesso")
        .update({
          email_status: emailError ? "falhou" : "enviado",
          email_error: emailError?.message ?? null,
          email_requested_at: new Date().toISOString(),
        })
        .eq("id", result.invite_id);
      return json(
        {
          ...result,
          invite_url: inviteUrl,
          email_sent: !emailError,
          email_error: emailError?.message,
        },
        201,
        origin,
      );
    }

    if (action === "update_school") {
      const { data, error } = await userClient.rpc("master_update_school", {
        _school_id: body.school_id,
        _changes: body.changes ?? {},
      });
      if (error) throw error;
      return json({ school: data }, 200, origin);
    }

    if (action === "set_school_module") {
      const { data, error } = await userClient.rpc("master_set_school_module", {
        _escola_id: body.school_id,
        _modulo_id: body.module_id,
        _status: body.status,
        _preco_contratado: body.price ?? null,
        _desconto: body.discount ?? null,
      });
      if (error) throw error;
      return json({ module: data }, 200, origin);
    }

    if (action === "create_invite") {
      const input = body.input ?? {};
      const token = createToken();
      const expiresInDays = Math.min(Math.max(Number(input.expires_in_days ?? 7), 1), 30);
      const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();
      const { data, error } = await userClient.rpc("master_create_school_invite_existing", {
        _school_id: input.school_id,
        _name: input.name,
        _email: String(input.email ?? "")
          .trim()
          .toLowerCase(),
        _role: input.role,
        _unit_ids: input.unit_ids ?? [],
        _token_hash: await sha256(token),
        _expires_at: expiresAt,
      });
      if (error) throw error;
      const inviteUrl = `${appUrl}/aceitar-convite?token=${encodeURIComponent(token)}`;
      const inviteEmail = String(input.email ?? "")
        .trim()
        .toLowerCase();
      let emailSent = false;
      let emailError: string | undefined;
      const { error: authInviteError } = await adminClient.auth.admin.inviteUserByEmail(
        inviteEmail,
        {
          redirectTo: inviteUrl,
          data: { name: input.name, school_id: input.school_id, role: input.role },
        },
      );
      if (!authInviteError) {
        emailSent = true;
      } else if (
        authInviteError.message.toLowerCase().includes("already") ||
        authInviteError.message.toLowerCase().includes("registered")
      ) {
        const { error: magicLinkError } = await adminClient.auth.signInWithOtp({
          email: inviteEmail,
          options: { shouldCreateUser: false, emailRedirectTo: inviteUrl },
        });
        emailSent = !magicLinkError;
        emailError = magicLinkError?.message;
      } else {
        emailError = authInviteError.message;
      }
      await adminClient.from("audit_logs").insert({
        escola_id: input.school_id,
        actor_user_id: authData.user.id,
        actor_kind: "plataforma",
        action: emailSent ? "invite.email_sent" : "invite.email_failed",
        resource_type: "convite",
        resource_id: String(data),
        metadata: { email: inviteEmail, error: emailError ?? null },
      });
      await adminClient
        .from("convites_acesso")
        .update({
          email_status: emailSent ? "enviado" : "falhou",
          email_error: emailError ?? null,
          email_requested_at: new Date().toISOString(),
        })
        .eq("id", data);
      return json(
        {
          invite_id: data,
          invite_url: inviteUrl,
          email_sent: emailSent,
          email_error: emailError,
        },
        201,
        origin,
      );
    }

    if (action === "update_member") {
      const { data, error } = await userClient.rpc("master_update_school_member", {
        _school_id: body.school_id,
        _member_id: body.member_id,
        _role: body.role,
        _status: body.status,
        _unit_ids: body.unit_ids ?? [],
      });
      if (error) throw error;
      return json({ member: data }, 200, origin);
    }

    if (action === "remove_member") {
      const { data, error } = await userClient.rpc("master_remove_school_member", {
        _school_id: body.school_id,
        _member_id: body.member_id,
      });
      if (error) throw error;
      return json({ member_id: data }, 200, origin);
    }

    if (action === "save_plan") {
      const { data, error } = await userClient.rpc("master_save_plan", {
        _plan_id: body.plan_id,
        _changes: body.changes ?? {},
        _modules: body.modules ?? [],
      });
      if (error) throw error;
      return json({ plan: data }, 200, origin);
    }

    if (action === "save_coupon") {
      const { data, error } = await userClient.rpc("master_save_coupon", {
        _coupon_id: body.coupon_id ?? null,
        _data: body.data ?? {},
        _plan_ids: body.plan_ids ?? [],
      });
      if (error) throw error;
      return json({ coupon: data }, 200, origin);
    }

    if (action === "save_contract") {
      const { data, error } = await userClient.rpc("master_save_contract", {
        _school_id: body.school_id,
        _plan_id: body.plan_id,
        _cycle: body.cycle ?? "mensal",
        _additional_units: Number(body.additional_units ?? 0),
        _student_blocks: Number(body.student_blocks ?? 0),
      });
      if (error) throw error;
      return json({ contract: data }, 200, origin);
    }

    if (action === "update_team_member") {
      const roleMap: Record<string, string> = {
        Administrador: "administrador",
        Financeiro: "financeiro",
        Desenvolvedor: "tecnico",
        Vendedor: "comercial",
      };
      const { data, error } = await userClient.rpc("master_update_platform_admin", {
        _user_id: body.user_id,
        _name: body.name,
        _role: roleMap[String(body.role)] ?? body.role,
        _status: body.status === "Ativo" ? "ativo" : "inativo",
      });
      if (error) throw error;
      return json({ member: data }, 200, origin);
    }

    if (action === "remove_team_member") {
      const { data, error } = await userClient.rpc("master_remove_platform_admin", {
        _user_id: body.user_id,
      });
      if (error) throw error;
      return json({ user_id: data }, 200, origin);
    }

    if (action === "create_team_invite") {
      const input = body.input ?? {};
      const roleMap: Record<string, string> = {
        Administrador: "administrador",
        Financeiro: "financeiro",
        Desenvolvedor: "tecnico",
        Vendedor: "comercial",
      };
      const email = String(input.email ?? "")
        .trim()
        .toLowerCase();
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${appUrl}/redefinir-senha` },
      });
      if (linkError) throw linkError;
      const userId = linkData.user?.id;
      if (!userId) throw new Error("Não foi possível preparar o acesso Master");
      const { data, error } = await adminClient
        .from("platform_admins")
        .upsert({
          user_id: userId,
          nome: String(input.name ?? "").trim(),
          papel: roleMap[String(input.role)] ?? "suporte",
          status: "ativo",
          updated_at: new Date().toISOString(),
        })
        .select("user_id,nome,papel,status")
        .single();
      if (error) throw error;
      await adminClient.from("audit_logs").insert({
        actor_user_id: authData.user.id,
        actor_kind: "plataforma",
        action: "platform_admin.invited",
        resource_type: "platform_admin",
        resource_id: userId,
        metadata: { email },
      });
      return json({ member: data, invite_url: linkData.properties.action_link }, 201, origin);
    }

    if (action === "cancel_invite") {
      const { data, error } = await userClient.rpc("master_cancel_invite", {
        _invite_id: body.invite_id,
      });
      if (error) throw error;
      return json({ invite_id: data }, 200, origin);
    }

    return json({ error: "Operação desconhecida" }, 400, origin);
  } catch (error) {
    console.error("master-admin", error);
    return json({ error: error instanceof Error ? error.message : "Falha interna" }, 400, origin);
  }
});
