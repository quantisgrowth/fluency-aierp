import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Building,
  ShieldAlert,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  LogOut,
  Wallet,
  Users,
  Key,
  Activity,
  Terminal,
  UserPlus,
  Save,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Check,
  Edit2,
  FileText,
  X,
  Palette,
  Type,
  Layout,
  Trash2,
  BadgePercent,
  Package,
  Download,
  Search,
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { toast } from "sonner";
import { checkSupabaseConnection } from "@/lib/supabase";
import {
  masterAdmin,
  type MasterAuditLog,
  type MasterCoupon,
  type MasterContract,
  type MasterModuleCatalog,
  type MasterOverview,
  type MasterPlan,
  type MasterPlanModule,
  type MasterSchoolInvite,
  type MasterSchoolMember,
  type MasterSchoolModule,
  type MasterSchoolUnit,
} from "@/lib/master-admin";

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Painel Master — Fluency AI" },
      { name: "description", content: "Painel de controle geral da plataforma White-Label." },
    ],
  }),
  component: SuperAdminPage,
});

type PaymentLog = {
  id: string;
  date: string;
  amount: number;
  status: "Pago" | "Pendente" | "Vencido";
  method: "Pix" | "Cartão" | "Boleto";
};

type SchoolTenant = {
  id: string;
  name: string;
  subdominio: string;
  status: "Ativo" | "Inativo" | "Atrasado";
  studentsCount: number;
  teachersLimit: number;
  modules: MasterSchoolModule[];
  members: MasterSchoolMember[];
  units: MasterSchoolUnit[];
  invites: MasterSchoolInvite[];
  paymentHistory: PaymentLog[];
  plan: string;
  rawStatus: "trial" | "ativa" | "vencida" | "suspensa" | "cancelada";
  unitsCount: number;
  managersCount: number;
  pendingInvitesCount: number;
  contract: MasterContract | null;
};

type MasterUser = {
  id: string;
  name: string;
  email: string;
  role: "Administrador" | "Financeiro" | "Desenvolvedor" | "Vendedor";
  status: "Ativo" | "Inativo";
};

type MasterTab = "schools" | "plans" | "status" | "logs" | "team" | "customization" | "profile";

const roleLabels: Record<string, MasterUser["role"]> = {
  administrador: "Administrador",
  financeiro: "Financeiro",
  tecnico: "Desenvolvedor",
  suporte: "Desenvolvedor",
  comercial: "Vendedor",
};

const schoolModuleLabels: Record<string, string> = {
  core: "Pedagógico",
  financeiro: "Financeiro",
  crm: "CRM",
  success: "Retenção",
  captacao: "Captação",
  portal_aluno: "Portal do aluno",
  asaas: "ASAAS",
  nota_fiscal: "Nota fiscal",
};

const isEnabledModule = (module: MasterSchoolModule) =>
  ["trial", "ativo", "cortesia"].includes(module.status);

const emptyPlan = (): MasterPlan => ({
  id: "",
  nome: "",
  descricao: "",
  destaque: null,
  recomendado: false,
  preco_base: 0,
  preco_anual: null,
  taxa_implantacao: 0,
  limite_alunos: 50,
  limite_professores: 10,
  limite_unidades: 1,
  limite_usuarios: 3,
  armazenamento_mb: 1024,
  trial_dias: 0,
  desconto_anual: 15,
  preco_unidade_adicional: 99,
  preco_100_alunos_adicionais: 79,
  white_label: false,
  dominio_personalizado: false,
  suporte: "email",
  ativo: true,
  versao: 0,
  modules: [],
});

function mapOverview(data: MasterOverview) {
  const schools: SchoolTenant[] = data.schools.map((school) => ({
    id: school.id,
    name: school.nome,
    subdominio: `${school.slug}.fluencyai.online`,
    status:
      school.status === "ativa" || school.status === "trial"
        ? "Ativo"
        : school.status === "vencida"
          ? "Atrasado"
          : "Inativo",
    rawStatus: school.status,
    plan: school.plano,
    studentsCount: school.students_count,
    teachersLimit: 0,
    unitsCount: school.units_count,
    managersCount: school.managers_count,
    pendingInvitesCount: school.pending_invites_count,
    modules: school.modules ?? [],
    members: school.members ?? [],
    units: school.units ?? [],
    invites: school.invites ?? [],
    contract: school.contract ?? null,
    paymentHistory: [],
  }));
  const team: MasterUser[] = data.team.map((member) => ({
    id: member.user_id,
    name: member.nome || "Nome não informado",
    email: member.email || "E-mail indisponível",
    role: roleLabels[member.papel] || "Desenvolvedor",
    status: member.status === "ativo" ? "Ativo" : "Inativo",
  }));
  return { schools, team };
}

