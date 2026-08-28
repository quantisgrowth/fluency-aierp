import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Wallet,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileSpreadsheet,
  Receipt,
  Tag,
  Plus,
  Trash2,
  DollarSign,
  PieChart as PieChartIcon,
  Percent,
  Users,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Check,
  HelpCircle,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { ModuleGate } from "@/components/module-gate";
import {
  brl,
  delinquency,
  dunningSteps,
  revenueSeries,
  initialSchoolCosts,
  defaultPricingPolicy,
  type SchoolCost,
  type CostCategory,
  type PricingPolicy,
  type PricingModelType,
  classes as defaultClasses,
  students as defaultStudents,
} from "@/data/mock";
import { toast } from "sonner";
import { useUser } from "@/modules/user-context";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Motor Financeiro, DRE & Precificação — Fluency AI" },
      { name: "description", content: "DRE Gerencial, Gestão de Custos, Políticas de Precificação e Previsão de Caixa." },
    ],
  }),
  component: FinanceiroPage,
});

const DELINQUENCY_KEY = "fluency-ai:finance:delinquency";
const COSTS_KEY = "fluency-ai:finance:costs";
const PRICING_KEY = "fluency-ai:finance:pricing-policy";

const CATEGORY_COLORS: Record<CostCategory, string> = {
  "Folha Docente (Professores)": "#3b82f6",
  "Infraestrutura & Imóvel": "#8b5cf6",
  "Utilidades & Consumo": "#f59e0b",
  "Administrativo & Operacional": "#10b981",
  "Marketing & Captação": "#ec4899",
  "Materiais & Recursos Pedagógicos": "#06b6d4",
  "Sistemas, TI & Licenças": "#6366f1",
};

