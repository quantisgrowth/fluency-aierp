import { createFileRoute } from "@tanstack/react-router";
import { AcademicClassesPage } from "@/components/academic-classes-page";
import { ModuleGate } from "@/components/module-gate";

export const Route = createFileRoute("/turmas")({
  head: () => ({
    meta: [
      { title: "Turmas — Fluency AI" },
      { name: "description", content: "Turmas por proficiência e horários." },
    ],
  }),
  component: SchoolClassesPage,
});

function SchoolClassesPage() {
  return (
    <ModuleGate module="core">
      <AcademicClassesPage />
    </ModuleGate>
  );
}
