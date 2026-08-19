import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, Palette, Settings, Check, Sparkles } from "lucide-react";
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

function AdminModulosPage() {
  const { active, toggle: toggleModule, monthlyTotal } = useModules();
  const { tenant, setTenantName, setPrimaryColor, applyPreset } = useTenant();
  const [activeTab, setActiveTab] = useState<"modules" | "branding">("modules");
  const [customColor, setCustomColor] = useState(tenant.primaryColor);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    setPrimaryColor(val);
  };

  const handlePresetSelect = (preset: TenantPreset) => {
    applyPreset(preset);
    toast.success(`Marca alternada para ${preset === "lumen" ? "Fluency AI" : preset === "apex" ? "Apex English" : "British Academy"}!`, {
      description: "Cores e textos foram aplicados dinamicamente no sistema.",
    });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Administração"
        title="Módulos & Configurações"
        description="Gerencie os add-ons do seu plano de negócios e customize a identidade visual para Private Label."
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
                    isEnabled ? "border-primary/20 bg-primary/[0.01]" : "border-hairline"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`grid size-11 place-items-center rounded-xl border ${
                      isEnabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-hairline text-muted-foreground"
                    }`}>
                      <Icon className="size-5" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                          m.locked ? "bg-muted border-hairline text-muted-foreground" : "bg-primary/10 border-primary/20 text-primary"
                        }`}>
                          {m.tier}
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
                    ) : (
                      <button
                        onClick={() => {
                          toggleModule(m.id);
                          toast.success(`Módulo ${m.name} ${isEnabled ? "desativado" : "ativado"}!`);
                        }}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold shadow tracking-wide cursor-pointer transition-all active:scale-[0.98] ${
                          isEnabled
                            ? "bg-overdue text-destructive-foreground hover:bg-overdue/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/95"
                        }`}
                      >
                        {isEnabled ? "Remover" : "Adicionar"}
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
                    <li key={m.id} className="flex justify-between items-center text-muted-foreground">
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

              <button
                onClick={() => toast.success("Configuração de plano atualizada com sucesso no banco!")}
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
              >
                Salvar Configurações
              </button>
            </GlassCard>
          </div>

        </div>
      ) : (
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

                {/* British Academy preset */}
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

              <hr className="border-hairline" />

              <div>
                <h3 className="text-sm font-semibold text-foreground">Ajustes Manuais White-Label</h3>
                <p className="text-xs text-muted-foreground">Modifique detalhes específicos para a marca Private Label da escola</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="schoolName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nome da Escola (White-Label)
                  </label>
                  <input
                    id="schoolName"
                    value={tenant.name}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                    placeholder="Ex: CNA Centro"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="schoolColor" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Cor Primária da Marca
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="schoolColor"
                      type="color"
                      value={customColor.startsWith("oklch") ? "#8b5cf6" : customColor}
                      onChange={handleColorChange}
                      className="size-10 rounded border border-hairline cursor-pointer bg-transparent p-0.5"
                    />
                    <input
                      value={customColor}
                      onChange={handleColorChange}
                      className="h-10 flex-1 rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                      placeholder="Ex: #3b82f6"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Live mock sidebar preview */}
          <div>
            <GlassCard className="p-6 space-y-6 sticky top-24">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Prévia do White-Label</h3>
                <p className="text-xs text-muted-foreground">Como o sidebar e botões aparecem para o cliente final</p>
              </div>

              {/* Mock Sidebar Box */}
              <div className="border border-hairline rounded-xl p-4 bg-background space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 border border-primary/20">
                    <Settings className="size-4 text-primary animate-spin" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{tenant.name}</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{tenant.tagline}</p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-2 bg-primary/10 text-primary p-1.5 rounded-md font-semibold">
                    <Check className="size-3.5" /> Dashboard Ativo
                  </span>
                  <span className="flex items-center gap-2 p-1.5 rounded-md">
                    <Check className="size-3.5 opacity-40" /> Alunos & Turmas
                  </span>
                </div>

                <button className="w-full rounded-lg bg-primary py-1.5 text-xs text-primary-foreground font-semibold shadow hover:bg-primary/95 transition-all text-center">
                  Botão de Ação
                </button>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 flex gap-2 items-start text-xs text-primary leading-relaxed">
                <Sparkles className="size-4.5 shrink-0" />
                <p>Qualquer alteração feita acima altera dinamicamente todo o painel de faturamento e o portal do aluno ao mesmo tempo!</p>
              </div>
            </GlassCard>
          </div>

        </div>
      )}
    </div>
  );
}
