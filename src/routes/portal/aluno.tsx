import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Flame,
  Coins,
  Trophy,
  Award,
  CheckCircle2,
  ChevronRight,
  User,
  Share2,
  Sparkles,
  Send,
  BookOpen,
  ShoppingBag,
  Sparkle,
  Gift
} from "lucide-react";
import { useTenant } from "@/modules/tenant-context";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/aluno")({
  head: () => ({
    meta: [
      { title: "Portal do Aluno — Fluency AI" },
      { name: "description", content: "Portal gamificado do aluno no Fluency AI." },
    ],
  }),
  component: PortalAlunoPage,
});

type Task = {
  id: string;
  title: string;
  xp: number;
  coins: number;
  frequency: "Diária" | "Semanal" | "Especial";
  completed: boolean;
};

type Reward = {
  id: string;
  name: string;
  cost: number;
  stock: number;
};

type Redemption = {
  id: string;
  studentName: string;
  itemName: string;
  cost: number;
  date: string;
  status: "Pendente" | "Entregue" | "Cancelado";
};

const CHALLENGES_KEY = "fluency-ai:gamification:challenges";
const REWARDS_KEY = "fluency-ai:gamification:rewards";
const REDEMPTIONS_KEY = "fluency-ai:gamification:redemptions";

function PortalAlunoPage() {
  const { tenant } = useTenant();
  
  // Game balances
  const [xp, setXp] = useState(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:details");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed["Felipe Medeiros"]) return parsed["Felipe Medeiros"].xp;
      }
    } catch {}
    return 1450;
  });

  const [coins, setCoins] = useState(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:details");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed["Felipe Medeiros"]) return parsed["Felipe Medeiros"].coins;
      }
    } catch {}
    return 380;
  });

  const [streak, setStreak] = useState(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:details");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed["Felipe Medeiros"]) return parsed["Felipe Medeiros"].streak;
      }
    } catch {}
    return 5;
  });

  // Sync state changes back to shared localStorage details
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:details");
      const parsed = stored ? JSON.parse(stored) : {};
      
      if (!parsed["Felipe Medeiros"]) {
        parsed["Felipe Medeiros"] = {
          presenca: 90,
          tarefas: 85,
          streak: 5,
          coins: 380,
          xp: 1450,
          liga: "Ouro",
          whats: "5511999991111",
          historico: [
            { data: "19/08/2026", texto: "Ingressou no portal do aluno e iniciou os desafios.", autor: "Sistema" }
          ],
          financeiro: [
            { descricao: "Mensalidade Agosto", valor: 380, vencimento: "10/08/2026", situacao: "pago" }
          ]
        };
      }
      
      if (parsed["Felipe Medeiros"].xp !== xp || 
          parsed["Felipe Medeiros"].coins !== coins || 
          parsed["Felipe Medeiros"].streak !== streak) {
        
        parsed["Felipe Medeiros"].xp = xp;
        parsed["Felipe Medeiros"].coins = coins;
        parsed["Felipe Medeiros"].streak = streak;
        
        window.localStorage.setItem("fluency-ai:students:details", JSON.stringify(parsed));
        window.dispatchEvent(new Event("storage"));
      }
    } catch {}
  }, [xp, coins, streak]);

  // Sync state across open tabs in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedDetails = window.localStorage.getItem("fluency-ai:students:details");
        if (storedDetails) {
          const parsed = JSON.parse(storedDetails);
          if (parsed["Felipe Medeiros"]) {
            setXp(parsed["Felipe Medeiros"].xp);
            setCoins(parsed["Felipe Medeiros"].coins);
            setStreak(parsed["Felipe Medeiros"].streak);
          }
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  // Mobile app tab navigation
  const [mobileTab, setMobileTab] = useState<"missions" | "practice" | "shop">("missions");

  // Dynamic state sync from localStorage
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  // Flashcards mini-game state
  const [flashcardStep, setFlashcardStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [vocabGameFinished, setVocabGameFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const vocabWords = [
    { word: "Book", options: ["Caneta", "Livro", "Caderno"], correct: "Livro" },
    { word: "Teacher", options: ["Aluno", "Diretor", "Professor"], correct: "Professor" },
    { word: "Classroom", options: ["Sala de aula", "Biblioteca", "Pátio"], correct: "Sala de aula" },
    { word: "Homework", options: ["Prova", "Lição de casa", "Trabalho"], correct: "Lição de casa" },
  ];

  const [leaderboard, setLeaderboard] = useState([
    { position: 1, name: "Lucas M.", xp: 2150, active: false },
    { position: 2, name: "Ana Clara", xp: 1890, active: false },
    { position: 3, name: "Você", xp: 1450, active: true },
    { position: 4, name: "Rodrigo F.", xp: 1320, active: false },
    { position: 5, name: "Gabi Dias", xp: 1100, active: false },
  ]);

  // Sync state on component load and watch changes across tabs
  useEffect(() => {
    const loadGamification = () => {
      try {
        const rawC = window.localStorage.getItem(CHALLENGES_KEY);
        if (rawC) {
          setTasks(JSON.parse(rawC));
        } else {
          const defaults = [
            { id: "1", title: "Praticar pronúncia da Unit 7", xp: 100, coins: 20, frequency: "Diária", completed: false },
            { id: "2", title: "Enviar lição de casa de ontem", xp: 200, coins: 40, frequency: "Diária", completed: false },
            { id: "3", title: "Marcar presença na aula de hoje", xp: 150, coins: 30, frequency: "Diária", completed: false },
          ] as Task[];
          setTasks(defaults);
          window.localStorage.setItem(CHALLENGES_KEY, JSON.stringify(defaults));
        }

        const rawR = window.localStorage.getItem(REWARDS_KEY);
        if (rawR) {
          setRewards(JSON.parse(rawR));
        } else {
          const defaults = [
            { id: "1", name: "Lápis Fluency AI", cost: 100, stock: 50 },
            { id: "2", name: "Garrafa Térmica Fluency", cost: 800, stock: 15 },
            { id: "3", name: "1 Aula de Conversação VIP", cost: 500, stock: 99 },
          ];
          setRewards(defaults);
          window.localStorage.setItem(REWARDS_KEY, JSON.stringify(defaults));
        }

        const rawRed = window.localStorage.getItem(REDEMPTIONS_KEY);
        if (rawRed) {
          setRedemptions(JSON.parse(rawRed));
        }
      } catch {
        /* ignore */
      }
    };

    loadGamification();

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === CHALLENGES_KEY ||
        e.key === REWARDS_KEY ||
        e.key === REDEMPTIONS_KEY
      ) {
        loadGamification();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleTaskComplete = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id && !t.completed) {
        const nextXp = xp + t.xp;
        const nextCoins = coins + t.coins;
        setXp(nextXp);
        setCoins(nextCoins);
        
        // Update user position in leaderboard
        setLeaderboard((leader) => {
          const nextLeader = leader.map((u) => (u.active ? { ...u, xp: nextXp } : u));
          return nextLeader.sort((a, b) => b.xp - a.xp).map((u, idx) => ({ ...u, position: idx + 1 }));
        });

        toast.success(`Parabéns! +${t.xp} XP e +${t.coins} moedas`, {
          description: `Tarefa "${t.title}" concluída com sucesso!`,
        });

        return { ...t, completed: true };
      }
      return t;
    });

    setTasks(updated);
    window.localStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
  };

  // Flashcards answer trigger
  const handleAnswerSubmit = (option: string) => {
    setSelectedAnswer(option);
    const correct = vocabWords[flashcardStep]!.correct === option;
    if (correct) {
      setCorrectCount((prev) => prev + 1);
      toast.success("Resposta correta! +10 XP");
      setXp((prev) => prev + 10);
    } else {
      toast.error("Resposta incorreta! A resposta correta era: " + vocabWords[flashcardStep]!.correct);
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      if (flashcardStep < vocabWords.length - 1) {
        setFlashcardStep((prev) => prev + 1);
      } else {
        setVocabGameFinished(true);
        // Bonus for completion
        const rewardCoins = correctCount * 15 + 10;
        setCoins((prev) => prev + rewardCoins);
        toast.success(`Fim da prática! Você ganhou +${rewardCoins} moedas Fluency Coins!`);
      }
    }, 1200);
  };

  const handleResetPractice = () => {
    setFlashcardStep(0);
    setCorrectCount(0);
    setVocabGameFinished(false);
  };

  // Redeem Reward Shop item
  const handleRedeemReward = (item: Reward) => {
    if (coins < item.cost) {
      toast.error("Moedas Fluency Coins insuficientes!", {
        description: `Esta recompensa custa ${item.cost} moedas, e você possui apenas ${coins}.`,
      });
      return;
    }

    if (item.stock <= 0) {
      toast.error("Produto fora de estoque!");
      return;
    }

    // Deduct coins balance
    const nextCoins = coins - item.cost;
    setCoins(nextCoins);

    // Decrement item stock
    const nextRewards = rewards.map((r) =>
      r.id === item.id ? { ...r, stock: r.stock - 1 } : r
    );
    setRewards(nextRewards);
    window.localStorage.setItem(REWARDS_KEY, JSON.stringify(nextRewards));

    // Register Redemption request
    const newRedemption: Redemption = {
      id: "red-" + Date.now(),
      studentName: "Felipe Medeiros",
      itemName: item.name,
      cost: item.cost,
      date: new Date().toLocaleDateString("pt-BR"),
      status: "Pendente",
    };

    const nextRed = [newRedemption, ...redemptions];
    setRedemptions(nextRed);
    window.localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(nextRed));

    toast.success("Resgate Solicitado!", {
      description: `Seu pedido de "${item.name}" foi enviado ao coordenador da escola. Fale com seu professor para retirar!`,
    });
  };

  const handleReferral = () => {
    toast.success("Link de Indicação Copiado!", {
      description: "Envie no WhatsApp dos seus amigos para ganhar 500 Fluency Coins quando eles agendarem!",
    });
  };

  const nextLevelXp = 2000;
  const xpPercentage = (xp / nextLevelXp) * 100;

  return (
    <div className="mx-auto max-w-[1400px] flex flex-col lg:flex-row items-center justify-center gap-12 py-4 animate-in fade-in duration-300">
      
      {/* Informative Side Panel (Desktop only) */}
      <div className="hidden lg:flex flex-col justify-center max-w-sm space-y-4">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <Award className="size-5" />
        </span>
        <h2 className="text-2xl font-bold text-foreground">Portal do Aluno Gamificado</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Esta é a visualização simulação-mobile do **Portal do Aluno**. Ele foi desenvolvido com foco em engajamento mobile-first de crianças e adolescentes.
        </p>
        <div className="rounded-xl border border-hairline bg-surface/40 p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-1">
            <Sparkles className="size-3.5 text-primary" /> Conexão Dinâmica:
          </p>
          <p>As missões e prêmios da loja exibidos ao lado refletem exatamente o que foi configurado no painel do Gestor da Escola (menu **Success & Retenção**).</p>
          <p>Praticar vocabulário e resgatar itens deduz as moedas do saldo do aluno em tempo real.</p>
        </div>
      </div>

      {/* SMARTPHONE DEVICE WRAPPER */}
      <div className="relative mx-auto w-full max-w-[390px] h-[820px] rounded-[50px] border-[12px] border-neutral-900 bg-[#07090e] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-between text-white select-none">
        
        {/* Notch details */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-50 flex items-center justify-center">
          <span className="size-2 rounded-full bg-neutral-800 mr-2" />
          <span className="w-10 h-1 bg-neutral-800 rounded-full" />
        </div>

        {/* Dynamic Space Background inside app */}
        <div className="pointer-events-none absolute inset-0 bg-[#030407]" />
        <div className="pointer-events-none absolute top-[-5%] left-[-5%] h-[40%] w-[50%] rounded-full bg-primary/5 blur-[80px]" />

        {/* APP MAIN CONTENT SCREEN */}
        <div className="relative z-10 flex-1 overflow-y-auto pt-10 px-5 pb-6 space-y-6 scrollbar-none">
          
          {/* App Header Branding */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 font-semibold">{tenant.name}</p>
              <h1 className="text-sm font-bold text-white">Student Space</h1>
            </div>
            
            <div className="flex gap-2">
              <span className="flex items-center gap-1 bg-neutral-900/80 border border-white/5 rounded-full px-2.5 py-1 text-xs font-semibold text-orange-400">
                <Flame className="size-3.5 fill-current animate-pulse" /> {streak}d
              </span>
              <span className="flex items-center gap-1 bg-neutral-900/80 border border-white/5 rounded-full px-2.5 py-1 text-xs font-semibold text-yellow-400">
                <Coins className="size-3.5 fill-current" /> {coins}
              </span>
            </div>
          </div>

          {/* User profile card & Level progress */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary/20 border border-primary/30">
                <User className="size-5.5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Felipe Medeiros</p>
                <p className="text-[10px] text-neutral-400">Nível CEFR: B2 · Intermediate</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Nível 5 Explorer</span>
                <span className="font-semibold text-neutral-300">{xp} / {nextLevelXp} XP</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* SCREEN VIEW 1: MISSIONS & LEADERBOARD */}
          {mobileTab === "missions" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Daily Quests section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Missões Disponíveis</h3>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      disabled={task.completed}
                      onClick={() => handleTaskComplete(task.id)}
                      className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        task.completed
                          ? "border-white/5 bg-white/[0.01] opacity-50"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid size-8 place-items-center rounded-lg border ${
                          task.completed ? "bg-primary/20 border-primary/30 text-primary" : "bg-neutral-900 border-white/5 text-neutral-500"
                        }`}>
                          <CheckCircle2 className="size-4.5" />
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold text-white leading-snug">{task.title}</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">+{task.xp} XP · +{task.coins} moedas</p>
                        </div>
                      </div>
                      {!task.completed && <ChevronRight className="size-3 text-neutral-500" />}
                    </button>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-center text-xs text-neutral-500 py-4">Sem missões ativas no momento.</p>
                  )}
                </div>
              </div>

              {/* Leaderboard section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy className="size-3.5 text-yellow-400" /> Liga de Ouro
                </h3>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 space-y-1.5">
                  {leaderboard.map((user) => (
                    <div
                      key={user.name}
                      className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                        user.active ? "bg-primary/15 border border-primary/20 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-4 text-center text-[10px] text-neutral-400">{user.position}</span>
                        <span className="text-white">{user.name}</span>
                      </div>
                      <span className="text-neutral-300 font-semibold">{user.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-tr from-primary/15 to-transparent p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    <Share2 className="size-3.5 text-primary" /> Convide Amigos
                  </p>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Indique a escola e ganhe 500 Coins para gastar na loja!
                  </p>
                </div>
                <button
                  onClick={handleReferral}
                  className="grid size-9 place-items-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow cursor-pointer transition-all active:scale-[0.96] border-0"
                >
                  <Send className="size-4" />
                </button>
              </div>

            </div>
          )}

          {/* SCREEN VIEW 2: PRACTICE / VOCAB FLASHCARDS */}
          {mobileTab === "practice" && (
            <div className="space-y-6 animate-in fade-in duration-200 py-2">
              
              <div className="space-y-1 text-center">
                <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-[10px] text-primary font-bold uppercase tracking-wider">
                  Mini-Game Vocabulário
                </span>
                <h3 className="text-sm font-bold text-white mt-2">Duelo de Flashcards</h3>
                <p className="text-[10px] text-neutral-400">Associe as palavras corretamente para acumular Fluency Coins.</p>
              </div>

              {!vocabGameFinished ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-6 backdrop-blur-xl relative">
                  
                  {/* Step indicators */}
                  <div className="flex justify-between items-center text-[10px] text-neutral-500">
                    <span>Palavra {flashcardStep + 1} de {vocabWords.length}</span>
                    <span>Acertos: {correctCount}</span>
                  </div>

                  {/* English Word box */}
                  <div className="h-32 rounded-xl bg-neutral-900 border border-white/5 grid place-items-center">
                    <p className="text-2xl font-bold tracking-tight text-white">{vocabWords[flashcardStep]!.word}</p>
                  </div>

                  {/* Answers option buttons */}
                  <div className="grid gap-2.5">
                    {vocabWords[flashcardStep]!.options.map((opt) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrect = vocabWords[flashcardStep]!.correct === opt;
                      return (
                        <button
                          key={opt}
                          disabled={selectedAnswer !== null}
                          onClick={() => handleAnswerSubmit(opt)}
                          className={`w-full h-11 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all ${
                            selectedAnswer === null
                              ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                              : isSelected
                                ? isCorrect
                                  ? "border-paid bg-paid/10 text-paid"
                                  : "border-overdue bg-overdue/10 text-overdue"
                                : isCorrect
                                  ? "border-paid bg-paid/10 text-paid"
                                  : "border-white/5 bg-white/[0.01] text-neutral-500"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-5 backdrop-blur-xl animate-in zoom-in duration-300">
                  <span className="grid size-12 place-items-center rounded-full bg-paid/10 border border-paid/20 text-paid mx-auto">
                    <CheckCircle2 className="size-6" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Treinamento Concluído!</h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      Você completou a rodada diária com sucesso.
                    </p>
                  </div>

                  <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5 text-xs text-left space-y-2">
                    <div className="flex justify-between">
                      <span>Total de acertos:</span>
                      <span className="font-bold text-white">{correctCount} de {vocabWords.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>XP acumulado:</span>
                      <span className="font-bold text-primary">+{correctCount * 10} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moedas recebidas:</span>
                      <span className="font-bold text-yellow-500">+{correctCount * 15 + 10} moedas</span>
                    </div>
                  </div>

                  <button
                    onClick={handleResetPractice}
                    className="w-full h-10 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow cursor-pointer transition-all border-0"
                  >
                    Praticar Novamente
                  </button>
                </div>
              )}

            </div>
          )}

          {/* SCREEN VIEW 3: REWARDS SHOP TAB */}
          {mobileTab === "shop" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loja de Recompensas</h3>
                <p className="text-[10px] text-neutral-400">Troque suas Fluency Coins por prêmios na sua escola.</p>
              </div>

              {/* Rewards List */}
              <div className="grid gap-3">
                {rewards.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                      <div className="flex items-center gap-2.5 text-[9px] text-neutral-400">
                        <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                          <Coins className="size-3" /> {item.cost} coins
                        </span>
                        <span>Estoque: {item.stock}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeemReward(item)}
                      disabled={item.stock <= 0}
                      className={`h-9 px-3 rounded-lg text-xs font-bold shadow transition-all cursor-pointer border-0 ${
                        item.stock <= 0
                          ? "bg-neutral-800 text-neutral-500"
                          : coins >= item.cost
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {item.stock <= 0 ? "Esgotado" : "Resgatar"}
                    </button>
                  </div>
                ))}
                {rewards.length === 0 && (
                  <p className="text-center text-xs text-neutral-500 py-6">Nenhum prêmio cadastrado nesta unidade.</p>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Dynamic Mobile App bottom navbar tab selectors */}
        <div className="relative z-10 border-t border-white/5 bg-neutral-950/90 px-4 py-2.5 flex justify-between items-center text-[10px] font-bold text-neutral-400">
          
          <button
            onClick={() => setMobileTab("missions")}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer bg-transparent border-0 ${
              mobileTab === "missions" ? "text-primary" : "hover:text-white"
            }`}
          >
            <Trophy className="size-4.5" />
            <span>Missões</span>
          </button>

          <button
            onClick={() => setMobileTab("practice")}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer bg-transparent border-0 ${
              mobileTab === "practice" ? "text-primary" : "hover:text-white"
            }`}
          >
            <BookOpen className="size-4.5" />
            <span>Praticar</span>
          </button>

          <button
            onClick={() => setMobileTab("shop")}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer bg-transparent border-0 ${
              mobileTab === "shop" ? "text-primary" : "hover:text-white"
            }`}
          >
            <ShoppingBag className="size-4.5" />
            <span>Loja</span>
          </button>

        </div>

        {/* Mobile footer bar notch */}
        <div className="relative z-10 bg-neutral-950 px-8 pb-3.5 flex justify-center items-center">
          <div className="w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>

    </div>
  );
}
