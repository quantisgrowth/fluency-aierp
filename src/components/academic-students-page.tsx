import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { BookOpen, Camera, GraduationCap, History, Loader2, Plus, Search, UserRound, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { currentSchoolId, readableError, type Enrollment, type SchoolClass, type Student, type StudentHistory } from "@/lib/academic";

type Form = Record<"nome" | "nomeSocial" | "nascimento" | "cpf" | "email" | "telefone" | "endereco" | "ocupacao" | "idioma" | "nivel" | "objetivo" | "meta" | "acessibilidade" | "emergenciaNome" | "emergenciaTelefone" | "observacoes" | "responsavelNome" | "parentesco" | "responsavelEmail" | "responsavelTelefone", string>;
type LeadSource = { id: string; nome?: string; email?: string; telefone?: string; documento?: string; empresa?: string; dataNascimento?: string; responsavel?: string; endereco?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; anotacoes?: string; tags?: string[] };
const emptyForm: Form = { nome: "", nomeSocial: "", nascimento: "", cpf: "", email: "", telefone: "", endereco: "", ocupacao: "", idioma: "", nivel: "", objetivo: "", meta: "", acessibilidade: "", emergenciaNome: "", emergenciaTelefone: "", observacoes: "", responsavelNome: "", parentesco: "", responsavelEmail: "", responsavelTelefone: "" };
const selectStyle = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground";

export function AcademicStudentsPage() {
  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Form>(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pessoais" | "academico" | "responsaveis">("pessoais");
  const [photo, setPhoto] = useState<string | null>(null);
  const [detail, setDetail] = useState<Student | null>(null);
  const [history, setHistory] = useState<StudentHistory[]>([]);
  const [leads, setLeads] = useState<LeadSource[]>([]);
  const [sourceLeadId, setSourceLeadId] = useState("");
  const [error, setError] = useState("");
  const update = (key: keyof Form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const filtered = useMemo(() => students.filter((s) => `${s.nome} ${s.email ?? ""}`.toLowerCase().includes(search.toLowerCase())), [students, search]);

  async function refresh(id: string) {
    const [studentResult, classResult, enrollmentResult] = await Promise.all([
      supabase.from("alunos").select("id,nome,nome_social,data_nascimento,cpf,email,telefone,endereco,profissao_ou_escola,idioma_principal,nivel_atual,status,responsavel_nome,turma_atual_id,necessidades_acessibilidade,contato_emergencia_nome,contato_emergencia_telefone,objetivo_aprendizagem,meta_academica,observacoes,foto_url").eq("escola_id", id).order("nome"),
      supabase.from("turmas").select("id,curso_id,nome,nivel,status,capacidade_maxima,professor_nome,dias_semana,horario_inicio,modalidade,coordenador_nome,faixa_etaria,criterio_entrada,ementa,objetivos,frequencia_minima").eq("escola_id", id).order("nome"),
      supabase.from("matriculas").select("id,aluno_id,turma_id,status").eq("escola_id", id).eq("status", "ativa"),
    ]);
    if (studentResult.error) throw studentResult.error; if (classResult.error) throw classResult.error; if (enrollmentResult.error) throw enrollmentResult.error;
    setStudents((studentResult.data ?? []) as Student[]); setClasses((classResult.data ?? []) as SchoolClass[]); setEnrollments((enrollmentResult.data ?? []) as Enrollment[]);
  }

  useEffect(() => { let active = true; void (async () => { try { const id = await currentSchoolId(); if (!active) return; setSchoolId(id); const stored = window.localStorage.getItem(`fluency-ai:leads-db:v2:${id}`); setLeads(stored ? JSON.parse(stored) : []); await refresh(id); } catch (cause) { if (active) setError(readableError(cause)); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, []);

  function importLead(id: string) {
    setSourceLeadId(id); const lead = leads.find((item) => item.id === id); if (!lead) return;
    setForm((old) => ({ ...old, nome: lead.nome || "", email: lead.email || "", telefone: lead.telefone || "", cpf: lead.documento || "", nascimento: lead.dataNascimento || "", ocupacao: lead.empresa || "", responsavelNome: lead.responsavel === "Não informado" ? "" : lead.responsavel || "", endereco: [lead.endereco, lead.numero, lead.complemento, lead.bairro, lead.cidade, lead.uf].filter(Boolean).join(", "), objetivo: lead.tags?.join(", ") || old.objetivo, observacoes: lead.anotacoes || "" }));
  }

  async function createStudent(event: FormEvent) {
    event.preventDefault(); if (!schoolId) return; setBusy(true);
    const { data, error: saveError } = await supabase.from("alunos").insert({ escola_id: schoolId, nome: form.nome.trim(), nome_social: form.nomeSocial.trim() || null, data_nascimento: form.nascimento || null, cpf: form.cpf.trim() || null, email: form.email.trim() || null, telefone: form.telefone.trim() || null, endereco: form.endereco.trim() || null, profissao_ou_escola: form.ocupacao.trim() || null, idioma_principal: form.idioma.trim() || null, nivel_atual: form.nivel.trim() || null, objetivo_aprendizagem: form.objetivo.trim() || null, meta_academica: form.meta.trim() || null, necessidades_acessibilidade: form.acessibilidade.trim() || null, contato_emergencia_nome: form.emergenciaNome.trim() || null, contato_emergencia_telefone: form.emergenciaTelefone.trim() || null, responsavel_nome: form.responsavelNome.trim() || null, responsavel_email: form.responsavelEmail.trim() || null, responsavel_telefone: form.responsavelTelefone.trim() || null, responsavel_contato: form.parentesco.trim() || null, observacoes: form.observacoes.trim() || null, foto_url: photo }).select("id").single();
    if (saveError) toast.error(`Não foi possível cadastrar: ${saveError.message}`);
    else {
      if (form.responsavelNome.trim() && data?.id) {
        const { data: guardian } = await supabase.from("responsaveis").insert({ escola_id: schoolId, nome: form.responsavelNome.trim(), parentesco: form.parentesco.trim() || null, email: form.responsavelEmail.trim() || null, telefone: form.responsavelTelefone.trim() || null }).select("id").single();
        if (guardian) await supabase.from("aluno_responsaveis").insert({ escola_id: schoolId, aluno_id: data.id, responsavel_id: guardian.id, responsavel_pedagogico: true });
      }
      toast.success("Aluno cadastrado com o dossiê inicial."); setForm(emptyForm); setPhoto(null); setSourceLeadId(""); setActiveTab("pessoais"); setCreateOpen(false); await refresh(schoolId);
    }
    setBusy(false);
  }

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) { toast.error("Escolha uma imagem de até 2 MB."); return; }
    const reader = new FileReader(); reader.onload = () => setPhoto(String(reader.result)); reader.readAsDataURL(file);
  }

  async function openDetail(student: Student) {
    setDetail(student); setHistory([]);
    const { data } = await supabase.from("historico_aluno").select("id,tipo,titulo,descricao,created_at").eq("escola_id", schoolId).eq("aluno_id", student.id).order("created_at", { ascending: false });
    setHistory((data ?? []) as StudentHistory[]);
  }

  async function enroll(student: Student) {
    const classId = selectedClasses[student.id]; if (!classId) return;
    if (enrollments.some((item) => item.aluno_id === student.id && item.turma_id === classId)) { toast.error("O aluno já está nessa turma."); return; }
    const selected = classes.find((item) => item.id === classId); if (!selected) return;
    setBusy(true); const { error: saveError } = await supabase.from("matriculas").insert({ escola_id: schoolId, aluno_id: student.id, turma_id: classId });
    if (saveError) toast.error(saveError.message); else { await supabase.from("alunos").update({ turma_atual_id: classId, turma_nome: selected.nome }).eq("id", student.id).eq("escola_id", schoolId); toast.success("Matrícula realizada."); await refresh(schoolId); }
    setBusy(false);
  }

  if (loading) return <div className="grid min-h-72 place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>;
  if (error) return <p role="alert" className="p-8 text-red-400">{error}</p>;
  return <main className="space-y-6 p-6 text-foreground">
    <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Jornada acadêmica</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Alunos</h1><p className="mt-2 text-sm text-muted-foreground">Cadastro completo, matrícula e histórico acadêmico por escola.</p></div><Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="size-4" /> Novo aluno</Button></header>
    <section className="grid gap-4 md:grid-cols-3"><Metric icon={Users} label="Alunos cadastrados" value={students.length} /><Metric icon={GraduationCap} label="Matrículas ativas" value={enrollments.length} /><Metric icon={BookOpen} label="Turmas disponíveis" value={classes.filter((item) => item.status === "ativa").length} /></section>
    <section className="rounded-2xl border border-hairline bg-surface/50 p-5"><div className="relative max-w-md"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail" className="pl-9" /></div><div className="mt-5 grid gap-3 xl:grid-cols-2">{filtered.map((student) => <article key={student.id} className="rounded-xl border border-hairline bg-background/35 p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-hairline bg-surface">{student.foto_url ? <img src={student.foto_url} alt="" className="size-full object-cover" /> : <UserRound className="size-5 text-muted-foreground" />}</div><div className="min-w-0"><button onClick={() => void openDetail(student)} className="truncate text-left font-semibold hover:text-primary">{student.nome_social || student.nome}</button><p className="truncate text-sm text-muted-foreground">{student.email || "Sem e-mail"} · {student.nivel_atual || "Nível não definido"}</p></div></div><Badge variant="outline">{student.status}</Badge></div><div className="mt-4 flex gap-2"><select className={selectStyle} value={selectedClasses[student.id] || ""} onChange={(e) => setSelectedClasses((old) => ({ ...old, [student.id]: e.target.value }))}><option value="">Selecionar turma</option>{classes.filter((item) => item.status === "ativa").map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><Button variant="outline" disabled={busy || !selectedClasses[student.id]} onClick={() => void enroll(student)}>Matricular</Button></div></article>)}{!filtered.length && <div className="col-span-full rounded-xl border border-dashed border-hairline py-12 text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</div>}</div></section>
    <Dialog open={createOpen} onOpenChange={(open) => !busy && setCreateOpen(open)}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden border-hairline bg-background p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-hairline px-7 pb-5 pt-7">
          <DialogTitle className="text-xl">Novo aluno</DialogTitle>
          <DialogDescription>Organize o cadastro em etapas. Somente o nome completo é obrigatório.</DialogDescription>
        </DialogHeader>
        <form id="student-form" onSubmit={createStudent} className="flex min-h-0 flex-1 flex-col">
          {leads.length > 0 && <div className="border-b border-hairline bg-primary/5 px-7 py-4"><Label>Preencher a partir de um lead</Label><select className={`${selectStyle} mt-1.5 max-w-xl bg-background`} value={sourceLeadId} onChange={(e) => importLead(e.target.value)}><option value="">Começar um cadastro em branco</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.nome || "Lead sem nome"} {lead.email ? `· ${lead.email}` : ""}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Os dados comerciais disponíveis serão trazidos para revisão antes de salvar.</p></div>}
          <div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr]">
            <aside className="border-b border-hairline bg-surface/35 p-6 md:border-b-0 md:border-r">
              <div className="mx-auto flex size-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-hairline bg-background/60">
                {photo ? <img src={photo} alt="Prévia do aluno" className="size-full object-cover" /> : <UserRound className="size-10 text-muted-foreground" />}
              </div>
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium hover:bg-accent">
                <Camera className="size-4" /> {photo ? "Trocar foto" : "Adicionar foto"}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => choosePhoto(e.target.files?.[0])} />
              </label>
              {photo && <button type="button" onClick={() => setPhoto(null)} className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"><X className="size-3" /> Remover foto</button>}
              <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">JPG, PNG ou WebP<br />até 2 MB</p>
              <nav className="mt-7 space-y-1">{(["pessoais", "academico", "responsaveis"] as const).map((tab, index) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><span className="grid size-6 place-items-center rounded-full border border-current text-xs">{index + 1}</span>{tab === "pessoais" ? "Dados pessoais" : tab === "academico" ? "Perfil acadêmico" : "Responsáveis"}</button>)}</nav>
            </aside>
            <div className="min-h-0 overflow-y-auto p-7">
              {activeTab === "pessoais" && <Section title="Identificação e contato"><Field label="Nome completo" value={form.nome} set={(v) => update("nome", v)} required /><Field label="Nome social" value={form.nomeSocial} set={(v) => update("nomeSocial", v)} /><Field label="Data de nascimento" type="date" value={form.nascimento} set={(v) => update("nascimento", v)} /><Field label="CPF" value={form.cpf} set={(v) => update("cpf", v)} /><Field label="E-mail" type="email" value={form.email} set={(v) => update("email", v)} /><Field label="Telefone / WhatsApp" value={form.telefone} set={(v) => update("telefone", v)} /><div className="md:col-span-2"><Field label="Endereço" value={form.endereco} set={(v) => update("endereco", v)} /></div><div className="md:col-span-2"><Field label="Profissão ou escola atual" value={form.ocupacao} set={(v) => update("ocupacao", v)} /></div></Section>}
              {activeTab === "academico" && <Section title="Jornada de aprendizagem"><Field label="Idioma ou área principal" value={form.idioma} set={(v) => update("idioma", v)} placeholder="Inglês, Barbearia, Manicure…" /><Field label="Nível atual" value={form.nivel} set={(v) => update("nivel", v)} /><Field label="Objetivo de aprendizagem" value={form.objetivo} set={(v) => update("objetivo", v)} /><Field label="Meta acadêmica" value={form.meta} set={(v) => update("meta", v)} /><LongField label="Necessidades de acessibilidade" value={form.acessibilidade} set={(v) => update("acessibilidade", v)} /><LongField label="Observações internas" value={form.observacoes} set={(v) => update("observacoes", v)} /></Section>}
              {activeTab === "responsaveis" && <Section title="Responsável e emergência"><Field label="Responsável" value={form.responsavelNome} set={(v) => update("responsavelNome", v)} /><Field label="Parentesco" value={form.parentesco} set={(v) => update("parentesco", v)} /><Field label="E-mail do responsável" type="email" value={form.responsavelEmail} set={(v) => update("responsavelEmail", v)} /><Field label="Telefone do responsável" value={form.responsavelTelefone} set={(v) => update("responsavelTelefone", v)} /><Field label="Contato de emergência" value={form.emergenciaNome} set={(v) => update("emergenciaNome", v)} /><Field label="Telefone de emergência" value={form.emergenciaTelefone} set={(v) => update("emergenciaTelefone", v)} /></Section>}
            </div>
          </div>
        </form>
        <DialogFooter className="border-t border-hairline px-7 py-5"><Button variant="outline" disabled={busy} onClick={() => setCreateOpen(false)}>Cancelar</Button><Button form="student-form" disabled={busy}>{busy ? <><Loader2 className="mr-2 size-4 animate-spin" />Salvando…</> : "Salvar aluno"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent className="max-h-[90vh] overflow-y-auto border-hairline bg-background sm:max-w-3xl"><DialogHeader><DialogTitle>{detail?.nome_social || detail?.nome}</DialogTitle><DialogDescription>Dossiê acadêmico individual</DialogDescription></DialogHeader>{detail && <div className="grid gap-5 py-2 md:grid-cols-2"><Info title="Dados pessoais" rows={[detail.email, detail.telefone, detail.data_nascimento, detail.cpf]} /><Info title="Objetivos" rows={[detail.objetivo_aprendizagem, detail.meta_academica, detail.necessidades_acessibilidade]} /><section className="md:col-span-2"><h3 className="mb-3 flex items-center gap-2 font-semibold"><History className="size-4 text-primary" /> Linha do tempo</h3>{history.map((item) => <div key={item.id} className="mb-2 rounded-xl border border-hairline p-3"><strong className="text-sm">{item.titulo}</strong><p className="text-sm text-muted-foreground">{item.descricao || item.tipo}</p></div>)}{!history.length && <p className="rounded-xl border border-dashed border-hairline p-6 text-center text-sm text-muted-foreground">O histórico começará com aulas, presenças, avaliações e ocorrências.</p>}</section></div>}</DialogContent></Dialog>
  </main>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) { return <div className="rounded-2xl border border-hairline bg-surface/50 p-5"><Icon className="size-5 text-primary" /><p className="mt-5 text-3xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>; }
function Section({ title, children }: { title: string; children: ReactNode }) { return <fieldset><legend className="mb-3 font-semibold">{title}</legend><div className="grid gap-4 md:grid-cols-2">{children}</div></fieldset>; }
function Field({ label, value, set, type = "text", required = false, placeholder }: { label: string; value: string; set: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) { return <div><Label>{label}</Label><Input type={type} value={value} onChange={(e) => set(e.target.value)} required={required} placeholder={placeholder} /></div>; }
function LongField({ label, value, set }: { label: string; value: string; set: (v: string) => void }) { return <div><Label>{label}</Label><Textarea value={value} onChange={(e) => set(e.target.value)} /></div>; }
function Info({ title, rows }: { title: string; rows: Array<string | null> }) { return <section className="rounded-xl border border-hairline p-4"><h3 className="flex items-center gap-2 font-semibold"><UserRound className="size-4 text-primary" />{title}</h3><div className="mt-3 space-y-1 text-sm text-muted-foreground">{rows.filter(Boolean).map((row) => <p key={row}>{row}</p>)}{!rows.some(Boolean) && <p>Nenhuma informação registrada.</p>}</div></section>; }
