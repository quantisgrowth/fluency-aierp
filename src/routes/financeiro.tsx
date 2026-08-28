import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
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
  RotateCcw,
  Save,
  History,
  ShieldCheck,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  Star,
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
  type PricingHistoryEntry,
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

const MODEL_INFO: Record<
  PricingModelType,
  { title: string; subtitle: string; desc: string; sample: string }
> = {
  mensalidade_fixa: {
    title: "1. Mensalidade Fixa / Nível",
    subtitle: "Tabela Fixa por Estágio CEFR",
    desc: "Ideal para turmas regulares e franquias tradicionais. O aluno paga valor fixo mensal conforme o nível (A1..C2).",
    sample: "Média: R$ 450/mês",
  },
  hora_aula: {
    title: "2. Valor por Hora/Aula",
    subtitle: "Cálculo por Horas Consumidas",
    desc: "Ideal para cursos VIP, particulares ou grupos reduzidos. A mensalidade varia proporcionalmente à carga horária semanal.",
    sample: "R$ 65 / hora lecionada",
  },
  frequencia_semanal: {
    title: "3. Frequência Semanal",
    subtitle: "Matriz por Dias na Semana",
    desc: "O valor é calculado pela quantidade de encontros semanais contratados (1x sábado, 2x regular, 3x semi-intensivo ou 5x diário).",
    sample: "2x/sem = R$ 450 · 3x/sem = R$ 590",
  },
  pacote_fechado: {
    title: "4. Pacote Semestral / Fechado",
    subtitle: "Valor Fechado do Módulo",
    desc: "Cobrança fechada pelo estágio semestral de 6 meses com desconto à vista e parcelamento no cartão ou boleto.",
    sample: "R$ 2.520 (em até 6x)",
  },
};

