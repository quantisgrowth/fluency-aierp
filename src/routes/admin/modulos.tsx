import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SlidersHorizontal, Palette, Check, Sparkles, X, CreditCard, Copy, Lock } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { useModules } from "@/modules/module-context";
import { MODULES } from "@/modules/registry";
import { useTenant, type TenantPreset } from "@/modules/tenant-context";
import { brl } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos & Planos — Fluency AI" },
      { name: "description", content: "Administração de módulos de planos e White-Label." },
    ],
  }),
  component: AdminModulosPage,
});

type ModuleDef = typeof MODULES[0];

function AdminModulosPage() {
  const { active, toggle: toggleModule, monthlyTotal } = useModules();
  const { tenant, setTenantName, setPrimaryColor, applyPreset } = useTenant();
  const [activeTab, setActiveTab] = useState<"modules" | "branding">("modules");
  const [customColor, setCustomColor] = useState(tenant.primaryColor);
  const [schoolName, setSchoolName] = useState(tenant.name);

  // Self-Service Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutModule, setCheckoutModule] = useState<ModuleDef | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [isProcessing, setIsProcessing] = useState(false);

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");

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
    toast.success(`Marca alternada para ${preset === "lumen" ? "Fluency AI" : preset === "apex" ? "Apex English" : "British Academy"}!`, {
      description: "Cores e textos foram aplicados dinamicamente no sistema.",
    });
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

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Configurações"
        title="Módulos & Configurações"
        description="Contrate novos recursos para a sua franquia ou configure a identidade visual do Private Label."
      />

      {/* Tabs selectors */}
      <div className="flex border-b border-hairline gap-8">
        <button
          onClick={() => setActiveTab("modules")}
          className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "modules"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="size-4" /> Módulos & Planos
        </button>
        <button
          onClick={() => setActiveTab("branding")}
          className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "branding"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="size-4" /> Personalização (Private Label)
        </button>
      </div>

      {/* Active Tab Panel */}
      {activeTab === "modules" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          
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
                    <span className={`grid size-11 place-items-center rounded-xl border ${
                      isEnabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface-elevated/40 border-hairline text-muted-foreground"
                    }`}>
                      {isEnabled ? <Icon className="size-5" /> : <Lock className="size-5" />}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                          isEnabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-hairline text-muted-foreground"
                        }`}>
                          {isEnabled ? "Contratado" : "Bloqueado"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                        {m.description}
                      </p>
                      
                      {/* Features listing */}
                      <ul className="flex flex-wrap gap-x-4 pt-1">
                        {m.features.map(f => (
                          <li key={f} className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="size-1 rounded-full bg-primary/60" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Switch and price */}
                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right sm:text-left">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mensal</p>
                      <p className="text-base font-bold text-foreground">{brl(m.price)}</p>
                    </div>

                    {m.locked ? (
                      <span className="rounded-lg border border-hairline bg-surface-elevated px-3 py-1.5 text-xs text-muted-foreground font-semibold">
                        Base
                      </span>
                    ) : isEnabled ? (
                      <button
                        onClick={() => {
                          toggleModule(m.id);
                          toast.success(`Módulo ${m.name} desativado!`);
                        }}
                        className="rounded-lg border border-hairline bg-surface-elevated px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-overdue/10 hover:text-overdue cursor-pointer transition-all active:scale-[0.98]"
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCheckout(m)}
                        className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        Contratar
                      </button>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Pricing summary sidebar card */}
          <div>
            <GlassCard className="p-6 space-y-6 sticky top-24">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Resumo do Plano</h3>
                <p className="text-xs text-muted-foreground">Faturamento recorrente da franquia</p>
              </div>

              {/* Breakdown list */}
              <ul className="space-y-3 text-xs">
                {MODULES.map((m) => {
                  const isEnabled = active.includes(m.id);
                  if (!isEnabled) return null;
                  return (
                    <li key={m.id} className="flex justify-between items-center text-muted-foreground font-medium">
                      <span>{m.name}</span>
                      <span className="font-semibold text-foreground">{brl(m.price)}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-hairline pt-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Total Mensal</span>
                <span className="text-xl font-bold text-foreground">{brl(monthlyTotal)}</span>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-[11px] text-primary leading-relaxed">
                Você pode expandir os módulos clicando em <strong>Contratar</strong>. A contratação é imediata e adiciona os itens na barra de navegação principal.
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Tab 2: Customizer branding options */
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Customizer form */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Presets de Marca</h3>
                <p className="text-xs text-muted-foreground">Escolha um dos presets para alternar instantaneamente a marca da plataforma</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Fluency preset */}
                <button
                  onClick={() => handlePresetSelect("lumen")}
                  className={`rounded-xl border p-4 text-left transition-all cursor-pointer relative overflow-hidden ${
                    tenant.preset === "lumen" ? "border-primary bg-primary/5" : "border-hairline hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground">Fluency AI</span>
                    <span className="size-3.5 rounded-full bg-[oklch(0.55_0.09_245)]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Original roxo/SpaceX minimalista.</p>
                </button>

                {/* Apex preset */}
                <button
                  onClick={() => handlePresetSelect("apex")}
                  className={`rounded-xl border p-4 text-left transition-all cursor-pointer relative overflow-hidden ${
                    tenant.preset === "apex" ? "border-primary bg-primary/5" : "border-hairline hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground">Apex English</span>
                    <span className="size-3.5 rounded-full bg-[oklch(0.65_0.23_38)]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Design jovem com laranja neon.</p>
                </button>

                {/* British preset */}
                <button
                  onClick={() => handlePresetSelect("british")}
                  className={`rounded-xl border p-4 text-left transition-all cursor-pointer relative overflow-hidden ${
                    tenant.preset === "british" ? "border-primary bg-primary/5" : "border-hairline hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground">British Academy</span>
                    <span className="size-3.5 rounded-full bg-[oklch(0.55_0.18_200)]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Corporativo clássico azul-oceano.</p>
                </button>
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Ajustes Manuais White-Label</h3>
                <p className="text-xs text-muted-foreground">Modifique detalhes específicos para a marca Private Label da escola</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="schoolName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nome da Escola (White-Label)
                  </label>
                  <input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="primaryColor" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Cor Primária da Marca
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      value={customColor.startsWith("oklch") ? "#8b5cf6" : customColor}
                      onChange={handleColorChange}
                      className="h-10 w-12 rounded-lg border border-hairline bg-surface/50 p-1 cursor-pointer"
                    />
                    <input
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-10 flex-1 rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setTenantName(schoolName);
                    setPrimaryColor(customColor);
                    toast.success("Configuração de marca salva com sucesso!", {
                      description: "A identidade visual do Private Label foi atualizada no sistema.",
                    });
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  Salvar Identidade Visual
                </button>
              </div>
            </GlassCard>
          </div>

          {/* White label preview sidebar */}
          <div>
            <GlassCard className="p-6 space-y-4 sticky top-24">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Prévia do White-Label</h3>
                <p className="text-xs text-muted-foreground">Como o sidebar e botões aparecem para o cliente final</p>
              </div>

              <div className="rounded-xl border border-hairline bg-surface-elevated/40 p-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="size-3.5 text-primary" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{schoolName || tenant.name}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{tenant.tagline}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="rounded bg-accent/60 px-3 py-1.5 text-[10px] text-accent-foreground font-semibold flex items-center gap-2">
                    <Check className="size-3 text-primary" /> Dashboard Ativo
                  </div>
                  <div className="rounded bg-accent/60 px-3 py-1.5 text-[10px] text-accent-foreground font-semibold flex items-center gap-2">
                    <Check className="size-3 text-primary" /> Alunos & Turmas
                  </div>
                </div>

                <button className="w-full rounded-lg bg-primary py-2 text-[11px] font-semibold text-primary-foreground shadow">
                  Botão de Ação
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed text-center px-4">
                Qualquer alteração feita acima altera dinamicamente todo o painel de faturamento e o portal do aluno ao mesmo tempo!
              </p>
            </GlassCard>
          </div>

        </div>
      )}

      {/* --- INLINE GLASSMORPHIC CHECKOUT MODAL (SELF-SERVICE MONETIZATION) --- */}
      {isCheckoutOpen && checkoutModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-5 shadow-2xl relative text-foreground">
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setCheckoutModule(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div>
              <span className="rounded-full bg-primary/15 border border-primary/20 px-2.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">
                Upgrade de Plano
              </span>
              <h3 className="text-base font-bold text-foreground mt-1.5">Contratar Módulo: {checkoutModule.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Adicione esta funcionalidade e aumente a produtividade da sua escola.</p>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-hairline bg-surface/50">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  paymentMethod === "pix" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Pix Instantâneo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  paymentMethod === "card" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Cartão de Crédito
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              
              {paymentMethod === "pix" ? (
                /* Pix QR Code Mock */
                <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
                  <div className="mx-auto grid size-36 place-items-center rounded-xl bg-white border p-3">
                    {/* Simulated Pix QR Code vector grid */}
                    <div className="grid grid-cols-6 gap-1 size-full opacity-80">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <span
                          key={i}
                          className={`rounded-sm ${
                            (i * 3) % 5 === 0 || (i + 2) % 3 === 0 ? "bg-neutral-900" : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Escaneie o QR Code acima no app do seu banco ou copie a chave abaixo:
                    </p>
                    <div className="flex gap-2 items-center justify-between rounded-lg border border-hairline bg-surface-elevated/40 p-2.5 text-[10px] text-muted-foreground select-all">
                      <span className="truncate font-mono">00020126580014br.gov.bcb.pix0136fluencyai-pix-upgrade-key-3849...</span>
                      <button
                        type="button"
                        onClick={() => {
                          toast.success("Código Pix copiado!");
                        }}
                        className="p-1 rounded hover:bg-accent text-foreground transition-all cursor-pointer shrink-0"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Credit Card Mock Form */
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Número do Cartão</label>
                    <div className="relative flex items-center">
                      <input
                        placeholder="4000 1234 5678 9010"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 pl-10 pr-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                      <CreditCard className="size-4 text-muted-foreground absolute left-3" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome no Cartão</label>
                    <input
                      placeholder="Ex: Amanda S. Lima"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Validade</label>
                      <input
                        placeholder="MM/AA"
                        maxLength={5}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CVC</label>
                      <input
                        placeholder="123"
                        maxLength={4}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Price summary and payment trigger */}
              <div className="border-t border-hairline pt-4 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Valor Mensal Adicional:</span>
                  <span className="font-bold text-foreground text-sm">{brl(checkoutModule.price)}/mês</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Processando upgrade...</span>
                    </>
                  ) : (
                    <span>Confirmar Assinatura</span>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
