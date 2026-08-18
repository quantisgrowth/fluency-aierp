import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, UserPlus, MoveRight } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { ModuleGate } from "@/components/module-gate";
import { crmStages as initialStages, brl } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "CRM Comercial — Lumen ERP" },
      { name: "description", content: "Funil Kanban de captação de leads." },
    ],
  }),
  component: CrmPage,
});

function CrmPage() {
  const [stages, setStages] = useState(initialStages);

  const simulateMoveCard = (stageId: string, cardName: string) => {
    // Find the next stage index
    const currentStageIdx = stages.findIndex((s) => s.id === stageId);
    if (currentStageIdx === -1 || currentStageIdx === stages.length - 1) {
      toast.info(`${cardName} já está no estágio final!`);
      return;
    }

    const nextStage = stages[currentStageIdx + 1];
    
    // Copy stages state
    const nextStages = stages.map((s) => {
      if (s.id === stageId) {
        return {
          ...s,
          cards: s.cards.filter((c) => c.nome !== cardName),
        };
      }
      if (s.id === nextStage.id) {
        const cardToMove = stages[currentStageIdx].cards.find((c) => c.nome === cardName);
        return {
          ...s,
          cards: cardToMove ? [...s.cards, cardToMove] : s.cards,
        };
      }
      return s;
    });

    setStages(nextStages);
    toast.success(`${cardName} avançou para ${nextStage.titulo}!`);
  };

  const simulateAddLead = () => {
    const names = ["Gabriel Ramos", "Carla Albuquerque", "Lucas Mendonça"];
    const sources = ["Google Ads", "Instagram", "Indicação"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    // Check if name already exists in any column to prevent duplicates in UI
    const exists = stages.some(s => s.cards.some(c => c.nome === randomName));
    const finalName = exists ? `${randomName} (${Math.floor(Math.random() * 100)})` : randomName;
    
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomValue = Math.floor(Math.random() * 5000) + 2000;

    const nextStages = stages.map((s) => {
      if (s.id === "lead") {
        return {
          ...s,
          cards: [...s.cards, { nome: finalName, origem: randomSource, valor: randomValue }],
        };
      }
      return s;
    });

    setStages(nextStages);
    toast.success(`Novo Lead criado: ${finalName}!`);
  };

  return (
    <ModuleGate module="crm">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação"
          title="CRM Comercial & Funil"
          description="Acompanhe oportunidades de matrícula em um funil Kanban interativo e otimize a conversão de leads."
          action={
            <button
              onClick={simulateAddLead}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer"
            >
              <UserPlus className="size-4" /> Simular Lead
            </button>
          }
        />

        {/* Kanban Board */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => {
            const totalValue = stage.cards.reduce((sum, c) => sum + c.valor, 0);
            return (
              <GlassCard key={stage.id} className="p-4 flex flex-col h-[520px] bg-surface/20 border-hairline/60">
                {/* Column header */}
                <div className="pb-3 border-b border-hairline flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{stage.titulo}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Estágio de vendas</p>
                  </div>
                  <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-bold">
                    {stage.cards.length}
                  </span>
                </div>

                {/* Column value summary */}
                <div className="py-2.5 flex items-center justify-between text-xs text-muted-foreground border-b border-hairline/30 mb-4 bg-surface-elevated/20 px-2 rounded">
                  <span>Volume projetado:</span>
                  <span className="font-semibold text-foreground">{brl(totalValue)}</span>
                </div>

                {/* Cards stack */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {stage.cards.length > 0 ? (
                    stage.cards.map((card) => (
                      <div
                        key={card.nome}
                        className="group rounded-xl border border-hairline bg-surface-elevated/50 p-4 hover:border-white/10 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{card.nome}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Origem: {card.origem}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-foreground">{brl(card.valor)}</span>
                            {stage.id !== "fechada" && (
                              <button
                                onClick={() => simulateMoveCard(stage.id, card.nome)}
                                aria-label="Avançar lead"
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer font-medium"
                              >
                                Avançar <MoveRight className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-muted-foreground border border-dashed border-hairline rounded-xl">
                      Nenhum lead nesta etapa
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </ModuleGate>
  );
}
