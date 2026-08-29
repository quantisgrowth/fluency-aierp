import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Pencil,
  X,
  Calendar,
  GraduationCap,
  Flame,
  Coins,
  Trophy,
  CreditCard,
  MessageSquare,
  BookOpen,
  DollarSign,
  Clock,
  Tag,
  Check,
  Plus,
  Send,
  FileText,
  History,
  QrCode,
  Building2,
  Award,
  UserPlus,
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { StatusPill } from "@/components/kit/status-pill";
import {
  students as initialStudents,
  initialEducationalProducts,
  type EducationalProduct,
  type PricingModelType,
  brl,
  livrosTrilhas,
  classes as initialClasses,
  initialEducationalLevels,
  type EducationalLevel,
} from "@/data/mock";
import { toast } from "sonner";
import { useUser } from "@/modules/user-context";

export const Route = createFileRoute("/alunos")({
  head: () => ({
    meta: [
      { title: "Alunos & Contratos 360º — Fluency AI" },
      { name: "description", content: "Dossiê 360º, contratos por produto, frequência, notas e financeiro do aluno." },
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
  horasContratadas?: number;
  produtoId?: string;
  produtoNome?: string;
  tipoContrato?: "turma" | "hora_aula" | "pacote_fechado" | "frequencia_semanal";
  valorMensalidade?: number;
  diaVencimento?: number;
  livroEmUso?: string;
};

type AcademicNote = {
  data: string;
  texto: string;
  autor: string;
};

type BillingItem = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  situacao: "pago" | "aberto" | "atrasado";
  dataPagamento?: string;
};

type AttendanceRecord = {
  data: string;
  aula: string;
  presenca: boolean;
  justificativa?: string;
};

type SkillGrade = {
  ciclo: string;
  speaking: number;
  listening: number;
  reading: number;
  writing: number;
  mediaGeral: number;
  feedback: string;
};

type OccurrenceItem = {
  id: string;
  data: string;
  tipo: "pedagogico" | "financeiro" | "matricula" | "coordenacao";
  descricao: string;
  autor: string;
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
  frequencias: AttendanceRecord[];
  avaliacoes: SkillGrade[];
  ocorrencias: OccurrenceItem[];
};

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
      { data: "20/07/2026", texto: "Demonstrou excelente participação nos debates de atualidades.", autor: "Marcos Vidal" },
    ],
    financeiro: [
      { id: "f-1", descricao: "Mensalidade Agosto (B2)", valor: 450, vencimento: "10/08/2026", situacao: "pago", dataPagamento: "08/08/2026" },
      { id: "f-2", descricao: "Mensalidade Julho (B2)", valor: 450, vencimento: "10/07/2026", situacao: "pago", dataPagamento: "10/07/2026" },
      { id: "f-3", descricao: "Material Didático B2", valor: 280, vencimento: "15/06/2026", situacao: "pago", dataPagamento: "15/06/2026" },
    ],
    frequencias: [
      { data: "27/08/2026", aula: "Unit 8 — Phrasal Verbs in Context", presenca: true },
      { data: "25/08/2026", aula: "Unit 7 — Debate: Artificial Intelligence", presenca: true },
      { data: "20/08/2026", aula: "Unit 6 — Listening Simulation", presenca: true },
      { data: "18/08/2026", aula: "Unit 5 — Complex Grammar Structures", presenca: false, justificativa: "Compromisso médico avisado com antecedência." },
      { data: "13/08/2026", aula: "Unit 4 — Academic Writing Workshop", presenca: true },
    ],
    avaliacoes: [
      {
        ciclo: "B2.1 — Midterm",
        speaking: 9.5,
        listening: 9.0,
        reading: 9.2,
        writing: 9.0,
        mediaGeral: 9.2,
        feedback: "Excelente desenvoltura e espontaneidade. Vocabulário avançado e ótima pronúncia.",
      },
    ],
    ocorrencias: [
      { id: "oc-1", data: "12/03/2026", tipo: "matricula", descricao: "Matrícula realizada no plano Regular Semestral (Turma Conversation).", autor: "Secretaria" },
      { id: "oc-2", data: "15/08/2026", tipo: "pedagogico", descricao: "Aprovada para o estágio B2.2 com destaque de turma.", autor: "Julia Kern" },
    ],
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
      { data: "28/07/2026", texto: "Dificuldade na entrega das redações do módulo A2.", autor: "Julia Kern" },
    ],
    financeiro: [
      { id: "f-4", descricao: "Mensalidade Agosto (A2)", valor: 450, vencimento: "10/08/2026", situacao: "atrasado" },
      { id: "f-5", descricao: "Mensalidade Julho (A2)", valor: 450, vencimento: "10/07/2026", situacao: "pago", dataPagamento: "12/07/2026" },
    ],
    frequencias: [
      { data: "27/08/2026", aula: "Unit 5 — Past Continuous Drills", presenca: false },
      { data: "25/08/2026", aula: "Unit 4 — Irregular Verbs Review", presenca: false },
      { data: "20/08/2026", aula: "Unit 3 — Simple Past vs Present Perfect", presenca: true },
      { data: "18/08/2026", aula: "Unit 2 — Vocabulary Builder", presenca: true },
    ],
    avaliacoes: [
      {
        ciclo: "A2.1 — Avaliação Inicial",
        speaking: 6.5,
        listening: 7.0,
        reading: 6.0,
        writing: 5.5,
        mediaGeral: 6.3,
        feedback: "Necessita de maior dedicação aos exercícios extraclasse para fixação dos tempos verbais.",
      },
    ],
    ocorrencias: [
      { id: "oc-3", data: "04/05/2026", tipo: "matricula", descricao: "Matrícula realizada na turma Regular Noite A2.", autor: "Secretaria" },
      { id: "oc-4", data: "15/08/2026", tipo: "financeiro", descricao: "Disparo automático de cobrança via WhatsApp por 15 dias de atraso.", autor: "Sistema" },
    ],
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
      { data: "18/08/2026", texto: "Iniciou o preparatório VIP para o Cambridge C1 com excelente desempenho.", autor: "Peter Hall" },
      { data: "01/08/2026", texto: "Alcançou o topo da Liga Ouro de engajamento extraclasse.", autor: "Sistema" },
    ],
    financeiro: [
      { id: "f-6", descricao: "Pacote VIP Mensal (8h lecionadas)", valor: 650, vencimento: "05/08/2026", situacao: "pago", dataPagamento: "04/08/2026" },
      { id: "f-7", descricao: "Pacote VIP Mensal (8h lecionadas)", valor: 650, vencimento: "05/07/2026", situacao: "pago", dataPagamento: "05/07/2026" },
    ],
    frequencias: [
      { data: "26/08/2026", aula: "Sessão VIP 1-on-1 — Cambridge Essay Structure", presenca: true },
      { data: "19/08/2026", aula: "Sessão VIP 1-on-1 — Advanced Collocations", presenca: true },
      { data: "12/08/2026", aula: "Sessão VIP 1-on-1 — Speaking Part 3 & 4 Mock", presenca: true },
    ],
    avaliacoes: [
      {
        ciclo: "C1 — Simulado Cambridge",
        speaking: 9.8,
        listening: 9.5,
        reading: 9.6,
        writing: 9.2,
        mediaGeral: 9.5,
        feedback: "Desempenho excepcional. Pronta para agendar o exame oficial C1 Advanced.",
      },
    ],
    ocorrencias: [
      { id: "oc-5", data: "22/01/2026", tipo: "matricula", descricao: "Contratação do plano VIP Individual (Hora/Aula com Peter Hall).", autor: "Diretoria" },
    ],
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
      { data: "04/08/2026", texto: "Recomendado plantão de dúvidas para recuperação do conteúdo de gramática.", autor: "Coordenação" },
    ],
    financeiro: [
      { id: "f-8", descricao: "Mensalidade Agosto (A2)", valor: 450, vencimento: "15/08/2026", situacao: "aberto" },
      { id: "f-9", descricao: "Mensalidade Julho (A2)", valor: 450, vencimento: "15/07/2026", situacao: "pago", dataPagamento: "15/07/2026" },
    ],
    frequencias: [
      { data: "26/08/2026", aula: "Unit 6 — Simple Past vs Present Perfect", presenca: false },
      { data: "21/08/2026", aula: "Unit 5 — Daily Routines & Time", presenca: true },
      { data: "14/08/2026", aula: "Unit 4 — Basic Prepositions", presenca: false },
    ],
    avaliacoes: [
      {
        ciclo: "A2.1 — Parcial",
        speaking: 5.8,
        listening: 6.0,
        reading: 6.5,
        writing: 5.0,
        mediaGeral: 5.8,
        feedback: "Necessita de apoio pedagógico em gramática e mais comprometimento com a frequência.",
      },
    ],
    ocorrencias: [
      { id: "oc-6", data: "18/06/2026", tipo: "matricula", descricao: "Matrícula na turma Regular Tarde A2.", autor: "Secretaria" },
    ],
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
      { data: "14/08/2026", texto: "Excelente evolução na fluência e redução do sotaque.", autor: "Marcos Vidal" },
    ],
    financeiro: [
      { id: "f-10", descricao: "Parcela 2/6 — Pacote IELTS", valor: 466.67, vencimento: "10/08/2026", situacao: "pago", dataPagamento: "10/08/2026" },
      { id: "f-11", descricao: "Parcela 1/6 — Pacote IELTS", valor: 466.67, vencimento: "10/07/2026", situacao: "pago", dataPagamento: "09/07/2026" },
    ],
    frequencias: [
      { data: "26/08/2026", aula: "IELTS Speaking Part 2 — Topic Cards", presenca: true },
      { data: "21/08/2026", aula: "IELTS Academic Writing Task 1 (Charts)", presenca: true },
    ],
    avaliacoes: [
      {
        ciclo: "Simulado IELTS 1",
        speaking: 7.5,
        listening: 8.0,
        reading: 7.5,
        writing: 7.0,
        mediaGeral: 7.5,
        feedback: "Band Score 7.5 projetado. Excelente progressão rumo à meta do intercâmbio.",
      },
    ],
    ocorrencias: [
      { id: "oc-7", data: "09/07/2026", tipo: "matricula", descricao: "Contratação do Pacote Fechado Preparatório IELTS (60h).", autor: "Secretaria" },
    ],
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
    ],
    financeiro: [
      { id: "f-12", descricao: "Mensalidade Agosto (C1 Business)", valor: 490, vencimento: "10/08/2026", situacao: "aberto" },
      { id: "f-13", descricao: "Mensalidade Julho (C1 Business)", valor: 490, vencimento: "10/07/2026", situacao: "pago", dataPagamento: "10/07/2026" },
    ],
    frequencias: [
      { data: "27/08/2026", aula: "Business Negotiation Mock", presenca: false },
      { data: "20/08/2026", aula: "Executive Presentations & Pitch", presenca: true },
    ],
    avaliacoes: [
      {
        ciclo: "Business C1 — Módulo 1",
        speaking: 7.0,
        listening: 6.5,
        reading: 7.5,
        writing: 6.8,
        mediaGeral: 7.0,
        feedback: "Boa argumentação oral em negócios. Reforçar vocabulário de relatórios financeiros.",
      },
    ],
    ocorrencias: [
      { id: "oc-8", data: "27/02/2026", tipo: "matricula", descricao: "Matrícula no curso Business English C1.", autor: "Secretaria" },
    ],
  },
};

