import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { currentSchoolId, readableError, type Course, type SchoolClass } from "@/lib/academic";

const selectStyle = "w-full rounded-md border border-white/20 bg-neutral-900 px-3 py-2 text-white";

export function AcademicClassesPage() {
  const [schoolId, setSchoolId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [coursePrice, setCoursePrice] = useState("");
  const [className, setClassName] = useState("");
  const [classCourseId, setClassCourseId] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [classCapacity, setClassCapacity] = useState("15");
  const [classTeacher, setClassTeacher] = useState("");

  async function refresh(id: string) {
    const [courseResult, classResult] = await Promise.all([
      supabase
        .from("cursos")
        .select("id,nome,codigo,nivel,valor_base,ativo")
        .eq("escola_id", id)
        .order("nome"),
      supabase
        .from("turmas")
        .select(
          "id,curso_id,nome,nivel,status,capacidade_maxima,professor_nome,dias_semana,horario_inicio",
        )
        .eq("escola_id", id)
        .order("nome"),
    ]);
    if (courseResult.error) throw courseResult.error;
    if (classResult.error) throw classResult.error;
    setCourses((courseResult.data ?? []) as Course[]);
    setClasses((classResult.data ?? []) as SchoolClass[]);
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

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId) return;
    setBusy(true);
    const { error: saveError } = await supabase.from("cursos").insert({
      escola_id: schoolId,
      nome: courseName.trim(),
      codigo: courseCode.trim().toUpperCase(),
      nivel: courseLevel.trim() || null,
      valor_base: Number(coursePrice || 0),
    });
    if (saveError) toast.error(`Não foi possível criar o curso: ${saveError.message}`);
    else {
      toast.success("Curso criado.");
      setCourseName("");
      setCourseCode("");
      setCourseLevel("");
      setCoursePrice("");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
    setBusy(false);
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !classCourseId) return;
    setBusy(true);
    const { error: saveError } = await supabase.from("turmas").insert({
      escola_id: schoolId,
      curso_id: classCourseId,
      nome: className.trim(),
      nivel: classLevel.trim() || null,
      capacidade_maxima: Number(classCapacity),
      professor_nome: classTeacher.trim() || null,
    });
    if (saveError) toast.error(`Não foi possível criar a turma: ${saveError.message}`);
    else {
      toast.success("Turma criada.");
      setClassName("");
      setClassLevel("");
      setClassTeacher("");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
    setBusy(false);
  }

  async function toggleClass(item: SchoolClass) {
    const next = item.status === "ativa" ? "encerrada" : "ativa";
    const { error: saveError } = await supabase
      .from("turmas")
      .update({ status: next })
      .eq("id", item.id)
      .eq("escola_id", schoolId);
    if (saveError) toast.error(saveError.message);
    else {
      toast.success(next === "ativa" ? "Turma reativada." : "Turma encerrada.");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
  }

  if (loading) return <p className="p-8">Carregando cursos e turmas…</p>;
  if (error)
    return (
      <p role="alert" className="p-8 text-red-400">
        {error}
      </p>
    );
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 text-white">
      <header className="space-y-3">
        <nav className="flex gap-4 text-sm text-primary">
          <Link to="/boas-vindas">Seu ambiente</Link>
          <Link to="/alunos">Alunos e matrículas</Link>
        </nav>
        <h1 className="text-3xl font-bold">Cursos e turmas</h1>
        <p className="text-neutral-400">
          Cadastros reais da sua escola. Comece pelo curso e depois crie a turma.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={createCourse}
          className="space-y-4 rounded-xl border border-white/10 bg-neutral-900 p-5"
        >
          <h2 className="text-xl font-semibold">Novo curso</h2>
          <div>
            <Label htmlFor="course-name">Nome</Label>
            <Input
              id="course-name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              minLength={3}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="course-code">Código</Label>
            <Input
              id="course-code"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              required
              maxLength={30}
              placeholder="ING-A1"
            />
          </div>
          <div>
            <Label htmlFor="course-level">Nível</Label>
            <Input
              id="course-level"
              value={courseLevel}
              onChange={(e) => setCourseLevel(e.target.value)}
              placeholder="A1"
            />
          </div>
          <div>
            <Label htmlFor="course-price">Valor base (R$)</Label>
            <Input
              id="course-price"
              type="number"
              min="0"
              step="0.01"
              value={coursePrice}
              onChange={(e) => setCoursePrice(e.target.value)}
            />
          </div>
          <Button disabled={busy}>Criar curso</Button>
        </form>
        <form
          onSubmit={createClass}
          className="space-y-4 rounded-xl border border-white/10 bg-neutral-900 p-5"
        >
          <h2 className="text-xl font-semibold">Nova turma</h2>
          <div>
            <Label htmlFor="class-course">Curso</Label>
            <select
              id="class-course"
              className={selectStyle}
              value={classCourseId}
              onChange={(e) => setClassCourseId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {courses
                .filter((c) => c.ativo)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <Label htmlFor="class-name">Nome da turma</Label>
            <Input
              id="class-name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
              minLength={3}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="class-level">Nível</Label>
            <Input
              id="class-level"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              placeholder="A1"
            />
          </div>
          <div>
            <Label htmlFor="class-capacity">Vagas</Label>
            <Input
              id="class-capacity"
              type="number"
              min="1"
              max="1000"
              value={classCapacity}
              onChange={(e) => setClassCapacity(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="class-teacher">Professor</Label>
            <Input
              id="class-teacher"
              value={classTeacher}
              onChange={(e) => setClassTeacher(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <Button disabled={busy || courses.length === 0}>Criar turma</Button>
        </form>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Cursos ({courses.length})</h2>
        {courses.length === 0 ? (
          <p className="text-neutral-400">Nenhum curso cadastrado.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 p-4">
                <strong>{c.nome}</strong>
                <p className="text-sm text-neutral-400">
                  {c.codigo} · {c.nivel || "Sem nível"} · R$ {Number(c.valor_base).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Turmas ({classes.length})</h2>
        {classes.length === 0 ? (
          <p className="text-neutral-400">Nenhuma turma cadastrada.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {classes.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 p-4">
                <strong>{item.nome}</strong>
                <p className="text-sm text-neutral-400">
                  {courses.find((c) => c.id === item.curso_id)?.nome || "Curso"} ·{" "}
                  {item.nivel || "Sem nível"} · {item.capacidade_maxima} vagas · {item.status}
                </p>
                <p className="text-sm text-neutral-400">
                  Professor: {item.professor_nome || "Não definido"}
                </p>
                <button
                  className="mt-2 text-sm text-primary underline"
                  onClick={() => void toggleClass(item)}
                >
                  {item.status === "ativa" ? "Encerrar turma" : "Reativar turma"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
