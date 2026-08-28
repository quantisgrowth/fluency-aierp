import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Users,
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
  X,
  Sparkles,
  Clock,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  AlertCircle,
  Check,
  Info,
  Ban,
  GraduationCap,
} from "lucide-react";
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
  horaFimSelecionada?: string;
  livroId?: string;
  aulaAtual?: number;
};

type Lesson = {
  id: string;
  aula: number;
  tema: string;
  descricao: string;
  status: "Concluída" | "Em Andamento" | "Pendente";
};

type BookTrail = {
  id: string;
  titulo: string;
  nivel: string;
  aulas: Omit<Lesson, "status">[];
};

const DEFAULT_LIVROS_TRILHAS: BookTrail[] = [
  {
    id: "livro-1",
    titulo: "Kids Playgroup - Vol 1",
    nivel: "A1",
    aulas: [
      { id: "l1-1", aula: 1, tema: "Welcome & Color Songs", descricao: "Apresentação e introdução de cores primárias com música." },
      { id: "l1-2", aula: 2, tema: "Vocabulary: Farm Animals", descricao: "Aprendizado dos nomes de animais de fazenda em inglês." },
      { id: "l1-3", aula: 3, tema: "Singing & Action Verbs", descricao: "Música interativa e ações (jump, run, clap)." },
      { id: "l1-4", aula: 4, tema: "Vocabulary: Fruit & Foods", descricao: "Introdução de nomes de frutas comuns e vocabulário de comida." },
      { id: "l1-5", aula: 5, tema: "Review & Games", descricao: "Atividades lúdicas de revisão de cores e animais." }
    ]
  },
  {
    id: "livro-2",
    titulo: "English File - Elementary",
    nivel: "A2",
    aulas: [
      { id: "l2-1", aula: 1, tema: "Simple Past vs Past Continuous", descricao: "Revisão e exercícios de gramática com tempos verbais passados." },
      { id: "l2-2", aula: 2, tema: "Travel Vocabulary & Bookings", descricao: "Como fazer reservas e vocabulário útil para viagens." },
      { id: "l2-3", aula: 3, tema: "Conversational Drills", descricao: "Simulações práticas de diálogo em aeroportos e hotéis." },
      { id: "l2-4", aula: 4, tema: "Reading & Pronunciation", descricao: "Leitura de textos e foco em pronúncia e entonação." }
    ]
  },
  {
    id: "livro-3",
    titulo: "Oxford Grammar - Intermediate",
    nivel: "B1",
    aulas: [
      { id: "l3-1", aula: 1, tema: "Greetings & Self Introduction", descricao: "Como se apresentar profissionalmente em inglês." },
      { id: "l3-2", aula: 2, tema: "Writing Professional Emails", descricao: "Estruturas, formalidades e expressões de e-mail comercial." },
      { id: "l3-3", aula: 3, tema: "Meeting Phrasal Verbs", descricao: "Principais phrasal verbs usados em reuniões." },
      { id: "l3-4", aula: 4, tema: "Negotiation Tactics", descricao: "Vocabulário de negociação e expressão de opiniões." }
    ]
  },
  {
    id: "livro-4",
    titulo: "Cambridge - Conversation Mastery",
    nivel: "B2",
    aulas: [
      { id: "l4-1", aula: 1, tema: "Welcome & Diagnostic Speaking", descricao: "Apresentação e avaliação inicial de fluência oral." },
      { id: "l4-2", aula: 2, tema: "Debating the Future of Work - AI Impact", descricao: "Debate estruturado sobre o impacto da Inteligência Artificial no mercado." },
      { id: "l4-3", aula: 3, tema: "Expressing Agreement & Disagreement", descricao: "Expressões e conectores para concordar e discordar educadamente." },
      { id: "l4-4", aula: 4, tema: "Idiomatic Expressions for Negotiation", descricao: "Expressões idiomáticas nativas usadas em acordos." },
      { id: "l4-5", aula: 5, tema: "Final Presentation - Persuasive Pitch", descricao: "Apresentações finais e feedbacks individuais detalhados." }
    ]
  }
];

const CALENDAR_DAYS = [
  { key: "Seg", label: "Segunda" },
  { key: "Ter", label: "Terça" },
  { key: "Qua", label: "Quarta" },
  { key: "Qui", label: "Quinta" },
  { key: "Sex", label: "Sexta" },
  { key: "Sáb", label: "Sábado" }
];

