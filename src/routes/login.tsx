import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BookOpen,
  Wallet,
  Kanban,
  HeartPulse,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Fluency AI" },
      { name: "description", content: "Acesse o painel do Fluency AI." },
    ],
  }),
  component: LoginPage,
});

type ModuleId = "core" | "financeiro" | "crm" | "success";

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleId>("core");
  const [isDark, setIsDark] = useState(true);
  const [loginProfile, setLoginProfile] = useState<"aluno" | "gestor" | "super">("gestor");

  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem("fluency-ai:theme", nextDark ? "dark" : "light");
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Login realizado com sucesso!", {
        description: `Bem-vindo de volta ao Fluency AI como ${
          loginProfile === "aluno" ? "Aluno" : loginProfile === "super" ? "Administrador da Plataforma" : "Gestor da Escola"
        }.`,
      });

      // Commit simulated login state to local storage
      window.localStorage.setItem("fluency-ai:active-role", loginProfile === "super" ? "admin" : loginProfile === "aluno" ? "aluno" : "admin");
      window.localStorage.setItem("fluency-ai:active-company", "Unidade Pinheiros");

      if (loginProfile === "aluno") {
        window.location.href = "/portal/aluno";
      } else if (loginProfile === "super") {
        window.location.href = "/super-admin";
      } else {
        window.location.href = "/";
      }
    }, 1000);
  };

  const autofillDemo = () => {
    if (loginProfile === "aluno") {
      setValue("email", "aluno@fluency.ai");
      setValue("password", "aluno_secret");
    } else if (loginProfile === "super") {
      setValue("email", "super@fluency.ai");
      setValue("password", "super_secret");
    } else {
      setValue("email", "gestor@fluency.ai");
      setValue("password", "fluency_admin_secret");
    }
    toast.info("Credenciais de teste preenchidas.");
  };

  const modules = [
    {
      id: "core" as ModuleId,
      name: "Core Pedagógico",
      desc: "Gestão de alunos, professores e proficiência",
      icon: BookOpen,
      color: "text-blue-400",
      bgGlow: "from-blue-500/10 to-transparent",
    },
    {
      id: "financeiro" as ModuleId,
      name: "Motor Financeiro",
      desc: "Previsibilidade de caixa e cobrança inteligente",
      icon: Wallet,
      color: "text-emerald-400",
      bgGlow: "from-emerald-500/10 to-transparent",
    },
    {
      id: "crm" as ModuleId,
      name: "CRM Comercial",
      desc: "Funil Kanban de captação e conversão de leads",
      icon: Kanban,
      color: "text-indigo-400",
      bgGlow: "from-indigo-500/10 to-transparent",
    },
    {
      id: "success" as ModuleId,
      name: "Success & Retenção",
      desc: "Alertas preditivos de evasão e portal escolar",
      icon: HeartPulse,
      color: "text-rose-400",
      bgGlow: "from-rose-500/10 to-transparent",
    },
  ];

  return (
    <div className="flex min-h-screen w-full select-none overflow-hidden bg-[#07090e] font-sans text-foreground">
      
      {/* Dynamic Keyframe Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.12; }
          50% { transform: scale(1.12); opacity: 0.22; }
        }
        .animate-float-slow {
          animation: float 20s infinite ease-in-out;
        }
        .animate-float-slower {
          animation: float 26s infinite ease-in-out;
          animation-delay: 3s;
        }
        .animate-pulse-glow {
          animation: pulseGlow 10s infinite ease-in-out;
        }
      `}</style>

      {/* LEFT PANEL: SpaceX / Immersive Luxury Tech Showcase */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-white/5 bg-[#030407] p-12 text-white lg:flex overflow-hidden">
        
        {/* Animated Background blobs */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,_#090d16_0%,_#030407_100%)]" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        <div className="pointer-events-none absolute -bottom-24 right-12 h-80 w-80 rounded-full bg-indigo-500/5 blur-[100px] animate-float-slow" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-emerald-500/5 blur-[80px] animate-float-slower" />

        {/* Technical dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />

        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
            <GraduationCap className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Fluency AI</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">Language Schools</p>
          </div>
        </div>

        {/* Dynamic Preview Container */}
        <div className="relative z-10 my-auto flex flex-col justify-center gap-8 py-6 max-w-md">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-neutral-300 backdrop-blur-md">
              <Sparkles className="size-3.5 text-primary animate-pulse" />
              <span>O primeiro ERP 100% modular de idiomas</span>
            </div>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              Pague apenas pelo que a sua escola usar.
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Ative ou desative módulos conforme sua escola cresce, otimizando seus custos operacionais.
            </p>
          </div>

          {/* Module interactive selector */}
          <div className="grid gap-2.5">
            {modules.map((m) => {
              const active = selectedModule === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`group relative flex items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-300 cursor-pointer ${
                    active
                      ? "border-white/20 bg-white/5 shadow-xl backdrop-blur-md"
                      : "border-transparent hover:border-white/5 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`grid size-9 place-items-center rounded-lg border border-white/5 transition-colors ${
                        active ? "bg-primary/20 border-primary/30" : "bg-white/5"
                      }`}
                    >
                      <Icon className={`size-4.5 ${m.color}`} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">{m.name}</p>
                      <p className="text-[11px] text-neutral-400">{m.desc}</p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`size-4 text-neutral-500 transition-all ${
                      active ? "translate-x-0.5 opacity-100 text-primary" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Interactive Live Data Showcase */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900/40 p-5 shadow-2xl backdrop-blur-xl">
            {selectedModule === "core" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Status do Pedagógico</span>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/10">Ativo</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Alunos Ativos</span>
                    <p className="text-lg font-bold text-white mt-0.5">482</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Turmas</span>
                    <p className="text-lg font-bold text-white mt-0.5">34</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Proficiência</span>
                    <p className="text-lg font-bold text-white mt-0.5">CEFR A1-C2</p>
                  </div>
                </div>
              </div>
            )}

            {selectedModule === "financeiro" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Status do Caixa</span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/10">Seguro</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Inadimplência</span>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">2.4%</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Faturamento</span>
                    <p className="text-lg font-bold text-white mt-0.5">R$ 84k</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Dunning Auto</span>
                    <p className="text-lg font-bold text-white mt-0.5">Ativado</p>
                  </div>
                </div>
              </div>
            )}

            {selectedModule === "crm" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Funil de Matrículas</span>
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/10">Em Alta</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Novos Leads</span>
                    <p className="text-lg font-bold text-white mt-0.5">18 esta semana</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Taxa de Conv.</span>
                    <p className="text-lg font-bold text-white mt-0.5">34.8%</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-bold">Pipelines</span>
                    <p className="text-lg font-bold text-white mt-0.5">Kanban Ativo</p>
                  </div>
                </div>
              </div>
            )}

            {selectedModule === "success" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Retenção de Alunos</span>
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/10">Protegido</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span>Taxa de Renovação</span>
                    <span className="font-semibold text-rose-400">92.4%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[92.4%] rounded-full bg-rose-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Statistics Badge */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-6 text-xs text-neutral-500">
          <span>Mais de 500 escolas de idiomas geridas</span>
          <span>© {new Date().getFullYear()} Fluency AI</span>
        </div>
      </div>

      {/* RIGHT PANEL: Floating Glassmorphic Authentication */}
      <div className="relative flex w-full flex-col justify-between p-6 sm:p-12 md:p-16 lg:w-1/2 overflow-hidden">
        
        {/* Animated Background blobs for Right Panel */}
        <div className="pointer-events-none absolute inset-0 bg-[#07090e] lg:bg-transparent" />
        <div className="pointer-events-none absolute top-1/2 right-[-20%] h-96 w-96 rounded-full bg-primary/5 blur-[120px] animate-pulse-glow" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-indigo-500/5 blur-[100px] animate-float-slow" />

        {/* Technical dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "16px 16px"
        }} />

        {/* Top bar with theme toggle */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg border border-white/5 bg-white/5">
              <GraduationCap className="size-4 text-primary" />
            </span>
            <span className="text-xs font-semibold text-white">Fluency AI</span>
          </div>
          <div className="ml-auto flex gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="grid size-9 place-items-center rounded-lg border border-white/5 bg-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>

        {/* Center card form */}
        <div className="relative z-10 mx-auto w-full max-w-[440px] py-12">
          
          <div className="rounded-2xl border border-white/10 bg-neutral-900/55 p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
                Acesse sua conta
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Escolha seu portal de acesso e faça login no Fluency AI.
              </p>
            </div>

            {/* Segment Selector for Portals */}
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/5 bg-white/5 p-1 shadow-inner">
              {(["aluno", "gestor", "super"] as const).map((p) => {
                const label = {
                  aluno: "Aluno",
                  gestor: "Gestor",
                  super: "Master",
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLoginProfile(p)}
                    className={`rounded-lg py-2 text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      loginProfile === p
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {label[p]}
                  </button>
                );
              })}
            </div>

            {/* Demonstration Credentials Box */}
            <button
              onClick={autofillDemo}
              className="flex w-full items-center gap-3.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left text-xs text-primary transition-all hover:bg-primary/10 cursor-pointer"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10 shrink-0">
                <Sparkles className="size-4 text-primary animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-primary">Credenciais de Demonstração</p>
                <p className="text-[10px] opacity-80 mt-0.5">Clique aqui para preencher automaticamente.</p>
              </div>
            </button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  E-mail institucional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@escola.com.br"
                  className={`h-11 border-white/5 bg-white/5 px-3.5 text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(139,92,246,0.15)] ${
                    errors.email ? "border-rose-500/40 focus-visible:ring-rose-500" : ""
                  }`}
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-[11px] font-medium text-rose-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Senha de acesso
                  </Label>
                  <a
                    href="#recuperar"
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Por favor, contate o administrador de TI da sua escola.");
                    }}
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`h-11 border-white/5 bg-white/5 pr-10 pl-3.5 text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(139,92,246,0.15)] ${
                      errors.password ? "border-rose-500/40 focus-visible:ring-rose-500" : ""
                    }`}
                    disabled={isLoading}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] font-medium text-rose-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="remember"
                  type="checkbox"
                  className="size-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                />
                <label htmlFor="remember" className="text-xs text-neutral-400 cursor-pointer">
                  Manter-me conectado nesta máquina
                </label>
              </div>

              <Button
                type="submit"
                className="mt-2 w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-lg active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                disabled={isLoading}
              >
                {/* Button shine sweep animation */}
                <span className="absolute inset-0 w-1/2 h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover/btn:animate-[shinesweep_1s_ease]" />
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <span>Entrar no Sistema</span>
                )}
              </Button>
            </form>

            {/* Social login divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-white/5" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">ou continue com</span>
              <hr className="flex-1 border-white/5" />
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toast.info("Integração com Google Workspace simulada.")}
                className="flex items-center justify-center gap-2 h-10 rounded-lg border border-white/5 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.34 0-6.05-2.71-6.05-6.05s2.71-6.05 6.05-6.05c1.47 0 2.82.53 3.88 1.41l3.07-3.07C18.96 2.84 15.82 1.7 12.24 1.7c-5.71 0-10.3 4.59-10.3 10.3s4.59 10.3 10.3 10.3c5.37 0 9.84-3.86 9.84-10.3 0-.58-.06-1.12-.17-1.63H12.24z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => toast.info("Integração com Azure Active Directory/Microsoft simulada.")}
                className="flex items-center justify-center gap-2 h-10 rounded-lg border border-white/5 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="size-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z" />
                  <path fill="#81bc06" d="M12 0h11v11H12z" />
                  <path fill="#05a6f0" d="M0 12h11v11H0z" />
                  <path fill="#ffba08" d="M12 12h11v11H12z" />
                </svg>
                Microsoft
              </button>
            </div>

          </div>

        </div>

        {/* Footer Support Information */}
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-[11px] text-neutral-500 sm:flex-row">
          <div className="flex gap-4">
            <a href="#termos" className="hover:underline" onClick={(e) => e.preventDefault()}>Termos de Serviço</a>
            <a href="#privacidade" className="hover:underline" onClick={(e) => e.preventDefault()}>Política de Privacidade</a>
          </div>
          <span>Suporte: 0800 591 0422</span>
        </div>
      </div>

    </div>
  );
}
