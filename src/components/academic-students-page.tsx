import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import {
  currentSchoolId,
  readableError,
  type Enrollment,
  type SchoolClass,
  type Student,
} from "@/lib/academic";

const selectStyle = "w-full rounded-md border border-white/20 bg-neutral-900 px-3 py-2 text-white";

export function AcademicStudentsPage() {
  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [level, setLevel] = useState("");
  const [guardian, setGuardian] = useState("");

  async function refresh(id: string) {
    const [studentsResult, classesResult, enrollmentsResult] = await Promise.all([
      supabase
        .from("alunos")
        .select("id,nome,email,telefone,nivel_atual,status,responsavel_nome,turma_atual_id")
        .eq("escola_id", id)
        .order("nome"),
      supabase
        .from("turmas")
        .select(
          "id,curso_id,nome,nivel,status,capacidade_maxima,professor_nome,dias_semana,horario_inicio",
        )
        .eq("escola_id", id)
        .order("nome"),
      supabase
        .from("matriculas")
        .select("id,aluno_id,turma_id,status")
        .eq("escola_id", id)
        .eq("status", "ativa"),
    ]);
    if (studentsResult.error) throw studentsResult.error;
    if (classesResult.error) throw classesResult.error;
    if (enrollmentsResult.error) throw enrollmentsResult.error;
    setStudents((studentsResult.data ?? []) as Student[]);
    setClasses((classesResult.data ?? []) as SchoolClass[]);
    setEnrollments((enrollmentsResult.data ?? []) as Enrollment[]);
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

  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId) return;
    setBusy(true);
    const { error: saveError } = await supabase.from("alunos").insert({
      escola_id: schoolId,
      nome: name.trim(),
      email: email.trim() || null,
      telefone: phone.trim() || null,
      nivel_atual: level.trim() || "A1",
      responsavel_nome: guardian.trim() || null,
    });
    if (saveError) toast.error(`Não foi possível cadastrar o aluno: ${saveError.message}`);
    else {
      toast.success("Aluno cadastrado.");
      setName("");
      setEmail("");
      setPhone("");
      setLevel("");
      setGuardian("");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
    setBusy(false);
  }

  async function enroll(student: Student) {
    const classId = selectedClasses[student.id];
    if (!classId) return;
    if (enrollments.some((item) => item.aluno_id === student.id && item.turma_id === classId)) {
      toast.error("O aluno já está matriculado nesta turma.");
      return;
    }
    const selected = classes.find((item) => item.id === classId);
    if (!selected || selected.status !== "ativa") return;
    const classCount = enrollments.filter((item) => item.turma_id === classId).length;
    if (classCount >= selected.capacidade_maxima) {
      toast.error("A turma não tem vagas disponíveis.");
      return;
    }
    setBusy(true);
    const { error: saveError } = await supabase.from("matriculas").insert({
      escola_id: schoolId,
      aluno_id: student.id,
      turma_id: classId,
    });
    if (saveError) toast.error(`Não foi possível matricular: ${saveError.message}`);
    else {
      const { error: updateError } = await supabase
        .from("alunos")
        .update({ turma_atual_id: classId, turma_nome: selected.nome })
        .eq("id", student.id)
        .eq("escola_id", schoolId);
      if (updateError)
        toast.error(`Matrícula salva; turma atual não atualizada: ${updateError.message}`);
      else toast.success("Matrícula realizada.");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
    setBusy(false);
  }

  async function toggleStudent(student: Student) {
    const next = student.status === "ativo" ? "inativo" : "ativo";
    const { error: saveError } = await supabase
      .from("alunos")
      .update({ status: next })
      .eq("id", student.id)
      .eq("escola_id", schoolId);
    if (saveError) toast.error(saveError.message);
    else {
      toast.success(next === "ativo" ? "Aluno reativado." : "Aluno inativado.");
      try {
        await refresh(schoolId);
      } catch (cause) {
        setError(readableError(cause));
      }
    }
  }

  if (loading) return <p className="p-8">Carregando alunos…</p>;
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
          <Link to="/turmas">Cursos e turmas</Link>
        </nav>
        <h1 className="text-3xl font-bold">Alunos e matrículas</h1>
        <p className="text-neutral-400">
          Cadastros reais da sua escola. Para matricular, crie uma turma em Cursos e turmas.
        </p>
      </header>
      <form
        onSubmit={createStudent}
        className="grid gap-4 rounded-xl border border-white/10 bg-neutral-900 p-5 md:grid-cols-2"
      >
        <h2 className="text-xl font-semibold md:col-span-2">Novo aluno</h2>
        <div>
          <Label htmlFor="student-name">Nome completo</Label>
          <Input
            id="student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={120}
          />
        </div>
        <div>
          <Label htmlFor="student-email">E-mail</Label>
          <Input
            id="student-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="student-phone">Telefone</Label>
          <Input id="student-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="student-level">Nível</Label>
          <Input
            id="student-level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="A1"
          />
        </div>
        <div>
          <Label htmlFor="guardian-name">Responsável</Label>
          <Input
            id="guardian-name"
            value={guardian}
            onChange={(e) => setGuardian(e.target.value)}
            placeholder="Se aplicável"
          />
        </div>
        <div className="flex items-end">
          <Button disabled={busy}>Cadastrar aluno</Button>
        </div>
      </form>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Alunos ({students.length})</h2>
        {students.length === 0 ? (
          <p className="text-neutral-400">Nenhum aluno cadastrado.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {students.map((student) => {
              const active = enrollments.filter((item) => item.aluno_id === student.id);
              return (
                <article
                  key={student.id}
                  className="space-y-3 rounded-xl border border-white/10 p-4"
                >
                  <div>
                    <strong>{student.nome}</strong>
                    <p className="text-sm text-neutral-400">
                      {student.email || "Sem e-mail"} · {student.nivel_atual || "Sem nível"} ·{" "}
                      {student.status}
                    </p>
                    {student.responsavel_nome && (
                      <p className="text-sm text-neutral-400">
                        Responsável: {student.responsavel_nome}
                      </p>
                    )}
                  </div>
                  <p className="text-sm">
                    Turmas:{" "}
                    {active
                      .map((item) => classes.find((c) => c.id === item.turma_id)?.nome)
                      .filter(Boolean)
                      .join(", ") || "Nenhuma"}
                  </p>
                  <div className="flex gap-2">
                    <select
                      aria-label={`Turma para ${student.nome}`}
                      className={selectStyle}
                      value={selectedClasses[student.id] || ""}
                      onChange={(e) =>
                        setSelectedClasses({ ...selectedClasses, [student.id]: e.target.value })
                      }
                    >
                      <option value="">Selecione uma turma</option>
                      {classes
                        .filter((c) => c.status === "ativa")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                    </select>
                    <Button
                      type="button"
                      disabled={busy || !selectedClasses[student.id]}
                      onClick={() => void enroll(student)}
                    >
                      Matricular
                    </Button>
                  </div>
                  <button
                    className="text-sm text-primary underline"
                    onClick={() => void toggleStudent(student)}
                  >
                    {student.status === "ativo" ? "Inativar aluno" : "Reativar aluno"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
