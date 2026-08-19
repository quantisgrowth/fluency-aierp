import { createFileRoute } from "@tanstack/react-router";
import { Wallet, AlertTriangle, PlayCircle, Send, CheckCircle2, XCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { StatusPill } from "@/components/kit/status-pill";
import { ModuleGate } from "@/components/module-gate";
import { brl, delinquency, dunningSteps, revenueSeries } from "@/data/mock";
import { toast } from "sonner";
import { useUser } from "@/modules/user-context";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Motor Financeiro — Fluency AI" },
      { name: "description", content: "Previsão de caixa, boletos e inadimplência." },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { activeRole } = useUser();

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
    toast.success(`Cobrança de ${aluno} cancelada com sucesso!`);
  };

  return (
    <ModuleGate module="financeiro">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação"
          title="Motor Financeiro & Cobrança"
          description="Monitore sua liquidez, controle a inadimplência com réguas automáticas e acompanhe as previsões de caixa."
        />

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
              {delinquency.map((d) => (
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
    </ModuleGate>
  );
}
