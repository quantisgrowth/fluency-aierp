import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  Plus,
  X,
  Check,
  Copy,
  FileText,
  Layout,
  MessageSquare,
  Share2,
  Code,
  AlertTriangle,
  Star,
  Play,
  ArrowRight,
  Users,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Award,
  BookOpen,
  Mail,
  Phone
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { ModuleGate } from "@/components/module-gate";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend
} from "recharts";

export const Route = createFileRoute("/captacao")({
  head: () => ({
    meta: [
      { title: "Captação & Testes — Fluency AI" },
      { name: "description", content: "Criador de formulários estilo Tally, testes de nivelamento CEFR e captura de leads." },
    ],
  }),
  component: CaptacaoPage,
});

type Question = {
  id: string;
  enunciado: string;
  nivel: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  correta: "A" | "B" | "C" | "D";
};

type Submission = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  score: number;
  total: number;
  level: string;
  date: string;
  respostas?: Record<string, string>;
};

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "q-1",
    enunciado: "Choose the correct sentence to complete: 'She ___ to the gym every morning.'",
    nivel: "A1",
    opcaoA: "go",
    opcaoB: "goes",
    opcaoC: "going",
    opcaoD: "gone",
    correta: "B"
  },
  {
    id: "q-2",
    enunciado: "I went to London ___ last week.",
    nivel: "A2",
    opcaoA: "at",
    opcaoB: "on",
    opcaoC: "-",
    opcaoD: "in",
    correta: "C"
  },
  {
    id: "q-3",
    enunciado: "If it rains tomorrow, we ___ go to the beach.",
    nivel: "B1",
    opcaoA: "wouldn't",
    opcaoB: "won't",
    opcaoC: "didn't",
    opcaoD: "wouldn't have",
    correta: "B"
  },
  {
    id: "q-4",
    enunciado: "I would have bought that car if I ___ enough money.",
    nivel: "B2",
    opcaoA: "had had",
    opcaoB: "have had",
    opcaoC: "had",
    opcaoD: "would have",
    correta: "A"
  },
  {
    id: "q-5",
    enunciado: "Hardly ___ entered the room when the phone rang.",
    nivel: "C1",
    opcaoA: "had I",
    opcaoB: "I had",
    opcaoC: "did I",
    opcaoD: "I did",
    correta: "A"
  }
];

const DEFAULT_SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    nome: "Fernanda Dias",
    email: "fernanda.dias@gmail.com",
    telefone: "+55 (11) 98888-7777",
    score: 4,
    total: 5,
    level: "B2 - Upper Intermediate",
    date: "2026-08-19T10:15:00.000Z",
    respostas: {
      "q-1": "B",
      "q-2": "C",
      "q-3": "B",
      "q-4": "A",
      "q-5": "B"
    }
  },
  {
    id: "sub-2",
    nome: "Otávio Prado",
    email: "otavio.prado@yahoo.com",
    telefone: "+55 (21) 97777-6666",
    score: 2,
    total: 5,
    level: "A2 - Elementary",
    date: "2026-08-18T14:30:00.000Z",
    respostas: {
      "q-1": "B",
      "q-2": "C",
      "q-3": "A",
      "q-4": "B",
      "q-5": "B"
    }
  },
  {
    id: "sub-3",
    nome: "Juliana Mendes",
    email: "juliana.mendes@outlook.com",
    telefone: "+55 (31) 96666-5555",
    score: 5,
    total: 5,
    level: "C1 - Advanced",
    date: "2026-08-17T09:00:00.000Z",
    respostas: {
      "q-1": "B",
      "q-2": "C",
      "q-3": "B",
      "q-4": "A",
      "q-5": "A"
    }
  }
];

