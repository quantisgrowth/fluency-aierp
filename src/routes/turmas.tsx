import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Calendar, Users, Plus, Pencil, Trash2, ArrowLeftRight, X, Sparkles, Clock, AlertTriangle, CalendarRange, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { useUser } from "@/modules/user-context";
import { classes as initialClasses, students as initialStudents } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/turmas")({
  head: () => ({
    meta: [
      { title: "Turmas — Fluency AI" },
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
  diasSelecionados?: string[];
  horaSelecionada?: string;
};

type Lesson = {
  id: string;
  aula: number;
  tema: string;
  descricao: string;
  status: "Concluída" | "Em Andamento" | "Pendente";
};

const DEFAULT_CRONOGRAMAS: Record<string, Lesson[]> = {
  "Kids Playgroup": [
    { id: "kp-1", aula: 1, tema: "Welcome & Color Songs", descricao: "Apresentacao e introducao de cores primarias com musica.", status: "Concluída" },
    { id: "kp-2", aula: 2, tema: "Vocabulary: Farm Animals", descricao: "Aprendizado dos nomes de animais de fazenda em ingles.", status: "Concluída" },
    { id: "kp-3", aula: 3, tema: "Singing & Action Verbs", descricao: "Musica interativa e acoes (jump, run, clap).", status: "Em Andamento" },
    { id: "kp-4", aula: 4, tema: "Vocabulary: Fruit & Foods", descricao: "Introducao de nomes de frutas comuns e vocabulario de comida.", status: "Pendente" },
    { id: "kp-5", aula: 5, tema: "Review & Games", descricao: "Atividades ludicas de revisao de cores e animais.", status: "Pendente" },
  ],
  "Regular Noite": [
    { id: "rn-1", aula: 1, tema: "Simple Past vs Past Continuous", descricao: "Revisao e exercicios de gramatica com tempos verbais passados.", status: "Concluída" },
    { id: "rn-2", aula: 2, tema: "Travel Vocabulary & Bookings", descricao: "Como fazer reservas e vocabulario util para viagens.", status: "Concluída" },
    { id: "rn-3", aula: 3, tema: "Conversational Drills", descricao: "Simulacoes praticas de dialogo em aeroportos e hoteis.", status: "Em Andamento" },
    { id: "rn-4", aula: 4, tema: "Reading & Pronunciation", descricao: "Leitura de textos e foco em pronuncia e entonacao.", status: "Pendente" },
  ],
  "Business English": [
    { id: "be-1", aula: 1, tema: "Greetings & Self Introduction", descricao: "Como se apresentar profissionalmente em ingles.", status: "Concluída" },
    { id: "be-2", aula: 2, tema: "Writing Professional Emails", descricao: "Estruturas, formalidades e expressoes de e-mail comercial.", status: "Concluída" },
    { id: "be-3", aula: 3, tema: "Meeting Phrasal Verbs", descricao: "Principais phrasal verbs usados em reunioes.", status: "Em Andamento" },
    { id: "be-4", aula: 4, tema: "Negotiation Tactics", descricao: "Vocabulario de negociacao e expressao de opinioes.", status: "Pendente" },
  ],
  "Conversation": [
    { id: "c-1", aula: 1, tema: "Welcome & Diagnostic Speaking", descricao: "Apresentacao e avaliacao inicial de fluencia oral.", status: "Concluída" },
    { id: "c-2", aula: 2, tema: "Debating the Future of Work - AI Impact", descricao: "Debate estruturado sobre o impacto da Inteligencia Artificial no mercado.", status: "Concluída" },
    { id: "c-3", aula: 3, tema: "Expressing Agreement & Disagreement", descricao: "Expressoes e conectores para concordar e discordar educadamente.", status: "Em Andamento" },
    { id: "c-4", aula: 4, tema: "Idiomatic Expressions for Negotiation", descricao: "Expressoes idiomaticas nativas usadas em acordos.", status: "Pendente" },
    { id: "c-5", aula: 5, tema: "Final Presentation - Persuasive Pitch", descricao: "Apresentacoes finais e feedbacks individuais detalhados.", status: "Pendente" },
  ]
};

const CALENDAR_DAYS = [
  { key: "Seg", label: "Segunda" },
  { key: "Ter", label: "Terça" },
  { key: "Qua", label: "Quarta" },
  { key: "Qui", label: "Quinta" },
  { key: "Sex", label: "Sexta" },
  { key: "Sáb", label: "Sábado" }
];

const CALENDAR_TIMES = [
  "07:30", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:30", "19:00", "20:00"
];

const parseClassHorario = (c: any) => {
  let diasSelecionados = c.diasSelecionados || [];
  let horaSelecionada = c.horaSelecionada || "";
  
  if (diasSelecionados.length === 0 || !horaSelecionada) {
    const parts = c.horario.split(" ");
    if (parts.length === 2) {
      const daysStr = parts[0];
      horaSelecionada = parts[1];
      
      if (daysStr.includes("/")) {
        diasSelecionados = daysStr.split("/");
      } else {
        diasSelecionados = [daysStr];
      }
    } else {
      diasSelecionados = ["Seg"];
      horaSelecionada = "19:00";
    }
  }
  return {
    ...c,
    diasSelecionados,
    horaSelecionada
  };
};

function TurmasPage() {
  const { activeRole } = useUser();
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:classes:list");
      if (stored) {
        return JSON.parse(stored).map((c: any) => parseClassHorario(c));
      }
    } catch {}
    
    return initialClasses.map((c: any) => parseClassHorario(c));
  });

  const [students, setStudents] = useState(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:list");
      return stored ? JSON.parse(stored) : initialStudents;
    } catch {
      return initialStudents;
    }
  });

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("todos");
  
  const [activePageTab, setActivePageTab] = useState<"lista" | "calendario" | "cronograma">("lista");
  const [calendarViewMode, setCalendarViewMode] = useState<"semanal" | "mensal">("semanal");

  // Cronograma / Trilha states
  const [selectedCronogramaClass, setSelectedCronogramaClass] = useState<string>("Conversation");
  const [cronogramas, setCronogramas] = useState<Record<string, Lesson[]>>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:classes:cronogramas");
      return stored ? JSON.parse(stored) : DEFAULT_CRONOGRAMAS;
    } catch {
      return DEFAULT_CRONOGRAMAS;
    }
  });

  // Sync cronogramas
  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:classes:cronogramas", JSON.stringify(cronogramas));
    } catch {}
  }, [cronogramas]);

  // Download Model CSV
  const handleDownloadModelCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + "Aula;Tema;Descricao\n"
      + "1;Welcome & Introduction;Primeira aula de nivelamento e apresentacao\n"
      + "2;Present Continuous Drills;Exercicios praticos de conversacao sobre atividades do dia a dia\n"
      + "3;Business Vocabulary;Vocabulario de reunioes e apresentacao de projetos\n"
      + "4;Mock Dialogues;Pratica guiada com simulacao de chamadas e mensagens\n"
      + "5;Review & Evaluation;Feedback pedagogico de conversacao\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modelo_cronograma_fluency.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Modelo CSV baixado com sucesso!");
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        const parsedLessons: Lesson[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]?.trim();
          if (!line) continue;

          const cols = line.includes(";") ? line.split(";") : line.split(",");
          const aulaNum = Number(cols[0]?.trim()) || i;
          const temaStr = cols[1]?.trim() || "Aula sem tema";
          const descStr = cols[2]?.trim() || "";

          parsedLessons.push({
            id: `lesson-csv-${Date.now()}-${i}`,
            aula: aulaNum,
            tema: temaStr,
            descricao: descStr,
            status: i === 1 ? "Em Andamento" : "Pendente"
          });
        }

        if (parsedLessons.length === 0) {
          toast.error("Nenhuma linha válida encontrada no CSV.");
          return;
        }

        setCronogramas((prev) => ({
          ...prev,
          [selectedCronogramaClass]: parsedLessons
        }));
        toast.success(`Importadas ${parsedLessons.length} aulas na trilha da turma ${selectedCronogramaClass}!`);
      } catch (err) {
        console.error(err);
        toast.error("Falha ao ler o arquivo CSV. Verifique a formatação.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Add Lesson
  const handleAddLesson = () => {
    const lessons = cronogramas[selectedCronogramaClass] || [];
    const nextAulaNum = lessons.length > 0 ? Math.max(...lessons.map(l => l.aula)) + 1 : 1;
    
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      aula: nextAulaNum,
      tema: `Nova Aula Pedagógica #${nextAulaNum}`,
      descricao: "Clique nos controles ao lado para editar o tema e a descrição desta aula.",
      status: nextAulaNum === 1 ? "Em Andamento" : "Pendente"
    };

    setCronogramas((prev) => ({
      ...prev,
      [selectedCronogramaClass]: [...lessons, newLesson]
    }));
    toast.success("Nova aula adicionada no cronograma!");
  };

  // Toggle Lesson Status
  const handleToggleLessonStatus = (lessonId: string) => {
    const lessons = cronogramas[selectedCronogramaClass] || [];
    const updated = lessons.map((l) => {
      if (l.id === lessonId) {
        let nextStatus: "Concluída" | "Em Andamento" | "Pendente" = "Pendente";
        if (l.status === "Pendente") nextStatus = "Em Andamento";
        else if (l.status === "Em Andamento") nextStatus = "Concluída";
        else if (l.status === "Concluída") nextStatus = "Pendente";
        return { ...l, status: nextStatus };
      }
      return l;
    });

    setCronogramas((prev) => ({
      ...prev,
      [selectedCronogramaClass]: updated
    }));
    toast.success("Status da aula atualizado!");
  };

  // Edit Lesson Prompt
  const handleEditLessonPrompt = (lesson: Lesson) => {
    const newTema = prompt("Insira o tema da aula:", lesson.tema);
    if (newTema === null) return;
    
    const newDesc = prompt("Insira a descrição da aula:", lesson.descricao);
    if (newDesc === null) return;

    const lessons = cronogramas[selectedCronogramaClass] || [];
    const updated = lessons.map((l) => {
      if (l.id === lesson.id) {
        return { ...l, tema: newTema || l.tema, descricao: newDesc };
      }
      return l;
    });

    setCronogramas((prev) => ({
      ...prev,
      [selectedCronogramaClass]: updated
    }));
    toast.success("Aula atualizada com sucesso!");
  };

  // Delete Lesson
  const handleDeleteLesson = (lessonId: string) => {
    const lessons = cronogramas[selectedCronogramaClass] || [];
    const filtered = lessons.filter(l => l.id !== lessonId);
    const rescaled = filtered.map((l, idx) => ({
      ...l,
      aula: idx + 1
    }));

    setCronogramas((prev) => ({
      ...prev,
      [selectedCronogramaClass]: rescaled
    }));
    toast.success("Aula removida da trilha.");
  };

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
  const [formHorario, setFormHorario] = useState("Seg/Qua 19:00");
  const [formDias, setFormDias] = useState<string[]>(["Seg", "Qua"]);
  const [formHora, setFormHora] = useState("19:00");

  // Transfer fields
  const [transferStudent, setTransferStudent] = useState("");
  const [transferTargetClass, setTransferTargetClass] = useState("");

  const levels = ["todos", "A1", "A2", "B1", "B2", "C1", "C2"];

  // Roles verification
  const canManage = activeRole === "admin" || activeRole === "coordenador";
  const isProfessor = activeRole === "professor";

  // Sync classes to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:classes:list", JSON.stringify(classes));
    } catch {}
  }, [classes]);

  // Sync state changes across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedClasses = window.localStorage.getItem("fluency-ai:classes:list");
        if (storedClasses) {
          setClasses(JSON.parse(storedClasses).map((c: any) => parseClassHorario(c)));
        }
        const storedStudents = window.localStorage.getItem("fluency-ai:students:list");
        if (storedStudents) {
          setStudents(JSON.parse(storedStudents));
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Filter classes based on role and search query
  const filteredClasses = classes.filter((c) => {
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
    setFormHorario("Seg/Qua 19:00");
    setFormDias(["Seg", "Qua"]);
    setFormHora("19:00");
    setIsCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const daysPart = formDias.join("/");
    const combinedHorario = `${daysPart} ${formHora}`;

    const newClass: ClassItem = {
      nome: formName,
      nivel: formNivel,
      professor: formProfessor,
      alunos: 0,
      vagas: Number(formVagas),
      horario: combinedHorario,
      diasSelecionados: formDias,
      horaSelecionada: formHora,
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
    setFormDias(c.diasSelecionados || ["Seg", "Qua"]);
    setFormHora(c.horaSelecionada || "19:00");
    setIsEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !formName) return;

    const daysPart = formDias.join("/");
    const combinedHorario = `${daysPart} ${formHora}`;

    setClasses(
      classes.map((c) =>
        c.nome === selectedClass.nome
          ? { 
              ...c, 
              nome: formName, 
              nivel: formNivel, 
              professor: formProfessor, 
              vagas: Number(formVagas), 
              horario: combinedHorario,
              diasSelecionados: formDias,
              horaSelecionada: formHora
            }
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
    const otherClass = classes.find((item) => item.nome !== c.nome);
    setTransferTargetClass(otherClass?.nome || "");
    setIsTransferOpen(true);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !transferStudent || !transferTargetClass) return;

    const sourceClassName = selectedClass.nome;

    if (sourceClassName === transferTargetClass) {
      toast.error("A turma de destino não pode ser a mesma da origem.");
      return;
    }

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

    setStudents(
      students.map((s) =>
        s.nome === transferStudent ? { ...s, turma: transferTargetClass } : s
      )
    );

    try {
      const storedDetails = window.localStorage.getItem("fluency-ai:students:details");
      if (storedDetails) {
        const parsed = JSON.parse(storedDetails);
        if (parsed[transferStudent]) {
          parsed[transferStudent].turma = transferTargetClass;
          window.localStorage.setItem("fluency-ai:students:details", JSON.stringify(parsed));
        }
      }
    } catch {}

    toast.success(`Aluno "${transferStudent}" transferido com sucesso!`, {
      description: `Origem: ${sourceClassName} ➜ Destino: ${transferTargetClass}`,
    });
    setIsTransferOpen(false);
  };

  // Occupancy metrics calculations
  const totalStudentsInClasses = classes.reduce((sum, c) => sum + c.alunos, 0);
  const totalVacancies = classes.reduce((sum, c) => sum + c.vagas, 0);
  const vacancyOccupancyRate = totalVacancies > 0 ? Math.round((totalStudentsInClasses / totalVacancies) * 100) : 0;

  // Time slot occupancy calculations
  let occupiedSlotsCount = 0;
  CALENDAR_DAYS.forEach((d) => {
    CALENDAR_TIMES.forEach((t) => {
      const classesInSlot = classes.filter((c) => {
        const matchesDay = c.diasSelecionados?.includes(d.key);
        const matchesTime = c.horaSelecionada === t;
        return matchesDay && matchesTime;
      });
      if (classesInSlot.length > 0) {
        occupiedSlotsCount++;
      }
    });
  });
  const totalPossibleSlots = CALENDAR_DAYS.length * CALENDAR_TIMES.length; // 6 * 10 = 60
  const slotOccupancyRate = Math.round((occupiedSlotsCount / totalPossibleSlots) * 100);

  const getClassesForSlot = (dayKey: string, time: string) => {
    return filteredClasses.filter((c) => {
      const matchesDay = c.diasSelecionados?.includes(dayKey);
      const matchesTime = c.horaSelecionada === time;
      return matchesDay && matchesTime;
    });
  };

  const handleCellClick = (dayKey: string, time: string) => {
    if (!canManage) return;
    setFormName("");
    setFormNivel("A1");
    setFormProfessor("Marcos Vidal");
    setFormVagas(12);
    setFormDias([dayKey]);
    setFormHora(time);
    setIsCreateOpen(true);
  };

  const generateMonthlyDays = () => {
    const days = [];
    // 6 empty days for the offset of August 2026 starting on a Saturday
    for (let i = 0; i < 6; i++) {
      days.push(null);
    }
    for (let d = 1; d <= 31; d++) {
      days.push(d);
    }
    return days;
  };

  const getClassesForDay = (dayNum: number) => {
    const date = new Date(2026, 7, dayNum);
    const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    const dayKeys = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayKey = dayKeys[dayIndex];
    return filteredClasses.filter((c) => c.diasSelecionados?.includes(dayKey));
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

      {/* Tab Switcher: Lista vs Agenda & Calendário vs Cronograma */}
      <div className="flex border-b border-hairline gap-8 pb-0.5">
        <button
          onClick={() => setActivePageTab("lista")}
          className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 ${
            activePageTab === "lista"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-4" /> Lista de Turmas
        </button>
        <button
          onClick={() => setActivePageTab("calendario")}
          className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 ${
            activePageTab === "calendario"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarRange className="size-4" /> Agenda & Calendário
        </button>
        <button
          onClick={() => setActivePageTab("cronograma")}
          className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 ${
            activePageTab === "cronograma"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="size-4" /> Trilha de Aprendizado / Cronograma
        </button>
      </div>

      {activePageTab === "lista" && (
        <>
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all uppercase cursor-pointer border-0 ${
                    levelFilter === lvl
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground bg-transparent hover:bg-accent hover:text-foreground"
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
        </>
      )}

      {activePageTab === "calendario" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Occupancy KPI Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard className="p-6 flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Ocupação de Horários</p>
                <p className="text-2xl font-bold text-foreground">{occupiedSlotsCount} / {totalPossibleSlots} Horários</p>
                <p className="text-xs text-muted-foreground">Taxa de preenchimento dos horários da grade: <span className="font-semibold text-primary">{slotOccupancyRate}%</span></p>
              </div>
              <div className="relative size-16">
                {/* Circular indicator representation */}
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/5"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary transition-all duration-500"
                    strokeWidth="3.5"
                    strokeDasharray={`${slotOccupancyRate}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                  {slotOccupancyRate}%
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Preenchimento de Vagas</p>
                <p className="text-2xl font-bold text-foreground">{totalStudentsInClasses} / {totalVacancies} Alunos</p>
                <p className="text-xs text-muted-foreground">Ocupação real de vagas físicas: <span className="font-semibold text-primary">{vacancyOccupancyRate}%</span></p>
              </div>
              <div className="relative size-16">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/5"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary transition-all duration-500"
                    strokeWidth="3.5"
                    strokeDasharray={`${vacancyOccupancyRate}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                  {vacancyOccupancyRate}%
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Calendar Header View Mode Toggles */}
          <GlassCard className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="size-4.5 text-primary" />
              <span className="text-xs font-bold text-foreground">Agenda de Alocações</span>
            </div>
            
            <div className="flex border border-hairline rounded-lg overflow-hidden bg-surface/40 p-0.5">
              <button
                onClick={() => setCalendarViewMode("semanal")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border-0 rounded-md ${
                  calendarViewMode === "semanal"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground bg-transparent hover:text-foreground"
                }`}
              >
                Visão Semanal
              </button>
              <button
                onClick={() => setCalendarViewMode("mensal")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border-0 rounded-md ${
                  calendarViewMode === "mensal"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground bg-transparent hover:text-foreground"
                }`}
              >
                Visão Mensal
              </button>
            </div>
          </GlassCard>

          {calendarViewMode === "semanal" ? (
            /* Weekly View */
            <div className="overflow-x-auto rounded-xl border border-hairline bg-surface/20 backdrop-blur-md">
              <table className="w-full border-collapse text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-hairline bg-surface/50">
                    <th className="p-3 text-xs font-semibold text-muted-foreground w-24">Horário</th>
                    {CALENDAR_DAYS.map((d) => (
                      <th key={d.key} className="p-3 text-xs font-semibold text-muted-foreground text-center w-40">{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {CALENDAR_TIMES.map((time) => (
                    <tr key={time} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-3 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 h-20">
                        <Clock className="size-3.5" /> {time}
                      </td>
                      {CALENDAR_DAYS.map((day) => {
                        const slotClasses = getClassesForSlot(day.key, time);
                        const hasClasses = slotClasses.length > 0;
                        const hasConflict = slotClasses.length > 1;

                        return (
                          <td
                            key={day.key}
                            onClick={() => !hasClasses && handleCellClick(day.key, time)}
                            className={`p-2 border-l border-hairline h-20 align-middle relative transition-all ${
                              !hasClasses && canManage ? "cursor-pointer hover:bg-primary/5" : ""
                            }`}
                          >
                            {hasClasses ? (
                              <div className="space-y-1">
                                {slotClasses.map((c) => {
                                  const isFull = c.alunos >= c.vagas;
                                  let levelColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                                  if (c.nivel.startsWith("B")) {
                                    levelColor = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                                  } else if (c.nivel.startsWith("C")) {
                                    levelColor = "bg-purple-500/10 border-purple-500/20 text-purple-400";
                                  }

                                  return (
                                    <div
                                      key={c.nome}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEdit(c);
                                      }}
                                      className={`rounded-lg border p-2 text-[10px] leading-snug cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ${levelColor}`}
                                    >
                                      <div className="flex justify-between items-start font-bold">
                                        <span className="truncate">{c.nome}</span>
                                        <span className="uppercase text-[8px] font-extrabold px-1 rounded bg-white/10 shrink-0">CEFR {c.nivel}</span>
                                      </div>
                                      <div className="flex justify-between items-center mt-1 text-[9px] opacity-90">
                                        <span>Prof. {c.professor.split(" ")[0]}</span>
                                        <span className={isFull ? "text-rose-400 font-bold" : "opacity-80"}>
                                          {c.alunos}/{c.vagas}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                                {hasConflict && (
                                  <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-rose-500 text-white px-1 py-0.5 text-[8px] font-extrabold shadow animate-bounce">
                                    <AlertTriangle className="size-2.5" /> Conflito!
                                  </div>
                                )}
                              </div>
                            ) : (
                              canManage && (
                                <span className="absolute inset-0 grid place-items-center opacity-0 hover:opacity-100 transition-opacity text-[10px] font-bold text-primary">
                                  + Agendar
                                </span>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Monthly View */
            <div className="rounded-xl border border-hairline bg-surface/20 backdrop-blur-md p-4 space-y-4">
              <div className="text-center font-bold text-sm text-foreground uppercase tracking-wider pb-2 border-b border-hairline">
                Agosto 2026
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground pb-2">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateMonthlyDays().map((dayNum, idx) => {
                  if (dayNum === null) {
                    return (
                      <div key={`empty-${idx}`} className="h-28 rounded-lg bg-surface/5 border border-transparent opacity-30" />
                    );
                  }

                  const dayClasses = getClassesForDay(dayNum);
                  const isToday = dayNum === 19; // Aug 19, 2026 is today in mock

                  return (
                    <div
                      key={dayNum}
                      className={`h-28 rounded-lg border p-2 flex flex-col justify-between transition-all bg-surface/30 hover:bg-surface-elevated/40 ${
                        isToday ? "border-primary bg-primary/5 shadow-inner" : "border-hairline"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-extrabold ${isToday ? "text-primary" : "text-foreground"}`}>
                          {dayNum}
                        </span>
                        {isToday && (
                          <span className="rounded bg-primary/20 text-primary text-[8px] font-extrabold px-1 py-0.5">Hoje</span>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none">
                        {dayClasses.map((c) => {
                          let badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/10";
                          if (c.nivel.startsWith("B")) badgeColor = "bg-blue-500/20 text-blue-400 border-blue-500/10";
                          if (c.nivel.startsWith("C")) badgeColor = "bg-purple-500/20 text-purple-400 border-purple-500/10";

                          return (
                            <div
                              key={c.nome}
                              onClick={() => handleOpenEdit(c)}
                              className={`rounded px-1.5 py-0.5 border text-[8px] leading-tight truncate font-medium cursor-pointer transition-all hover:scale-[1.01] ${badgeColor}`}
                              title={`${c.nome} (${c.horario})`}
                            >
                              {c.horaSelecionada} {c.nome}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CRONOGRAMA / LEARNING TRAIL PANEL --- */}
      {activePageTab === "cronograma" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            
            {/* Left Column: Seletor de Turma & Importador */}
            <div className="lg:col-span-4 space-y-6">
              <GlassCard className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Configurar Turma</h4>
                  <p className="text-[10px] text-muted-foreground">Selecione a turma para carregar e gerenciar a trilha de aulas.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Turma Selecionada</label>
                  <select
                    value={selectedCronogramaClass}
                    onChange={(e) => setSelectedCronogramaClass(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.nome} value={c.nome}>
                        {c.nome} (CEFR {c.nivel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-hairline pt-4 space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Importar Trilha de Aprendizado</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Suba um arquivo CSV editado pelos professores para estruturar o cronograma automaticamente.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadModelCSV}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface/50 py-2 text-[10px] font-bold text-foreground hover:bg-accent cursor-pointer transition-all border-hairline"
                    >
                      Baixar Modelo CSV
                    </button>
                    <label className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-[10px] font-bold text-primary-foreground shadow hover:bg-primary/95 cursor-pointer transition-all border-0">
                      Importar CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </GlassCard>

              {/* Progress Summary Card */}
              <GlassCard className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Progresso do Módulo</h4>
                  <p className="text-[10px] text-muted-foreground">Progresso consolidado das aulas ministradas na trilha pedagógica.</p>
                </div>

                {(() => {
                  const lessons = cronogramas[selectedCronogramaClass] || [];
                  const total = lessons.length;
                  const completed = lessons.filter(l => l.status === "Concluída").length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Aulas ministradas:</span>
                        <span className="font-bold text-foreground">{completed} de {total} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </GlassCard>
            </div>

            {/* Middle Column: Timeline of Lessons */}
            <div className="lg:col-span-5 space-y-6">
              <GlassCard className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-hairline pb-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Cronograma da Trilha</h4>
                    <p className="text-[10px] text-muted-foreground">Grade sequencial de aulas do módulo.</p>
                  </div>
                  {canManage && (
                    <button
                      onClick={handleAddLesson}
                      className="inline-flex items-center gap-1 rounded bg-primary/10 hover:bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary cursor-pointer transition-all border-0"
                    >
                      + Nova Aula
                    </button>
                  )}
                </div>

                {(() => {
                  const lessons = cronogramas[selectedCronogramaClass] || [];
                  if (lessons.length === 0) {
                    return (
                      <p className="text-xs text-muted-foreground text-center py-6">Nenhuma aula cadastrada nesta trilha. Clique em '+ Nova Aula' ou importe um CSV.</p>
                    );
                  }

                  return (
                    <div className="relative pl-6 space-y-6 border-l border-hairline ml-2.5">
                      {lessons.map((les, index) => {
                        let statusColor = "bg-zinc-600 border-zinc-500 text-zinc-400";
                        let ringColor = "ring-zinc-900";
                        if (les.status === "Concluída") {
                          statusColor = "bg-emerald-500 border-emerald-400 text-emerald-400";
                          ringColor = "ring-emerald-950/20";
                        } else if (les.status === "Em Andamento") {
                          statusColor = "bg-blue-500 border-blue-400 text-blue-400 animate-pulse";
                          ringColor = "ring-blue-950/20";
                        }

                        return (
                          <div key={les.id} className="relative group animate-in slide-in-from-bottom-2 duration-200">
                            {/* Dot indicator */}
                            <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border bg-zinc-900 ring-4 ${ringColor} ${statusColor}`}>
                              {les.status === "Concluída" ? (
                                <CheckCircle2 className="size-2.5 text-zinc-900 fill-emerald-400" />
                              ) : les.status === "Em Andamento" ? (
                                <span className="size-1.5 rounded-full bg-blue-400" />
                              ) : (
                                <span className="size-1.5 rounded-full bg-zinc-600" />
                              )}
                            </span>

                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Aula #{les.aula}</span>
                                  <span className={`rounded-full text-[8px] font-bold px-1.5 py-0.2 uppercase ${
                                    les.status === "Concluída" ? "bg-emerald-500/10 text-emerald-400" :
                                    les.status === "Em Andamento" ? "bg-blue-500/10 text-blue-400" :
                                    "bg-zinc-500/10 text-zinc-400"
                                  }`}>
                                    {les.status}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-foreground">{les.tema}</h5>
                                {les.descricao && (
                                  <p className="text-[10px] text-muted-foreground leading-relaxed">{les.descricao}</p>
                                )}
                              </div>

                              {canManage && (
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleToggleLessonStatus(les.id)}
                                    className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent"
                                    title="Mudar Status"
                                  >
                                    <Clock className="size-3" />
                                  </button>
                                  <button
                                    onClick={() => handleEditLessonPrompt(les)}
                                    className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent"
                                    title="Editar Aula"
                                  >
                                    <Pencil className="size-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(les.id)}
                                    className="p-1 rounded hover:bg-white/5 text-rose-400 hover:text-rose-300 cursor-pointer border-0 bg-transparent"
                                    title="Remover Aula"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </GlassCard>
            </div>

            {/* Right Column: Alunos Progress Tracking */}
            <div className="lg:col-span-3 space-y-6">
              <GlassCard className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Acompanhar Alunos</h4>
                  <p className="text-[10px] text-muted-foreground">Posicionamento individual de cada aluno na trilha.</p>
                </div>

                <div className="divide-y divide-hairline">
                  {(() => {
                    const currentClassName = selectedCronogramaClass.toLowerCase();
                    const filteredStudents = students.filter((s) => {
                      const studentTurma = s.turma.toLowerCase();
                      return studentTurma.includes(currentClassName) || currentClassName.includes(studentTurma);
                    });

                    const displayList = filteredStudents.length > 0 ? filteredStudents : students.slice(0, 3); // Fallback to list

                    return displayList.map((stu) => {
                      const lessons = cronogramas[selectedCronogramaClass] || [];
                      const activeLessonIndex = lessons.findIndex(l => l.status === "Em Andamento");
                      const activeLessonNum = activeLessonIndex !== -1 ? lessons[activeLessonIndex]!.aula : 1;

                      let studentLessonNum = activeLessonNum;
                      if (stu.nome === "Caio Bertolli" && activeLessonNum > 1) {
                        studentLessonNum = activeLessonNum - 1;
                      } else if (stu.nome === "Helena Prado" && activeLessonNum < lessons.length) {
                        studentLessonNum = activeLessonNum + 1;
                      }

                      return (
                        <div key={stu.nome} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-foreground">{stu.nome}</p>
                            <span className="text-[9px] text-muted-foreground block">Módulo Nível {stu.nivel}</span>
                          </div>
                          <div className="text-right">
                            <span className="rounded bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 block">
                              Aula #{studentLessonNum}
                            </span>
                            <span className="text-[8px] text-emerald-400 font-medium block mt-1">Conforme Trilha</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* --- INLINE GLASSMORPHIC MODALS --- */}

      {/* Modal: Criar Turma */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
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

              {/* Day selection checkmarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_DAYS.map((d) => {
                    const isSelected = formDias.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormDias(formDias.filter((day) => day !== d.key));
                          } else {
                            setFormDias([...formDias, d.key]);
                          }
                        }}
                        className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-hairline bg-surface/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d.key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time selection slot */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário de Início</label>
                <select
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {CALENDAR_TIMES.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center border-0"
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
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Editar Configurações da Turma</h3>
              <p className="text-xs text-muted-foreground">Altere o professor, vagas, dias ou horário.</p>
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
                    min={selectedClass.alunos}
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

              {/* Day selection checkmarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_DAYS.map((d) => {
                    const isSelected = formDias.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormDias(formDias.filter((day) => day !== d.key));
                          } else {
                            setFormDias([...formDias, d.key]);
                          }
                        }}
                        className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-hairline bg-surface/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d.key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time selection slot */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário de Início</label>
                <select
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {CALENDAR_TIMES.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center border-0"
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
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
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
                className="rounded-lg border border-hairline py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer bg-transparent"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-overdue py-2 text-xs font-semibold text-destructive-foreground hover:bg-overdue/90 shadow transition-all cursor-pointer border-0"
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
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
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
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center border-0"
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
