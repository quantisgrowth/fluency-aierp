import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { currentSchoolId, readableError, type Student } from "@/lib/academic";

type Entry = {
  id: string;
  tipo: "receita" | "despesa";
  categoria: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  aluno_id: string | null;
};

const selectStyle = "w-full rounded-md border border-white/20 bg-neutral-900 px-3 py-2 text-white";
const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RealFinancePage() {
  const [schoolId, setSchoolId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<"receita" | "despesa">("receita");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [studentId, setStudentId] = useState("");

  async function refresh(id: string) {
    const [entryResult, studentResult] = await Promise.all([
      supabase
        .from("transacoes_financeiras")
        .select("id,tipo,categoria,descricao,valor,data_vencimento,data_pagamento,status,aluno_id")
        .eq("escola_id", id)
        .order("data_vencimento", { ascending: false }),
      supabase
        .from("alunos")
        .select("id,nome,email,telefone,nivel_atual,status,responsavel_nome,turma_atual_id")
        .eq("escola_id", id)
        .order("nome"),
    ]);
    if (entryResult.error) throw entryResult.error;
    if (studentResult.error) throw studentResult.error;
    setEntries((entryResult.data ?? []) as Entry[]);
    setStudents((studentResult.data ?? []) as Student[]);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const id = await currentSchoolId();
        if (!active) return;
        setSchoolId(id);
        await refresh(id);
      } catch (cause) {
        if (active) setError(readableError(cause));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function createEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!schoolId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    setBusy(true);
    const { error: saveError } = await supabase.from("transacoes_financeiras").insert({
      escola_id: schoolId,
      tipo: kind,
      categoria: category.trim(),
      descricao: description.trim(),
      valor: numericAmount,
      data_vencimento: dueDate,
      aluno_id: kind === "receita" && studentId ? studentId : null,
      status: "pendente",
    });
    if (saveError) toast.error(`Não foi possível salvar: ${saveError.message}`);
    else {
      toast.success("Lançamento salvo.");
      setCategory("");
      setDescription("");
      setAmount("");
      setDueDate("");
      setStudentId("");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
    setBusy(false);
  }

  async function markPaid(item: Entry) {
    const { error: saveError } = await supabase
      .from("transacoes_financeiras")
      .update({ status: "pago", data_pagamento: new Date().toISOString().slice(0, 10) })
      .eq("id", item.id)
      .eq("escola_id", schoolId);
    if (saveError) toast.error(saveError.message);
    else {
      toast.success("Pagamento registrado manualmente.");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
  }

  if (loading) return <p className="p-8">Carregando financeiro…</p>;
  if (error)
    return (
      <p role="alert" className="p-8 text-red-400">
        {error}
      </p>
    );
  const receivable = entries
    .filter((e) => e.tipo === "receita" && e.status === "pendente")
    .reduce((sum, e) => sum + Number(e.valor), 0);
  const received = entries
    .filter((e) => e.tipo === "receita" && e.status === "pago")
    .reduce((sum, e) => sum + Number(e.valor), 0);
  const expenses = entries
    .filter((e) => e.tipo === "despesa" && e.status === "pago")
    .reduce((sum, e) => sum + Number(e.valor), 0);
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 text-white">
      <header className="space-y-3">
        <nav className="flex gap-4 text-sm text-primary">
          <Link to="/boas-vindas">Seu ambiente</Link>
          <Link to="/alunos">Alunos</Link>
          <Link to="/turmas">Cursos e turmas</Link>
        </nav>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-neutral-400">
          Lançamentos reais da sua escola. Este registro é manual e não envia cobranças nem emite
          notas fiscais.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-4">
          <p>A receber</p>
          <strong className="text-xl">{money(receivable)}</strong>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p>Recebido</p>
          <strong className="text-xl">{money(received)}</strong>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p>Despesas pagas</p>
          <strong className="text-xl">{money(expenses)}</strong>
        </div>
      </div>
      <form
        onSubmit={createEntry}
        className="grid gap-4 rounded-xl border border-white/10 bg-neutral-900 p-5 md:grid-cols-2"
      >
        <h2 className="text-xl font-semibold md:col-span-2">Novo lançamento</h2>
        <div>
          <Label htmlFor="entry-kind">Tipo</Label>
          <select
            id="entry-kind"
            className={selectStyle}
            value={kind}
            onChange={(e) => setKind(e.target.value as "receita" | "despesa")}
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </div>
        <div>
          <Label htmlFor="entry-category">Categoria</Label>
          <Input
            id="entry-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            maxLength={80}
            placeholder="Mensalidade"
          />
        </div>
        <div>
          <Label htmlFor="entry-description">Descrição</Label>
          <Input
            id="entry-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="entry-amount">Valor (R$)</Label>
          <Input
            id="entry-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="entry-due">Vencimento</Label>
          <Input
            id="entry-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        {kind === "receita" && (
          <div>
            <Label htmlFor="entry-student">Aluno</Label>
            <select
              id="entry-student"
              className={selectStyle}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Sem aluno vinculado</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <Button disabled={busy}>Salvar lançamento</Button>
        </div>
      </form>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Lançamentos ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-neutral-400">Nenhum lançamento cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 p-4"
              >
                <div>
                  <strong>{item.descricao}</strong>
                  <p className="text-sm text-neutral-400">
                    {item.tipo === "receita" ? "Receita" : "Despesa"} · {item.categoria} · Vence em{" "}
                    {new Date(`${item.data_vencimento}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                    {item.status}
                  </p>
                  {item.aluno_id && (
                    <p className="text-sm text-neutral-400">
                      Aluno:{" "}
                      {students.find((s) => s.id === item.aluno_id)?.nome || "Não encontrado"}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <strong>{money(Number(item.valor))}</strong>
                  {item.status === "pendente" && (
                    <button
                      className="block text-sm text-primary underline"
                      onClick={() => void markPaid(item)}
                    >
                      Registrar pagamento
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