function SuperAdminPage() {
  const [schools, setSchools] = useState<SchoolTenant[]>([]);
  const [team, setTeam] = useState<MasterUser[]>([]);
  const [plans, setPlans] = useState<MasterPlan[]>([]);
  const [moduleCatalog, setModuleCatalog] = useState<MasterModuleCatalog[]>([]);
  const [coupons, setCoupons] = useState<MasterCoupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<MasterAuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<MasterAuditLog | null>(null);
  const [auditFilters, setAuditFilters] = useState({
    school_id: "",
    actor_user_id: "",
    action: "",
    from: "",
    to: "",
  });
  const [mrr, setMrr] = useState(0);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MasterTab>("schools");

  // System Health States
  const [healthStatus, setHealthStatus] = useState({
    supabase: true,
    stripe: true,
    crm: true,
    aws: true,
  });
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);

  const testSupabaseLive = async (showToast = false) => {
    setIsCheckingSupabase(true);
    try {
      const res = await checkSupabaseConnection();
      setHealthStatus((prev) => ({ ...prev, supabase: res.connected }));
      setSupabaseLatency(res.latencyMs);
      if (showToast) {
        if (res.connected) {
          toast.success(`Supabase Online! Latência: ${res.latencyMs}ms`);
        } else {
          toast.error(res.message || "Erro ao conectar com Supabase");
        }
      }
    } catch {
      setHealthStatus((prev) => ({ ...prev, supabase: false }));
      if (showToast) toast.error("Falha ao comunicar com o Supabase");
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  useEffect(() => {
    testSupabaseLive(false);
  }, []);

  // Modal Editing States - Schools
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolTenant | null>(null);
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [newSchool, setNewSchool] = useState({
    schoolName: "",
    slug: "",
    plan: "trial",
    managerName: "",
    managerEmail: "",
  });
  const [schoolInvite, setSchoolInvite] = useState({ name: "", email: "", role: "gestor" });
  const [isInvitingSchoolUser, setIsInvitingSchoolUser] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MasterPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    codigo: "",
    nome: "",
    tipo: "percentual" as MasterCoupon["tipo"],
    valor: 10,
    duracao: "primeira_cobranca" as MasterCoupon["duracao"],
    duracao_meses: 3,
    limite_usos: "",
    fim_em: "",
    ciclo: "ambos" as MasterCoupon["ciclo"],
    somente_novos_clientes: true,
    cumulativo: false,
    ativo: true,
    plan_ids: [] as string[],
  });

  // Modal Editing States - Team Users
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<MasterUser | null>(null);

  // Master User Registry Form
  const [teamName, setTeamName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamRole, setTeamRole] = useState<MasterUser["role"]>("Administrador");

  // Profile data states
  const [profileName, setProfileName] = useState("Felipe Medeiros");
  const [profileEmail, setProfileEmail] = useState("super@fluency.ai");
  const [profileCnpj, setProfileCnpj] = useState("12.345.678/0001-90");
  const [profileKey, setProfileKey] = useState("super_secret");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileAvatarId, setProfileAvatarId] = useState("avatar-1"); // seed indicator

  // Platform customization states (Base White-Label)
  const [customLogoName, setCustomLogoName] = useState("Fluency AI Master");
  const [customTypography, setCustomTypography] = useState("Inter");
  const [customPrimaryColor, setCustomPrimaryColor] = useState("#8b5cf6");
  const [customDefaultMode, setCustomDefaultMode] = useState<"dark" | "light">("dark");

  const avatarOptions = [
    { id: "avatar-1", bg: "bg-primary/20 text-primary" },
    { id: "avatar-2", bg: "bg-emerald-500/20 text-emerald-400" },
    { id: "avatar-3", bg: "bg-indigo-500/20 text-indigo-400" },
  ];

  const loadMasterData = async () => {
    setIsLoadingMaster(true);
    setMasterError(null);
    try {
      const data = await masterAdmin.overview();
      const mapped = mapOverview(data);
      setSchools(mapped.schools);
      setTeam(mapped.team);
      setPlans(data.plans ?? []);
      setModuleCatalog(data.module_catalog ?? []);
      setCoupons(data.coupons ?? []);
      setAuditLogs(data.audit_logs);
      setMrr(Number(data.mrr ?? 0));
    } catch (error) {
      setMasterError(
        error instanceof Error ? error.message : "Não foi possível carregar o Console Master.",
      );
    } finally {
      setIsLoadingMaster(false);
    }
  };

  const loadAuditLogs = async (page = auditPage) => {
    setAuditLoading(true);
    try {
      const result = await masterAdmin.listAuditLogs({
        ...auditFilters,
        school_id: auditFilters.school_id || undefined,
        actor_user_id: auditFilters.actor_user_id || undefined,
        action: auditFilters.action || undefined,
        from: auditFilters.from || undefined,
        to: auditFilters.to || undefined,
        page,
        page_size: 20,
      });
      setAuditLogs(result.logs);
      setAuditTotal(result.total);
      setAuditPage(result.page);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível consultar a auditoria.",
      );
    } finally {
      setAuditLoading(false);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const result = await masterAdmin.listAuditLogs({
        ...auditFilters,
        school_id: auditFilters.school_id || undefined,
        actor_user_id: auditFilters.actor_user_id || undefined,
        action: auditFilters.action || undefined,
        from: auditFilters.from || undefined,
        to: auditFilters.to || undefined,
        page: 1,
        page_size: 500,
      });
      const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const rows = result.logs.map((log) =>
        [
          log.occurred_at,
          log.actor_name ?? log.actor_email ?? log.actor_kind,
          schools.find((school) => school.id === log.escola_id)?.name ?? "Plataforma",
          log.action,
          log.resource_type,
          log.resource_id ?? "",
          JSON.stringify(log.metadata ?? {}),
        ]
          .map(escape)
          .join(","),
      );
      const csv = ["data,usuario,escola,acao,recurso,recurso_id,metadata", ...rows].join("\n");
      const url = URL.createObjectURL(
        new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${result.logs.length} registros exportados.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível exportar os registros.",
      );
    }
  };

  useEffect(() => {
    void loadMasterData();
    try {
      const savedLogo = window.localStorage.getItem("fluency-ai:custom-logo");
      if (savedLogo) setCustomLogoName(savedLogo);
      const savedColor = window.localStorage.getItem("fluency-ai:custom-color");
      if (savedColor) setCustomPrimaryColor(savedColor);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (activeTab === "logs") void loadAuditLogs(1);
    // A consulta é refeita ao abrir a aba; filtros são aplicados pelo botão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleToggleStatus = async (schoolId: string) => {
    const school = schools.find((item) => item.id === schoolId);
    if (!school) return;
    const activating = school.status !== "Ativo";
    try {
      await masterAdmin.updateSchool(schoolId, {
        status: activating ? "ativa" : "suspensa",
        ativa: activating,
      });
      await loadMasterData();
      toast.success(`Situação da escola ${school.name} alterada com sucesso.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a escola.");
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamEmail.trim()) {
      toast.error("Por favor, preencha todos os campos do colaborador!");
      return;
    }
    try {
      const result = await masterAdmin.createTeamInvite({
        name: teamName,
        email: teamEmail,
        role: teamRole,
      });
      await navigator.clipboard.writeText(result.invite_url);
      setTeamName("");
      setTeamEmail("");
      await loadMasterData();
      toast.success("Acesso Master criado e link seguro copiado.", {
        description:
          "Envie o link ao colaborador. O envio automático de e-mail será configurado depois.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o colaborador.");
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!window.confirm("Desativar o acesso deste colaborador Master?")) return;
    try {
      await masterAdmin.removeTeamMember(id);
      await loadMasterData();
      toast.success("Acesso Master desativado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível desativar o acesso.");
    }
  };

  // Save Customization tab settings
  const handleSaveCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.setItem("fluency-ai:custom-logo", customLogoName);
      window.localStorage.setItem("fluency-ai:custom-color", customPrimaryColor);
      toast.success("Preferências visuais da base salvas com sucesso!", {
        description: "Branding padrão injetado no container da plataforma.",
      });
    } catch {
      toast.error("Erro ao salvar personalização.");
    }
  };

  // Edit modals save triggers
  const handleSaveEditingSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    setIsSavingSchool(true);
    try {
      await masterAdmin.updateSchool(editingSchool.id, {
        nome: editingSchool.name,
        slug: editingSchool.subdominio.split(".")[0],
        status:
          editingSchool.status === "Ativo"
            ? "ativa"
            : editingSchool.status === "Atrasado"
              ? "vencida"
              : "suspensa",
        ativa: editingSchool.status === "Ativo",
        plano: editingSchool.plan,
      });
      await masterAdmin.saveContract({
        school_id: editingSchool.id,
        plan_id: editingSchool.plan,
        cycle: editingSchool.contract?.ciclo ?? "mensal",
        additional_units: editingSchool.contract?.unidades_adicionais ?? 0,
        student_blocks: editingSchool.contract?.blocos_100_alunos ?? 0,
      });
      await loadMasterData();
      setIsSchoolModalOpen(false);
      toast.success(`Dados da escola "${editingSchool.name}" salvos com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a escola.");
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchool(true);
    try {
      const result = await masterAdmin.createSchool({
        school_name: newSchool.schoolName,
        slug: newSchool.slug,
        plan: newSchool.plan,
        manager_name: newSchool.managerName,
        manager_email: newSchool.managerEmail,
      });
      await navigator.clipboard.writeText(result.invite_url);
      await loadMasterData();
      setIsCreateSchoolOpen(false);
      setNewSchool({ schoolName: "", slug: "", plan: "trial", managerName: "", managerEmail: "" });
      if (result.email_sent) {
        toast.success("Escola criada e convite enviado por e-mail.", {
          description: "O link seguro também foi copiado.",
        });
      } else {
        toast.warning("Escola criada, mas o e-mail não foi entregue.", {
          description: result.email_error || "O link seguro foi copiado para envio manual.",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a escola.");
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleToggleSchoolModule = async (module: MasterSchoolModule) => {
    if (!editingSchool) return;
    const enabled = isEnabledModule(module);
    setIsSavingSchool(true);
    try {
      await masterAdmin.setSchoolModule(editingSchool.id, module.modulo_id, !enabled);
      await loadMasterData();
      setEditingSchool((current) =>
        current
          ? {
              ...current,
              modules: current.modules.map((item) =>
                item.modulo_id === module.modulo_id
                  ? { ...item, status: enabled ? "disponivel" : "ativo" }
                  : item,
              ),
            }
          : current,
      );
      toast.success(
        `${schoolModuleLabels[module.modulo_id] ?? module.modulo_id} ${enabled ? "desabilitado" : "habilitado"}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o módulo.");
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleCreateSchoolInvite = async () => {
    if (!editingSchool || !schoolInvite.name.trim() || !schoolInvite.email.trim()) {
      toast.error("Informe nome e e-mail do usuário.");
      return;
    }
    setIsInvitingSchoolUser(true);
    try {
      const result = await masterAdmin.createInvite({
        school_id: editingSchool.id,
        name: schoolInvite.name,
        email: schoolInvite.email,
        role: schoolInvite.role,
        unit_ids: schoolInvite.role === "gestor" ? editingSchool.units.map((unit) => unit.id) : [],
      });
      const requestedAt = new Date().toISOString();
      const optimisticInvite: MasterSchoolInvite = {
        id: result.invite_id,
        escola_id: editingSchool.id,
        nome: schoolInvite.name.trim(),
        email: schoolInvite.email.trim().toLowerCase(),
        papel: schoolInvite.role,
        status: "pendente",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: requestedAt,
        email_status: result.email_sent ? "enviado" : "falhou",
        email_error: result.email_error || null,
        email_requested_at: requestedAt,
      };
      setEditingSchool({
        ...editingSchool,
        invites: [optimisticInvite, ...editingSchool.invites],
      });
      setSchoolInvite({ name: "", email: "", role: "gestor" });
      let linkCopied = false;
      try {
        await navigator.clipboard.writeText(result.invite_url);
        linkCopied = true;
      } catch {
        // Clipboard permission is optional and must not turn a created invite into an error.
      }
      if (result.email_sent) {
        toast.success("Solicitação de e-mail aceita pelo servidor SMTP.", {
          description: linkCopied ? "O link seguro também foi copiado." : undefined,
        });
      } else {
        toast.warning("Convite criado, mas o servidor de e-mail recusou o envio.", {
          description:
            result.email_error ||
            (linkCopied
              ? "O link seguro foi copiado para envio manual."
              : "Cancele e recrie o convite após corrigir o SMTP."),
        });
      }
      void loadMasterData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o convite.");
    } finally {
      setIsInvitingSchoolUser(false);
    }
  };

  const handleCancelSchoolInvite = async (invite: MasterSchoolInvite) => {
    if (!editingSchool) return;
    if (!window.confirm(`Cancelar o convite pendente enviado para ${invite.email}?`)) return;
    setIsInvitingSchoolUser(true);
    try {
      await masterAdmin.cancelInvite(invite.id);
      setEditingSchool({
        ...editingSchool,
        invites: editingSchool.invites.map((item) =>
          item.id === invite.id ? { ...item, status: "cancelado" } : item,
        ),
      });
      await loadMasterData();
      toast.success("Convite cancelado. Agora você pode criar um novo convite para este e-mail.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar o convite.");
    } finally {
      setIsInvitingSchoolUser(false);
    }
  };

  const handleUpdateSchoolMember = async (
    member: MasterSchoolMember,
    changes: { role?: string; status?: string },
  ) => {
    if (!editingSchool) return;
    try {
      await masterAdmin.updateMember({
        school_id: editingSchool.id,
        member_id: member.id,
        role: changes.role ?? member.papel,
        status: changes.status ?? member.status,
        unit_ids: member.unit_ids,
      });
      const nextMember = {
        ...member,
        papel: changes.role ?? member.papel,
        status: changes.status ?? member.status,
      };
      setEditingSchool({
        ...editingSchool,
        members: editingSchool.members.map((item) => (item.id === member.id ? nextMember : item)),
      });
      await loadMasterData();
      toast.success("Acesso do usuário atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o acesso.");
    }
  };

  const handleRemoveSchoolMember = async (member: MasterSchoolMember) => {
    if (!editingSchool) return;
    const identifiedAs = member.email || member.nome || "este usuário";
    if (
      !window.confirm(
        `Remover ${identifiedAs} desta escola? A conta Master e o login de autenticação serão preservados.`,
      )
    ) {
      return;
    }
    try {
      await masterAdmin.removeMember(editingSchool.id, member.id);
      setEditingSchool({
        ...editingSchool,
        members: editingSchool.members.filter((item) => item.id !== member.id),
      });
      await loadMasterData();
      toast.success("Usuário removido da escola. A conta de autenticação foi preservada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o usuário.");
    }
  };

  const openPlanEditor = (plan?: MasterPlan) => {
    const base = plan ? { ...plan } : emptyPlan();
    base.modules = moduleCatalog.map((module) => {
      const current = plan?.modules.find((item) => item.modulo_id === module.id);
      return (
        current ?? {
          plano_id: plan?.id ?? "",
          modulo_id: module.id,
          incluido: false,
          preco_adicional: module.preco_base,
        }
      );
    });
    setEditingPlan(base);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPlan) return;
    const planId = editingPlan.id
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    if (!planId || !editingPlan.nome.trim()) {
      toast.error("Informe o código e o nome do plano.");
      return;
    }
    setIsSavingPlan(true);
    try {
      const { modules, id: _id, versao: _version, ...changes } = editingPlan;
      await masterAdmin.savePlan(
        planId,
        changes,
        modules.map((module) => ({ ...module, plano_id: planId })),
      );
      await loadMasterData();
      setIsPlanModalOpen(false);
      toast.success("Plano salvo e nova versão registrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o plano.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleSaveCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingCoupon(true);
    try {
      const { plan_ids, ...data } = couponForm;
      await masterAdmin.saveCoupon(
        null,
        {
          ...data,
          duracao_meses: couponForm.duracao === "meses" ? couponForm.duracao_meses : null,
        },
        plan_ids,
      );
      await loadMasterData();
      setIsCouponModalOpen(false);
      setCouponForm({
        codigo: "",
        nome: "",
        tipo: "percentual",
        valor: 10,
        duracao: "primeira_cobranca",
        duracao_meses: 3,
        limite_usos: "",
        fim_em: "",
        ciclo: "ambos",
        somente_novos_clientes: true,
        cumulativo: false,
        ativo: true,
        plan_ids: [],
      });
      toast.success("Cupom salvo com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o cupom.");
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const handleSaveEditingTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamMember) return;

    try {
      await masterAdmin.updateTeamMember({
        user_id: editingTeamMember.id,
        name: editingTeamMember.name,
        role: editingTeamMember.role,
        status: editingTeamMember.status,
      });
      await loadMasterData();
      setIsTeamModalOpen(false);
      toast.success("Colaborador Master atualizado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o colaborador.",
      );
    }
  };

  const handleToggleHealth = (service: keyof typeof healthStatus) => {
    const nextVal = !healthStatus[service];
    setHealthStatus((prev) => ({ ...prev, [service]: nextVal }));
    if (!nextVal) {
      toast.warning(`Simulação de falha: Serviço "${service.toUpperCase()}" está OFFLINE!`);
    } else {
      toast.success(`Serviço "${service.toUpperCase()}" restabelecido com sucesso.`);
    }
  };

  const planOptions = plans.length
    ? plans.filter((plan) => plan.ativo).map((plan) => ({ id: plan.id, nome: plan.nome }))
    : [
        { id: "trial", nome: "Teste gratuito" },
        { id: "essencial", nome: "Essencial" },
        { id: "profissional", nome: "Profissional" },
        { id: "enterprise", nome: "Enterprise" },
      ];
  const selectedPlan = editingSchool ? plans.find((plan) => plan.id === editingSchool.plan) : null;
  const contractCycle = editingSchool?.contract?.ciclo ?? "mensal";
  const extraUnits = editingSchool?.contract?.unidades_adicionais ?? 0;
  const studentBlocks = editingSchool?.contract?.blocos_100_alunos ?? 0;
  const monthlyExtras = selectedPlan
    ? extraUnits * Number(selectedPlan.preco_unidade_adicional) +
      studentBlocks * Number(selectedPlan.preco_100_alunos_adicionais)
    : 0;
  const contractTotal = selectedPlan
    ? contractCycle === "anual"
      ? Number(selectedPlan.preco_anual ?? Number(selectedPlan.preco_base) * 12) +
        monthlyExtras * 12
      : Number(selectedPlan.preco_base) + monthlyExtras
    : 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1600px] space-y-8 bg-[#05060a] p-4 text-foreground animate-in fade-in duration-300 sm:p-6 lg:p-8 2xl:px-12">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
            <Sliders className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-base font-bold text-white">{customLogoName}</h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mt-0.5">
              Console de Administração Geral
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            toast.success("Desconectado do Painel Master!");
            window.localStorage.removeItem("fluency-ai:active-role");
            window.localStorage.removeItem("fluency-ai:active-company");
            window.location.href = "/manager";
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3.5 py-2 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer text-neutral-300 hover:text-white"
        >
          <LogOut className="size-3.5" /> Sair do Console
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-white/5 gap-6 sm:gap-8 overflow-x-auto pb-0.5">
        {[
          { id: "schools", label: "Escolas", icon: Building },
          { id: "plans", label: "Planos e Cupons", icon: BadgePercent },
          { id: "status", label: "Status da Plataforma", icon: Activity },
          { id: "logs", label: "Histórico & Logs", icon: Terminal },
          { id: "team", label: "Equipe Master", icon: Users },
          { id: "customization", label: "Personalização", icon: Palette },
          { id: "profile", label: "Meus Dados", icon: Key },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as MasterTab)}
              className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SCHOOLS MANAGEMENT */}
      {activeTab === "schools" && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Plataforma SaaS B2B"
            title="Controle Geral de Escolas Contratantes"
            description="Gerencie os planos contratados de cada unidade, libere ou bloqueie funcionalidades sob demanda e acompanhe o MRR consolidado."
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-neutral-400">
              {isLoadingMaster
                ? "Carregando dados reais do Supabase…"
                : `${schools.length} escola(s) encontrada(s)`}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadMasterData()}
                disabled={isLoadingMaster}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
              >
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => setIsCreateSchoolOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                <UserPlus className="size-4" /> Nova escola e gestor
              </button>
            </div>
          </div>

          {masterError && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">
              <strong>Serviço do Console Master ainda não está ativo no Supabase.</strong>
              <p className="mt-1">{masterError}</p>
            </div>
          )}

          {/* General Platform KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-5 flex items-center justify-between border-white/5 bg-neutral-900/40">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Faturamento Recorrente (MRR)
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Contratos ativos convertidos para valor mensal
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-paid/10 border border-paid/20">
                <Wallet className="size-5 text-paid" />
              </span>
            </GlassCard>

            <GlassCard className="p-5 flex items-center justify-between border-white/5 bg-neutral-900/40">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Escolas Ativas
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {schools.filter((s) => s.status === "Ativo").length}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">Unidades com acesso liberado</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                <Building className="size-5 text-primary" />
              </span>
            </GlassCard>

            <GlassCard className="p-5 flex items-center justify-between border-white/5 bg-neutral-900/40">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Módulos Ativados
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {schools.reduce((acc, s) => acc + s.modules.filter(isEnabledModule).length, 0)}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">Add-ons instalados na base</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Sliders className="size-5 text-purple-400" />
              </span>
            </GlassCard>
          </div>

          {/* Platform Banner explanation */}
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3 text-xs text-primary leading-relaxed items-start">
            <Sparkles className="size-4.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">Painel Master de Sobrescrita</p>
              <p className="mt-1 opacity-90">
                Gerencie os planos contratados de cada unidade, edite seus detalhes operacionais e
                veja o histórico completo de faturas geradas no SaaS.
              </p>
            </div>
          </div>

          {/* Schools directory table */}
          <GlassCard className="overflow-hidden border-white/5 bg-neutral-900/40">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Nome da Escola (Tenant)</th>
                    <th className="px-6 py-4">Subdomínio</th>
                    <th className="px-6 py-4">Módulos Contratados</th>
                    <th className="px-6 py-4">Alunos</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {schools.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setEditingSchool({ ...s });
                            setIsSchoolModalOpen(true);
                          }}
                          className="font-semibold text-white hover:text-primary transition-colors text-left cursor-pointer flex items-center gap-1.5"
                        >
                          {s.name} <Edit2 className="size-3 opacity-60" />
                        </button>
                        <p className="text-[10px] text-neutral-500 mt-0.5">ID: #{s.id}</p>
                      </td>
                      <td className="px-6 py-4 text-neutral-400 text-xs font-mono">
                        {s.subdominio}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {s.modules.filter(isEnabledModule).map((module) => (
                            <span
                              key={module.modulo_id}
                              className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary"
                            >
                              {schoolModuleLabels[module.modulo_id] ?? module.modulo_id}
                            </span>
                          ))}
                          {s.modules.filter(isEnabledModule).length === 0 && (
                            <span className="text-[10px] text-neutral-500">
                              Nenhum módulo habilitado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-300 text-xs font-semibold">
                        {s.studentsCount} alunos
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                            s.status === "Ativo"
                              ? "bg-paid/10 border-paid/20 text-paid"
                              : "bg-overdue/10 border-overdue/20 text-overdue"
                          }`}
                        >
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingSchool({ ...s });
                            setIsSchoolModalOpen(true);
                          }}
                          className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                        >
                          Editar Detalhes
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow cursor-pointer transition-all ${
                            s.status === "Ativo"
                              ? "bg-overdue text-destructive-foreground hover:bg-overdue/95"
                              : "bg-paid text-paid-foreground hover:bg-paid/95"
                          }`}
                        >
                          {s.status === "Ativo" ? "Bloquear" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingMaster && schools.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-xs text-neutral-400">
                        Nenhuma escola disponível para esta conta Master.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === "plans" && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Catálogo comercial"
            title="Planos e Cupons"
            description="Configure preços, limites, módulos e descontos sem alterar silenciosamente os contratos já faturados."
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCouponModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              <BadgePercent className="size-4" /> Novo cupom
            </button>
            <button
              type="button"
              onClick={() => openPlanEditor()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Package className="size-4" /> Novo plano
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <GlassCard
                key={plan.id}
                className={`flex flex-col gap-4 p-5 ${plan.recomendado ? "border-primary/40 bg-primary/5" : "border-white/5 bg-neutral-900/40"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {plan.destaque || `Versão ${plan.versao}`}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-white">{plan.nome}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-bold ${plan.ativo ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-neutral-400"}`}
                  >
                    {plan.ativo ? "ATIVO" : "ARQUIVADO"}
                  </span>
                </div>
                <p className="min-h-10 text-xs text-neutral-400">{plan.descricao}</p>
                <div>
                  <span className="text-2xl font-bold text-white">
                    R$ {Number(plan.preco_base).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-neutral-500">/mês</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-300">
                  <span>{plan.limite_alunos ?? "∞"} alunos</span>
                  <span>{plan.limite_unidades ?? "∞"} unidades</span>
                  <span>{plan.limite_usuarios ?? "∞"} usuários</span>
                  <span>{plan.modules.filter((item) => item.incluido).length} módulos</span>
                </div>
                <button
                  type="button"
                  onClick={() => openPlanEditor(plan)}
                  className="mt-auto rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Configurar plano
                </button>
              </GlassCard>
            ))}
          </div>
          <GlassCard className="overflow-hidden border-white/5 bg-neutral-900/40">
            <div className="border-b border-white/5 p-4">
              <h3 className="font-bold text-white">Cupons cadastrados</h3>
              <p className="text-[10px] text-neutral-500">
                Descontos promocionais com validade e limites controlados.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-[9px] uppercase text-neutral-400">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Desconto</th>
                    <th className="px-4 py-3">Duração</th>
                    <th className="px-4 py-3">Planos</th>
                    <th className="px-4 py-3">Uso</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {coupon.codigo}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {coupon.tipo === "percentual" ? `${coupon.valor}%` : `R$ ${coupon.valor}`}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {coupon.duracao === "meses"
                          ? `${coupon.duracao_meses} meses`
                          : coupon.duracao.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {coupon.plan_ids.length ? coupon.plan_ids.join(", ") : "Todos"}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {coupon.usos}/{coupon.limite_usos ?? "∞"}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {coupon.ativo ? "Ativo" : "Pausado"}
                      </td>
                    </tr>
                  ))}
                  {!coupons.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                        Nenhum cupom cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: SYSTEM HEALTH STATUS */}
      {activeTab === "status" && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Monitoramento de Infraestrutura"
            title="Status dos Serviços & Funcionalidades B2B"
            description="Visualize a saúde dos microserviços e conexões ativas. Você pode simular falhas para testar a resiliência e tratamento de erros do sistema."
          />

          {!Object.values(healthStatus).every(Boolean) && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 flex gap-3 text-xs text-rose-400 leading-relaxed items-start animate-pulse">
              <ShieldAlert className="size-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider">
                  Aviso de Infraestrutura Instável
                </p>
                <p className="mt-1 opacity-90">
                  Um ou mais microserviços simulados estão offline ou reportando falha.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Supabase status card */}
            <GlassCard className="p-6 space-y-4 border-white/5 bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Banco de Dados (Supabase PostgreSQL)
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Conexão ativa de tabelas e RLS (piwxpveprnwxkqlkjgux)
                  </p>
                </div>
                <span
                  className={`size-3 rounded-full ${healthStatus.supabase ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">
                  Latência real:{" "}
                  <strong>
                    {healthStatus.supabase
                      ? supabaseLatency
                        ? `${supabaseLatency}ms`
                        : "Conectado"
                      : "Offline / Falha"}
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isCheckingSupabase}
                    onClick={() => testSupabaseLive(true)}
                    className="rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingSupabase ? "Testando..." : "Testar Ping"}
                  </button>
                  <button
                    onClick={() => handleToggleHealth("supabase")}
                    className="rounded bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors cursor-pointer"
                  >
                    {healthStatus.supabase ? "Simular Falha" : "Restabelecer"}
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Stripe Gateway Webhooks */}
            <GlassCard className="p-6 space-y-4 border-white/5 bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Gateway de Pagamentos & Webhooks
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Processamento de mensalidades recorrentes B2B
                  </p>
                </div>
                <span
                  className={`size-3 rounded-full ${healthStatus.stripe ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">
                  Webhook Listeners:{" "}
                  <strong>{healthStatus.stripe ? "Operacionais" : "Erro de Handshake"}</strong>
                </span>
                <button
                  onClick={() => handleToggleHealth("stripe")}
                  className="rounded bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors cursor-pointer"
                >
                  {healthStatus.stripe ? "Simular Falha" : "Restabelecer"}
                </button>
              </div>
            </GlassCard>

            {/* CRM Pipeline Engine */}
            <GlassCard className="p-6 space-y-4 border-white/5 bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Motor de Sincronia CRM & Funil
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Mapeador de leads e negócios integrados
                  </p>
                </div>
                <span
                  className={`size-3 rounded-full ${healthStatus.crm ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">
                  Status dos Worker queues:{" "}
                  <strong>{healthStatus.crm ? "Online (0 pendentes)" : "Travado"}</strong>
                </span>
                <button
                  onClick={() => handleToggleHealth("crm")}
                  className="rounded bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors cursor-pointer"
                >
                  {healthStatus.crm ? "Simular Falha" : "Restabelecer"}
                </button>
              </div>
            </GlassCard>

            {/* AWS SES Email deliverability */}
            <GlassCard className="p-6 space-y-4 border-white/5 bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Serviço de E-mails (AWS SES)</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Envio de faturas, links de redefinição e cobranças
                  </p>
                </div>
                <span
                  className={`size-3 rounded-full ${healthStatus.aws ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">
                  Entregabilidade:{" "}
                  <strong>{healthStatus.aws ? "99.8% (Excelente)" : "Falha na Fila"}</strong>
                </span>
                <button
                  onClick={() => handleToggleHealth("aws")}
                  className="rounded bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors cursor-pointer"
                >
                  {healthStatus.aws ? "Simular Falha" : "Restabelecer"}
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS & TICKER */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Logs Gerais 360"
            title="Histórico e Auditoria da Plataforma"
            description="Consulte as operações realizadas na plataforma, identifique o responsável e exporte evidências para análise."
          />

          <GlassCard className="space-y-4 border-white/5 bg-neutral-900/40 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <select
                value={auditFilters.school_id}
                onChange={(e) => setAuditFilters({ ...auditFilters, school_id: e.target.value })}
                className="h-10 rounded-lg border border-white/5 bg-[#15161c] px-3 text-xs text-white"
              >
                <option value="">Todas as escolas</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <select
                value={auditFilters.actor_user_id}
                onChange={(e) =>
                  setAuditFilters({ ...auditFilters, actor_user_id: e.target.value })
                }
                className="h-10 rounded-lg border border-white/5 bg-[#15161c] px-3 text-xs text-white"
              >
                <option value="">Todos os usuários</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
                {schools
                  .flatMap((school) => school.members)
                  .filter(
                    (member, index, list) =>
                      list.findIndex((item) => item.user_id === member.user_id) === index,
                  )
                  .map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.nome || member.email || "Usuário escolar"}
                    </option>
                  ))}
              </select>
              <input
                value={auditFilters.action}
                onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                placeholder="Ação: school, invite…"
                className="h-10 rounded-lg border border-white/5 bg-[#15161c] px-3 text-xs text-white"
              />
              <input
                type="date"
                value={auditFilters.from}
                onChange={(e) => setAuditFilters({ ...auditFilters, from: e.target.value })}
                className="h-10 rounded-lg border border-white/5 bg-[#15161c] px-3 text-xs text-white"
              />
              <input
                type="date"
                value={auditFilters.to}
                onChange={(e) => setAuditFilters({ ...auditFilters, to: e.target.value })}
                className="h-10 rounded-lg border border-white/5 bg-[#15161c] px-3 text-xs text-white"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-neutral-400">{auditTotal} evento(s) encontrado(s)</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void exportAuditLogs()}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-white hover:bg-white/5"
                >
                  <Download className="size-3.5" /> Exportar CSV
                </button>
                <button
                  type="button"
                  disabled={auditLoading}
                  onClick={() => void loadAuditLogs(1)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Search className="size-3.5" />{" "}
                  {auditLoading ? "Consultando…" : "Aplicar filtros"}
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden border-white/5 bg-neutral-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-[9px] uppercase tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-4 py-3">Data e hora</th>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Escola</th>
                    <th className="px-4 py-3">Ação</th>
                    <th className="px-4 py-3">Recurso</th>
                    <th className="px-4 py-3 text-right">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-300">
                        {new Date(log.occurred_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white">{log.actor_name || log.actor_kind}</p>
                        <p className="text-[9px] text-neutral-500">
                          {log.actor_email || log.actor_user_id?.slice(0, 8) || "Sistema"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {schools.find((school) => school.id === log.escola_id)?.name ||
                          "Plataforma"}
                      </td>
                      <td className="px-4 py-3 font-mono text-primary">{log.action}</td>
                      <td className="px-4 py-3 text-neutral-300">
                        {log.resource_type}
                        {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditLog(log)}
                          className="rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-white hover:bg-white/5"
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!auditLoading && auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                        Nenhum evento encontrado com esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 p-4 text-xs text-neutral-400">
              <span>
                Página {auditPage} de {Math.max(1, Math.ceil(auditTotal / 20))}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={auditPage <= 1 || auditLoading}
                  onClick={() => void loadAuditLogs(auditPage - 1)}
                  className="rounded-md border border-white/10 px-3 py-1.5 disabled:opacity-30"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={auditPage * 20 >= auditTotal || auditLoading}
                  onClick={() => void loadAuditLogs(auditPage + 1)}
                  className="rounded-md border border-white/10 px-3 py-1.5 disabled:opacity-30"
                >
                  Próxima
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0e14] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Evento de auditoria
                </p>
                <h3 className="text-lg font-bold text-white">{selectedAuditLog.action}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[9px] uppercase text-neutral-500">Data e hora</p>
                <p className="mt-1 text-white">
                  {new Date(selectedAuditLog.occurred_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[9px] uppercase text-neutral-500">Responsável</p>
                <p className="mt-1 text-white">
                  {selectedAuditLog.actor_name ||
                    selectedAuditLog.actor_email ||
                    selectedAuditLog.actor_kind}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[9px] uppercase text-neutral-500">Escola</p>
                <p className="mt-1 text-white">
                  {schools.find((school) => school.id === selectedAuditLog.escola_id)?.name ||
                    "Plataforma"}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-[9px] uppercase text-neutral-500">Recurso</p>
                <p className="mt-1 text-white">
                  {selectedAuditLog.resource_type} ·{" "}
                  {selectedAuditLog.resource_id || "sem identificador"}
                </p>
              </div>
            </div>
            {[
              { label: "Dados anteriores", data: selectedAuditLog.before_data },
              { label: "Dados posteriores", data: selectedAuditLog.after_data },
              { label: "Metadados", data: selectedAuditLog.metadata },
            ].map((item) => (
              <div key={item.label} className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase text-neutral-400">
                  {item.label}
                </p>
                <pre className="max-h-56 overflow-auto rounded-xl border border-white/5 bg-black/30 p-4 text-[10px] leading-relaxed text-neutral-300">
                  {JSON.stringify(item.data ?? {}, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MASTER BACKOFFICE TEAM REGISTRY */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Equipe Técnica e Backoffice"
            title="Gerenciamento de Colaboradores Master"
            description="Cadastre novos colaboradores para gerenciar as finanças B2B, comercial, infraestrutura ou suporte da plataforma."
          />

          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* Team Table list */}
            <div className="lg:col-span-2">
              <GlassCard className="overflow-hidden border-white/5 bg-neutral-900/40">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Nome / E-mail</th>
                      <th className="px-6 py-4">Cargo Master</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {team.map((t) => (
                      <tr key={t.id} className="transition-colors hover:bg-white/[0.01]">
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTeamMember({ ...t });
                              setIsTeamModalOpen(true);
                            }}
                            className="font-semibold text-white hover:text-primary transition-colors text-left cursor-pointer flex items-center gap-1.5 font-sans bg-transparent border-0"
                          >
                            {t.name} <Edit2 className="size-3 opacity-60" />
                          </button>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{t.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                              t.role === "Administrador"
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : t.role === "Financeiro"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : t.role === "Desenvolvedor"
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                    : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            }`}
                          >
                            {t.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                              t.status === "Ativo" ? "text-paid" : "text-neutral-500"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${t.status === "Ativo" ? "bg-paid animate-pulse" : "bg-neutral-500"}`}
                            />
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTeamMember({ ...t });
                              setIsTeamModalOpen(true);
                            }}
                            className="text-primary hover:underline text-xs font-semibold cursor-pointer bg-transparent border-0"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeamMember(t.id)}
                            className="text-neutral-500 hover:text-rose-500 text-xs font-semibold cursor-pointer transition-colors bg-transparent border-0"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </div>

            {/* Creation Form card */}
            <GlassCard className="p-6 space-y-4 border-white/5 bg-neutral-900/40">
              <div>
                <h3 className="text-sm font-semibold text-white">Cadastrar Membro Master</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Adicione equipe para gerenciar o backoffice.
                </p>
              </div>

              <form onSubmit={handleAddTeamMember} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <input
                    placeholder="Amanda Silva"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    placeholder="amanda.financeiro@fluency.ai"
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Cargo / Nível de Acesso
                  </label>
                  <select
                    value={teamRole}
                    onChange={(e) => setTeamRole(e.target.value as MasterUser["role"])}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="Administrador">Administrador Geral</option>
                    <option value="Financeiro">Financeiro B2B (Assinaturas)</option>
                    <option value="Desenvolvedor">Desenvolvedor (Logs & Status)</option>
                    <option value="Vendedor">Vendedor (SaaS Leads)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  <UserPlus className="size-4" /> Adicionar Colaborador
                </button>
              </form>
            </GlassCard>
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM BRANDING CUSTOMIZATION */}
      {activeTab === "customization" && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="White-Label Geral"
            title="Personalização Padrão da Plataforma"
            description="Configure a identidade visual básica que será servida como tema inicial para as escolas parceiras."
          />

          <GlassCard className="p-8 max-w-xl mx-auto border-white/5 bg-neutral-900/40">
            <form onSubmit={handleSaveCustomization} className="space-y-6 text-xs">
              <div className="space-y-4">
                {/* Logo Text Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layout className="size-3.5" /> Nome Logotipo Padrão
                  </label>
                  <input
                    value={customLogoName}
                    onChange={(e) => setCustomLogoName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                  <p className="text-[10px] text-neutral-500">
                    Nome exibido no canto superior esquerdo da barra de navegação principal.
                  </p>
                </div>

                {/* Typography Choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="size-3.5" /> Tipografia Base
                  </label>
                  <select
                    value={customTypography}
                    onChange={(e) => setCustomTypography(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="Inter">Inter (Padrão Clean)</option>
                    <option value="Outfit">Outfit (Moderna/Arredondada)</option>
                    <option value="Roboto">Roboto (Clássica)</option>
                    <option value="Poppins">Poppins (Geométrica)</option>
                  </select>
                </div>

                {/* Primary HEX Color */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="size-3.5" /> Cor Primária Padrão
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customPrimaryColor}
                      onChange={(e) => setCustomPrimaryColor(e.target.value)}
                      className="size-10 rounded border border-white/10 bg-transparent p-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customPrimaryColor}
                      onChange={(e) => setCustomPrimaryColor(e.target.value)}
                      placeholder="#8b5cf6"
                      className="h-10 flex-1 rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    Injeta esta cor primária em todos os botões e elementos de destaque.
                  </p>
                </div>

                {/* Default Light/Dark Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Modo Inicial do Sistema
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setCustomDefaultMode("dark")}
                      className={`h-10 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        customDefaultMode === "dark"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/5 bg-white/5 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Dark Mode (Recomendado)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomDefaultMode("light")}
                      className={`h-10 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        customDefaultMode === "light"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/5 bg-white/5 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Light Mode
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  <Save className="size-4" /> Salvar Configuração Base
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* TAB 6: MY DATA / PROFILE FORM */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Configurações de Conta Master"
            title="Meus Dados de Administrador"
            description="Mantenha seus contatos e chaves criptográficas de acesso atualizadas para garantir a integridade da plataforma."
          />

          <GlassCard className="p-8 max-w-xl mx-auto border-white/5 bg-neutral-900/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Dados de administrador salvos com sucesso!");
              }}
              className="space-y-6 text-xs"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-white/5 pb-6">
                {/* Profile Picture Mock Selection */}
                <div className="relative group">
                  <div
                    className={`size-16 rounded-full border border-primary/20 grid place-items-center text-xl font-bold ${
                      profileAvatarId === "avatar-1"
                        ? "bg-primary/20 text-primary"
                        : profileAvatarId === "avatar-2"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-indigo-500/20 text-indigo-400"
                    }`}
                  >
                    {profileName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>

                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                    <Camera className="size-4 text-white" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{profileName}</h4>
                  <p className="text-[10px] text-neutral-400">
                    Administrador Geral da Plataforma SaaS
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-neutral-500">Avatar:</span>
                    {avatarOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setProfileAvatarId(opt.id);
                          toast.info("Avatar alterado.");
                        }}
                        className={`size-5 rounded-full border cursor-pointer transition-all ${opt.bg} ${
                          profileAvatarId === opt.id
                            ? "border-primary ring-1 ring-primary"
                            : "border-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3.5" /> Nome do Administrador
                  </label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="size-3.5" /> E-mail Master de Login
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* CNPJ or CPF */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="size-3.5" /> CNPJ / CPF do Titular
                  </label>
                  <input
                    value={profileCnpj}
                    onChange={(e) => setProfileCnpj(e.target.value)}
                    placeholder="12.345.678/0001-90"
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Password input with show/hide toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="size-3.5" /> Senha cadastrada
                  </label>
                  <div className="relative">
                    <input
                      type={showProfilePassword ? "text" : "password"}
                      value={profileKey}
                      onChange={(e) => setProfileKey(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/5 bg-white/5 pr-10 pl-3 text-xs text-white outline-none focus:border-primary font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      {showProfilePassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  <Save className="size-4" /> Salvar Alterações Master
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {isCreateSchoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0e14] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Nova escola e gestor responsável</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Cria a escola, a unidade principal e um convite com validade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSchoolOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSchool} className="mt-6 space-y-5 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Nome da escola
                  </span>
                  <input
                    required
                    minLength={3}
                    value={newSchool.schoolName}
                    onChange={(event) =>
                      setNewSchool({ ...newSchool, schoolName: event.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-primary"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Subdomínio
                  </span>
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/5 pr-3 focus-within:border-primary">
                    <input
                      required
                      pattern="[a-z0-9][a-z0-9-]{1,58}[a-z0-9]"
                      value={newSchool.slug}
                      onChange={(event) =>
                        setNewSchool({
                          ...newSchool,
                          slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        })
                      }
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 text-white outline-none"
                    />
                    <span className="text-[10px] text-neutral-500">.fluencyai.online</span>
                  </div>
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Plano inicial
                </span>
                <select
                  value={newSchool.plan}
                  onChange={(event) => setNewSchool({ ...newSchool, plan: event.target.value })}
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-primary"
                >
                  {planOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nome}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Nome do gestor
                  </span>
                  <input
                    required
                    minLength={3}
                    value={newSchool.managerName}
                    onChange={(event) =>
                      setNewSchool({ ...newSchool, managerName: event.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-primary"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    E-mail do gestor
                  </span>
                  <input
                    required
                    type="email"
                    value={newSchool.managerEmail}
                    onChange={(event) =>
                      setNewSchool({ ...newSchool, managerEmail: event.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-[11px] text-neutral-300">
                O gestor definirá a própria senha. Enquanto o envio de e-mail não estiver
                configurado, o link seguro será copiado para você encaminhar manualmente.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSchoolOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-neutral-300"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSavingSchool}
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {isSavingSchool ? "Criando…" : "Criar escola e convite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: EDIT SCHOOL DETAILS */}
      {isSchoolModalOpen && editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:p-5">
          <div className="relative max-h-[94vh] w-full max-w-5xl space-y-6 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0e14] p-4 shadow-2xl sm:p-6 lg:p-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Building className="size-5 text-primary" />
                <h3 className="text-base font-bold text-white">
                  Editar Unidade: {editingSchool.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSchoolModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditingSchool} className="space-y-6 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* School Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Nome da Escola
                  </label>
                  <input
                    value={editingSchool.name}
                    onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Subdomain */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Subdomínio Privado
                  </label>
                  <input
                    value={editingSchool.subdominio}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, subdominio: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Plano comercial
                </label>
                <select
                  value={editingSchool.plan}
                  onChange={(e) => setEditingSchool({ ...editingSchool, plan: e.target.value })}
                  className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                >
                  {planOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nome}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlan && (
                <div className="grid gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-neutral-400">Ciclo</label>
                    <select
                      value={contractCycle}
                      onChange={(e) =>
                        setEditingSchool({
                          ...editingSchool,
                          contract: {
                            ...(editingSchool.contract ?? {
                              id: "",
                              escola_id: editingSchool.id,
                              plano_id: editingSchool.plan,
                              plano_versao: selectedPlan.versao,
                              status: "ativo",
                              valor_base: 0,
                              valor_adicionais: 0,
                              valor_total: 0,
                              mrr: 0,
                              proxima_cobranca: null,
                            }),
                            ciclo: e.target.value as "mensal" | "anual",
                            unidades_adicionais: extraUnits,
                            blocos_100_alunos: studentBlocks,
                          },
                        })
                      }
                      className="h-9 w-full rounded-lg border border-white/5 bg-[#15161c] px-2 text-white"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-neutral-400">
                      Unidades extras
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={extraUnits}
                      onChange={(e) =>
                        setEditingSchool({
                          ...editingSchool,
                          contract: {
                            ...(editingSchool.contract as MasterContract),
                            ciclo: contractCycle,
                            unidades_adicionais: Math.max(0, Number(e.target.value)),
                            blocos_100_alunos: studentBlocks,
                          },
                        })
                      }
                      className="h-9 w-full rounded-lg border border-white/5 bg-[#15161c] px-2 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-neutral-400">
                      Blocos de 100 alunos
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={studentBlocks}
                      onChange={(e) =>
                        setEditingSchool({
                          ...editingSchool,
                          contract: {
                            ...(editingSchool.contract as MasterContract),
                            ciclo: contractCycle,
                            unidades_adicionais: extraUnits,
                            blocos_100_alunos: Math.max(0, Number(e.target.value)),
                          },
                        })
                      }
                      className="h-9 w-full rounded-lg border border-white/5 bg-[#15161c] px-2 text-white"
                    />
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-black/20 p-3">
                    <p className="text-[9px] uppercase text-neutral-400">Valor do contrato</p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {contractTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                      <span className="text-[9px] font-normal text-neutral-400">
                        /{contractCycle === "anual" ? "ano" : "mês"}
                      </span>
                    </p>
                  </div>
                  <div className="sm:col-span-4 flex flex-wrap gap-2 text-[9px]">
                    <span
                      className={`rounded-full px-2 py-1 ${selectedPlan.limite_alunos !== null && editingSchool.studentsCount > selectedPlan.limite_alunos + studentBlocks * 100 ? "bg-red-500/15 text-red-300" : "bg-white/5 text-neutral-400"}`}
                    >
                      Alunos: {editingSchool.studentsCount}/
                      {selectedPlan.limite_alunos === null
                        ? "∞"
                        : selectedPlan.limite_alunos + studentBlocks * 100}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 ${selectedPlan.limite_unidades !== null && editingSchool.unitsCount > selectedPlan.limite_unidades + extraUnits ? "bg-red-500/15 text-red-300" : "bg-white/5 text-neutral-400"}`}
                    >
                      Unidades: {editingSchool.unitsCount}/
                      {selectedPlan.limite_unidades === null
                        ? "∞"
                        : selectedPlan.limite_unidades + extraUnits}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 ${selectedPlan.limite_usuarios !== null && editingSchool.members.length > selectedPlan.limite_usuarios ? "bg-red-500/15 text-red-300" : "bg-white/5 text-neutral-400"}`}
                    >
                      Usuários: {editingSchool.members.length}/{selectedPlan.limite_usuarios ?? "∞"}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Contract Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Status do Contrato
                  </label>
                  <select
                    value={editingSchool.status}
                    onChange={(e) =>
                      setEditingSchool({
                        ...editingSchool,
                        status: e.target.value as SchoolTenant["status"],
                      })
                    }
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="Ativo">Ativo / Regular</option>
                    <option value="Inativo">Inativo / Bloqueado</option>
                    <option value="Atrasado">Mensalidade Atrasada</option>
                  </select>
                </div>

                {/* Student Count */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Quantidade de Alunos
                  </label>
                  <input
                    type="number"
                    value={editingSchool.studentsCount}
                    readOnly
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/[0.025] px-3 text-xs text-neutral-400 outline-none"
                  />
                </div>

                {/* Teachers Limit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Unidades cadastradas
                  </label>
                  <input
                    type="number"
                    value={editingSchool.unitsCount}
                    readOnly
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/[0.025] px-3 text-xs text-neutral-400 outline-none"
                  />
                </div>
              </div>

              {/* Modules toggles in Popup */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Módulos Habilitados (Contrato SaaS)
                </label>
                <div className="grid gap-2 rounded-xl border border-white/5 bg-white/[0.025] p-3 sm:grid-cols-2 xl:grid-cols-4">
                  {editingSchool.modules.map((module) => {
                    const definition = moduleCatalog.find((item) => item.id === module.modulo_id);
                    const enabled = isEnabledModule(module);
                    return (
                      <label
                        key={module.modulo_id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${enabled ? "border-primary/25 bg-primary/10" : "border-white/5 bg-white/[0.025] hover:bg-white/5"}`}
                      >
                        <input
                          type="checkbox"
                          checked={enabled}
                          disabled={isSavingSchool}
                          onChange={() => void handleToggleSchoolModule(module)}
                          className="size-4 shrink-0 rounded border-white/10 bg-white/5 text-primary"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-white">
                            {schoolModuleLabels[module.modulo_id] ?? module.modulo_id}
                          </span>
                          <span className="mt-0.5 block text-[9px] uppercase tracking-wide text-neutral-500">
                            {enabled
                              ? module.status
                              : definition?.requer_configuracao
                                ? "Requer configuração"
                                : "Disponível"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-neutral-500">
                  A alteração fica registrada na auditoria. A composição de preço será calculada
                  pelo catálogo na etapa de cobrança.
                </p>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Usuários e acessos da escola
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    {editingSchool.members.length} ativo(s) ·{" "}
                    {editingSchool.invites.filter((invite) => invite.status === "pendente").length}{" "}
                    convite(s)
                  </span>
                </div>
                <div className="space-y-2">
                  {editingSchool.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {member.nome || "Usuário da escola"}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {member.email || "E-mail indisponível"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          aria-label={`Nível de acesso de ${member.nome || member.email || "usuário"}`}
                          value={member.papel}
                          onChange={(event) =>
                            void handleUpdateSchoolMember(member, { role: event.target.value })
                          }
                          className="h-8 rounded-md border border-white/5 bg-[#15161c] px-2 text-[10px] text-white"
                        >
                          <option value="gestor">Gestor</option>
                          <option value="secretaria">Secretaria</option>
                          <option value="financeiro">Financeiro</option>
                          <option value="pedagogico">Pedagógico</option>
                          <option value="comercial">Comercial</option>
                          <option value="professor">Professor</option>
                        </select>
                        <select
                          aria-label={`Status de ${member.nome || member.email || "usuário"}`}
                          value={member.status}
                          onChange={(event) =>
                            void handleUpdateSchoolMember(member, { status: event.target.value })
                          }
                          className="h-8 rounded-md border border-white/5 bg-[#15161c] px-2 text-[10px] text-white"
                        >
                          <option value="ativo">Ativo</option>
                          <option value="suspenso">Suspenso</option>
                          <option value="inativo">Inativo</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleRemoveSchoolMember(member)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                          title="Remover o vínculo com esta escola"
                        >
                          <Trash2 className="size-3" /> Remover
                        </button>
                      </div>
                    </div>
                  ))}
                  {editingSchool.invites
                    .filter((invite) => invite.status === "pendente")
                    .map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between rounded-lg border border-amber-500/15 bg-amber-500/5 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{invite.nome || invite.email}</p>
                          <p className="text-[10px] text-neutral-500">{invite.email}</p>
                          <p
                            className={`mt-1 text-[10px] font-medium ${
                              invite.email_status === "enviado"
                                ? "text-emerald-400"
                                : invite.email_status === "falhou"
                                  ? "text-red-300"
                                  : "text-neutral-500"
                            }`}
                            title={invite.email_error || undefined}
                          >
                            {invite.email_status === "enviado"
                              ? "Solicitação aceita pelo SMTP"
                              : invite.email_status === "falhou"
                                ? `Falha no e-mail${invite.email_error ? `: ${invite.email_error}` : ""}`
                                : "E-mail ainda não solicitado"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold uppercase text-amber-300">
                            Convite pendente · {invite.papel}
                          </span>
                          <button
                            type="button"
                            disabled={isInvitingSchoolUser}
                            onClick={() => void handleCancelSchoolInvite(invite)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <X className="size-3" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="grid gap-2 rounded-xl border border-white/5 bg-white/[0.025] p-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_150px_auto]">
                  <input
                    value={schoolInvite.name}
                    onChange={(e) => setSchoolInvite({ ...schoolInvite, name: e.target.value })}
                    placeholder="Nome completo"
                    className="h-10 rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  />
                  <input
                    type="email"
                    value={schoolInvite.email}
                    onChange={(e) => setSchoolInvite({ ...schoolInvite, email: e.target.value })}
                    placeholder="E-mail de acesso"
                    className="h-10 rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  />
                  <select
                    value={schoolInvite.role}
                    onChange={(e) => setSchoolInvite({ ...schoolInvite, role: e.target.value })}
                    className="h-10 rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="gestor">Gestor</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="pedagogico">Pedagógico</option>
                    <option value="comercial">Comercial</option>
                    <option value="professor">Professor</option>
                  </select>
                  <button
                    type="button"
                    disabled={isInvitingSchoolUser}
                    onClick={() => void handleCreateSchoolInvite()}
                    className="h-10 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isInvitingSchoolUser ? "Criando…" : "Convidar"}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500">
                  A pessoa cria a própria senha pelo link seguro. Nenhuma senha é exibida ou
                  armazenada pelo Console Master.
                </p>
              </div>

              {/* B2B Subscription Payment History */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="size-4 text-neutral-400" /> Histórico de Faturas do SaaS (B2B
                  Billing)
                </label>
                <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0d0e14]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 text-[9px] font-bold text-neutral-400 uppercase tracking-wider border-b border-white/5">
                        <th className="px-4 py-2">ID Fatura</th>
                        <th className="px-4 py-2">Data Venc.</th>
                        <th className="px-4 py-2">Valor</th>
                        <th className="px-4 py-2">Método</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-neutral-300">
                      {editingSchool.paymentHistory.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2 font-mono">{p.id}</td>
                          <td className="px-4 py-2">{p.date}</td>
                          <td className="px-4 py-2 font-semibold">R$ {p.amount},00</td>
                          <td className="px-4 py-2">{p.method}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-paid">
                              <CheckCircle2 className="size-3" /> {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Buttons footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  Salvar Escola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-5">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0e14] p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Configuração comercial
                </p>
                <h3 className="text-lg font-bold text-white">{editingPlan.nome || "Novo plano"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="space-y-6 text-xs">
              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    Código interno
                  </span>
                  <input
                    value={editingPlan.id}
                    disabled={editingPlan.versao > 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, id: e.target.value })}
                    placeholder="ex: profissional"
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white disabled:opacity-50"
                    required
                  />
                </label>
                <label className="space-y-1 xl:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    Nome do plano
                  </span>
                  <input
                    value={editingPlan.nome}
                    onChange={(e) => setEditingPlan({ ...editingPlan, nome: e.target.value })}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                    required
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Destaque</span>
                  <input
                    value={editingPlan.destaque ?? ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, destaque: e.target.value || null })
                    }
                    placeholder="Mais escolhido"
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                  />
                </label>
                <label className="space-y-1 md:col-span-2 xl:col-span-4">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    Descrição
                  </span>
                  <textarea
                    value={editingPlan.descricao ?? ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, descricao: e.target.value })}
                    className="min-h-20 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white"
                  />
                </label>
              </section>
              <section>
                <h4 className="mb-3 font-bold text-white">Preços e ciclo</h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["Mensal", "preco_base"],
                    ["Anual", "preco_anual"],
                    ["Implantação", "taxa_implantacao"],
                    ["Unidade extra", "preco_unidade_adicional"],
                    ["+100 alunos", "preco_100_alunos_adicionais"],
                  ].map(([label, key]) => (
                    <label key={key} className="space-y-1">
                      <span className="text-[10px] uppercase text-neutral-400">{label}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(editingPlan[key as keyof MasterPlan] as number | null) ?? ""}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            [key]: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                      />
                    </label>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="mb-3 font-bold text-white">Limites do plano</h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["Alunos", "limite_alunos"],
                    ["Usuários", "limite_usuarios"],
                    ["Professores", "limite_professores"],
                    ["Unidades", "limite_unidades"],
                    ["Trial (dias)", "trial_dias"],
                  ].map(([label, key]) => (
                    <label key={key} className="space-y-1">
                      <span className="text-[10px] uppercase text-neutral-400">{label}</span>
                      <input
                        type="number"
                        min="0"
                        value={(editingPlan[key as keyof MasterPlan] as number | null) ?? ""}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            [key]: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                      />
                    </label>
                  ))}
                </div>
              </section>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold text-white">Módulos do plano</h4>
                  <span className="text-[10px] text-neutral-500">
                    Incluído ou vendido como adicional
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {moduleCatalog.map((module) => {
                    const current = editingPlan.modules.find(
                      (item) => item.modulo_id === module.id,
                    );
                    if (!current) return null;
                    return (
                      <div
                        key={module.id}
                        className={`grid grid-cols-[1fr_auto_110px] items-center gap-3 rounded-lg border p-3 ${current.incluido ? "border-primary/25 bg-primary/10" : "border-white/5 bg-white/[0.025]"}`}
                      >
                        <div>
                          <p className="font-semibold text-white">{module.nome}</p>
                          <p className="text-[9px] text-neutral-500">{module.descricao}</p>
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-neutral-300">
                          <input
                            type="checkbox"
                            checked={current.incluido}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                modules: editingPlan.modules.map((item) =>
                                  item.modulo_id === module.id
                                    ? { ...item, incluido: e.target.checked }
                                    : item,
                                ),
                              })
                            }
                          />{" "}
                          Incluído
                        </label>
                        <input
                          aria-label={`Preço adicional de ${module.nome}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={current.preco_adicional ?? ""}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              modules: editingPlan.modules.map((item) =>
                                item.modulo_id === module.id
                                  ? {
                                      ...item,
                                      preco_adicional:
                                        e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-8 rounded-md border border-white/10 bg-white/5 px-2 text-right text-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] p-3 text-white">
                  <input
                    type="checkbox"
                    checked={editingPlan.recomendado}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, recomendado: e.target.checked })
                    }
                  />{" "}
                  Plano recomendado
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] p-3 text-white">
                  <input
                    type="checkbox"
                    checked={editingPlan.white_label}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, white_label: e.target.checked })
                    }
                  />{" "}
                  White label
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] p-3 text-white">
                  <input
                    type="checkbox"
                    checked={editingPlan.dominio_personalizado}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, dominio_personalizado: e.target.checked })
                    }
                  />{" "}
                  Domínio próprio
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] p-3 text-white">
                  <input
                    type="checkbox"
                    checked={editingPlan.ativo}
                    onChange={(e) => setEditingPlan({ ...editingPlan, ativo: e.target.checked })}
                  />{" "}
                  Plano ativo
                </label>
              </section>
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <p className="text-[10px] text-neutral-500">
                  Ao salvar, uma nova versão é registrada na auditoria.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isSavingPlan}
                    type="submit"
                    className="rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isSavingPlan ? "Salvando…" : "Salvar plano"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0e14] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Campanha comercial
                </p>
                <h3 className="text-lg font-bold text-white">Novo cupom</h3>
              </div>
              <button type="button" onClick={() => setIsCouponModalOpen(false)}>
                <X className="size-5 text-neutral-400" />
              </button>
            </div>
            <form onSubmit={handleSaveCoupon} className="space-y-5 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Código</span>
                  <input
                    value={couponForm.codigo}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, codigo: e.target.value.toUpperCase() })
                    }
                    placeholder="LANCAMENTO20"
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-white"
                    required
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Nome da campanha</span>
                  <input
                    value={couponForm.nome}
                    onChange={(e) => setCouponForm({ ...couponForm, nome: e.target.value })}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Tipo</span>
                  <select
                    value={couponForm.tipo}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, tipo: e.target.value as MasterCoupon["tipo"] })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                  >
                    <option value="percentual">Percentual</option>
                    <option value="valor_fixo">Valor fixo</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Valor</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={couponForm.valor}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, valor: Number(e.target.value) })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Ciclo</span>
                  <select
                    value={couponForm.ciclo}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        ciclo: e.target.value as MasterCoupon["ciclo"],
                      })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                  >
                    <option value="ambos">Mensal e anual</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Duração</span>
                  <select
                    value={couponForm.duracao}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        duracao: e.target.value as MasterCoupon["duracao"],
                      })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                  >
                    <option value="primeira_cobranca">Primeira cobrança</option>
                    <option value="meses">Por meses</option>
                    <option value="permanente">Permanente</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Meses</span>
                  <input
                    disabled={couponForm.duracao !== "meses"}
                    type="number"
                    min="1"
                    max="36"
                    value={couponForm.duracao_meses}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, duracao_meses: Number(e.target.value) })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white disabled:opacity-40"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400">Limite de usos</span>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.limite_usos}
                    onChange={(e) => setCouponForm({ ...couponForm, limite_usos: e.target.value })}
                    placeholder="Ilimitado"
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white"
                  />
                </label>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase text-neutral-400">
                  Planos permitidos
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {plans
                    .filter((plan) => plan.ativo)
                    .map((plan) => (
                      <label
                        key={plan.id}
                        className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] p-3 text-white"
                      >
                        <input
                          type="checkbox"
                          checked={couponForm.plan_ids.includes(plan.id)}
                          onChange={(e) =>
                            setCouponForm({
                              ...couponForm,
                              plan_ids: e.target.checked
                                ? [...couponForm.plan_ids, plan.id]
                                : couponForm.plan_ids.filter((id) => id !== plan.id),
                            })
                          }
                        />
                        {plan.nome}
                      </label>
                    ))}
                </div>
                <p className="mt-1 text-[9px] text-neutral-500">
                  Nenhuma seleção significa todos os planos.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={couponForm.somente_novos_clientes}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, somente_novos_clientes: e.target.checked })
                    }
                  />
                  Somente novos clientes
                </label>
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={couponForm.cumulativo}
                    onChange={(e) => setCouponForm({ ...couponForm, cumulativo: e.target.checked })}
                  />
                  Permitir combinação
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-white"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSavingCoupon}
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {isSavingCoupon ? "Salvando…" : "Criar cupom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: EDIT TEAM MEMBER */}
      {isTeamModalOpen && editingTeamMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0e14] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h3 className="text-base font-bold text-white">Editar Colaborador Master</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditingTeamMember} className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  value={editingTeamMember.name}
                  onChange={(e) =>
                    setEditingTeamMember({ ...editingTeamMember, name: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={editingTeamMember.email}
                  onChange={(e) =>
                    setEditingTeamMember({ ...editingTeamMember, email: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Cargo Master
                </label>
                <select
                  value={editingTeamMember.role}
                  onChange={(e) =>
                    setEditingTeamMember({
                      ...editingTeamMember,
                      role: e.target.value as MasterUser["role"],
                    })
                  }
                  className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                >
                  <option value="Administrador">Administrador Geral</option>
                  <option value="Financeiro">Financeiro B2B</option>
                  <option value="Desenvolvedor">Desenvolvedor</option>
                  <option value="Vendedor">Vendedor</option>
                </select>
              </div>

              {/* Status active/inactive switch */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Situação da Conta
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditingTeamMember({ ...editingTeamMember, status: "Ativo" })}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      editingTeamMember.status === "Ativo"
                        ? "border-paid bg-paid/10 text-paid"
                        : "border-white/5 bg-white/5 text-neutral-400"
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingTeamMember.id === "1") {
                        toast.error("O Administrador Principal deve permanecer ativo!");
                        return;
                      }
                      setEditingTeamMember({ ...editingTeamMember, status: "Inativo" });
                    }}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      editingTeamMember.status === "Inativo"
                        ? "border-overdue bg-overdue/10 text-overdue"
                        : "border-white/5 bg-white/5 text-neutral-400"
                    }`}
                  >
                    Inativo / Bloqueado
                  </button>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
