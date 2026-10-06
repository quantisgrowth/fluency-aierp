import { supabase } from "@/lib/supabase";

export type SchoolStatus = "trial" | "ativa" | "vencida" | "suspensa" | "cancelada";

export type MasterSchool = {
  id: string;
  nome: string;
  slug: string;
  plano: string;
  status: SchoolStatus;
  ativa: boolean;
  trial_ends_at: string | null;
  students_count: number;
  units_count: number;
  managers_count: number;
  pending_invites_count: number;
};

export type MasterTeamMember = {
  user_id: string;
  nome: string | null;
  email: string | null;
  papel: "administrador" | "suporte" | "financeiro" | "comercial" | "tecnico";
  status: "pendente" | "ativo" | "inativo" | "suspenso";
};

export type MasterAuditLog = {
  id: string;
  escola_id: string | null;
  actor_user_id: string | null;
  actor_kind: "usuario" | "plataforma" | "sistema" | "integracao";
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
};

export type MasterOverview = {
  schools: MasterSchool[];
  team: MasterTeamMember[];
  audit_logs: MasterAuditLog[];
};

export type CreateSchoolInput = {
  school_name: string;
  slug: string;
  plan: string;
  manager_name: string;
  manager_email: string;
  expires_in_days?: number;
};

type MasterAction =
  "overview" | "create_school" | "update_school" | "create_invite" | "cancel_invite";

async function invokeMaster<T>(action: MasterAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("master-admin", {
    body: { action, ...payload },
  });

  if (error) throw new Error(error.message || "Falha ao executar a operação do Console Master.");
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export const masterAdmin = {
  overview: () => invokeMaster<MasterOverview>("overview"),
  createSchool: (input: CreateSchoolInput) =>
    invokeMaster<{ school_id: string; invite_url: string }>("create_school", { input }),
  updateSchool: (schoolId: string, changes: Record<string, unknown>) =>
    invokeMaster<{ school: MasterSchool }>("update_school", {
      school_id: schoolId,
      changes,
    }),
  createInvite: (input: Record<string, unknown>) =>
    invokeMaster<{ invite_id: string; invite_url: string }>("create_invite", { input }),
  cancelInvite: (inviteId: string) =>
    invokeMaster<{ invite_id: string }>("cancel_invite", { invite_id: inviteId }),
};
