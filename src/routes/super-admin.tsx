import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building, ShieldAlert, Sparkles, Sliders, CheckCircle2, XCircle, LogOut, Wallet, Users, Key } from "lucide-react";
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

type SchoolTenant = {
  id: string;
  name: string;
  subdominio: string;
  status: "Ativo" | "Inativo" | "Atrasado";
  modules: {
    crm: boolean;
    financeiro: boolean;
    pedagogico: boolean;
    success: boolean;
  };
};

const DEFAULT_SCHOOLS: SchoolTenant[] = [
  {
    id: "1",
    name: "Fluency AI (Original)",
    subdominio: "original.fluency.ai",
    status: "Ativo",
    modules: { crm: true, financeiro: true, pedagogico: true, success: true },
  },
  {
    id: "2",
    name: "Apex English",
    subdominio: "apex.fluency.ai",
    status: "Ativo",
    modules: { crm: true, financeiro: true, pedagogico: true, success: false },
  },
  {
    id: "3",
    name: "British Academy",
    subdominio: "british.fluency.ai",
    status: "Ativo",
    modules: { crm: false, financeiro: true, pedagogico: true, success: true },
  },
];

const STORAGE_KEY = "fluency-ai:super-admin:schools";

function SuperAdminPage() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolTenant[]>(DEFAULT_SCHOOLS);

  // Load from local storage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSchools(JSON.parse(raw));
      }
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

  const handleToggleModule = (schoolId: string, moduleKey: keyof SchoolTenant["modules"]) => {
    const nextSchools = schools.map((s) => {
      if (s.id === schoolId) {
        const nextVal = !s.modules[moduleKey];
        toast.info(`Módulo ${moduleKey.toUpperCase()} da escola ${s.name} foi ${nextVal ? "ativado" : "desativado"}!`);
        return {
          ...s,
          modules: {
            ...s.modules,
            [moduleKey]: nextVal,
          },
        };
      }
      return s;
    });

    saveSchools(nextSchools);

    // If the edited school is the current active school ("Fluency AI"), we can also sync to the active modules context
    // This allows the super admin to see modules lock/unlock instantly on the ERP!
    const activeSchool = nextSchools.find((s) => s.id === schoolId);
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

  const handleToggleStatus = (schoolId: string) => {
    const nextSchools = schools.map((s) => {
      if (s.id === schoolId) {
        const nextStatus = s.status === "Ativo" ? "Inativo" : "Ativo";
        toast.success(`Situação da escola ${s.name} alterada para ${nextStatus}!`);
        return { ...s, status: nextStatus };
      }
      return s;
    });
    saveSchools(nextSchools);
  };

  const totalMRR = schools.filter(s => s.status === "Ativo").reduce((sum, s) => {
    let base = 299; // core base price
    if (s.modules.crm) base += 149;
    if (s.modules.financeiro) base += 199;
    if (s.modules.success) base += 99;
    return sum + base;
  }, 0);

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-6 sm:p-12 md:max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 border border-primary/20">
            <Sliders className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-foreground">Fluency AI Master</h1>
            <p className="text-xs text-muted-foreground">Console do Administrador da Plataforma</p>
          </div>
        </div>

        <button
          onClick={() => {
            toast.success("Desconectado do Painel Master!");
            navigate({ to: "/login" });
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3.5 py-2 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
        >
          <LogOut className="size-3.5" /> Sair do Console
        </button>
      </div>

      <SectionHeader
        eyebrow="Plataforma SaaS B2B"
        title="Controle Geral de Escolas Contratantes"
        description="Gerencie os planos contratados de cada unidade, libere ou bloqueie funcionalidades sob demanda e acompanhe o MRR consolidado."
      />

      {/* General Platform KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faturamento Recorrente (MRR)</p>
            <p className="mt-1 text-2xl font-bold text-foreground">R$ {totalMRR.toLocaleString("pt-BR")},00</p>
            <p className="text-[10px] text-muted-foreground mt-1">Soma de todas as mensalidades ativas</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-paid/10 border border-paid/20">
            <Wallet className="size-5 text-paid" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Escolas Ativas</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{schools.filter(s => s.status === "Ativo").length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Unidades com acesso liberado</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
            <Building className="size-5 text-primary" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Módulos Ativados</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {schools.reduce((acc, s) => acc + Object.values(s.modules).filter(Boolean).length, 0)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Add-ons instalados na base</p>
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
            Como Dono da Plataforma, você tem a chave mestra para habilitar e desabilitar módulos. Qualquer alteração efetuada nos toggles abaixo reflete diretamente no ERP da escola correspondente. O gestor da escola pode também fazer contratação self-service e os botões serão ativados.
          </p>
        </div>
      </div>

      {/* Schools directory table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-elevated/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Nome da Escola (Tenant)</th>
                <th className="px-6 py-4">Subdomínio</th>
                <th className="px-6 py-4">Módulos Contratados</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ação Contrato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {schools.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-surface/30">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">ID: #{s.id}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{s.subdominio}</td>
                  <td className="px-6 py-4">
                    
                    {/* Toggles Grid */}
                    <div className="grid gap-2 sm:grid-cols-2 max-w-xs">
                      
                      {/* CRM module toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={s.modules.crm}
                          onChange={() => handleToggleModule(s.id, "crm")}
                          className="size-4 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>CRM</span>
                      </label>

                      {/* Financeiro module toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={s.modules.financeiro}
                          onChange={() => handleToggleModule(s.id, "financeiro")}
                          className="size-4 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>Financeiro</span>
                      </label>

                      {/* Pedagogico module toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={s.modules.pedagogico}
                          onChange={() => handleToggleModule(s.id, "pedagogico")}
                          className="size-4 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>Pedagógico</span>
                      </label>

                      {/* Success/Retencao module toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={s.modules.success}
                          onChange={() => handleToggleModule(s.id, "success")}
                          className="size-4 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>Retenção</span>
                      </label>

                    </div>

                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      s.status === "Ativo"
                        ? "bg-paid/10 border-paid/20 text-paid"
                        : "bg-overdue/10 border-overdue/20 text-overdue"
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(s.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow cursor-pointer transition-all ${
                        s.status === "Ativo"
                          ? "bg-overdue text-destructive-foreground hover:bg-overdue/95"
                          : "bg-paid text-paid-foreground hover:bg-paid/95"
                      }`}
                    >
                      {s.status === "Ativo" ? "Bloquear Escola" : "Ativar Escola"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}
