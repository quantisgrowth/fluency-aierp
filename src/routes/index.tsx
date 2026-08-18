import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  Percent,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
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
import { KpiCard } from "@/components/kit/kpi-card";
import { SectionHeader } from "@/components/kit/section-header";
import { StatusPill } from "@/components/kit/status-pill";
import { useModules } from "@/modules/module-context";
import {
  billingStatus,
  brl,
  churnRisk,
  delinquency,
  revenueSeries,
  upcomingClasses,
} from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard do Gestor — Lumen ERP" },
      {
        name: "description",
        content:
          "Faturamento, alunos ativos, conversão do funil e inadimplência da sua escola de idiomas em um só painel.",
      },
      { property: "og:title", content: "Dashboard do Gestor — Lumen ERP" },
      {
        property: "og:description",
        content: "Indicadores de receita, matrículas e retenção para escolas de idiomas.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { isActive } = useModules();
  const totalBilling = billingStatus.reduce((s, b) => s + b.value, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <SectionHeader
        eyebrow="Visão geral do gestor"
        title="Boa tarde, Felipe"
        description="Panorama consolidado da unidade Pinheiros — atualizado há 4 minutos."
        action={
          <Link
            to="/admin/modulos"
            className="rounded-lg border border-hairline px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Simular plano
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isActive("financeiro") && (
          <KpiCard
            label="Faturamento do mês"
            value={brl(164750)}
            delta={4.1}
            hint="vs. julho"
            icon={Wallet}
          />
        )}
        <KpiCard label="Alunos ativos" value="482" delta={2.7} hint="matrícula contínua" icon={Users} />
        {isActive("crm") && (
          <KpiCard label="Conversão do funil" value="31,4%" delta={5.2} hint="lead → matrícula" icon={Percent} />
        )}
        {isActive("financeiro") && (
          <KpiCard
            label="Inadimplência"
            value={brl(9840)}
            delta={-1.4}
            hint="5,6% da carteira"
            icon={AlertTriangle}
            tone="overdue"
          />
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {isActive("financeiro") && (
          <GlassCard className="p-6 xl:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Previsibilidade de caixa</p>
                <p className="text-xs text-muted-foreground">Realizado vs. previsto — últimos 6 meses</p>
              </div>
              <StatusPill tone="paid">
                <TrendingUp className="size-3" /> +12,8% no semestre
              </StatusPill>
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ left: -18, right: 6, top: 6 }}>
                  <defs>
                    <linearGradient id="realizado" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#realizado)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {isActive("financeiro") && (
          <GlassCard className="p-6">
            <p className="text-sm font-medium text-foreground">Status de cobrança</p>
            <p className="text-xs text-muted-foreground">Carteira de agosto</p>
            <p className="tabular mt-5 text-3xl font-semibold text-foreground">{brl(totalBilling)}</p>
            <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-muted">
              {billingStatus.map((s) => (
                <span
                  key={s.label}
                  className={
                    s.token === "paid"
                      ? "bg-paid"
                      : s.token === "due"
                        ? "bg-due"
                        : "bg-overdue"
                  }
                  style={{ width: `${(s.value / totalBilling) * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-5 space-y-3">
              {billingStatus.map((s) => (
                <li key={s.label} className="flex items-center justify-between text-sm">
                  <StatusPill tone={s.token}>{s.label}</StatusPill>
                  <span className="tabular text-foreground">{brl(s.value)}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {isActive("financeiro") && (
          <GlassCard className="p-6">
            <p className="text-sm font-medium text-foreground">Alertas de inadimplência</p>
            <ul className="mt-4 divide-y divide-border">
              {delinquency.map((d) => (
                <li key={d.aluno} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-foreground">{d.aluno}</p>
                    <p className="text-xs text-muted-foreground">{d.turma}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm text-foreground">{brl(d.valor)}</p>
                    <p className="text-xs text-overdue">{d.dias} dias</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {isActive("success") && (
          <GlassCard className="p-6">
            <p className="text-sm font-medium text-foreground">Risco de evasão</p>
            <ul className="mt-4 space-y-4">
              {churnRisk.map((c) => (
                <li key={c.aluno} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{c.aluno}</span>
                    <span className="tabular text-churn">{c.score}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full bg-churn" style={{ width: `${c.score}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{c.motivo} · {c.turma}</p>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        <GlassCard className="p-6">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarClock className="size-4 text-muted-foreground" /> Próximas aulas
          </p>
          <ul className="mt-4 divide-y divide-border">
            {upcomingClasses.map((c) => (
              <li key={c.turma} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-foreground">{c.turma}</p>
                  <p className="text-xs text-muted-foreground">{c.professor} · {c.sala}</p>
                </div>
                <span className="tabular text-sm text-muted-foreground">{c.horario}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
