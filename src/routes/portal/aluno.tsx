import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Coins, Trophy, Award, CheckCircle2, ChevronRight, User, Share2, Sparkles, Send } from "lucide-react";
import { useTenant } from "@/modules/tenant-context";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/aluno")({
  head: () => ({
    meta: [
      { title: "Portal do Aluno — Lumen ERP" },
      { name: "description", content: "Portal gamificado do aluno no Lumen ERP." },
    ],
  }),
  component: PortalAlunoPage,
});

type Task = {
  id: number;
  title: string;
  xp: number;
  coins: number;
  completed: boolean;
};

function PortalAlunoPage() {
  const { tenant } = useTenant();
  const [xp, setXp] = useState(1450);
  const [coins, setCoins] = useState(380);
  const [streak, setStreak] = useState(5);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Praticar pronúncia da Unit 7", xp: 100, coins: 20, completed: false },
    { id: 2, title: "Enviar lição de casa de ontem", xp: 200, coins: 40, completed: false },
    { id: 3, title: "Marcar presença na aula de hoje", xp: 150, coins: 30, completed: false },
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { position: 1, name: "Lucas M.", xp: 2150, active: false },
    { position: 2, name: "Ana Clara", xp: 1890, active: false },
    { position: 3, name: "Você", xp: 1450, active: true },
    { position: 4, name: "Rodrigo F.", xp: 1320, active: false },
    { position: 5, name: "Gabi Dias", xp: 1100, active: false },
  ]);

  const handleTaskComplete = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id && !t.completed) {
        // First completion
        const nextXp = xp + t.xp;
        const nextCoins = coins + t.coins;
        setXp(nextXp);
        setCoins(nextCoins);
        
        // Update user position in leaderboard
        setLeaderboard(leader => {
          const nextLeader = leader.map(u => u.active ? { ...u, xp: nextXp } : u);
          return nextLeader.sort((a, b) => b.xp - a.xp).map((u, idx) => ({ ...u, position: idx + 1 }));
        });

        toast.success(`Parabéns! +${t.xp} XP e +${t.coins} moedas`, {
          description: `Tarefa "${t.title}" concluída com sucesso!`,
        });

        return { ...t, completed: true };
      }
      return t;
    }));
  };

  const handleReferral = () => {
    toast.success("Link de Indicação Copiado!", {
      description: "Envie no WhatsApp dos seus amigos para ganhar 500 Lumen Coins quando eles agendarem!",
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
            <Sparkles className="size-3.5 text-primary" /> White-Label Ativo:
          </p>
          <p>O Portal assume dinamicamente o branding da escola: <strong className="text-foreground">{tenant.name}</strong>.</p>
          <p>A cor primária ativa é aplicada automaticamente em todos os botões, badges e barras de progresso do app.</p>
        </div>
      </div>

      {/* SMARTPHONE DEVICE WRAPPER */}
      <div className="relative mx-auto w-full max-w-[390px] h-[820px] rounded-[50px] border-[12px] border-neutral-900 bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-between text-white select-none">
        
        {/* Notch details */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-50 flex items-center justify-center">
          <span className="size-2 rounded-full bg-neutral-800 mr-2" />
          <span className="w-10 h-1 bg-neutral-800 rounded-full" />
        </div>

        {/* Dynamic Space Background inside app */}
        <div className="pointer-events-none absolute inset-0 bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950" />
        <div className="pointer-events-none absolute top-[-5%] left-[-5%] h-[40%] w-[50%] rounded-full bg-primary/5 blur-[80px]" />

        {/* APP MAIN CONTENT SCREEN */}
        <div className="relative z-10 flex-1 overflow-y-auto pt-10 px-5 pb-6 space-y-6 scrollbar-none">
          
          {/* App Header Branding */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400">{tenant.name}</p>
              <h1 className="text-sm font-bold text-white">Student Space</h1>
            </div>
            {/* Quick stats box */}
            <div className="flex gap-2">
              <span className="flex items-center gap-1 bg-neutral-900/80 border border-white/5 rounded-full px-2.5 py-1 text-xs font-semibold text-orange-400">
                <Flame className="size-3.5 fill-current" /> {streak}d
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

            {/* XP bar */}
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

          {/* Daily Quests section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Missões do Dia</h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  disabled={task.completed}
                  onClick={() => handleTaskComplete(task.id)}
                  className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    task.completed
                      ? "border-white/5 bg-white/[0.01] opacity-60"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid size-8 place-items-center rounded-lg border ${
                      task.completed ? "bg-primary/10 border-primary/20 text-primary" : "bg-neutral-900 border-white/5 text-neutral-500"
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
                Indique sua escola e ganhe 500 Lumen Coins para gastar na loja!
              </p>
            </div>
            <button
              onClick={handleReferral}
              aria-label="Convidar amigo"
              className="grid size-9 place-items-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow cursor-pointer transition-all active:scale-[0.96]"
            >
              <Send className="size-4" />
            </button>
          </div>

        </div>

        {/* Mobile footer bar */}
        <div className="relative z-10 border-t border-white/5 bg-neutral-950/80 px-8 py-3.5 flex justify-center items-center">
          <div className="w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>

    </div>
  );
}
