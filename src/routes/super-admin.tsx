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
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { toast } from "sonner";

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
  modules: {
    crm: boolean;
    financeiro: boolean;
    pedagogico: boolean;
    success: boolean;
  };
  paymentHistory: PaymentLog[];
};

type MasterUser = {
  id: string;
  name: string;
  email: string;
  role: "Administrador" | "Financeiro" | "Desenvolvedor" | "Vendedor";
  status: "Ativo" | "Inativo";
};

const DEFAULT_SCHOOLS: SchoolTenant[] = [
  {
    id: "1",
    name: "Fluency AI (Original)",
    subdominio: "original.fluency.ai",
    status: "Ativo",
    studentsCount: 482,
    teachersLimit: 25,
    modules: { crm: true, financeiro: true, pedagogico: true, success: true },
    paymentHistory: [
      { id: "FAT-9921", date: "10/08/2026", amount: 646, status: "Pago", method: "Pix" },
      { id: "FAT-9801", date: "10/07/2026", amount: 646, status: "Pago", method: "Pix" },
      { id: "FAT-9610", date: "10/06/2026", amount: 646, status: "Pago", method: "Pix" },
    ],
  },
  {
    id: "2",
    name: "Apex English",
    subdominio: "apex.fluency.ai",
    status: "Ativo",
    studentsCount: 210,
    teachersLimit: 12,
    modules: { crm: true, financeiro: true, pedagogico: true, success: false },
    paymentHistory: [
      { id: "FAT-9922", date: "10/08/2026", amount: 547, status: "Pago", method: "Cartão" },
      { id: "FAT-9802", date: "10/07/2026", amount: 547, status: "Pago", method: "Cartão" },
    ],
  },
  {
    id: "3",
    name: "British Academy",
    subdominio: "british.fluency.ai",
    status: "Ativo",
    studentsCount: 145,
    teachersLimit: 10,
    modules: { crm: false, financeiro: true, pedagogico: true, success: true },
    paymentHistory: [
      { id: "FAT-9923", date: "08/08/2026", amount: 497, status: "Pago", method: "Boleto" },
      { id: "FAT-9803", date: "08/07/2026", amount: 497, status: "Pago", method: "Boleto" },
    ],
  },
];

const DEFAULT_TEAM: MasterUser[] = [
  { id: "1", name: "Felipe Medeiros", email: "super@fluency.ai", role: "Administrador", status: "Ativo" },
  { id: "2", name: "Amanda Sales", email: "amanda.financeiro@fluency.ai", role: "Financeiro", status: "Ativo" },
  { id: "3", name: "Thiago Carvalho", email: "thiago.dev@fluency.ai", role: "Desenvolvedor", status: "Ativo" },
  { id: "4", name: "Leticia Nunes", email: "leticia.vendas@fluency.ai", role: "Vendedor", status: "Ativo" },
];

const STORAGE_KEY = "fluency-ai:super-admin:schools";
const TEAM_STORAGE_KEY = "fluency-ai:super-admin:team";

