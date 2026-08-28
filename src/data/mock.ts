export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

export const revenueSeries = [
  { mes: "Mar", realizado: 128400, previsto: 131000 },
  { mes: "Abr", realizado: 136900, previsto: 138500 },
  { mes: "Mai", realizado: 142300, previsto: 144000 },
  { mes: "Jun", realizado: 151800, previsto: 152600 },
  { mes: "Jul", realizado: 158200, previsto: 160400 },
  { mes: "Ago", realizado: 164750, previsto: 172900 },
];

export const billingStatus = [
  { label: "Liquidado", value: 128400, token: "paid" as const },
  { label: "A vencer", value: 31200, token: "due" as const },
  { label: "Vencido", value: 9840, token: "overdue" as const },
];

export const enrollmentSeries = [
  { mes: "Mar", matriculas: 42, cancelamentos: 11 },
  { mes: "Abr", matriculas: 51, cancelamentos: 9 },
  { mes: "Mai", matriculas: 47, cancelamentos: 14 },
  { mes: "Jun", matriculas: 63, cancelamentos: 10 },
  { mes: "Jul", matriculas: 58, cancelamentos: 12 },
  { mes: "Ago", matriculas: 71, cancelamentos: 8 },
];

export const delinquency = [
  { aluno: "Marina Rocha", turma: "B2 · Conversation", dias: 12, valor: 480 },
  { aluno: "Caio Bertolli", turma: "A2 · Regular Noite", dias: 27, valor: 390 },
  { aluno: "Helena Prado", turma: "C1 · Advanced", dias: 5, valor: 640 },
  { aluno: "Tiago Nunes", turma: "B1 · Business", dias: 41, valor: 520 },
];

export const churnRisk = [
  { aluno: "Bruno Salles", turma: "A2 · Regular", score: 87, motivo: "3 faltas seguidas" },
  { aluno: "Aline Ferraz", turma: "B1 · Teens", score: 74, motivo: "Queda de nota" },
  { aluno: "Rafael Lima", turma: "C1 · Advanced", score: 68, motivo: "Fatura vencida" },
];

export const upcomingClasses = [
  { turma: "B2 · Conversation", horario: "18:30", professor: "Julia Kern", sala: "Sala 4" },
  { turma: "A1 · Kids", horario: "19:00", professor: "Marcos Vidal", sala: "Sala 1" },
  { turma: "C1 · Advanced", horario: "20:00", professor: "Ana Beatriz", sala: "Online" },
];

export const students = [
  { nome: "Marina Rocha", nivel: "B2", turma: "Conversation Noite", inicio: "12/03/2026", status: "Ativo", horasContratadas: 4 },
  { nome: "Caio Bertolli", nivel: "A2", turma: "Regular Noite", inicio: "04/05/2026", status: "Inadimplente", horasContratadas: 4 },
  { nome: "Helena Prado", nivel: "C1", turma: "Advanced Manhã", inicio: "22/01/2026", status: "Ativo", horasContratadas: 2 },
  { nome: "Bruno Salles", nivel: "A2", turma: "Regular Tarde", inicio: "18/06/2026", status: "Em risco", horasContratadas: 4 },
  { nome: "Aline Ferraz", nivel: "B1", turma: "Teens", inicio: "09/07/2026", status: "Ativo", horasContratadas: 2 },
  { nome: "Rafael Lima", nivel: "C1", turma: "Advanced Noite", inicio: "27/02/2026", status: "Em risco", horasContratadas: 4 },
];

export const classes = [
  { nome: "Kids Playgroup", nivel: "A1", professor: "Marcos Vidal", alunos: 9, vagas: 12, horario: "Seg/Qua 19:00" },
  { nome: "Regular Noite", nivel: "A2", professor: "Julia Kern", alunos: 14, vagas: 14, horario: "Ter/Qui 18:30" },
  { nome: "Business English", nivel: "B1", professor: "Ana Beatriz", alunos: 8, vagas: 12, horario: "Seg/Qua 07:30" },
  { nome: "Conversation", nivel: "B2", professor: "Julia Kern", alunos: 11, vagas: 12, horario: "Ter/Qui 20:00" },
  { nome: "Advanced Manhã", nivel: "C1", professor: "Ana Beatriz", alunos: 6, vagas: 10, horario: "Sex 09:00" },
  { nome: "Proficiency Lab", nivel: "C2", professor: "Peter Hall", alunos: 4, vagas: 8, horario: "Sáb 10:00" },
];

export const crmStages = [
  {
    id: "lead",
    titulo: "Lead",
    cards: [
      { nome: "Fernanda Dias", origem: "Instagram", valor: 3480 },
      { nome: "Grupo Adamas", origem: "Indicação", valor: 12400 },
      { nome: "Otávio Prado", origem: "Google Ads", valor: 2900 },
    ],
  },
  {
    id: "contato",
    titulo: "Contato",
    cards: [
      { nome: "Larissa Muniz", origem: "WhatsApp", valor: 3120 },
      { nome: "Pedro Antunes", origem: "Site", valor: 2760 },
    ],
  },
  {
    id: "experimental",
    titulo: "Aula experimental",
    cards: [
      { nome: "Camila Reis", origem: "Indicação", valor: 3480 },
      { nome: "Diego Farias", origem: "Instagram", valor: 3960 },
    ],
  },
  {
    id: "fechada",
    titulo: "Matrícula fechada",
    cards: [
      { nome: "Nina Costa", origem: "Google Ads", valor: 4320 },
      { nome: "Igor Bandeira", origem: "Site", valor: 3480 },
    ],
  },
];

export const dunningSteps = [
  { dia: "D-3", canal: "WhatsApp", acao: "Lembrete amigável de vencimento", status: "Automático" },
  { dia: "D+1", canal: "E-mail", acao: "Aviso de fatura em aberto + link Pix", status: "Automático" },
  { dia: "D+7", canal: "WhatsApp", acao: "Oferta de renegociação em 2x", status: "Automático" },
  { dia: "D+15", canal: "Telefone", acao: "Contato do time financeiro", status: "Manual" },
  { dia: "D+30", canal: "E-mail", acao: "Suspensão de acesso ao portal", status: "Automático" },
];

export const classDiary = [
  { turma: "B2 · Conversation", data: "18/08", conteudo: "Unit 7 — Debate: future of work", presenca: "10/11" },
  { turma: "A2 · Regular Noite", data: "18/08", conteudo: "Unit 4 — Past continuous drills", presenca: "12/14" },
  { turma: "C1 · Advanced", data: "17/08", conteudo: "Essay workshop — cohesion", presenca: "5/6" },
];
