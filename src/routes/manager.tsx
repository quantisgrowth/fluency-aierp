import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  GraduationCap,
  ShieldCheck,
  Lock,
  ArrowRight,
  Server,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Form validation schema
const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail master"),
  password: z.string().min(1, "Informe sua senha de segurança"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Portal do Administrador Master — Fluency AI" },
      { name: "description", content: "Acesso administrativo master à gestão de franqueadoras e unidades da plataforma." },
    ],
  }),
  component: ManagerLoginPage,
});

function ManagerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

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
      email: "master@fluencyai.online",
      password: "••••••••",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      // Conceder permissão master de Super Admin
      window.localStorage.setItem("fluency-ai:active-role", "admin");
      window.localStorage.setItem("fluency-ai:is-super-admin", "true");
      window.localStorage.setItem("fluency-ai:active-company", "Unidade Pinheiros");

      toast.success("Autenticação Master Concluída!", {
        description: "Acesso de Super Administrador da Plataforma liberado.",
      });

      window.location.href = "/super-admin";
    }, 600);
  };

  return (
    <div className="flex min-h-screen w-full select-none items-center justify-center bg-[#05060a] font-sans text-foreground p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#0d111d_0%,_#05060a_100%)]" />
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-amber-500/10 blur-[130px]" />

      {/* Top bar theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>

      {/* Center Console Modal */}
      <div className="relative z-10 w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-3xl border border-amber-500/30 bg-neutral-950/85 p-8 sm:p-10 shadow-[0_0_50px_rgba(245,158,11,0.1)] backdrop-blur-2xl space-y-7 text-white">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <span className="grid size-14 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-inner">
              <ShieldCheck className="size-7" />
            </span>
            <div>
              <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-400 border border-amber-500/20">
                Plataforma Global
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight mt-1.5">Console do Administrador</h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Controle master de franquias, unidades escolares e faturamento.
              </p>
            </div>
          </div>

          {/* Master Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                E-mail de Acesso Master
              </Label>
              <Input
                id="email"
                placeholder="master@fluencyai.online"
                className="h-11 border-white/10 bg-white/5 px-3.5 text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400 text-xs font-mono"
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Chave de Segurança / Senha Master
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="h-11 border-white/10 bg-white/5 pr-10 pl-3.5 text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400 text-xs font-mono"
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

            <Button
              type="submit"
              className="mt-2 w-full h-11 bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs shadow-xl active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Autenticando Console Master...</span>
              ) : (
                <>
                  <span>Acessar Painel Super Administrador</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Info */}
          <div className="pt-2 border-t border-white/10 text-center">
            <p className="text-[10px] text-neutral-500">
              Acesso exclusivo para a diretoria e mantenedora da plataforma Fluency AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
