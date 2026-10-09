import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  History,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import {
  currentSchoolId,
  readableError,
  type Enrollment,
  type SchoolClass,
  type Student,
  type StudentHistory,
} from "@/lib/academic";
import {
  downloadStudentTemplateCSV,
  downloadStudentTemplateXLSX,
  parseStudentSpreadsheet,
  saveBatchStudentsToSupabase,
  type StudentSpreadsheetRow,
} from "@/lib/spreadsheet-service";

type Form = Record<
  | "nome"
  | "nomeSocial"
  | "nascimento"
  | "cpf"
  | "email"
  | "telefone"
  | "cep"
  | "endereco"
  | "ocupacao"
  | "escolaridade"
  | "instituicao"
  | "idioma"
  | "nivel"
  | "objetivo"
  | "meta"
  | "acessibilidade"
  | "emergenciaNome"
  | "emergenciaTelefone"
  | "observacoes"
  | "responsavelNome"
  | "parentesco"
  | "responsavelEmail"
  | "responsavelTelefone",
  string
>;
type LeadSource = {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  documento?: string;
  empresa?: string;
  dataNascimento?: string;
  responsavel?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  anotacoes?: string;
  tags?: string[];
};
const emptyForm: Form = {
  nome: "",
  nomeSocial: "",
  nascimento: "",
  cpf: "",
  email: "",
  telefone: "",
  cep: "",
  endereco: "",
  ocupacao: "",
  escolaridade: "",
  instituicao: "",
  idioma: "",
  nivel: "",
  objetivo: "",
  meta: "",
  acessibilidade: "",
  emergenciaNome: "",
  emergenciaTelefone: "",
  observacoes: "",
  responsavelNome: "",
  parentesco: "",
  responsavelEmail: "",
  responsavelTelefone: "",
};
const selectStyle =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground";
const educationOptions = [
  "Educação infantil",
  "Ensino fundamental",
  "Ensino médio",
  "Ensino técnico",
  "Graduação",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
  "Outro",
];

