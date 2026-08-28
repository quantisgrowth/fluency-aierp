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

export type ClassColorTheme = {
  id: string;
  label: string;
  badgeBg: string;
  border: string;
  text: string;
  bgHover: string;
  dot: string;
  lightBg: string;
};

export const CLASS_COLOR_THEMES: ClassColorTheme[] = [
  { id: "emerald", label: "Verde Esmeralda", badgeBg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", bgHover: "hover:border-emerald-500/50", dot: "bg-emerald-500", lightBg: "bg-emerald-500/10" },
  { id: "blue", label: "Azul Oceano", badgeBg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400", bgHover: "hover:border-blue-500/50", dot: "bg-blue-500", lightBg: "bg-blue-500/10" },
  { id: "purple", label: "Roxo Real", badgeBg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400", bgHover: "hover:border-purple-500/50", dot: "bg-purple-500", lightBg: "bg-purple-500/10" },
  { id: "amber", label: "Âmbar Dourado", badgeBg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400", bgHover: "hover:border-amber-500/50", dot: "bg-amber-500", lightBg: "bg-amber-500/10" },
  { id: "rose", label: "Rosa Coral", badgeBg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-400", bgHover: "hover:border-rose-500/50", dot: "bg-rose-500", lightBg: "bg-rose-500/10" },
  { id: "cyan", label: "Ciano Tech", badgeBg: "bg-cyan-500/15", border: "border-cyan-500/30", text: "text-cyan-400", bgHover: "hover:border-cyan-500/50", dot: "bg-cyan-500", lightBg: "bg-cyan-500/10" },
  { id: "orange", label: "Laranja Solar", badgeBg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-400", bgHover: "hover:border-orange-500/50", dot: "bg-orange-500", lightBg: "bg-orange-500/10" },
  { id: "indigo", label: "Índigo Neon", badgeBg: "bg-indigo-500/15", border: "border-indigo-500/30", text: "text-indigo-400", bgHover: "hover:border-indigo-500/50", dot: "bg-indigo-500", lightBg: "bg-indigo-500/10" },
  { id: "pink", label: "Fúcsia Pink", badgeBg: "bg-pink-500/15", border: "border-pink-500/30", text: "text-pink-400", bgHover: "hover:border-pink-500/50", dot: "bg-pink-500", lightBg: "bg-pink-500/10" },
  { id: "teal", label: "Menta Teal", badgeBg: "bg-teal-500/15", border: "border-teal-500/30", text: "text-teal-400", bgHover: "hover:border-teal-500/50", dot: "bg-teal-500", lightBg: "bg-teal-500/10" },
  { id: "lime", label: "Lima Elétrico", badgeBg: "bg-lime-500/15", border: "border-lime-500/30", text: "text-lime-400", bgHover: "hover:border-lime-500/50", dot: "bg-lime-500", lightBg: "bg-lime-500/10" },
  { id: "violet", label: "Violeta Intenso", badgeBg: "bg-violet-500/15", border: "border-violet-500/30", text: "text-violet-400", bgHover: "hover:border-violet-500/50", dot: "bg-violet-500", lightBg: "bg-violet-500/10" },
];

export const classes = [
  { nome: "Kids Playgroup", nivel: "A1", professor: "Marcos Vidal", alunos: 9, vagas: 12, horario: "Seg/Qua 19:00", salaId: "sala-5", salaNome: "Espaço Kids - Disney", corTheme: "emerald" },
  { nome: "Regular Noite", nivel: "A2", professor: "Julia Kern", alunos: 14, vagas: 14, horario: "Ter/Qui 18:30", salaId: "sala-2", salaNome: "Sala 02 - New York", corTheme: "blue" },
  { nome: "Business English", nivel: "B1", professor: "Ana Beatriz", alunos: 8, vagas: 12, horario: "Seg/Qua 07:30", salaId: "sala-1", salaNome: "Sala 01 - London", corTheme: "purple" },
  { nome: "Conversation", nivel: "B2", professor: "Julia Kern", alunos: 11, vagas: 12, horario: "Ter/Qui 20:00", salaId: "sala-3", salaNome: "Sala 03 - Dublin", corTheme: "amber" },
  { nome: "Advanced Manhã", nivel: "C1", professor: "Ana Beatriz", alunos: 6, vagas: 10, horario: "Sex 09:00", salaId: "sala-4", salaNome: "Lab Tech - Silicon Valley", corTheme: "rose" },
  { nome: "Proficiency Lab", nivel: "C2", professor: "Peter Hall", alunos: 4, vagas: 8, horario: "Sáb 10:00", salaId: "sala-6", salaNome: "Auditório Oxford", corTheme: "cyan" },
];

export type Classroom = {
  id: string;
  nome: string;
  capacidade: number;
  blocoOuAndar: string;
  recursos: string[];
  status: "Disponível" | "Em Manutenção" | "Reservada";
  corIdentificadora?: string;
  responsavel?: string;
};

export const classrooms: Classroom[] = [
  {
    id: "sala-1",
    nome: "Sala 01 - London",
    capacidade: 14,
    blocoOuAndar: "Térreo - Bloco A",
    recursos: ["Smart TV 65\" 4K", "Ar Condicionado 18k BTUs", "Quadro Magnético", "Wi-Fi Fluency-5G", "Caixa de Som Bluetooth"],
    status: "Disponível",
    corIdentificadora: "from-blue-500/20 to-indigo-500/20",
    responsavel: "Marcos Vidal",
  },
  {
    id: "sala-2",
    nome: "Sala 02 - New York",
    capacidade: 16,
    blocoOuAndar: "1º Andar - Bloco A",
    recursos: ["Smart TV 75\" 4K", "Ar Condicionado 24k BTUs", "Quadro Branco Vitrificado", "Wi-Fi Fluency-5G", "Som Embutido no Teto"],
    status: "Disponível",
    corIdentificadora: "from-amber-500/20 to-orange-500/20",
    responsavel: "Julia Kern",
  },
  {
    id: "sala-3",
    nome: "Sala 03 - Dublin",
    capacidade: 12,
    blocoOuAndar: "1º Andar - Bloco B",
    recursos: ["Smart TV 55\" 4K", "Ar Condicionado 12k BTUs", "Cavalete Flip-Chart", "Wi-Fi Fluency-5G", "Mesa Redonda Conversação"],
    status: "Disponível",
    corIdentificadora: "from-emerald-500/20 to-teal-500/20",
    responsavel: "Ana Beatriz",
  },
  {
    id: "sala-4",
    nome: "Lab Tech - Silicon Valley",
    capacidade: 10,
    blocoOuAndar: "2º Andar - Bloco Tech",
    recursos: ["10 Computadores All-in-One", "Headsets com Cancelamento de Ruído", "Projetor Laser HD", "Ar Condicionado 18k BTUs", "Switch Gigabit"],
    status: "Disponível",
    corIdentificadora: "from-purple-500/20 to-pink-500/20",
    responsavel: "Peter Hall",
  },
  {
    id: "sala-5",
    nome: "Espaço Kids - Disney",
    capacidade: 12,
    blocoOuAndar: "Térreo - Bloco Kids",
    recursos: ["Smart TV 55\" com Suporte Articulado", "Ar Condicionado 18k BTUs", "Tapete Pedagógico Emborrachado", "Tablets Infantis", "Jogos de Tabuleiro"],
    status: "Disponível",
    corIdentificadora: "from-rose-500/20 to-orange-500/20",
    responsavel: "Marcos Vidal",
  },
  {
    id: "sala-6",
    nome: "Auditório Oxford",
    capacidade: 30,
    blocoOuAndar: "2º Andar - Bloco Central",
    recursos: ["Projetor 4K Epson 5000 Lumens", "Sistema de Microfone Sem Fio Duplo", "Mesa de Som 8 Canais", "2x Ar Condicionado 30k BTUs", "Palco para Apresentações"],
    status: "Disponível",
    corIdentificadora: "from-cyan-500/20 to-blue-500/20",
    responsavel: "Peter Hall",
  },
];

export type InventorySegment =
  | "Tecnologia & Audiovisual"
  | "Climatização & Conforto"
  | "Móveis & Mobiliário"
  | "Eletrodomésticos & Copa"
  | "Recursos Didáticos"
  | "Segurança & Infraestrutura";

export type InventoryItem = {
  id: string;
  patrimonioCodigo: string;
  nome: string;
  segmento: InventorySegment;
  marcaModelo: string;
  numeroSerie: string;
  salaId: string;
  salaNome: string;
  estadoConservacao: "Novo" | "Excelente" | "Bom" | "Necessita Reparo" | "Em Manutenção" | "Inativo";
  dataAquisicao: string;
  valorCompra: number;
  garantiaAte: string;
  responsavel: string;
  notas?: string;
  ultimaManutencao?: string;
  proximaManutencao?: string;
};

export const inventoryItems: InventoryItem[] = [
  {
    id: "inv-1",
    patrimonioCodigo: "PAT-2026-001",
    nome: "Smart TV 65\" Crystal UHD 4K",
    segmento: "Tecnologia & Audiovisual",
    marcaModelo: "Samsung UN65CU7700",
    numeroSerie: "SAM-65CU-99881",
    salaId: "sala-1",
    salaNome: "Sala 01 - London",
    estadoConservacao: "Excelente",
    dataAquisicao: "15/01/2026",
    valorCompra: 3499.0,
    garantiaAte: "15/01/2027",
    responsavel: "Marcos Vidal",
    notas: "Instalada na parede principal com suporte articulado inclinável.",
    ultimaManutencao: "10/02/2026",
  },
  {
    id: "inv-2",
    patrimonioCodigo: "PAT-2026-002",
    nome: "Ar Condicionado Split Inverter 18.000 BTUs",
    segmento: "Climatização & Conforto",
    marcaModelo: "Daikin EcoSwing R-32",
    numeroSerie: "DKN-18K-44512",
    salaId: "sala-1",
    salaNome: "Sala 01 - London",
    estadoConservacao: "Excelente",
    dataAquisicao: "10/01/2026",
    valorCompra: 3890.0,
    garantiaAte: "10/01/2028",
    responsavel: "Manutenção Geral",
    notas: "Filtros lavados a cada 60 dias.",
    ultimaManutencao: "01/08/2026",
    proximaManutencao: "01/10/2026",
  },
  {
    id: "inv-3",
    patrimonioCodigo: "PAT-2026-003",
    nome: "Smart TV 75\" QLED 4K",
    segmento: "Tecnologia & Audiovisual",
    marcaModelo: "LG 75QNED80",
    numeroSerie: "LG-75QN-11029",
    salaId: "sala-2",
    salaNome: "Sala 02 - New York",
    estadoConservacao: "Novo",
    dataAquisicao: "20/02/2026",
    valorCompra: 5299.0,
    garantiaAte: "20/02/2027",
    responsavel: "Julia Kern",
    notas: "Cabo HDMI 2.1 5m embutido na calha.",
  },
  {
    id: "inv-4",
    patrimonioCodigo: "PAT-2026-004",
    nome: "Ar Condicionado Split Inverter 24.000 BTUs",
    segmento: "Climatização & Conforto",
    marcaModelo: "Fujitsu Premium Inverter",
    numeroSerie: "FUJ-24K-88712",
    salaId: "sala-2",
    salaNome: "Sala 02 - New York",
    estadoConservacao: "Excelente",
    dataAquisicao: "15/01/2026",
    valorCompra: 4950.0,
    garantiaAte: "15/01/2028",
    responsavel: "Manutenção Geral",
    ultimaManutencao: "15/07/2026",
    proximaManutencao: "15/09/2026",
  },
  {
    id: "inv-5",
    patrimonioCodigo: "PAT-2026-005",
    nome: "Projetor Laser 5.000 Lumens Full HD",
    segmento: "Tecnologia & Audiovisual",
    marcaModelo: "Epson PowerLite L520W",
    numeroSerie: "EPS-520-77621",
    salaId: "sala-6",
    salaNome: "Auditório Oxford",
    estadoConservacao: "Excelente",
    dataAquisicao: "05/01/2026",
    valorCompra: 8900.0,
    garantiaAte: "05/01/2029",
    responsavel: "Peter Hall",
    notas: "Lente laser com vida útil de 20.000 horas.",
  },
  {
    id: "inv-6",
    patrimonioCodigo: "PAT-2026-006",
    nome: "Sistema de Microfone Sem Fio Duplo UHF",
    segmento: "Tecnologia & Audiovisual",
    marcaModelo: "Shure BLX288/PG58",
    numeroSerie: "SHR-PG58-33120",
    salaId: "sala-6",
    salaNome: "Auditório Oxford",
    estadoConservacao: "Excelente",
    dataAquisicao: "12/01/2026",
    valorCompra: 3750.0,
    garantiaAte: "12/01/2028",
    responsavel: "Peter Hall",
    notas: "Acompanha maleta de transporte e pilhas recarregáveis.",
  },
  {
    id: "inv-7",
    patrimonioCodigo: "PAT-2026-007",
    nome: "Conjunto de 14 Carteiras Universitárias Estofadas",
    segmento: "Móveis & Mobiliário",
    marcaModelo: "Cavaletti Slim Universitária",
    numeroSerie: "CVL-SLIM-14X",
    salaId: "sala-1",
    salaNome: "Sala 01 - London",
    estadoConservacao: "Excelente",
    dataAquisicao: "08/01/2026",
    valorCompra: 6160.0,
    garantiaAte: "08/01/2031",
    responsavel: "Coordenação",
    notas: "Prancheta escamoteável e estofamento grafite.",
  },
  {
    id: "inv-8",
    patrimonioCodigo: "PAT-2026-008",
    nome: "Conjunto de 16 Carteiras Universitárias Estofadas",
    segmento: "Móveis & Mobiliário",
    marcaModelo: "Cavaletti Slim Universitária",
    numeroSerie: "CVL-SLIM-16X",
    salaId: "sala-2",
    salaNome: "Sala 02 - New York",
    estadoConservacao: "Excelente",
    dataAquisicao: "08/01/2026",
    valorCompra: 7040.0,
    garantiaAte: "08/01/2031",
    responsavel: "Coordenação",
  },
  {
    id: "inv-9",
    patrimonioCodigo: "PAT-2026-009",
    nome: "10x Computadores All-in-One Core i5 16GB",
    segmento: "Tecnologia & Audiovisual",
    marcaModelo: "Dell Inspiron 5420 AIO",
    numeroSerie: "DLL-AIO-LOT-10",
    salaId: "sala-4",
    salaNome: "Lab Tech - Silicon Valley",
    estadoConservacao: "Novo",
    dataAquisicao: "25/01/2026",
    valorCompra: 42900.0,
    garantiaAte: "25/01/2029",
    responsavel: "TI / Suporte",
    notas: "Software de imersão de pronúncia e listening instalado em todas as máquinas.",
  },
  {
    id: "inv-10",
    patrimonioCodigo: "PAT-2026-010",
    nome: "Cafeteira Expresso Grão Automática",
    segmento: "Eletrodomésticos & Copa",
    marcaModelo: "Philips Walita Série 2200",
    numeroSerie: "PHL-2200-99120",
    salaId: "estoque",
    salaNome: "Sala dos Professores / Copa",
    estadoConservacao: "Excelente",
    dataAquisicao: "02/02/2026",
    valorCompra: 2899.0,
    garantiaAte: "02/02/2027",
    responsavel: "Recepção / Apoio",
    notas: "Moinho em cerâmica integrado.",
  },
  {
    id: "inv-11",
    patrimonioCodigo: "PAT-2026-011",
    nome: "Purificador de Água Gelada e Natural",
    segmento: "Eletrodomésticos & Copa",
    marcaModelo: "IBBL FR600 Speciale",
    numeroSerie: "IBBL-FR600-4412",
    salaId: "estoque",
    salaNome: "Recepção / Hall Central",
    estadoConservacao: "Bom",
    dataAquisicao: "10/01/2026",
    valorCompra: 1190.0,
    garantiaAte: "10/01/2027",
    responsavel: "Recepção / Apoio",
    notas: "Refil de filtragem trocado a cada 6 meses.",
    ultimaManutencao: "10/07/2026",
    proximaManutencao: "10/01/2027",
  },
  {
    id: "inv-12",
    patrimonioCodigo: "PAT-2026-012",
    nome: "Roteador Wi-Fi 6 Mesh Tri-Band (Kit 3 Unidades)",
    segmento: "Segurança & Infraestrutura",
    marcaModelo: "TP-Link Deco XE75 Pro",
    numeroSerie: "TPL-DEC-99881",
    salaId: "sala-1",
    salaNome: "Infraestrutura Geral da Escola",
    estadoConservacao: "Novo",
    dataAquisicao: "14/01/2026",
    valorCompra: 2650.0,
    garantiaAte: "14/01/2029",
    responsavel: "TI / Suporte",
    notas: "Cobertura de 650m² com 500Mbps simétricos para professores e alunos.",
  },
  {
    id: "inv-13",
    patrimonioCodigo: "PAT-2026-013",
    nome: "Quadro Branco Magnético Vitrificado 2,00m x 1,20m",
    segmento: "Recursos Didáticos",
    marcaModelo: "Cortiarte Luxo Magnético",
    numeroSerie: "CRT-MAG-200",
    salaId: "sala-1",
    salaNome: "Sala 01 - London",
    estadoConservacao: "Excelente",
    dataAquisicao: "09/01/2026",
    valorCompra: 780.0,
    garantiaAte: "09/01/2031",
    responsavel: "Coordenação",
  },
  {
    id: "inv-14",
    patrimonioCodigo: "PAT-2026-014",
    nome: "Sistema de CFTV 8 Câmeras IP Full HD + NVR 2TB",
    segmento: "Segurança & Infraestrutura",
    marcaModelo: "Intelbras VIP 1230 B G2",
    numeroSerie: "INT-CFTV-88120",
    salaId: "estoque",
    salaNome: "Infraestrutura Geral da Escola",
    estadoConservacao: "Excelente",
    dataAquisicao: "04/01/2026",
    valorCompra: 4850.0,
    garantiaAte: "04/01/2027",
    responsavel: "Direção",
    notas: "Monitoramento 24h na portaria e corredores.",
  },
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
