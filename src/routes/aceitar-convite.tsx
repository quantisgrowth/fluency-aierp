import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const searchSchema = z.object({ token: z.string().min(20).optional() });

export const Route = createFileRoute("/aceitar-convite")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Aceitar convite — Fluency AI" }] }),
  component: AcceptInvitePage,
});

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const acceptInvite = useCallback(async () => {
    if (!token) throw new Error("O link do convite está incompleto.");
    const { error } = await supabase.rpc("accept_school_invite", {
      _token_hash: await sha256(token),
      _display_name: name,
    });
    if (error) throw error;
    toast.success("Convite aceito. Seu acesso à escola está ativo.");
    await navigate({ to: "/boas-vindas" });
  }, [name, navigate, token]);

  useEffect(() => {
    let active = true;
    async function acceptAuthenticatedInvite() {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session || !token) return;
      setLoading(true);
      try {
        await acceptInvite();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível aceitar o convite.");
        setLoading(false);
      }
    }
    void acceptAuthenticatedInvite();
    return () => {
      active = false;
    };
  }, [acceptInvite, token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await acceptInvite();
        return;
      }

      const redirect = `${window.location.origin}/aceitar-convite?token=${encodeURIComponent(token ?? "")}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirect, data: { name } },
      });
      if (error) throw error;
      if (data.session) {
        await acceptInvite();
      } else {
        toast.success("Conta criada. Confirme o e-mail e abra novamente o link do convite.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar o convite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05060a] p-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-primary/25 bg-neutral-950/90 p-8 shadow-2xl">
        <div className="mb-7 space-y-3 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Building2 className="size-7" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Acesso à escola
            </p>
            <h1 className="mt-1 text-2xl font-bold">Aceitar convite</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Use exatamente o e-mail que recebeu o convite.
            </p>
          </div>
        </div>

        {!token ? (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300">
            Este link não possui um convite válido.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <label className="block space-y-1.5 text-xs">
                <span className="font-semibold text-neutral-300">Seu nome</span>
                <input
                  required
                  minLength={3}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 outline-none focus:border-primary"
                />
              </label>
            )}
            <label className="block space-y-1.5 text-xs">
              <span className="font-semibold text-neutral-300">E-mail convidado</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 outline-none focus:border-primary"
              />
            </label>
            <label className="block space-y-1.5 text-xs">
              <span className="font-semibold text-neutral-300">Senha</span>
              <div className="relative">
                <input
                  required
                  minLength={12}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 pr-10 outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <button
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-50"
            >
              <ShieldCheck className="size-4" />{" "}
              {loading
                ? "Validando…"
                : mode === "signup"
                  ? "Criar conta e aceitar"
                  : "Entrar e aceitar"}
            </button>
            <button
              type="button"
              onClick={() => setMode((value) => (value === "signup" ? "login" : "signup"))}
              className="w-full text-xs text-neutral-400 hover:text-primary"
            >
              {mode === "signup" ? "Já possui uma conta? Entrar" : "Primeiro acesso? Criar conta"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
