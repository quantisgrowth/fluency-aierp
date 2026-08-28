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
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { useModules } from "@/modules/module-context";
import { MODULES } from "@/modules/registry";
import { useTenant, type TenantPreset } from "@/modules/tenant-context";
import {
  brl,
  initialEducationalProducts,
  type EducationalProduct,
  type PricingModelType,
  livrosTrilhas,
  students as defaultStudents,
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

const MODALITY_LABELS: Record<PricingModelType, { label: string; badgeClass: string }> = {
  mensalidade_fixa: {
    label: "Turma Regular (Mensalidade)",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  hora_aula: {
    label: "VIP / Hora-Aula",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  frequencia_semanal: {
    label: "Por Frequência Semanal",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  pacote_fechado: {
    label: "Pacote Fechado / Semestral",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
};

function AdminModulosPage() {
  const { active, toggle: toggleModule, monthlyTotal } = useModules();
  const { tenant, setTenantName, setPrimaryColor, applyPreset } = useTenant();
  const [activeTab, setActiveTab] = useState<"cursos" | "modules" | "branding">("cursos");
  const [customColor, setCustomColor] = useState(tenant.primaryColor);
  const [schoolName, setSchoolName] = useState(tenant.name);

  // Educational Products State
  const [products, setProducts] = useState<EducationalProduct[]>(() => {
    try {
      const stored = window.localStorage.getItem(PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : initialEducationalProducts;
    } catch {
      return initialEducationalProducts;
    }
  });

  // Modal Novo / Editar Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EducationalProduct | null>(null);
  const [prodNome, setProdNome] = useState("");
  const [prodCodigo, setProdCodigo] = useState("");
  const [prodModalidade, setProdModalidade] = useState<PricingModelType>("mensalidade_fixa");
  const [prodNivel, setProdNivel] = useState("A1 a C2");
  const [prodHoras, setProdHoras] = useState(3);
  const [prodLivroId, setProdLivroId] = useState(livrosTrilhas[0]?.id || "");
  const [prodValor, setProdValor] = useState(450);
  const [prodDesc, setProdDesc] = useState("");
  const [prodPublico, setProdPublico] = useState("Jovens e Adultos");
  const [prodPermiteTurma, setProdPermiteTurma] = useState(true);

  // Self-Service Checkout states
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
      `Marca alternada para ${preset === "lumen" ? "Fluency AI" : preset === "apex" ? "Apex English" : "British Academy"}!`,
      {
        description: "Cores e textos foram aplicados dinamicamente no sistema.",
      }
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
      toast.success(`Módulo "${checkoutModule.name}" contratado com sucesso!`, {
        description: "A funcionalidade foi adicionada à barra lateral do menu.",
      });
      setCheckoutModule(null);
    }, 1500);
  };

  // Product CRUD Handlers
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdNome("");
    setProdCodigo(`CUR-${Date.now().toString().slice(-4)}`);
    setProdModalidade("mensalidade_fixa");
    setProdNivel("A1 a C2");
    setProdHoras(3);
    setProdLivroId(livrosTrilhas[0]?.id || "");
    setProdValor(450);
    setProdDesc("");
    setProdPublico("Jovens e Adultos");
    setProdPermiteTurma(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: EducationalProduct) => {
    setEditingProduct(prod);
    setProdNome(prod.nome);
    setProdCodigo(prod.codigo);
    setProdModalidade(prod.modalidade);
    setProdNivel(prod.nivel);
    setProdHoras(prod.cargaHorariaSemanal);
    setProdLivroId(prod.livroPadraoId || livrosTrilhas[0]?.id || "");
    setProdValor(prod.valorBase);
    setProdDesc(prod.descricao);
    setProdPublico(prod.publicoAlvo);
    setProdPermiteTurma(prod.permiteTurma);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
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
                codigo: prodCodigo.trim(),
                modalidade: prodModalidade,
                nivel: prodNivel,
                cargaHorariaSemanal: Number(prodHoras),
                livroPadraoId: prodLivroId,
                livroPadraoNome: selectedBook?.titulo || "Material Padrão",
                valorBase: Number(prodValor),
                descricao: prodDesc,
                publicoAlvo: prodPublico,
                permiteTurma: prodPermiteTurma,
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
        cargaHorariaSemanal: Number(prodHoras),
        livroPadraoId: prodLivroId,
        livroPadraoNome: selectedBook?.titulo || "Material Padrão",
        valorBase: Number(prodValor),
        descricao: prodDesc,
        publicoAlvo: prodPublico,
        ativo: true,
        permiteTurma: prodPermiteTurma,
        maxAlunosTurma: prodPermiteTurma ? 12 : 1,
      };
      setProducts([newProduct, ...products]);
      toast.success(`Novo curso "${prodNome}" criado no catálogo da escola!`);
    }
    setIsProductModalOpen(false);
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

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Gestão Acadêmica & Plataforma"
        title="Catálogo de Cursos & Módulos da Escola"
        description="Gerencie os produtos educacionais oferecidos pela sua escola, contrate módulos adicionais do ERP ou personalize o Private Label."
      />

      {/* Tabs selectors */}
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

      {/* TAB 1: CATÁLOGO DE CURSOS & PRODUTOS EDUCACIONAIS */}
      {activeTab === "cursos" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top KPI & Add Button Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Grade de Cursos e Modalidades Contratáveis
              </h3>
              <p className="text-xs text-muted-foreground">
                Cada curso define as regras de cobrança (mensalidade, hora-aula ou pacote), livro didático e alocação de turmas.
              </p>
            </div>

            <button
              onClick={handleOpenNewProduct}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              <Plus className="size-4" /> + Novo Curso / Oferta
            </button>
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
                <span className="font-semibold uppercase tracking-wider">Modalidades Suportadas</span>
                <Layers className="size-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">4 Formatos</p>
              <p className="text-[11px] text-muted-foreground">Turma Regular, VIP Hora-Aula, Pacote e Frequência</p>
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

          {/* Educational Products Grid */}
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
                  <div className="space-y-2.5">
                    {/* Badge line */}
                    <div className="flex justify-between items-start gap-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${modInfo.badgeClass}`}>
                        {modInfo.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{prod.codigo}</span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground leading-snug">{prod.nome}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{prod.descricao}</p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] text-foreground font-medium flex items-center gap-1">
                        <Tag className="size-3 text-primary" /> Nível: {prod.nivel}
                      </span>
                      <span className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] text-foreground font-medium flex items-center gap-1">
                        <Clock className="size-3 text-primary" /> {prod.cargaHorariaSemanal}h / sem
                      </span>
                      {prod.livroPadraoNome && (
                        <span className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                          <BookOpen className="size-3 text-muted-foreground" /> {prod.livroPadraoNome}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Pricing & Actions */}
                  <div className="space-y-3 pt-3 border-t border-hairline">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Valor Cobrado</span>
                      <span className="text-base font-bold text-foreground">
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          prod.ativo
                            ? "border-hairline bg-surface/40 text-muted-foreground hover:text-foreground"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {prod.ativo ? "Pausar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => handleOpenEditProduct(prod)}
                        className="flex-1 rounded-lg border border-hairline bg-surface/50 py-1.5 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.nome)}
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

      {/* TAB 2: MÓDULOS ERP (ORIGINAL) */}
      {activeTab === "modules" && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-300">
          {/* Modules List Grid */}
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

          {/* Billing & Subscription Summary */}
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
      )}

      {/* TAB 3: PERSONALIZAÇÃO BRANDING (ORIGINAL) */}
      {activeTab === "branding" && (
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

      {/* MODAL: NOVO / EDITAR PRODUTO EDUCACIONAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative border-primary/30">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {editingProduct ? "Editar Curso / Oferta" : "Novo Curso / Oferta Educacional"}
                </h3>
                <p className="text-[10px] text-muted-foreground">Cadastre no cardápio de produtos da escola.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome do Curso / Produto *
                </label>
                <input
                  placeholder="Ex: Inglês Regular Semestral, VIP Executivo..."
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Modalidade de Cobrança
                  </label>
                  <select
                    value={prodModalidade}
                    onChange={(e) => setProdModalidade(e.target.value as PricingModelType)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="mensalidade_fixa">Turma Regular (Mensalidade)</option>
                    <option value="hora_aula">VIP / Hora-Aula</option>
                    <option value="frequencia_semanal">Por Frequência Semanal</option>
                    <option value="pacote_fechado">Pacote Fechado / Semestral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nível / Estágio CEFR
                  </label>
                  <input
                    placeholder="Ex: A1 a C2, B2/C1..."
                    value={prodNivel}
                    onChange={(e) => setProdNivel(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={prodValor}
                    onChange={(e) => setProdValor(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Carga Horária
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={prodHoras}
                    onChange={(e) => setProdHoras(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código</label>
                  <input
                    value={prodCodigo}
                    onChange={(e) => setProdCodigo(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Livro / Material Didático Padrão
                </label>
                <select
                  value={prodLivroId}
                  onChange={(e) => setProdLivroId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {livrosTrilhas.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.titulo} (Nível: {book.nivel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Descrição & Proposta Pedagógica
                </label>
                <textarea
                  placeholder="Destaques do curso, metodologia e benefícios..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-hairline bg-surface/50 p-2.5 text-xs text-foreground outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer"
                >
                  Salvar Curso
                </button>
              </div>
            </form>
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
