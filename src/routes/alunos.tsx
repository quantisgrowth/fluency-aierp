import { createFileRoute } from "@tanstack/react-router";
import { AcademicStudentsPage } from "@/components/academic-students-page";
import { ModuleGate } from "@/components/module-gate";

export const Route = createFileRoute("/alunos")({
  head: () => ({
    meta: [
      { title: "Alunos & Contratos 360º — Fluency AI" },
      {
        name: "description",
        content: "Dossiê 360º, contratos por produto, frequência, notas e financeiro do aluno.",
      },
    ],
  }),
  component: SchoolStudentsPage,
});

function SchoolStudentsPage() {
  return (
    <ModuleGate module="core">
      <AcademicStudentsPage />
    </ModuleGate>
  );
}
