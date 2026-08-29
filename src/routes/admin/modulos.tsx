import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Palette,
  Check,
  Sparkles,
  X,
  CreditCard,
  Copy,
  Lock,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Tag,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowLeft,
  Settings2,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Save,
  LayoutGrid,
  List,
  Calculator,
  Percent,
  Coins,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { StatusPill } from "@/components/kit/status-pill";
import { useModules } from "@/modules/module-context";
import { MODULES } from "@/modules/registry";
import { useTenant, type TenantPreset } from "@/modules/tenant-context";
import {
  brl,
  initialEducationalProducts,
  type EducationalProduct,
  type PricingModelType,
  livrosTrilhas,
  initialEducationalLevels,
  type EducationalLevel,
  initialSchoolCosts,
  type SchoolCost,
} from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/modulos")({
  head: () => ({
    meta: [
      { title: "Cursos, Módulos & Planos — Fluency AI" },
      { name: "description", content: "Catálogo de produtos educacionais, administração de módulos e White-Label." },
    ],
  }),
  component: AdminModulosPage,
});

type ModuleDef = typeof MODULES[0];
const PRODUCTS_KEY = "fluency-ai:products:catalog";
const LEVELS_KEY = "fluency-ai:academic:levels";
const COSTS_KEY = "fluency-ai:finance:costs";

const MODALITY_LABELS: Record<PricingModelType, { label: string; badgeClass: string; desc: string }> = {
  mensalidade_fixa: {
    label: "Turma Regular (Mensalidade Fixa)",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    desc: "Cobrança de mensalidade tabelada por estágio letivo. Aluno é alocado em turma com sala física e horários fixos.",
  },
  hora_aula: {
    label: "VIP / Hora-Aula (Particular)",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    desc: "Aulas individuais 1-on-1. Cobrança proporcional às horas lecionadas consumidas no mês.",
  },
  frequencia_semanal: {
    label: "Por Frequência Semanal",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    desc: "Cobrança calculada pela quantidade de encontros semanais (ex: aulas de sábado ou 3x na semana).",
  },
  pacote_fechado: {
    label: "Pacote Fechado / Semestral",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    desc: "Módulo fechado de horas (ex: 60h para preparatórios) com valor global parcelado no contrato.",
  },
};

