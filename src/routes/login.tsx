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
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Form validation schema
const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail"),
  password: z.string().min(1, "Informe a senha"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Fluency AI ERP" },
      { name: "description", content: "Acesse o painel do Fluency AI ERP para escolas de idiomas." },
    ],
  }),
  component: LoginPage,
});

type ModuleId = "core" | "financeiro" | "crm" | "success";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleId>("core");
  const [isDark, setIsDark] = useState(true);
  const [loginProfile, setLoginProfile] = useState<"gestor" | "super" | "aluno">("gestor");

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
      email: "gestor@fluency.ai",
      password: "fluency_admin_secret",
    },
  });

  const handleQuickLogin = (targetProfile: "gestor" | "super" | "aluno") => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.localStorage.setItem(
        "fluency-ai:active-role",
        targetProfile === "super" ? "admin" : targetProfile === "aluno" ? "aluno" : "admin"
      );
      window.localStorage.setItem("fluency-ai:active-company", "Unidade Pinheiros");

      toast.success("Login efetuado com sucesso!", {
        description: `Conectado como ${
          targetProfile === "super"
            ? "Administrador Master da Plataforma"
            : targetProfile === "aluno"
            ? "Aluno (Portal Gamificado)"
            : "Gestor da Escola (Painel Completo)"
        }.`,
      });

      if (targetProfile === "super") {
        window.location.href = "/super-admin";
      } else if (targetProfile === "aluno") {
        window.location.href = "/portal/aluno";
      } else {
        window.location.href = "/";
      }
    }, 600);
  };

  const onSubmit = (data: LoginFormValues) => {
    handleQuickLogin(loginProfile);
  };

  const autofillDemo = () => {
    if (loginProfile === "aluno") {
      setValue("email", "aluno@fluency.ai");
      setValue("password", "aluno_secret");
    } else if (loginProfile === "super") {
      setValue("email", "superadmin@fluency.ai");
      setValue("password", "master_secret");
    } else {
      setValue("email", "gestor@fluency.ai");
      setValue("password", "fluency_admin_secret");
    }
    toast.info("Credenciais de teste preenchidas.");
  };

  const modules = [
    {
      id: "core" as ModuleId,
      name: "Core Pedagógico & Cursos",
      desc: "Matrículas, turmas, contratos e níveis CEFR",
      icon: BookOpen,
      color: "text-blue-400",
    },
    {
      id: "financeiro" as ModuleId,
      name: "Motor Financeiro & DRE",
      desc: "Previsibilidade de caixa e precificação por custos",
      icon: Wallet,
      color: "text-emerald-400",
    },
    {
      id: "crm" as ModuleId,
      name: "CRM Comercial & Funil",
      desc: "Kanban interativo de captação de novos alunos",
      icon: Kanban,
      color: "text-indigo-400",
    },
    {
      id: "success" as ModuleId,
      name: "Success & Portal do Aluno",
      desc: "Gamificação, ranking e retenção preditiva",
      icon: HeartPulse,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="flex min-h-screen w-full select-none overflow-hidden bg-[#07090e] font-sans text-foreground">
      {/* LEFT PANEL: Platform Capabilities Showcase */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-white/5 bg-[#030407] p-12 text-white lg:flex overflow-hidden">
        {/* Animated Background blobs */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,_#090d16_0%,_#030407_100%)]" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 right-12 h-80 w-80 rounded-full bg-indigo-500/5 blur-[100px]" />

        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
            <GraduationCap className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Fluency AI ERP</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">Sistema de Gestão para Escolas de Idiomas</p>
          </div>
        </div>

        {/* Central Platform Highlights */}
        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <div className="space-y-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary border border-primary/20 uppercase tracking-widest">
              Plataforma 360º Integrada
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Tudo o que sua escola precisa para crescer com controle.
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Integração ponta a ponta entre captação de leads, contratos por hora/aula ou turma, DRE em tempo real e portal do aluno gamificado.
            </p>
          </div>

          {/* Interactive Module Pills */}
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
        </div>

        {/* Footer Statistics */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-6 text-xs text-neutral-500">
          <span>Ambiente Seguro & Homologado</span>
          <span>© {new Date().getFullYear()} Fluency AI</span>
        </div>
      </div>

      {/* RIGHT PANEL: Floating Glassmorphic Authentication */}
      <div className="relative flex w-full flex-col justify-between p-6 sm:p-12 md:p-16 lg:w-1/2 overflow-y-auto">
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
        <div className="relative z-10 mx-auto w-full max-w-[460px] py-8">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
                Acesse sua Conta
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Escolha o perfil de acesso ou utilize os botões de login rápido abaixo.
              </p>
            </div>

            {/* 3-Way Portal Selector */}
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/5 p-1 shadow-inner text-center">
              {[
                { id: "gestor" as const, label: "Gestor Escola", icon: Building2 },
                { id: "super" as const, label: "Admin Master", icon: ShieldCheck },
                { id: "aluno" as const, label: "Aluno", icon: User },
              ].map((p) => {
                const Icon = p.icon;
                const isActive = loginProfile === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setLoginProfile(p.id);
                      if (p.id === "super") {
                        setValue("email", "superadmin@fluency.ai");
                        setValue("password", "master_secret");
                      } else if (p.id === "aluno") {
                        setValue("email", "aluno@fluency.ai");
                        setValue("password", "aluno_secret");
                      } else {
                        setValue("email", "gestor@fluency.ai");
                        setValue("password", "fluency_admin_secret");
                      }
                    }}
                    className={`rounded-lg py-2 px-1 text-[11px] font-bold tracking-wide transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Fast 1-Click Pass Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                ⚡ Acesso Rápido de Demonstração (1 Clique):
              </span>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("gestor")}
                  disabled={isLoading}
                  className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="size-4" />
                    <span>Painel do Gestor Escolar (Pinheiros)</span>
                  </div>
                  <ArrowRight className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("super")}
                  disabled={isLoading}
                  className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="size-4" />
                    <span>Portal do Administrador da Plataforma (Super Admin)</span>
                  </div>
                  <ArrowRight className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("aluno")}
                  disabled={isLoading}
                  className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="size-4" />
                    <span>Portal do Aluno (Gamificado)</span>
                  </div>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 border-t border-white/10">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  E-mail institucional
                </Label>
                <Input
                  id="email"
                  placeholder="nome@escola.com.br"
                  className="h-10 border-white/10 bg-white/5 px-3.5 text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-xs"
                  disabled={isLoading}
                  {...register("email")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Senha de acesso
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-10 border-white/10 bg-white/5 pr-10 pl-3.5 text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-xs"
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
              </div>

              <Button
                type="submit"
                className="mt-2 w-full h-10 bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 shadow-lg active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Autenticando..." : "Entrar com Credenciais"}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Support Information */}
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-[11px] text-neutral-500 sm:flex-row">
          <span>Fluency AI — Versão Piloto Escolar</span>
          <span>Suporte: 0800 591 0422</span>
        </div>
      </div>
    </div>
  );
}
