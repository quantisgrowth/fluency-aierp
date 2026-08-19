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
      if (loginProfile === "aluno") {
        navigate({ to: "/portal/aluno" });
      } else if (loginProfile === "super") {
        navigate({ to: "/super-admin" });
      } else {
        navigate({ to: "/" });
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
    <div className="flex min-h-screen w-full select-none overflow-hidden bg-background font-sans transition-colors duration-300">
      
      {/* LEFT PANEL: SpaceX / Immersive Luxury Tech Showcase */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-hairline bg-neutral-950 p-12 text-white lg:flex">
        
        {/* Glow overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950" />
        <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[120px]" />
        
        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
            <GraduationCap className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Fluency AI</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Language Schools</p>
          </div>
        </div>

        {/* Dynamic Preview Container */}
        <div className="relative z-10 my-auto flex flex-col justify-center gap-8 py-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-neutral-300">
              <Sparkles className="size-3.5 text-primary" />
              <span>O primeiro ERP 100% modular de idiomas</span>
            </div>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
              Pague apenas pelo que a sua escola usar.
            </h2>
            <p className="max-w-md text-sm text-neutral-400">
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
                  className={`group relative flex items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-300 ${
                    active
                      ? "border-white/20 bg-white/5 shadow-xl backdrop-blur-md"
                      : "border-transparent hover:border-white/5 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`grid size-9 place-items-center rounded-lg border border-white/5 transition-colors ${
                        active ? "bg-white/10" : "bg-white/5"
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
                      active ? "translate-x-0.5 opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Interactive Live Data Showcase */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900/60 p-5 shadow-2xl backdrop-blur-xl">
            {selectedModule === "core" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Status do Pedagógico</span>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">Ativo</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Alunos Ativos</span>
                    <p className="text-lg font-bold text-white">482</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Turmas</span>
                    <p className="text-lg font-bold text-white">34</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Proficiência</span>
                    <p className="text-lg font-bold text-white">CEFR A1-C2</p>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5">
                  <div className="h-full w-4/5 rounded-full bg-blue-400" />
                </div>
              </div>
            )}

            {selectedModule === "financeiro" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Motor Financeiro</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Ativo</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Faturamento</span>
                    <p className="text-lg font-bold text-white">R$ 164,7k</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Adimplência</span>
                    <p className="text-lg font-bold text-white">94,4%</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Uptime</span>
                    <p className="text-lg font-bold text-white">99,9%</p>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5">
                  <div className="h-full w-11/12 rounded-full bg-emerald-400" />
                </div>
              </div>
            )}

            {selectedModule === "crm" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Funil de Captação (CRM)</span>
                  <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400">Ativo</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Novos Leads</span>
                    <p className="text-lg font-bold text-white">120</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Aulas Exp.</span>
                    <p className="text-lg font-bold text-white">45</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Conversão</span>
                    <p className="text-lg font-bold text-white">31,4%</p>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5">
                  <div className="h-full w-1/3 rounded-full bg-indigo-400" />
                </div>
              </div>
            )}

            {selectedModule === "success" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Retenção & Alertas</span>
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-400">Ativo</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Risco Churn</span>
                    <p className="text-lg font-bold text-white">5,2%</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">Evitados</span>
                    <p className="text-lg font-bold text-white">18</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500">NPS Alunos</span>
                    <p className="text-lg font-bold text-white">9,4/10</p>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5">
                  <div className="h-full w-[95%] rounded-full bg-rose-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Statistics Badge */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-6 text-xs text-neutral-400">
          <span>Mais de 10.000 atas de proficiência geradas</span>
          <span>© {new Date().getFullYear()} Fluency AI</span>
        </div>
      </div>

      {/* RIGHT PANEL: Apple-style Minimal Authentication */}
      <div className="relative flex w-full flex-col justify-between p-6 sm:p-12 md:p-16 lg:w-1/2">
        
        {/* Top bar with theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg border border-hairline bg-surface-elevated">
              <GraduationCap className="size-4 text-primary" />
            </span>
            <span className="text-xs font-semibold text-foreground">Fluency AI</span>
          </div>
          <div className="ml-auto flex gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="grid size-9 place-items-center rounded-lg border border-hairline bg-surface/50 text-muted-foreground transition-colors hover:text-foreground"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>

        {/* Center card form */}
        <div className="mx-auto w-full max-w-[420px] py-12">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Acesse sua conta
            </h2>
            <p className="text-sm text-muted-foreground">
              Escolha seu portal de acesso e faça login no Fluency AI.
            </p>
          </div>

          {/* Segment Selector for Portals */}
          <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-hairline bg-surface/50 p-1">
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
                  className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                    loginProfile === p
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
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
            className="mb-6 flex w-full items-center gap-3.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left text-xs text-primary transition-all hover:bg-primary/10"
          >
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Credenciais de Demonstração</p>
              <p className="text-[11px] opacity-80">Clique aqui para preencher automaticamente.</p>
            </div>
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                E-mail institucional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@escola.com.br"
                className={`h-11 border-hairline bg-surface/40 px-3.5 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary ${
                  errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""
                }`}
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Senha de acesso
                </Label>
                <a
                  href="#recuperar"
                  className="text-xs font-medium text-primary hover:underline"
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
                  className={`h-11 border-hairline bg-surface/40 pr-10 pl-3.5 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary ${
                    errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""
                  }`}
                  disabled={isLoading}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                className="size-4 rounded border-hairline text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                Manter-me conectado nesta máquina
              </label>
            </div>

            <Button
              type="submit"
              className="mt-2 w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-lg active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              disabled={isLoading}
            >
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
          <div className="my-6 flex items-center gap-3">
            <hr className="flex-1 border-hairline" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">ou continue com</span>
            <hr className="flex-1 border-hairline" />
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toast.info("Integração com Google Workspace simulada.")}
              className="flex items-center justify-center gap-2 h-10 rounded-lg border border-hairline bg-surface/30 text-xs font-semibold text-foreground hover:bg-surface-elevated/70 transition-colors"
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
              onClick={() => toast.info("Integração com Azure Active Directory/Microsoft simulada.")}
              className="flex items-center justify-center gap-2 h-10 rounded-lg border border-hairline bg-surface/30 text-xs font-semibold text-foreground hover:bg-surface-elevated/70 transition-colors"
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

        {/* Footer Support Information */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 text-[11px] text-muted-foreground sm:flex-row">
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