function AdminModulosPage() {
  const { active, toggle: toggleModule, monthlyTotal } = useModules();
  const { tenant, setTenantName, setPrimaryColor, applyPreset } = useTenant();
  const [activeTab, setActiveTab] = useState<"cursos" | "modules" | "branding">("cursos");
  const [customColor, setCustomColor] = useState(tenant.primaryColor);
  const [schoolName, setSchoolName] = useState(tenant.name);

  // View Display Modes (Cards vs List)
  const [catalogDisplayMode, setCatalogDisplayMode] = useState<"cards" | "list">(() => {
    try {
      return (window.localStorage.getItem("fluency-ai:products:display-mode") as "cards" | "list") || "cards";
    } catch {
      return "cards";
    }
  });

  const [modulesDisplayMode, setModulesDisplayMode] = useState<"cards" | "list">(() => {
    try {
      return (window.localStorage.getItem("fluency-ai:erp-modules:display-mode") as "cards" | "list") || "cards";
    } catch {
      return "cards";
    }
  });

  // Full-Screen Course Editor State
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [editingProduct, setEditingProduct] = useState<EducationalProduct | null>(null);

  // Educational Levels State (Customizable CEFR / School Stages)
  const [levels, setLevels] = useState<EducationalLevel[]>(() => {
    try {
      const stored = window.localStorage.getItem(LEVELS_KEY);
      return stored ? JSON.parse(stored) : initialEducationalLevels;
    } catch {
      return initialEducationalLevels;
    }
  });

  // Modal de Gerenciamento de Níveis
  const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false);
  const [levelFormCodigo, setLevelFormCodigo] = useState("");
  const [levelFormNome, setLevelFormNome] = useState("");
  const [levelFormDesc, setLevelFormDesc] = useState("");
  const [levelFormHoras, setLevelFormHoras] = useState(60);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);

  // Educational Products State
  const [products, setProducts] = useState<EducationalProduct[]>(() => {
    try {
      const stored = window.localStorage.getItem(PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : initialEducationalProducts;
    } catch {
      return initialEducationalProducts;
    }
  });

  // School Costs State (for pricing calculation)
  const [costs] = useState<SchoolCost[]>(() => {
    try {
      const stored = window.localStorage.getItem(COSTS_KEY);
      return stored ? JSON.parse(stored) : initialSchoolCosts;
    } catch {
      return initialSchoolCosts;
    }
  });

  // Course Form States
  const [prodNome, setProdNome] = useState("");
  const [prodCodigo, setProdCodigo] = useState("");
  const [prodModalidade, setProdModalidade] = useState<PricingModelType>("mensalidade_fixa");
  const [prodNivel, setProdNivel] = useState("Beginner / Kids");
  const [prodDuracaoMinutos, setProdDuracaoMinutos] = useState(90);
  const [prodVezesSemana, setProdVezesSemana] = useState(2);
  const [prodCargaTotal, setProdCargaTotal] = useState(60);
  const [prodLivroId, setProdLivroId] = useState(livrosTrilhas[0]?.id || "");
  const [prodValor, setProdValor] = useState(450);
  const [prodDesc, setProdDesc] = useState("");
  const [prodPublico, setProdPublico] = useState("Jovens e Adultos (Geral)");
  const [prodPermiteTurma, setProdPermiteTurma] = useState(true);
  const [prodMaxAlunos, setProdMaxAlunos] = useState(14);

  // --- CALCULADORA INTELIGENTE DE PRECIFICAÇÃO ---
  const [simulacaoAlunos, setSimulacaoAlunos] = useState(8);
  const [margemLucroAlvoPct, setMargemLucroAlvoPct] = useState(45); // 45% de margem padrão

  // Cálculos Automáticos de Carga Horária
  const cargaHorariaSemanalCalculada = Number(((prodDuracaoMinutos / 60) * prodVezesSemana).toFixed(1));
  const cargaHorariaMensalCalculada = Number((cargaHorariaSemanalCalculada * 4.33).toFixed(1));

  // Cálculos da Calculadora de Custos & Unit Economics
  const custoHoraDocente = 45.0; // R$ 45/h base professor
  const custoFixoTotalMensal = costs.filter((c) => c.tipo === "fixo").reduce((acc, c) => acc + c.valor, 0);
  const baseAlunosEscolaEstimada = 80; // Base média da unidade escolar
  const rateioFixoPorAluno = custoFixoTotalMensal / baseAlunosEscolaEstimada; // ~R$ 380/aluno/mês rateio global
  const custoMaterialMensalRateado = 20.0; // Custo do livro rateado no semestre

  // Custo Direto da Turma / Curso
  const custoDocenteTotalTurmaMes = cargaHorariaMensalCalculada * custoHoraDocente;
  const qtdAlunosCalc = prodModalidade === "hora_aula" ? 1 : Math.max(1, simulacaoAlunos);
  const custoDocentePorAlunoMes = custoDocenteTotalTurmaMes / qtdAlunosCalc;

  // Custo Real Total por Aluno/Mês
  const custoTotalRealPorAluno =
    prodModalidade === "hora_aula"
      ? custoHoraDocente + 15 // Custo por hora lecionada VIP + rateio operacional
      : custoDocentePorAlunoMes + (rateioFixoPorAluno * 0.35) + custoMaterialMensalRateado;

  // Preço de Equilíbrio (Break-Even) e Preço Sugerido com Margem
  const precoMinimoBreakEven = custoTotalRealPorAluno;
  const precoSugeridoCalculado = Number(
    (custoTotalRealPorAluno / (1 - margemLucroAlvoPct / 100)).toFixed(2)
  );

  // Projeção de Faturamento e Lucro por Turma
  const faturamentoEstimadoTurma = precoSugeridoCalculado * qtdAlunosCalc;
  const lucroEstimadoTurmaMes = faturamentoEstimadoTurma - (custoDocenteTotalTurmaMes + ((rateioFixoPorAluno * 0.35) * qtdAlunosCalc));

  // Self-Service Checkout states for ERP Modules
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutModule, setCheckoutModule] = useState<ModuleDef | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");

  // Sync to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
    } catch {}
  }, [levels]);

  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:products:display-mode", catalogDisplayMode);
    } catch {}
  }, [catalogDisplayMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:erp-modules:display-mode", modulesDisplayMode);
    } catch {}
  }, [modulesDisplayMode]);

  // Sync local states when tenant changes
  useEffect(() => {
    setSchoolName(tenant.name);
    setCustomColor(tenant.primaryColor);
  }, [tenant]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
  };

  const handlePresetSelect = (preset: TenantPreset) => {
    applyPreset(preset);
    toast.success(
      `Marca alternada para ${preset === "lumen" ? "Fluency AI" : preset === "apex" ? "Apex English" : "British Academy"}!`
    );
  };

  const handleOpenCheckout = (m: ModuleDef) => {
    setCheckoutModule(m);
    setCardNumber("");
    setCardName("");
    setPaymentMethod("pix");
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModule) return;

    setIsProcessing(true);
    setTimeout(() => {
      toggleModule(checkoutModule.id);
      setIsProcessing(false);
      setIsCheckoutOpen(false);
      toast.success(`Módulo "${checkoutModule.name}" contratado com sucesso!`);
      setCheckoutModule(null);
    }, 1500);
  };

  // --- COURSE FORM HANDLERS ---
  const handleOpenNewCourse = () => {
    setEditingProduct(null);
    setProdNome("");
    const randomCodeNum = Math.floor(100 + Math.random() * 900);
    setProdCodigo(`CUR-${randomCodeNum}`);
    setProdModalidade("mensalidade_fixa");
    setProdNivel(levels[0]?.nome || "Beginner / Kids");
    setProdDuracaoMinutos(90);
    setProdVezesSemana(2);
    setProdCargaTotal(60);
    setProdLivroId(livrosTrilhas[0]?.id || "");
    setProdValor(450);
    setProdDesc("");
    setProdPublico("Jovens e Adultos (Geral)");
    setProdPermiteTurma(true);
    setProdMaxAlunos(14);
    setSimulacaoAlunos(8);
    setMargemLucroAlvoPct(45);
    setViewMode("editor");
  };

  const handleOpenEditCourse = (prod: EducationalProduct) => {
    setEditingProduct(prod);
    setProdNome(prod.nome);
    setProdCodigo(prod.codigo);
    setProdModalidade(prod.modalidade);
    setProdNivel(prod.nivel);
    setProdDuracaoMinutos(prod.duracaoAulaMinutos || 90);
    setProdVezesSemana(prod.vezesPorSemana || 2);
    setProdCargaTotal(prod.cargaHorariaTotal || 60);
    setProdLivroId(prod.livroPadraoId || livrosTrilhas[0]?.id || "");
    setProdValor(prod.valorBase);
    setProdDesc(prod.descricao);
    setProdPublico(prod.publicoAlvo);
    setProdPermiteTurma(prod.permiteTurma);
    setProdMaxAlunos(prod.maxAlunosTurma || 14);
    setSimulacaoAlunos(prod.modalidade === "hora_aula" ? 1 : 8);
    setMargemLucroAlvoPct(45);
    setViewMode("editor");
  };

  const handleApplySuggestedPrice = () => {
    setProdValor(precoSugeridoCalculado);
    toast.success(`Preço sugerido de ${brl(precoSugeridoCalculado)} aplicado com sucesso ao produto!`);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNome.trim() || prodValor <= 0) {
      toast.error("Preencha o nome do curso e um valor válido.");
      return;
    }

    const selectedBook = livrosTrilhas.find((b) => b.id === prodLivroId);

    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                nome: prodNome.trim(),
                modalidade: prodModalidade,
                nivel: prodNivel,
                duracaoAulaMinutos: Number(prodDuracaoMinutos),
                vezesPorSemana: Number(prodVezesSemana),
                cargaHorariaSemanal: cargaHorariaSemanalCalculada,
                cargaHorariaMensal: cargaHorariaMensalCalculada,
                cargaHorariaTotal: Number(prodCargaTotal),
                livroPadraoId: prodLivroId,
                livroPadraoNome: selectedBook?.titulo || "Material Padrão",
                valorBase: Number(prodValor),
                descricao: prodDesc,
                publicoAlvo: prodPublico,
                permiteTurma: prodPermiteTurma,
                maxAlunosTurma: prodPermiteTurma ? Number(prodMaxAlunos) : 1,
              }
            : p
        )
      );
      toast.success(`Curso "${prodNome}" atualizado com sucesso!`);
    } else {
      const newProduct: EducationalProduct = {
        id: `prod-${Date.now()}`,
        nome: prodNome.trim(),
        codigo: prodCodigo.trim(),
        modalidade: prodModalidade,
        nivel: prodNivel,
        duracaoAulaMinutos: Number(prodDuracaoMinutos),
        vezesPorSemana: Number(prodVezesSemana),
        cargaHorariaSemanal: cargaHorariaSemanalCalculada,
        cargaHorariaMensal: cargaHorariaMensalCalculada,
        cargaHorariaTotal: Number(prodCargaTotal),
        livroPadraoId: prodLivroId,
        livroPadraoNome: selectedBook?.titulo || "Material Padrão",
        valorBase: Number(prodValor),
        descricao: prodDesc,
        publicoAlvo: prodPublico,
        ativo: true,
        permiteTurma: prodPermiteTurma,
        maxAlunosTurma: prodPermiteTurma ? Number(prodMaxAlunos) : 1,
      };
      setProducts([newProduct, ...products]);
      toast.success(`Novo curso "${prodNome}" cadastrado no catálogo da escola!`);
    }
    setViewMode("list");
  };

  const handleToggleProductStatus = (id: string, currentStatus: boolean, name: string) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ativo: !currentStatus } : p)));
    toast.info(`Curso "${name}" ${currentStatus ? "desativado" : "ativado"} no catálogo.`);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o produto educacional "${name}"?`)) return;
    setProducts(products.filter((p) => p.id !== id));
    toast.success(`Curso "${name}" removido do catálogo.`);
  };

  // --- EDUCATIONAL LEVELS CRUD ---
  const handleOpenNewLevel = () => {
    setEditingLevelId(null);
    setLevelFormCodigo(`NIV-${levels.length + 1}`);
    setLevelFormNome("");
    setLevelFormDesc("");
    setLevelFormHoras(60);
  };

  const handleOpenEditLevel = (lvl: EducationalLevel) => {
    setEditingLevelId(lvl.id);
    setLevelFormCodigo(lvl.codigo);
    setLevelFormNome(lvl.nome);
    setLevelFormDesc(lvl.descricao);
    setLevelFormHoras(lvl.horasSugeridas);
  };

  const handleSaveLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelFormNome.trim() || !levelFormCodigo.trim()) {
      toast.error("Preencha o código e o nome do nível.");
      return;
    }

    if (editingLevelId) {
      setLevels(
        levels.map((l) =>
          l.id === editingLevelId
            ? {
                ...l,
                codigo: levelFormCodigo.trim().toUpperCase(),
                nome: levelFormNome.trim(),
                descricao: levelFormDesc.trim(),
                horasSugeridas: Number(levelFormHoras),
              }
            : l
        )
      );
      toast.success(`Nível "${levelFormNome}" atualizado!`);
    } else {
      const newLevel: EducationalLevel = {
        id: `lvl-${Date.now()}`,
        codigo: levelFormCodigo.trim().toUpperCase(),
        nome: levelFormNome.trim(),
        descricao: levelFormDesc.trim(),
        horasSugeridas: Number(levelFormHoras),
        ordem: levels.length + 1,
      };
      setLevels([...levels, newLevel]);
      toast.success(`Nível "${levelFormNome}" criado com sucesso!`);
    }
    handleOpenNewLevel();
  };

  const handleDeleteLevel = (id: string, nome: string) => {
    if (levels.length <= 1) {
      toast.error("A escola deve ter pelo menos um nível cadastrado.");
      return;
    }
    if (!confirm(`Remover o nível "${nome}"?`)) return;
    setLevels(levels.filter((l) => l.id !== id));
    toast.success(`Nível "${nome}" removido.`);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300 pb-12">
      {/* PAGE HEADER */}
      <SectionHeader
        eyebrow="Gestão Acadêmica & Plataforma"
        title="Catálogo de Cursos & Módulos da Escola"
        description="Gerencie os cursos oferecidos pela escola, simule a precificação inteligente com base em custos do DRE, configure níveis e contrate módulos."
      />

      {/* Tabs selectors (only shown in list mode) */}
      {viewMode === "list" && (
        <div className="flex border-b border-hairline gap-8 pb-0.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("cursos")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 shrink-0 ${
              activeTab === "cursos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="size-4" /> Catálogo de Cursos & Ofertas ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 shrink-0 ${
              activeTab === "modules"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="size-4" /> Módulos do Sistema ERP
          </button>
          <button
            onClick={() => setActiveTab("branding")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 shrink-0 ${
              activeTab === "branding"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="size-4" /> Personalização (Private Label)
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CATÁLOGO DE CURSOS - LIST VIEW */}
      {/* ========================================================================= */}
      {activeTab === "cursos" && viewMode === "list" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Actions & Display Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Grade de Cursos e Modalidades Contratáveis
              </h3>
              <p className="text-xs text-muted-foreground">
                Cada curso possui sua carga horária analítica, livro didático vinculado e sugestão de precificação por custos.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Toggle Cards vs List */}
              <div className="flex items-center rounded-lg border border-hairline bg-surface/50 p-0.5">
                <button
                  onClick={() => setCatalogDisplayMode("cards")}
                  title="Visualização em Módulos / Cards"
                  className={`p-2 rounded-md transition-all cursor-pointer ${
                    catalogDisplayMode === "cards"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground bg-transparent"
                  }`}
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  onClick={() => setCatalogDisplayMode("list")}
                  title="Visualização em Lista / Tabela"
                  className={`p-2 rounded-md transition-all cursor-pointer ${
                    catalogDisplayMode === "list"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground bg-transparent"
                  }`}
                >
                  <List className="size-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  handleOpenNewLevel();
                  setIsLevelsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                <Settings2 className="size-4 text-primary" /> Gerenciar Níveis ({levels.length})
              </button>

              <button
                onClick={handleOpenNewCourse}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="size-4" /> + Novo Curso / Oferta
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-4 space-y-1 border-primary/20">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Cursos Ativos</span>
                <GraduationCap className="size-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{products.filter((p) => p.ativo).length} Cursos</p>
              <p className="text-[11px] text-muted-foreground">{products.length} produtos cadastrados no total</p>
            </GlassCard>

            <GlassCard className="p-4 space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Níveis Cadastrados</span>
                <Layers className="size-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{levels.length} Estágios</p>
              <p className="text-[11px] text-muted-foreground">Do A1 ao C2 + Personalizados</p>
            </GlassCard>

            <GlassCard className="p-4 space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Ticket Médio Estimado</span>
                <DollarSign className="size-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{brl(480)}/mês</p>
              <p className="text-[11px] text-muted-foreground">Média ponderada por aluno ativo</p>
            </GlassCard>
          </div>

          {/* MODE 1: CARDS / MÓDULOS GRID */}
          {catalogDisplayMode === "cards" && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((prod) => {
                const modInfo = MODALITY_LABELS[prod.modalidade] || MODALITY_LABELS.mensalidade_fixa;

                return (
                  <GlassCard
                    key={prod.id}
                    className={`p-5 flex flex-col justify-between space-y-4 transition-all ${
                      prod.ativo ? "hover:border-white/15" : "opacity-60 border-dashed"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${modInfo.badgeClass}`}
                        >
                          {modInfo.label}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-surface px-1.5 py-0.5 rounded border border-hairline">
                          {prod.codigo}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-foreground leading-snug">{prod.nome}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{prod.descricao}</p>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <div className="rounded-lg bg-surface/40 border border-hairline p-2 space-y-0.5">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                            Carga Semanal
                          </span>
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <Clock className="size-3 text-primary" /> {prod.cargaHorariaSemanal || 3}h / sem
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {prod.vezesPorSemana || 2}x de {prod.duracaoAulaMinutos || 90}min
                          </p>
                        </div>

                        <div className="rounded-lg bg-surface/40 border border-hairline p-2 space-y-0.5">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                            Total do Módulo
                          </span>
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <Calendar className="size-3 text-primary" /> {prod.cargaHorariaTotal || 60}h Totais
                          </p>
                          <p className="text-[10px] text-muted-foreground">~{prod.cargaHorariaMensal || 13}h / mês</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] text-foreground font-semibold flex items-center gap-1">
                          <Tag className="size-3 text-primary" /> Nível: {prod.nivel}
                        </span>
                        {prod.livroPadraoNome && (
                          <span className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-full">
                            <BookOpen className="size-3 text-muted-foreground shrink-0" /> {prod.livroPadraoNome}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-hairline">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Valor Cobrado</span>
                        <span className="text-lg font-bold text-foreground">
                          {brl(prod.valorBase)}
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {prod.modalidade === "hora_aula"
                              ? " / hora"
                              : prod.modalidade === "pacote_fechado"
                              ? " / semestre"
                              : " / mês"}
                          </span>
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleToggleProductStatus(prod.id, prod.ativo, prod.nome)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            prod.ativo
                              ? "border-hairline bg-surface/40 text-muted-foreground hover:text-foreground"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {prod.ativo ? "Pausar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => handleOpenEditCourse(prod)}
                          className="flex-1 rounded-lg border border-hairline bg-surface/50 py-2 text-xs font-bold text-foreground hover:border-primary hover:bg-accent cursor-pointer transition-colors"
                        >
                          Editar Curso Completo
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.nome)}
                          className="px-2.5 rounded-lg border border-hairline bg-surface/50 py-2 text-xs text-muted-foreground hover:text-overdue hover:bg-overdue/10 cursor-pointer transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* MODE 2: LIST / TABULAR VIEW */}
          {catalogDisplayMode === "list" && (
            <GlassCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-hairline bg-surface/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Código SKU</th>
                      <th className="px-6 py-3.5 font-bold">Curso / Oferta</th>
                      <th className="px-6 py-3.5 font-bold">Modalidade</th>
                      <th className="px-6 py-3.5 font-bold">Nível CEFR</th>
                      <th className="px-6 py-3.5 font-bold">Carga Horária</th>
                      <th className="px-6 py-3.5 font-bold">Livro Didático</th>
                      <th className="px-6 py-3.5 font-bold">Preço Base</th>
                      <th className="px-6 py-3.5 font-bold">Status</th>
                      <th className="px-6 py-3.5 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {products.map((prod) => {
                      const modInfo = MODALITY_LABELS[prod.modalidade] || MODALITY_LABELS.mensalidade_fixa;

                      return (
                        <tr key={prod.id} className="hover:bg-surface/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-muted-foreground">
                            {prod.codigo}
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">
                            <p>{prod.nome}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 font-normal">{prod.descricao}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase border ${modInfo.badgeClass}`}>
                              {modInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-foreground">
                            {prod.nivel}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            <span className="font-bold text-foreground">{prod.cargaHorariaSemanal}h/sem</span>
                            <span className="block text-[10px]">{prod.cargaHorariaTotal}h totais ({prod.vezesPorSemana}x {prod.duracaoAulaMinutos}min)</span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {prod.livroPadraoNome || "Material Padrão"}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-foreground">
                            {brl(prod.valorBase)}
                            <span className="text-[9px] font-normal text-muted-foreground block">
                              {prod.modalidade === "hora_aula" ? "/ hora" : prod.modalidade === "pacote_fechado" ? "/ pacote" : "/ mês"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill tone={prod.ativo ? "paid" : "due"}>
                              {prod.ativo ? "Ativo" : "Pausado"}
                            </StatusPill>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditCourse(prod)}
                                className="p-1.5 rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Editar Curso"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleProductStatus(prod.id, prod.ativo, prod.nome)}
                                className="px-2 py-1 rounded-lg border border-hairline text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                {prod.ativo ? "Pausar" : "Ativar"}
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.nome)}
                                className="p-1.5 rounded-lg border border-hairline hover:bg-overdue/10 text-muted-foreground hover:text-overdue cursor-pointer"
                                title="Remover"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN COURSE EDITOR WITH INTEL PRICING CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === "cursos" && viewMode === "editor" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Bar of the Editor */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("list")}
                className="grid size-9 place-items-center rounded-lg border border-hairline bg-surface/60 text-foreground hover:bg-accent cursor-pointer transition-colors"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {editingProduct ? "Edição de Oferta Educacional" : "Novo Curso no Catálogo"}
                  </span>
                  {editingProduct && (
                    <span className="font-mono text-[10px] text-muted-foreground bg-surface px-2 py-0.5 rounded border border-hairline">
                      SKU: {prodCodigo}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground mt-0.5">
                  {prodNome || "Defina o Nome do Curso"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCourse}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Save className="size-4" /> Salvar Curso no Catálogo
              </button>
            </div>
          </div>

          {/* Editor Form Layout (2 Wide Columns) */}
          <form onSubmit={handleSaveCourse} className="grid gap-6 lg:grid-cols-2">
            
            {/* COLUMN 1: DADOS GERAIS, NÍVEL E CARGA HORÁRIA ANALÍTICA */}
            <div className="space-y-6">
              <GlassCard className="p-6 space-y-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-hairline pb-2">
                  <Tag className="size-4 text-primary" /> Identificação & Nível Educacional
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Nome Comercial do Curso *
                    </label>
                    <input
                      placeholder="Ex: Inglês Regular Semestral, VIP Executivo 1-on-1..."
                      value={prodNome}
                      onChange={(e) => setProdNome(e.target.value)}
                      className="h-11 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Código Imutável */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Código / SKU do Curso
                        </label>
                        {editingProduct && (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <Lock className="size-3" /> Bloqueado
                          </span>
                        )}
                      </div>
                      <input
                        value={prodCodigo}
                        onChange={(e) => !editingProduct && setProdCodigo(e.target.value)}
                        readOnly={!!editingProduct}
                        className={`h-10 w-full rounded-lg border border-hairline px-3 text-xs font-mono outline-none ${
                          editingProduct
                            ? "bg-surface/30 text-muted-foreground cursor-not-allowed opacity-75"
                            : "bg-surface/50 text-foreground focus:border-primary"
                        }`}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {editingProduct
                          ? "Código protegido para integridade dos contratos vigentes."
                          : "Gerado automaticamente para identificar este curso no sistema."}
                      </p>
                    </div>

                    {/* Nível CEFR com Dropdown Dinâmico + Atalho */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Nível / Estágio CEFR
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenNewLevel();
                            setIsLevelsModalOpen(true);
                          }}
                          className="text-[10px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-0"
                        >
                          <Settings2 className="size-3" /> Editar Níveis
                        </button>
                      </div>
                      <select
                        value={prodNivel}
                        onChange={(e) => setProdNivel(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                      >
                        {levels.map((lvl) => (
                          <option key={lvl.id} value={lvl.nome}>
                            [{lvl.codigo}] {lvl.nome} ({lvl.horasSugeridas}h)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Modalidade de Cobrança */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Modalidade de Cobrança Financeira
                    </label>
                    <select
                      value={prodModalidade}
                      onChange={(e) => setProdModalidade(e.target.value as PricingModelType)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                    >
                      <option value="mensalidade_fixa">Turma Regular (Mensalidade Fixa)</option>
                      <option value="hora_aula">VIP / Hora-Aula (Particular)</option>
                      <option value="frequencia_semanal">Por Frequência Semanal</option>
                      <option value="pacote_fechado">Pacote Fechado / Semestral</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground bg-surface/30 p-2.5 rounded-lg border border-hairline">
                      {MODALITY_LABELS[prodModalidade]?.desc}
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* PAINEL ANALÍTICO DE CARGA HORÁRIA */}
              <GlassCard className="p-6 space-y-5 border-primary/20">
                <div className="flex justify-between items-center border-b border-hairline pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="size-4 text-primary" /> Matriz Analítica de Carga Horária & Aulas
                  </h3>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Cálculo Automático
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Duração / Aula
                    </label>
                    <select
                      value={prodDuracaoMinutos}
                      onChange={(e) => setProdDuracaoMinutos(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                    >
                      <option value={45}>45 min (Kids)</option>
                      <option value={60}>1h00 (60 min)</option>
                      <option value={90}>1h30 (90 min)</option>
                      <option value={120}>2h00 (120 min)</option>
                      <option value={180}>3h00 (Sábados)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Vezes / Semana
                    </label>
                    <select
                      value={prodVezesSemana}
                      onChange={(e) => setProdVezesSemana(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                    >
                      <option value={1}>1x na semana</option>
                      <option value={2}>2x na semana (Padrão)</option>
                      <option value={3}>3x na semana (Intensivo)</option>
                      <option value={4}>4x na semana</option>
                      <option value={5}>5x na semana (Imersão)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Total Módulo (h)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={prodCargaTotal}
                      onChange={(e) => setProdCargaTotal(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-bold"
                    />
                  </div>
                </div>

                {/* Dashboard com os cálculos de carga horária */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface/40 border border-hairline text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Carga Horária Semanal:
                    </span>
                    <p className="text-lg font-extrabold text-foreground mt-0.5">
                      {cargaHorariaSemanalCalculada} horas / semana
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Base para cálculo do pagamento docente
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Carga Horária Mensal:
                    </span>
                    <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
                      ~{cargaHorariaMensalCalculada} horas / mês
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Projeção com base em 4.33 semanas/mês
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* COLUMN 2: CALCULADORA INTELIGENTE DE PRECIFICAÇÃO & DETALHES */}
            <div className="space-y-6">
              
              {/* CALCULADORA DE SUGESTÃO DE PRECIFICAÇÃO BASEADA EM CUSTOS */}
              <GlassCard className="p-6 space-y-5 border-emerald-500/30 bg-emerald-500/[0.02]">
                <div className="flex justify-between items-center border-b border-hairline pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calculator className="size-4 text-emerald-400" /> Calculadora de Sugestão de Preço (Base DRE)
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="size-3" /> Unit Economics
                  </span>
                </div>

                {/* Parâmetros do Simulador */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Alunos Estimados na Turma
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={simulacaoAlunos}
                        onChange={(e) => setSimulacaoAlunos(Number(e.target.value))}
                        disabled={prodModalidade === "hora_aula"}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-bold"
                      />
                      <span className="text-xs text-muted-foreground font-semibold">alunos</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Margem Alvo
                      </label>
                      <span className="text-xs font-extrabold text-emerald-400">{margemLucroAlvoPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={70}
                      step={5}
                      value={margemLucroAlvoPct}
                      onChange={(e) => setMargemLucroAlvoPct(Number(e.target.value))}
                      className="w-full h-2 rounded-lg bg-surface border border-hairline accent-primary cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* Painel com Decomposição de Custos e Preço Sugerido */}
                <div className="space-y-3 p-4 rounded-xl bg-surface/50 border border-hairline text-xs">
                  <div className="grid grid-cols-2 gap-3 divide-x divide-hairline">
                    <div className="space-y-1 pr-2">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                        Custo Docente Turma:
                      </span>
                      <p className="font-bold text-foreground">
                        {brl(custoDocenteTotalTurmaMes)} / mês
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          ({cargaHorariaMensalCalculada}h × R$ 45/h)
                        </span>
                      </p>

                      <span className="text-[10px] text-muted-foreground font-semibold uppercase block pt-2">
                        Custo Real / Aluno / Mês:
                      </span>
                      <p className="font-bold text-foreground">
                        {brl(custoTotalRealPorAluno)}
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          (Docente + Rateio Fixo + Material)
                        </span>
                      </p>
                    </div>

                    <div className="space-y-1 pl-4">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                        Break-Even (Ponto Equilíbrio):
                      </span>
                      <p className="font-bold text-amber-400">
                        {brl(precoMinimoBreakEven)} / mês
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          Preço mínimo sem prejuízo
                        </span>
                      </p>

                      <span className="text-[10px] text-emerald-400 font-bold uppercase block pt-2">
                        ⭐ Preço Sugerido ({margemLucroAlvoPct}% Margem):
                      </span>
                      <p className="text-xl font-extrabold text-emerald-400">
                        {brl(precoSugeridoCalculado)}
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          {prodModalidade === "hora_aula" ? "por hora lecionada" : "por mês"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Projeção de Lucro da Turma */}
                  <div className="border-t border-hairline pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                        Lucro Projetado da Turma ({qtdAlunosCalc} alunos):
                      </span>
                      <p className="text-sm font-extrabold text-foreground">
                        {brl(lucroEstimadoTurmaMes)} / mês
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplySuggestedPrice}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition-all shadow cursor-pointer active:scale-[0.98]"
                    >
                      <Sparkles className="size-3.5" /> Aplicar Preço Sugerido
                    </button>
                  </div>
                </div>

                {/* Input de Valor Base */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Valor Final do Curso no Catálogo (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min={1}
                      value={prodValor}
                      onChange={(e) => setProdValor(Number(e.target.value))}
                      className="h-11 w-full rounded-lg border border-hairline bg-surface/50 pl-9 pr-3 text-lg font-extrabold text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Material Didático & Detalhes */}
              <GlassCard className="p-6 space-y-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-hairline pb-2">
                  <BookOpen className="size-4 text-primary" /> Material Didático & Detalhes
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Livro / Material Didático Padrão
                    </label>
                    <select
                      value={prodLivroId}
                      onChange={(e) => setProdLivroId(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                    >
                      {livrosTrilhas.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.titulo} (Nível {book.nivel} · {book.aulas.length} Aulas estruturadas)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Descrição & Proposta Metodológica
                    </label>
                    <textarea
                      placeholder="Destaques do curso, foco da conversação, diferenciais e dinâmicas..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-hairline bg-surface/50 p-2.5 text-xs text-foreground outline-none focus:border-primary resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Público-Alvo
                      </label>
                      <input
                        placeholder="Ex: Adultos, Crianças 7-12 anos..."
                        value={prodPublico}
                        onChange={(e) => setProdPublico(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Capacidade Máx. por Turma
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={40}
                        value={prodMaxAlunos}
                        onChange={(e) => setProdMaxAlunos(Number(e.target.value))}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-bold"
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className="rounded-lg border border-hairline px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar & Descartar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer transition-all"
                >
                  Salvar Curso no Catálogo
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAMENTO DE NÍVEIS & ESTÁGIOS CEFR DA ESCOLA */}
      {/* ========================================================================= */}
      {isLevelsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-2xl p-6 space-y-5 shadow-2xl relative border-primary/30 text-foreground max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsLevelsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Settings2 className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Gerenciador de Níveis & Estágios CEFR da Escola
                </h3>
                <p className="text-xs text-muted-foreground">
                  Crie, edite e personalize a nomenclatura de níveis da sua metodologia.
                </p>
              </div>
            </div>

            {/* Form de Criar / Editar Nível */}
            <form onSubmit={handleSaveLevel} className="rounded-xl border border-hairline bg-surface/40 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
                {editingLevelId ? <Pencil className="size-3 text-primary" /> : <Plus className="size-3 text-primary" />}
                {editingLevelId ? "Editar Nível Selecionado" : "Adicionar Novo Nível / Estágio"}
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Código (ex: A1, KIDS-1)</label>
                  <input
                    value={levelFormCodigo}
                    onChange={(e) => setLevelFormCodigo(e.target.value)}
                    className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary font-mono font-bold"
                    placeholder="Ex: A1, B2, KIDS"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Estágio *</label>
                  <input
                    value={levelFormNome}
                    onChange={(e) => setLevelFormNome(e.target.value)}
                    className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary font-medium"
                    placeholder="Ex: Beginner / Kids Starter, Advanced Fluent..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Descrição das Competências</label>
                  <input
                    value={levelFormDesc}
                    onChange={(e) => setLevelFormDesc(e.target.value)}
                    className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary"
                    placeholder="Ex: Vocabulário cotidiano e conversação básica"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Horas Sugeridas</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={levelFormHoras}
                    onChange={(e) => setLevelFormHoras(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingLevelId && (
                  <button
                    type="button"
                    onClick={handleOpenNewLevel}
                    className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer"
                >
                  {editingLevelId ? "Atualizar Nível" : "Salvar Nível"}
                </button>
              </div>
            </form>

            {/* Tabela de Níveis Cadastrados */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Níveis Ativos na Escola ({levels.length})
              </h4>
              <div className="divide-y divide-hairline rounded-xl border border-hairline bg-surface/30 max-h-56 overflow-y-auto">
                {levels.map((lvl) => (
                  <div key={lvl.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-xs">
                        {lvl.codigo}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">{lvl.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{lvl.descricao || "Sem descrição"} · {lvl.horasSugeridas}h sugeridas</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditLevel(lvl)}
                        className="p-1.5 rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLevel(lvl.id, lvl.nome)}
                        className="p-1.5 rounded-lg border border-hairline hover:bg-overdue/10 text-muted-foreground hover:text-overdue cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-hairline">
              <button
                type="button"
                onClick={() => setIsLevelsModalOpen(false)}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 cursor-pointer"
              >
                Concluir & Voltar
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MÓDULOS ERP (COM TOGGLE DE CARDS VS LISTA) */}
      {/* ========================================================================= */}
      {activeTab === "modules" && viewMode === "list" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Módulos & Recursos Adicionais</h3>
              <p className="text-xs text-muted-foreground">Contrate recursos do ecossistema Fluency AI para a sua franquia.</p>
            </div>

            {/* Toggle Cards vs List */}
            <div className="flex items-center rounded-lg border border-hairline bg-surface/50 p-0.5">
              <button
                onClick={() => setModulesDisplayMode("cards")}
                title="Visualização em Cards"
                className={`p-2 rounded-md transition-all cursor-pointer ${
                  modulesDisplayMode === "cards"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setModulesDisplayMode("list")}
                title="Visualização em Lista"
                className={`p-2 rounded-md transition-all cursor-pointer ${
                  modulesDisplayMode === "list"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          {modulesDisplayMode === "cards" ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {MODULES.map((m) => {
                  const isEnabled = active.includes(m.id);
                  const Icon = m.icon;
                  return (
                    <GlassCard
                      key={m.id}
                      className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
                        isEnabled ? "border-primary/20 bg-primary/[0.01]" : "border-hairline opacity-80"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={`grid size-11 place-items-center rounded-xl border ${
                            isEnabled
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-surface-elevated/40 border-hairline text-muted-foreground"
                          }`}
                        >
                          {isEnabled ? <Icon className="size-5" /> : <Lock className="size-5" />}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                                isEnabled
                                  ? "bg-primary/10 border-primary/20 text-primary"
                                  : "bg-muted border-hairline text-muted-foreground"
                              }`}
                            >
                              {isEnabled ? "Ativo" : "Bloqueado"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-hairline">
                        <span className="text-xs font-semibold text-foreground">{brl(m.price)}/mês</span>
                        {isEnabled ? (
                          <button
                            onClick={() => toggleModule(m.id)}
                            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-overdue hover:bg-overdue/10 transition-colors cursor-pointer"
                          >
                            Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenCheckout(m)}
                            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Sparkles className="size-3.5" /> Contratar
                          </button>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>

              <div className="space-y-4">
                <GlassCard className="p-6 space-y-4 sticky top-6">
                  <h3 className="text-sm font-semibold text-foreground">Resumo da Assinatura</h3>
                  <div className="space-y-2 text-xs divide-y divide-hairline">
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Módulos Ativos</span>
                      <span className="font-semibold text-foreground">{active.length} de {MODULES.length}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Total Mensal</span>
                      <span className="font-bold text-foreground text-sm">{brl(monthlyTotal)}/mês</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Próxima Fatura</span>
                      <span className="font-semibold text-foreground">05/09/2026</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-hairline bg-surface/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Módulo</th>
                    <th className="px-6 py-3.5 font-bold">Descrição</th>
                    <th className="px-6 py-3.5 font-bold">Valor Mensal</th>
                    <th className="px-6 py-3.5 font-bold">Status</th>
                    <th className="px-6 py-3.5 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {MODULES.map((m) => {
                    const isEnabled = active.includes(m.id);
                    const Icon = m.icon;
                    return (
                      <tr key={m.id} className="hover:bg-surface/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2.5">
                          <span className={`grid size-7 place-items-center rounded-md border ${isEnabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface text-muted-foreground"}`}>
                            <Icon className="size-3.5" />
                          </span>
                          {m.name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground max-w-md">
                          {m.description}
                        </td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          {brl(m.price)}/mês
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill tone={isEnabled ? "paid" : "due"}>
                            {isEnabled ? "Ativo" : "Bloqueado"}
                          </StatusPill>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEnabled ? (
                            <button
                              onClick={() => toggleModule(m.id)}
                              className="rounded-lg border border-hairline px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-overdue hover:bg-overdue/10 transition-colors cursor-pointer"
                            >
                              Desativar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenCheckout(m)}
                              className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Sparkles className="size-3" /> Contratar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PERSONALIZAÇÃO BRANDING (ORIGINAL) */}
      {/* ========================================================================= */}
      {activeTab === "branding" && viewMode === "list" && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-300">
          <GlassCard className="lg:col-span-2 p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Identidade da Unidade</h3>
              <p className="text-xs text-muted-foreground">Personalize a cor principal e o nome da sua escola no ERP.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Nome da Escola</label>
                <input
                  value={schoolName}
                  onChange={(e) => {
                    setSchoolName(e.target.value);
                    setTenantName(e.target.value);
                  }}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Cor Primária (Hexadecimal)</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      handleColorChange(e);
                      setPrimaryColor(e.target.value);
                    }}
                    className="size-10 rounded-lg cursor-pointer border border-hairline bg-transparent p-1"
                  />
                  <input
                    value={customColor}
                    onChange={(e) => {
                      handleColorChange(e);
                      setPrimaryColor(e.target.value);
                    }}
                    className="h-10 w-32 rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Presets Prontos</h3>
            <div className="space-y-2">
              <button
                onClick={() => handlePresetSelect("lumen")}
                className="w-full text-left p-3 rounded-lg border border-hairline hover:border-primary bg-surface/40 text-xs font-semibold text-foreground cursor-pointer transition-colors"
              >
                Fluency AI (Padrão Amarelo/Dourado)
              </button>
              <button
                onClick={() => handlePresetSelect("apex")}
                className="w-full text-left p-3 rounded-lg border border-hairline hover:border-primary bg-surface/40 text-xs font-semibold text-foreground cursor-pointer transition-colors"
              >
                Apex English (Azul Oceano)
              </button>
              <button
                onClick={() => handlePresetSelect("british")}
                className="w-full text-left p-3 rounded-lg border border-hairline hover:border-primary bg-surface/40 text-xs font-semibold text-foreground cursor-pointer transition-colors"
              >
                British Academy (Vermelho Carmim)
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* CHECKOUT MODAL FOR ERP MODULES */}
      {isCheckoutOpen && checkoutModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-5 shadow-2xl relative border-primary/30">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-hairline pb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Contratar {checkoutModule.name}</h3>
                <p className="text-xs text-muted-foreground">{brl(checkoutModule.price)} / mês</p>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="flex border border-hairline rounded-lg overflow-hidden bg-surface/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer border-0 rounded-md ${
                    paymentMethod === "pix"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground bg-transparent"
                  }`}
                >
                  Pix Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer border-0 rounded-md ${
                    paymentMethod === "card"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground bg-transparent"
                  }`}
                >
                  Cartão de Crédito
                </button>
              </div>

              {paymentMethod === "pix" ? (
                <div className="text-center p-4 rounded-xl border border-hairline bg-surface/30 space-y-2">
                  <p className="text-xs text-muted-foreground">Chave Pix Copia e Cola gerada para pagamento:</p>
                  <p className="text-[11px] font-mono bg-surface p-2 rounded border border-hairline truncate select-all">
                    00020101021226870014br.gov.bcb.pix2565fluency.ai/pay/mod-99
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    placeholder="Número do Cartão"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                  <input
                    placeholder="Nome no Cartão"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Processando Ativação..." : "Confirmar & Ativar Módulo"}
              </button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
