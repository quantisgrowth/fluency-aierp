import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  HeartPulse,
  MessageSquare,
  BookOpen,
  UserCheck,
  Award,
  Plus,
  Trash2,
  Gift,
  CheckCircle2,
  XCircle,
  Sliders,
  Send,
  Coins
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { ModuleGate } from "@/components/module-gate";
import { churnRisk, classDiary } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/retencao")({
  head: () => ({
    meta: [
      { title: "Success & Retenção — Fluency AI" },
      { name: "description", content: "Alertas de churn, diários de classe e controle de gamificação." },
    ],
  }),
  component: RetencaoPage,
});

type Challenge = {
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

const DEFAULT_CHALLENGES: Challenge[] = [
  { id: "1", title: "Praticar pronúncia da Unit 7", xp: 100, coins: 20, frequency: "Diária", completed: false },
  { id: "2", title: "Enviar lição de casa de ontem", xp: 200, coins: 40, frequency: "Diária", completed: false },
  { id: "3", title: "Marcar presença na aula de hoje", xp: 150, coins: 30, frequency: "Diária", completed: false },
];

const DEFAULT_REWARDS: Reward[] = [
  { id: "1", name: "Lápis Fluency AI", cost: 100, stock: 50 },
  { id: "2", name: "Garrafa Térmica Fluency", cost: 800, stock: 15 },
  { id: "3", name: "1 Aula de Conversação VIP", cost: 500, stock: 99 },
];

const DEFAULT_REDEMPTIONS: Redemption[] = [
  { id: "red-1", studentName: "Felipe Medeiros", itemName: "Lápis Fluency AI", cost: 100, date: "19/08/2026", status: "Pendente" },
];

const CHALLENGES_KEY = "fluency-ai:gamification:challenges";
const REWARDS_KEY = "fluency-ai:gamification:rewards";
const REDEMPTIONS_KEY = "fluency-ai:gamification:redemptions";

function RetencaoPage() {
  const [activeTab, setActiveTab] = useState<"churn" | "gamification" | "redemptions">("churn");
  
  // Shared States
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [redemptions, setRedemptions] = useState<Redemption[]>(DEFAULT_REDEMPTIONS);

  // Forms states
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeXp, setChallengeXp] = useState(100);
  const [challengeCoins, setChallengeCoins] = useState(20);
  const [challengeFreq, setChallengeFreq] = useState<Challenge["frequency"]>("Diária");

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardName, setRewardName] = useState("");
  const [rewardCost, setRewardCost] = useState(150);
  const [rewardStock, setRewardStock] = useState(10);

  // Load from local storage
  useEffect(() => {
    try {
      const rawC = window.localStorage.getItem(CHALLENGES_KEY);
      if (rawC) setChallenges(JSON.parse(rawC));
      
      const rawR = window.localStorage.getItem(REWARDS_KEY);
      if (rawR) setRewards(JSON.parse(rawR));

      const rawRed = window.localStorage.getItem(REDEMPTIONS_KEY);
      if (rawRed) setRedemptions(JSON.parse(rawRed));
    } catch {
      /* ignore */
    }
  }, []);

  const saveChallenges = (next: Challenge[]) => {
    setChallenges(next);
    window.localStorage.setItem(CHALLENGES_KEY, JSON.stringify(next));
  };

  const saveRewards = (next: Reward[]) => {
    setRewards(next);
    window.localStorage.setItem(REWARDS_KEY, JSON.stringify(next));
  };

  const saveRedemptions = (next: Redemption[]) => {
    setRedemptions(next);
    window.localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(next));
  };

  const handleContactStudent = (aluno: string) => {
    toast.success(`Abrindo chat de acolhimento para ${aluno}`, {
      description: "Carregando histórico escolar e template de conversa no WhatsApp...",
    });
  };

  // Add Challenge
  const handleAddChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeTitle.trim()) return;

    const newChallenge: Challenge = {
      id: "ch-" + Date.now(),
      title: challengeTitle,
      xp: challengeXp,
      coins: challengeCoins,
      frequency: challengeFreq,
      completed: false,
    };

    const next = [...challenges, newChallenge];
    saveChallenges(next);
    setIsChallengeModalOpen(false);
    setChallengeTitle("");
    toast.success("Nova missão cadastrada com sucesso!");
  };

  // Delete Challenge
  const handleDeleteChallenge = (id: string) => {
    const next = challenges.filter((c) => c.id !== id);
    saveChallenges(next);
    toast.success("Missão removida.");
  };

  // Add Reward
  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardName.trim()) return;

    const newReward: Reward = {
      id: "rew-" + Date.now(),
      name: rewardName,
      cost: rewardCost,
      stock: rewardStock,
    };

    const next = [...rewards, newReward];
    saveRewards(next);
    setIsRewardModalOpen(false);
    setRewardName("");
    toast.success("Recompensa cadastrada na Loja do Aluno!");
  };

  // Delete Reward
  const handleDeleteReward = (id: string) => {
    const next = rewards.filter((r) => r.id !== id);
    saveRewards(next);
    toast.success("Recompensa removida da Loja.");
  };

  // Approve Redemption (Deliver Prize)
  const handleDeliverPrize = (id: string) => {
    const next = redemptions.map((r) =>
      r.id === id ? { ...r, status: "Entregue" as const } : r
    );
    saveRedemptions(next);
    toast.success("Resgate marcado como entregue!", {
      description: "As moedas já foram debitadas do saldo do aluno.",
    });
  };

  // Cancel Redemption
  const handleCancelPrize = (id: string) => {
    const next = redemptions.map((r) =>
      r.id === id ? { ...r, status: "Cancelado" as const } : r
    );
    saveRedemptions(next);
    toast.info("Resgate cancelado.");
  };

  return (
    <ModuleGate module="success">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação"
          title="Customer Success, Retenção & Gamificação"
          description="Monitore indicadores preditivos de risco de evasão, acompanhe diários de classe digitais e gerencie as missões e prêmios da gamificação dos alunos."
        />

        {/* Tab Navigator */}
        <div className="flex border-b border-hairline gap-8 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab("churn")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "churn"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <HeartPulse className="size-4" /> Evasão & Diários
          </button>
          <button
            onClick={() => setActiveTab("gamification")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "gamification"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="size-4" /> Gerenciar Gamificação
          </button>
          <button
            onClick={() => setActiveTab("redemptions")}
            className={`pb-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "redemptions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gift className="size-4" /> Prêmios Solicitados ({redemptions.filter(r => r.status === "Pendente").length})
          </button>
        </div>

        {/* TAB 1: CHURN ALERTS & CLASS DIARIES */}
        {activeTab === "churn" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Churn Risk list card */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-hairline mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Alerta Preditivo de Evasão (Churn)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Cruzamento automático de presença, pagamentos e notas</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <HeartPulse className="size-4.5 text-rose-400" />
                </span>
              </div>

              <ul className="space-y-4">
                {churnRisk.map((c) => (
                  <li key={c.aluno} className="rounded-xl border border-hairline bg-surface/30 p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{c.aluno}</span>
                      <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400">
                        Risco {c.score}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all"
                        style={{ width: `${c.score}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <p className="text-muted-foreground">
                          Motivo: <span className="font-medium text-foreground">{c.motivo}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Turma: {c.turma}</p>
                      </div>
                      <button
                        onClick={() => handleContactStudent(c.aluno)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
                      >
                        <MessageSquare className="size-3.5" /> Acolher
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Class Diary card list */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-hairline mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Diário de Classe Digital</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Registros pedagógicos recentes enviados pelos professores</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                  <BookOpen className="size-4.5 text-primary" />
                </span>
              </div>

              <ul className="divide-y divide-hairline">
                {classDiary.map((diary) => (
                  <li key={diary.turma} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{diary.turma}</span>
                      <span className="text-muted-foreground">{diary.data}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Conteúdo: <span className="text-foreground">{diary.conteudo}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <UserCheck className="size-3.5 text-paid" />
                      <span>Presença registrada: {diary.presenca} alunos</span>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        )}

        {/* TAB 2: GAMIFICATION MANAGER */}
        {activeTab === "gamification" && (
          <div className="grid gap-6 md:grid-cols-2 items-start">
            
            {/* Missions challenges card manager */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Gerenciador de Missões / Tarefas</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Desafios que premiam o aluno com XP e Moedas</p>
                </div>
                <button
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  <Plus className="size-3.5" /> Criar Missão
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {challenges.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-hairline bg-surface/30 p-4">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{c.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-primary font-semibold">{c.frequency}</span>
                        <span>+{c.xp} XP</span>
                        <span className="flex items-center gap-0.5 text-yellow-500 font-semibold"><Coins className="size-3" /> +{c.coins} Moedas</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteChallenge(c.id)}
                      className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      aria-label="Excluir missão"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Rewards Catalog manager */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Loja de Recompensas (Prêmios)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Catálogo de itens para os alunos trocarem suas moedas</p>
                </div>
                <button
                  onClick={() => setIsRewardModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                >
                  <Plus className="size-3.5" /> Cadastrar Prêmio
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {rewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-hairline bg-surface/30 p-4">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{r.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5 text-yellow-500 font-bold"><Coins className="size-3" /> {r.cost} Moedas</span>
                        <span>Estoque: {r.stock} unidades</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReward(r.id)}
                      className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      aria-label="Excluir recompensa"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>
        )}

        {/* TAB 3: REDEMPTIONS REQUESTS QUEUE */}
        {activeTab === "redemptions" && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Fila de Prêmios Solicitados</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Acompanhe as solicitações de troca de moedas feitas pelos alunos</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                <Gift className="size-4.5 text-primary" />
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-surface-elevated/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Recompensa Solicitada</th>
                    <th className="px-4 py-3">Valor (Moedas)</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Situação</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {redemptions.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-surface/20">
                      <td className="px-4 py-3 font-semibold text-foreground">{r.studentName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.itemName}</td>
                      <td className="px-4 py-3 font-bold text-yellow-500">{r.cost} moedas</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.date}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          r.status === "Pendente" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                          r.status === "Entregue" ? "bg-paid/10 border-paid/20 text-paid" :
                          "bg-overdue/10 border-overdue/20 text-overdue"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {r.status === "Pendente" && (
                          <>
                            <button
                              onClick={() => handleDeliverPrize(r.id)}
                              className="rounded-lg bg-paid text-paid-foreground px-2.5 py-1 text-xs font-semibold hover:bg-paid/90 transition-colors cursor-pointer"
                            >
                              Dar Baixa / Entregar
                            </button>
                            <button
                              onClick={() => handleCancelPrize(r.id)}
                              className="rounded-lg bg-white/5 border border-hairline px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {r.status !== "Pendente" && (
                          <span className="text-[11px] text-muted-foreground italic">Processado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {redemptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground text-xs">Nenhum prêmio solicitado até o momento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* MODAL: CREATE CHALLENGE */}
        {isChallengeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-hairline bg-background p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h3 className="text-sm font-bold text-foreground">Criar Nova Missão</h3>
                <button onClick={() => setIsChallengeModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <XCircle className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddChallenge} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Título da Missão / Atividade</label>
                  <input
                    placeholder="Praticar vocabulário da Unit 8"
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Premiação XP</label>
                    <input
                      type="number"
                      value={challengeXp}
                      onChange={(e) => setChallengeXp(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Premiação Moedas</label>
                    <input
                      type="number"
                      value={challengeCoins}
                      onChange={(e) => setChallengeCoins(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Frequência</label>
                  <select
                    value={challengeFreq}
                    onChange={(e) => setChallengeFreq(e.target.value as any)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-foreground outline-none focus:border-primary"
                  >
                    <option value="Diária">Diária (Challenge diário)</option>
                    <option value="Semanal">Semanal (Tarefa de fixação)</option>
                    <option value="Especial">Especial (Conquista única)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsChallengeModalOpen(false)}
                    className="rounded-lg bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                  >
                    Salvar Missão
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE REWARD */}
        {isRewardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-hairline bg-background p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h3 className="text-sm font-bold text-foreground">Cadastrar Recompensa</h3>
                <button onClick={() => setIsRewardModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <XCircle className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddReward} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome do Prêmio / Item</label>
                  <input
                    placeholder="Moletom Fluency AI"
                    value={rewardName}
                    onChange={(e) => setRewardName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custo em Moedas</label>
                    <input
                      type="number"
                      value={rewardCost}
                      onChange={(e) => setRewardCost(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estoque Inicial</label>
                    <input
                      type="number"
                      value={rewardStock}
                      onChange={(e) => setRewardStock(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsRewardModalOpen(false)}
                    className="rounded-lg bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer"
                  >
                    Salvar Prêmio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ModuleGate>
  );
}
