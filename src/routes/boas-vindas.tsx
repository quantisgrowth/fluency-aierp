import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type School = { nome: string; status: string; trial_ends_at: string };
type Unit = { nome: string };

export const Route = createFileRoute("/boas-vindas")({
  head: () => ({ meta: [{ title: "Seu ambiente — Fluency AI" }] }),
  component: WelcomePage,
});

function WelcomePage() {
  const [school, setSchool] = useState<School | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setLoading(false);
        return;
      }
      const { data: memberships, error: memberError } = await supabase
        .from("escola_membros")
        .select("escola_id")
        .eq("user_id", userData.user.id)
        .eq("status", "ativo")
        .limit(1);
      const schoolId = memberships?.[0]?.escola_id;
      if (!schoolId || memberError) {
        if (active) {
          setError("Não foi possível encontrar sua escola ativa.");
          setLoading(false);
        }
        return;
      }
      const [schoolResult, unitResult] = await Promise.all([
        supabase.from("escolas").select("nome,status,trial_ends_at").eq("id", schoolId).single(),
        supabase.from("unidades").select("nome").eq("escola_id", schoolId),
      ]);
      if (!active) return;
      if (schoolResult.error || unitResult.error)
        setError("Não foi possível carregar seu ambiente.");
      else {
        setSchool(schoolResult.data);
        setUnits(unitResult.data ?? []);
      }
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090e] px-4 py-10 text-white">
      <div className="w-full max-w-xl space-y-5 rounded-2xl border border-white/10 bg-neutral-900 p-8">
        <p className="text-sm font-semibold text-primary">Fluency AI</p>
        {loading ? (
          <p>Carregando seu ambiente…</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          school && (
            <>
              <h1 className="text-2xl font-bold">{school.nome}</h1>
              <p className="text-sm text-neutral-300">Seu ambiente foi criado com sucesso.</p>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <p>Plano: {school.status === "trial" ? "Teste gratuito" : school.status}</p>
                <p>Teste até: {new Date(school.trial_ends_at).toLocaleDateString("pt-BR")}</p>
                <p>Unidades: {units.map((unit) => unit.nome).join(", ") || "Nenhuma"}</p>
              </div>
              <p className="text-sm text-amber-300">
                O cadastro de alunos, turmas e financeiro ainda está em implantação. Os painéis
                demonstrativos não representam os dados da sua escola.
              </p>
            </>
          )
        )}
        <button
          onClick={() => void signOut()}
          className="text-sm text-neutral-400 underline hover:text-white"
        >
          Sair da conta
        </button>
      </div>
    </main>
  );
}
