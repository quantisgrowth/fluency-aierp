import {
  GraduationCap,
  Wallet,
  Kanban,
  HeartPulse,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export type ModuleId = "core" | "financeiro" | "crm" | "success" | "captacao";

export type ModuleDef = {
  id: ModuleId;
  name: string;
  tagline: string;
  description: string;
  tier: string;
  price: number;
  icon: LucideIcon;
  locked: boolean;
  features: string[];
};

export const MODULES: ModuleDef[] = [
  {
    id: "core",
    name: "Core Pedagógico & Turmas",
    tagline: "Módulo base",
    description:
      "Alunos, professores e turmas organizadas por proficiência CEFR, com matrícula contínua ao longo do ano.",
    tier: "Essencial",
    price: 289,
    icon: GraduationCap,
    locked: true,
    features: ["Turmas A1–C2", "Matrícula contínua", "Cadastro de professores"],
  },
  {
    id: "financeiro",
    name: "Motor Financeiro & Cobrança",
    tagline: "Add-on de receita",
    description:
      "Previsibilidade de fluxo de caixa, emissão simulada de boleto e Pix e régua automática de inadimplência.",
    tier: "Receita",
    price: 189,
    icon: Wallet,
    locked: false,
    features: ["Fluxo de caixa projetado", "Boleto e Pix", "Régua de cobrança"],
  },
  {
    id: "crm",
    name: "CRM Comercial & Captação",
    tagline: "Add-on de vendas",
    description:
      "Funil Kanban de leads, da primeira conversa até a matrícula fechada, com taxa de conversão por etapa.",
    tier: "Vendas",
    price: 149,
    icon: Kanban,
    locked: false,
    features: ["Funil Kanban", "Aula experimental", "Conversão por etapa"],
  },
  {
    id: "success",
    name: "Success, Retenção & Portais",
    tagline: "Módulo enterprise",
    description:
      "Alertas preditivos de evasão, diário de classe digital para professores e portal do aluno.",
    tier: "Enterprise",
    price: 249,
    icon: HeartPulse,
    locked: false,
    features: ["Risco de churn", "Diário de classe", "Portal do aluno"],
  },
  {
    id: "captacao",
    name: "Fluency Forms & Nivelamento",
    tagline: "Add-on de conversão",
    description:
      "Criador de formulários estilo Tally, testes de nivelamento CEFR automatizados e captura automática de leads integrados ao CRM.",
    tier: "Conversão",
    price: 149,
    icon: ClipboardList,
    locked: false,
    features: ["Formulários estilo Tally", "Testes de nível CEFR", "Conversão automática de Leads"],
  },
];

export const moduleById = (id: ModuleId) =>
  MODULES.find((m) => m.id === id) as ModuleDef;
