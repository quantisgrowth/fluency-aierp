import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Sun, Moon, GraduationCap, Sparkles, Sliders } from "lucide-react";
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

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Plataforma Master — Fluency AI" },
      { name: "description", content: "Acesso administrativo restrito à plataforma." },
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
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (data.email === "super@fluency.ai" && data.password === "super_secret") {
        toast.success("Acesso Master concedido!", {
          description: "Redirecionando para o Console Geral...",
        });
        window.localStorage.setItem("fluency-ai:active-role", "admin");
        window.localStorage.setItem("fluency-ai:active-company", "Unidade Pinheiros");
        window.location.href = "/super-admin";
      } else {
        toast.error("Credenciais Master inválidas!");
      }
    }, 1200);
  };

  const autofillMaster = () => {
    setValue("email", "super@fluency.ai");
    setValue("password", "super_secret");
    toast.info("Credenciais de Administrador Geral preenchidas.");
  };

  return (
    <div className="flex min-h-screen w-full select-none items-center justify-center bg-[#05060a] font-sans text-foreground p-4">
      
      {/* Dynamic Keyframe Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.12; }
          50% { transform: scale(1.15); opacity: 0.22; }
        }
        .animate-float-slow {
          animation: float 22s infinite ease-in-out;
        }
        .animate-pulse-glow {
          animation: pulseGlow 12s infinite ease-in-out;
        }
      `}</style>

      {/* Decorative Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px] animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-40 right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[120px] animate-float-slow" />
      
      {/* Dot Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: "radial-gradient(white 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }} />

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        
        {/* Floating Logo Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <span className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
            <Sliders className="size-6 text-primary animate-pulse" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Fluency AI Master</h1>
            <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold mt-0.5">Console de Administração Geral</p>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-white bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              Acesso Restrito
            </h2>
            <p className="text-xs text-neutral-400">
              Autenticação de uso exclusivo para gestores da plataforma e equipe técnica.
            </p>
          </div>

          {/* Master Demo Credentials */}
          <button
            onClick={autofillMaster}
            className="flex w-full items-center gap-3.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left text-xs text-primary transition-all hover:bg-primary/10 cursor-pointer"
          >
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="size-4 text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-primary">Acesso Master</p>
              <p className="text-[10px] opacity-80 mt-0.5">Clique aqui para preencher credenciais de teste.</p>
            </div>
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                E-mail Master
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="super@fluency.ai"
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
                  Chave Secreta
                </Label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Tema: {isDark ? "Escuro" : "Claro"}
                </button>
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

            <Button
              type="submit"
              className="mt-2 w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-lg active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden group/btn"
              disabled={isLoading}
            >
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
                <span>Entrar no Console</span>
              )}
            </Button>
          </form>

        </div>

        {/* Technical warning footer */}
        <p className="text-center text-[10px] text-neutral-500 leading-relaxed px-6">
          Aviso: Tentativas de acesso não autorizadas serão registradas em nossos logs de auditoria IP e reportadas à equipe de segurança.
        </p>
      </div>

    </div>
  );
}