function SuperAdminPage() {
  const [schools, setSchools] = useState<SchoolTenant[]>(DEFAULT_SCHOOLS);
  const [team, setTeam] = useState<MasterUser[]>(DEFAULT_TEAM);
  const [activeTab, setActiveTab] = useState<"schools" | "status" | "logs" | "team" | "customization" | "profile">("schools");

  // System Health States
  const [healthStatus, setHealthStatus] = useState({
    supabase: true,
    stripe: true,
    crm: true,
    aws: true,
  });

  // Modal Editing States - Schools
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolTenant | null>(null);

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

  // Load from local storage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSchools(JSON.parse(raw));
      }
      const rawTeam = window.localStorage.getItem(TEAM_STORAGE_KEY);
      if (rawTeam) {
        setTeam(JSON.parse(rawTeam));
      }
      
      const savedLogo = window.localStorage.getItem("fluency-ai:custom-logo");
      if (savedLogo) setCustomLogoName(savedLogo);
      const savedColor = window.localStorage.getItem("fluency-ai:custom-color");
      if (savedColor) setCustomPrimaryColor(savedColor);
    } catch {
      /* ignore */
    }
  }, []);

  const saveSchools = (next: SchoolTenant[]) => {
    setSchools(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const saveTeam = (next: MasterUser[]) => {
    setTeam(next);
    try {
      window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const handleToggleModule = (schoolId: string, moduleKey: keyof SchoolTenant["modules"]) => {
    const nextSchools = schools.map((s) => {
      if (s.id === schoolId) {
        const nextVal = !s.modules[moduleKey];
        toast.info(`Módulo ${moduleKey.toUpperCase()} da escola ${s.name} foi ${nextVal ? "ativado" : "desativado"}!`);
        return {
          ...s,
          modules: { ...s.modules, [moduleKey]: nextVal },
        };
      }
      return s;
    });

    saveSchools(nextSchools);
    syncOriginalModules(nextSchools, schoolId);
  };

  const handleToggleStatus = (schoolId: string) => {
    const nextSchools = schools.map((s) => {
      if (s.id === schoolId) {
        const nextStatus = (s.status === "Ativo" ? "Inativo" : "Ativo") as SchoolTenant["status"];
        toast.success(`Situação da escola ${s.name} alterada para ${nextStatus}!`);
        return { ...s, status: nextStatus };
      }
      return s;
    });
    saveSchools(nextSchools);
  };

  const syncOriginalModules = (list: SchoolTenant[], schoolId: string) => {
    const activeSchool = list.find((s) => s.id === schoolId);
    if (activeSchool && activeSchool.name.includes("Fluency AI")) {
      const activeIds: string[] = ["core"];
      if (activeSchool.modules.crm) activeIds.push("crm");
      if (activeSchool.modules.financeiro) activeIds.push("financeiro");
      if (activeSchool.modules.success) activeIds.push("success");
      try {
        window.localStorage.setItem("fluency-ai:modules", JSON.stringify(activeIds));
      } catch {
        /* ignore */
      }
    }
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamEmail.trim()) {
      toast.error("Por favor, preencha todos os campos do colaborador!");
      return;
    }
    const newMember: MasterUser = {
      id: "master-" + Date.now(),
      name: teamName,
      email: teamEmail,
      role: teamRole,
      status: "Ativo",
    };
    const nextTeam = [...team, newMember];
    saveTeam(nextTeam);
    setTeamName("");
    setTeamEmail("");
    toast.success(`Colaborador Master "${teamName}" adicionado!`);
  };

  const handleDeleteTeamMember = (id: string) => {
    if (id === "1") {
      toast.error("Você não pode deletar o Administrador Principal!");
      return;
    }
    const nextTeam = team.filter((t) => t.id !== id);
    saveTeam(nextTeam);
    toast.success("Membro da equipe master removido.");
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
  const handleSaveEditingSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    const nextSchools = schools.map((s) => (s.id === editingSchool.id ? editingSchool : s));
    saveSchools(nextSchools);
    syncOriginalModules(nextSchools, editingSchool.id);

    setIsSchoolModalOpen(false);
    toast.success(`Dados da escola "${editingSchool.name}" salvos com sucesso!`);
  };

  const handleSaveEditingTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamMember) return;

    const nextTeam = team.map((t) => (t.id === editingTeamMember.id ? editingTeamMember : t));
    saveTeam(nextTeam);

    setIsTeamModalOpen(false);
    toast.success(`Dados do colaborador "${editingTeamMember.name}" salvos com sucesso!`);
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

  const totalMRR = schools.filter((s) => s.status === "Ativo").reduce((sum, s) => {
    let base = 299;
    if (s.modules.crm) base += 149;
    if (s.modules.financeiro) base += 199;
    if (s.modules.success) base += 99;
    return sum + base;
  }, 0);

  return (
    <div className="min-h-screen w-full bg-[#05060a] text-foreground p-6 sm:p-12 md:max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
            <Sliders className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-base font-bold text-white">{customLogoName}</h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mt-0.5">Console de Administração Geral</p>
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
              onClick={() => setActiveTab(t.id as any)}
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

          {/* General Platform KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-5 flex items-center justify-between border-white/5 bg-neutral-900/40">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Faturamento Recorrente (MRR)</p>
                <p className="mt-1 text-2xl font-bold text-white">R$ {totalMRR.toLocaleString("pt-BR")},00</p>
                <p className="text-[10px] text-neutral-500 mt-1">Soma de todas as mensalidades ativas</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-paid/10 border border-paid/20">
                <Wallet className="size-5 text-paid" />
              </span>
            </GlassCard>

            <GlassCard className="p-5 flex items-center justify-between border-white/5 bg-neutral-900/40">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Escolas Ativas</p>
                <p className="mt-1 text-2xl font-bold text-white">{schools.filter((s) => s.status === "Ativo").length}</p>
                <p className="text-[10px] text-neutral-500 mt-1">Unidades com acesso liberado</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                <Building className="size-5 text-primary" />
              </span>
            </GlassCard>

            <GlassCard className="p-5 flex items-center justify-between border-white/5 bg-neutral-900/40">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Módulos Ativados</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {schools.reduce((acc, s) => acc + Object.values(s.modules).filter(Boolean).length, 0)}
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
                Gerencie os planos contratados de cada unidade, edite seus detalhes operacionais e veja o histórico completo de faturas geradas no SaaS.
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
                      <td className="px-6 py-4 text-neutral-400 text-xs font-mono">{s.subdominio}</td>
                      <td className="px-6 py-4">
                        
                        <div className="grid gap-2 sm:grid-cols-2 max-w-xs">
                          {/* CRM */}
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-white">
                            <input
                              type="checkbox"
                              checked={s.modules.crm}
                              onChange={() => handleToggleModule(s.id, "crm")}
                              className="size-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary cursor-pointer"
                            />
                            <span>CRM</span>
                          </label>

                          {/* Financeiro */}
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-white">
                            <input
                              type="checkbox"
                              checked={s.modules.financeiro}
                              onChange={() => handleToggleModule(s.id, "financeiro")}
                              className="size-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary cursor-pointer"
                            />
                            <span>Financeiro</span>
                          </label>

                          {/* Pedagogico */}
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-white">
                            <input
                              type="checkbox"
                              checked={s.modules.pedagogico}
                              onChange={() => handleToggleModule(s.id, "pedagogico")}
                              className="size-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary cursor-pointer"
                            />
                            <span>Pedagógico</span>
                          </label>

                          {/* Success/Retencao */}
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-white">
                            <input
                              type="checkbox"
                              checked={s.modules.success}
                              onChange={() => handleToggleModule(s.id, "success")}
                              className="size-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary cursor-pointer"
                            />
                            <span>Retenção</span>
                          </label>
                        </div>

                      </td>
                      <td className="px-6 py-4 text-neutral-300 text-xs font-semibold">{s.studentsCount} alunos</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                          s.status === "Ativo"
                            ? "bg-paid/10 border-paid/20 text-paid"
                            : "bg-overdue/10 border-overdue/20 text-overdue"
                        }`}>
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
                <p className="font-bold uppercase tracking-wider">Aviso de Infraestrutura Instável</p>
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
                  <h3 className="text-sm font-semibold text-white">Banco de Dados (Supabase PostgreSQL)</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Conexão ativa de tabelas e RLS</p>
                </div>
                <span className={`size-3 rounded-full ${healthStatus.supabase ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`} />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Latência média: <strong>{healthStatus.supabase ? "18ms" : "---"}</strong></span>
                <button
                  onClick={() => handleToggleHealth("supabase")}
                  className="rounded bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors cursor-pointer"
                >
                  {healthStatus.supabase ? "Simular Falha" : "Restabelecer"}
                </button>
              </div>
            </GlassCard>

            {/* Stripe Gateway Webhooks */}
            <GlassCard className="p-6 space-y-4 border-white/5 bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Gateway de Pagamentos & Webhooks</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Processamento de mensalidades recorrentes B2B</p>
                </div>
                <span className={`size-3 rounded-full ${healthStatus.stripe ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`} />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Webhook Listeners: <strong>{healthStatus.stripe ? "Operacionais" : "Erro de Handshake"}</strong></span>
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
                  <h3 className="text-sm font-semibold text-white">Motor de Sincronia CRM & Funil</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Mapeador de leads e negócios integrados</p>
                </div>
                <span className={`size-3 rounded-full ${healthStatus.crm ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`} />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Status dos Worker queues: <strong>{healthStatus.crm ? "Online (0 pendentes)" : "Travado"}</strong></span>
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
                  <p className="text-[10px] text-neutral-400 mt-0.5">Envio de faturas, links de redefinição e cobranças</p>
                </div>
                <span className={`size-3 rounded-full ${healthStatus.aws ? "bg-paid shadow-[0_0_10px_#10b981]" : "bg-overdue animate-ping"}`} />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Entregabilidade: <strong>{healthStatus.aws ? "99.8% (Excelente)" : "Falha na Fila"}</strong></span>
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
            title="Ticker de Histórico & Usuários Online"
            description="Monitore as conexões ativas na plataforma e o histórico de auditoria técnica geral do backoffice."
          />

          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Online stats */}
            <GlassCard className="p-5 flex flex-col justify-between border-white/5 bg-neutral-900/40 md:col-span-1 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Usuários Ativos Agora</h4>
                <p className="text-3xl font-extrabold text-white mt-1">36 online</p>
              </div>
              <div className="space-y-2 text-xs text-neutral-400">
                <div className="flex justify-between">
                  <span>Alunos Conectados:</span>
                  <span className="font-semibold text-white">28</span>
                </div>
                <div className="flex justify-between">
                  <span>Gestores de Escola:</span>
                  <span className="font-semibold text-white">6</span>
                </div>
                <div className="flex justify-between">
                  <span>Colaboradores Master:</span>
                  <span className="font-semibold text-white">2</span>
                </div>
              </div>
            </GlassCard>

            {/* Audit Logs list */}
            <GlassCard className="p-6 border-white/5 bg-neutral-900/40 md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Histórico de Auditoria Geral (Audit Logs)</h4>
                <p className="text-[10px] text-neutral-500 mt-0.5">Eventos mais recentes processados no cluster</p>
              </div>

              <div className="space-y-3 font-mono text-[11px] text-neutral-300 max-h-[220px] overflow-y-auto pr-1">
                {[
                  { time: "12:44:02", desc: "Colaborador Thiago Carvalho logado como Desenvolvedor (Master)" },
                  { time: "12:43:18", desc: "Assinatura contratada: escola 'Apex English' ativou módulo CRM Comercial" },
                  { time: "12:41:40", desc: "Gestor da escola 'British Academy' realizou checkout self-service com sucesso" },
                  { time: "12:38:05", desc: "Boleto compensado com sucesso na Unidade Jardins (Fluency AI)" },
                  { time: "12:35:12", desc: "Nivelamento concluído pelo Lead Lucas Oliveira Ramos - Beginner A2" },
                  { time: "12:30:58", desc: "Backup incremental de tabelas PostgreSQL concluído sem erros" },
                  { time: "12:15:47", desc: "Ação Administrativa: Status da escola 'Apex English' alterado para ATIVO" },
                ].map((l, i) => (
                  <div key={i} className="flex gap-3 items-start border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-primary font-bold shrink-0">[{l.time}]</span>
                    <span>{l.desc}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

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
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                            t.role === "Administrador" ? "bg-primary/10 border-primary/20 text-primary" :
                            t.role === "Financeiro" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                            t.role === "Desenvolvedor" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                            "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          }`}>
                            {t.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                            t.status === "Ativo" ? "text-paid" : "text-neutral-500"
                          }`}>
                            <span className={`size-1.5 rounded-full ${t.status === "Ativo" ? "bg-paid animate-pulse" : "bg-neutral-500"}`} /> 
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
                <p className="text-xs text-neutral-400 mt-0.5">Adicione equipe para gerenciar o backoffice.</p>
              </div>

              <form onSubmit={handleAddTeamMember} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nome Completo</label>
                  <input
                    placeholder="Amanda Silva"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">E-mail Corporativo</label>
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
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Cargo / Nível de Acesso</label>
                  <select
                    value={teamRole}
                    onChange={(e) => setTeamRole(e.target.value as any)}
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
                  <p className="text-[10px] text-neutral-500">Nome exibido no canto superior esquerdo da barra de navegação principal.</p>
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
                  <p className="text-[10px] text-neutral-500 font-mono">Injeta esta cor primária em todos os botões e elementos de destaque.</p>
                </div>

                {/* Default Light/Dark Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Modo Inicial do Sistema</label>
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
                  <div className={`size-16 rounded-full border border-primary/20 grid place-items-center text-xl font-bold ${
                    profileAvatarId === "avatar-1" ? "bg-primary/20 text-primary" :
                    profileAvatarId === "avatar-2" ? "bg-emerald-500/20 text-emerald-400" :
                    "bg-indigo-500/20 text-indigo-400"
                  }`}>
                    {profileName.split(" ").map(w => w[0]).join("")}
                  </div>
                  
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                    <Camera className="size-4 text-white" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{profileName}</h4>
                  <p className="text-[10px] text-neutral-400">Administrador Geral da Plataforma SaaS</p>
                  
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
                          profileAvatarId === opt.id ? "border-primary ring-1 ring-primary" : "border-white/10"
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
                      {showProfilePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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

      {/* POPUP MODAL: EDIT SCHOOL DETAILS */}
      {isSchoolModalOpen && editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0e14] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Building className="size-5 text-primary" />
                <h3 className="text-base font-bold text-white">Editar Unidade: {editingSchool.name}</h3>
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
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nome da Escola</label>
                  <input
                    value={editingSchool.name}
                    onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Subdomain */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Subdomínio Privado</label>
                  <input
                    value={editingSchool.subdominio}
                    onChange={(e) => setEditingSchool({ ...editingSchool, subdominio: e.target.value })}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                
                {/* Contract Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status do Contrato</label>
                  <select
                    value={editingSchool.status}
                    onChange={(e) => setEditingSchool({ ...editingSchool, status: e.target.value as any })}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="Ativo">Ativo / Regular</option>
                    <option value="Inativo">Inativo / Bloqueado</option>
                    <option value="Atrasado">Mensalidade Atrasada</option>
                  </select>
                </div>

                {/* Student Count */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Quantidade de Alunos</label>
                  <input
                    type="number"
                    value={editingSchool.studentsCount}
                    onChange={(e) => setEditingSchool({ ...editingSchool, studentsCount: Number(e.target.value) })}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Teachers Limit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Limite de Professores</label>
                  <input
                    type="number"
                    value={editingSchool.teachersLimit}
                    onChange={(e) => setEditingSchool({ ...editingSchool, teachersLimit: Number(e.target.value) })}
                    className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                    required
                  />
                </div>

              </div>

              {/* Modules toggles in Popup */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Módulos Habilitados (Contrato SaaS)</label>
                <div className="grid grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  {Object.keys(editingSchool.modules).map((mKey) => {
                    const typedKey = mKey as keyof SchoolTenant["modules"];
                    return (
                      <label key={mKey} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                        <input
                          type="checkbox"
                          checked={editingSchool.modules[typedKey]}
                          onChange={(e) => setEditingSchool({
                            ...editingSchool,
                            modules: {
                              ...editingSchool.modules,
                              [typedKey]: e.target.checked,
                            },
                          })}
                          className="size-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="uppercase">{mKey}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* B2B Subscription Payment History */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="size-4 text-neutral-400" /> Histórico de Faturas do SaaS (B2B Billing)
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
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nome Completo</label>
                <input
                  value={editingTeamMember.name}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">E-mail Corporativo</label>
                <input
                  type="email"
                  value={editingTeamMember.email}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, email: e.target.value })}
                  className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-xs text-white outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Cargo Master</label>
                <select
                  value={editingTeamMember.role}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, role: e.target.value as any })}
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
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Situação da Conta</label>
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
