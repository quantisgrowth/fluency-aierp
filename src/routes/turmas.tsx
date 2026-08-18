import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, GraduationCap, Calendar, Users, Plus } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { classes } from "@/data/mock";

export const Route = createFileRoute("/turmas")({
  head: () => ({
    meta: [
      { title: "Turmas — Lumen ERP" },
      { name: "description", content: "Turmas por proficiência e horários." },
    ],
  }),
  component: TurmasPage,
});

function TurmasPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("todos");

  const levels = ["todos", "A1", "A2", "B1", "B2", "C1", "C2"];

  const filteredClasses = classes.filter((c) => {
    const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || 
                          c.professor.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "todos" || c.nivel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Pedagógico"
        title="Turmas por Proficiência"
        description="Acompanhe a ocupação, horários e professores responsáveis por cada nível CEFR."
        action={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer">
            <Plus className="size-4" /> Nova Turma
          </button>
        }
      />

      {/* Filter and Search controls */}
      <GlassCard className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2 max-w-md">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nome da turma ou professor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all uppercase cursor-pointer ${
                levelFilter === lvl
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {lvl === "todos" ? "Todos" : lvl}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Classes Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((c) => {
            const percentage = (c.alunos / c.vagas) * 100;
            const isFull = c.alunos >= c.vagas;

            return (
              <GlassCard key={c.nome} className="p-6 flex flex-col justify-between hover:border-white/10 hover:shadow-lg transition-all duration-300">
                <div className="space-y-4">
                  {/* Top Level badge and name */}
                  <div className="flex items-start justify-between">
                    <span className="rounded-md border border-hairline bg-surface-elevated/80 px-2.5 py-1 text-xs font-bold text-primary tracking-wider uppercase">
                      CEFR {c.nivel}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" /> {c.horario}
                    </span>
                  </div>

                  {/* Title & Teacher */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{c.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Professor: {c.professor}</p>
                  </div>
                </div>

                {/* Bottom Occupancy Progress */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="size-3.5" /> Alunos Matriculados</span>
                    <span className="font-semibold text-foreground">{c.alunos} / {c.vagas}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? "bg-overdue" : "bg-primary"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isFull && (
                    <p className="text-[10px] text-right text-overdue font-semibold">Turma Lotada</p>
                  )}
                </div>
              </GlassCard>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center">
            <GlassCard className="p-8 max-w-md mx-auto text-muted-foreground">
              Nenhuma turma encontrada correspondente aos filtros.
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
