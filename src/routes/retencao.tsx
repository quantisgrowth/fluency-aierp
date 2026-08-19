import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, MessageSquare, BookOpen, UserCheck, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { ModuleGate } from "@/components/module-gate";
import { churnRisk, classDiary } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/retencao")({
  head: () => ({
    meta: [
      { title: "Success & Retenção — Fluency AI" },
      { name: "description", content: "Alertas de churn e diários de classe." },
    ],
  }),
  component: RetencaoPage,
});

function RetencaoPage() {
  const handleContactStudent = (aluno: string) => {
    toast.success(`Abrindo chat de acolhimento para ${aluno}`, {
      description: "Carregando histórico escolar e template de conversa no WhatsApp...",
    });
  };

  return (
    <ModuleGate module="success">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação"
          title="Customer Success & Retenção"
          description="Monitore indicadores preditivos de risco de evasão e acompanhe diários de classe digitais enviados pelos docentes."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Churn Risk list card */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Alerta Preditivo de Evasão (Churn)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Cruzamento automático de presença, pagamentos e notas</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <HeartPulse className="size-4.5 text-rose-400" />
              </span>
            </div>

            <ul className="space-y-4">
              {churnRisk.map((c) => (
                <li key={c.aluno} className="rounded-xl border border-hairline bg-surface/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{c.aluno}</span>
                    <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400">
                      Risco {c.score}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <p className="text-muted-foreground">
                        Motivo: <span className="font-medium text-foreground">{c.motivo}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Turma: {c.turma}</p>
                    </div>
                    <button
                      onClick={() => handleContactStudent(c.aluno)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <MessageSquare className="size-3.5" /> Acolher
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Class Diary card list */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Diário de Classe Digital</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Registros pedagógicos recentes enviados pelos professores</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                <BookOpen className="size-4.5 text-primary" />
              </span>
            </div>

            <ul className="divide-y divide-hairline">
              {classDiary.map((diary) => (
                <li key={diary.turma} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{diary.turma}</span>
                    <span className="text-muted-foreground">{diary.data}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Conteúdo: <span className="text-foreground">{diary.conteudo}</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <UserCheck className="size-3.5 text-paid" />
                    <span>Presença registrada: {diary.presenca} alunos</span>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </ModuleGate>
  );
}
