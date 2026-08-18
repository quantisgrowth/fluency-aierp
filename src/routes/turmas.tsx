import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Calendar, Users, Plus, Pencil, Trash2, ArrowLeftRight, X, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { useUser } from "@/modules/user-context";
import { classes as initialClasses, students as initialStudents } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/turmas")({
  head: () => ({
    meta: [
      { title: "Turmas — Lumen ERP" },
      { name: "description", content: "Turmas por proficiência e horários." },
    ],
  }),
  component: TurmasPage,
});

type ClassItem = {
  nome: string;
  nivel: string;
  professor: string;
  alunos: number;
  vagas: number;
  horario: string;
};

function TurmasPage() {
  const { activeRole } = useUser();
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [students, setStudents] = useState(initialStudents);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("todos");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Selected items for edit/delete/transfer
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState("");
  const [formNivel, setFormNivel] = useState("A1");
  const [formProfessor, setFormProfessor] = useState("Marcos Vidal");
  const [formVagas, setFormVagas] = useState(12);
  const [formHorario, setFormHorario] = useState("Ter/Qui 19:00");

  // Transfer fields
  const [transferStudent, setTransferStudent] = useState("");
  const [transferTargetClass, setTransferTargetClass] = useState("");

  const levels = ["todos", "A1", "A2", "B1", "B2", "C1", "C2"];

  // Roles verification
  const canManage = activeRole === "admin" || activeRole === "coordenador";
  const isProfessor = activeRole === "professor";

  // Filter classes based on role and search query
  const filteredClasses = classes.filter((c) => {
    // If Professor, they only see their own classes (e.g. Marcos Vidal or Julia Kern)
    // For simulation, let's mock that the logged in professor is "Julia Kern"
    const matchesRole = !isProfessor || c.professor === "Julia Kern";
    
    const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || 
                          c.professor.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "todos" || c.nivel === levelFilter;
    return matchesRole && matchesSearch && matchesLevel;
  });

  const handleOpenCreate = () => {
    setFormName("");
    setFormNivel("A1");
    setFormProfessor("Marcos Vidal");
    setFormVagas(12);
    setFormHorario("Ter/Qui 19:00");
    setIsCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newClass: ClassItem = {
      nome: formName,
      nivel: formNivel,
      professor: formProfessor,
      alunos: 0,
      vagas: Number(formVagas),
      horario: formHorario,
    };

    setClasses([...classes, newClass]);
    toast.success(`Turma "${formName}" criada com sucesso!`);
    setIsCreateOpen(false);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setSelectedClass(c);
    setFormName(c.nome);
    setFormNivel(c.nivel);
    setFormProfessor(c.professor);
    setFormVagas(c.vagas);
    setFormHorario(c.horario);
    setIsEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !formName) return;

    setClasses(
      classes.map((c) =>
        c.nome === selectedClass.nome
          ? { ...c, nome: formName, nivel: formNivel, professor: formProfessor, vagas: Number(formVagas), horario: formHorario }
          : c
      )
    );
    toast.success(`Turma "${formName}" editada com sucesso!`);
    setIsEditOpen(false);
  };

  const handleOpenDelete = (c: ClassItem) => {
    setSelectedClass(c);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!selectedClass) return;
    setClasses(classes.filter((c) => c.nome !== selectedClass.nome));
    toast.success(`Turma "${selectedClass.nome}" excluída com sucesso!`);
    setIsDeleteOpen(false);
  };

  const handleOpenTransfer = (c: ClassItem) => {
    setSelectedClass(c);
    setTransferStudent(students[0]?.nome || "");
    // Default to the first other class
    const otherClass = classes.find((item) => item.nome !== c.nome);
    setTransferTargetClass(otherClass?.nome || "");
    setIsTransferOpen(true);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !transferStudent || !transferTargetClass) return;

    const studentObj = students.find((s) => s.nome === transferStudent);
    const sourceClassName = selectedClass.nome;

    // Check if target is same as source
    if (sourceClassName === transferTargetClass) {
      toast.error("A turma de destino não pode ser a mesma da origem.");
      return;
    }

    // 1. Subtract 1 student from source class, add 1 to target class in state
    setClasses(
      classes.map((c) => {
        if (c.nome === sourceClassName) {
          return { ...c, alunos: Math.max(0, c.alunos - 1) };
        }
        if (c.nome === transferTargetClass) {
          return { ...c, alunos: Math.min(c.vagas, c.alunos + 1) };
        }
        return c;
      })
    );

    // 2. Update student's class name in students state
    setStudents(
      students.map((s) =>
        s.nome === transferStudent ? { ...s, turma: transferTargetClass } : s
      )
    );

    toast.success(`Aluno "${transferStudent}" transferido com sucesso!`, {
      description: `Origem: ${sourceClassName} ➜ Destino: ${transferTargetClass}`,
    });
    setIsTransferOpen(false);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Pedagógico"
        title="Turmas por Proficiência"
        description="Acompanhe a ocupação, horários e professores responsáveis por cada nível CEFR."
        action={
          canManage && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer animate-in zoom-in duration-300"
            >
              <Plus className="size-4" /> Nova Turma
            </button>
          )
        }
      />

      {/* Role explanation banner */}
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3 text-xs text-primary leading-relaxed items-start">
        <Sparkles className="size-4.5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold uppercase tracking-wider">Cargo Ativo: {activeRole.toUpperCase()}</p>
          {activeRole === "professor" && (
            <p className="mt-1 opacity-90">Visualização restrita às turmas sob responsabilidade de <strong>Julia Kern</strong>. Ações de criação, exclusão e transferência estão trancadas.</p>
          )}
          {activeRole === "operador" && (
            <p className="mt-1 opacity-90">Você tem permissão para visualizar todas as turmas, mas os botões de edição, exclusão e criação estão desabilitados.</p>
          )}
          {(activeRole === "coordenador" || activeRole === "admin") && (
            <p className="mt-1 opacity-90">Controle total ativo. Você pode criar novas turmas, editar configurações, excluir turmas vazias e transferir alunos.</p>
          )}
        </div>
      </div>

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
              <GlassCard key={c.nome} className="p-6 flex flex-col justify-between hover:border-white/10 hover:shadow-lg transition-all duration-300 relative group/card">
                
                {/* Actions overlay for Coordenador/Admin */}
                {canManage && (
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenTransfer(c)}
                      title="Transferir Aluno"
                      className="p-1.5 rounded bg-surface border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <ArrowLeftRight className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      title="Editar Turma"
                      className="p-1.5 rounded bg-surface border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(c)}
                      title="Excluir Turma"
                      className="p-1.5 rounded bg-surface border border-hairline hover:bg-overdue/10 text-muted-foreground hover:text-overdue transition-all cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Top Level badge and name */}
                  <div className="flex items-start justify-between">
                    <span className="rounded-md border border-hairline bg-surface-elevated/80 px-2.5 py-1 text-xs font-bold text-primary tracking-wider uppercase">
                      CEFR {c.nivel}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground pr-16 group-hover/card:pr-24 transition-all">
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
                    <p className="text-[10px] text-right text-overdue font-semibold animate-pulse">Turma Lotada</p>
                  )}
                </div>
              </GlassCard>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center animate-in zoom-in duration-300">
            <GlassCard className="p-8 max-w-md mx-auto text-muted-foreground">
              Nenhuma turma ativa encontrada para o nível ou filtro selecionado.
            </GlassCard>
          </div>
        )}
      </div>

      {/* --- INLINE GLASSMORPHIC MODALS --- */}

      {/* Modal: Criar Turma */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Criar Nova Turma</h3>
              <p className="text-xs text-muted-foreground">Preencha as configurações pedagógicas e horário da turma.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Turma</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Advanced Conversa"
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível CEFR</label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="A1">A1 (Beginner)</option>
                    <option value="A2">A2 (Elementary)</option>
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper-Intermediate)</option>
                    <option value="C1">C1 (Advanced)</option>
                    <option value="C2">C2 (Proficient)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vagas Max.</label>
                  <input
                    type="number"
                    value={formVagas}
                    onChange={(e) => setFormVagas(Number(e.target.value))}
                    min={1}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Professor Responsável</label>
                <select
                  value={formProfessor}
                  onChange={(e) => setFormProfessor(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Marcos Vidal">Marcos Vidal</option>
                  <option value="Julia Kern">Julia Kern</option>
                  <option value="Ana Beatriz">Ana Beatriz</option>
                  <option value="Peter Hall">Peter Hall</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário / Dias</label>
                <input
                  value={formHorario}
                  onChange={(e) => setFormHorario(e.target.value)}
                  placeholder="Ex: Seg/Qua 18:30"
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
              >
                Confirmar Criação
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Modal: Editar Turma */}
      {isEditOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Editar Configurações da Turma</h3>
              <p className="text-xs text-muted-foreground">Altere o professor, vagas ou horário.</p>
            </div>
            
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Turma</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível CEFR</label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vagas Max.</label>
                  <input
                    type="number"
                    value={formVagas}
                    onChange={(e) => setFormVagas(Number(e.target.value))}
                    min={selectedClass.alunos} // Prevent reducing vacancies below active student count
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Professor Responsável</label>
                <select
                  value={formProfessor}
                  onChange={(e) => setFormProfessor(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Marcos Vidal">Marcos Vidal</option>
                  <option value="Julia Kern">Julia Kern</option>
                  <option value="Ana Beatriz">Ana Beatriz</option>
                  <option value="Peter Hall">Peter Hall</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário / Dias</label>
                <input
                  value={formHorario}
                  onChange={(e) => setFormHorario(e.target.value)}
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

      {/* Modal: Excluir Turma */}
      {isDeleteOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm p-6 space-y-6 shadow-2xl relative text-center">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
            
            <div className="space-y-2">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-overdue/10 border border-overdue/20 text-overdue">
                <Trash2 className="size-5" />
              </span>
              <h3 className="text-base font-bold text-foreground">Excluir Turma</h3>
              <p className="text-xs text-muted-foreground">
                Tem certeza que deseja excluir a turma <strong>{selectedClass.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>

            {selectedClass.alunos > 0 ? (
              <div className="rounded-lg border border-overdue/20 bg-overdue/5 p-3 text-[11px] text-overdue leading-relaxed">
                Aviso: Esta turma possui <strong>{selectedClass.alunos}</strong> alunos matriculados. Recomendamos transferir os alunos antes da exclusão.
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-lg border border-hairline py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-overdue py-2 text-xs font-semibold text-destructive-foreground hover:bg-overdue/90 shadow transition-all cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Modal: Transferir Aluno */}
      {isTransferOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsTransferOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Transferência de Aluno</h3>
              <p className="text-xs text-muted-foreground">Selecione o aluno e escolha a turma de destino compatível.</p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] text-primary">
              Turma de Origem: <strong>{selectedClass.nome} (CEFR {selectedClass.nivel})</strong>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selecione o Aluno</label>
                <select
                  value={transferStudent}
                  onChange={(e) => setTransferStudent(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.nome} value={s.nome}>
                      {s.nome} ({s.nivel} - {s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turma de Destino</label>
                <select
                  value={transferTargetClass}
                  onChange={(e) => setTransferTargetClass(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {classes
                    .filter((item) => item.nome !== selectedClass.nome)
                    .map((item) => (
                      <option key={item.nome} value={item.nome}>
                        {item.nome} (CEFR {item.nivel}) - {item.alunos}/{item.vagas} vagas
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
              >
                Confirmar Transferência
              </button>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