function FinanceiroPage() {
  const { activeRole, currentUser } = useUser();
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

  // Política de Precificação Persistida
  const [pricing, setPricing] = useState<PricingPolicy>(() => {
    try {
      const stored = window.localStorage.getItem(PRICING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Garantir compatibilidade com campos novos
        return {
          ...defaultPricingPolicy,
          ...parsed,
          modelosHabilitados: parsed.modelosHabilitados || ["mensalidade_fixa", "hora_aula", "pacote_fechado"],
          modeloPadrao: parsed.modeloPadrao || "mensalidade_fixa",
          historicoAlteracoes: parsed.historicoAlteracoes || defaultPricingPolicy.historicoAlteracoes,
        };
      }
      return defaultPricingPolicy;
    } catch {
      return defaultPricingPolicy;
    }
  });

  // Rascunho de Edição dos Parâmetros (Draft)
  const [draftPricing, setDraftPricing] = useState<PricingPolicy>(pricing);

  // Sincronizar draft quando pricing for atualizado
  useEffect(() => {
    setDraftPricing(pricing);
  }, [pricing]);

  // Modal de Salvamento e Justificativa de Reajuste
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveJustificativa, setSaveJustificativa] = useState("");
  const [showBestPractices, setShowBestPractices] = useState(false);

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

  const totalAlunosAtivos = 71;
  const horasSemanaisTotais = 18;
  const horasMensaisDocentes = horasSemanaisTotais * 4.33;
  const custoDocenteTotal = horasMensaisDocentes * pricing.valorHoraProfessorMedio;

  const receitaBrutaMensal = totalAlunosAtivos * 480;
  const receitaMateriais = totalAlunosAtivos * 35;
  const receitaMatriculas = 8 * pricing.taxaMatricula;
  const faturamentoBrutoTotal = receitaBrutaMensal + receitaMateriais + receitaMatriculas;

  const totalInadimplencia = delinquencyList.reduce((sum, d) => sum + d.valor, 0);
  const deducoesComerciaisEBolsas = faturamentoBrutoTotal * 0.05;
  const deducoesTotais = totalInadimplencia * 0.3 + deducoesComerciaisEBolsas;

  const receitaLiquida = faturamentoBrutoTotal - deducoesTotais;

  const custoMateriaisLivros = totalAlunosAtivos * 18;
  const custosDiretosEnsino = custoDocenteTotal + custoMateriaisLivros;

  const margemContribuicao = receitaLiquida - custosDiretosEnsino;
  const margemContribuicaoPct = (margemContribuicao / receitaLiquida) * 100;

  const lucroOperacionalLiquido = margemContribuicao - fixedCostsTotal;
  const margemLiquidaPct = (lucroOperacionalLiquido / receitaLiquida) * 100;

  const margemMediaPorAluno = receitaBrutaMensal / totalAlunosAtivos - custosDiretosEnsino / totalAlunosAtivos;
  const alunosBreakEven = margemMediaPorAluno > 0 ? Math.ceil(fixedCostsTotal / margemMediaPorAluno) : 0;
  const faturamentoBreakEven = alunosBreakEven * (receitaBrutaMensal / totalAlunosAtivos);

  const ticketMedioPorAluno = receitaBrutaMensal / totalAlunosAtivos;

  // Custos filtrados
  const filteredCosts = costs.filter((c) => {
    const matchesSearch =
      c.descricao.toLowerCase().includes(costSearch.toLowerCase()) ||
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

  // --- MULTI-MODEL TOGGLE HANDLER ---
  const handleTogglePricingModel = (model: PricingModelType) => {
    const isCurrentlyEnabled = pricing.modelosHabilitados.includes(model);

    if (isCurrentlyEnabled) {
      if (pricing.modelosHabilitados.length <= 1) {
        toast.error("Atenção: A escola precisa ter pelo menos 1 modelo de precificação ativo!");
        return;
      }
      const nextEnabled = pricing.modelosHabilitados.filter((m) => m !== model);
      let nextDefault = pricing.modeloPadrao;
      if (pricing.modeloPadrao === model) {
        nextDefault = nextEnabled[0];
      }

      const updated: PricingPolicy = {
        ...pricing,
        modelosHabilitados: nextEnabled,
        modeloPadrao: nextDefault,
        historicoAlteracoes: [
          {
            id: `hist-${Date.now()}`,
            dataHora: new Date().toLocaleString("pt-BR"),
            usuario: currentUser?.nome || "Administrador",
            motivo: `Desabilitação do modelo de cobrança: ${MODEL_INFO[model].title}`,
            alteracoes: [`Modelo '${MODEL_INFO[model].title}' desabilitado na escola.`],
          },
          ...pricing.historicoAlteracoes,
        ],
      };

      setPricing(updated);
      setDraftPricing(updated);
      toast.info(`Modelo "${MODEL_INFO[model].title}" desabilitado na escola.`);
    } else {
      const nextEnabled = [...pricing.modelosHabilitados, model];
      const updated: PricingPolicy = {
        ...pricing,
        modelosHabilitados: nextEnabled,
        historicoAlteracoes: [
          {
            id: `hist-${Date.now()}`,
            dataHora: new Date().toLocaleString("pt-BR"),
            usuario: currentUser?.nome || "Administrador",
            motivo: `Habilitação do modelo de cobrança: ${MODEL_INFO[model].title}`,
            alteracoes: [`Modelo '${MODEL_INFO[model].title}' agora disponível para matrículas.`],
          },
          ...pricing.historicoAlteracoes,
        ],
      };

      setPricing(updated);
      setDraftPricing(updated);
      toast.success(`Modelo "${MODEL_INFO[model].title}" habilitado com sucesso!`);
    }
  };

  const handleSetDefaultModel = (model: PricingModelType) => {
    if (!pricing.modelosHabilitados.includes(model)) {
      toast.error("Habilite este modelo antes de defini-lo como padrão.");
      return;
    }

    const updated: PricingPolicy = {
      ...pricing,
      modeloPadrao: model,
    };
    setPricing(updated);
    setDraftPricing(updated);
    toast.success(`"${MODEL_INFO[model].title}" definido como o Modelo Padrão da escola!`);
  };

  // --- DETECÇÃO DE ALTERAÇÕES NO FORMULÁRIO (DIRTY CHECK) ---
  const changedDifferences = useMemo(() => {
    const diffs: string[] = [];

    // Níveis
    Object.entries(draftPricing.mensalidadesPorNivel).forEach(([lvl, val]) => {
      const originalVal = pricing.mensalidadesPorNivel[lvl];
      if (val !== originalVal) {
        diffs.push(`Mensalidade CEFR ${lvl}: ${brl(originalVal)} ➜ ${brl(val)}`);
      }
    });

    if (draftPricing.valorHoraAula !== pricing.valorHoraAula) {
      diffs.push(`Valor Hora/Aula: ${brl(pricing.valorHoraAula)} ➜ ${brl(draftPricing.valorHoraAula)}`);
    }

    if (draftPricing.valorHoraProfessorMedio !== pricing.valorHoraProfessorMedio) {
      diffs.push(
        `Custo Hora Professor: ${brl(pricing.valorHoraProfessorMedio)} ➜ ${brl(
          draftPricing.valorHoraProfessorMedio
        )}`
      );
    }

    if (draftPricing.taxaMatricula !== pricing.taxaMatricula) {
      diffs.push(`Taxa de Matrícula: ${brl(pricing.taxaMatricula)} ➜ ${brl(draftPricing.taxaMatricula)}`);
    }

    if (draftPricing.taxaMaterialDidatico !== pricing.taxaMaterialDidatico) {
      diffs.push(
        `Material Didático: ${brl(pricing.taxaMaterialDidatico)} ➜ ${brl(draftPricing.taxaMaterialDidatico)}`
      );
    }

    return diffs;
  }, [draftPricing, pricing]);

  const isFormDirty = changedDifferences.length > 0;

  const handleDiscardChanges = () => {
    setDraftPricing(pricing);
    toast.info("Alterações descartadas. Valores originais restaurados.");
  };

  const handleConfirmSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveJustificativa.trim()) {
      toast.error("Por favor, preencha o motivo/justificativa da alteração.");
      return;
    }

    const newHistoryEntry: PricingHistoryEntry = {
      id: `hist-${Date.now()}`,
      dataHora: new Date().toLocaleString("pt-BR"),
      usuario: currentUser?.nome || "Administrador",
      motivo: saveJustificativa.trim(),
      alteracoes: changedDifferences,
    };

    const updatedPricing: PricingPolicy = {
      ...draftPricing,
      historicoAlteracoes: [newHistoryEntry, ...pricing.historicoAlteracoes],
    };

    setPricing(updatedPricing);
    setSaveJustificativa("");
    setIsSaveModalOpen(false);
    toast.success("Tabela de precificação salva e histórico registrado com sucesso!");
  };

  return (
    <ModuleGate module="financeiro">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação & Finanças"
          title="Gestão Financeira, DRE & Precificação"
          description="Controle a liquidez, analise o DRE com ponto de equilíbrio, gerencie despesas fixas e configure suas regras de precificação multi-modelo."
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
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-paid" /> {step.status}
                          </span>
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
                    onClick={() =>
                      toast.success("Pix Copia e Cola gerado!", {
                        description: "00020101021226870014br.gov.bcb.pix...",
                      })
                    }
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
                <p className="text-[11px] text-muted-foreground">
                  Margem Bruta de Ensino: <strong>{margemContribuicaoPct.toFixed(1)}%</strong>
                </p>
              </GlassCard>

              <GlassCard className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Despesas Fixas da Escola</span>
                  <ArrowDownRight className="size-4 text-rose-400" />
                </div>
                <p className="text-2xl font-bold text-rose-400">{brl(fixedCostsTotal)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {costs.filter((c) => c.tipo === "fixo").length} despesas fixas cadastradas
                </p>
              </GlassCard>

              <GlassCard
                className={`p-5 space-y-2 ${
                  lucroOperacionalLiquido >= 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-rose-500/30 bg-rose-500/5"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">EBITDA / Lucro Operacional</span>
                  <TrendingUp
                    className={`size-4 ${lucroOperacionalLiquido >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  />
                </div>
                <p
                  className={`text-2xl font-bold ${
                    lucroOperacionalLiquido >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {brl(lucroOperacionalLiquido)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Margem Líquida da Escola: <strong>{margemLiquidaPct.toFixed(1)}%</strong>
                </p>
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
                    <h3 className="text-base font-bold text-foreground">
                      Ponto de Equilíbrio Geral (Break-Even da Escola)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Para cobrir 100% de todas as despesas fixas (Aluguel, Folha Adm, Energia, Marketing) e custos
                      docentes, sua escola precisa manter no mínimo:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-hairline/60">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Alunos Necessários</p>
                    <p className="text-xl font-bold text-amber-500">{alunosBreakEven} Alunos</p>
                    <p className="text-[10px] text-muted-foreground">
                      Atualmente: {totalAlunosAtivos} (
                      {totalAlunosAtivos - alunosBreakEven > 0
                        ? `+${totalAlunosAtivos - alunosBreakEven} de margem segura`
                        : "Abaixo da meta"}
                      )
                    </p>
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
                  <h3 className="text-base font-bold text-foreground">
                    Demonstrativo de Resultado do Exercício (DRE Gerencial)
                  </h3>
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
                  <span>
                    (-) Folha Docente / Professores ({horasMensaisDocentes.toFixed(0)}h lecionadas a{" "}
                    {brl(pricing.valorHoraProfessorMedio)}/h)
                  </span>
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
                    <div
                      key={c.id}
                      className="py-1.5 pl-8 pr-3 flex justify-between items-center text-xs text-muted-foreground"
                    >
                      <span>(-) {c.descricao}</span>
                      <span>- {brl(c.frequencia === "anual" ? c.valor / 12 : c.valor)}</span>
                    </div>
                  ))}

                {/* 7. EBITDA / LUCRO LÍQUIDO */}
                <div
                  className={`py-4 flex justify-between items-center font-extrabold text-base px-3 rounded-lg border ${
                    lucroOperacionalLiquido >= 0
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
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
                  Despesas fixas mensais consolidadas:{" "}
                  <strong className="text-rose-400">{brl(fixedCostsTotal)}/mês</strong>
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
                      costTypeFilter === "todos"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground bg-transparent"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setCostTypeFilter("fixo")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border-0 rounded-md ${
                      costTypeFilter === "fixo"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground bg-transparent"
                    }`}
                  >
                    Fixos
                  </button>
                  <button
                    onClick={() => setCostTypeFilter("variavel")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border-0 rounded-md ${
                      costTypeFilter === "variavel"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground bg-transparent"
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
                  <GlassCard
                    key={cost.id}
                    className="p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all"
                  >
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
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            cost.tipo === "fixo"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
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
            {/* Top Multi-Model Selector Cards with Switches */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Tag className="size-4 text-primary" /> Modelos de Cobrança Habilitados na Escola
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ative ou desative as modalidades que sua escola oferece (chave liga/desliga). Você pode operar com
                    múltiplos modelos simultâneos e definir o padrão para novas matrículas.
                  </p>
                </div>

                <button
                  onClick={() => setShowBestPractices(!showBestPractices)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-transparent border-0 cursor-pointer self-start sm:self-auto"
                >
                  <BookOpen className="size-3.5" /> {showBestPractices ? "Ocultar Guia Estratégico" : "Ver Guia de Melhores Práticas"}
                </button>
              </div>

              {/* Best Practices Expandable Banner */}
              {showBestPractices && (
                <GlassCard className="p-5 space-y-3 border-primary/30 bg-primary/5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs text-primary uppercase tracking-wider">
                    <Sparkles className="size-4" /> Melhores Práticas de Gestão Financeira para Escolas de Idiomas & Lei nº 9.870/99
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground leading-relaxed">
                    <div className="space-y-1 rounded-lg border border-hairline bg-surface/40 p-3">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <Check className="size-3.5 text-primary" /> 1. Convivência Multi-Modelo
                      </p>
                      <p className="text-[11px]">
                        Ofereça <strong>Mensalidade Recorrente</strong> para garantir previsibilidade de caixa nas turmas regulares e <strong>Hora/Aula</strong> para flexibilizar pacotes VIP.
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border border-hairline bg-surface/40 p-3">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <Check className="size-3.5 text-primary" /> 2. Margem de Contribuição & Break-Even
                      </p>
                      <p className="text-[11px]">
                        Garanta que cada turma tenha pelo menos <strong>4 a 6 alunos</strong> para cobrir o custo da hora docente e do ar-condicionado/sala antes de abrir o horário.
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border border-hairline bg-surface/40 p-3">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <Check className="size-3.5 text-primary" /> 3. Governança & Histórico de Reajustes
                      </p>
                      <p className="text-[11px]">
                        A <strong>Lei nº 9.870/99</strong> exige justificativa contábil em reajustes anuais. Nosso sistema registra quem alterou, quando e o motivo em um log auditável.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* 4 Cards with Toggle Switches */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(["mensalidade_fixa", "hora_aula", "frequencia_semanal", "pacote_fechado"] as PricingModelType[]).map(
                  (modelKey) => {
                    const isEnabled = pricing.modelosHabilitados.includes(modelKey);
                    const isDefault = pricing.modeloPadrao === modelKey;
                    const info = MODEL_INFO[modelKey];

                    return (
                      <GlassCard
                        key={modelKey}
                        className={`p-5 flex flex-col justify-between space-y-3 transition-all relative ${
                          isEnabled
                            ? "border-primary/40 bg-surface/60 shadow-sm"
                            : "border-hairline bg-surface/20 opacity-60 hover:opacity-85"
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Top: Header and Switch */}
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs uppercase tracking-wider text-primary">
                              {info.title.split(" ")[0]} {info.title.split(" ")[1]}
                            </span>

                            {/* Switch ON / OFF */}
                            <button
                              type="button"
                              onClick={() => handleTogglePricingModel(modelKey)}
                              title={isEnabled ? "Desativar este modelo na escola" : "Habilitar este modelo na escola"}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isEnabled ? "bg-primary" : "bg-hairline"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isEnabled ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-foreground">{info.subtitle}</h4>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{info.desc}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-hairline space-y-2">
                          <p className="text-xs font-bold text-foreground">{info.sample}</p>

                          <div className="flex justify-between items-center pt-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                isEnabled
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-surface-elevated text-muted-foreground border border-hairline"
                              }`}
                            >
                              {isEnabled ? "🟢 Habilitado" : "⚪ Inativo"}
                            </span>

                            {isEnabled && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultModel(modelKey)}
                                title={isDefault ? "Modelo Principal Padrão" : "Definir como modelo padrão na matrícula"}
                                className={`flex items-center gap-1 text-[10px] font-bold transition-all px-2 py-0.5 rounded cursor-pointer border ${
                                  isDefault
                                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                                }`}
                              >
                                <Star className={`size-3 ${isDefault ? "fill-amber-400 text-amber-400" : ""}`} />
                                {isDefault ? "Padrão" : "Tornar Padrão"}
                              </button>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    );
                  }
                )}
              </div>
            </div>

            {/* Parameters Form & Simulator */}
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Left Form: Edit Pricing Values with Manual Save Button */}
              <GlassCard className="lg:col-span-6 p-6 space-y-5 relative">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Sliders className="size-4" /> Parâmetros de Precificação da Escola
                  </h4>
                  {isFormDirty ? (
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                      ● Alterações Pendentes
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="size-3 text-emerald-400" /> Sincronizado
                    </span>
                  )}
                </div>

                {/* Fixed by level prices */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Tabela de Mensalidades por Nível CEFR (R$/mês)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(draftPricing.mensalidadesPorNivel).map(([lvl, val]) => (
                      <div key={lvl} className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground">CEFR {lvl}</span>
                        <div className="relative">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const nextVal = Number(e.target.value);
                              setDraftPricing({
                                ...draftPricing,
                                mensalidadesPorNivel: {
                                  ...draftPricing.mensalidadesPorNivel,
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Valor Hora/Aula (Cobrado R$/h)
                    </label>
                    <input
                      type="number"
                      value={draftPricing.valorHoraAula}
                      onChange={(e) => setDraftPricing({ ...draftPricing, valorHoraAula: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Custo Hora Professor (Médio R$/h)
                    </label>
                    <input
                      type="number"
                      value={draftPricing.valorHoraProfessorMedio}
                      onChange={(e) =>
                        setDraftPricing({ ...draftPricing, valorHoraProfessorMedio: Number(e.target.value) })
                      }
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Additional Fees */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-hairline">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Taxa de Matrícula (R$)
                    </label>
                    <input
                      type="number"
                      value={draftPricing.taxaMatricula}
                      onChange={(e) => setDraftPricing({ ...draftPricing, taxaMatricula: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Material Didático / Livro (R$)
                    </label>
                    <input
                      type="number"
                      value={draftPricing.taxaMaterialDidatico}
                      onChange={(e) =>
                        setDraftPricing({ ...draftPricing, taxaMaterialDidatico: Number(e.target.value) })
                      }
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Action Bar when Form is Dirty */}
                {isFormDirty ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="size-4 shrink-0" />
                        {changedDifferences.length} parâmetro(s) alterado(s)
                      </p>
                      <span className="text-[10px] text-muted-foreground">Clique para salvar no histórico</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDiscardChanges}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface transition-all cursor-pointer"
                      >
                        <RotateCcw className="size-3.5" /> Descartar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSaveModalOpen(true)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow transition-all cursor-pointer"
                      >
                        <Save className="size-3.5" /> Salvar Alterações
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-muted-foreground italic">
                      Altere qualquer valor acima para habilitar o botão de salvamento e registro de histórico.
                    </p>
                  </div>
                )}
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
                  const custoDocente = horasMes * draftPricing.valorHoraProfessorMedio;
                  const custoRateioSala = 150;
                  const custoTotalTurma = custoDocente + custoRateioSala;

                  const faturamentoNecessario = custoTotalTurma / (1 - simMargemAlvo / 100);
                  const mensalidadeSugeridaPorAluno = faturamentoNecessario / Math.max(1, simAlunos);
                  const faturamentoTotalTurma = mensalidadeSugeridaPorAluno * simAlunos;
                  const lucroTurma = faturamentoTotalTurma - custoTotalTurma;

                  const breakEvenTurma = Math.ceil(custoTotalTurma / mensalidadeSugeridaPorAluno);

                  return (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                        <span className="text-xs font-bold text-foreground">Preço Sugerido por Aluno</span>
                        <span className="text-xl font-extrabold text-primary">
                          {brl(mensalidadeSugeridaPorAluno)}/mês
                        </span>
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

            {/* TIMELINE DE HISTÓRICO DE REAJUSTES & AUDITORIA (LEI 9.870/99) */}
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <History className="size-4 text-primary" /> Histórico de Alterações de Preço & Auditoria Contábil
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Registro de todas as versões salvas, reajustes anuais e alterações de parâmetros na escola.
                  </p>
                </div>
                <span className="rounded-lg bg-surface border border-hairline px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {pricing.historicoAlteracoes.length} registros
                </span>
              </div>

              <div className="space-y-4">
                {pricing.historicoAlteracoes.map((hist, idx) => (
                  <div
                    key={hist.id || idx}
                    className="flex items-start gap-4 p-4 rounded-xl border border-hairline bg-surface/30 hover:bg-surface/50 transition-colors"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 font-bold text-xs">
                      #{pricing.historicoAlteracoes.length - idx}
                    </span>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className="text-xs font-bold text-foreground">{hist.motivo}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{hist.dataHora}</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Responsável: <strong className="text-foreground">{hist.usuario}</strong>
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {hist.alteracoes.map((alt, aIdx) => (
                          <span
                            key={aIdx}
                            className="rounded-md bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] font-medium text-foreground flex items-center gap-1"
                          >
                            <Check className="size-3 text-primary" /> {alt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* MODAL: CONFIRMAR SALVAMENTO DE PRECIFICAÇÃO COM JUSTIFICATIVA */}
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative border-primary/30">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Save className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Confirmar Salvamento & Registrar Reajuste</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Documente a justificativa contábil para o histórico da escola (Lei 9.870/99).
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmSavePricing} className="space-y-4">
                {/* Changes List */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Alterações Detectadas ({changedDifferences.length})
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-lg border border-hairline bg-surface/40 p-3 text-xs">
                    {changedDifferences.map((diff, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-foreground">
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                        <span>{diff}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Justification Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Motivo / Justificativa do Reajuste *
                  </label>
                  <textarea
                    placeholder="Ex: Reajuste semestral de 6% e atualização da hora/aula docente..."
                    value={saveJustificativa}
                    onChange={(e) => setSaveJustificativa(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-hairline bg-surface/50 p-2.5 text-xs text-foreground outline-none focus:border-primary resize-none"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Essa justificativa será salva permanentemente no log de auditoria com a assinatura do seu usuário.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(false)}
                    className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer"
                  >
                    Salvar e Registrar Histórico
                  </button>
                </div>
              </form>
            </GlassCard>
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Descrição da Despesa
                  </label>
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Categoria Contábil
                    </label>
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tipo de Custo
                    </label>
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Valor (R$)
                    </label>
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Frequência
                    </label>
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Dia Vencimento
                    </label>
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Responsável
                  </label>
                  <input
                    placeholder="Ex: Diretoria, RH, TI, Manutenção..."
                    value={costResp}
                    onChange={(e) => setCostResp(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Observações
                  </label>
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
