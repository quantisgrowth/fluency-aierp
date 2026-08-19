import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Users, ShieldAlert, CheckCircle2, AlertTriangle, Eye, Pencil, X, Calendar, GraduationCap, Flame, Coins, Trophy, CreditCard, MessageSquare } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { StatusPill } from "@/components/kit/status-pill";
import { students as initialStudents } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/alunos")({
  head: () => ({
    meta: [
      { title: "Alunos — Fluency AI" },
      { name: "description", content: "Cadastro, histórico e engajamento dos alunos da escola." },
    ],
  }),
  component: AlunosPage,
});

type Student = {
  nome: string;
  nivel: string;
  turma: string;
  inicio: string;
  status: string;
};

type AcademicNote = {
  data: string;
  texto: string;
  autor: string;
};

type BillingItem = {
  descricao: string;
  valor: number;
  vencimento: string;
  situacao: "pago" | "aberto" | "atrasado";
};

type StudentDetail = {
  presenca: number;
  tarefas: number;
  streak: number;
  coins: number;
  xp: number;
  liga: string;
  whats: string;
  historico: AcademicNote[];
  financeiro: BillingItem[];
};

// Mock details mapped by student name
const INITIAL_DETAILS: Record<string, StudentDetail> = {
  "Marina Rocha": {
    presenca: 96,
    tarefas: 92,
    streak: 12,
    coins: 340,
    xp: 1850,
    liga: "Ouro",
    whats: "5511999998888",
    historico: [
      { data: "15/08/2026", texto: "Aprovada no módulo B2.1 com média 9.2. Excelente conversação.", autor: "Julia Kern" },
      { data: "03/08/2026", texto: "Completou a maratona de exercícios de vocabulário de business.", autor: "Sistema" },
      { data: "20/07/2026", texto: "Demonstrou excelente participação nos debates de atualidades.", autor: "Marcos Vidal" }
    ],
    financeiro: [
      { descricao: "Mensalidade Agosto", valor: 380, vencimento: "10/08/2026", situacao: "pago" },
      { descricao: "Mensalidade Julho", valor: 380, vencimento: "10/07/2026", situacao: "pago" },
      { descricao: "Material Didático B2", valor: 250, vencimento: "15/06/2026", situacao: "pago" }
    ]
  },
  "Caio Bertolli": {
    presenca: 72,
    tarefas: 58,
    streak: 0,
    coins: 15,
    xp: 220,
    liga: "Bronze",
    whats: "5511988887777",
    historico: [
      { data: "10/08/2026", texto: "Faltou a duas aulas seguidas. Sem contato com a coordenação.", autor: "Ana Beatriz" },
      { data: "28/07/2026", texto: "Dificuldade na entrega das redações do módulo A2.", autor: "Julia Kern" }
    ],
    financeiro: [
      { descricao: "Mensalidade Agosto", valor: 380, vencimento: "10/08/2026", situacao: "atrasado" },
      { descricao: "Mensalidade Julho", valor: 380, vencimento: "10/07/2026", situacao: "pago" }
    ]
  },
  "Helena Prado": {
    presenca: 98,
    tarefas: 96,
    streak: 24,
    coins: 780,
    xp: 3200,
    liga: "Rubi",
    whats: "5511977776666",
    historico: [
      { data: "18/08/2026", texto: "Iniciou o preparatório para o Cambridge C1 com excelente desempenho.", autor: "Peter Hall" },
      { data: "01/08/2026", texto: "Alcançou o topo da Liga Ouro de engajamento extraclasse.", autor: "Sistema" }
    ],
    financeiro: [
      { descricao: "Mensalidade Agosto", valor: 380, vencimento: "10/08/2026", situacao: "pago" },
      { descricao: "Mensalidade Julho", valor: 380, vencimento: "10/07/2026", situacao: "pago" }
    ]
  },
  "Bruno Salles": {
    presenca: 64,
    tarefas: 45,
    streak: 2,
    coins: 50,
    xp: 410,
    liga: "Bronze",
    whats: "5511966665555",
    historico: [
      { data: "12/08/2026", texto: "Aluno relata falta de tempo para fazer as lições em casa.", autor: "Julia Kern" },
      { data: "04/08/2026", texto: "Recomendado plantão de dúvidas para recuperação do conteúdo de gramática.", autor: "Coordenação" }
    ],
    financeiro: [
      { descricao: "Mensalidade Agosto", valor: 380, vencimento: "10/08/2026", situacao: "aberto" },
      { descricao: "Mensalidade Julho", valor: 380, vencimento: "10/07/2026", situacao: "pago" }
    ]
  },
  "Aline Ferraz": {
    presenca: 92,
    tarefas: 88,
    streak: 8,
    coins: 210,
    xp: 1150,
    liga: "Prata",
    whats: "5511955554444",
    historico: [
      { data: "14/08/2026", texto: "Excelente evolução na fluência e diminuição do sotaque.", autor: "Marcos Vidal" },
      { data: "22/07/2026", texto: "Completou todas as tarefas da trilha regular com sucesso.", autor: "Sistema" }
    ],
    financeiro: [
      { descricao: "Mensalidade Agosto", valor: 380, vencimento: "10/08/2026", situacao: "pago" },
      { descricao: "Mensalidade Julho", valor: 380, vencimento: "10/07/2026", situacao: "pago" }
    ]
  },
  "Rafael Lima": {
    presenca: 70,
    tarefas: 60,
    streak: 3,
    coins: 90,
    xp: 680,
    liga: "Bronze",
    whats: "5511944443333",
    historico: [
      { data: "16/08/2026", texto: "Perda de rendimento observada nas últimas atividades de listening.", autor: "Peter Hall" },
      { data: "29/07/2026", texto: "Notificado sobre risco de reprovação por faltas acumuladas.", autor: "Coordenação" }
    ],
    financeiro: [
      { descricao: "Mensalidade Agosto", valor: 380, vencimento: "10/08/2026", situacao: "aberto" },
      { descricao: "Mensalidade Julho", valor: 380, vencimento: "10/07/2026", situacao: "pago" }
    ]
  }
};

function AlunosPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [studentDetails, setStudentDetails] = useState<Record<string, StudentDetail>>(INITIAL_DETAILS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Drawer / Modals states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Drawer Active Tab
  const [activeTab, setActiveTab] = useState<"geral" | "pedagogico" | "game" | "financeiro">("geral");

  // Edit form states
  const [formNome, setFormNome] = useState("");
  const [formNivel, setFormNivel] = useState("A1");
  const [formTurma, setFormTurma] = useState("");
  const [formStatus, setFormStatus] = useState("Ativo");

  // New Note state
  const [newNoteText, setNewNoteText] = useState("");

  // Statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === "Ativo").length;
  const overdueStudents = students.filter(s => s.status === "Inadimplente").length;
  const riskStudents = students.filter(s => s.status === "Em risco").length;

  // Collective Metrics
  const avgAttendance = Math.round(
    Object.values(studentDetails).reduce((sum, d) => sum + d.presenca, 0) / Object.keys(studentDetails).length
  );
  const totalCoinsGenerated = Object.values(studentDetails).reduce((sum, d) => sum + d.coins, 0);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.nome.toLowerCase().includes(search.toLowerCase()) || 
                          s.turma.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "todos" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDrawer = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab("geral");
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormNome(student.nome);
    setFormNivel(student.nivel);
    setFormTurma(student.turma);
    setFormStatus(student.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !formNome) return;

    // Update students list state
    setStudents(
      students.map((s) =>
        s.nome === selectedStudent.nome
          ? { ...s, nome: formNome, nivel: formNivel, turma: formTurma, status: formStatus }
          : s
      )
    );

    // If name changed, copy details mapping to the new name key
    if (formNome !== selectedStudent.nome && studentDetails[selectedStudent.nome]) {
      const detailsCopy = { ...studentDetails };
      detailsCopy[formNome] = detailsCopy[selectedStudent.nome]!;
      delete detailsCopy[selectedStudent.nome];
      setStudentDetails(detailsCopy);
    }

    toast.success(`Ficha de ${formNome} atualizada com sucesso!`);
    setIsEditOpen(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newNoteText.trim()) return;

    const details = studentDetails[selectedStudent.nome];
    if (!details) return;

    const newNote: AcademicNote = {
      data: new Date().toLocaleDateString("pt-BR"),
      texto: newNoteText,
      autor: "Coordenador",
    };

    setStudentDetails({
      ...studentDetails,
      [selectedStudent.nome]: {
        ...details,
        historico: [newNote, ...details.historico],
      },
    });

    setNewNoteText("");
    toast.success("Observação pedagógica registrada!");
  };

  const selectedDetails = selectedStudent ? studentDetails[selectedStudent.nome] : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Pedagógico"
        title="Gestão de Alunos"
        description="Visualize indicadores de frequência, engajamento gamificado, histórico de observações e faturas financeiras de cada estudante."
      />

      {/* Mini KPIs & Collective Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Alunos</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{totalStudents}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Presença Geral Média: <strong className="text-primary">{avgAttendance}%</strong></p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20">
            <Users className="size-5 text-primary" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alunos Ativos</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{activeStudents}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Moedas Geradas: <strong className="text-paid">{totalCoinsGenerated} LC</strong></p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-paid/10 border border-paid/20">
            <CheckCircle2 className="size-5 text-paid" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Risco de Evasão</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{riskStudents}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Foco de suporte pedagógico</p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-due/10 border border-due/20">
            <AlertTriangle className="size-5 text-due" />
          </span>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inadimplentes</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{overdueStudents}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Avisos automáticos ativos</p>
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
                <th className="px-6 py-4 text-right">Ações</th>
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
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => handleOpenDrawer(s)}
                        title="Ver Ficha Acadêmica"
                        className="p-1.5 rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Editar Informações"
                        className="p-1.5 rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum aluno encontrado correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* --- INLINE GLASSMORPHIC MODAL: EDIT STUDENT --- */}
      {isEditOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl relative text-foreground">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Editar Dados do Aluno</h3>
              <p className="text-xs text-muted-foreground">Modifique o nível, turma ou situação operacional.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo</label>
                <input
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proficiência (CEFR)</label>
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Situação</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em risco">Em risco</option>
                    <option value="Inadimplente">Inadimplente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turma Principal</label>
                <input
                  value={formTurma}
                  onChange={(e) => setFormTurma(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
              >
                Confirmar Alteração
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* --- INLINE GLASSMORPHIC DRAWER: STUDENT PROFILE DETAILS & HISTORY --- */}
      {isDrawerOpen && selectedStudent && selectedDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-full border-l border-hairline bg-popover text-foreground p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 relative">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {/* Profile Drawer Header */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{selectedStudent.turma}</span>
                <h3 className="text-xl font-bold text-foreground mt-1">{selectedStudent.nome}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Aluno cadastrado desde {selectedStudent.inicio}</p>
              </div>

              {/* Badges/Quick actions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-hairline bg-surface px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  Nível {selectedStudent.nivel}
                </span>
                <StatusPill tone={selectedStudent.status === "Ativo" ? "paid" : selectedStudent.status === "Inadimplente" ? "overdue" : "due"}>
                  {selectedStudent.status}
                </StatusPill>
                <a
                  href={`https://wa.me/${selectedDetails.whats}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-paid/20 bg-paid/10 px-3 py-1 text-xs font-semibold text-paid hover:bg-paid/20 transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="size-3.5" /> Enviar WhatsApp
                </a>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-hairline">
                {(["geral", "pedagogico", "game", "financeiro"] as const).map((tab) => {
                  const tabLabels = {
                    geral: "Indicadores",
                    pedagogico: "Histórico & Notas",
                    game: "Gamificação",
                    financeiro: "Financeiro",
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === tab
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tabLabels[tab]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Drawer Body */}
            <div className="flex-1 py-6">
              
              {/* Tab 1: Overview Indicators */}
              {activeTab === "geral" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    
                    {/* Attendance indicator */}
                    <GlassCard className="p-4 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Frequência Geral</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">{selectedDetails.presenca}%</span>
                        <span className={`text-[10px] font-semibold ${selectedDetails.presenca >= 85 ? "text-paid" : "text-overdue"}`}>
                          {selectedDetails.presenca >= 85 ? "Excelente" : "Abaixo da meta"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${selectedDetails.presenca >= 85 ? "bg-paid" : "bg-overdue"}`}
                          style={{ width: `${selectedDetails.presenca}%` }}
                        />
                      </div>
                    </GlassCard>

                    {/* Homework completion indicator */}
                    <GlassCard className="p-4 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Entrega de Tarefas</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">{selectedDetails.tarefas}%</span>
                        <span className={`text-[10px] font-semibold ${selectedDetails.tarefas >= 80 ? "text-paid" : "text-due"}`}>
                          {selectedDetails.tarefas >= 80 ? "Em dia" : "Pendente"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${selectedDetails.tarefas >= 80 ? "bg-paid" : "bg-due"}`}
                          style={{ width: `${selectedDetails.tarefas}%` }}
                        />
                      </div>
                    </GlassCard>

                  </div>

                  {/* Evading Risk detail box */}
                  <GlassCard className="p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avaliação de Risco de Evasão</p>
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-full ${
                        selectedStudent.status === "Ativo" ? "bg-paid" : selectedStudent.status === "Inadimplente" ? "bg-overdue" : "bg-due"
                      }`} />
                      <p className="text-sm font-semibold text-foreground">
                        {selectedStudent.status === "Ativo"
                          ? "Baixo Risco — Aluno regular e engajado."
                          : selectedStudent.status === "Inadimplente"
                            ? "Alto Risco — Bloqueio financeiro detectado."
                            : "Médio Risco — Queda de participação observada."}
                      </p>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Tab 2: Pedagogical notes and history */}
              {activeTab === "pedagogico" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Write pedagogical note form */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Inserir Observação Pedagógica</label>
                    <div className="flex gap-2">
                      <input
                        placeholder="Ex: Teve excelente progresso nas tarefas escritas..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="h-10 flex-1 rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                        required
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer"
                      >
                        Salvar Nota
                      </button>
                    </div>
                  </form>

                  {/* Pedagogical notes Timeline */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico Acadêmico Recente</p>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                      {selectedDetails.historico.map((h, i) => (
                        <div key={i} className="p-3.5 rounded-lg border border-hairline bg-surface-elevated/40 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-semibold flex items-center gap-1"><Calendar className="size-3" /> {h.data}</span>
                            <span>Por: {h.autor}</span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed font-medium">{h.texto}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 3: Gamification Stats */}
              {activeTab === "game" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    
                    {/* Streaks card */}
                    <GlassCard className="p-4 flex items-center gap-4">
                      <span className="grid size-12 place-items-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                        <Flame className="size-6 fill-orange-400" />
                      </span>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Streak Atual</p>
                        <p className="text-2xl font-bold text-foreground">{selectedDetails.streak} dias</p>
                      </div>
                    </GlassCard>

                    {/* Coins balance card */}
                    <GlassCard className="p-4 flex items-center gap-4">
                      <span className="grid size-12 place-items-center rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                        <Coins className="size-6 fill-yellow-400" />
                      </span>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Fluency Coins</p>
                        <p className="text-2xl font-bold text-foreground">{selectedDetails.coins} LC</p>
                      </div>
                    </GlassCard>

                    {/* Experience points card */}
                    <GlassCard className="p-4 flex items-center gap-4">
                      <span className="grid size-12 place-items-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <GraduationCap className="size-6" />
                      </span>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Pontuação de XP</p>
                        <p className="text-2xl font-bold text-foreground">{selectedDetails.xp} XP</p>
                      </div>
                    </GlassCard>

                    {/* Competition Tier card */}
                    <GlassCard className="p-4 flex items-center gap-4">
                      <span className="grid size-12 place-items-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Trophy className="size-6" />
                      </span>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Liga Competitiva</p>
                        <p className="text-2xl font-bold text-foreground">Liga {selectedDetails.liga}</p>
                      </div>
                    </GlassCard>

                  </div>
                </div>
              )}

              {/* Tab 4: Billing history details */}
              {activeTab === "financeiro" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faturas e Cobranças</p>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {selectedDetails.financeiro.map((f, i) => (
                      <div key={i} className="p-3.5 rounded-lg border border-hairline bg-surface-elevated/40 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">{f.descricao}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Vencimento: {f.vencimento}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="text-xs font-bold text-foreground">R$ {f.valor},00</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            f.situacao === "pago"
                              ? "bg-paid/10 border-paid/20 text-paid"
                              : f.situacao === "atrasado"
                                ? "bg-overdue/10 border-overdue/20 text-overdue"
                                : "bg-due/10 border-due/20 text-due"
                          }`}>
                            {f.situacao.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer footer controls */}
            <div className="pt-4 border-t border-hairline text-right">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