function AlunosPage() {
  const { currentUser } = useUser();
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:list");
      if (stored) return JSON.parse(stored);
      window.localStorage.setItem("fluency-ai:students:list", JSON.stringify(initialStudents));
      return initialStudents;
    } catch {
      return initialStudents;
    }
  });

  const [studentDetails, setStudentDetails] = useState<Record<string, StudentDetail>>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:details");
      if (stored) return JSON.parse(stored);
      window.localStorage.setItem("fluency-ai:students:details", JSON.stringify(INITIAL_DETAILS));
      return INITIAL_DETAILS;
    } catch {
      return INITIAL_DETAILS;
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:students:list", JSON.stringify(students));
    } catch {}
  }, [students]);

  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:students:details", JSON.stringify(studentDetails));
    } catch {}
  }, [studentDetails]);

  // Educational Levels
  const [levels] = useState<EducationalLevel[]>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:academic:levels");
      return stored ? JSON.parse(stored) : initialEducationalLevels;
    } catch {
      return initialEducationalLevels;
    }
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [modalityFilter, setModalityFilter] = useState<string>("todos");

  // Drawer & Modals states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewStudentOpen, setIsNewStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Drawer Active Tab
  const [activeTab, setActiveTab] = useState<"contrato" | "financeiro" | "frequencia" | "pedagogico" | "ocorrencias">(
    "contrato"
  );

  // Form states (Novo & Editar Aluno)
  const [formNome, setFormNome] = useState("");
  const [formNivel, setFormNivel] = useState("Beginner / Kids");
  const [formTurma, setFormTurma] = useState("Regular Noite");
  const [formStatus, setFormStatus] = useState("Ativo");
  const [formProdutoId, setFormProdutoId] = useState(initialEducationalProducts[0]?.id || "prod-regular");
  const [formValor, setFormValor] = useState(450);
  const [formVencimento, setFormVencimento] = useState(10);
  const [formHoras, setFormHoras] = useState(3);
  const [formWhats, setFormWhats] = useState("5511999998888");

  // Observação Pedagógica
  const [newNoteText, setNewNoteText] = useState("");

  // Safe fallback ensuring 360 dossier ALWAYS opens instantly for ANY student
  const getSafeStudentDetails = (student: Student): StudentDetail => {
    if (studentDetails[student.nome]) {
      return studentDetails[student.nome];
    }

    return {
      presenca: 92,
      tarefas: 88,
      streak: 4,
      coins: 140,
      xp: 820,
      liga: "Prata",
      whats: formWhats || "5511999998888",
      historico: [
        {
          data: student.inicio || new Date().toLocaleDateString("pt-BR"),
          texto: `Matrícula regularizada no curso "${student.produtoNome || "Inglês Regular"}".`,
          autor: "Secretaria Acadêmica",
        },
      ],
      financeiro: [
        {
          id: `f-${Date.now()}-1`,
          descricao: `Mensalidade Vigente (${student.nivel})`,
          valor: student.valorMensalidade || 450,
          vencimento: `${student.diaVencimento || 10}/08/2026`,
          situacao: student.status === "Inadimplente" ? "atrasado" : "pago",
          dataPagamento: student.status === "Inadimplente" ? undefined : "05/08/2026",
        },
        {
          id: `f-${Date.now()}-2`,
          descricao: `Taxa de Material Didático`,
          valor: 280,
          vencimento: "15/07/2026",
          situacao: "pago",
          dataPagamento: "15/07/2026",
        },
      ],
      frequencias: [
        { data: "27/08/2026", aula: "Unit 4 — Active Listening & Dialogue", presenca: true },
        { data: "20/08/2026", aula: "Unit 3 — Essential Grammar Review", presenca: true },
        { data: "13/08/2026", aula: "Unit 2 — Vocabulary Expansion", presenca: true },
      ],
      avaliacoes: [
        {
          ciclo: `Avaliação Diagnóstica (${student.nivel})`,
          speaking: 8.5,
          listening: 8.0,
          reading: 8.5,
          writing: 8.0,
          mediaGeral: 8.3,
          feedback: "Excelente participação e desenvoltura nas atividades práticas.",
        },
      ],
      ocorrencias: [
        {
          id: `oc-${Date.now()}`,
          data: student.inicio || new Date().toLocaleDateString("pt-BR"),
          tipo: "matricula",
          descricao: `Contrato ativado no plano ${student.produtoNome || "Regular"}.`,
          autor: "Secretaria",
        },
      ],
    };
  };

  const selectedDetails = selectedStudent ? getSafeStudentDetails(selectedStudent) : null;

  // Open Drawer / Modal Handlers
  const handleOpenDrawer = (s: Student) => {
    setSelectedStudent(s);
    setActiveTab("contrato");
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setSelectedStudent(s);
    setFormNome(s.nome);
    setFormNivel(s.nivel);
    setFormTurma(s.turma);
    setFormStatus(s.status);
    setFormProdutoId(s.produtoId || "prod-regular");
    setFormValor(s.valorMensalidade || 450);
    setFormVencimento(s.diaVencimento || 10);
    setFormHoras(s.horasContratadas || 3);
    setIsEditOpen(true);
  };

  const handleOpenNewStudent = () => {
    const defaultProduct = initialEducationalProducts[0];
    setFormNome("");
    setFormNivel(levels[0]?.nome || "Beginner / Kids");
    setFormTurma(initialClasses[0]?.nome || "Regular Noite");
    setFormStatus("Ativo");
    setFormProdutoId(defaultProduct?.id || "prod-regular");
    setFormValor(defaultProduct?.valorBase || 450);
    setFormVencimento(10);
    setFormHoras(defaultProduct?.cargaHorariaSemanal || 3);
    setFormWhats("5511999998888");
    setIsNewStudentOpen(true);
  };

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      toast.error("Informe o nome do aluno.");
      return;
    }

    const chosenProduct = initialEducationalProducts.find((p) => p.id === formProdutoId);

    const newStudent: Student = {
      nome: formNome.trim(),
      nivel: formNivel,
      turma: formTurma,
      inicio: new Date().toLocaleDateString("pt-BR"),
      status: formStatus,
      produtoId: formProdutoId,
      produtoNome: chosenProduct?.nome || "Curso de Idiomas",
      tipoContrato:
        chosenProduct?.modalidade === "hora_aula"
          ? "hora_aula"
          : chosenProduct?.modalidade === "pacote_fechado"
          ? "pacote_fechado"
          : "turma",
      valorMensalidade: Number(formValor),
      diaVencimento: Number(formVencimento),
      horasContratadas: Number(formHoras),
      livroEmUso: chosenProduct?.livroPadraoNome || "Material Didático",
    };

    setStudents([newStudent, ...students]);

    // Criar ficha no details
    const newDetails: StudentDetail = {
      presenca: 100,
      tarefas: 100,
      streak: 1,
      coins: 100,
      xp: 500,
      liga: "Bronze",
      whats: formWhats,
      historico: [
        {
          data: new Date().toLocaleDateString("pt-BR"),
          texto: `Matrícula confirmada no plano ${newStudent.produtoNome}.`,
          autor: currentUser?.nome || "Secretaria",
        },
      ],
      financeiro: [
        {
          id: `f-${Date.now()}`,
          descricao: `Mensalidade Inicial (${newStudent.nivel})`,
          valor: Number(formValor),
          vencimento: `${formVencimento}/09/2026`,
          situacao: "aberto",
        },
      ],
      frequencias: [],
      avaliacoes: [],
      ocorrencias: [
        {
          id: `oc-${Date.now()}`,
          data: new Date().toLocaleDateString("pt-BR"),
          tipo: "matricula",
          descricao: `Matrícula efetuada no curso ${newStudent.produtoNome} (Turma: ${newStudent.turma}).`,
          autor: currentUser?.nome || "Secretaria",
        },
      ],
    };

    setStudentDetails({
      ...studentDetails,
      [newStudent.nome]: newDetails,
    });

    setIsNewStudentOpen(false);
    toast.success(`Aluno "${newStudent.nome}" matriculado com sucesso!`);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const chosenProduct = initialEducationalProducts.find((p) => p.id === formProdutoId);

    const updatedStudents = students.map((s) =>
      s.nome === selectedStudent.nome
        ? {
            ...s,
            nome: formNome,
            nivel: formNivel,
            turma: formTurma,
            status: formStatus,
            produtoId: formProdutoId,
            produtoNome: chosenProduct?.nome || "Curso de Idiomas",
            tipoContrato:
              chosenProduct?.modalidade === "hora_aula"
                ? ("hora_aula" as const)
                : chosenProduct?.modalidade === "pacote_fechado"
                ? ("pacote_fechado" as const)
                : ("turma" as const),
            valorMensalidade: Number(formValor),
            diaVencimento: Number(formVencimento),
            horasContratadas: Number(formHoras),
          }
        : s
    );

    setStudents(updatedStudents);

    // Se mudou o nome, atualizar chave no details
    if (formNome !== selectedStudent.nome && studentDetails[selectedStudent.nome]) {
      const copy = { ...studentDetails };
      copy[formNome] = copy[selectedStudent.nome];
      delete copy[selectedStudent.nome];
      setStudentDetails(copy);
    }

    setIsEditOpen(false);
    toast.success(`Matrícula de "${formNome}" atualizada com sucesso!`);
  };

  const handleAddPedagogicalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newNoteText.trim()) return;

    const newNote: AcademicNote = {
      data: new Date().toLocaleDateString("pt-BR"),
      texto: newNoteText.trim(),
      autor: currentUser?.nome || "Coordenação Pedagógica",
    };

    const currentDetails = getSafeStudentDetails(selectedStudent);

    const updated = {
      ...studentDetails,
      [selectedStudent.nome]: {
        ...currentDetails,
        historico: [newNote, ...(currentDetails.historico || [])],
      },
    };

    setStudentDetails(updated);
    setNewNoteText("");
    toast.success("Observação pedagógica registrada no prontuário!");
  };

  const handleMarkBillAsPaid = (billId: string, studentName: string) => {
    const student = students.find((s) => s.nome === studentName);
    if (!student) return;

    const currentDetails = getSafeStudentDetails(student);

    const updatedBills = currentDetails.financeiro.map((b) =>
      b.id === billId
        ? {
            ...b,
            situacao: "pago" as const,
            dataPagamento: new Date().toLocaleDateString("pt-BR"),
          }
        : b
    );

    const updated = {
      ...studentDetails,
      [studentName]: {
        ...currentDetails,
        financeiro: updatedBills,
        ocorrencias: [
          {
            id: `oc-${Date.now()}`,
            data: new Date().toLocaleDateString("pt-BR"),
            tipo: "financeiro" as const,
            descricao: `Baixa manual registrada na fatura #${billId}.`,
            autor: currentUser?.nome || "Financeiro",
          },
          ...(currentDetails.ocorrencias || []),
        ],
      },
    };

    setStudentDetails(updated);
    toast.success("Baixa de pagamento efetuada com sucesso!");
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.turma.toLowerCase().includes(search.toLowerCase()) ||
      s.nivel.toLowerCase().includes(search.toLowerCase()) ||
      (s.produtoNome && s.produtoNome.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "todos" || s.status === statusFilter;
    const matchModality = modalityFilter === "todos" || s.tipoContrato === modalityFilter;

    return matchSearch && matchStatus && matchModality;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300 pb-12">
      <SectionHeader
        eyebrow="Pedagógico & Contratos"
        title="Gestão de Alunos & Dossiê 360º"
        description="Acompanhe o contrato de cada aluno (turma regular, hora-aula VIP ou pacote), histórico financeiro, frequência, notas e linha do tempo."
      />

      {/* Top Controls & Search Card */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nome, turma, nível ou curso contratado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {/* Modality Filter */}
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="h-10 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
          >
            <option value="todos">Todos os Formatos</option>
            <option value="turma">Turma Regular</option>
            <option value="hora_aula">VIP / Hora-Aula</option>
            <option value="pacote_fechado">Pacote Fechado</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
          >
            <option value="todos">Todas as Situações</option>
            <option value="Ativo">Ativos</option>
            <option value="Inadimplente">Inadimplentes</option>
            <option value="Em risco">Em Risco de Evasão</option>
          </select>

          {/* Botão + Novo Aluno */}
          <button
            onClick={handleOpenNewStudent}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="size-4" /> + Nova Matrícula
          </button>
        </div>
      </GlassCard>

      {/* Students List Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hairline bg-surface/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5 font-bold">Aluno</th>
                <th className="px-6 py-3.5 font-bold">Nível CEFR</th>
                <th className="px-6 py-3.5 font-bold">Curso / Produto Contratado</th>
                <th className="px-6 py-3.5 font-bold">Turma / Horário</th>
                <th className="px-6 py-3.5 font-bold">Mensalidade</th>
                <th className="px-6 py-3.5 font-bold">Situação</th>
                <th className="px-6 py-3.5 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr
                    key={s.nome}
                    onClick={() => handleOpenDrawer(s)}
                    className="hover:bg-surface/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          {s.nome.charAt(0)}
                        </span>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{s.nome}</p>
                          <p className="text-[10px] text-muted-foreground">Início: {s.inicio}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 font-bold text-foreground">
                        {s.nivel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{s.produtoNome || "Inglês Regular"}</p>
                        <span
                          className={`inline-flex rounded px-1.5 py-0.2 text-[9px] font-bold uppercase border ${
                            s.tipoContrato === "hora_aula"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : s.tipoContrato === "pacote_fechado"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {s.tipoContrato === "hora_aula"
                            ? "VIP Hora/Aula"
                            : s.tipoContrato === "pacote_fechado"
                            ? "Pacote Semestral"
                            : "Turma Regular"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{s.turma}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {brl(s.valorMensalidade || 450)}
                      <span className="text-[9px] font-normal text-muted-foreground block">
                        {s.tipoContrato === "hora_aula"
                          ? `${s.horasContratadas || 2}h/sem contratadas`
                          : `Vence dia ${s.diaVencimento || 10}`}
                      </span>
                    </td>
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
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(s)}
                          title="Abrir Dossiê 360º"
                          className="px-3 py-1.5 rounded-lg border border-hairline hover:border-primary hover:bg-primary/10 text-foreground transition-all cursor-pointer font-bold flex items-center gap-1 bg-surface/50"
                        >
                          <Eye className="size-3.5 text-primary" /> Ficha 360º
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          title="Editar Contrato & Dados"
                          className="p-1.5 rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-surface/50"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum aluno encontrado correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* MODAL: NOVA MATRÍCULA / ALUNO */}
      {/* ========================================================================= */}
      {isNewStudentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative border-primary/30 text-foreground max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewStudentOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Nova Matrícula de Aluno</h3>
                <p className="text-xs text-muted-foreground">Cadastre o aluno e vincule ao curso contratado.</p>
              </div>
            </div>

            <form onSubmit={handleCreateStudentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nome Completo do Aluno *
                </label>
                <input
                  placeholder="Ex: Gabriel Santos"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  WhatsApp para Contato
                </label>
                <input
                  placeholder="Ex: 5511999998888"
                  value={formWhats}
                  onChange={(e) => setFormWhats(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-mono"
                />
              </div>

              {/* Course Product Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Curso / Produto Educacional Contratado
                </label>
                <select
                  value={formProdutoId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setFormProdutoId(nextId);
                    const prod = initialEducationalProducts.find((p) => p.id === nextId);
                    if (prod) {
                      setFormValor(prod.valorBase);
                      setFormHoras(prod.cargaHorariaSemanal);
                      setFormNivel(prod.nivel);
                    }
                  }}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                >
                  {initialEducationalProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.modalidade === "hora_aula" ? "VIP Hora/Aula" : p.modalidade === "pacote_fechado" ? "Pacote Semestral" : "Turma Regular"}) — {brl(p.valorBase)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nível CEFR
                  </label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.nome}>
                        {lvl.codigo} - {lvl.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValor}
                    onChange={(e) => setFormValor(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Dia Venc.
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formVencimento}
                    onChange={(e) => setFormVencimento(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Turma Alocada
                </label>
                <select
                  value={formTurma}
                  onChange={(e) => setFormTurma(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                >
                  <option value="VIP Individual">VIP Individual (Sem Turma Coletiva)</option>
                  {initialClasses.map((c) => (
                    <option key={c.nome} value={c.nome}>
                      {c.nome} (Nível {c.nivel} · {c.salaNome})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsNewStudentOpen(false)}
                  className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR MATRÍCULA DO ALUNO */}
      {/* ========================================================================= */}
      {isEditOpen && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative border-primary/30 text-foreground max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Pencil className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Editar Contrato & Matrícula do Aluno</h3>
                <p className="text-[10px] text-muted-foreground">Altere o produto contratado, turma, valor e nível CEFR.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-medium"
                  required
                />
              </div>

              {/* Course Product Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Curso / Produto Educacional Contratado
                </label>
                <select
                  value={formProdutoId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setFormProdutoId(nextId);
                    const prod = initialEducationalProducts.find((p) => p.id === nextId);
                    if (prod) {
                      setFormValor(prod.valorBase);
                      setFormHoras(prod.cargaHorariaSemanal);
                    }
                  }}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                >
                  {initialEducationalProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.modalidade === "hora_aula" ? "VIP Hora/Aula" : p.modalidade === "pacote_fechado" ? "Pacote Semestral" : "Turma Regular"}) — {brl(p.valorBase)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Proficiência CEFR
                  </label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.nome}>
                        {lvl.codigo} - {lvl.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValor}
                    onChange={(e) => setFormValor(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Dia Venc.
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formVencimento}
                    onChange={(e) => setFormVencimento(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Turma Vinculada
                  </label>
                  <select
                    value={formTurma}
                    onChange={(e) => setFormTurma(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    <option value="VIP Individual">VIP Individual (Sem Turma Coletiva)</option>
                    {initialClasses.map((c) => (
                      <option key={c.nome} value={c.nome}>
                        {c.nome} (Nível {c.nivel} · {c.salaNome})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Situação
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inadimplente">Inadimplente</option>
                    <option value="Em risco">Em risco de evasão</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GAVETA / DRAWER: DOSSIÊ 360º COMPLETO DO ALUNO */}
      {/* ========================================================================= */}
      {isDrawerOpen && selectedStudent && selectedDetails && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-3xl h-full border-l border-hairline bg-popover text-foreground p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 relative">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-5" />
            </button>

            {/* Profile Drawer Header */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                    {selectedStudent.produtoNome || "Curso Regular"}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    {selectedStudent.turma}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mt-1">{selectedStudent.nome}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aluno matriculado desde <strong>{selectedStudent.inicio}</strong>
                </p>
              </div>

              {/* Badges / Quick actions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-hairline bg-surface px-2.5 py-0.5 text-xs font-bold text-foreground">
                  Nível CEFR {selectedStudent.nivel}
                </span>
                <StatusPill
                  tone={
                    selectedStudent.status === "Ativo"
                      ? "paid"
                      : selectedStudent.status === "Inadimplente"
                      ? "overdue"
                      : "due"
                  }
                >
                  {selectedStudent.status}
                </StatusPill>
                <a
                  href={`https://wa.me/${selectedDetails.whats}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-paid/20 bg-paid/10 px-3 py-1 text-xs font-semibold text-paid hover:bg-paid/20 transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="size-3.5" /> WhatsApp
                </a>
              </div>

              {/* 5-Tab Navigation Bar */}
              <div className="flex border-b border-hairline gap-2 overflow-x-auto scrollbar-none pb-0.5">
                {(
                  [
                    { key: "contrato", label: "Contrato & Matrícula", icon: FileText },
                    { key: "financeiro", label: "Financeiro & Faturas", icon: CreditCard },
                    { key: "frequencia", label: "Frequência & Presença", icon: Calendar },
                    { key: "pedagogico", label: "Notas & Desempenho", icon: GraduationCap },
                    { key: "ocorrencias", label: "Linha do Tempo 360º", icon: History },
                  ] as const
                ).map((tabItem) => {
                  const Icon = tabItem.icon;
                  const isActive = activeTab === tabItem.key;

                  return (
                    <button
                      key={tabItem.key}
                      onClick={() => setActiveTab(tabItem.key)}
                      className={`px-3 py-2 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap bg-transparent border-0 ${
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" /> {tabItem.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Drawer Body */}
            <div className="flex-1 py-5 overflow-y-auto">
              
              {/* TAB 1: CONTRATO & PRODUTO CONTRATADO */}
              {activeTab === "contrato" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <GlassCard className="p-4 space-y-1.5 border-primary/20">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Curso / Produto</span>
                      <p className="text-sm font-bold text-foreground">{selectedStudent.produtoNome || "Inglês Regular"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Modalidade:{" "}
                        <strong className="text-primary uppercase">
                          {selectedStudent.tipoContrato === "hora_aula"
                            ? "VIP Hora/Aula"
                            : selectedStudent.tipoContrato === "pacote_fechado"
                            ? "Pacote Semestral"
                            : "Turma Regular"}
                        </strong>
                      </p>
                    </GlassCard>

                    <GlassCard className="p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Mensalidade & Vencimento</span>
                      <p className="text-sm font-bold text-foreground">{brl(selectedStudent.valorMensalidade || 450)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Vencimento todo <strong>dia {selectedStudent.diaVencimento || 10}</strong> de cada mês
                      </p>
                    </GlassCard>

                    <GlassCard className="p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Turma & Carga Horária</span>
                      <p className="text-sm font-bold text-foreground">{selectedStudent.turma}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Carga Contratada: <strong>{selectedStudent.horasContratadas || 3} horas / semana</strong>
                      </p>
                    </GlassCard>

                    <GlassCard className="p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Livro Didático em Uso</span>
                      <p className="text-sm font-bold text-foreground">{selectedStudent.livroEmUso || "Pathway to Fluency B2"}</p>
                      <p className="text-[11px] text-muted-foreground">Nível CEFR correspondente: {selectedStudent.nivel}</p>
                    </GlassCard>
                  </div>

                  <div className="rounded-xl border border-hairline bg-surface/30 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Ações de Contrato</h4>
                      <button
                        onClick={() => handleOpenEdit(selectedStudent)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer transition-all"
                      >
                        Transferir / Trocar de Plano
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Ao trocar de modalidade (ex: de Turma para VIP Hora-Aula), o sistema recalcula automaticamente a previsão de faturamento no DRE gerencial e atualiza a alocação nas salas.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCEIRO & MENSALIDADES */}
              {activeTab === "financeiro" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Extrato de Cobranças do Aluno</h4>
                      <p className="text-[11px] text-muted-foreground">Histórico de faturas, pagamentos e baixas.</p>
                    </div>
                    <span className="rounded-md bg-surface border border-hairline px-2.5 py-1 text-xs font-bold text-foreground">
                      Mensalidade: {brl(selectedStudent.valorMensalidade || 450)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedDetails.financeiro.map((bill) => (
                      <div
                        key={bill.id}
                        className="p-3.5 rounded-xl border border-hairline bg-surface-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">{bill.descricao}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Vencimento: {bill.vencimento}</span>
                            {bill.dataPagamento && <span className="text-paid font-semibold">· Pago em: {bill.dataPagamento}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="text-xs font-bold text-foreground">{brl(bill.valor)}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                              bill.situacao === "pago"
                                ? "bg-paid/10 border-paid/20 text-paid"
                                : bill.situacao === "atrasado"
                                ? "bg-overdue/10 border-overdue/20 text-overdue"
                                : "bg-due/10 border-due/20 text-due"
                            }`}
                          >
                            {bill.situacao}
                          </span>

                          {bill.situacao !== "pago" && (
                            <button
                              onClick={() => handleMarkBillAsPaid(bill.id, selectedStudent.nome)}
                              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              Dar Baixa
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: FREQUÊNCIA & ASSIDUIDADE */}
              {activeTab === "frequencia" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <GlassCard className="p-4 space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Assiduidade Geral</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{selectedDetails.presenca}%</span>
                        <span className={`text-[10px] font-semibold ${selectedDetails.presenca >= 85 ? "text-paid" : "text-overdue"}`}>
                          {selectedDetails.presenca >= 85 ? "Presença Satisfatória" : "Abaixo da meta (75%)"}
                        </span>
                      </div>
                    </GlassCard>

                    <GlassCard className="p-4 space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Tarefas Entregues</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{selectedDetails.tarefas}%</span>
                        <span className="text-[10px] text-paid font-semibold">Lições de Casa OK</span>
                      </div>
                    </GlassCard>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Histórico de Presenças em Aulas</h4>
                    <div className="divide-y divide-hairline rounded-xl border border-hairline bg-surface/30">
                      {selectedDetails.frequencias.map((att, i) => (
                        <div key={i} className="p-3 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">{att.aula}</p>
                            <p className="text-[10px] text-muted-foreground">{att.data}</p>
                            {att.justificativa && (
                              <p className="text-[10px] text-amber-400 italic">Justificativa: {att.justificativa}</p>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${
                              att.presenca
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {att.presenca ? "Presente" : "Falta"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NOTAS & DESEMPENHO CEFR */}
              {activeTab === "pedagogico" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Skill Grades */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Boletim por Habilidade (CEFR)</h4>
                    {selectedDetails.avaliacoes.map((av, i) => (
                      <GlassCard key={i} className="p-4 space-y-3 border-primary/20">
                        <div className="flex justify-between items-center border-b border-hairline pb-2">
                          <span className="font-bold text-xs text-foreground">{av.ciclo}</span>
                          <span className="text-xs font-extrabold text-primary">Média Geral: {av.mediaGeral}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded bg-surface border border-hairline">
                            <p className="text-[9px] text-muted-foreground font-bold">Speaking</p>
                            <p className="font-extrabold text-foreground text-sm">{av.speaking}</p>
                          </div>
                          <div className="p-2 rounded bg-surface border border-hairline">
                            <p className="text-[9px] text-muted-foreground font-bold">Listening</p>
                            <p className="font-extrabold text-foreground text-sm">{av.listening}</p>
                          </div>
                          <div className="p-2 rounded bg-surface border border-hairline">
                            <p className="text-[9px] text-muted-foreground font-bold">Reading</p>
                            <p className="font-extrabold text-foreground text-sm">{av.reading}</p>
                          </div>
                          <div className="p-2 rounded bg-surface border border-hairline">
                            <p className="text-[9px] text-muted-foreground font-bold">Writing</p>
                            <p className="font-extrabold text-foreground text-sm">{av.writing}</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground italic bg-surface/40 p-2 rounded border border-hairline">
                          "{av.feedback}"
                        </p>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Teacher Feedback Notes */}
                  <div className="space-y-3">
                    <form onSubmit={handleAddPedagogicalNote} className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Inserir Feedback do Professor / Coordenação
                      </label>
                      <div className="flex gap-2">
                        <input
                          placeholder="Ex: Excelente evolução na fluência oral..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          className="h-10 flex-1 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                          required
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer shrink-0"
                        >
                          Salvar Feedback
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {selectedDetails.historico.map((h, i) => (
                        <div key={i} className="p-3 rounded-lg border border-hairline bg-surface-elevated/40 space-y-1 text-xs">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">{h.autor}</span>
                            <span>{h.data}</span>
                          </div>
                          <p className="text-foreground leading-relaxed">{h.texto}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LINHA DO TEMPO 360º & OCORRÊNCIAS */}
              {activeTab === "ocorrencias" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Linha do Tempo & Ocorrências da Matrícula
                  </h4>
                  <div className="space-y-3">
                    {selectedDetails.ocorrencias.map((oc) => (
                      <div key={oc.id} className="p-3.5 rounded-xl border border-hairline bg-surface/30 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">
                            {oc.tipo}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{oc.data}</span>
                        </div>
                        <p className="text-foreground font-medium pt-1">{oc.descricao}</p>
                        <p className="text-[10px] text-muted-foreground">Registrado por: {oc.autor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer footer controls */}
            <div className="pt-4 border-t border-hairline flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">
                Prontuário Acadêmico & Contratual Seguro Fluency AI
              </span>
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
