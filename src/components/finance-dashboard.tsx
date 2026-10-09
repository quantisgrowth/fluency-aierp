import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Landmark,
  Loader2,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { currentSchoolId, readableError, type Student } from "@/lib/academic";
import { cn } from "@/lib/utils";

type Entry = {
  id: string;
  tipo: "receita" | "despesa";
  categoria: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  forma_pagamento: string | null;
  numero_fatura: string | null;
  aluno_id: string | null;
};
type DisplayEntry = Entry & { displayStatus: string };

const selectStyle =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring";
const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
const today = () => new Date().toISOString().slice(0, 10);

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof WalletCards;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-3 text-2xl font-semibold tracking-tight",
              tone === "success" && "text-emerald-400",
              tone === "danger" && "text-red-400",
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl border border-hairline bg-background/50">
          <Icon className="size-4 text-primary" />
        </span>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-surface/30 px-6 py-12 text-center">
      <ReceiptText className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function FinanceDashboard() {
  const [schoolId, setSchoolId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [payingId, setPayingId] = useState("");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"receita" | "despesa">("receita");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(today());
  const [studentId, setStudentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  async function refresh(id: string) {
    const [entryResult, studentResult] = await Promise.all([
      supabase
        .from("transacoes_financeiras")
        .select(
          "id,tipo,categoria,descricao,valor,data_vencimento,data_pagamento,status,forma_pagamento,numero_fatura,aluno_id",
        )
        .eq("escola_id", id)
        .order("data_vencimento", { ascending: true }),
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

  const displayEntries = useMemo<DisplayEntry[]>(
    () =>
      entries.map((entry) => ({
        ...entry,
        displayStatus:
          entry.status === "pendente" && entry.data_vencimento < today()
            ? "atrasado"
            : entry.status,
      })),
    [entries],
  );
  const filteredEntries = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return displayEntries;
    return displayEntries.filter((entry) => {
      const student = students.find((item) => item.id === entry.aluno_id)?.nome ?? "";
      return `${entry.descricao} ${entry.categoria} ${student}`
        .toLocaleLowerCase("pt-BR")
        .includes(term);
    });
  }, [displayEntries, query, students]);
  const openReceivables = displayEntries.filter(
    (entry) => entry.tipo === "receita" && ["pendente", "atrasado"].includes(entry.displayStatus),
  );
  const openExpenses = displayEntries.filter(
    (entry) => entry.tipo === "despesa" && ["pendente", "atrasado"].includes(entry.displayStatus),
  );
  const received = displayEntries
    .filter((entry) => entry.tipo === "receita" && entry.status === "pago")
    .reduce((sum, entry) => sum + Number(entry.valor), 0);
  const paidExpenses = displayEntries
    .filter((entry) => entry.tipo === "despesa" && entry.status === "pago")
    .reduce((sum, entry) => sum + Number(entry.valor), 0);
  const overdue = openReceivables
    .filter((entry) => entry.displayStatus === "atrasado")
    .reduce((sum, entry) => sum + Number(entry.valor), 0);
  const balance = received - paidExpenses;

  function resetForm() {
    setKind("receita");
    setCategory("");
    setDescription("");
    setAmount("");
    setDueDate(today());
    setStudentId("");
    setPaymentMethod("");
  }
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
      forma_pagamento: paymentMethod || null,
      status: "pendente",
    });
    if (saveError) toast.error(`Não foi possível salvar: ${saveError.message}`);
    else {
      toast.success(kind === "receita" ? "Conta a receber criada." : "Conta a pagar criada.");
      resetForm();
      setDialogOpen(false);
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
    setBusy(false);
  }
  async function markPaid(item: Entry) {
    setPayingId(item.id);
    const { error: saveError } = await supabase
      .from("transacoes_financeiras")
      .update({ status: "pago", data_pagamento: today() })
      .eq("id", item.id)
      .eq("escola_id", schoolId);
    if (saveError) toast.error(saveError.message);
    else {
      toast.success(item.tipo === "receita" ? "Recebimento confirmado." : "Pagamento confirmado.");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
    setPayingId("");
  }

  function EntriesList({ type }: { type?: "receita" | "despesa" }) {
    const list = type ? filteredEntries.filter((entry) => entry.tipo === type) : filteredEntries;
    if (!list.length)
      return (
        <EmptyState
          title={
            type === "despesa"
              ? "Nenhuma conta a pagar"
              : type === "receita"
                ? "Nenhuma conta a receber"
                : "Nenhum lançamento"
          }
          description="Os registros criados para esta escola aparecerão aqui. Nenhum dado demonstrativo será incluído."
        />
      );
    return (
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface/50">
        <div className="hidden grid-cols-[1.5fr_1fr_130px_130px_170px] gap-4 border-b border-hairline px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Descrição</span>
          <span>Categoria</span>
          <span>Vencimento</span>
          <span>Valor</span>
          <span>Status</span>
        </div>
        {list.map((item) => {
          const student = students.find((studentItem) => studentItem.id === item.aluno_id)?.nome;
          return (
            <div
              key={item.id}
              className="grid gap-3 border-b border-hairline px-5 py-4 last:border-0 lg:grid-cols-[1.5fr_1fr_130px_130px_170px] lg:items-center"
            >
              <div>
                <p className="font-medium text-foreground">{item.descricao}</p>
                {student && <p className="text-xs text-muted-foreground">Aluno: {student}</p>}
              </div>
              <span className="text-sm text-muted-foreground">{item.categoria}</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(item.data_vencimento)}
              </span>
              <span className="font-semibold text-foreground">{money(Number(item.valor))}</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    item.displayStatus === "pago" &&
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                    item.displayStatus === "atrasado" &&
                      "border-red-500/30 bg-red-500/10 text-red-400",
                    item.displayStatus === "pendente" &&
                      "border-amber-500/30 bg-amber-500/10 text-amber-400",
                  )}
                >
                  {item.displayStatus === "pago"
                    ? "Pago"
                    : item.displayStatus === "atrasado"
                      ? "Atrasado"
                      : "Pendente"}
                </Badge>
                {item.status === "pendente" && (
                  <button
                    className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    disabled={payingId === item.id}
                    onClick={() => void markPaid(item)}
                  >
                    {payingId === item.id ? "Salvando…" : "Dar baixa"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Carregando financeiro…
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300"
      >
        {error}
      </div>
    );

  const totalReceivable = openReceivables.reduce((sum, entry) => sum + Number(entry.valor), 0);
  const totalPayable = openExpenses.reduce((sum, entry) => sum + Number(entry.valor), 0);
  const upcoming = [...openReceivables, ...openExpenses]
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Operação financeira
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Financeiro</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Controle as movimentações reais da escola. PIX, boletos, cartões e baixas automáticas
            serão habilitados após a conexão com o Asaas.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 self-start xl:self-auto">
          <Plus className="size-4" /> Novo lançamento
        </Button>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="A receber"
          value={money(totalReceivable)}
          detail={`${openReceivables.length} lançamento(s) em aberto`}
          icon={ArrowDownLeft}
        />
        <MetricCard
          label="Recebido"
          value={money(received)}
          detail="Baixas registradas"
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="A pagar"
          value={money(totalPayable)}
          detail={`${openExpenses.length} compromisso(s) em aberto`}
          icon={ArrowUpRight}
        />
        <MetricCard
          label="Em atraso"
          value={money(overdue)}
          detail="Receitas vencidas e não pagas"
          icon={AlertCircle}
          tone={overdue > 0 ? "danger" : "default"}
        />
      </div>
      <Tabs defaultValue="visao-geral" className="space-y-5">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-hairline bg-surface/40 p-1.5">
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="receber">Contas a receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a pagar</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>
        <div className="flex max-w-md items-center gap-2 rounded-xl border border-hairline bg-surface/50 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar lançamento, categoria ou aluno"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <TabsContent value="visao-geral" className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-2xl border border-hairline bg-surface/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">Próximos vencimentos</h2>
                  <p className="text-sm text-muted-foreground">
                    Contas em aberto ordenadas por vencimento.
                  </p>
                </div>
                <CalendarClock className="size-5 text-primary" />
              </div>
              <div className="mt-5 space-y-3">
                {upcoming.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-background/40 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.data_vencimento)} ·{" "}
                        {entry.tipo === "receita" ? "Receber" : "Pagar"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {money(Number(entry.valor))}
                    </span>
                  </div>
                ))}
                {!upcoming.length && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum vencimento em aberto.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-hairline bg-surface/50 p-5">
              <BarChart3 className="size-5 text-primary" />
              <h2 className="mt-4 font-semibold text-foreground">Resultado realizado</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Recebimentos menos despesas pagas.
              </p>
              <p
                className={cn(
                  "mt-8 text-3xl font-semibold",
                  balance < 0 ? "text-red-400" : "text-emerald-400",
                )}
              >
                {money(balance)}
              </p>
              <div className="mt-5 space-y-2 border-t border-hairline pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Entradas</span>
                  <span>{money(received)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Saídas</span>
                  <span>{money(paidExpenses)}</span>
                </div>
              </div>
            </section>
          </div>
          <EntriesList />
        </TabsContent>
        <TabsContent value="receber">
          <EntriesList type="receita" />
        </TabsContent>
        <TabsContent value="pagar">
          <EntriesList type="despesa" />
        </TabsContent>
        <TabsContent value="contratos">
          <EmptyState
            title="Contratos financeiros"
            description="A próxima etapa ligará contratos, planos, bolsas, descontos e recorrência ao cadastro real dos alunos."
          />
        </TabsContent>
        <TabsContent value="cobrancas">
          <EmptyState
            title="Régua de cobrança"
            description="Após conectar o Asaas, esta área permitirá configurar lembretes antes e depois do vencimento por e-mail e WhatsApp."
          />
        </TabsContent>
        <TabsContent value="relatorios">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Resultado"
              value={money(balance)}
              detail="Receitas recebidas menos despesas pagas"
              icon={CircleDollarSign}
              tone={balance >= 0 ? "success" : "danger"}
            />
            <MetricCard
              label="Inadimplência"
              value={
                received + overdue > 0
                  ? `${((overdue / (received + overdue)) * 100).toFixed(1)}%`
                  : "0,0%"
              }
              detail="Sobre receitas vencidas e recebidas"
              icon={AlertCircle}
              tone={overdue > 0 ? "danger" : "default"}
            />
            <MetricCard
              label="Ticket recebido"
              value={money(students.length ? received / students.length : 0)}
              detail={`${students.length} aluno(s) cadastrado(s)`}
              icon={BarChart3}
            />
          </div>
        </TabsContent>
        <TabsContent value="integracoes">
          <div className="rounded-2xl border border-hairline bg-surface/50 p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-hairline bg-background/50">
                  <Landmark className="size-5 text-primary" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground">Asaas</h2>
                    <Badge variant="outline">Não conectado</Badge>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Conecte a conta da escola para emitir PIX e boletos, cobrar cartões e receber
                    baixas automáticas por webhook.
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled className="gap-2">
                <Settings2 className="size-4" /> Configurar em breve
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={dialogOpen} onOpenChange={(open) => !busy && setDialogOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-hairline bg-background sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>
              Registre uma movimentação manual vinculada somente a esta escola.
            </DialogDescription>
          </DialogHeader>
          <form
            id="finance-entry-form"
            onSubmit={createEntry}
            className="grid gap-4 py-2 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="entry-kind">Tipo</Label>
              <select
                id="entry-kind"
                className={selectStyle}
                value={kind}
                onChange={(event) => setKind(event.target.value as "receita" | "despesa")}
              >
                <option value="receita">Conta a receber</option>
                <option value="despesa">Conta a pagar</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-category">Categoria</Label>
              <Input
                id="entry-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                maxLength={80}
                placeholder={kind === "receita" ? "Mensalidade" : "Aluguel"}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="entry-description">Descrição</Label>
              <Input
                id="entry-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                maxLength={200}
                placeholder="Descreva o lançamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-amount">Valor</Label>
              <Input
                id="entry-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-due">Vencimento</Label>
              <Input
                id="entry-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
              />
            </div>
            {kind === "receita" && (
              <div className="space-y-2">
                <Label htmlFor="entry-student">Aluno</Label>
                <select
                  id="entry-student"
                  className={selectStyle}
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
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
            <div className="space-y-2">
              <Label htmlFor="entry-method">Forma prevista</Label>
              <select
                id="entry-method"
                className={selectStyle}
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="">Não definida</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button form="finance-entry-form" disabled={busy} className="gap-2">
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <FileText className="size-4" /> Salvar lançamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
