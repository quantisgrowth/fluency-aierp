import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/recuperar-senha")({
  validateSearch: (search: Record<string, unknown>) => ({
    origem: search.origem === "manager" ? ("manager" as const) : undefined,
  }),
  head: () => ({ meta: [{ title: "Recuperar senha — Fluency AI" }] }),
  component: RecoverPasswordPage,
});

function RecoverPasswordPage() {
  const { origem } = Route.useSearch();
  const isManager = origem === "manager";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    if (!isSupabaseConfigured) {
      setFeedback("A recuperação de senha não está configurada neste ambiente.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha${isManager ? "?origem=manager" : ""}`,
      });
      if (error) throw error;
      setSent(true);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "Não foi possível enviar o e-mail.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090e] px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-neutral-900 p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">Fluency AI</p>
          <h1 className="text-2xl font-bold">
            {isManager ? "Recuperar senha master" : "Recuperar senha"}
          </h1>
          <p className="text-sm text-neutral-400">
            Enviaremos um link seguro para você definir uma nova senha.
          </p>
        </div>
        {feedback && (
          <p
            role="alert"
            className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200"
          >
            {feedback}
          </p>
        )}
        {sent ? (
          <div className="space-y-3 text-sm">
            <p>
              Se o endereço estiver cadastrado, o link de recuperação será enviado. Verifique também
              a pasta de spam.
            </p>
            <a href={isManager ? "/manager" : "/login"} className="text-primary underline">
              Voltar ao login{isManager ? " master" : ""}
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="recovery-email">E-mail da conta</Label>
              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button className="w-full" disabled={busy}>
              {busy ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
          </form>
        )}
        <a
          href={isManager ? "/manager" : "/login"}
          className="block text-center text-sm text-neutral-400 hover:text-white"
        >
          Voltar ao login{isManager ? " master" : ""}
        </a>
      </div>
    </main>
  );
}
