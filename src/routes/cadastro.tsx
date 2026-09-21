import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Começar teste gratuito — Fluency AI" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [managerName, setManagerName] = useState("");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthenticated(Boolean(data.user));
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAuthenticated(Boolean(session?.user));
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 12) {
      toast.error("Escolha uma senha com pelo menos 12 caracteres.");
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error("O cadastro ainda não está configurado neste ambiente.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/cadastro` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    if (data.session) setAuthenticated(true);
  }

  async function createSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) return;
    setBusy(true);
    const { error } = await supabase.rpc("create_trial_school", {
      _school_name: schoolName.trim(),
      _manager_name: managerName.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.location.assign("/boas-vindas");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090e] px-4 py-10 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-neutral-900 p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">Fluency AI</p>
          <h1 className="text-2xl font-bold">Comece seu teste de 14 dias</h1>
          <p className="text-sm text-neutral-400">
            Crie uma conta para sua escola. Depois de confirmar seu e-mail,
            você poderá configurar a primeira unidade.
          </p>
        </div>
        {!ready ? <p className="text-sm text-neutral-400">Verificando sua conta…</p> :
          authenticated ? (
            <form onSubmit={createSchool} className="space-y-4">
              <div className="space-y-1"><Label htmlFor="manager-name">Seu nome</Label>
                <Input id="manager-name" value={managerName} onChange={(event) => setManagerName(event.target.value)} minLength={3} maxLength={120} required /></div>
              <div className="space-y-1"><Label htmlFor="school-name">Nome da escola</Label>
                <Input id="school-name" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} minLength={3} maxLength={120} required /></div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Criando escola…" : "Criar escola e iniciar teste"}
              </Button>
            </form>
          ) : sent ? (
            <div className="space-y-3 text-sm">
              <p>Confira seu e-mail e confirme a conta. Depois, volte para esta página para criar a escola.</p>
              <a href="/login" className="text-primary underline">Já confirmou? Entrar</a>
            </div>
          ) : (
            <form onSubmit={createAccount} className="space-y-4">
              <div className="space-y-1"><Label htmlFor="signup-email">E-mail profissional</Label>
                <Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
              <div className="space-y-1"><Label htmlFor="signup-password">Senha (mínimo de 12 caracteres)</Label>
                <Input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required /></div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Criando conta…" : "Criar conta gratuita"}
              </Button>
            </form>
          )}
        <a href="/login" className="block text-center text-sm text-neutral-400 hover:text-white">
          Já tem conta? Entrar
        </a>
      </div>
    </main>
  );
}