function CaptacaoPage() {
  const [activeTab, setActiveTab] = useState<"gerenciador" | "editor" | "respostas" | "playground">("gerenciador");
  
  // Data lists
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [submissions, setSubmissions] = useState<Submission[]>(DEFAULT_SUBMISSIONS);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Active & Premium states
  const [isNivelamentoActive, setIsNivelamentoActive] = useState(true);
  const [isMatriculaActive, setIsMatriculaActive] = useState(false);
  const [isMatriculaUnlocked, setIsMatriculaUnlocked] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Submission | null>(null);

  // Editor modal/creation states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  // Question Form states
  const [formEnunciado, setFormEnunciado] = useState("");
  const [formNivel, setFormNivel] = useState("A1");
  const [formOpcaoA, setFormOpcaoA] = useState("");
  const [formOpcaoB, setFormOpcaoB] = useState("");
  const [formOpcaoC, setFormOpcaoC] = useState("");
  const [formOpcaoD, setFormOpcaoD] = useState("");
  const [formCorreta, setFormCorreta] = useState<"A" | "B" | "C" | "D">("A");

  // Simulator / Playground Wizard states
  const [simStep, setSimStep] = useState(0); // 0 = start, 1..5 = questions, 6 = lead capture, 7 = results
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simPhone, setSimPhone] = useState("+55 ");
  const [calculatedLevel, setCalculatedLevel] = useState("");
  const [calculatedScore, setCalculatedScore] = useState(0);

  // Load from local storage
  useEffect(() => {
    try {
      const storedQuestions = window.localStorage.getItem("fluency-ai:captacao:questions");
      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
      } else {
        window.localStorage.setItem("fluency-ai:captacao:questions", JSON.stringify(DEFAULT_QUESTIONS));
      }

      const storedSubmissions = window.localStorage.getItem("fluency-ai:captacao:submissions");
      if (storedSubmissions) {
        setSubmissions(JSON.parse(storedSubmissions));
      } else {
        window.localStorage.setItem("fluency-ai:captacao:submissions", JSON.stringify(DEFAULT_SUBMISSIONS));
      }

      // Load active status and premium status
      const activeNivel = window.localStorage.getItem("fluency-ai:captacao:formStatus:nivelamento");
      setIsNivelamentoActive(activeNivel !== null ? JSON.parse(activeNivel) : true);

      const activeMatricula = window.localStorage.getItem("fluency-ai:captacao:formStatus:matricula");
      setIsMatriculaActive(activeMatricula !== null ? JSON.parse(activeMatricula) : false);

      const unlockedMatricula = window.localStorage.getItem("fluency-ai:captacao:premium-unlocked");
      setIsMatriculaUnlocked(unlockedMatricula !== null ? JSON.parse(unlockedMatricula) : false);
    } catch {
      /* ignore */
    }
  }, []);

  // Save changes
  const saveQuestionsList = (next: Question[]) => {
    setQuestions(next);
    try {
      window.localStorage.setItem("fluency-ai:captacao:questions", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const saveSubmissionsList = (next: Submission[]) => {
    setSubmissions(next);
    try {
      window.localStorage.setItem("fluency-ai:captacao:submissions", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  // Toggle handlers
  const toggleNivelamento = () => {
    const next = !isNivelamentoActive;
    setIsNivelamentoActive(next);
    try {
      window.localStorage.setItem("fluency-ai:captacao:formStatus:nivelamento", JSON.stringify(next));
      toast.success(next ? "Teste de Nivelamento ativado!" : "Teste de Nivelamento desativado!");
    } catch {
      /* ignore */
    }
  };

  const toggleMatricula = () => {
    const next = !isMatriculaActive;
    setIsMatriculaActive(next);
    try {
      window.localStorage.setItem("fluency-ai:captacao:formStatus:matricula", JSON.stringify(next));
      toast.success(next ? "Formulário de Pré-Matrícula ativado!" : "Formulário de Pré-Matrícula desativado!");
    } catch {
      /* ignore */
    }
  };

  const unlockMatriculaModule = () => {
    setIsMatriculaUnlocked(true);
    setIsMatriculaActive(true);
    setIsUnlockModalOpen(false);
    try {
      window.localStorage.setItem("fluency-ai:captacao:premium-unlocked", JSON.stringify(true));
      window.localStorage.setItem("fluency-ai:captacao:formStatus:matricula", JSON.stringify(true));
      toast.success("Módulo Premium Pré-Matrícula Online ativado com sucesso!");
    } catch {
      /* ignore */
    }
  };

  // Reusable custom toggle switch component
  const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-emerald-500" : "bg-zinc-700"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    );
  };

  // Question handlers
  const handleOpenAddQuestion = () => {
    setSelectedQuestion(null);
    setFormEnunciado("");
    setFormNivel("A1");
    setFormOpcaoA("");
    setFormOpcaoB("");
    setFormOpcaoC("");
    setFormOpcaoD("");
    setFormCorreta("A");
    setIsEditModalOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setSelectedQuestion(q);
    setFormEnunciado(q.enunciado);
    setFormNivel(q.nivel);
    setFormOpcaoA(q.opcaoA);
    setFormOpcaoB(q.opcaoB);
    setFormOpcaoC(q.opcaoC);
    setFormOpcaoD(q.opcaoD);
    setFormCorreta(q.correta);
    setIsEditModalOpen(true);
  };

  const handleDeleteQuestion = (id: string) => {
    const next = questions.filter((q) => q.id !== id);
    saveQuestionsList(next);
    toast.success("Questão excluída com sucesso.");
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestion) {
      // Edit
      const next = questions.map((q) =>
        q.id === selectedQuestion.id
          ? {
              ...q,
              enunciado: formEnunciado,
              nivel: formNivel,
              opcaoA: formOpcaoA,
              opcaoB: formOpcaoB,
              opcaoC: formOpcaoC,
              opcaoD: formOpcaoD,
              correta: formCorreta,
            }
          : q
      );
      saveQuestionsList(next);
      toast.success("Questão atualizada com sucesso.");
    } else {
      // Create
      const newQ: Question = {
        id: "q-" + Date.now(),
        enunciado: formEnunciado,
        nivel: formNivel,
        opcaoA: formOpcaoA,
        opcaoB: formOpcaoB,
        opcaoC: formOpcaoC,
        opcaoD: formOpcaoD,
        correta: formCorreta,
      };
      saveQuestionsList([...questions, newQ]);
      toast.success("Nova questão inserida na grade.");
    }
    setIsEditModalOpen(false);
  };

  // Play test simulator submissions
  const handleSelectAnswer = (qId: string, value: string) => {
    setSimAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleNextSim = () => {
    setSimStep((prev) => prev + 1);
  };

  const handleStartSim = () => {
    setSimStep(1);
    setSimAnswers({});
    setSimName("");
    setSimEmail("");
    setSimPhone("+55 ");
  };

  const handleFinishSim = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evaluate score
    let correct = 0;
    questions.forEach((q) => {
      if (simAnswers[q.id] === q.correta) {
        correct++;
      }
    });

    // Score classification
    let level = "A1 - Beginner";
    if (correct === 2) level = "A2 - Elementary";
    if (correct === 3) level = "B1 - Intermediate";
    if (correct === 4) level = "B2 - Upper Intermediate";
    if (correct === 5) level = "C1/C2 - Advanced/Proficient";

    setCalculatedScore(correct);
    setCalculatedLevel(level);

    // Save submission
    const newSub: Submission = {
      id: "sub-" + Date.now(),
      nome: simName,
      email: simEmail,
      telefone: simPhone,
      score: correct,
      total: questions.length,
      level: level,
      date: new Date().toISOString(),
    };

    const nextSubs = [newSub, ...submissions];
    saveSubmissionsList(nextSubs);

    // Inject into Leads DB
    try {
      const rawLeads = window.localStorage.getItem("fluency-ai:leads-db");
      let currentLeads = [];
      if (rawLeads) {
        currentLeads = JSON.parse(rawLeads);
      }
      const newLead = {
        id: "lead-" + Date.now(),
        nome: simName,
        tags: ["Teste de Nível", level.split(" ")[0]],
        telefone: simPhone,
        email: simEmail,
        site: "",
        documento: "",
        empresa: "Fluency Forms",
        origem: "Teste de Nivelamento (Forms)",
        dataNascimento: "",
        responsavel: "Autônomo",
        fezTesteNivel: true,
        pais: "Brasil",
        cep: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
        anotacoes: `Lead captado automaticamente através do formulário de nivelamento. Resultado: ${level} (${correct}/${questions.length} corretas).`,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem("fluency-ai:leads-db", JSON.stringify([...currentLeads, newLead]));
    } catch (e) {
      console.error(e);
    }

    // Inject into CRM Stages
    try {
      const rawStages = window.localStorage.getItem("fluency-ai:crm:stages");
      if (rawStages) {
        const currentStages = JSON.parse(rawStages);
        const nextStages = currentStages.map((stage: any) => {
          if (stage.id === "lead") {
            return {
              ...stage,
              cards: [
                ...stage.cards,
                { nome: simName, origem: "Teste de Nível", valor: 2800 },
              ],
            };
          }
          return stage;
        });
        window.localStorage.setItem("fluency-ai:crm:stages", JSON.stringify(nextStages));
      }
    } catch (e) {
      console.error(e);
    }

    toast.success("Lead cadastrado! Teste finalizado e card enviado ao CRM.");
    setSimStep(7); // Show results
  };

  const copyEmbedCode = (type: "nivelamento" | "pre-matricula") => {
    const path = type === "nivelamento" ? "/public/teste-nivel" : "/public/pre-matricula";
    const fullUrl = `${window.location.origin}${path}`;
    const embedStr = `<iframe src="${fullUrl}" width="100%" height="600px" style="border:none; border-radius:12px; background:transparent;"></iframe>`;
    navigator.clipboard.writeText(embedStr);
    toast.success("Código de incorporação copiado!");
  };

  const copyPublicLink = (type: "nivelamento" | "pre-matricula") => {
    const path = type === "nivelamento" ? "/public/teste-nivel" : "/public/pre-matricula";
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link público copiado com sucesso!");
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error("Nenhuma resposta disponível para exportar.");
      return;
    }
    const headers = ["ID", "Nome", "Email", "Telefone", "Acertos", "Total", "Nivel Estimado", "Data"];
    const rows = submissions.map(s => [
      s.id,
      s.nome,
      s.email,
      s.telefone,
      s.score,
      s.total,
      s.level,
      new Date(s.date).toISOString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_nivelamento_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso!");
  };

  // Dynamically calculate CEFR distribution for charts
  const cefrDistribution = submissions.reduce((acc: Record<string, number>, curr) => {
    const mainLevel = curr.level.split(" ")[0]; // Get "A1", "A2", etc.
    acc[mainLevel] = (acc[mainLevel] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = [
    { name: "A1", value: cefrDistribution["A1"] || 0, color: "#f87171" },
    { name: "A2", value: cefrDistribution["A2"] || 0, color: "#fb923c" },
    { name: "B1", value: cefrDistribution["B1"] || 0, color: "#60a5fa" },
    { name: "B2", value: cefrDistribution["B2"] || 0, color: "#34d399" },
    { name: "C1/C2", value: (cefrDistribution["C1"] || 0) + (cefrDistribution["C2"] || 0), color: "#a78bfa" },
  ].filter(item => item.value > 0);

  // Dynamically calculate timeline data (group by date)
  // Mock data for display, combined with submissions count
  const timelineData = [
    { date: "15/08", leads: 1 },
    { date: "16/08", leads: 2 },
    { date: "17/08", leads: 4 },
    { date: "18/08", leads: 3 },
    { date: "19/08", leads: submissions.length },
  ];

  const filteredSubmissions = submissions.filter((s) =>
    s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ModuleGate module="captacao">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Marketing & CRM"
          title="Fluency Forms & Nivelamento"
          description="Crie formulários inteligentes e testes de nível CEFR integrados ao CRM."
        />

        {/* Tab switchers */}
        <div className="flex border-b border-hairline gap-8 pb-0.5">
          <button
            onClick={() => setActiveTab("gerenciador")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 ${
              activeTab === "gerenciador"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layout className="size-4" /> Formulários Ativos
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 ${
              activeTab === "editor"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="size-4" /> Grade do Teste CEFR
          </button>
          <button
            onClick={() => setActiveTab("respostas")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 ${
              activeTab === "respostas"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-4" /> Respostas & Leads ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-0 ${
              activeTab === "playground"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Play className="size-4" /> Playground Simulator
          </button>
        </div>

        {activeTab === "gerenciador" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI metrics row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <GlassCard className="p-6 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Leads Totais Captados</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-foreground">{submissions.length}</span>
                  <span className="text-xs text-emerald-400 font-semibold">+12% este mês</span>
                </div>
              </GlassCard>
              <GlassCard className="p-6 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Conversão em Lead Real</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-foreground">84%</span>
                  <span className="text-xs text-muted-foreground">Preencheram contatos</span>
                </div>
              </GlassCard>
              <GlassCard className="p-6 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Nível Mais Comum</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-foreground">B1</span>
                  <span className="text-xs text-muted-foreground">Intermediate CEFR</span>
                </div>
              </GlassCard>
            </div>

            {/* Charts section */}
            <div className="grid gap-6 md:grid-cols-2">
              <GlassCard className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Distribuição de Nível CEFR</h4>
                  <p className="text-[10px] text-muted-foreground">Distribuição estimada dos leads captados por nível CEFR.</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{ background: "#09090b", borderColor: "#27272a", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "12px", color: "#f4f4f5" }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-semibold text-muted-foreground uppercase">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Histórico de Captação de Leads</h4>
                  <p className="text-[10px] text-muted-foreground">Volume diário de novos leads captados através dos formulários.</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        contentStyle={{ background: "#09090b", borderColor: "#27272a", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "12px", color: "#f4f4f5" }}
                        labelStyle={{ fontSize: "10px", color: "#a1a1aa" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="leads" 
                        stroke="var(--color-primary, #6366f1)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorLeads)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            {/* List of active forms */}
            <div className="grid gap-6">
              <GlassCard className={`p-6 space-y-4 hover:border-white/10 transition-all ${!isNivelamentoActive ? "opacity-75" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 uppercase">Nivelamento</span>
                      <span className={`rounded text-[10px] font-bold px-2 py-0.5 uppercase ${
                        isNivelamentoActive 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {isNivelamentoActive ? "Ativo" : "Inativo"}
                      </span>
                      <ToggleSwitch checked={isNivelamentoActive} onChange={toggleNivelamento} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-1.5">Teste de Nivelamento de Inglês (CEFR)</h3>
                    <p className="text-xs text-muted-foreground">Avaliação gramatical e de vocabulário contendo {questions.length} questões com skip-logic adaptativa.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyPublicLink("nivelamento")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <Share2 className="size-3.5" /> Copiar Link
                    </button>
                    <button
                      onClick={() => copyEmbedCode("nivelamento")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <Code className="size-3.5" /> Código Embed
                    </button>
                  </div>
                </div>

                <div className="border-t border-hairline pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-muted-foreground block">Questões Ativas</span>
                    <span className="font-semibold text-foreground">{questions.length} Questões</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Estilo de Layout</span>
                    <span className="font-semibold text-foreground">Wizard Conversacional</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Destino do Lead</span>
                    <span className="font-semibold text-foreground">CRM - Etapa Lead (Kanban)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">White-label</span>
                    <span className="font-semibold text-foreground">Cores e Logo Ativos</span>
                  </div>
                </div>
              </GlassCard>

              {/* Pre-Matrícula form card */}
              {!isMatriculaUnlocked ? (
                <GlassCard className="p-6 opacity-70 border-dashed space-y-4 hover:opacity-90 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 uppercase">Matrícula</span>
                        <span className="rounded bg-white/10 text-muted-foreground text-[10px] font-bold px-2 py-0.5 uppercase">Inativo</span>
                        <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase">Premium</span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-1.5">Formulário de Pré-Matrícula Online</h3>
                      <p className="text-xs text-muted-foreground">Ficha de matrícula padrão para novos alunos. Captura dados residenciais, de responsáveis e financeiros.</p>
                    </div>
                    <button
                      onClick={() => setIsUnlockModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer border-0"
                    >
                      <Sparkles className="size-3.5" /> Ativar Módulo Premium
                    </button>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className={`p-6 space-y-4 hover:border-white/10 transition-all ${!isMatriculaActive ? "opacity-75" : ""}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 uppercase">Matrícula</span>
                        <span className={`rounded text-[10px] font-bold px-2 py-0.5 uppercase ${
                          isMatriculaActive 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {isMatriculaActive ? "Ativo" : "Inativo"}
                        </span>
                        <ToggleSwitch checked={isMatriculaActive} onChange={toggleMatricula} />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-1.5">Formulário de Pré-Matrícula Online</h3>
                      <p className="text-xs text-muted-foreground">Ficha de matrícula padrão para novos alunos. Captura dados residenciais, de responsáveis e financeiros.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyPublicLink("pre-matricula")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
                      >
                        <Share2 className="size-3.5" /> Copiar Link
                      </button>
                      <button
                        onClick={() => copyEmbedCode("pre-matricula")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
                      >
                        <Code className="size-3.5" /> Código Embed
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-muted-foreground block">Matrículas Realizadas</span>
                      <span className="font-semibold text-foreground">12 Alunos</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Estilo de Layout</span>
                      <span className="font-semibold text-foreground">Formulário por Passos</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Destino do Lead</span>
                      <span className="font-semibold text-foreground">Base de Alunos (Pré-Matrícula)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">White-label</span>
                      <span className="font-semibold text-foreground">Cores e Logo Ativos</span>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {activeTab === "editor" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Notion-style builder introduction */}
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3 text-xs text-primary leading-relaxed items-start">
              <Sparkles className="size-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider">Editor Adaptativo CEFR</p>
                <p className="mt-1 opacity-90">Edite as questões abaixo. O sistema calcula a proficiência recomendada do lead com base no peso e complexidade das questões respondidas corretamente.</p>
              </div>
            </div>

            {/* Questions header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">{questions.length} Questões Cadastradas</span>
              <button
                onClick={handleOpenAddQuestion}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Plus className="size-3.5" /> Adicionar Questão
              </button>
            </div>

            {/* Questions list */}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                let lvlColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                if (q.nivel.startsWith("B")) lvlColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                if (q.nivel.startsWith("C")) lvlColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";

                return (
                  <GlassCard key={q.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-extrabold text-muted-foreground">#{idx + 1}</span>
                        <span className={`rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${lvlColor}`}>
                          CEFR {q.nivel}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">Opção Correta: ({q.correta})</span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{q.enunciado}</h4>
                      
                      {/* Sub-grid with answer options */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-2 text-xs text-muted-foreground">
                        <div><span className="font-semibold text-foreground/80">(A)</span> {q.opcaoA}</div>
                        <div><span className="font-semibold text-foreground/80">(B)</span> {q.opcaoB}</div>
                        <div><span className="font-semibold text-foreground/80">(C)</span> {q.opcaoC}</div>
                        <div><span className="font-semibold text-foreground/80">(D)</span> {q.opcaoD}</div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 shrink-0 justify-end">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="rounded border border-hairline bg-surface/50 hover:bg-accent px-3 py-1.5 text-[10px] font-bold uppercase text-foreground cursor-pointer transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="rounded border border-overdue/20 bg-overdue/5 hover:bg-overdue/10 px-3 py-1.5 text-[10px] font-bold uppercase text-overdue cursor-pointer transition-all"
                      >
                        Excluir
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "respostas" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search and control filter */}
            <GlassCard className="p-4 flex items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2 max-w-md">
                <Search className="size-4 text-muted-foreground" />
                <input
                  placeholder="Buscar resposta por nome do lead..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface/50 hover:bg-accent px-4 py-2 text-xs font-semibold text-foreground hover:text-primary transition-all cursor-pointer bg-transparent border-hairline"
              >
                Exportar CSV
              </button>
            </GlassCard>

            {/* Submissions table */}
            <div className="overflow-x-auto rounded-xl border border-hairline bg-surface/20 backdrop-blur-md">
              <table className="w-full border-collapse text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-hairline bg-surface/50">
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível Estimado</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Acertos</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((s) => {
                      const waText = encodeURIComponent(
                        `Olá ${s.nome}! Vi que você completou o nosso teste de nivelamento de inglês e seu resultado foi estimado em ${s.level}. Que tal agendarmos uma conversa gratuita para avaliarmos suas metas?`
                      );
                      const waLink = `https://wa.me/${s.telefone.replace(/\D/g, "")}?text=${waText}`;

                      let scoreColor = "text-rose-400";
                      if (s.score >= 3) scoreColor = "text-blue-400";
                      if (s.score >= 4) scoreColor = "text-emerald-400";

                      return (
                        <tr key={s.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedLead(s)}
                              className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer bg-transparent border-0 p-0 block outline-none"
                            >
                              {s.nome}
                            </button>
                            <span className="rounded bg-primary/10 text-primary text-[8px] font-extrabold px-1 py-0.5 uppercase mt-0.5 inline-block">Lead Gerado</span>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Mail className="size-3" /> {s.email}</div>
                            <div className="flex items-center gap-1.5 mt-1"><Phone className="size-3" /> {s.telefone}</div>
                          </td>
                          <td className="p-4 text-xs font-bold text-foreground">
                            {s.level}
                          </td>
                          <td className="p-4 text-xs font-bold text-center">
                            <span className={scoreColor}>{s.score}</span> / {s.total}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-4 text-right">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white transition-all cursor-pointer shadow-sm border-0"
                            >
                              <MessageSquare className="size-3" /> Chamar WhatsApp
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                        Nenhuma resposta de formulário encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "playground" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
            {/* Explanation card */}
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-foreground">Simulador de Formulário / Teste de Nivelamento</h3>
              <p className="text-xs text-muted-foreground">Tente realizar o teste abaixo para simular a jornada de captação de leads. Ao concluir, o lead será injetado automaticamente na Base de Leads e no funil do CRM.</p>
            </div>

            {/* Web browser mockup container */}
            <div className="rounded-xl border border-hairline bg-surface/40 overflow-hidden shadow-2xl relative">
              
              {/* Browser mockup top bar */}
              <div className="bg-surface-elevated/70 border-b border-hairline px-4 py-2 flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-500" />
                <span className="size-2.5 rounded-full bg-amber-500" />
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <div className="mx-auto bg-surface/30 border border-hairline rounded px-4 py-0.5 text-[10px] text-muted-foreground w-72 text-center truncate">
                  escola.fluency.ai/public/teste-nivel
                </div>
              </div>

              {/* Wizard Content container */}
              <div className="p-8 min-h-[360px] flex flex-col justify-between">
                
                {simStep === 0 ? (
                  /* Welcome Slide */
                  <div className="text-center py-6 space-y-6 animate-in zoom-in duration-200">
                    <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                      <ClipboardList className="size-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-extrabold text-foreground tracking-tight">Placement English Test</h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">Descubra seu nível de proficiência em inglês de acordo com o quadro europeu comum CEFR (A1 a C2) em apenas 5 questões rápidas.</p>
                    </div>
                    <button
                      onClick={handleStartSim}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer border-0"
                    >
                      Começar Avaliação <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                ) : simStep <= questions.length ? (
                  /* Question wizard slide */
                  (() => {
                    const currentQ = questions[simStep - 1]!;
                    const options = [
                      { key: "A", text: currentQ.opcaoA },
                      { key: "B", text: currentQ.opcaoB },
                      { key: "C", text: currentQ.opcaoC },
                      { key: "D", text: currentQ.opcaoD }
                    ];

                    return (
                      <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        {/* Progress header */}
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="font-bold text-primary">Questão {simStep} de {questions.length}</span>
                          <span>Estágio: CEFR {currentQ.nivel}</span>
                        </div>
                        
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(simStep / questions.length) * 100}%` }}
                          />
                        </div>

                        <h4 className="text-base font-bold text-foreground leading-relaxed">
                          {currentQ.enunciado}
                        </h4>

                        <div className="grid gap-3 pt-2">
                          {options.map((opt) => {
                            const isSelected = simAnswers[currentQ.id] === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => handleSelectAnswer(currentQ.id, opt.key)}
                                className={`w-full text-left p-3.5 rounded-lg border text-xs font-medium transition-all flex justify-between items-center cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-hairline bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                                }`}
                              >
                                <span><span className="font-bold mr-2">({opt.key})</span> {opt.text}</span>
                                {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            onClick={handleNextSim}
                            disabled={!simAnswers[currentQ.id]}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all border-0 ${
                              simAnswers[currentQ.id]
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                          >
                            Avançar <ArrowRight className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : simStep === questions.length + 1 ? (
                  /* Lead capture slide */
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="text-center space-y-2">
                      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Award className="size-6" />
                      </span>
                      <h4 className="text-lg font-bold text-foreground">Falta muito pouco!</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">Parabéns por concluir as questões. Preencha seus dados para receber o relatório pedagógico do seu nível.</p>
                    </div>

                    <form onSubmit={handleFinishSim} className="space-y-4 max-w-md mx-auto">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Seu Nome Completo</label>
                        <input
                          placeholder="Ex: João da Silva"
                          value={simName}
                          onChange={(e) => setSimName(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/60 px-3 text-xs text-foreground outline-none focus:border-primary"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">WhatsApp / Telefone</label>
                          <input
                            placeholder="+55 (11) 99999-9999"
                            value={simPhone}
                            onChange={(e) => setSimPhone(e.target.value)}
                            className="h-10 w-full rounded-lg border border-hairline bg-surface/60 px-3 text-xs text-foreground outline-none focus:border-primary"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">E-mail</label>
                          <input
                            type="email"
                            placeholder="exemplo@email.com"
                            value={simEmail}
                            onChange={(e) => setSimEmail(e.target.value)}
                            className="h-10 w-full rounded-lg border border-hairline bg-surface/60 px-3 text-xs text-foreground outline-none focus:border-primary"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer border-0 mt-2"
                      >
                        Visualizar Meu Relatório
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Results page slide */
                  <div className="text-center py-4 space-y-6 animate-in zoom-in duration-200">
                    <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary items-center gap-1.5">
                      <Sparkles className="size-3.5" /> Diagnóstico Concluído
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Proficiência Estimada</p>
                      <h4 className="text-2xl font-extrabold text-foreground tracking-tight">CEFR {calculatedLevel}</h4>
                      <p className="text-xs text-muted-foreground">Você acertou <span className="font-bold text-primary">{calculatedScore} de {questions.length}</span> questões do teste adaptativo.</p>
                    </div>

                    {/* Radars mockup details */}
                    <GlassCard className="p-4 max-w-sm mx-auto grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Vocabulário</span>
                        <span className="font-bold text-foreground">{calculatedScore >= 3 ? "B2 (Bom)" : "A2 (Básico)"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Gramática</span>
                        <span className="font-bold text-foreground">{calculatedScore >= 4 ? "B2 (Forte)" : "A1 (Precisa treinar)"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Compreensão</span>
                        <span className="font-bold text-foreground">{calculatedScore === 5 ? "C1 (Avançado)" : "B1 (Médio)"}</span>
                      </div>
                    </GlassCard>

                    <div className="flex justify-center gap-2 max-w-sm mx-auto pt-2">
                      <button
                        onClick={handleStartSim}
                        className="rounded-lg border border-hairline bg-surface/50 hover:bg-accent px-4 py-2 text-xs font-semibold text-foreground cursor-pointer transition-all flex-1"
                      >
                        Refazer Teste
                      </button>
                      <button
                        onClick={() => {
                          toast.success("Obrigado pelo contato!");
                          setSimStep(0);
                        }}
                        className="rounded-lg bg-primary hover:bg-primary/95 px-4 py-2 text-xs font-bold text-primary-foreground cursor-pointer transition-all flex-1 border-0"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        )}

        {/* --- INLINE EDIT/ADD QUESTION MODAL --- */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
              >
                <X className="size-4" />
              </button>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {selectedQuestion ? "Editar Questão CEFR" : "Inserir Questão CEFR"}
                </h3>
                <p className="text-xs text-muted-foreground">Configure o enunciado, opções de resposta e peso pedagógico.</p>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enunciado / Pergunta</label>
                  <textarea
                    rows={3}
                    value={formEnunciado}
                    onChange={(e) => setFormEnunciado(e.target.value)}
                    placeholder="Ex: Choose the correct sentence..."
                    className="w-full rounded-lg border border-hairline bg-surface/50 p-3 text-xs text-foreground outline-none focus:border-primary resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível de Dificuldade</label>
                    <select
                      value={formNivel}
                      onChange={(e) => setFormNivel(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opção Correta</label>
                    <select
                      value={formCorreta}
                      onChange={(e) => setFormCorreta(e.target.value as "A" | "B" | "C" | "D")}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="A">Opção (A)</option>
                      <option value="B">Opção (B)</option>
                      <option value="C">Opção (C)</option>
                      <option value="D">Opção (D)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Opções de Respostas</label>
                  <div className="space-y-1.5">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-muted-foreground w-6">A:</span>
                      <input
                        value={formOpcaoA}
                        onChange={(e) => setFormOpcaoA(e.target.value)}
                        className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-muted-foreground w-6">B:</span>
                      <input
                        value={formOpcaoB}
                        onChange={(e) => setFormOpcaoB(e.target.value)}
                        className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-muted-foreground w-6">C:</span>
                      <input
                        value={formOpcaoC}
                        onChange={(e) => setFormOpcaoC(e.target.value)}
                        className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-muted-foreground w-6">D:</span>
                      <input
                        value={formOpcaoD}
                        onChange={(e) => setFormOpcaoD(e.target.value)}
                        className="h-9 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer border-0"
                >
                  Salvar Questão
                </button>
              </form>
            </GlassCard>
          </div>
        )}
        {/* --- PREMIUM MODULE UNLOCK MODAL --- */}
        {isUnlockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-md p-6 space-y-6 shadow-2xl relative border-amber-500/20">
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
              >
                <X className="size-4" />
              </button>
              
              <div className="text-center space-y-3">
                <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <Sparkles className="size-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-foreground tracking-tight">Ativar Pré-Matrícula Online</h3>
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Módulo Premium</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automatize a captação de matrículas da sua escola de idiomas com um portal digital. Permita que os alunos enviem dados cadastrais, endereço e dados financeiros diretamente.
                </p>
              </div>

              <div className="space-y-3 bg-white/[0.02] border border-hairline rounded-xl p-4 text-xs">
                <h4 className="font-bold text-foreground">O que está incluso:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400 shrink-0" /> Portal público de Matrícula White-Label</li>
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400 shrink-0" /> Coleta de dados pessoais, residenciais e CPF</li>
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400 shrink-0" /> Integração automática com a base de Alunos</li>
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400 shrink-0" /> Faturamento financeiro inicial automatizado</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="flex-1 rounded-lg border border-hairline bg-surface/50 hover:bg-accent py-2.5 text-xs font-semibold text-foreground cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={unlockMatriculaModule}
                  className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/10 cursor-pointer transition-all border-0"
                >
                  Confirmar Ativação
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* --- LEAD DETAIL / ANSWERS REVIEW MODAL --- */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-2xl p-6 space-y-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => setSelectedLead(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
              >
                <X className="size-4" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
                <div>
                  <span className="rounded bg-primary/10 text-primary text-[8px] font-extrabold px-1.5 py-0.5 uppercase">Resultado Nivelamento</span>
                  <h3 className="text-lg font-bold text-foreground mt-1">{selectedLead.nome}</h3>
                  <p className="text-xs text-muted-foreground">Preenchido em {new Date(selectedLead.date).toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-foreground">{selectedLead.level}</span>
                  <p className="text-xs text-muted-foreground">Pontuação: <span className="font-bold text-primary">{selectedLead.score} / {selectedLead.total} acertos</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-hairline pb-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">Dados de Contato</h4>
                  <div className="space-y-1.5 text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Mail className="size-3.5 text-primary shrink-0" /> <strong>E-mail:</strong> {selectedLead.email}</p>
                    <p className="flex items-center gap-1.5"><Phone className="size-3.5 text-primary shrink-0" /> <strong>Telefone:</strong> {selectedLead.telefone}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">Ações de Conversão</h4>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${selectedLead.telefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all cursor-pointer shadow-sm border-0 flex-1"
                    >
                      <MessageSquare className="size-3.5" /> WhatsApp
                    </a>
                    <button
                      onClick={() => {
                        toast.success("Enviado e-mail de boas-vindas com o relatório!");
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded border border-hairline bg-surface/50 hover:bg-accent px-3 py-1.5 text-[11px] font-bold text-foreground transition-all cursor-pointer flex-1"
                    >
                      <Mail className="size-3.5" /> Enviar Relatório
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider border-b border-hairline pb-2">Gabarito de Respostas</h4>
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const leadAnswer = selectedLead.respostas?.[q.id];
                    const isCorrect = leadAnswer === q.correta;

                    return (
                      <div key={q.id} className="rounded-lg border border-hairline bg-white/[0.01] p-4 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-muted-foreground">Questão #{idx + 1} ({q.nivel})</span>
                          {leadAnswer ? (
                            isCorrect ? (
                              <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5">Correto</span>
                            ) : (
                              <span className="rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5">Incorreto</span>
                            )
                          ) : (
                            <span className="rounded bg-zinc-500/10 text-zinc-400 text-[10px] font-bold px-2 py-0.5">Não Respondido</span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-foreground leading-relaxed">{q.enunciado}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {[
                            { key: "A", val: q.opcaoA },
                            { key: "B", val: q.opcaoB },
                            { key: "C", val: q.opcaoC },
                            { key: "D", val: q.opcaoD },
                          ].map((opt) => {
                            const isChosen = leadAnswer === opt.key;
                            const isAnswerCorrect = q.correta === opt.key;

                            let optClass = "border-hairline text-muted-foreground bg-transparent";
                            if (isChosen) {
                              optClass = isCorrect 
                                ? "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold"
                                : "border-rose-500 bg-rose-500/10 text-foreground font-semibold";
                            } else if (isAnswerCorrect && !isCorrect && leadAnswer !== undefined) {
                              optClass = "border-emerald-500/50 bg-emerald-500/5 text-emerald-400 font-semibold";
                            }

                            return (
                              <div key={opt.key} className={`border rounded p-2 flex items-center justify-between ${optClass}`}>
                                <span>({opt.key}) {opt.val}</span>
                                {isChosen && (
                                  isCorrect 
                                    ? <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                                    : <X className="size-3.5 text-rose-400 shrink-0" />
                                )}
                                {!isChosen && isAnswerCorrect && !isCorrect && leadAnswer !== undefined && (
                                  <span className="text-[9px] text-emerald-400 uppercase font-bold">Gabarito</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </ModuleGate>
  );
}