function ageFromBirth(date: string | null) {
  if (!date) return null;
  const birth = new Date(`${date}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  )
    age--;
  return age;
}
function studentOccupation(isStudent: boolean, form: Form) {
  return isStudent
    ? ["Estudante", form.escolaridade, form.instituicao].filter(Boolean).join(" · ")
    : form.ocupacao.trim();
}
function parseOccupation(value: string | null) {
  const parts = (value || "").split(" · ");
  return parts[0]?.toLowerCase() === "estudante"
    ? {
        isStudent: true,
        occupation: "",
        education: parts[1] || "",
        institution: parts.slice(2).join(" · "),
      }
    : { isStudent: false, occupation: value || "", education: "", institution: "" };
}

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
  const [cepBusy, setCepBusy] = useState(false);
  const [cepError, setCepError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [displayMode, setDisplayMode] = useState<"list" | "cards">("list");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [classFilter, setClassFilter] = useState("todas");
  const [ageFilter, setAgeFilter] = useState("todas");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [activeTab, setActiveTab] = useState<"pessoais" | "academico" | "responsaveis">("pessoais");
  const [photo, setPhoto] = useState<string | null>(null);
  const [detail, setDetail] = useState<Student | null>(null);
  const [history, setHistory] = useState<StudentHistory[]>([]);
  const [leads, setLeads] = useState<LeadSource[]>([]);
  const [sourceLeadId, setSourceLeadId] = useState("");
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<StudentSpreadsheetRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const cepRequestRef = useRef<AbortController | null>(null);
  const lastResolvedCepRef = useRef("");
  const update = (key: keyof Form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const filtered = useMemo(
    () =>
      students.filter((student) => {
        const age = ageFromBirth(student.data_nascimento);
        const matchesAge =
          ageFilter === "todas" ||
          (ageFilter === "menor" && age !== null && age < 18) ||
          (ageFilter === "18-25" && age !== null && age >= 18 && age <= 25) ||
          (ageFilter === "26-40" && age !== null && age >= 26 && age <= 40) ||
          (ageFilter === "41+" && age !== null && age >= 41) ||
          (ageFilter === "nao-informada" && age === null);
        const created = student.created_at?.slice(0, 10) || "";
        return (
          `${student.nome} ${student.email ?? ""} ${student.telefone ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (statusFilter === "todos" || student.status === statusFilter) &&
          (classFilter === "todas" ||
            (classFilter === "sem-turma"
              ? !student.turma_atual_id
              : student.turma_atual_id === classFilter)) &&
          matchesAge &&
          (!createdFrom || created >= createdFrom) &&
          (!createdTo || created <= createdTo)
        );
      }),
    [students, search, statusFilter, classFilter, ageFilter, createdFrom, createdTo],
  );

  async function refresh(id: string) {
    const [studentResult, classResult, enrollmentResult] = await Promise.all([
      supabase
        .from("alunos")
        .select(
          "id,created_at,nome,nome_social,data_nascimento,cpf,email,telefone,endereco,profissao_ou_escola,idioma_principal,nivel_atual,status,responsavel_nome,responsavel_email,responsavel_telefone,responsavel_contato,turma_atual_id,necessidades_acessibilidade,contato_emergencia_nome,contato_emergencia_telefone,objetivo_aprendizagem,meta_academica,observacoes,foto_url",
        )
        .eq("escola_id", id)
        .order("nome"),
      supabase
        .from("turmas")
        .select(
          "id,curso_id,nome,nivel,status,capacidade_maxima,professor_nome,dias_semana,horario_inicio,modalidade,coordenador_nome,faixa_etaria,criterio_entrada,ementa,objetivos,frequencia_minima",
        )
        .eq("escola_id", id)
        .order("nome"),
      supabase
        .from("matriculas")
        .select("id,aluno_id,turma_id,status")
        .eq("escola_id", id)
        .eq("status", "ativa"),
    ]);
    if (studentResult.error) throw studentResult.error;
    if (classResult.error) throw classResult.error;
    if (enrollmentResult.error) throw enrollmentResult.error;
    setStudents((studentResult.data ?? []) as Student[]);
    setClasses((classResult.data ?? []) as SchoolClass[]);
    setEnrollments((enrollmentResult.data ?? []) as Enrollment[]);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const id = await currentSchoolId();
        if (!active) return;
        setSchoolId(id);
        const stored = window.localStorage.getItem(`fluency-ai:leads-db:v2:${id}`);
        setLeads(stored ? JSON.parse(stored) : []);
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
  useEffect(() => () => cepRequestRef.current?.abort(), []);

  function updateCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    update("cep", digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
    setCepError("");
  }

  async function lookupCep(showIncompleteError = false) {
    const digits = form.cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      if (showIncompleteError && digits.length) setCepError("Informe um CEP com 8 dígitos.");
      return;
    }
    if (digits === lastResolvedCepRef.current) return;
    cepRequestRef.current?.abort();
    const controller = new AbortController();
    cepRequestRef.current = controller;
    setCepBusy(true);
    setCepError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Serviço de CEP indisponível.");
      const result = (await response.json()) as {
        erro?: boolean;
        cep?: string;
        logradouro?: string;
        complemento?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (result.erro) {
        setCepError("CEP não encontrado.");
        return;
      }
      const city = [result.localidade, result.uf].filter(Boolean).join("/");
      const address = [result.logradouro, result.complemento, result.bairro, city]
        .filter(Boolean)
        .join(", ");
      update("cep", result.cep || form.cep);
      update("endereco", address);
      lastResolvedCepRef.current = digits;
      toast.success("Endereço preenchido. Confira e inclua o número.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setCepError("Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.");
    } finally {
      if (cepRequestRef.current === controller) setCepBusy(false);
    }
  }

  function importLead(id: string) {
    setSourceLeadId(id);
    const lead = leads.find((item) => item.id === id);
    if (!lead) return;
    setForm((old) => ({
      ...old,
      nome: lead.nome || "",
      email: lead.email || "",
      telefone: lead.telefone || "",
      cpf: lead.documento || "",
      nascimento: lead.dataNascimento || "",
      ocupacao: lead.empresa || "",
      responsavelNome: lead.responsavel === "Não informado" ? "" : lead.responsavel || "",
      endereco: [lead.endereco, lead.numero, lead.complemento, lead.bairro, lead.cidade, lead.uf]
        .filter(Boolean)
        .join(", "),
      objetivo: lead.tags?.join(", ") || old.objetivo,
      observacoes: lead.anotacoes || "",
    }));
  }

  async function saveStudent(event: FormEvent) {
    event.preventDefault();
    if (!schoolId) {
      toast.error("Não foi possível identificar a escola. Atualize a página e tente novamente.");
      return;
    }
    if (!form.nome.trim() || !form.nascimento || (!form.email.trim() && !form.telefone.trim())) {
      toast.error("Preencha nome, data de nascimento e ao menos um contato.");
      setActiveTab("pessoais");
      return;
    }
    setBusy(true);
    const toastId = toast.loading(editingStudent ? "Salvando alterações…" : "Salvando aluno…");
    const address = [form.endereco.trim(), form.cep ? `CEP ${form.cep}` : ""]
      .filter(Boolean)
      .join(" · ");
    const payload = {
      nome: form.nome.trim(),
      nome_social: form.nomeSocial.trim() || null,
      data_nascimento: form.nascimento,
      cpf: form.cpf.trim() || null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      endereco: address || null,
      profissao_ou_escola: studentOccupation(isStudent, form) || null,
      idioma_principal: form.idioma.trim() || null,
      nivel_atual: form.nivel.trim() || null,
      objetivo_aprendizagem: form.objetivo.trim() || null,
      meta_academica: form.meta.trim() || null,
      necessidades_acessibilidade: form.acessibilidade.trim() || null,
      contato_emergencia_nome: form.emergenciaNome.trim() || null,
      contato_emergencia_telefone: form.emergenciaTelefone.trim() || null,
      responsavel_nome: form.responsavelNome.trim() || null,
      responsavel_email: form.responsavelEmail.trim() || null,
      responsavel_telefone: form.responsavelTelefone.trim() || null,
      responsavel_contato: form.parentesco.trim() || null,
      observacoes: form.observacoes.trim() || null,
      foto_url: photo,
    };
    try {
      const operation = editingStudent
        ? supabase
            .from("alunos")
            .update(payload)
            .eq("id", editingStudent.id)
            .eq("escola_id", schoolId)
            .select("id")
            .single()
        : supabase
            .from("alunos")
            .insert({ escola_id: schoolId, ...payload })
            .select("id")
            .single();
      const { data, error: saveError } = await operation;
      if (saveError) throw saveError;
      if (!data?.id) throw new Error("O banco não confirmou a gravação do aluno.");

      if (!editingStudent && form.responsavelNome.trim() && data?.id) {
        const { data: guardian, error: guardianError } = await supabase
          .from("responsaveis")
          .insert({
            escola_id: schoolId,
            nome: form.responsavelNome.trim(),
            parentesco: form.parentesco.trim() || null,
            email: form.responsavelEmail.trim() || null,
            telefone: form.responsavelTelefone.trim() || null,
          })
          .select("id")
          .single();
        if (guardianError) throw guardianError;
        if (guardian) {
          const { error: linkError } = await supabase.from("aluno_responsaveis").insert({
            escola_id: schoolId,
            aluno_id: data.id,
            responsavel_id: guardian.id,
            responsavel_pedagogico: true,
          });
          if (linkError) throw linkError;
        }
      }
      await refresh(schoolId);
      toast.success(
        editingStudent
          ? "Alterações do aluno salvas com sucesso."
          : "Aluno cadastrado com sucesso.",
        { id: toastId },
      );
      closeStudentForm();
    } catch (cause) {
      toast.error(
        `${editingStudent ? "Não foi possível salvar as alterações" : "Não foi possível cadastrar o aluno"}: ${readableError(cause)}`,
        { id: toastId, duration: 8000 },
      );
    } finally {
      setBusy(false);
    }
  }

  function closeStudentForm() {
    cepRequestRef.current?.abort();
    lastResolvedCepRef.current = "";
    setCepBusy(false);
    setCepError("");
    setForm(emptyForm);
    setPhoto(null);
    setSourceLeadId("");
    setActiveTab("pessoais");
    setEditingStudent(null);
    setIsStudent(false);
    setCreateOpen(false);
  }
  function openNewStudent() {
    closeStudentForm();
    setCreateOpen(true);
  }
  function editStudent(student: Student) {
    const profile = parseOccupation(student.profissao_ou_escola);
    const cep = student.endereco?.match(/CEP\s*([\d-]+)/i)?.[1] || "";
    const address = (student.endereco || "").replace(/\s*·\s*CEP\s*[\d-]+/i, "");
    setEditingStudent(student);
    setIsStudent(profile.isStudent);
    setPhoto(student.foto_url);
    setForm({
      ...emptyForm,
      nome: student.nome,
      nomeSocial: student.nome_social || "",
      nascimento: student.data_nascimento || "",
      cpf: student.cpf || "",
      email: student.email || "",
      telefone: student.telefone || "",
      cep,
      endereco: address,
      ocupacao: profile.occupation,
      escolaridade: profile.education,
      instituicao: profile.institution,
      idioma: student.idioma_principal || "",
      nivel: student.nivel_atual || "",
      objetivo: student.objetivo_aprendizagem || "",
      meta: student.meta_academica || "",
      acessibilidade: student.necessidades_acessibilidade || "",
      emergenciaNome: student.contato_emergencia_nome || "",
      emergenciaTelefone: student.contato_emergencia_telefone || "",
      observacoes: student.observacoes || "",
      responsavelNome: student.responsavel_nome || "",
      parentesco: student.responsavel_contato || "",
      responsavelEmail: student.responsavel_email || "",
      responsavelTelefone: student.responsavel_telefone || "",
    });
    setCreateOpen(true);
  }
  async function deleteStudent() {
    if (!deleteTarget) return;
    setBusy(true);
    const { error: deleteError } = await supabase
      .from("alunos")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("escola_id", schoolId);
    if (deleteError) toast.error(`Não foi possível excluir: ${deleteError.message}`);
    else {
      toast.success("Aluno excluído.");
      setDeleteTarget(null);
      await refresh(schoolId);
    }
    setBusy(false);
  }

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      toast.error("Escolha uma imagem de até 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function chooseSpreadsheet(file?: File) {
    if (!file) return;
    try {
      const result = await parseStudentSpreadsheet(file);
      setImportFileName(result.fileName);
      setImportRows(result.rows);
      if (!result.rows.length) toast.error("A planilha não possui registros para importar.");
    } catch (cause) {
      toast.error(`Não foi possível ler a planilha: ${readableError(cause)}`);
    }
  }

  async function confirmSpreadsheetImport() {
    if (!schoolId || !importRows.some((row) => row._isValid !== false)) return;
    setImportBusy(true);
    const result = await saveBatchStudentsToSupabase(importRows, schoolId);
    if (result.errorCount)
      toast.error(result.errorMessage || `${result.errorCount} registro(s) não foram importados.`);
    if (result.savedCount) {
      toast.success(`${result.savedCount} aluno(s) importado(s).`);
      await refresh(schoolId);
      setImportOpen(false);
      setImportRows([]);
      setImportFileName("");
    }
    setImportBusy(false);
  }

  async function openDetail(student: Student) {
    setDetail(student);
    setHistory([]);
    const { data } = await supabase
      .from("historico_aluno")
      .select("id,tipo,titulo,descricao,created_at")
      .eq("escola_id", schoolId)
      .eq("aluno_id", student.id)
      .order("created_at", { ascending: false });
    setHistory((data ?? []) as StudentHistory[]);
  }

  async function enroll(student: Student) {
    const classId = selectedClasses[student.id];
    if (!classId) return;
    if (enrollments.some((item) => item.aluno_id === student.id && item.turma_id === classId)) {
      toast.error("O aluno já está nessa turma.");
      return;
    }
    const selected = classes.find((item) => item.id === classId);
    if (!selected) return;
    setBusy(true);
    const { error: saveError } = await supabase
      .from("matriculas")
      .insert({ escola_id: schoolId, aluno_id: student.id, turma_id: classId });
    if (saveError) toast.error(saveError.message);
    else {
      await supabase
        .from("alunos")
        .update({ turma_atual_id: classId, turma_nome: selected.nome })
        .eq("id", student.id)
        .eq("escola_id", schoolId);
      toast.success("Matrícula realizada.");
      await refresh(schoolId);
    }
    setBusy(false);
  }

  if (loading)
    return (
      <div className="grid min-h-72 place-items-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  if (error)
    return (
      <p role="alert" className="p-8 text-red-400">
        {error}
      </p>
    );
  return (
    <main className="space-y-6 p-6 text-foreground">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Jornada acadêmica
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Alunos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastro completo, matrícula e histórico acadêmico por escola.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="size-4" /> Importar planilha
          </Button>
          <Button onClick={openNewStudent} className="gap-2">
            <Plus className="size-4" /> Novo aluno
          </Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={Users} label="Alunos cadastrados" value={students.length} />
        <Metric icon={GraduationCap} label="Matrículas ativas" value={enrollments.length} />
        <Metric
          icon={BookOpen}
          label="Turmas disponíveis"
          value={classes.filter((item) => item.status === "ativa").length}
        />
      </section>
      <section className="rounded-2xl border border-hairline bg-surface/50 p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou telefone"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {filtered.length} de {students.length} alunos
              </span>
              <div className="flex rounded-lg border border-hairline p-1">
                <Button
                  size="sm"
                  variant={displayMode === "list" ? "default" : "ghost"}
                  onClick={() => setDisplayMode("list")}
                  aria-label="Visualização em lista"
                >
                  <List className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant={displayMode === "cards" ? "default" : "ghost"}
                  onClick={() => setDisplayMode("cards")}
                  aria-label="Visualização em cards"
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-hairline bg-background/30 p-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Filter className="size-3" />
                Status
              </span>
              <select
                className={selectStyle}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos</option>
                {Array.from(new Set(students.map((student) => student.status))).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Turma</span>
              <select
                className={selectStyle}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="sem-turma">Sem turma</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Idade</span>
              <select
                className={selectStyle}
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="menor">Menores de 18</option>
                <option value="18-25">18 a 25</option>
                <option value="26-40">26 a 40</option>
                <option value="41+">41 ou mais</option>
                <option value="nao-informada">Não informada</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Cadastrado a partir de</span>
              <Input
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Cadastrado até</span>
              <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
            </label>
          </div>
        </div>
        {displayMode === "list" ? (
          <div className="mt-5 overflow-x-auto rounded-xl border border-hairline">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="p-3">Aluno</th>
                  <th className="p-3">Idade</th>
                  <th className="p-3">Contato</th>
                  <th className="p-3">Turma</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Cadastro</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const schoolClass = classes.find((item) => item.id === student.turma_atual_id);
                  const age = ageFromBirth(student.data_nascimento);
                  return (
                    <tr key={student.id} className="border-t border-hairline hover:bg-accent/30">
                      <td className="p-3">
                        <button
                          onClick={() => void openDetail(student)}
                          className="flex items-center gap-3 text-left"
                        >
                          <Avatar student={student} />
                          <span>
                            <strong className="block">{student.nome_social || student.nome}</strong>
                            <small className="text-muted-foreground">
                              {student.nivel_atual || "Nível não definido"}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td className="p-3">{age === null ? "—" : `${age} anos`}</td>
                      <td className="p-3 text-muted-foreground">
                        {student.email || student.telefone || "—"}
                      </td>
                      <td className="p-3">{schoolClass?.nome || "Sem turma"}</td>
                      <td className="p-3">
                        <Badge variant="outline">{student.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {student.created_at
                          ? new Date(student.created_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editStudent(student)}
                            aria-label="Editar aluno"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400"
                            onClick={() => setDeleteTarget(student)}
                            aria-label="Excluir aluno"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && <EmptyStudents />}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((student) => {
              const schoolClass = classes.find((item) => item.id === student.turma_atual_id);
              return (
                <article
                  key={student.id}
                  className="rounded-xl border border-hairline bg-background/35 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => void openDetail(student)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <Avatar student={student} large />
                      <div className="min-w-0">
                        <strong className="block truncate">
                          {student.nome_social || student.nome}
                        </strong>
                        <span className="text-sm text-muted-foreground">
                          {schoolClass?.nome || "Sem turma"}
                        </span>
                      </div>
                    </button>
                    <Badge variant="outline">{student.status}</Badge>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <select
                      className={selectStyle}
                      value={selectedClasses[student.id] || ""}
                      onChange={(e) =>
                        setSelectedClasses((old) => ({ ...old, [student.id]: e.target.value }))
                      }
                    >
                      <option value="">Selecionar turma</option>
                      {classes
                        .filter((item) => item.status === "ativa")
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nome}
                          </option>
                        ))}
                    </select>
                    <Button
                      variant="outline"
                      disabled={busy || !selectedClasses[student.id]}
                      onClick={() => void enroll(student)}
                    >
                      Matricular
                    </Button>
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => editStudent(student)}>
                      <Pencil className="mr-1 size-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => setDeleteTarget(student)}
                    >
                      <Trash2 className="mr-1 size-4" />
                      Excluir
                    </Button>
                  </div>
                </article>
              );
            })}
            {!filtered.length && <EmptyStudents />}
          </div>
        )}
      </section>
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!busy) {
            if (open) setCreateOpen(true);
            else closeStudentForm();
          }
        }}
      >
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden border-hairline bg-background p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-hairline px-7 pb-5 pt-7">
            <DialogTitle className="text-xl">
              {editingStudent ? "Editar aluno" : "Novo aluno"}
            </DialogTitle>
            <DialogDescription>
              Campos com * são obrigatórios. Informe ao menos um contato: e-mail ou telefone.
            </DialogDescription>
          </DialogHeader>
          <form id="student-form" onSubmit={saveStudent} className="flex min-h-0 flex-1 flex-col">
            {leads.length > 0 && (
              <div className="border-b border-hairline bg-primary/5 px-7 py-4">
                <Label>Preencher a partir de um lead</Label>
                <select
                  className={`${selectStyle} mt-1.5 max-w-xl bg-background`}
                  value={sourceLeadId}
                  onChange={(e) => importLead(e.target.value)}
                >
                  <option value="">Começar um cadastro em branco</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.nome || "Lead sem nome"} {lead.email ? `· ${lead.email}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Os dados comerciais disponíveis serão trazidos para revisão antes de salvar.
                </p>
              </div>
            )}
            <div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr]">
              <aside className="border-b border-hairline bg-surface/35 p-6 md:border-b-0 md:border-r">
                <div className="mx-auto flex size-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-hairline bg-background/60">
                  {photo ? (
                    <img src={photo} alt="Prévia do aluno" className="size-full object-cover" />
                  ) : (
                    <UserRound className="size-10 text-muted-foreground" />
                  )}
                </div>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium hover:bg-accent">
                  <Camera className="size-4" /> {photo ? "Trocar foto" : "Adicionar foto"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => choosePhoto(e.target.files?.[0])}
                  />
                </label>
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" /> Remover foto
                  </button>
                )}
                <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                  JPG, PNG ou WebP
                  <br />
                  até 2 MB
                </p>
                <nav className="mt-7 space-y-1">
                  {(["pessoais", "academico", "responsaveis"] as const).map((tab, index) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                    >
                      <span className="grid size-6 place-items-center rounded-full border border-current text-xs">
                        {index + 1}
                      </span>
                      {tab === "pessoais"
                        ? "Dados pessoais"
                        : tab === "academico"
                          ? "Perfil acadêmico"
                          : "Responsáveis"}
                    </button>
                  ))}
                </nav>
              </aside>
              <div className="min-h-0 overflow-y-auto p-7">
                {activeTab === "pessoais" && (
                  <Section title="Identificação e contato">
                    <Field
                      label="Nome completo *"
                      value={form.nome}
                      set={(v) => update("nome", v)}
                      required
                    />
                    <Field
                      label="Nome social"
                      value={form.nomeSocial}
                      set={(v) => update("nomeSocial", v)}
                    />
                    <Field
                      label="Data de nascimento *"
                      type="date"
                      value={form.nascimento}
                      set={(v) => update("nascimento", v)}
                      required
                    />
                    <Field label="CPF" value={form.cpf} set={(v) => update("cpf", v)} />
                    <Field
                      label="E-mail (e-mail ou telefone obrigatório)"
                      type="email"
                      value={form.email}
                      set={(v) => update("email", v)}
                    />
                    <Field
                      label="Telefone / WhatsApp (e-mail ou telefone obrigatório)"
                      value={form.telefone}
                      set={(v) => update("telefone", v)}
                    />
                    <div>
                      <Label>CEP</Label>
                      <div className="flex gap-2">
                        <Input
                          value={form.cep}
                          onChange={(event) => updateCep(event.target.value)}
                          onBlur={() => void lookupCep()}
                          placeholder="00000-000"
                          inputMode="numeric"
                          maxLength={9}
                          aria-describedby="cep-feedback"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={cepBusy || form.cep.replace(/\D/g, "").length !== 8}
                          onClick={() => void lookupCep(true)}
                        >
                          {cepBusy ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Buscando…
                            </>
                          ) : (
                            "Buscar CEP"
                          )}
                        </Button>
                      </div>
                      {cepError && (
                        <p id="cep-feedback" role="alert" className="mt-1 text-xs text-red-400">
                          {cepError}
                        </p>
                      )}
                    </div>
                    <div className="self-end pb-2 text-xs text-muted-foreground">
                      O endereço preenchido automaticamente continua editável.
                    </div>
                    <div className="md:col-span-2">
                      <Field
                        label="Endereço"
                        value={form.endereco}
                        set={(v) => update("endereco", v)}
                        placeholder="Rua, número, complemento, bairro, cidade e estado"
                      />
                    </div>
                    <label className="flex min-h-9 items-center gap-2 rounded-lg border border-hairline px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={isStudent}
                        onChange={(event) => setIsStudent(event.target.checked)}
                        className="size-4 accent-primary"
                      />
                      É estudante
                    </label>
                    {!isStudent && (
                      <Field
                        label="Profissão"
                        value={form.ocupacao}
                        set={(v) => update("ocupacao", v)}
                      />
                    )}
                    {isStudent && (
                      <>
                        <div>
                          <Label>Etapa de ensino</Label>
                          <select
                            className={selectStyle}
                            value={form.escolaridade}
                            onChange={(event) => update("escolaridade", event.target.value)}
                          >
                            <option value="">Selecione</option>
                            {educationOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Field
                          label="Instituição de ensino"
                          value={form.instituicao}
                          set={(v) => update("instituicao", v)}
                        />
                      </>
                    )}
                  </Section>
                )}
                {activeTab === "academico" && (
                  <Section title="Jornada de aprendizagem">
                    <Field
                      label="Idioma ou área principal"
                      value={form.idioma}
                      set={(v) => update("idioma", v)}
                      placeholder="Inglês, Barbearia, Manicure…"
                    />
                    <Field label="Nível atual" value={form.nivel} set={(v) => update("nivel", v)} />
                    <Field
                      label="Objetivo de aprendizagem"
                      value={form.objetivo}
                      set={(v) => update("objetivo", v)}
                    />
                    <Field
                      label="Meta acadêmica"
                      value={form.meta}
                      set={(v) => update("meta", v)}
                    />
                    <LongField
                      label="Necessidades de acessibilidade"
                      value={form.acessibilidade}
                      set={(v) => update("acessibilidade", v)}
                    />
                    <LongField
                      label="Observações internas"
                      value={form.observacoes}
                      set={(v) => update("observacoes", v)}
                    />
                  </Section>
                )}
                {activeTab === "responsaveis" && (
                  <Section title="Responsável e emergência">
                    <Field
                      label="Responsável"
                      value={form.responsavelNome}
                      set={(v) => update("responsavelNome", v)}
                    />
                    <Field
                      label="Parentesco"
                      value={form.parentesco}
                      set={(v) => update("parentesco", v)}
                    />
                    <Field
                      label="E-mail do responsável"
                      type="email"
                      value={form.responsavelEmail}
                      set={(v) => update("responsavelEmail", v)}
                    />
                    <Field
                      label="Telefone do responsável"
                      value={form.responsavelTelefone}
                      set={(v) => update("responsavelTelefone", v)}
                    />
                    <Field
                      label="Contato de emergência"
                      value={form.emergenciaNome}
                      set={(v) => update("emergenciaNome", v)}
                    />
                    <Field
                      label="Telefone de emergência"
                      value={form.emergenciaTelefone}
                      set={(v) => update("emergenciaTelefone", v)}
                    />
                  </Section>
                )}
              </div>
            </div>
          </form>
          <DialogFooter className="border-t border-hairline px-7 py-5">
            <Button variant="outline" disabled={busy} onClick={closeStudentForm}>
              Cancelar
            </Button>
            <Button form="student-form" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando…
                </>
              ) : editingStudent ? (
                "Salvar alterações"
              ) : (
                "Salvar aluno"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={importOpen} onOpenChange={(open) => !importBusy && setImportOpen(open)}>
        <DialogContent className="border-hairline bg-background sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-primary" /> Importar alunos
            </DialogTitle>
            <DialogDescription>
              Baixe o modelo, mantenha os títulos das colunas e confira os dados antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-surface/40 p-4">
              <span className="mr-auto text-sm font-medium">Planilhas padrão</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={downloadStudentTemplateCSV}
              >
                <Download className="mr-2 size-4" />
                CSV
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={downloadStudentTemplateXLSX}
              >
                <Download className="mr-2 size-4" />
                XLSX
              </Button>
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={(event) => void chooseSpreadsheet(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-hairline p-8 text-center hover:border-primary"
            >
              <Upload className="mb-3 size-7 text-primary" />
              <strong>{importFileName || "Selecionar planilha"}</strong>
              <span className="mt-1 text-sm text-muted-foreground">CSV, XLS ou XLSX</span>
            </button>
            {importRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    {importRows.filter((row) => row._isValid !== false).length} prontos
                  </span>
                  {importRows.some((row) => row._isValid === false) && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertCircle className="size-4" />
                      {importRows.filter((row) => row._isValid === false).length} com erro
                    </span>
                  )}
                </div>
                <div className="max-h-56 overflow-auto rounded-xl border border-hairline">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface">
                      <tr>
                        <th className="p-3">Aluno</th>
                        <th className="p-3">Contato</th>
                        <th className="p-3">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 20).map((row, index) => (
                        <tr key={`${row.nome}-${index}`} className="border-t border-hairline">
                          <td className="p-3 font-medium">{row.nome || "Sem nome"}</td>
                          <td className="p-3 text-muted-foreground">
                            {row.email || row.telefone || "—"}
                          </td>
                          <td className="p-3">
                            {row._isValid === false ? (
                              <span className="text-amber-400">{row._errors?.join(" ")}</span>
                            ) : (
                              <span className="text-emerald-400">Pronto</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importRows.length > 20 && (
                  <p className="text-xs text-muted-foreground">
                    Exibindo os primeiros 20 de {importRows.length} registros.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={importBusy} onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={importBusy || !importRows.some((row) => row._isValid !== false)}
              onClick={() => void confirmSpreadsheetImport()}
            >
              {importBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Importando…
                </>
              ) : (
                "Confirmar importação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-hairline bg-background sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail?.nome_social || detail?.nome}</DialogTitle>
            <DialogDescription>Dossiê acadêmico individual</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-5 py-2 md:grid-cols-2">
              <Info
                title="Dados pessoais"
                rows={[detail.email, detail.telefone, detail.data_nascimento, detail.cpf]}
              />
              <Info
                title="Objetivos"
                rows={[
                  detail.objetivo_aprendizagem,
                  detail.meta_academica,
                  detail.necessidades_acessibilidade,
                ]}
              />
              <section className="md:col-span-2">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <History className="size-4 text-primary" /> Linha do tempo
                </h3>
                {history.map((item) => (
                  <div key={item.id} className="mb-2 rounded-xl border border-hairline p-3">
                    <strong className="text-sm">{item.titulo}</strong>
                    <p className="text-sm text-muted-foreground">{item.descricao || item.tipo}</p>
                  </div>
                ))}
                {!history.length && (
                  <p className="rounded-xl border border-dashed border-hairline p-6 text-center text-sm text-muted-foreground">
                    O histórico começará com aulas, presenças, avaliações e ocorrências.
                  </p>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && !busy && setDeleteTarget(null)}
      >
        <DialogContent className="border-hairline bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir aluno?</DialogTitle>
            <DialogDescription>
              O cadastro de {deleteTarget?.nome} será excluído. Se houver matrícula ou histórico
              relacionado, o sistema preservará os dados e informará por que a exclusão não pôde ser
              concluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => void deleteStudent()}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Excluindo…
                </>
              ) : (
                "Excluir aluno"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface/50 p-5">
      <Icon className="size-5 text-primary" />
      <p className="mt-5 text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
function Avatar({ student, large = false }: { student: Student; large?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-hairline bg-surface ${large ? "size-14" : "size-10"}`}
    >
      {student.foto_url ? (
        <img src={student.foto_url} alt="" className="size-full object-cover" />
      ) : (
        <UserRound
          className={large ? "size-6 text-muted-foreground" : "size-5 text-muted-foreground"}
        />
      )}
    </span>
  );
}
function EmptyStudents() {
  return (
    <div className="col-span-full p-10 text-center text-sm text-muted-foreground">
      Nenhum aluno encontrado com os filtros selecionados.
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-semibold">{title}</legend>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
function Field({
  label,
  value,
  set,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
function LongField({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );
}
function Info({ title, rows }: { title: string; rows: Array<string | null> }) {
  return (
    <section className="rounded-xl border border-hairline p-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <UserRound className="size-4 text-primary" />
        {title}
      </h3>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        {rows.filter(Boolean).map((row) => (
          <p key={row}>{row}</p>
        ))}
        {!rows.some(Boolean) && <p>Nenhuma informação registrada.</p>}
      </div>
    </section>
  );
}