const parseClassHorario = (c: any) => {
  let diasSelecionados = c.diasSelecionados || [];
  let horaSelecionada = c.horaSelecionada || "";
  let horaFimSelecionada = c.horaFimSelecionada || "";
  
  if (diasSelecionados.length === 0 || !horaSelecionada) {
    const parts = c.horario.split(" ");
    if (parts.length === 2) {
      const daysStr = parts[0];
      const hoursPart = parts[1];
      
      if (hoursPart.includes("-")) {
        const hParts = hoursPart.split("-");
        horaSelecionada = hParts[0];
        horaFimSelecionada = hParts[1];
      } else if (hoursPart.includes("às")) {
        const hParts = hoursPart.split("às");
        horaSelecionada = hParts[0].trim();
        horaFimSelecionada = hParts[1].trim();
      } else {
        horaSelecionada = hoursPart;
      }
      
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
  
  if (!horaFimSelecionada && horaSelecionada) {
    const [h, m] = horaSelecionada.split(":").map(Number);
    const date = new Date();
    date.setHours(h || 0, (m || 0) + 90, 0, 0);
    const fh = String(date.getHours()).padStart(2, '0');
    const fm = String(date.getMinutes()).padStart(2, '0');
    horaFimSelecionada = `${fh}:${fm}`;
  }

  let livroId = c.livroId;
  if (!livroId) {
    if (c.nivel === "A1") livroId = "livro-1";
    else if (c.nivel === "A2") livroId = "livro-2";
    else if (c.nivel === "B1") livroId = "livro-3";
    else livroId = "livro-4";
  }

  let aulaAtual = c.aulaAtual || 1;

  return {
    ...c,
    diasSelecionados,
    horaSelecionada,
    horaFimSelecionada,
    livroId,
    aulaAtual
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
  const [formHoraFim, setFormHoraFim] = useState("20:30");
  const [formLivroId, setFormLivroId] = useState("livro-1");

  // Dynamic Grade Horaria / Calendar Times
  const [calendarTimes, setCalendarTimes] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:classes:calendar-times");
      return stored ? JSON.parse(stored) : [
        "07:30", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:30", "19:00", "20:00"
      ];
    } catch {
      return [
        "07:30", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:30", "19:00", "20:00"
      ];
    }
  });

  // Sync calendar times
  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:classes:calendar-times", JSON.stringify(calendarTimes));
    } catch {}
  }, [calendarTimes]);

  // Configure Times Modal
  const [isConfigureTimesOpen, setIsConfigureTimesOpen] = useState(false);
  const [newTimeInput, setNewTimeInput] = useState("");

  // Allocate Student Modal (Directly in card)
  const [isAllocateStudentOpen, setIsAllocateStudentOpen] = useState(false);
  const [allocateStudentName, setAllocateStudentName] = useState("");

  // Book Trails
  const [livrosTrilhas, setLivrosTrilhas] = useState<BookTrail[]>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:classes:livros-trilhas");
      return stored ? JSON.parse(stored) : DEFAULT_LIVROS_TRILHAS;
    } catch {
      return DEFAULT_LIVROS_TRILHAS;
    }
  });

  // Sync book trails
  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:classes:livros-trilhas", JSON.stringify(livrosTrilhas));
    } catch {}
  }, [livrosTrilhas]);

  // Selected book for viewing/editing in the library tab
  const [selectedLibraryBookId, setSelectedLibraryBookId] = useState<string>("livro-1");

  // Cronograma Sub-Tabs
  const [cronogramaSubTab, setCronogramaSubTab] = useState<"turmas" | "livros">("turmas");

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

  // Synchronize class student count with students list dynamically
  useEffect(() => {
    let changed = false;
    const updated = classes.map(c => {
      const classNomeLower = c.nome.toLowerCase();
      const count = students.filter((s: any) => {
        const studentTurma = s.turma.toLowerCase();
        return studentTurma === classNomeLower || studentTurma.includes(classNomeLower) || classNomeLower.includes(studentTurma);
      }).length;
      if (c.alunos !== count) {
        changed = true;
        return { ...c, alunos: count };
      }
      return c;
    });
    if (changed) {
      setClasses(updated);
    }
  }, [students, classes]);

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

  const handleRemoveStudentFromClass = (studentName: string, className: string) => {
    if (!confirm(`Deseja remover o aluno "${studentName}" da turma "${className}"?`)) {
      return;
    }
    setStudents(students.map(s => s.nome === studentName ? { ...s, turma: "Sem Turma" } : s));
    setClasses(classes.map(c => c.nome === className ? { ...c, alunos: Math.max(0, c.alunos - 1) } : c));

    try {
      const storedDetails = window.localStorage.getItem("fluency-ai:students:details");
      if (storedDetails) {
        const parsed = JSON.parse(storedDetails);
        if (parsed[studentName]) {
          parsed[studentName].turma = "Sem Turma";
          window.localStorage.setItem("fluency-ai:students:details", JSON.stringify(parsed));
        }
      }
    } catch {}

    toast.success(`Aluno "${studentName}" removido da turma com sucesso!`);
  };

  const handleOpenCreate = () => {
    setFormName("");
    setFormNivel("A1");
    setFormProfessor("Marcos Vidal");
    setFormVagas(12);
    setFormHorario("Seg/Qua 19:00");
    setFormDias(["Seg", "Qua"]);
    setFormHora("19:00");
    setFormHoraFim("20:30");
    setFormLivroId("livro-1");
    setIsCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const daysPart = formDias.join("/");
    const combinedHorario = `${daysPart} ${formHora}-${formHoraFim}`;

    const newClass: ClassItem = {
      nome: formName,
      nivel: formNivel,
      professor: formProfessor,
      alunos: 0,
      vagas: Number(formVagas),
      horario: combinedHorario,
      diasSelecionados: formDias,
      horaSelecionada: formHora,
      horaFimSelecionada: formHoraFim,
      livroId: formLivroId,
      aulaAtual: 1,
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
    setFormHoraFim(c.horaFimSelecionada || "20:30");
    setFormLivroId(c.livroId || "livro-1");
    setIsEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !formName) return;

    const daysPart = formDias.join("/");
    const combinedHorario = `${daysPart} ${formHora}-${formHoraFim}`;

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
              horaSelecionada: formHora,
              horaFimSelecionada: formHoraFim,
              livroId: formLivroId
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

    const studentObj = students.find((s) => s.nome === transferStudent);
    const targetClassObj = classes.find((c) => c.nome === transferTargetClass);

    if (studentObj && targetClassObj) {
      const studentHoras = studentObj.horasContratadas || 4;
      const daysCount = targetClassObj.diasSelecionados?.length || 2;
      let durationHours = 2.0;
      if (targetClassObj.horaSelecionada && targetClassObj.horaFimSelecionada) {
        const [sh = 19, sm = 0] = targetClassObj.horaSelecionada.split(":").map(Number);
        const [eh = 21, em = 0] = targetClassObj.horaFimSelecionada.split(":").map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        durationHours = diff > 0 ? Number((diff / 60).toFixed(1)) : 2.0;
      }
      const targetWeeklyHours = durationHours * daysCount;

      // Check Hours Limit
      if (targetWeeklyHours > studentHoras) {
        toast.error("Transferência Bloqueada: Carga Horária Excedida!", {
          description: `O aluno ${studentObj.nome} contratou ${studentHoras}h/semana, mas a turma de destino exige ${targetWeeklyHours}h/semana.`,
        });
        return;
      }

      // Check Level Mismatch
      if (studentObj.nivel !== targetClassObj.nivel) {
        toast.warning("Atenção: Inconsistência Pedagógica na Transferência", {
          description: `O aluno ${studentObj.nome} (${studentObj.nivel}) foi transferido para a turma de nível ${targetClassObj.nivel} como exceção pedagógica.`,
        });
      }
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
    calendarTimes.forEach((t) => {
      const classesInSlot = classes.filter((c) => {
        const matchesDay = c.diasSelecionados?.includes(d.key);
        
        const toMinutes = (timeStr: string) => {
          if (!timeStr) return 0;
          const [h, m] = timeStr.split(":").map(Number);
          return (h || 0) * 60 + (m || 0);
        };
        const tMin = toMinutes(t);
        const startMin = toMinutes(c.horaSelecionada || "19:00");
        const endMin = toMinutes(c.horaFimSelecionada || "20:30");
        const matchesTime = tMin >= startMin && tMin < endMin;
        
        return matchesDay && matchesTime;
      });
      if (classesInSlot.length > 0) {
        occupiedSlotsCount++;
      }
    });
  });
  const totalPossibleSlots = CALENDAR_DAYS.length * calendarTimes.length;
  const slotOccupancyRate = Math.round((occupiedSlotsCount / totalPossibleSlots) * 105) || 0; // fallback if zero

  const getClassesForSlot = (dayKey: string, time: string) => {
    return filteredClasses.filter((c) => {
      const matchesDay = c.diasSelecionados?.includes(dayKey);
      
      const toMinutes = (timeStr: string) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      const tMin = toMinutes(time);
      const startMin = toMinutes(c.horaSelecionada || "19:00");
      const endMin = toMinutes(c.horaFimSelecionada || "20:30");
      const matchesTime = tMin >= startMin && tMin < endMin;
      
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
          <GlassCard className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-4.5 text-primary" />
              <span className="text-xs font-bold text-foreground">Agenda de Alocações</span>
            </div>
            
            <div className="flex items-center gap-3">
              {canManage && (
                <button
                  onClick={() => setIsConfigureTimesOpen(true)}
                  className="rounded-lg border border-hairline bg-surface/50 px-3 py-1.5 text-[10px] font-bold text-foreground hover:bg-accent cursor-pointer transition-all flex items-center gap-1"
                >
                  <Clock className="size-3.5" /> Configurar Horários
                </button>
              )}
              
              <div className="flex border border-hairline rounded-lg overflow-hidden bg-surface/40 p-0.5 shrink-0">
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
                  {calendarTimes.map((time) => (
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
          
          {/* Sub-Tabs Selector */}
          <div className="flex border-b border-hairline/60 gap-6 pb-0.5">
            <button
              onClick={() => setCronogramaSubTab("turmas")}
              className={`pb-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer bg-transparent border-0 ${
                cronogramaSubTab === "turmas"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Status das Turmas
            </button>
            <button
              onClick={() => setCronogramaSubTab("livros")}
              className={`pb-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer bg-transparent border-0 ${
                cronogramaSubTab === "livros"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Biblioteca de Livros / Trilhas
            </button>
          </div>

          {/* VIEW: STATUS DAS TURMAS */}
          {cronogramaSubTab === "turmas" && (
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* Left: Class Selection */}
              <div className="lg:col-span-4 space-y-6">
                <GlassCard className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Acompanhar Turma</h4>
                    <p className="text-[10px] text-muted-foreground">Monitore o andamento pedagógico da turma na trilha do livro.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Turma</label>
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

                  {(() => {
                    const c = classes.find(item => item.nome === selectedCronogramaClass);
                    if (!c) return null;
                    const book = livrosTrilhas.find(b => b.id === c.livroId);

                    return (
                      <div className="border-t border-hairline pt-4 space-y-4">
                        {book ? (
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Livro Didático Ativo</span>
                            <p className="text-xs font-bold text-foreground">{book.titulo}</p>
                            <span className="inline-flex rounded bg-primary/10 text-primary text-[8px] font-extrabold px-1.5 py-0.5">CEFR {book.nivel}</span>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-overdue/10 border border-overdue/20 p-3 text-[10px] text-overdue leading-relaxed">
                            Nenhum livro didático está associado a esta turma. Selecione um livro abaixo para vinculá-la.
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Associar Livro / Trilha</label>
                          <select
                            value={c.livroId || ""}
                            onChange={(e) => {
                              const bid = e.target.value;
                              setClasses(classes.map(item => item.nome === c.nome ? { ...item, livroId: bid } : item));
                              toast.success("Livro atualizado para esta turma!");
                            }}
                            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">-- Selecione o Livro --</option>
                            {livrosTrilhas.map(b => (
                              <option key={b.id} value={b.id}>{b.titulo} ({b.nivel})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </GlassCard>

                {/* Progress Card */}
                {(() => {
                  const c = classes.find(item => item.nome === selectedCronogramaClass);
                  const book = c ? livrosTrilhas.find(b => b.id === c.livroId) : null;
                  if (!book || !c) return null;

                  const total = book.aulas.length;
                  const activeIndex = c.aulaAtual || 1;
                  const pct = total > 0 ? Math.round(((activeIndex - 1) / total) * 100) : 0;

                  return (
                    <GlassCard className="p-6 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Progresso da Trilha</h4>
                        <p className="text-[10px] text-muted-foreground">Progresso do cronograma do livro didático.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Lições concluídas:</span>
                          <span className="font-bold text-foreground">{activeIndex - 1} de {total} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </GlassCard>
                  );
                })()}
              </div>

              {/* Middle: Timeline of class progress */}
              <div className="lg:col-span-5 space-y-6">
                <GlassCard className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Roteiro de Aulas da Turma</h4>
                    <p className="text-[10px] text-muted-foreground">Aulas e conteúdos programados. Clique em uma aula para atualizar o progresso da turma até ela.</p>
                  </div>

                  {(() => {
                    const c = classes.find(item => item.nome === selectedCronogramaClass);
                    const book = c ? livrosTrilhas.find(b => b.id === c.livroId) : null;
                    if (!book || !c) {
                      return (
                        <p className="text-xs text-muted-foreground text-center py-8">Selecione ou vincule um livro didático à turma para carregar o roteiro pedagógico.</p>
                      );
                    }

                    return (
                      <div className="relative pl-6 space-y-6 border-l border-hairline ml-2.5">
                        {book.aulas.map((les) => {
                          const isCompleted = les.aula < (c.aulaAtual || 1);
                          const isActive = les.aula === (c.aulaAtual || 1);

                          let statusText = "Pendente";
                          let statusColor = "bg-zinc-600 border-zinc-500 text-zinc-400";
                          let ringColor = "ring-zinc-900";

                          if (isCompleted) {
                            statusText = "Concluída";
                            statusColor = "bg-emerald-500 border-emerald-400 text-emerald-400";
                            ringColor = "ring-emerald-950/20";
                          } else if (isActive) {
                            statusText = "Em Andamento";
                            statusColor = "bg-blue-500 border-blue-400 text-blue-400 animate-pulse";
                            ringColor = "ring-blue-950/20";
                          }

                          return (
                            <div
                              key={les.id}
                              onClick={() => {
                                setClasses(classes.map(item => item.nome === c.nome ? { ...item, aulaAtual: les.aula } : item));
                                toast.success(`Turma posicionada na Aula #${les.aula}!`);
                              }}
                              className="relative group cursor-pointer transition-all hover:translate-x-0.5 duration-200"
                            >
                              {/* Dot indicator */}
                              <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border bg-zinc-900 ring-4 ${ringColor} ${statusColor}`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="size-2.5 text-zinc-900 fill-emerald-400" />
                                ) : isActive ? (
                                  <span className="size-1.5 rounded-full bg-blue-400" />
                                ) : (
                                  <span className="size-1.5 rounded-full bg-zinc-600" />
                                )}
                              </span>

                              <div className="space-y-1 bg-white/[0.01] hover:bg-white/[0.03] p-2 rounded-lg transition-colors border border-transparent hover:border-hairline">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Aula #{les.aula}</span>
                                  <span className={`rounded-full text-[8px] font-bold px-1.5 py-0.2 uppercase ${
                                    isCompleted ? "bg-emerald-500/10 text-emerald-400" :
                                    isActive ? "bg-blue-500/10 text-blue-400" :
                                    "bg-zinc-500/10 text-zinc-400"
                                  }`}>
                                    {statusText}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-foreground">{les.tema}</h5>
                                {les.descricao && (
                                  <p className="text-[10px] text-muted-foreground leading-relaxed">{les.descricao}</p>
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

              {/* Right: Students List */}
              <div className="lg:col-span-3 space-y-6">
                <GlassCard className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Desempenho dos Alunos</h4>
                    <p className="text-[10px] text-muted-foreground">Progresso e sincronia de cada aluno no livro.</p>
                  </div>

                  <div className="divide-y divide-hairline">
                    {(() => {
                      const c = classes.find(item => item.nome === selectedCronogramaClass);
                      const currentClassName = selectedCronogramaClass.toLowerCase();
                      const filteredStudents = students.filter((s) => {
                        const studentTurma = s.turma.toLowerCase();
                        return studentTurma.includes(currentClassName) || currentClassName.includes(studentTurma);
                      });

                      const displayList = filteredStudents.length > 0 ? filteredStudents : students.slice(0, 3);

                      return displayList.map((stu) => {
                        const activeLessonNum = c?.aulaAtual || 1;
                        let studentLessonNum = activeLessonNum;
                        if (stu.nome === "Caio Bertolli" && activeLessonNum > 1) {
                          studentLessonNum = activeLessonNum - 1;
                        } else if (stu.nome === "Helena Prado" && c && activeLessonNum < 5) {
                          studentLessonNum = activeLessonNum + 1;
                        }

                        return (
                          <div key={stu.nome} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">{stu.nome}</p>
                              <span className="text-[9px] text-muted-foreground block">Trilha Nível {stu.nivel}</span>
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
          )}

          {/* VIEW: BIBLIOTECA DE LIVROS / TRILHAS */}
          {cronogramaSubTab === "livros" && (
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Book Trails List */}
              <div className="lg:col-span-4 space-y-6">
                <GlassCard className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Trilhas de Livros</h4>
                      <p className="text-[10px] text-muted-foreground">Lista de livros pedagógicos cadastrados.</p>
                    </div>
                    {canManage && (
                      <button
                        onClick={(() => {
                          const title = prompt("Insira o nome do Livro / Material Didático:");
                          if (!title) return;
                          const level = prompt("Insira o nível CEFR (ex: A1, B2):", "A1");
                          if (!level) return;

                          const newBook: BookTrail = {
                            id: `livro-${Date.now()}`,
                            titulo: title,
                            nivel: level,
                            aulas: [
                              { id: `l-gen-${Date.now()}-1`, aula: 1, tema: "Aula Introdutória", descricao: "Apresentação do material e cronograma." }
                            ]
                          };
                          setLivrosTrilhas([...livrosTrilhas, newBook]);
                          setSelectedLibraryBookId(newBook.id);
                          toast.success(`Livro "${title}" adicionado com sucesso!`);
                        })}
                        className="inline-flex items-center gap-1 rounded bg-primary/10 hover:bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary cursor-pointer transition-all border-0"
                      >
                        + Novo Livro
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {livrosTrilhas.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => setSelectedLibraryBookId(book.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex justify-between items-center ${
                          selectedLibraryBookId === book.id
                            ? "border-primary bg-primary/5 text-foreground font-semibold"
                            : "border-hairline bg-surface/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{book.titulo}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{book.aulas.length} Aulas Planejadas</p>
                        </div>
                        <span className="rounded bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5">CEFR {book.nivel}</span>
                      </div>
                    ))}
                  </div>

                  {/* CSV Actions for selected book */}
                  {(() => {
                    const book = livrosTrilhas.find(b => b.id === selectedLibraryBookId);
                    if (!book) return null;

                    return (
                      <div className="border-t border-hairline pt-4 space-y-3">
                        <div>
                          <h5 className="text-[11px] font-bold text-foreground">Importar Aulas para este Livro</h5>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Sobrescreva as aulas deste livro importando uma planilha modelo CSV.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDownloadModelCSV}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface/50 py-2 text-[10px] font-bold text-foreground hover:bg-accent cursor-pointer transition-all"
                          >
                            Baixar Modelo CSV
                          </button>
                          <label className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-[10px] font-bold text-primary-foreground shadow hover:bg-primary/95 cursor-pointer transition-all border-0">
                            Importar CSV
                            <input
                              type="file"
                              accept=".csv"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  try {
                                    const text = event.target?.result as string;
                                    const lines = text.split("\n");
                                    const parsedAulas: any[] = [];

                                    for (let i = 1; i < lines.length; i++) {
                                      const line = lines[i]?.trim();
                                      if (!line) continue;

                                      const cols = line.includes(";") ? line.split(";") : line.split(",");
                                      const aulaNum = Number(cols[0]?.trim()) || i;
                                      const temaStr = cols[1]?.trim() || "Aula sem tema";
                                      const descStr = cols[2]?.trim() || "";

                                      parsedAulas.push({
                                        id: `l-csv-${Date.now()}-${i}`,
                                        aula: aulaNum,
                                        tema: temaStr,
                                        descricao: descStr
                                      });
                                    }

                                    if (parsedAulas.length === 0) {
                                      toast.error("Nenhuma aula válida no CSV.");
                                      return;
                                    }

                                    setLivrosTrilhas(livrosTrilhas.map(b => b.id === book.id ? { ...b, aulas: parsedAulas } : b));
                                    toast.success(`Importadas ${parsedAulas.length} aulas na trilha do livro "${book.titulo}"!`);
                                  } catch {
                                    toast.error("Erro ao importar CSV.");
                                  }
                                };
                                reader.readAsText(file);
                                e.target.value = "";
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })()}
                </GlassCard>
              </div>

              {/* Middle/Right Column: Lessons list of book */}
              <div className="lg:col-span-8 space-y-6">
                {(() => {
                  const book = livrosTrilhas.find(b => b.id === selectedLibraryBookId);
                  if (!book) return null;

                  return (
                    <GlassCard className="p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-hairline pb-4">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Aulas do Livro: {book.titulo}</h4>
                          <p className="text-[10px] text-muted-foreground">Estrutura oficial do curso. Professores seguirão este cronograma.</p>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => {
                              setLivrosTrilhas(livrosTrilhas.map(b => {
                                if (b.id === book.id) {
                                  const nextNum = b.aulas.length > 0 ? Math.max(...b.aulas.map(a => a.aula)) + 1 : 1;
                                  return {
                                    ...b,
                                    aulas: [
                                      ...b.aulas,
                                      {
                                        id: `l-${Date.now()}`,
                                        aula: nextNum,
                                        tema: `Nova Aula Pedagógica #${nextNum}`,
                                        descricao: "Descrição pedagógica da lição."
                                      }
                                    ]
                                  };
                                }
                                return b;
                              }));
                              toast.success("Nova aula adicionada à trilha do livro!");
                            }}
                            className="inline-flex items-center gap-1 rounded bg-primary/10 hover:bg-primary/20 px-2.5 py-1 text-[10px] font-bold text-primary cursor-pointer transition-all border-0"
                          >
                            + Adicionar Aula
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {book.aulas.map((les) => (
                          <div
                            key={les.id}
                            className="rounded-lg border border-hairline bg-white/[0.01] p-4 flex justify-between items-start gap-4 hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Aula #{les.aula}</span>
                              <h5 className="text-xs font-bold text-foreground">{les.tema}</h5>
                              {les.descricao && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed">{les.descricao}</p>
                              )}
                            </div>

                            {canManage && (
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    const newTema = prompt("Insira o tema da aula:", les.tema);
                                    if (newTema === null) return;
                                    const newDesc = prompt("Insira a descrição da aula:", les.descricao);
                                    if (newDesc === null) return;

                                    setLivrosTrilhas(livrosTrilhas.map(b => {
                                      if (b.id === book.id) {
                                        return {
                                          ...b,
                                          aulas: b.aulas.map(a => a.id === les.id ? { ...a, tema: newTema || a.tema, descricao: newDesc } : a)
                                        };
                                      }
                                      return b;
                                    }));
                                    toast.success("Aula do livro atualizada!");
                                  }}
                                  className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent"
                                  title="Editar Aula"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setLivrosTrilhas(livrosTrilhas.map(b => {
                                      if (b.id === book.id) {
                                        const filtered = b.aulas.filter(a => a.id !== les.id);
                                        const rescaled = filtered.map((a, idx) => ({ ...a, aula: idx + 1 }));
                                        return { ...b, aulas: rescaled };
                                      }
                                      return b;
                                    }));
                                    toast.success("Aula removida da trilha do livro.");
                                  }}
                                  className="p-1 rounded hover:bg-white/5 text-rose-400 hover:text-rose-300 cursor-pointer border-0 bg-transparent"
                                  title="Excluir Aula"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  );
                })()}
              </div>
            </div>
          )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário de Início</label>
                  <select
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    {calendarTimes.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário de Fim</label>
                  <input
                    type="text"
                    placeholder="Ex: 09:00"
                    value={formHoraFim}
                    onChange={(e) => setFormHoraFim(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Book trail selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Livro / Trilha Didática</label>
                <select
                  value={formLivroId}
                  onChange={(e) => setFormLivroId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {livrosTrilhas.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.titulo} (CEFR {book.nivel})
                    </option>
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

      {/* Modal: Editar Turma (Layout Amplo e Gestão Pedagógica Avançada) */}
      {isEditOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative border-primary/20">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-hairline pb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <BookOpen className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">Editar Configurações da Turma</h3>
                <p className="text-xs text-muted-foreground">
                  Ajuste parâmetros didáticos, horários, cálculo de horas semanais e alocação de alunos com validação pedagógica.
                </p>
              </div>
            </div>

            {(() => {
              // Duration and weekly hours calculation
              const getDurationHours = (startStr: string, endStr: string): number => {
                try {
                  const [startH = 19, startM = 0] = startStr.split(":").map(Number);
                  const [endH = 21, endM = 0] = endStr.split(":").map(Number);
                  const startMin = (startH * 60) + startM;
                  const endMin = (endH * 60) + endM;
                  const diffMin = endMin > startMin ? endMin - startMin : 120;
                  return Number((diffMin / 60).toFixed(1));
                } catch {
                  return 2.0;
                }
              };

              const classDuration = getDurationHours(formHora, formHoraFim);
              const weeklyHours = Number((classDuration * Math.max(1, formDias.length)).toFixed(1));
              const monthlyHours = Number((weeklyHours * 4).toFixed(0));

              // Selected book info
              const selectedBook = livrosTrilhas.find(b => b.id === formLivroId);

              // Students list for this class
              const classNomeLower = selectedClass.nome.toLowerCase();
              const enrolledStudents = students.filter(s => {
                const studentTurma = s.turma.toLowerCase();
                return studentTurma === classNomeLower || studentTurma.includes(classNomeLower) || classNomeLower.includes(studentTurma);
              });

              const availableStudents = students.filter(s => {
                const studentTurma = s.turma.toLowerCase();
                return studentTurma !== classNomeLower && !studentTurma.includes(classNomeLower) && !classNomeLower.includes(studentTurma);
              });

              const isFull = enrolledStudents.length >= formVagas;
              const occupancyPct = Math.min(100, Math.round((enrolledStudents.length / formVagas) * 100));

              // Currently selected student in allocation dropdown
              const candidateStudent = students.find(s => s.nome === allocateStudentName);
              const candidateHorasContratadas = candidateStudent?.horasContratadas || 4;
              const isHoursExceeded = candidateStudent ? weeklyHours > candidateHorasContratadas : false;
              const isLevelMismatch = candidateStudent ? candidateStudent.nivel !== formNivel : false;

              return (
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  
                  {/* COLUMN 1: CLASS CONFIGURATIONS */}
                  <form onSubmit={handleEdit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Turma</label>
                      <input
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível CEFR da Turma</label>
                        <select
                          value={formNivel}
                          onChange={(e) => setFormNivel(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                        >
                          <option value="A1">A1 (Iniciante)</option>
                          <option value="A2">A2 (Elementar)</option>
                          <option value="B1">B1 (Intermediário)</option>
                          <option value="B2">B2 (Intermediário Superior)</option>
                          <option value="C1">C1 (Avançado)</option>
                          <option value="C2">C2 (Fluente / Domínio)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vagas Máximas</label>
                        <input
                          type="number"
                          value={formVagas}
                          onChange={(e) => setFormVagas(Number(e.target.value))}
                          min={enrolledStudents.length}
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
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                      >
                        <option value="Marcos Vidal">Marcos Vidal</option>
                        <option value="Julia Kern">Julia Kern</option>
                        <option value="Ana Beatriz">Ana Beatriz</option>
                        <option value="Peter Hall">Peter Hall</option>
                      </select>
                    </div>

                    {/* Day selection checkmarks */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dias da Semana ({formDias.length} selecionados)</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CALENDAR_DAYS.map((d) => {
                          const isSelected = formDias.includes(d.key);
                          return (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (formDias.length > 1) {
                                    setFormDias(formDias.filter((day) => day !== d.key));
                                  } else {
                                    toast.error("A turma precisa ter pelo menos 1 dia na semana.");
                                  }
                                } else {
                                  setFormDias([...formDias, d.key]);
                                }
                              }}
                              className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-hairline bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time selection slot */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário de Início</label>
                        <select
                          value={formHora}
                          onChange={(e) => setFormHora(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                        >
                          {calendarTimes.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário de Término</label>
                        <input
                          type="text"
                          placeholder="Ex: 21:00"
                          value={formHoraFim}
                          onChange={(e) => setFormHoraFim(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    {/* Calculated Hours Banner */}
                    <div className="rounded-xl border border-hairline bg-surface-elevated/40 p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Clock className="size-4" />
                        </span>
                        <div>
                          <p className="font-bold text-foreground">Carga Horária da Turma</p>
                          <p className="text-[11px] text-muted-foreground">
                            {classDuration}h por encontro × {formDias.length} dia(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {weeklyHours}h / semana
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">~{monthlyHours}h / mês</p>
                      </div>
                    </div>

                    {/* Book trail selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="size-3.5 text-primary" /> Livro / Trilha Didática
                      </label>
                      <select
                        value={formLivroId}
                        onChange={(e) => setFormLivroId(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                      >
                        {livrosTrilhas.map((book) => (
                          <option key={book.id} value={book.id}>
                            {book.titulo} (Nível CEFR: {book.nivel})
                          </option>
                        ))}
                      </select>
                      {selectedBook && (
                        <p className="text-[11px] text-muted-foreground">
                          * Este material possui <strong>{selectedBook.aulas.length} aulas estruturadas</strong> voltadas para proficiência <strong>{selectedBook.nivel}</strong>.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center border-0 active:scale-[0.98]"
                    >
                      Salvar Alterações da Turma
                    </button>
                  </form>

                  {/* COLUMN 2: STUDENTS ROSTER & PEDAGOGICAL ALLOCATION */}
                  <div className="space-y-5 rounded-xl border border-hairline bg-surface/20 p-5">
                    
                    {/* Capacity & Occupancy Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Users className="size-4 text-primary" /> Alunos Matriculados
                        </span>
                        <span className="font-semibold text-muted-foreground">
                          {enrolledStudents.length} de {formVagas} vagas ({occupancyPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-elevated overflow-hidden border border-hairline">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? "bg-rose-500" : occupancyPct > 80 ? "bg-amber-500" : "bg-primary"
                          }`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Enrolled Students List */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Roster de Alunos da Turma
                      </p>

                      {enrolledStudents.length > 0 ? (
                        <div className="divide-y divide-hairline rounded-lg border border-hairline bg-surface/40 max-h-56 overflow-y-auto">
                          {enrolledStudents.map((student) => {
                            const isMatch = student.nivel === formNivel;
                            const studentHoras = student.horasContratadas || 4;

                            return (
                              <div
                                key={student.nome}
                                className="flex items-center justify-between p-2.5 text-xs hover:bg-surface/60 transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-foreground">{student.nome}</p>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="rounded bg-surface-elevated border border-hairline px-1.5 py-0.2 font-medium text-foreground">
                                      Nível: {student.nivel}
                                    </span>
                                    <span className="text-muted-foreground">
                                      Plano: {studentHoras}h/sem
                                    </span>
                                    {isMatch ? (
                                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                        <Check className="size-3" /> Nível OK
                                      </span>
                                    ) : (
                                      <span className="text-amber-400 font-semibold flex items-center gap-0.5" title={`Aluno está no nível ${student.nivel}, enquanto a turma exige ${formNivel}`}>
                                        <AlertTriangle className="size-3" /> Divergência ({student.nivel})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudentFromClass(student.nome, selectedClass.nome)}
                                  className="rounded-lg border border-hairline px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                                  title="Desvincular da turma"
                                >
                                  Desvincular
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic bg-surface/30 border border-hairline p-3 rounded-lg text-center">
                          Nenhum aluno matriculado nesta turma no momento.
                        </p>
                      )}
                    </div>

                    {/* ALLOCATE NEW STUDENT SECTION */}
                    <div className="space-y-3 pt-3 border-t border-hairline">
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                          <GraduationCap className="size-4 text-primary" /> Alocar Aluno na Turma
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          O sistema valida a compatibilidade de nível CEFR e limite de horas semanais contratadas.
                        </p>
                      </div>

                      {!isFull ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <select
                              value={allocateStudentName}
                              onChange={(e) => setAllocateStudentName(e.target.value)}
                              className="h-10 flex-1 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                            >
                              <option value="">-- Selecione o Aluno para Alocação --</option>
                              {availableStudents.map((s) => {
                                const sHoras = s.horasContratadas || 4;
                                const isLevelOk = s.nivel === formNivel;
                                const isHorasOk = weeklyHours <= sHoras;
                                
                                return (
                                  <option key={s.nome} value={s.nome}>
                                    {s.nome} · Nível {s.nivel} {isLevelOk ? "✓" : "(!)"} · {sHoras}h/sem {isHorasOk ? "" : "(Excede horas)"}
                                  </option>
                                );
                              })}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                if (!allocateStudentName) {
                                  toast.error("Por favor, selecione um aluno na lista.");
                                  return;
                                }

                                const studentObj = students.find(s => s.nome === allocateStudentName);
                                if (!studentObj) return;

                                const studentHoras = studentObj.horasContratadas || 4;

                                // 1. Check Hours limit
                                if (weeklyHours > studentHoras) {
                                  toast.error("Limite de Horas Semanais Excedido!", {
                                    description: `O aluno ${studentObj.nome} contratou ${studentHoras}h semanais, mas esta turma exige ${weeklyHours}h semanais. Alocação bloqueada para não ultrapassar a contratação.`,
                                  });
                                  return;
                                }

                                // 2. Check Level Pedagogical Match
                                if (studentObj.nivel !== formNivel) {
                                  toast.warning("Atenção: Inconsistência Pedagógica Registrada", {
                                    description: `O aluno ${studentObj.nome} (${studentObj.nivel}) foi alocado na turma de nível ${formNivel} como exceção.`,
                                  });
                                }

                                setClasses(classes.map(item => item.nome === selectedClass.nome ? { ...item, alunos: item.alunos + 1 } : item));
                                setStudents(students.map(s => s.nome === allocateStudentName ? { ...s, turma: selectedClass.nome } : s));
                                
                                try {
                                  const storedDetails = window.localStorage.getItem("fluency-ai:students:details");
                                  if (storedDetails) {
                                    const parsed = JSON.parse(storedDetails);
                                    if (parsed[allocateStudentName]) {
                                      parsed[allocateStudentName].turma = selectedClass.nome;
                                      window.localStorage.setItem("fluency-ai:students:details", JSON.stringify(parsed));
                                    }
                                  }
                                } catch {}

                                toast.success(`Aluno "${allocateStudentName}" matriculado com sucesso na turma "${selectedClass.nome}"!`);
                                setAllocateStudentName("");
                              }}
                              className="h-10 px-4 rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 cursor-pointer border-0 transition-all active:scale-95"
                            >
                              Alocar
                            </button>
                          </div>

                          {/* Dynamic Validation Feedback Card for Selected Student */}
                          {candidateStudent && (
                            <div className="space-y-2 p-3 rounded-lg border bg-surface-elevated/20 text-xs">
                              <p className="font-bold text-foreground">Diagnóstico de Alocação para {candidateStudent.nome}:</p>
                              
                              {/* Hours verification */}
                              {isHoursExceeded ? (
                                <div className="flex items-start gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-md">
                                  <Ban className="size-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold">Bloqueio: Carga Horária Excedida</p>
                                    <p className="text-[11px] text-rose-300">
                                      O aluno contratou <strong>{candidateHorasContratadas}h/semana</strong>, mas esta turma exige <strong>{weeklyHours}h/semana</strong>. Não é permitido alocar.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-md">
                                  <Check className="size-4 shrink-0" />
                                  <span>Carga horária compatível ({weeklyHours}h da turma ≤ {candidateHorasContratadas}h contratadas).</span>
                                </div>
                              )}

                              {/* Level verification */}
                              {isLevelMismatch ? (
                                <div className="flex items-start gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-md">
                                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold">Aviso: Inconsistência de Nível Pedagógico</p>
                                    <p className="text-[11px] text-amber-300">
                                      O aluno está classificado no <strong>Nível {candidateStudent.nivel}</strong>, enquanto a turma e o livro didático exigem <strong>Nível {formNivel}</strong>.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-md">
                                  <Check className="size-4 shrink-0" />
                                  <span>Nível pedagógico 100% compatível (CEFR {formNivel}).</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-center font-semibold">
                          Turma com lotação máxima atingida ({formVagas} vagas). Para alocar mais alunos, aumente o número de vagas máximas.
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}

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
          <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative border-primary/20">
            <button
              onClick={() => setIsTransferOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 transition-colors"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Transferência Pedagógica de Aluno</h3>
              <p className="text-xs text-muted-foreground">Selecione o aluno e escolha a turma de destino compatível.</p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary flex items-center justify-between">
              <span>Turma de Origem: <strong>{selectedClass.nome} (CEFR {selectedClass.nivel})</strong></span>
              <span className="text-[10px] font-semibold opacity-80">{selectedClass.alunos}/{selectedClass.vagas} alunos</span>
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
                      {s.nome} · Nível {s.nivel} · {s.horasContratadas || 4}h/sem ({s.status})
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
                        {item.nome} (CEFR {item.nivel}) — {item.alunos}/{item.vagas} vagas
                      </option>
                    ))}
                </select>
              </div>

              {/* Real time diagnostic for transfer */}
              {(() => {
                const sObj = students.find((s) => s.nome === transferStudent);
                const tObj = classes.find((c) => c.nome === transferTargetClass);
                if (!sObj || !tObj) return null;

                const sHoras = sObj.horasContratadas || 4;
                const daysCount = tObj.diasSelecionados?.length || 2;
                let durationHours = 2.0;
                if (tObj.horaSelecionada && tObj.horaFimSelecionada) {
                  const [sh = 19, sm = 0] = tObj.horaSelecionada.split(":").map(Number);
                  const [eh = 21, em = 0] = tObj.horaFimSelecionada.split(":").map(Number);
                  const diff = (eh * 60 + em) - (sh * 60 + sm);
                  durationHours = diff > 0 ? Number((diff / 60).toFixed(1)) : 2.0;
                }
                const targetWeekly = durationHours * daysCount;
                const isOver = targetWeekly > sHoras;
                const isDiffLevel = sObj.nivel !== tObj.nivel;

                return (
                  <div className="p-3 rounded-lg border bg-surface-elevated/20 space-y-1.5 text-xs">
                    <p className="font-bold text-foreground">Diagnóstico de Transferência:</p>
                    {isOver ? (
                      <p className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <Ban className="size-3.5 shrink-0" />
                        Bloqueio: Turma de destino exige {targetWeekly}h/sem (Aluno contratou {sHoras}h/sem).
                      </p>
                    ) : (
                      <p className="text-emerald-400 flex items-center gap-1.5">
                        <Check className="size-3.5 shrink-0" />
                        Carga horária compatível ({targetWeekly}h ≤ {sHoras}h).
                      </p>
                    )}

                    {isDiffLevel ? (
                      <p className="text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="size-3.5 shrink-0" />
                        Aviso: Aluno é nível {sObj.nivel} e destino é nível {tObj.nivel}.
                      </p>
                    ) : (
                      <p className="text-emerald-400 flex items-center gap-1.5">
                        <Check className="size-3.5 shrink-0" />
                        Nível compatível (CEFR {tObj.nivel}).
                      </p>
                    )}
                  </div>
                );
              })()}

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center border-0"
              >
                Confirmar Transferência
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Modal: Configurar Grade Horária */}
      {isConfigureTimesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsConfigureTimesOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-4" />
            </button>
            
            <div>
              <h3 className="text-base font-bold text-foreground">Grade Horária da Escola</h3>
              <p className="text-xs text-muted-foreground">Adicione ou remova os horários disponíveis para turmas.</p>
            </div>

            {/* Add New Time Form */}
            <div className="flex gap-2 items-end border-b border-hairline pb-4">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Novo Horário</label>
                <input
                  type="text"
                  placeholder="Ex: 11:30"
                  value={newTimeInput}
                  onChange={(e) => setNewTimeInput(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => {
                  const trimmed = newTimeInput.trim();
                  if (!trimmed) return;
                  if (calendarTimes.includes(trimmed)) {
                    toast.error("Este horário já existe.");
                    return;
                  }
                  const updated = [...calendarTimes, trimmed].sort();
                  setCalendarTimes(updated);
                  setNewTimeInput("");
                  toast.success(`Horário "${trimmed}" adicionado!`);
                }}
                className="rounded-lg bg-primary h-10 px-4 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 cursor-pointer border-0"
              >
                Adicionar
              </button>
            </div>

            {/* List of current times */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Horários Cadastrados</label>
              {calendarTimes.map((t) => {
                const isTimeInUse = classes.some(c => c.horaSelecionada === t);
                return (
                  <div key={t} className="flex justify-between items-center bg-white/[0.01] hover:bg-white/[0.03] border border-hairline p-2.5 rounded-lg">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5"><Clock className="size-3.5 text-primary" /> {t}</span>
                    <div className="flex items-center gap-2">
                      {isTimeInUse && (
                        <span className="rounded bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 uppercase">Em Uso</span>
                      )}
                      <button
                        onClick={() => {
                          if (isTimeInUse) {
                            if (!confirm(`O horário "${t}" está sendo usado por turmas ativas. Tem certeza que deseja removê-lo?`)) {
                              return;
                            }
                          }
                          setCalendarTimes(calendarTimes.filter(item => item !== t));
                          toast.success("Horário removido da grade.");
                        }}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer bg-transparent border-0 text-xs font-semibold p-1"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
