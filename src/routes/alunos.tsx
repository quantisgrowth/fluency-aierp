import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter, Users, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { StatusPill } from "@/components/kit/status-pill";
import { students } from "@/data/mock";

export const Route = createFileRoute("/alunos")({
  head: () => ({
    meta: [
      { title: "Alunos — Lumen ERP" },
      { name: "description", content: "Cadastro e status dos alunos da escola." },
    ],
  }),
  component: AlunosPage,
});

function AlunosPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === "Ativo").length;
  const overdueStudents = students.filter(s => s.status === "Inadimplente").length;
  const riskStudents = students.filter(s => s.status === "Em risco").length;

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.nome.toLowerCase().includes(search.toLowerCase()) || 
                          s.turma.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "todos" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Pedagógico"
        title="Gestão de Alunos"
        description="Visualize, filtre e gerencie a situação acadêmica e financeira dos estudantes."
      />

      {/* Mini KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Alunos</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{totalStudents}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
            <Users className="size-5 text-primary" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alunos Ativos</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{activeStudents}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-paid/10 border border-paid/20">
            <CheckCircle2 className="size-5 text-paid" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Risco de Evasão</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{riskStudents}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-due/10 border border-due/20">
            <AlertTriangle className="size-5 text-due" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inadimplentes</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{overdueStudents}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-overdue/10 border border-overdue/20">
            <ShieldAlert className="size-5 text-overdue" />
          </span>
        </GlassCard>
      </div>

      {/* Filter and Search controls */}
      <GlassCard className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2 max-w-md">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nome do aluno ou turma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {["todos", "Ativo", "Em risco", "Inadimplente"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all uppercase cursor-pointer ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {status === "todos" ? "Todos" : status}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Students Table/List */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-elevated/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Nome do Aluno</th>
                <th className="px-6 py-4">Proficiência</th>
                <th className="px-6 py-4">Turma Principal</th>
                <th className="px-6 py-4">Data de Início</th>
                <th className="px-6 py-4">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.nome} className="transition-colors hover:bg-surface/30">
                    <td className="px-6 py-4 font-medium text-foreground">{s.nome}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md border border-hairline bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        {s.nivel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{s.turma}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.inicio}</td>
                    <td className="px-6 py-4">
                      <StatusPill
                        tone={
                          s.status === "Ativo"
                            ? "paid"
                            : s.status === "Inadimplente"
                              ? "overdue"
                              : "due"
                        }
                      >
                        {s.status}
                      </StatusPill>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum aluno encontrado correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