function FinanceiroPage() {
  const { activeRole } = useUser();
  const [activeTab, setActiveTab] = useState<"fluxo-caixa" | "dre" | "custos" | "precificacao">("fluxo-caixa");

  // Inadimplência
  const [delinquencyList, setDelinquencyList] = useState<typeof delinquency>(() => {
    try {
      const stored = window.localStorage.getItem(DELINQUENCY_KEY);
      return stored ? JSON.parse(stored) : delinquency;
    } catch {
      return delinquency;
    }
  });

  // Custos da Escola
  const [costs, setCosts] = useState<SchoolCost[]>(() => {
    try {
      const stored = window.localStorage.getItem(COSTS_KEY);
      return stored ? JSON.parse(stored) : initialSchoolCosts;
    } catch {
      return initialSchoolCosts;
    }
  });

  // Política de Precificação
  const [pricing, setPricing] = useState<PricingPolicy>(() => {
    try {
      const stored = window.localStorage.getItem(PRICING_KEY);
      return stored ? JSON.parse(stored) : defaultPricingPolicy;
    } catch {
      return defaultPricingPolicy;
    }
  });

  // Filtros de Custos
  const [costSearch, setCostSearch] = useState("");
  const [costCategoryFilter, setCostCategoryFilter] = useState<string>("Todas");
  const [costTypeFilter, setCostTypeFilter] = useState<"todos" | "fixo" | "variavel">("todos");

  // Modal Novo Custo
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<SchoolCost | null>(null);
  const [costDesc, setCostDesc] = useState("");
  const [costCat, setCostCat] = useState<CostCategory>("Infraestrutura & Imóvel");
  const [costTipo, setCostTipo] = useState<"fixo" | "variavel">("fixo");
  const [costValor, setCostValor] = useState<number>(1000);
  const [costFreq, setCostFreq] = useState<"mensal" | "anual" | "por_aluno" | "por_hora_aula">("mensal");
  const [costVencimento, setCostVencimento] = useState<number>(10);
  const [costResp, setCostResp] = useState("");
  const [costObs, setCostObs] = useState("");

  // Simulador de Preço e Margem
  const [simAlunos, setSimAlunos] = useState<number>(12);
  const [simHorasSemanais, setSimHorasSemanais] = useState<number>(3);
  const [simMargemAlvo, setSimMargemAlvo] = useState<number>(40);

  // Sync to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(COSTS_KEY, JSON.stringify(costs));
    } catch {}
  }, [costs]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PRICING_KEY, JSON.stringify(pricing));
    } catch {}
  }, [pricing]);

  const saveDelinquency = (next: typeof delinquency) => {
    setDelinquencyList(next);
    try {
      window.localStorage.setItem(DELINQUENCY_KEY, JSON.stringify(next));
    } catch {}
  };

  const triggerDunningSim = (aluno: string) => {
    toast.success(`Simulação ativada para ${aluno}`, {
      description: "Disparando régua automática de e-mail e WhatsApp em sandbox.",
    });
  };

  const handleCancelBilling = (aluno: string) => {
    if (activeRole === "operador") {
      toast.error("Permissão negada", {
        description: "Operadores não possuem permissão para cancelar cobranças no sistema.",
      });
      return;
    }
    const next = delinquencyList.filter((d) => d.aluno !== aluno);
    saveDelinquency(next);
    toast.success(`Cobrança de ${aluno} cancelada com sucesso!`);
  };

  // --- CÁLCULOS DO DRE & UNIT ECONOMICS ---
  const fixedCostsTotal = costs
    .filter((c) => c.tipo === "fixo")
    .reduce((sum, c) => sum + (c.frequencia === "anual" ? c.valor / 12 : c.valor), 0);

  // Estimativa de alunos ativos e turmas
  const totalAlunosAtivos = 71; // Base de alunos ativos do mock
  const totalTurmasAtivas = 6;
  const horasSemanaisTotais = 18; // Soma das horas das turmas
  const horasMensaisDocentes = horasSemanaisTotais * 4.33; // ~78 horas/mês
  const custoDocenteTotal = horasMensaisDocentes * pricing.valorHoraProfessorMedio;

  // Receita Bruta Estimada baseada na política ativa
  const receitaBrutaMensal = (() => {
    if (pricing.modeloAtivo === "mensalidade_fixa") {
      return totalAlunosAtivos * 480; // Média ponderada pelos níveis
    } else if (pricing.modeloAtivo === "hora_aula") {
      return totalAlunosAtivos * (3 * 4.33 * pricing.valorHoraAula);
    } else if (pricing.modeloAtivo === "frequencia_semanal") {
      return totalAlunosAtivos * 460;
    } else {
      return totalAlunosAtivos * (pricing.pacoteSemestral.valorTotal / 6);
    }
  })();

  const receitaMateriais = totalAlunosAtivos * 35; // Amortização mensal de livros e materiais
  const receitaMatriculas = 8 * pricing.taxaMatricula; // 8 novas matrículas/mês
  const faturamentoBrutoTotal = receitaBrutaMensal + receitaMateriais + receitaMatriculas;

  // Deduções e Inadimplência
  const totalInadimplencia = delinquencyList.reduce((sum, d) => sum + d.valor, 0);
  const deducoesComerciaisEBolsas = faturamentoBrutoTotal * 0.05; // 5% de bolsas/descontos
  const deducoesTotais = (totalInadimplencia * 0.3) + deducoesComerciaisEBolsas;

  const receitaLiquida = faturamentoBrutoTotal - deducoesTotais;

  // Custos Diretos de Ensino (Variáveis)
  const custoMateriaisLivros = totalAlunosAtivos * 18; // Custo de reposição de livros
  const custosDiretosEnsino = custoDocenteTotal + custoMateriaisLivros;

  // Margem de Contribuição Bruta
  const margemContribuicao = receitaLiquida - custosDiretosEnsino;
  const margemContribuicaoPct = (margemContribuicao / receitaLiquida) * 100;

  // Lucro Operacional Líquido (EBITDA)
  const lucroOperacionalLiquido = margemContribuicao - fixedCostsTotal;
  const margemLiquidaPct = (lucroOperacionalLiquido / receitaLiquida) * 100;

  // Ponto de Equilíbrio Geral da Escola (Break-Even em alunos)
  const margemMediaPorAluno = (receitaBrutaMensal / totalAlunosAtivos) - (custosDiretosEnsino / totalAlunosAtivos);
  const alunosBreakEven = margemMediaPorAluno > 0 ? Math.ceil(fixedCostsTotal / margemMediaPorAluno) : 0;
  const faturamentoBreakEven = alunosBreakEven * (receitaBrutaMensal / totalAlunosAtivos);

  // Ticket Médio
  const ticketMedioPorAluno = receitaBrutaMensal / totalAlunosAtivos;

  // Custos filtrados
  const filteredCosts = costs.filter((c) => {
    const matchesSearch = c.descricao.toLowerCase().includes(costSearch.toLowerCase()) ||
                          c.categoria.toLowerCase().includes(costSearch.toLowerCase()) ||
                          (c.responsavel && c.responsavel.toLowerCase().includes(costSearch.toLowerCase()));
    const matchesCategory = costCategoryFilter === "Todas" || c.categoria === costCategoryFilter;
    const matchesType = costTypeFilter === "todos" || c.tipo === costTypeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Dados para Gráfico de Distribuição de Custos
  const costsByCategory = costs.reduce((acc, c) => {
    const val = c.frequencia === "anual" ? c.valor / 12 : c.valor;
    acc[c.categoria] = (acc[c.categoria] || 0) + val;
    return acc;
  }, {} as Record<string, number>);

  const pieCostsData = Object.entries(costsByCategory).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name as CostCategory] || "#3b82f6",
  }));

  // Handlers para Custo
  const handleOpenNewCost = () => {
    setEditingCost(null);
    setCostDesc("");
    setCostCat("Infraestrutura & Imóvel");
    setCostTipo("fixo");
    setCostValor(1000);
    setCostFreq("mensal");
    setCostVencimento(10);
    setCostResp("Administração");
    setCostObs("");
    setIsCostModalOpen(true);
  };

  const handleOpenEditCost = (cost: SchoolCost) => {
    setEditingCost(cost);
    setCostDesc(cost.descricao);
    setCostCat(cost.categoria);
    setCostTipo(cost.tipo);
    setCostValor(cost.valor);
    setCostFreq(cost.frequencia);
    setCostVencimento(cost.diaVencimento || 10);
    setCostResp(cost.responsavel || "");
    setCostObs(cost.observacoes || "");
    setIsCostModalOpen(true);
  };

  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costDesc || costValor <= 0) {
      toast.error("Preencha a descrição e um valor válido.");
      return;
    }

    if (editingCost) {
      setCosts(
        costs.map((c) =>
          c.id === editingCost.id
            ? {
                ...c,
                descricao: costDesc,
                categoria: costCat,
                tipo: costTipo,
                valor: Number(costValor),
                frequencia: costFreq,
                diaVencimento: Number(costVencimento),
                responsavel: costResp,
                observacoes: costObs,
              }
            : c
        )
      );
      toast.success("Despesa atualizada com sucesso!");
    } else {
      const newCost: SchoolCost = {
        id: `cost-${Date.now()}`,
        descricao: costDesc,
        categoria: costCat,
        tipo: costTipo,
        valor: Number(costValor),
        frequencia: costFreq,
        recorrente: true,
        diaVencimento: Number(costVencimento),
        responsavel: costResp,
        observacoes: costObs,
      };
      setCosts([...costs, newCost]);
      toast.success("Nova despesa cadastrada no sistema!");
    }
    setIsCostModalOpen(false);
  };

  const handleDeleteCost = (id: string, desc: string) => {
    if (!confirm(`Deseja remover a despesa "${desc}"?`)) return;
    setCosts(costs.filter((c) => c.id !== id));
    toast.success(`Despesa "${desc}" excluída.`);
  };

  // Handler para atualizar pricing policy
  const handleUpdatePricingModel = (model: PricingModelType) => {
    setPricing({ ...pricing, modeloAtivo: model });
    toast.success(`Modelo de precificação alterado para: ${
      model === "mensalidade_fixa"
        ? "Mensalidade Fixa por Nível"
        : model === "hora_aula"
        ? "Cobrança por Hora/Aula"
        : model === "frequencia_semanal"
        ? "Por Frequência Semanal"
        : "Pacote Fechado / Semestral"
    }`);
  };

  return (
    <ModuleGate module="financeiro">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação & Finanças"
          title="Gestão Financeira, DRE & Precificação"
          description="Controle a liquidez, analise o DRE com ponto de equilíbrio, gerencie despesas fixas e configure suas regras de precificação."
        />

        {/* Navigation Tabs */}
        <div className="flex border-b border-hairline gap-8 pb-0.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("fluxo-caixa")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 shrink-0 ${
              activeTab === "fluxo-caixa"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="size-4" /> Fluxo de Caixa & Inadimplência
          </button>
          <button
            onClick={() => setActiveTab("dre")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 shrink-0 ${
              activeTab === "dre"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="size-4" /> DRE Gerencial & Lucro
          </button>
          <button
            onClick={() => setActiveTab("custos")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 shrink-0 ${
              activeTab === "custos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="size-4" /> Cadastro de Custos ({costs.length})
          </button>
          <button
            onClick={() => setActiveTab("precificacao")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 shrink-0 ${
              activeTab === "precificacao"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="size-4" /> Fórmulas de Precificação & Margem
          </button>
        </div>

        {/* TAB 1: FLUXO DE CAIXA & INADIMPLÊNCIA */}
        {activeTab === "fluxo-caixa" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Charts block */}
            <div className="grid gap-4 xl:grid-cols-3">
              {/* Caixa chart */}
              <GlassCard className="p-6 xl:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Previsibilidade de Caixa</p>
                  <p className="text-xs text-muted-foreground">Realizado vs. previsto — últimos 6 meses</p>
                </div>
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries} margin={{ left: -18, right: 6, top: 6 }}>
                      <defs>
                        <linearGradient id="realizado_fin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                      <XAxis
                        dataKey="mes"
                        stroke="var(--muted-foreground)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--hairline)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => brl(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="previsto"
                        stroke="var(--chart-5)"
                        strokeDasharray="4 4"
                        fill="transparent"
                        strokeWidth={1.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="realizado"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        fill="url(#realizado_fin)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Dunning Configuration Preview */}
              <GlassCard className="p-6">
                <h3 className="text-sm font-semibold text-foreground">Régua de Cobrança Inteligente</h3>
                <p className="text-xs text-muted-foreground">Regras ativas no plano de comunicação da unidade</p>
                
                <div className="mt-5 space-y-4">
                  {dunningSteps.map((step) => (
                    <div key={step.dia} className="flex items-start gap-3 text-xs">
                      <span className="mt-0.5 rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                        {step.dia}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{step.acao}</p>
                          <span className="text-[10px] text-muted-foreground">{step.canal}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3 text-paid" /> {step.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Lower layout block */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Delinquency warnings list */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Controle de Inadimplência</h3>
                    <p className="text-xs text-muted-foreground">Faturas vencidas que requerem atenção</p>
                  </div>
                  <span className="rounded-full bg-overdue/10 border border-overdue/20 px-2.5 py-1 text-xs text-overdue flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="size-3.5" /> Foco de Caixa
                  </span>
                </div>

                <ul className="mt-6 divide-y divide-hairline">
                  {delinquencyList.map((d) => (
                    <li key={d.aluno} className="flex items-center justify-between py-3.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.aluno}</p>
                        <p className="text-xs text-muted-foreground">{d.turma}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{brl(d.valor)}</p>
                          <p className="text-[10px] text-overdue font-semibold">{d.dias} dias de atraso</p>
                        </div>
                        <button
                          onClick={() => triggerDunningSim(d.aluno)}
                          title="Enviar Cobrança"
                          className="grid size-8 place-items-center rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <Send className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleCancelBilling(d.aluno)}
                          title={activeRole === "operador" ? "Operador não pode cancelar cobranças" : "Cancelar Cobrança"}
                          className={`grid size-8 place-items-center rounded-lg border border-hairline transition-all ${
                            activeRole === "operador"
                              ? "opacity-25 cursor-not-allowed"
                              : "hover:bg-overdue/10 text-muted-foreground hover:text-overdue cursor-pointer"
                          }`}
                        >
                          <XCircle className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>

              {/* Quick simulation card */}
              <GlassCard className="p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                    <Wallet className="size-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Gerador Simulado de Cobranças</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gere arquivos de boleto ou QR codes de Pix em ambiente de testes para demonstração da emissão unificada.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() => toast.success("Boleto PDF simulado gerado!")}
                    className="flex items-center justify-center gap-2 rounded-lg border border-hairline py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
                  >
                    Simular Boleto
                  </button>
                  <button
                    onClick={() => toast.success("Pix Copia e Cola gerado!", { description: "00020101021226870014br.gov.bcb.pix..." })}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow transition-all cursor-pointer"
                  >
                    Simular Pix QR
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* TAB 2: DRE GERENCIAL & LUCRATIVIDADE */}
        {activeTab === "dre" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GlassCard className="p-5 space-y-2 border-primary/20">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Receita Líquida Operacional</span>
                  <ArrowUpRight className="size-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{brl(receitaLiquida)}</p>
                <p className="text-[11px] text-muted-foreground">Faturamento bruto: {brl(faturamentoBrutoTotal)}</p>
              </GlassCard>

              <GlassCard className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Margem de Contribuição</span>
                  <Percent className="size-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{brl(margemContribuicao)}</p>
                <p className="text-[11px] text-muted-foreground">Margem Bruta de Ensino: <strong>{margemContribuicaoPct.toFixed(1)}%</strong></p>
              </GlassCard>

              <GlassCard className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Despesas Fixas da Escola</span>
                  <ArrowDownRight className="size-4 text-rose-400" />
                </div>
                <p className="text-2xl font-bold text-rose-400">{brl(fixedCostsTotal)}</p>
                <p className="text-[11px] text-muted-foreground">{costs.filter(c => c.tipo === "fixo").length} despesas fixas cadastradas</p>
              </GlassCard>

              <GlassCard className={`p-5 space-y-2 ${lucroOperacionalLiquido >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">EBITDA / Lucro Operacional</span>
                  <TrendingUp className={`size-4 ${lucroOperacionalLiquido >= 0 ? "text-emerald-400" : "text-rose-400"}`} />
                </div>
                <p className={`text-2xl font-bold ${lucroOperacionalLiquido >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {brl(lucroOperacionalLiquido)}
                </p>
                <p className="text-[11px] text-muted-foreground">Margem Líquida da Escola: <strong>{margemLiquidaPct.toFixed(1)}%</strong></p>
              </GlassCard>
            </div>

            {/* Break-Even & Ticket Médio Intelligence Banner */}
            <div className="grid gap-4 lg:grid-cols-3">
              <GlassCard className="p-6 lg:col-span-2 flex flex-col justify-between space-y-4 border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 mt-0.5">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Ponto de Equilíbrio Geral (Break-Even da Escola)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Para cobrir 100% de todas as despesas fixas (Aluguel, Folha Adm, Energia, Marketing) e custos docentes, sua escola precisa manter no mínimo:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-hairline/60">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Alunos Necessários</p>
                    <p className="text-xl font-bold text-amber-500">{alunosBreakEven} Alunos</p>
                    <p className="text-[10px] text-muted-foreground">Atualmente: {totalAlunosAtivos} ({totalAlunosAtivos - alunosBreakEven > 0 ? `+${totalAlunosAtivos - alunosBreakEven} de margem segura` : "Abaixo da meta"})</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Faturamento Mínimo</p>
                    <p className="text-xl font-bold text-foreground">{brl(faturamentoBreakEven)}</p>
                    <p className="text-[10px] text-muted-foreground">Ponto zero de lucro/prejuízo</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Ticket Médio / Aluno</p>
                    <p className="text-xl font-bold text-foreground">{brl(ticketMedioPorAluno)}</p>
                    <p className="text-[10px] text-muted-foreground">Mensalidade média apurada</p>
                  </div>
                </div>
              </GlassCard>

              {/* Distribution Chart */}
              <GlassCard className="p-6 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Composição das Despesas</h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieCostsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieCostsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => brl(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 text-[11px] max-h-24 overflow-y-auto pr-1">
                  {pieCostsData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-muted-foreground">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="font-semibold text-foreground shrink-0">{brl(item.value)}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* DRE DETALHADO (TABELA ESTRUTURADA) */}
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Demonstrativo de Resultado do Exercício (DRE Gerencial)</h3>
                  <p className="text-xs text-muted-foreground">Visão analítica mensal consolidada da escola.</p>
                </div>
                <span className="rounded-lg bg-surface border border-hairline px-3 py-1 text-xs font-semibold text-foreground">
                  Agosto 2026
                </span>
              </div>

              <div className="divide-y divide-hairline text-sm">
                
                {/* 1. RECEITA BRUTA */}
                <div className="py-3 flex justify-between items-center font-bold text-foreground bg-surface/30 px-3 rounded-lg">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-emerald-400" />
                    1. RECEITA BRUTA TOTAL
                  </span>
                  <span>{brl(faturamentoBrutoTotal)}</span>
                </div>
                <div className="py-2 pl-8 pr-3 flex justify-between items-center text-xs text-muted-foreground">
                  <span>(+) Mensalidades de Cursos ({totalAlunosAtivos} alunos ativos)</span>
                  <span>{brl(receitaBrutaMensal)}</span>
                </div>
                <div className="py-2 pl-8 pr-3 flex justify-between items-center text-xs text-muted-foreground">
                  <span>(+) Matrículas & Rematrículas</span>
                  <span>{brl(receitaMatriculas)}</span>
                </div>
                <div className="py-2 pl-8 pr-3 flex justify-between items-center text-xs text-muted-foreground">
                  <span>(+) Materiais Didáticos & Livros</span>
                  <span>{brl(receitaMateriais)}</span>
                </div>

                {/* 2. DEDUÇÕES */}
                <div className="py-3 flex justify-between items-center font-semibold text-rose-400 px-3">
                  <span>(-) 2. Deduções da Receita Bruta (Inadimplência & Bolsas)</span>
                  <span>- {brl(deducoesTotais)}</span>
                </div>

                {/* 3. RECEITA LÍQUIDA */}
                <div className="py-3 flex justify-between items-center font-bold text-foreground bg-primary/5 px-3 rounded-lg border border-primary/20">
                  <span className="text-primary">(=) 3. RECEITA LÍQUIDA OPERACIONAL</span>
                  <span className="text-primary">{brl(receitaLiquida)}</span>
                </div>

                {/* 4. CUSTOS DIRETOS */}
                <div className="py-3 flex justify-between items-center font-semibold text-foreground px-3">
                  <span>(-) 4. CUSTOS DIRETOS DE ENSINO (VARIÁVEIS)</span>
                  <span className="text-rose-400">- {brl(custosDiretosEnsino)}</span>
                </div>
                <div className="py-2 pl-8 pr-3 flex justify-between items-center text-xs text-muted-foreground">
                  <span>(-) Folha Docente / Professores ({horasMensaisDocentes.toFixed(0)}h lecionadas a {brl(pricing.valorHoraProfessorMedio)}/h)</span>
                  <span>- {brl(custoDocenteTotal)}</span>
                </div>
                <div className="py-2 pl-8 pr-3 flex justify-between items-center text-xs text-muted-foreground">
                  <span>(-) Custo de Aquisição de Livros / Materiais</span>
                  <span>- {brl(custoMateriaisLivros)}</span>
                </div>

                {/* 5. MARGEM DE CONTRIBUIÇÃO */}
                <div className="py-3 flex justify-between items-center font-bold text-blue-400 bg-blue-500/5 px-3 rounded-lg border border-blue-500/20">
                  <span>(=) 5. MARGEM DE CONTRIBUIÇÃO BRUTA ({margemContribuicaoPct.toFixed(1)}%)</span>
                  <span>{brl(margemContribuicao)}</span>
                </div>

                {/* 6. DESPESAS FIXAS */}
                <div className="py-3 flex justify-between items-center font-semibold text-foreground px-3">
                  <span>(-) 6. DESPESAS OPERACIONAIS & ADMINISTRATIVAS FIXAS</span>
                  <span className="text-rose-400">- {brl(fixedCostsTotal)}</span>
                </div>
                {costs
                  .filter((c) => c.tipo === "fixo")
                  .map((c) => (
                    <div key={c.id} className="py-1.5 pl-8 pr-3 flex justify-between items-center text-xs text-muted-foreground">
                      <span>(-) {c.descricao}</span>
                      <span>- {brl(c.frequencia === "anual" ? c.valor / 12 : c.valor)}</span>
                    </div>
                  ))}

                {/* 7. EBITDA / LUCRO LÍQUIDO */}
                <div className={`py-4 flex justify-between items-center font-extrabold text-base px-3 rounded-lg border ${
                  lucroOperacionalLiquido >= 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}>
                  <span>(=) 7. EBITDA / RESULTADO OPERACIONAL LÍQUIDO ({margemLiquidaPct.toFixed(1)}%)</span>
                  <span>{brl(lucroOperacionalLiquido)}</span>
                </div>

              </div>
            </GlassCard>
          </div>
        )}

        {/* TAB 3: CADASTRO & GESTÃO DE CUSTOS */}
        {activeTab === "custos" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Catálogo de Despesas & Custos da Unidade</h3>
                <p className="text-xs text-muted-foreground">
                  Despesas fixas mensais consolidadas: <strong className="text-rose-400">{brl(fixedCostsTotal)}/mês</strong>
                </p>
              </div>

              <button
                onClick={handleOpenNewCost}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <Plus className="size-4" /> + Nova Despesa
              </button>
            </div>

            {/* Filters */}
            <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <input
                placeholder="Buscar despesa por nome, responsável ou categoria..."
                value={costSearch}
                onChange={(e) => setCostSearch(e.target.value)}
                className="h-10 w-full md:max-w-md rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
              />

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={costCategoryFilter}
                  onChange={(e) => setCostCategoryFilter(e.target.value)}
                  className="h-10 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Todas">Todas as Categorias</option>
                  <option value="Folha Docente (Professores)">Folha Docente (Professores)</option>
                  <option value="Infraestrutura & Imóvel">Infraestrutura & Imóvel</option>
                  <option value="Utilidades & Consumo">Utilidades & Consumo</option>
                  <option value="Administrativo & Operacional">Administrativo & Operacional</option>
                  <option value="Marketing & Captação">Marketing & Captação</option>
                  <option value="Materiais & Recursos Pedagógicos">Materiais & Recursos Pedagógicos</option>
                  <option value="Sistemas, TI & Licenças">Sistemas, TI & Licenças</option>
                </select>

                <div className="flex border border-hairline rounded-lg overflow-hidden bg-surface/40 p-0.5">
                  <button
                    onClick={() => setCostTypeFilter("todos")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border-0 rounded-md ${
                      costTypeFilter === "todos" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground bg-transparent"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setCostTypeFilter("fixo")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border-0 rounded-md ${
                      costTypeFilter === "fixo" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground bg-transparent"
                    }`}
                  >
                    Fixos
                  </button>
                  <button
                    onClick={() => setCostTypeFilter("variavel")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border-0 rounded-md ${
                      costTypeFilter === "variavel" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground bg-transparent"
                    }`}
                  >
                    Variáveis
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Costs Table / Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCosts.map((cost) => {
                const categoryColor = CATEGORY_COLORS[cost.categoria] || "#3b82f6";

                return (
                  <GlassCard key={cost.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: `${categoryColor}15`,
                            borderColor: `${categoryColor}40`,
                            color: categoryColor,
                          }}
                        >
                          {cost.categoria}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          cost.tipo === "fixo"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {cost.tipo}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-foreground leading-snug">{cost.descricao}</h4>
                      {cost.observacoes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{cost.observacoes}</p>
                      )}
                    </div>

                    <div className="space-y-3 pt-3 border-t border-hairline">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Valor / Frequência</span>
                        <span className="text-base font-bold text-foreground">
                          {brl(cost.valor)}
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {cost.frequencia === "mensal"
                              ? "/mês"
                              : cost.frequencia === "anual"
                              ? "/ano"
                              : cost.frequencia === "por_hora_aula"
                              ? "/hora"
                              : "/aluno"}
                          </span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>Resp: {cost.responsavel || "Unidade"}</span>
                        {cost.diaVencimento && <span>Vence dia {cost.diaVencimento}</span>}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleOpenEditCost(cost)}
                          className="flex-1 rounded-lg border border-hairline bg-surface/50 py-1.5 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCost(cost.id, cost.descricao)}
                          className="px-2.5 rounded-lg border border-hairline bg-surface/50 py-1.5 text-xs text-muted-foreground hover:text-overdue hover:bg-overdue/10 cursor-pointer transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: FÓRMULAS DE PRECIFICAÇÃO & SIMULADOR DE MARGEM */}
        {activeTab === "precificacao" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Active Model Selector Cards */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Escolha o Modelo de Precificação da Escola</h3>
                <p className="text-xs text-muted-foreground">
                  Selecione como a sua escola prefere cobrar os cursos. Essa regra será aplicada na sugestão de matrículas e no cálculo de faturamento das turmas.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Option 1 */}
                <GlassCard
                  onClick={() => handleUpdatePricingModel("mensalidade_fixa")}
                  className={`p-5 space-y-3 cursor-pointer transition-all ${
                    pricing.modeloAtivo === "mensalidade_fixa"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "hover:border-hairline/80 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-primary">1. Mensalidade Fixa / Nível</span>
                    {pricing.modeloAtivo === "mensalidade_fixa" && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-foreground font-semibold">Tabela Fixa por Estágio CEFR</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ideal para franquias tradicionais. O aluno paga um valor fixo mensal de acordo com o nível (A1, A2, B1, B2, C1, C2).
                  </p>
                  <p className="text-xs font-bold text-foreground pt-2 border-t border-hairline">
                    Média: {brl(pricing.mensalidadePadrao)}/mês
                  </p>
                </GlassCard>

                {/* Option 2 */}
                <GlassCard
                  onClick={() => handleUpdatePricingModel("hora_aula")}
                  className={`p-5 space-y-3 cursor-pointer transition-all ${
                    pricing.modeloAtivo === "hora_aula"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "hover:border-hairline/80 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-primary">2. Valor por Hora/Aula</span>
                    {pricing.modeloAtivo === "hora_aula" && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-foreground font-semibold">Cálculo por Horas Consumidas</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ideal para cursos VIP, particulares ou grupos reduzidos. A mensalidade varia conforme a carga horária semanal.
                  </p>
                  <p className="text-xs font-bold text-foreground pt-2 border-t border-hairline">
                    Taxa: {brl(pricing.valorHoraAula)} / hora
                  </p>
                </GlassCard>

                {/* Option 3 */}
                <GlassCard
                  onClick={() => handleUpdatePricingModel("frequencia_semanal")}
                  className={`p-5 space-y-3 cursor-pointer transition-all ${
                    pricing.modeloAtivo === "frequencia_semanal"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "hover:border-hairline/80 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-primary">3. Frequência Semanal</span>
                    {pricing.modeloAtivo === "frequencia_semanal" && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-foreground font-semibold">Matriz de Vezes na Semana</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    O valor mensal é definido pela quantidade de encontros na semana (1x, 2x, 3x ou intensivo diário).
                  </p>
                  <p className="text-xs font-bold text-foreground pt-2 border-t border-hairline">
                    2x/sem = {brl(450)} · 3x/sem = {brl(590)}
                  </p>
                </GlassCard>

                {/* Option 4 */}
                <GlassCard
                  onClick={() => handleUpdatePricingModel("pacote_fechado")}
                  className={`p-5 space-y-3 cursor-pointer transition-all ${
                    pricing.modeloAtivo === "pacote_fechado"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "hover:border-hairline/80 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-primary">4. Pacote Semestral / Curso</span>
                    {pricing.modeloAtivo === "pacote_fechado" && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-foreground font-semibold">Valor Fechado do Módulo</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Cobrança no cartão ou boleto parcelado pelo estágio completo de 6 meses com desconto à vista.
                  </p>
                  <p className="text-xs font-bold text-foreground pt-2 border-t border-hairline">
                    {brl(pricing.pacoteSemestral.valorTotal)} (em até 6x)
                  </p>
                </GlassCard>
              </div>
            </div>

            {/* Detailed Pricing Configuration Matrix */}
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              
              {/* Left Form: Edit Pricing Values */}
              <GlassCard className="lg:col-span-6 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Sliders className="size-4" /> Parâmetros de Precificação da Escola
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Auto-salvamento ativo</span>
                </div>

                {/* Fixed by level prices */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Tabela de Mensalidades por Nível (R$/mês)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(pricing.mensalidadesPorNivel).map(([lvl, val]) => (
                      <div key={lvl} className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground">CEFR {lvl}</span>
                        <div className="relative">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const nextVal = Number(e.target.value);
                              setPricing({
                                ...pricing,
                                mensalidadesPorNivel: {
                                  ...pricing.mensalidadesPorNivel,
                                  [lvl]: nextVal,
                                },
                              });
                            }}
                            className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hourly rate and teacher cost */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-hairline">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Hora/Aula (Cobrado)</label>
                    <input
                      type="number"
                      value={pricing.valorHoraAula}
                      onChange={(e) => setPricing({ ...pricing, valorHoraAula: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo Hora Professor (Médio)</label>
                    <input
                      type="number"
                      value={pricing.valorHoraProfessorMedio}
                      onChange={(e) => setPricing({ ...pricing, valorHoraProfessorMedio: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Additional Fees */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-hairline">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taxa de Matrícula (R$)</label>
                    <input
                      type="number"
                      value={pricing.taxaMatricula}
                      onChange={(e) => setPricing({ ...pricing, taxaMatricula: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Material Didático / Livro (R$)</label>
                    <input
                      type="number"
                      value={pricing.taxaMaterialDidatico}
                      onChange={(e) => setPricing({ ...pricing, taxaMaterialDidatico: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Right Panel: Interactive Simulator & Profit Margin Calculator */}
              <GlassCard className="lg:col-span-6 p-6 space-y-6 border-primary/20 bg-surface-elevated/40">
                <div className="border-b border-hairline pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <TrendingUp className="size-4" /> Simulador de Precificação & Margem de Lucro por Turma
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Descubra quanto cobrar e qual será o lucro gerado com base no número de alunos e carga horária.
                  </p>
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Alunos na Turma</span>
                      <span className="text-foreground font-bold">{simAlunos} alunos</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={simAlunos}
                      onChange={(e) => setSimAlunos(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Carga Horária Semanal da Turma</span>
                      <span className="text-foreground font-bold">{simHorasSemanais} horas / semana</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.5}
                      value={simHorasSemanais}
                      onChange={(e) => setSimHorasSemanais(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Margem de Lucro Desejada (%)</span>
                      <span className="text-primary font-bold">{simMargemAlvo}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={simMargemAlvo}
                      onChange={(e) => setSimMargemAlvo(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Simulation Output Card */}
                {(() => {
                  const horasMes = simHorasSemanais * 4.33;
                  const custoDocente = horasMes * pricing.valorHoraProfessorMedio;
                  const custoRateioSala = 150; // Custo rateado de luz, ar condicionado e sala
                  const custoTotalTurma = custoDocente + custoRateioSala;

                  // Preço sugerido por aluno para atingir a margem desejada
                  const faturamentoNecessario = custoTotalTurma / (1 - (simMargemAlvo / 100));
                  const mensalidadeSugeridaPorAluno = faturamentoNecessario / Math.max(1, simAlunos);
                  const faturamentoTotalTurma = mensalidadeSugeridaPorAluno * simAlunos;
                  const lucroTurma = faturamentoTotalTurma - custoTotalTurma;

                  // Break-even da turma (quantos alunos pagam o professor)
                  const breakEvenTurma = Math.ceil(custoTotalTurma / mensalidadeSugeridaPorAluno);

                  return (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                        <span className="text-xs font-bold text-foreground">Preço Sugerido por Aluno</span>
                        <span className="text-xl font-extrabold text-primary">{brl(mensalidadeSugeridaPorAluno)}/mês</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Custo Total da Turma</p>
                          <p className="font-bold text-foreground">{brl(custoTotalTurma)}/mês</p>
                          <p className="text-[9px] text-muted-foreground">{horasMes.toFixed(1)}h prof. + energia/sala</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Faturamento da Turma</p>
                          <p className="font-bold text-foreground">{brl(faturamentoTotalTurma)}/mês</p>
                          <p className="text-[9px] text-muted-foreground">{simAlunos} alunos pagantes</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Lucro Líquido Mensal</p>
                          <p className="font-bold text-emerald-400">{brl(lucroTurma)}</p>
                          <p className="text-[9px] text-emerald-400 font-medium">Margem de {simMargemAlvo}%</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Break-Even da Turma</p>
                          <p className="font-bold text-amber-400">{breakEvenTurma} Alunos</p>
                          <p className="text-[9px] text-muted-foreground">Turma se paga com {breakEvenTurma} alunos</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </GlassCard>
            </div>
          </div>
        )}

        {/* MODAL: NOVO / EDITAR CUSTO */}
        {isCostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative border-primary/20">
              <button
                onClick={() => setIsCostModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Receipt className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {editingCost ? "Editar Custo / Despesa" : "Nova Despesa / Custo Operacional"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Cadastre no DRE para controle financeiro preciso.</p>
                </div>
              </div>

              <form onSubmit={handleSaveCost} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição da Despesa</label>
                  <input
                    placeholder="Ex: Aluguel Sede, Internet Fibra, Salários..."
                    value={costDesc}
                    onChange={(e) => setCostDesc(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria Contábil</label>
                    <select
                      value={costCat}
                      onChange={(e) => setCostCat(e.target.value as CostCategory)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="Infraestrutura & Imóvel">Infraestrutura & Imóvel</option>
                      <option value="Utilidades & Consumo">Utilidades & Consumo</option>
                      <option value="Administrativo & Operacional">Administrativo & Operacional</option>
                      <option value="Folha Docente (Professores)">Folha Docente (Professores)</option>
                      <option value="Marketing & Captação">Marketing & Captação</option>
                      <option value="Materiais & Recursos Pedagógicos">Materiais & Recursos Pedagógicos</option>
                      <option value="Sistemas, TI & Licenças">Sistemas, TI & Licenças</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Custo</label>
                    <select
                      value={costTipo}
                      onChange={(e) => setCostTipo(e.target.value as any)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="fixo">Custo Fixo</option>
                      <option value="variavel">Custo Variável</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0.01}
                      value={costValor}
                      onChange={(e) => setCostValor(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequência</label>
                    <select
                      value={costFreq}
                      onChange={(e) => setCostFreq(e.target.value as any)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                      <option value="por_aluno">Por Aluno</option>
                      <option value="por_hora_aula">Por Hora/Aula</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dia Vencimento</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={costVencimento}
                      onChange={(e) => setCostVencimento(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável</label>
                  <input
                    placeholder="Ex: Diretoria, RH, TI, Manutenção..."
                    value={costResp}
                    onChange={(e) => setCostResp(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações</label>
                  <textarea
                    placeholder="Detalhes sobre o contrato, fornecedor ou forma de pagamento..."
                    value={costObs}
                    onChange={(e) => setCostObs(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-hairline bg-surface/50 p-2.5 text-xs text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsCostModalOpen(false)}
                    className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer"
                  >
                    Salvar Custo
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </ModuleGate>
  );
}
