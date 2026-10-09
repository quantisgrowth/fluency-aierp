import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Upload,
  Users,
  X,
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
  type ClassMeeting,
  type Classroom,
  type Course,
  type CourseStage,
  type SchoolClass,
} from "@/lib/academic";

const selectStyle =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground";
type Category = Course["categoria"];

function emptyCourseForm() {
  return {
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
    cargaHoraria: "60",
    duracaoAula: "90",
  };
}

type MeetingDraft = {
  id?: string;
  dia: string;
  inicio: string;
  fim: string;
};

function emptyMeeting(): MeetingDraft {
  return { dia: "segunda", inicio: "", fim: "" };
}

function minutesBetween(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function estimatedEndDate(start: string, totalHours: number, encounters: MeetingDraft[]) {
  if (!start || totalHours <= 0) return "";
  const weeklyMinutes = encounters.reduce(
    (total, meeting) =>
      total +
      (meeting.inicio && meeting.fim
        ? Math.max(0, minutesBetween(meeting.inicio, meeting.fim))
        : 0),
    0,
  );
  if (!weeklyMinutes) return "";
  const weeks = Math.ceil((totalHours * 60) / weeklyMinutes);
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

function formatDatePtBr(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function emptyClassForm() {
  return {
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
    salaId: "",
    semSala: false,
    plataforma: "",
    linkOnline: "",
    dataInicio: "",
    dataFim: "",
    encontros: [emptyMeeting()] as MeetingDraft[],
  };
}

export function AcademicClassesPage() {
  const [schoolId, setSchoolId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [stages, setStages] = useState<CourseStage[]>([]);
  const [staff, setStaff] = useState<AcademicStaff[]>([]);
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [meetings, setMeetings] = useState<ClassMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [classOpen, setClassOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [course, setCourse] = useState(emptyCourseForm);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [group, setGroup] = useState(emptyClassForm);

  async function refresh(id: string) {
    const [courseResult, classResult, stageResult, userResult, roomResult, meetingResult] =
      await Promise.all([
        supabase
          .from("cursos")
          .select(
            "id,nome,codigo,nivel,valor_base,ativo,categoria,exige_nivelamento,exige_avaliacao_pratica,exige_estagio,exige_projeto_final,emite_certificado,frequencia_minima,criterio_entrada,ementa,carga_horaria_total,duracao_aula_minutos",
          )
          .eq("escola_id", id)
          .order("nome"),
        supabase
          .from("turmas")
          .select(
            "id,curso_id,nome,nivel,status,capacidade_maxima,professor_id,professor_nome,dias_semana,horario_inicio,horario_fim,data_inicio,data_fim,sala,sala_id,plataforma_online,link_online,modalidade,coordenador_id,coordenador_nome,curso_etapa_id,idade_minima,idade_maxima,faixa_etaria,criterio_entrada,ementa,objetivos,frequencia_minima",
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
          .from("usuarios")
          .select("id,nome,role,cargo,status")
          .eq("escola_id", id)
          .eq("status", "ativo")
          .in("role", ["professor", "pedagogico"]),
        supabase
          .from("salas")
          .select("id,nome,capacidade,bloco_ou_andar,status")
          .eq("escola_id", id)
          .neq("status", "inativa")
          .order("nome"),
        supabase
          .from("turma_encontros")
          .select("id,turma_id,dia_semana,horario_inicio,horario_fim,sala_id")
          .eq("escola_id", id),
      ]);
    if (courseResult.error) throw courseResult.error;
    if (classResult.error) throw classResult.error;
    if (stageResult.error) throw stageResult.error;
    if (userResult.error) throw userResult.error;
    if (roomResult.error) throw roomResult.error;
    if (meetingResult.error) throw meetingResult.error;
    setCourses((courseResult.data ?? []) as Course[]);
    setClasses((classResult.data ?? []) as SchoolClass[]);
    setStages((stageResult.data ?? []) as CourseStage[]);
    setStaff(
      (userResult.data ?? []).map((item) => ({
        id: item.id,
        nome: item.nome,
        papel: item.role === "professor" ? "professor" : "coordenador",
      })),
    );
    setRooms((roomResult.data ?? []) as Classroom[]);
    setMeetings((meetingResult.data ?? []) as ClassMeeting[]);
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

  function openNewCourse() {
    setEditingCourseId(null);
    setCourse(emptyCourseForm());
    setSyllabusFile(null);
    setCourseOpen(true);
  }

  function openEditCourse(item: Course) {
    setEditingCourseId(item.id);
    setCourse({
      nome: item.nome,
      codigo: item.codigo,
      nivel: item.nivel || "",
      preco: String(item.valor_base || 0),
      categoria: item.categoria,
      frequencia: String(item.frequencia_minima),
      nivelamento: item.exige_nivelamento,
      pratica: item.exige_avaliacao_pratica,
      estagio: item.exige_estagio,
      projeto: item.exige_projeto_final,
      certificado: item.emite_certificado,
      criterio: item.criterio_entrada || "",
      ementa: item.ementa || "",
      cargaHoraria: String(item.carga_horaria_total || 60),
      duracaoAula: String(item.duracao_aula_minutos || 90),
      etapas: stages
        .filter((stage) => stage.curso_id === item.id)
        .sort((a, b) => a.ordem - b.ordem)
        .map((stage) => `${stage.codigo} | ${stage.nome}`)
        .join("\n"),
    });
    setSyllabusFile(null);
    setCourseOpen(true);
  }

  async function saveCourse(event: FormEvent) {
    event.preventDefault();
    const stageLines = course.etapas
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [rawCode, ...nameParts] = line.split("|");
        const hasName = nameParts.length > 0;
        return {
          codigo: (hasName ? rawCode : String(index + 1)).trim().toUpperCase(),
          nome: (hasName ? nameParts.join("|") : rawCode).trim(),
          ordem: index + 1,
        };
      });
    if (new Set(stageLines.map((stage) => stage.codigo)).size !== stageLines.length) {
      toast.error("Cada etapa precisa ter um código diferente.");
      return;
    }
    if (syllabusFile && syllabusFile.size > 10 * 1024 * 1024) {
      toast.error("O documento da ementa deve ter no máximo 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const coursePayload = {
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
        carga_horaria_total: Number(course.cargaHoraria || 0),
        duracao_aula_minutos: Number(course.duracaoAula || 0),
      };
      const courseResult = editingCourseId
        ? await supabase
            .from("cursos")
            .update(coursePayload)
            .eq("id", editingCourseId)
            .eq("escola_id", schoolId)
            .select("id")
            .single()
        : await supabase.from("cursos").insert(coursePayload).select("id").single();
      const { data: savedCourse, error: saveError } = courseResult;
      if (saveError) throw saveError;

      const parsedStages = stageLines.map((stage) => ({
        ...stage,
        escola_id: schoolId,
        curso_id: savedCourse.id,
        ativo: true,
      }));
      if (parsedStages.length) {
        const { error: stageError } = await supabase.from("curso_etapas").upsert(parsedStages, {
          onConflict: "escola_id,curso_id,codigo",
        });
        if (stageError) throw stageError;
      }
      if (editingCourseId) {
        const submittedCodes = new Set(parsedStages.map((stage) => stage.codigo));
        const removedStageIds = stages
          .filter(
            (stage) =>
              stage.curso_id === editingCourseId && !submittedCodes.has(stage.codigo.toUpperCase()),
          )
          .map((stage) => stage.id);
        if (removedStageIds.length) {
          const { error: archiveError } = await supabase
            .from("curso_etapas")
            .update({ ativo: false })
            .eq("escola_id", schoolId)
            .in("id", removedStageIds);
          if (archiveError) throw archiveError;
        }
      }

      if (syllabusFile) {
        const safeName = syllabusFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storagePath = `${schoolId}/${savedCourse.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("curso-documentos")
          .upload(storagePath, syllabusFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: latestDocument, error: versionError } = await supabase
          .from("curso_documentos")
          .select("versao")
          .eq("escola_id", schoolId)
          .eq("curso_id", savedCourse.id)
          .eq("tipo", "ementa")
          .order("versao", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (versionError) throw versionError;
        const { error: documentError } = await supabase.from("curso_documentos").insert({
          escola_id: schoolId,
          curso_id: savedCourse.id,
          tipo: "ementa",
          titulo: syllabusFile.name,
          storage_path: storagePath,
          versao: (latestDocument?.versao || 0) + 1,
        });
        if (documentError) {
          await supabase.storage.from("curso-documentos").remove([storagePath]);
          throw documentError;
        }
      }

      toast.success(editingCourseId ? "Curso atualizado." : "Curso criado.");
      setCourse(emptyCourseForm());
      setSyllabusFile(null);
      setEditingCourseId(null);
      setCourseOpen(false);
      await refresh(schoolId);
    } catch (cause) {
      toast.error(readableError(cause));
    } finally {
      setBusy(false);
    }
  }
  function openNewClass() {
    setEditingClassId(null);
    setGroup(emptyClassForm());
    setClassOpen(true);
  }

  function openEditClass(item: SchoolClass) {
    setEditingClassId(item.id);
    setGroup({
      nome: item.nome,
      cursoId: item.curso_id || "",
      etapaId: item.curso_etapa_id || "",
      capacidade: String(item.capacidade_maxima || 15),
      professorId: item.professor_id || "",
      coordenadorId: item.coordenador_id || "",
      modalidade: item.modalidade || "presencial",
      idadeMinima: item.idade_minima === null ? "" : String(item.idade_minima),
      idadeMaxima: item.idade_maxima === null ? "" : String(item.idade_maxima),
      criterio: item.criterio_entrada || "",
      objetivos: item.objetivos || "",
      frequencia: item.frequencia_minima === null ? "" : String(item.frequencia_minima),
      sala: item.sala || "",
      salaId: item.sala_id || "",
      semSala: !item.sala_id && !item.sala,
      plataforma: item.plataforma_online || "",
      linkOnline: item.link_online || "",
      dataInicio: item.data_inicio || "",
      dataFim: item.data_fim || "",
      encontros: (() => {
        const savedMeetings = meetings.filter((meeting) => meeting.turma_id === item.id);
        if (savedMeetings.length) {
          return savedMeetings.map((meeting) => ({
            id: meeting.id,
            dia: meeting.dia_semana,
            inicio: meeting.horario_inicio.slice(0, 5),
            fim: meeting.horario_fim.slice(0, 5),
          }));
        }
        const legacyMeetings = (item.dias_semana || []).map((day) => ({
          dia: day,
          inicio: item.horario_inicio?.slice(0, 5) || "",
          fim: item.horario_fim?.slice(0, 5) || "",
        }));
        return legacyMeetings.length ? legacyMeetings : [emptyMeeting()];
      })(),
    });
    setClassOpen(true);
  }

  async function saveClass(event: FormEvent) {
    event.preventDefault();
    const selectedCourse = courses.find((item) => item.id === group.cursoId);
    const selectedStage = stages.find((item) => item.id === group.etapaId);
    const selectedProfessor = staff.find((item) => item.id === group.professorId);
    const selectedCoordinator = staff.find((item) => item.id === group.coordenadorId);
    const minimumAge = group.idadeMinima ? Number(group.idadeMinima) : null;
    const maximumAge = group.idadeMaxima ? Number(group.idadeMaxima) : null;
    const validMeetings = group.encontros.filter(
      (meeting) => meeting.dia && meeting.inicio && meeting.fim,
    );
    const selectedRoom = rooms.find((room) => room.id === group.salaId);
    if (minimumAge !== null && maximumAge !== null && minimumAge > maximumAge) {
      toast.error("A idade mínima não pode ser maior que a idade máxima.");
      return;
    }
    if (
      (group.modalidade === "presencial" || group.modalidade === "hibrida") &&
      !group.salaId &&
      !group.semSala
    ) {
      toast.error("Selecione uma sala ou marque “Sem sala definida”.");
      return;
    }
    if ((group.modalidade === "online" || group.modalidade === "hibrida") && !group.linkOnline) {
      toast.error("Informe o link das aulas online.");
      return;
    }
    if (!validMeetings.length) {
      toast.error("Cadastre ao menos um dia e horário de aula.");
      return;
    }
    if (validMeetings.some((meeting) => meeting.inicio >= meeting.fim)) {
      toast.error("O horário final de cada encontro deve ser posterior ao inicial.");
      return;
    }
    if (group.objetivos.length > 500) {
      toast.error("Os objetivos da turma devem ter no máximo 500 caracteres.");
      return;
    }
    const conflictingMeeting = meetings.find((savedMeeting) => {
      const relatedClass = classes.find((item) => item.id === savedMeeting.turma_id);
      if (!relatedClass || relatedClass.id === editingClassId) return false;
      const sameResource =
        (group.professorId && relatedClass.professor_id === group.professorId) ||
        (group.salaId && savedMeeting.sala_id === group.salaId);
      const overlappingDraft = validMeetings.some(
        (draft) =>
          draft.dia === savedMeeting.dia_semana &&
          draft.inicio < savedMeeting.horario_fim &&
          draft.fim > savedMeeting.horario_inicio,
      );
      const dateOverlap =
        (!group.dataFim ||
          !relatedClass.data_inicio ||
          group.dataFim >= relatedClass.data_inicio) &&
        (!relatedClass.data_fim || !group.dataInicio || relatedClass.data_fim >= group.dataInicio);
      return sameResource && overlappingDraft && dateOverlap;
    });
    if (conflictingMeeting) {
      const conflictClass = classes.find((item) => item.id === conflictingMeeting.turma_id);
      toast.error(`Conflito de agenda com a turma “${conflictClass?.nome || "existente"}”.`);
      return;
    }
    setBusy(true);
    try {
      const payload = {
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
        sala_id: group.semSala ? null : group.salaId || null,
        sala: group.semSala ? null : selectedRoom?.nome || null,
        plataforma_online: group.plataforma.trim() || null,
        link_online: group.linkOnline.trim() || null,
        data_inicio: group.dataInicio || null,
        data_fim:
          estimatedEndDate(
            group.dataInicio,
            Number(selectedCourse?.carga_horaria_total || 0),
            validMeetings,
          ) || null,
        horario_inicio: validMeetings[0]?.inicio || null,
        horario_fim: validMeetings[0]?.fim || null,
        dias_semana: validMeetings.map((meeting) => meeting.dia),
      };
      const result = editingClassId
        ? await supabase
            .from("turmas")
            .update(payload)
            .eq("id", editingClassId)
            .eq("escola_id", schoolId)
            .select("id")
            .single()
        : await supabase.from("turmas").insert(payload).select("id").single();
      const { data: savedClass, error: saveError } = result;
      if (saveError) throw saveError;
      const classId = savedClass?.id;
      if (!classId) throw new Error("O banco não confirmou a turma salva.");
      if (editingClassId) {
        const { error: deleteMeetingsError } = await supabase
          .from("turma_encontros")
          .delete()
          .eq("escola_id", schoolId)
          .eq("turma_id", classId);
        if (deleteMeetingsError) throw deleteMeetingsError;
      }
      const { error: meetingError } = await supabase.from("turma_encontros").insert(
        validMeetings.map((meeting) => ({
          escola_id: schoolId,
          turma_id: classId,
          dia_semana: meeting.dia,
          horario_inicio: meeting.inicio,
          horario_fim: meeting.fim,
          sala_id: group.semSala ? null : group.salaId || null,
        })),
      );
      if (meetingError) throw meetingError;
      toast.success(editingClassId ? "Turma atualizada." : "Turma criada.");
      setGroup(emptyClassForm());
      setEditingClassId(null);
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
          <Button variant="outline" onClick={openNewCourse}>
            <Plus className="mr-2 size-4" /> Novo curso
          </Button>
          <Button onClick={openNewClass} disabled={!courses.length}>
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
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => openEditCourse(item)}
              >
                <Pencil className="mr-2 size-4" /> Editar curso
              </Button>
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
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditClass(item)}>
                  <Pencil className="mr-2 size-4" /> Editar turma
                </Button>
                <Button variant="link" size="sm" onClick={() => void toggleClass(item)}>
                  {item.status === "ativa" ? "Concluir turma" : "Reativar turma"}
                </Button>
              </div>
            </article>
          ))}
          {!classes.length && <Empty text="Nenhuma turma cadastrada." />}
        </div>
      </section>
      <Dialog
        open={courseOpen}
        onOpenChange={(open) => {
          if (busy) return;
          setCourseOpen(open);
          if (!open) {
            setEditingCourseId(null);
            setCourse(emptyCourseForm());
            setSyllabusFile(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-hairline bg-background sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingCourseId ? "Editar curso" : "Novo curso"}</DialogTitle>
            <DialogDescription>
              {editingCourseId
                ? "Atualize a estrutura pedagógica e publique novas versões da ementa."
                : "Defina o modelo adequado à formação oferecida."}
            </DialogDescription>
          </DialogHeader>
          <form id="course-form" onSubmit={saveCourse} className="grid gap-4 py-2 md:grid-cols-2">
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
            <Field
              label="Carga horária total (horas)"
              type="number"
              value={course.cargaHoraria}
              set={(v) => setCourse({ ...course, cargaHoraria: v })}
              required
            />
            <Field
              label="Duração padrão da aula (minutos)"
              type="number"
              value={course.duracaoAula}
              set={(v) => setCourse({ ...course, duracaoAula: v })}
              required
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
                Cadastre aqui as etapas que aparecerão no modal de Turmas. Informe uma por linha e
                use “código | nome” para organizar o percurso.
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
            close={() => {
              setCourseOpen(false);
              setEditingCourseId(null);
              setCourse(emptyCourseForm());
              setSyllabusFile(null);
            }}
            label={editingCourseId ? "Salvar alterações" : "Salvar curso"}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={classOpen}
        onOpenChange={(open) => {
          if (busy) return;
          setClassOpen(open);
          if (!open) {
            setEditingClassId(null);
            setGroup(emptyClassForm());
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-hairline bg-background sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingClassId ? "Editar turma" : "Nova turma"}</DialogTitle>
            <DialogDescription>
              {editingClassId
                ? "Atualize equipe, regras pedagógicas e planejamento."
                : "Vincule equipe, regras pedagógicas e planejamento."}
            </DialogDescription>
          </DialogHeader>
          <form id="class-form" onSubmit={saveClass} className="grid gap-5 py-2 md:grid-cols-2">
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
              {group.cursoId && !stages.some((item) => item.curso_id === group.cursoId) && (
                <p className="mt-1 text-xs text-amber-500">
                  Este curso ainda não possui etapas. Edite o curso no catálogo para cadastrá-las.
                </p>
              )}
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
            <div>
              <Label>Previsão de término</Label>
              <Input
                value={
                  formatDatePtBr(
                    estimatedEndDate(
                      group.dataInicio,
                      Number(
                        courses.find((item) => item.id === group.cursoId)?.carga_horaria_total || 0,
                      ),
                      group.encontros,
                    ),
                  ) || "Aguardando curso, início e horários"
                }
                readOnly
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Calculada pela carga horária do curso e pelos encontros semanais.
              </p>
            </div>
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Encontros semanais</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setGroup({ ...group, encontros: [...group.encontros, emptyMeeting()] })
                  }
                >
                  <Plus className="mr-2 size-4" /> Incluir horário
                </Button>
              </div>
              {group.encontros.map((meeting, index) => (
                <div
                  key={meeting.id || index}
                  className="grid gap-2 rounded-xl border border-hairline p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <select
                    aria-label={`Dia do encontro ${index + 1}`}
                    className={selectStyle}
                    value={meeting.dia}
                    onChange={(event) => {
                      const encontros = [...group.encontros];
                      encontros[index] = { ...meeting, dia: event.target.value };
                      setGroup({ ...group, encontros });
                    }}
                  >
                    <option value="segunda">Segunda-feira</option>
                    <option value="terca">Terça-feira</option>
                    <option value="quarta">Quarta-feira</option>
                    <option value="quinta">Quinta-feira</option>
                    <option value="sexta">Sexta-feira</option>
                    <option value="sabado">Sábado</option>
                    <option value="domingo">Domingo</option>
                  </select>
                  <Input
                    aria-label={`Início do encontro ${index + 1}`}
                    type="time"
                    value={meeting.inicio}
                    onChange={(event) => {
                      const encontros = [...group.encontros];
                      encontros[index] = { ...meeting, inicio: event.target.value };
                      setGroup({ ...group, encontros });
                    }}
                  />
                  <Input
                    aria-label={`Fim do encontro ${index + 1}`}
                    type="time"
                    value={meeting.fim}
                    onChange={(event) => {
                      const encontros = [...group.encontros];
                      encontros[index] = { ...meeting, fim: event.target.value };
                      setGroup({ ...group, encontros });
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remover encontro ${index + 1}`}
                    disabled={group.encontros.length === 1}
                    onClick={() =>
                      setGroup({
                        ...group,
                        encontros: group.encontros.filter(
                          (_, meetingIndex) => meetingIndex !== index,
                        ),
                      })
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            {(group.modalidade === "presencial" || group.modalidade === "hibrida") && (
              <div className="space-y-2 md:col-span-2">
                <Label>Sala</Label>
                <div className="flex gap-3">
                  <select
                    className={selectStyle}
                    value={group.salaId}
                    disabled={group.semSala}
                    onChange={(event) => setGroup({ ...group, salaId: event.target.value })}
                  >
                    <option value="">Selecione uma sala cadastrada</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.nome}
                        {room.capacidade ? ` · ${room.capacidade} lugares` : ""}
                      </option>
                    ))}
                  </select>
                  <label className="flex shrink-0 items-center gap-2 rounded-lg border border-hairline px-3 text-sm">
                    <Checkbox
                      checked={group.semSala}
                      onCheckedChange={(value) =>
                        setGroup({ ...group, semSala: Boolean(value), salaId: "" })
                      }
                    />
                    Sem sala definida
                  </label>
                </div>
                {!rooms.length && (
                  <p className="text-xs text-amber-500">
                    Nenhuma sala cadastrada em Inventário & Salas.
                  </p>
                )}
              </div>
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
            <div>
              <Label>Critério de entrada</Label>
              <Textarea
                value={group.criterio}
                onChange={(event) => setGroup({ ...group, criterio: event.target.value })}
                placeholder="Herdado do curso; ajuste apenas se esta turma possuir uma exceção."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                O padrão é cadastrado no curso e carregado automaticamente aqui.
              </p>
            </div>
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
            <div className="md:col-span-2">
              <div className="flex justify-between gap-3">
                <Label>Objetivos da turma</Label>
                <span className="text-xs text-muted-foreground">{group.objetivos.length}/500</span>
              </div>
              <Textarea
                className="min-h-28 resize-y"
                maxLength={500}
                value={group.objetivos}
                onChange={(event) => setGroup({ ...group, objetivos: event.target.value })}
                placeholder="Descreva os resultados específicos esperados para esta turma."
              />
            </div>
          </form>
          <Footer
            form="class-form"
            busy={busy}
            close={() => {
              setClassOpen(false);
              setEditingClassId(null);
              setGroup(emptyClassForm());
            }}
            label={editingClassId ? "Salvar alterações" : "Salvar turma"}
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
