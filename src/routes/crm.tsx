import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, UserPlus, MoveRight, Pencil, X } from "lucide-react";
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

type LeadCard = {
  nome: string;
  origem: string;
  valor: number;
};

type Stage = {
  id: string;
  titulo: string;
  cards: LeadCard[];
};

function CrmPage() {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadCard | null>(null);

  // Edit Lead Form Fields
  const [formName, setFormName] = useState("");
  const [formOrigem, setFormOrigem] = useState("");
  const [formValor, setFormValor] = useState(0);

  const simulateMoveCard = (stageId: string, cardName: string) => {
    const currentStageIdx = stages.findIndex((s) => s.id === stageId);
    if (currentStageIdx === -1 || currentStageIdx === stages.length - 1) {
      toast.info(`${cardName} já está no estágio final!`);
      return;
    }

    const nextStage = stages[currentStageIdx + 1];
    
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

  const handleOpenEditLead = (stageId: string, lead: LeadCard) => {
    setSelectedStageId(stageId);
    setSelectedLead(lead);
    setFormName(lead.nome);
    setFormOrigem(lead.origem);
    setFormValor(lead.valor);
    setIsEditOpen(true);
  };

  const handleEditLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !formName) return;

    const nextStages = stages.map((s) => {
      if (s.id === selectedStageId) {
        return {
          ...s,
          cards: s.cards.map((c) =>
            c.nome === selectedLead.nome
              ? { ...c, nome: formName, origem: formOrigem, valor: Number(formValor) }
              : c
          ),
        };
      }
      return s;
    });

    setStages(nextStages);
    toast.success(`Lead "${formName}" atualizado com sucesso!`);
    setIsEditOpen(false);
    setSelectedLead(null);
  };

  return (
    <ModuleGate module="crm">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação"
          title="CRM Comercial & Funil"
          description="Acompanhe oportunidades de matrícula em um funil Kanban interativo, gerencie e edite os dados dos leads."
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
                        
                        {/* Edit Action trigger overlay */}
                        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditLead(stage.id, card)}
                            title="Editar Lead"
                            className="p-1 rounded bg-surface border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          >
                            <Pencil className="size-3" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="pr-6">
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

      {/* --- INLINE GLASSMORPHIC MODAL FOR LEAD EDIT --- */}
      {isEditOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm p-6 space-y-4 shadow-2xl relative text-foreground">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Editar Lead</h3>
              <p className="text-xs text-muted-foreground">Modifique o nome, origem ou valor projetado da oportunidade.</p>
            </div>

            <form onSubmit={handleEditLeadSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Oportunidade</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem do Lead</label>
                <input
                  value={formOrigem}
                  onChange={(e) => setFormOrigem(e.target.value)}
                  placeholder="Ex: Google Ads, WhatsApp"
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor do Curso (Anual/Semestral)</label>
                <input
                  type="number"
                  value={formValor}
                  onChange={(e) => setFormValor(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
              >
                Salvar Alterações
              </button>
            </form>
          </GlassCard>
        </div>
      )}
    </ModuleGate>
  );
}
