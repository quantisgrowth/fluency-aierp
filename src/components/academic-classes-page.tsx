import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  MapPin,
  Plus,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  type AcademicStaff,
  type Course,
  type CourseStage,
  type SchoolClass,
} from "@/lib/academic";

const selectStyle =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground";
type Category = Course["categoria"];

export function AcademicClassesPage() {
  const [schoolId, setSchoolId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [stages, setStages] = useState<CourseStage[]>([]);
  const [staff, setStaff] = useState<AcademicStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [course, setCourse] = useState({
    nome: "",
    codigo: "",
    nivel: "",
    preco: "",
    categoria: "idioma" as Category,
    frequencia: "75",
    nivelamento: false,
    pratica: false,
    estagio: false,
    projeto: false,
    certificado: true,
    criterio: "",
    ementa: "",
    etapas: "",
  });
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [group, setGroup] = useState({
    nome: "",
    cursoId: "",
    etapaId: "",
    capacidade: "15",
    professorId: "",
    coordenadorId: "",
    modalidade: "presencial",
    idadeMinima: "",
    idadeMaxima: "",
    criterio: "",
    objetivos: "",
    frequencia: "",
    sala: "",
    plataforma: "",
    linkOnline: "",
    dataInicio: "",
    dataFim: "",
    horarioInicio: "",
    horarioFim: "",
    diasSemana: [] as string[],
  });

  async function refresh(id: string) {
    const [courseResult, classResult, stageResult, memberResult] = await Promise.all([
      supabase
        .from("cursos")
        .select(
          "id,nome,codigo,nivel,valor_base,ativo,categoria,exige_nivelamento,exige_avaliacao_pratica,exige_estagio,exige_projeto_final,emite_certificado,frequencia_minima,criterio_entrada,ementa",
        )
        .eq("escola_id", id)
        .order("nome"),
      supabase
        .from("turmas")
        .select(
          "id,curso_id,nome,nivel,status,capacidade_maxima,professor_id,professor_nome,dias_semana,horario_inicio,horario_fim,data_inicio,data_fim,sala,modalidade,coordenador_id,coordenador_nome,curso_etapa_id,idade_minima,idade_maxima,faixa_etaria,criterio_entrada,ementa,objetivos,frequencia_minima",
        )
        .eq("escola_id", id)
        .order("nome"),
      supabase
        .from("curso_etapas")
        .select("id,curso_id,codigo,nome,descricao,ordem")
        .eq("escola_id", id)
        .eq("ativo", true)
        .order("ordem"),
      supabase
        .from("escola_membros")
        .select("user_id,papel")
        .eq("escola_id", id)
        .eq("status", "ativo")
        .in("papel", ["professor", "pedagogico"]),
    ]);
    if (courseResult.error) throw courseResult.error;
    if (classResult.error) throw classResult.error;
    if (stageResult.error) throw stageResult.error;
    if (memberResult.error) throw memberResult.error;
    const memberIds = (memberResult.data ?? []).map((item) => item.user_id);
    const userResult = memberIds.length
      ? await supabase
          .from("usuarios")
          .select("id,auth_user_id,nome,status")
          .eq("escola_id", id)
          .eq("status", "ativo")
          .in("auth_user_id", memberIds)
      : { data: [], error: null };
    if (userResult.error) throw userResult.error;
    const membershipByUser = new Map(
      (memberResult.data ?? []).map((item) => [item.user_id, item.papel]),
    );
    setCourses((courseResult.data ?? []) as Course[]);
    setClasses((classResult.data ?? []) as SchoolClass[]);
    setStages((stageResult.data ?? []) as CourseStage[]);
    setStaff(
      (userResult.data ?? []).map((item) => ({
        id: item.id,
        nome: item.nome,
        papel:
          membershipByUser.get(item.auth_user_id) === "professor" ? "professor" : "coordenador",
      })),
    );
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

  async function createCourse(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data: savedCourse, error: saveError } = await supabase
        .from("cursos")
        .insert({
          escola_id: schoolId,
          nome: course.nome.trim(),
          codigo: course.codigo.trim().toUpperCase(),
          nivel: course.nivel.trim() || null,
          valor_base: Number(course.preco || 0),
          categoria: course.categoria,
          frequencia_minima: Number(course.frequencia || 75),
          exige_nivelamento: course.nivelamento,
          exige_avaliacao_pratica: course.pratica,
          exige_estagio: course.estagio,
          exige_projeto_final: course.projeto,
          emite_certificado: course.certificado,
          criterio_entrada: course.criterio.trim() || null,
          ementa: course.ementa.trim() || null,
        })
        .select("id")
        .single();
      if (saveError) throw saveError;

      const parsedStages = course.etapas
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [rawCode, ...nameParts] = line.split("|");
          const hasName = nameParts.length > 0;
          return {
            escola_id: schoolId,
            curso_id: savedCourse.id,
            codigo: (hasName ? rawCode : String(index + 1)).trim().toUpperCase(),
            nome: (hasName ? nameParts.join("|") : rawCode).trim(),
            ordem: index + 1,
          };
        });
      if (parsedStages.length) {
        const { error: stageError } = await supabase.from("curso_etapas").insert(parsedStages);
        if (stageError) throw stageError;
      }

      if (syllabusFile) {
        const safeName = syllabusFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storagePath = `${schoolId}/${savedCourse.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("curso-documentos")
          .upload(storagePath, syllabusFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { error: documentError } = await supabase.from("curso_documentos").insert({
          escola_id: schoolId,
          curso_id: savedCourse.id,
          tipo: "ementa",
          titulo: syllabusFile.name,
          storage_path: storagePath,
        });
        if (documentError) {
          await supabase.storage.from("curso-documentos").remove([storagePath]);
          throw documentError;
        }
      }

      toast.success("Curso criado.");
      setCourse((old) => ({
        ...old,
        nome: "",
        codigo: "",
        nivel: "",
        preco: "",
        criterio: "",
        ementa: "",
        etapas: "",
      }));
      setSyllabusFile(null);
      setCourseOpen(false);
      await refresh(schoolId);
    } catch (cause) {
      toast.error(readableError(cause));
    } finally {
      setBusy(false);
    }
  }
  async function createClass(event: FormEvent) {
    event.preventDefault();
    const selectedCourse = courses.find((item) => item.id === group.cursoId);
    const selectedStage = stages.find((item) => item.id === group.etapaId);
    const selectedProfessor = staff.find((item) => item.id === group.professorId);
    const selectedCoordinator = staff.find((item) => item.id === group.coordenadorId);
    const minimumAge = group.idadeMinima ? Number(group.idadeMinima) : null;
    const maximumAge = group.idadeMaxima ? Number(group.idadeMaxima) : null;
    if (minimumAge !== null && maximumAge !== null && minimumAge > maximumAge) {
      toast.error("A idade mínima não pode ser maior que a idade máxima.");
      return;
    }
    if ((group.modalidade === "presencial" || group.modalidade === "hibrida") && !group.sala) {
      toast.error("Informe a sala para turmas presenciais ou híbridas.");
      return;
    }
    if ((group.modalidade === "online" || group.modalidade === "hibrida") && !group.linkOnline) {
      toast.error("Informe o link das aulas online.");
      return;
    }
    if (group.dataInicio && group.dataFim && group.dataInicio > group.dataFim) {
      toast.error("A data de término deve ser posterior à data de início.");
      return;
    }
    if (group.horarioInicio && group.horarioFim && group.horarioInicio >= group.horarioFim) {
      toast.error("O horário de término deve ser posterior ao horário de início.");
      return;
    }
    const conflictingClass = classes.find((item) => {
      if (!group.horarioInicio || !group.horarioFim || !item.horario_inicio || !item.horario_fim) {
        return false;
      }
      const sameResource =
        (group.professorId && item.professor_id === group.professorId) ||
        (group.sala && item.sala?.toLowerCase() === group.sala.trim().toLowerCase());
      const sameDay = group.diasSemana.some((day) => item.dias_semana?.includes(day));
      const timeOverlap =
        group.horarioInicio < item.horario_fim && group.horarioFim > item.horario_inicio;
      const dateOverlap =
        (!group.dataFim || !item.data_inicio || group.dataFim >= item.data_inicio) &&
        (!item.data_fim || !group.dataInicio || item.data_fim >= group.dataInicio);
      return sameResource && sameDay && timeOverlap && dateOverlap;
    });
    if (conflictingClass) {
      toast.error(`Conflito de agenda com a turma “${conflictingClass.nome}”.`);
      return;
    }
    setBusy(true);
    try {
      const { error: saveError } = await supabase.from("turmas").insert({
        escola_id: schoolId,
        curso_id: group.cursoId,
        curso_etapa_id: group.etapaId || null,
        nome: group.nome.trim(),
        nivel: selectedStage?.nome || selectedCourse?.nivel || null,
        capacidade_maxima: Number(group.capacidade),
        professor_id: group.professorId || null,
        professor_nome: selectedProfessor?.nome || null,
        coordenador_id: group.coordenadorId || null,
        coordenador_nome: selectedCoordinator?.nome || null,
        modalidade: group.modalidade,
        idade_minima: minimumAge,
        idade_maxima: maximumAge,
        faixa_etaria:
          minimumAge !== null || maximumAge !== null
            ? `${minimumAge ?? "livre"}–${maximumAge ?? "livre"}`
            : null,
        criterio_entrada: group.criterio.trim() || selectedCourse?.criterio_entrada || null,
        objetivos: group.objetivos.trim() || null,
        frequencia_minima: group.frequencia
          ? Number(group.frequencia)
          : selectedCourse?.frequencia_minima || null,
        sala: group.sala.trim() || null,
        plataforma_online: group.plataforma.trim() || null,
        link_online: group.linkOnline.trim() || null,
        data_inicio: group.dataInicio || null,
        data_fim: group.dataFim || null,
        horario_inicio: group.horarioInicio || null,
        horario_fim: group.horarioFim || null,
        dias_semana: group.diasSemana.length ? group.diasSemana : null,
      });
      if (saveError) throw saveError;
      toast.success("Turma criada.");
      setGroup((old) => ({
        ...old,
        nome: "",
        etapaId: "",
        professorId: "",
        coordenadorId: "",
        idadeMinima: "",
        idadeMaxima: "",
        criterio: "",
        objetivos: "",
        sala: "",
        plataforma: "",
        linkOnline: "",
        dataInicio: "",
        dataFim: "",
        horarioInicio: "",
        horarioFim: "",
        diasSemana: [],
      }));
      setClassOpen(false);
      await refresh(schoolId);
    } catch (cause) {
      toast.error(readableError(cause));
    } finally {
      setBusy(false);
    }
  }
  async function toggleClass(item: SchoolClass) {
    const next = item.status === "ativa" ? "concluida" : "ativa";
    const { error: saveError } = await supabase
      .from("turmas")
      .update({ status: next })
      .eq("id", item.id)
      .eq("escola_id", schoolId);
    if (saveError) toast.error(saveError.message);
    else {
      toast.success(next === "ativa" ? "Turma reativada." : "Turma concluída.");
      await refresh(schoolId);
    }
  }

  if (loading)
    return (
      <div className="grid min-h-72 place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (error) return <p className="p-8 text-red-400">{error}</p>;
  return (
    <main className="space-y-6 p-6 text-foreground">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Estrutura pedagógica
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cursos e turmas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Uma estrutura flexível para idiomas, formação profissional, cursos livres e
            preparatórios.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCourseOpen(true)}>
            <Plus className="mr-2 size-4" /> Novo curso
          </Button>
          <Button onClick={() => setClassOpen(true)} disabled={!courses.length}>
            <Users className="mr-2 size-4" /> Nova turma
          </Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          icon={BookOpen}
          label="Cursos ativos"
          value={courses.filter((item) => item.ativo).length}
        />
        <Metric
          icon={Users}
          label="Turmas ativas"
          value={classes.filter((item) => item.status === "ativa").length}
        />
        <Metric
          icon={Award}
          label="Cursos com certificado"
          value={courses.filter((item) => item.emite_certificado).length}
        />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Catálogo de cursos</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {courses.map((item) => (
            <article key={item.id} className="rounded-2xl border border-hairline bg-surface/50 p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.codigo} · {item.nivel || "Nível livre"}
                  </p>
                </div>
                <Badge variant="outline">{categoryLabel(item.categoria)}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.exige_nivelamento && <Badge variant="secondary">Nivelamento</Badge>}
                {item.exige_avaliacao_pratica && <Badge variant="secondary">Prática</Badge>}
                {item.exige_estagio && <Badge variant="secondary">Estágio</Badge>}
                {item.exige_projeto_final && <Badge variant="secondary">Projeto final</Badge>}
                <Badge variant="secondary">Frequência {item.frequencia_minima}%</Badge>
              </div>
            </article>
          ))}
          {!courses.length && <Empty text="Cadastre o primeiro curso para montar suas turmas." />}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Turmas</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {classes.map((item) => (
            <article key={item.id} className="rounded-2xl border border-hairline bg-surface/50 p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {courses.find((c) => c.id === item.curso_id)?.nome || "Curso"} ·{" "}
                    {item.modalidade || "presencial"}
                  </p>
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Professor</span>
                  <br />
                  {item.professor_nome || "A definir"}
                </p>
                <p>
                  <span className="text-muted-foreground">Coordenação</span>
                  <br />
                  {item.coordenador_nome || "A definir"}
                </p>
                <p>
                  <span className="text-muted-foreground">Capacidade</span>
                  <br />
                  {item.capacidade_maxima} alunos
                </p>
                <p>
                  <span className="text-muted-foreground">Nível</span>
                  <br />
                  {item.nivel || "Livre"}
                </p>
              </div>
              <Button variant="link" className="mt-3 px-0" onClick={() => void toggleClass(item)}>
                {item.status === "ativa" ? "Concluir turma" : "Reativar turma"}
              </Button>
            </article>
          ))}
          {!classes.length && <Empty text="Nenhuma turma cadastrada." />}
        </div>
      </section>
      <Dialog open={courseOpen} onOpenChange={(open) => !busy && setCourseOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-hairline bg-background sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo curso</DialogTitle>
            <DialogDescription>Defina o modelo adequado à formação oferecida.</DialogDescription>
          </DialogHeader>
          <form id="course-form" onSubmit={createCourse} className="grid gap-4 py-2 md:grid-cols-2">
            <Field
              label="Nome"
              value={course.nome}
              set={(v) => setCourse({ ...course, nome: v })}
              required
            />
            <Field
              label="Código"
              value={course.codigo}
              set={(v) => setCourse({ ...course, codigo: v })}
              required
            />
            <div>
              <Label>Categoria</Label>
              <select
                className={selectStyle}
                value={course.categoria}
                onChange={(e) => setCourse({ ...course, categoria: e.target.value as Category })}
              >
                <option value="idioma">Idioma</option>
                <option value="profissionalizante">Profissionalizante</option>
                <option value="livre">Curso livre</option>
                <option value="preparatorio">Preparatório</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <Field
              label="Nível geral (opcional)"
              value={course.nivel}
              set={(v) => setCourse({ ...course, nivel: v })}
            />
            <Field
              label="Valor base"
              type="number"
              value={course.preco}
              set={(v) => setCourse({ ...course, preco: v })}
            />
            <Field
              label="Frequência mínima (%)"
              type="number"
              value={course.frequencia}
              set={(v) => setCourse({ ...course, frequencia: v })}
            />
            <Long
              label="Critério de entrada padrão"
              value={course.criterio}
              set={(v) => setCourse({ ...course, criterio: v })}
              placeholder="Ex.: nivelamento B1, conclusão do módulo anterior ou aprovação da coordenação."
            />
            <Long
              label="Ementa do curso"
              value={course.ementa}
              set={(v) => setCourse({ ...course, ementa: v })}
              placeholder="Conteúdo programático, competências e resultados esperados."
            />
            <div className="md:col-span-2">
              <Label>Etapas do curso</Label>
              <Textarea
                value={course.etapas}
                onChange={(event) => setCourse({ ...course, etapas: event.target.value })}
                placeholder={"A1.1 | Fundamentos\nA1.2 | Comunicação básica\nA2 | Consolidação"}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Informe uma etapa por linha. Use “código | nome” para organizar o percurso.
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-hairline p-4 md:col-span-2">
              <Label htmlFor="syllabus-file" className="flex items-center gap-2">
                <Upload className="size-4" /> Documento da ementa
              </Label>
              <Input
                id="syllabus-file"
                className="mt-2"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setSyllabusFile(event.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                PDF ou DOCX, até 10 MB. O arquivo fica privado e vinculado ao curso.
              </p>
            </div>
            <div className="space-y-3 md:col-span-2">
              <Check
                label="Exige nivelamento"
                checked={course.nivelamento}
                set={(v) => setCourse({ ...course, nivelamento: v })}
              />
              <Check
                label="Exige avaliação prática"
                checked={course.pratica}
                set={(v) => setCourse({ ...course, pratica: v })}
              />
              <Check
                label="Exige estágio"
                checked={course.estagio}
                set={(v) => setCourse({ ...course, estagio: v })}
              />
              <Check
                label="Exige projeto final"
                checked={course.projeto}
                set={(v) => setCourse({ ...course, projeto: v })}
              />
              <Check
                label="Emite certificado"
                checked={course.certificado}
                set={(v) => setCourse({ ...course, certificado: v })}
              />
            </div>
          </form>
          <Footer
            form="course-form"
            busy={busy}
            close={() => setCourseOpen(false)}
            label="Salvar curso"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={classOpen} onOpenChange={(open) => !busy && setClassOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-hairline bg-background sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nova turma</DialogTitle>
            <DialogDescription>
              Vincule equipe, regras pedagógicas e planejamento.
            </DialogDescription>
          </DialogHeader>
          <form id="class-form" onSubmit={createClass} className="grid gap-5 py-2 md:grid-cols-2">
            <SectionTitle icon={BookOpen} title="Identificação" />
            <div>
              <Label>Curso</Label>
              <select
                required
                className={selectStyle}
                value={group.cursoId}
                onChange={(e) =>
                  setGroup({
                    ...group,
                    cursoId: e.target.value,
                    etapaId: "",
                    criterio:
                      courses.find((item) => item.id === e.target.value)?.criterio_entrada || "",
                  })
                }
              >
                <option value="">Selecione</option>
                {courses
                  .filter((item) => item.ativo)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
              </select>
            </div>
            <Field
              label="Nome da turma"
              value={group.nome}
              set={(v) => setGroup({ ...group, nome: v })}
              required
            />
            <div>
              <Label>Etapa do curso</Label>
              <select
                className={selectStyle}
                value={group.etapaId}
                onChange={(event) => setGroup({ ...group, etapaId: event.target.value })}
                disabled={!group.cursoId}
              >
                <option value="">Sem etapa específica</option>
                {stages
                  .filter((item) => item.curso_id === group.cursoId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} · {item.nome}
                    </option>
                  ))}
              </select>
            </div>
            <Field
              label="Capacidade"
              type="number"
              value={group.capacidade}
              set={(v) => setGroup({ ...group, capacidade: v })}
            />
            <div>
              <Label>Modalidade</Label>
              <select
                className={selectStyle}
                value={group.modalidade}
                onChange={(event) => setGroup({ ...group, modalidade: event.target.value })}
              >
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>
            <SectionTitle icon={Users} title="Equipe acadêmica" />
            <StaffSelect
              label="Professor"
              value={group.professorId}
              options={staff.filter((item) => item.papel === "professor")}
              set={(value) => setGroup({ ...group, professorId: value })}
              empty="Nenhum professor ativo cadastrado"
            />
            <StaffSelect
              label="Coordenador"
              value={group.coordenadorId}
              options={staff.filter((item) => item.papel === "coordenador")}
              set={(value) => setGroup({ ...group, coordenadorId: value })}
              empty="Nenhum coordenador ativo cadastrado"
            />
            <SectionTitle icon={CalendarDays} title="Agenda e local" />
            <Field
              label="Data de início"
              type="date"
              value={group.dataInicio}
              set={(v) => setGroup({ ...group, dataInicio: v })}
            />
            <Field
              label="Data prevista de término"
              type="date"
              value={group.dataFim}
              set={(v) => setGroup({ ...group, dataFim: v })}
            />
            <Field
              label="Horário de início"
              type="time"
              value={group.horarioInicio}
              set={(v) => setGroup({ ...group, horarioInicio: v })}
            />
            <Field
              label="Horário de término"
              type="time"
              value={group.horarioFim}
              set={(v) => setGroup({ ...group, horarioFim: v })}
            />
            <div className="md:col-span-2">
              <Label>Dias da semana</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ["segunda", "Seg"],
                  ["terca", "Ter"],
                  ["quarta", "Qua"],
                  ["quinta", "Qui"],
                  ["sexta", "Sex"],
                  ["sabado", "Sáb"],
                  ["domingo", "Dom"],
                ].map(([value, label]) => {
                  const selected = group.diasSemana.includes(value);
                  return (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() =>
                        setGroup({
                          ...group,
                          diasSemana: selected
                            ? group.diasSemana.filter((day) => day !== value)
                            : [...group.diasSemana, value],
                        })
                      }
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
            {(group.modalidade === "presencial" || group.modalidade === "hibrida") && (
              <Field
                label="Sala *"
                value={group.sala}
                set={(v) => setGroup({ ...group, sala: v })}
                required
              />
            )}
            {(group.modalidade === "online" || group.modalidade === "hibrida") && (
              <>
                <Field
                  label="Plataforma online"
                  value={group.plataforma}
                  set={(v) => setGroup({ ...group, plataforma: v })}
                />
                <Field
                  label="Link das aulas *"
                  type="url"
                  value={group.linkOnline}
                  set={(v) => setGroup({ ...group, linkOnline: v })}
                  required
                />
              </>
            )}
            <SectionTitle icon={MapPin} title="Regras de matrícula" />
            <Field
              label="Idade mínima"
              type="number"
              value={group.idadeMinima}
              set={(v) => setGroup({ ...group, idadeMinima: v })}
            />
            <Field
              label="Idade máxima"
              type="number"
              value={group.idadeMaxima}
              set={(v) => setGroup({ ...group, idadeMaxima: v })}
            />
            <Field
              label="Critério de entrada"
              value={group.criterio}
              set={(v) => setGroup({ ...group, criterio: v })}
            />
            <Field
              label="Frequência mínima (%)"
              type="number"
              value={group.frequencia}
              set={(v) => setGroup({ ...group, frequencia: v })}
            />
            <div className="rounded-xl border border-hairline bg-muted/20 p-4 md:col-span-2">
              <p className="text-sm font-medium">Ementa herdada do curso</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {courses.find((item) => item.id === group.cursoId)?.ementa ||
                  "Cadastre a ementa no curso para manter todas as turmas consistentes."}
              </p>
            </div>
            <Long
              label="Objetivos da turma"
              value={group.objetivos}
              set={(v) => setGroup({ ...group, objetivos: v })}
            />
          </form>
          <Footer
            form="class-form"
            busy={busy}
            close={() => setClassOpen(false)}
            label="Salvar turma"
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}

function categoryLabel(value: Category) {
  return {
    idioma: "Idioma",
    profissionalizante: "Profissionalizante",
    livre: "Livre",
    preparatorio: "Preparatório",
    outro: "Outro",
  }[value];
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
function Field({
  label,
  value,
  set,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => set(e.target.value)}
        required={required}
        type={type}
        min={type === "number" ? 0 : undefined}
      />
    </div>
  );
}
function Long({
  label,
  value,
  set,
  placeholder,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
function SectionTitle({ icon: Icon, title }: { icon: typeof Users; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-hairline pb-2 md:col-span-2">
      <Icon className="size-4 text-primary" />
      <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
    </div>
  );
}
function StaffSelect({
  label,
  value,
  options,
  set,
  empty,
}: {
  label: string;
  value: string;
  options: AcademicStaff[];
  set: (value: string) => void;
  empty: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select className={selectStyle} value={value} onChange={(event) => set(event.target.value)}>
        <option value="">A definir</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nome}
          </option>
        ))}
      </select>
      {!options.length && <p className="mt-1 text-xs text-amber-500">{empty}</p>}
    </div>
  );
}
function Check({
  label,
  checked,
  set,
}: {
  label: string;
  checked: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => set(Boolean(value))} />
      {label}
    </label>
  );
}
function Footer({
  form,
  busy,
  close,
  label,
}: {
  form: string;
  busy: boolean;
  close: () => void;
  label: string;
}) {
  return (
    <DialogFooter>
      <Button variant="outline" disabled={busy} onClick={close}>
        Cancelar
      </Button>
      <Button form={form} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Salvando…
          </>
        ) : (
          label
        )}
      </Button>
    </DialogFooter>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-hairline p-10 text-center">
      <BriefcaseBusiness className="mx-auto size-6 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
