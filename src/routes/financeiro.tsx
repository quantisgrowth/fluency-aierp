import { createFileRoute } from "@tanstack/react-router";
import { FinanceDashboard } from "@/components/finance-dashboard";
import { ModuleGate } from "@/components/module-gate";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Motor Financeiro, DRE & Precificação — Fluency AI" },
      {
        name: "description",
        content: "DRE Gerencial, Gestão de Custos, Políticas de Precificação e Previsão de Caixa.",
      },
    ],
  }),
  component: SchoolFinancePage,
});

function SchoolFinancePage() {
  return (
    <ModuleGate module="financeiro">
      <FinanceDashboard />
    </ModuleGate>
  );
}
