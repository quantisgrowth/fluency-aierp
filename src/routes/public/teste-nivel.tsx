import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Award,
  Sparkles,
  Mail,
  Phone,
  User,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { toast } from "sonner";

export const Route = createFileRoute("/public/teste-nivel")({
  head: () => ({
    meta: [
      { title: "Teste de Nivelamento de Inglês — Fluency AI" },
      { name: "description", content: "Faça nosso teste de nivelamento rápido e descubra sua proficiência no quadro CEFR (A1 a C2)." },
    ],
  }),
  component: PublicTesteNivelPage,
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

function PublicTesteNivelPage() {
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  
  // Wizard States
  const [simStep, setSimStep] = useState(0); // 0 = welcome, 1..5 = questions, 6 = lead capture, 7 = success
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simPhone, setSimPhone] = useState("+55 ");
  const [calculatedLevel, setCalculatedLevel] = useState("");
  const [calculatedScore, setCalculatedScore] = useState(0);

  // Load configuration
  useEffect(() => {
    try {
      const storedQuestions = window.localStorage.getItem("fluency-ai:captacao:questions");
      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
      }

      const activeStatus = window.localStorage.getItem("fluency-ai:captacao:formStatus:nivelamento");
      setIsActive(activeStatus !== null ? JSON.parse(activeStatus) : true);
    } catch {
      setIsActive(true);
    }
  }, []);

  const handleStart = () => {
    setSimStep(1);
    setSimAnswers({});
  };

  const handleSelectAnswer = (qId: string, answer: string) => {
    setSimAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleNext = () => {
    setSimStep((prev) => prev + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!simName.trim() || !simEmail.trim() || simPhone.trim().length < 10) {
      toast.error("Por favor, preencha todos os campos corretamente.");
      return;
    }

    // Calculate score
    let correct = 0;
    questions.forEach((q) => {
      if (simAnswers[q.id] === q.correta) {
        correct++;
      }
    });

    // Estimate CEFR Level
    let level = "A1 - Beginner";
    if (correct === 2) level = "A2 - Elementary";
    if (correct === 3) level = "B1 - Intermediate";
    if (correct === 4) level = "B2 - Upper Intermediate";
    if (correct === 5) level = "C1/C2 - Advanced/Proficient";

    setCalculatedScore(correct);
    setCalculatedLevel(level);

    try {
      // Save submission
      const storedSubmissions = window.localStorage.getItem("fluency-ai:captacao:submissions");
      let currentSubs: Submission[] = [];
      if (storedSubmissions) {
        currentSubs = JSON.parse(storedSubmissions);
      }
      
      const newSub: Submission = {
        id: "sub-" + Date.now(),
        nome: simName,
        email: simEmail,
        telefone: simPhone,
        score: correct,
        total: questions.length,
        level: level,
        date: new Date().toISOString(),
        respostas: simAnswers
      };

      window.localStorage.setItem("fluency-ai:captacao:submissions", JSON.stringify([newSub, ...currentSubs]));

      // Inject into Leads DB
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
        origem: "Teste de Nivelamento (Público)",
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
        anotacoes: `Lead preenchido via Link Público do teste de nivelamento. Resultado: ${level} (${correct}/${questions.length} corretas).`,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem("fluency-ai:leads-db", JSON.stringify([...currentLeads, newLead]));

      // Inject into CRM Stages
      const rawStages = window.localStorage.getItem("fluency-ai:crm:stages");
      if (rawStages) {
        const currentStages = JSON.parse(rawStages);
        const nextStages = currentStages.map((stage: any) => {
          if (stage.id === "lead") {
            return {
              ...stage,
              cards: [
                ...stage.cards,
                { nome: simName, origem: "Teste de Nível (Público)", valor: 2800 },
              ],
            };
          }
          return stage;
        });
        window.localStorage.setItem("fluency-ai:crm:stages", JSON.stringify(nextStages));
      }

      toast.success("Respostas enviadas com sucesso!");
      setSimStep(questions.length + 2); // Show results screen
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar respostas. Tente novamente.");
    }
  };

  if (isActive === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <GlassCard className="w-full max-w-md p-8 text-center space-y-6 border-rose-500/20">
          <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Formulário Inativo</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Este teste de nivelamento está temporariamente inativo pelo administrador da escola. Entre em contato diretamente para solicitar sua avaliação.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Loading state
  if (isActive === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-xs text-muted-foreground animate-pulse">Carregando formulário...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Brand header */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">FLUENCY AI</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] font-semibold">Language Schools Integration</p>
        </div>

        <GlassCard className="p-8 shadow-2xl relative border-white/5 overflow-hidden">
          {simStep === 0 ? (
            /* Welcome Slide */
            <div className="text-center py-6 space-y-6 animate-in zoom-in duration-200">
              <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <ClipboardList className="size-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-extrabold text-foreground tracking-tight">Placement English Test</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Descubra seu nível de proficiência em inglês de acordo com o quadro europeu comum CEFR (A1 a C2) em apenas 5 questões rápidas.
                </p>
              </div>
              <button
                onClick={handleStart}
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
                    <span className="flex items-center gap-1"><HelpCircle className="size-3.5" /> CEFR Dificuldade</span>
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
                      onClick={handleNext}
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
            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="text-center space-y-2">
                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Award className="size-6" />
                </span>
                <h4 className="text-lg font-bold text-foreground">Falta muito pouco!</h4>
                <p className="text-xs text-muted-foreground">Preencha seus contatos para salvar seu progresso e visualizar o resultado do seu teste CEFR.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Seu Nome Completo</label>
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <input
                      placeholder="Ex: João Silva"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">E-mail para Contato</label>
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <input
                      type="email"
                      placeholder="Ex: joao.silva@example.com"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Celular / WhatsApp</label>
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                    <Phone className="size-4 text-muted-foreground shrink-0" />
                    <input
                      placeholder="Ex: +55 (11) 98888-8888"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary hover:bg-primary/95 py-2.5 text-xs font-bold text-primary-foreground transition-all cursor-pointer border-0 shadow"
              >
                Ver Resultado e Enviar
              </button>
            </form>
          ) : (
            /* Results slide */
            <div className="text-center py-4 space-y-6 animate-in zoom-in duration-200">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="size-7" />
              </span>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-foreground">Avaliação Concluída!</h4>
                <p className="text-xs text-muted-foreground">Seu nível estimado de proficiência no idioma foi calculado.</p>
              </div>

              <div className="rounded-xl border border-hairline bg-surface/30 p-6 space-y-4 max-w-sm mx-auto">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Seu Nível CEFR</span>
                  <span className="text-2xl font-black text-primary tracking-tight mt-1 block">{calculatedLevel}</span>
                </div>
                <div className="border-t border-hairline pt-3 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Pontuação Geral:</span>
                  <span className="font-bold text-foreground">{calculatedScore} de {questions.length} questões corretas</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 text-xs text-primary max-w-sm mx-auto leading-relaxed text-left">
                <Sparkles className="size-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Próximos Passos:</h5>
                  <p className="mt-0.5 opacity-90">Recebemos seu resultado! Um de nossos especialistas pedagógicos entrará em contato pelo WhatsApp cadastrado para apresentar nossos cursos compatíveis com seu nível.</p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
