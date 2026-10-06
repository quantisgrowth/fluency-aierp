import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>) => ({
    origem: search.origem === "manager" ? ("manager" as const) : undefined,
  }),
  head: () => ({ meta: [{ title: "Definir nova senha — Fluency AI" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { origem } = Route.useSearch();
  const isManager = origem === "manager";
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setValidSession(Boolean(data.session));
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setValidSession(true);
      setReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    if (password.length < 12) {
      setFeedback("A nova senha deve ter pelo menos 12 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setFeedback("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmation("");
      setDone(true);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "Não foi possível atualizar a senha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090e] px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-neutral-900 p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">Fluency AI</p>
          <h1 className="text-2xl font-bold">Definir nova senha</h1>
        </div>
        {!ready ? (
          <p>Validando link…</p>
        ) : done ? (
          <div className="space-y-3">
            <p>Senha atualizada com sucesso.</p>
            <a href={isManager ? "/manager" : "/login"} className="text-primary underline">
              Entrar com a nova senha{isManager ? " master" : ""}
            </a>
          </div>
        ) : !validSession ? (
          <div className="space-y-3">
            <p role="alert" className="text-rose-300">
              O link é inválido ou expirou.
            </p>
            <a
              href={isManager ? "/recuperar-senha?origem=manager" : "/recuperar-senha"}
              className="text-primary underline"
            >
              Solicitar outro link
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {feedback && (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200"
              >
                {feedback}
              </p>
            )}
            <div>
              <Label htmlFor="new-password">Nova senha (mínimo de 12 caracteres)</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                minLength={12}
                required
              />
            </div>
            <Button className="w-full" disabled={busy}>
              {busy ? "Atualizando…" : "Atualizar senha"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
