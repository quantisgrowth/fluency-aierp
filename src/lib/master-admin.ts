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
  modules: MasterSchoolModule[];
  members: MasterSchoolMember[];
  units: MasterSchoolUnit[];
  invites: MasterSchoolInvite[];
  contract: MasterContract | null;
};

export type MasterContract = {
  id: string;
  escola_id: string;
  plano_id: string;
  plano_versao: number;
  ciclo: "mensal" | "anual";
  status: "trial" | "ativo" | "inadimplente" | "suspenso" | "cancelado";
  unidades_adicionais: number;
  blocos_100_alunos: number;
  valor_base: number;
  valor_adicionais: number;
  valor_total: number;
  mrr: number;
  proxima_cobranca: string | null;
};

export type MasterSchoolModule = {
  escola_id: string;
  modulo_id: string;
  status: "disponivel" | "trial" | "ativo" | "cortesia" | "suspenso" | "cancelado";
  preco_contratado: number;
  desconto: number;
  origem: string;
};

export type MasterSchoolMember = {
  id: string;
  escola_id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  papel: string;
  status: string;
  created_at: string;
  unit_ids: string[];
};

export type MasterSchoolUnit = { id: string; escola_id: string; nome: string; status: string };
export type MasterSchoolInvite = {
  id: string;
  escola_id: string;
  nome: string | null;
  email: string;
  papel: string;
  status: string;
  expires_at: string;
  created_at: string;
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
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  actor_name?: string | null;
  actor_email?: string | null;
  occurred_at: string;
};

export type MasterAuditFilters = {
  school_id?: string;
  actor_user_id?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
};

export type MasterAuditPage = {
  logs: MasterAuditLog[];
  total: number;
  page: number;
  page_size: number;
};

export type MasterModuleCatalog = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_base: number;
  requer_configuracao: boolean;
  ativo: boolean;
  ordem: number;
};

export type MasterPlanModule = {
  plano_id: string;
  modulo_id: string;
  incluido: boolean;
  preco_adicional: number | null;
};

export type MasterPlan = {
  id: string;
  nome: string;
  descricao: string | null;
  destaque: string | null;
  recomendado: boolean;
  preco_base: number;
  preco_anual: number | null;
  taxa_implantacao: number;
  limite_alunos: number | null;
  limite_professores: number | null;
  limite_unidades: number | null;
  limite_usuarios: number | null;
  armazenamento_mb: number | null;
  trial_dias: number;
  desconto_anual: number;
  preco_unidade_adicional: number;
  preco_100_alunos_adicionais: number;
  white_label: boolean;
  dominio_personalizado: boolean;
  suporte: "email" | "prioritario" | "dedicado";
  ativo: boolean;
  versao: number;
  modules: MasterPlanModule[];
};

export type MasterCoupon = {
  id: string;
  codigo: string;
  nome: string;
  tipo: "percentual" | "valor_fixo";
  valor: number;
  duracao: "primeira_cobranca" | "meses" | "permanente";
  duracao_meses: number | null;
  inicio_em: string;
  fim_em: string | null;
  limite_usos: number | null;
  usos: number;
  somente_novos_clientes: boolean;
  ciclo: "mensal" | "anual" | "ambos";
  cumulativo: boolean;
  ativo: boolean;
  plan_ids: string[];
};

export type MasterOverview = {
  schools: MasterSchool[];
  team: MasterTeamMember[];
  plans: MasterPlan[];
  module_catalog: MasterModuleCatalog[];
  coupons: MasterCoupon[];
  audit_logs: MasterAuditLog[];
  mrr: number;
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
  | "overview"
  | "create_school"
  | "update_school"
  | "set_school_module"
  | "create_invite"
  | "update_member"
  | "remove_member"
  | "save_plan"
  | "save_coupon"
  | "save_contract"
  | "update_team_member"
  | "remove_team_member"
  | "create_team_invite"
  | "list_audit_logs"
  | "cancel_invite";

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
  setSchoolModule: (schoolId: string, moduleId: string, active: boolean) =>
    invokeMaster<{ module: MasterSchoolModule }>("set_school_module", {
      school_id: schoolId,
      module_id: moduleId,
      status: active ? "ativo" : "disponivel",
    }),
  createInvite: (input: Record<string, unknown>) =>
    invokeMaster<{ invite_id: string; invite_url: string }>("create_invite", { input }),
  updateMember: (input: {
    school_id: string;
    member_id: string;
    role: string;
    status: string;
    unit_ids?: string[];
  }) => invokeMaster<{ member: MasterSchoolMember }>("update_member", input),
  removeMember: (schoolId: string, memberId: string) =>
    invokeMaster<{ member_id: string }>("remove_member", {
      school_id: schoolId,
      member_id: memberId,
    }),
  savePlan: (planId: string, changes: Record<string, unknown>, modules: MasterPlanModule[]) =>
    invokeMaster<{ plan: MasterPlan }>("save_plan", {
      plan_id: planId,
      changes,
      modules,
    }),
  saveCoupon: (couponId: string | null, data: Record<string, unknown>, planIds: string[]) =>
    invokeMaster<{ coupon: MasterCoupon }>("save_coupon", {
      coupon_id: couponId,
      data,
      plan_ids: planIds,
    }),
  saveContract: (input: {
    school_id: string;
    plan_id: string;
    cycle: "mensal" | "anual";
    additional_units: number;
    student_blocks: number;
  }) => invokeMaster<{ contract: MasterContract }>("save_contract", input),
  updateTeamMember: (input: { user_id: string; name: string; role: string; status: string }) =>
    invokeMaster<{ member: MasterTeamMember }>("update_team_member", input),
  removeTeamMember: (userId: string) =>
    invokeMaster<{ user_id: string }>("remove_team_member", { user_id: userId }),
  createTeamInvite: (input: { name: string; email: string; role: string }) =>
    invokeMaster<{ member: MasterTeamMember; invite_url: string }>("create_team_invite", { input }),
  listAuditLogs: (filters: MasterAuditFilters) =>
    invokeMaster<MasterAuditPage>("list_audit_logs", { filters }),
  cancelInvite: (inviteId: string) =>
    invokeMaster<{ invite_id: string }>("cancel_invite", { invite_id: inviteId }),
};
