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

// --- EDUCATIONAL LEVELS (CEFR & CUSTOMIZABLE) ---
export type EducationalLevel = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  horasSugeridas: number;
  ordem: number;
};

export const initialEducationalLevels: EducationalLevel[] = [
  { id: "lvl-a1", codigo: "A1", nome: "Beginner / Kids", descricao: "Vocabulário básico cotidiano, saudações e frases simples.", horasSugeridas: 60, ordem: 1 },
  { id: "lvl-a2", codigo: "A2", nome: "Elementary / Básico", descricao: "Comunicação em tarefas rotineiras, tempos passados e compras.", horasSugeridas: 60, ordem: 2 },
  { id: "lvl-b1", codigo: "B1", nome: "Intermediate / Intermediário", descricao: "Expressão de opiniões, redação de e-mails e narrativas.", horasSugeridas: 80, ordem: 3 },
  { id: "lvl-b2", codigo: "B2", nome: "Upper-Intermediate / Avançado", descricao: "Fluência em conversação e debates de negócios e atualidades.", horasSugeridas: 90, ordem: 4 },
  { id: "lvl-c1", codigo: "C1", nome: "Advanced / Fluência Plena", descricao: "Compreensão de textos complexos e argumentação sofisticada.", horasSugeridas: 100, ordem: 5 },
  { id: "lvl-c2", codigo: "C2", nome: "Mastery / Proficiência", descricao: "Domínio nativo e precisão idiomática para fins acadêmicos/exames.", horasSugeridas: 120, ordem: 6 },
  { id: "lvl-all", codigo: "TRILHA", nome: "Todos os Níveis (A1 a C2)", descricao: "Trilha progressiva completa em múltiplos semestres.", horasSugeridas: 360, ordem: 7 },
  { id: "lvl-vip", codigo: "VIP", nome: "Personalizado / VIP Individual", descricao: "Grade modular sob medida conforme necessidade do aluno.", horasSugeridas: 60, ordem: 8 },
];

// --- EDUCATIONAL PRODUCTS & COURSE CATALOG TYPES ---
export type EducationalProduct = {
  id: string;
  nome: string;
  codigo: string;
  modalidade: PricingModelType; // "mensalidade_fixa" | "hora_aula" | "frequencia_semanal" | "pacote_fechado"
  nivel: string;
  duracaoAulaMinutos: number; // ex: 90 min (1h30)
  vezesPorSemana: number; // ex: 2x
  cargaHorariaSemanal: number; // ex: 3h
  cargaHorariaMensal: number; // ex: 13h (3 * 4.33)
  cargaHorariaTotal: number; // ex: 60h total no semestre
  livroPadraoId?: string;
  livroPadraoNome?: string;
  valorBase: number;
  descricao: string;
  publicoAlvo: string;
  ativo: boolean;
  permiteTurma: boolean;
  maxAlunosTurma?: number;
};

export const initialEducationalProducts: EducationalProduct[] = [
  {
    id: "prod-regular",
    nome: "Inglês Regular Semestral (Turma)",
    codigo: "CUR-REG-01",
    modalidade: "mensalidade_fixa",
    nivel: "A1 a C2",
    duracaoAulaMinutos: 90,
    vezesPorSemana: 2,
    cargaHorariaSemanal: 3,
    cargaHorariaMensal: 13,
    cargaHorariaTotal: 60,
    livroPadraoId: "livro-2",
    livroPadraoNome: "English File - Elementary & Pre-Int",
    valorBase: 450.0,
    descricao: "Curso presencial em turmas de até 14 alunos com foco em conversação, gramática aplicada e dinâmicas interativas.",
    publicoAlvo: "Jovens e Adultos (Geral)",
    ativo: true,
    permiteTurma: true,
    maxAlunosTurma: 14,
  },
  {
    id: "prod-vip",
    nome: "Inglês VIP Executivo (Particular / Hora-Aula)",
    codigo: "CUR-VIP-02",
    modalidade: "hora_aula",
    nivel: "Personalizado / VIP Individual",
    duracaoAulaMinutos: 60,
    vezesPorSemana: 2,
    cargaHorariaSemanal: 2,
    cargaHorariaMensal: 8.6,
    cargaHorariaTotal: 40,
    livroPadraoId: "livro-3",
    livroPadraoNome: "Oxford Grammar & Business English",
    valorBase: 75.0, // R$ 75 / hora lecionada
    descricao: "Aulas individuais 1-on-1 com professor dedicado e flexibilidade de horários. Cobrança proporcional às horas consumidas no mês.",
    publicoAlvo: "Executivos, Médicos e Profissionais com agenda dinâmica",
    ativo: true,
    permiteTurma: false,
    maxAlunosTurma: 1,
  },
  {
    id: "prod-ielts",
    nome: "Preparatório IELTS & TOEFL Intensivo (Pacote)",
    codigo: "CUR-EXAM-03",
    modalidade: "pacote_fechado",
    nivel: "Upper-Intermediate / Avançado",
    duracaoAulaMinutos: 120,
    vezesPorSemana: 2,
    cargaHorariaSemanal: 4,
    cargaHorariaMensal: 17.3,
    cargaHorariaTotal: 60,
    livroPadraoId: "livro-4",
    livroPadraoNome: "Cambridge - Conversation Mastery & C1",
    valorBase: 2800.0, // Valor total do módulo em até 6x
    descricao: "Módulo fechado de 60 horas focado em simulados cronometrados, redação acadêmica e estratégias de pontuação máxima em testes internacionais.",
    publicoAlvo: "Candidatos a bolsas internacionais, imigração e mestrados",
    ativo: true,
    permiteTurma: true,
    maxAlunosTurma: 10,
  },
  {
    id: "prod-kids",
    nome: "Kids & Teens Saturday Immersion",
    codigo: "CUR-KIDS-04",
    modalidade: "frequencia_semanal",
    nivel: "Beginner / Kids",
    duracaoAulaMinutos: 180,
    vezesPorSemana: 1,
    cargaHorariaSemanal: 3,
    cargaHorariaMensal: 13,
    cargaHorariaTotal: 48,
    livroPadraoId: "livro-1",
    livroPadraoNome: "Kids Explorer - Stage 1",
    valorBase: 290.0, // 1x na semana aos sábados
    descricao: "Imersão lúdica e interativa de 3 horas aos sábados com jogos pedagógicos, contação de histórias e gamificação.",
    publicoAlvo: "Crianças e Adolescentes (7 a 14 anos)",
    ativo: true,
    permiteTurma: true,
    maxAlunosTurma: 12,
  },
  {
    id: "prod-business",
    nome: "Business & Corporate English (Semi-Intensivo)",
    codigo: "CUR-CORP-05",
    modalidade: "mensalidade_fixa",
    nivel: "Upper-Intermediate / Avançado",
    duracaoAulaMinutos: 90,
    vezesPorSemana: 2,
    cargaHorariaSemanal: 3,
    cargaHorariaMensal: 13,
    cargaHorariaTotal: 60,
    livroPadraoId: "livro-3",
    livroPadraoNome: "Oxford Grammar & Business English",
    valorBase: 490.0,
    descricao: "Focado em apresentações corporativas, reuniões executivas, negociações globais e vocabulário financeiro.",
    publicoAlvo: "Profissionais de empresas multinacionais",
    ativo: true,
    permiteTurma: true,
    maxAlunosTurma: 10,
  },
];

export const students = [
  {
    nome: "Marina Rocha",
    nivel: "B2",
    turma: "Conversation Noite",
    inicio: "12/03/2026",
    status: "Ativo",
    horasContratadas: 3,
    produtoId: "prod-regular",
    produtoNome: "Inglês Regular Semestral (Turma)",
    tipoContrato: "turma" as const,
    valorMensalidade: 450,
    diaVencimento: 10,
    livroEmUso: "Pathway to Fluency B2",
  },
  {
    nome: "Caio Bertolli",
    nivel: "A2",
    turma: "Regular Noite",
    inicio: "04/05/2026",
    status: "Inadimplente",
    horasContratadas: 3,
    produtoId: "prod-regular",
    produtoNome: "Inglês Regular Semestral (Turma)",
    tipoContrato: "turma" as const,
    valorMensalidade: 450,
    diaVencimento: 10,
    livroEmUso: "English Foundations A1",
  },
  {
    nome: "Helena Prado",
    nivel: "C1",
    turma: "VIP Individual",
    inicio: "22/01/2026",
    status: "Ativo",
    horasContratadas: 2,
    produtoId: "prod-vip",
    produtoNome: "Inglês VIP Executivo (Particular)",
    tipoContrato: "hora_aula" as const,
    valorMensalidade: 650, // 2h/sem * 4.33 * 75
    diaVencimento: 5,
    livroEmUso: "Professional English C1",
  },
  {
    nome: "Bruno Salles",
    nivel: "A2",
    turma: "Regular Tarde",
    inicio: "18/06/2026",
    status: "Em risco",
    horasContratadas: 3,
    produtoId: "prod-regular",
    produtoNome: "Inglês Regular Semestral (Turma)",
    tipoContrato: "turma" as const,
    valorMensalidade: 450,
    diaVencimento: 15,
    livroEmUso: "English Foundations A1",
  },
  {
    nome: "Aline Ferraz",
    nivel: "B1",
    turma: "Preparatório IELTS Turma A",
    inicio: "09/07/2026",
    status: "Ativo",
    horasContratadas: 4,
    produtoId: "prod-ielts",
    produtoNome: "Preparatório IELTS & TOEFL Intensivo (Pacote)",
    tipoContrato: "pacote_fechado" as const,
    valorMensalidade: 466.67, // R$ 2800 / 6 parcelas
    diaVencimento: 10,
    livroEmUso: "Academic Mastery C2",
  },
  {
    nome: "Rafael Lima",
    nivel: "C1",
    turma: "Advanced Noite",
    inicio: "27/02/2026",
    status: "Em risco",
    horasContratadas: 3,
    produtoId: "prod-business",
    produtoNome: "Business & Corporate English",
    tipoContrato: "turma" as const,
    valorMensalidade: 490,
    diaVencimento: 10,
    livroEmUso: "Professional English C1",
  },
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
  { nome: "Kids Playgroup", nivel: "A1", professor: "Marcos Vidal", alunos: 9, vagas: 12, horario: "Seg/Qua 19:00-20:30", salaId: "sala-5", salaNome: "Espaço Kids - Disney", corTheme: "emerald" },
  { nome: "Regular Noite", nivel: "A2", professor: "Julia Kern", alunos: 14, vagas: 14, horario: "Ter/Qui 18:30-20:00", salaId: "sala-2", salaNome: "Sala 02 - New York", corTheme: "blue" },
  { nome: "Business English", nivel: "B1", professor: "Ana Beatriz", alunos: 8, vagas: 12, horario: "Seg/Qua 07:30-09:00", salaId: "sala-1", salaNome: "Sala 01 - London", corTheme: "purple" },
  { nome: "Conversation", nivel: "B2", professor: "Lucas Silveira", alunos: 11, vagas: 12, horario: "Ter/Qui 20:00-21:30", salaId: "sala-3", salaNome: "Sala 03 - Dublin", corTheme: "amber" },
  { nome: "Advanced Manhã", nivel: "C1", professor: "Ana Beatriz", alunos: 6, vagas: 10, horario: "Sex 09:00-10:30", salaId: "sala-4", salaNome: "Lab Tech - Silicon Valley", corTheme: "rose" },
  { nome: "Proficiency Lab", nivel: "C2", professor: "Peter Hall", alunos: 4, vagas: 8, horario: "Sáb 10:00-11:30", salaId: "sala-6", salaNome: "Auditório Oxford", corTheme: "cyan" },
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

// --- PRICING POLICY & FORMULA TYPES ---
export type PricingModelType = "mensalidade_fixa" | "hora_aula" | "frequencia_semanal" | "pacote_fechado";

export type PricingHistoryEntry = {
  id: string;
  dataHora: string;
  usuario: string;
  motivo: string;
  alteracoes: string[];
};

export type PricingPolicy = {
  modelosHabilitados: PricingModelType[];
  modeloPadrao: PricingModelType;
  mensalidadePadrao: number;
  mensalidadesPorNivel: Record<string, number>;
  valorHoraAula: number;
  valorHoraProfessorMedio: number; // Custo hora do professor
  tabelaFrequencia: { vezesPorSemana: number; valorMensal: number; descricao: string }[];
  pacoteSemestral: { valorTotal: number; parcelasMax: number; descontoVistaPct: number };
  taxaMatricula: number;
  taxaMaterialDidatico: number;
  historicoAlteracoes: PricingHistoryEntry[];
};

export const defaultPricingPolicy: PricingPolicy = {
  modelosHabilitados: ["mensalidade_fixa", "hora_aula", "pacote_fechado"],
  modeloPadrao: "mensalidade_fixa",
  mensalidadePadrao: 450,
  mensalidadesPorNivel: {
    A1: 390,
    A2: 450,
    B1: 490,
    B2: 520,
    C1: 590,
    C2: 650,
  },
  valorHoraAula: 65.0,
  valorHoraProfessorMedio: 45.0,
  tabelaFrequencia: [
    { vezesPorSemana: 1, valorMensal: 280, descricao: "1x na semana (ex: Sábados Intensivos ou Sextas)" },
    { vezesPorSemana: 2, valorMensal: 450, descricao: "2x na semana (ex: Seg/Qua ou Ter/Qui - Padrão)" },
    { vezesPorSemana: 3, valorMensal: 590, descricao: "3x na semana (ex: Seg/Qua/Sex - Semi-Intensivo)" },
    { vezesPorSemana: 5, valorMensal: 890, descricao: "5x na semana (Imersão Diária)" },
  ],
  pacoteSemestral: {
    valorTotal: 2520,
    parcelasMax: 6,
    descontoVistaPct: 10,
  },
  taxaMatricula: 150,
  taxaMaterialDidatico: 280,
  historicoAlteracoes: [
    {
      id: "hist-1",
      dataHora: "15/01/2026 14:30",
      usuario: "Administrador (Marcos Vidal)",
      motivo: "Reajuste anual de início de ano letivo 2026.1 e dissídio dos professores.",
      alteracoes: [
        "Mensalidades por Nível reajustadas em média 6.5%",
        "Valor Hora/Aula ajustado de R$ 60,00 para R$ 65,00",
        "Custo Hora Professor ajustado de R$ 40,00 para R$ 45,00",
        "Taxa de Matrícula fixada em R$ 150,00",
      ],
    },
    {
      id: "hist-2",
      dataHora: "01/06/2026 10:15",
      usuario: "Administrador (Marcos Vidal)",
      motivo: "Habilitação do Pacote Semestral com desconto à vista para captação do 2º semestre.",
      alteracoes: [
        "Habilitado modelo de cobrança 'Pacote Semestral'",
        "Definido valor semestral fechado em R$ 2.520,00 em até 6x",
      ],
    },
  ],
};

// --- SCHOOL COSTS & DRE TYPES ---
export type CostCategory =
  | "Folha Docente (Professores)"
  | "Infraestrutura & Imóvel"
  | "Utilidades & Consumo"
  | "Administrativo & Operacional"
  | "Marketing & Captação"
  | "Materiais & Recursos Pedagógicos"
  | "Sistemas, TI & Licenças";

export type SchoolCost = {
  id: string;
  descricao: string;
  categoria: CostCategory;
  tipo: "fixo" | "variavel";
  valor: number;
  frequencia: "mensal" | "anual" | "por_aluno" | "por_hora_aula";
  recorrente: boolean;
  diaVencimento?: number;
  responsavel?: string;
  observacoes?: string;
};

export const initialSchoolCosts: SchoolCost[] = [
  {
    id: "cost-1",
    descricao: "Aluguel do Imóvel Comercial (Sede Principal)",
    categoria: "Infraestrutura & Imóvel",
    tipo: "fixo",
    valor: 8500.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 10,
    responsavel: "Direção Geral",
    observacoes: "Contrato de locação reajustado anualmente pelo IGP-M.",
  },
  {
    id: "cost-2",
    descricao: "Condomínio & IPTU Comercial",
    categoria: "Infraestrutura & Imóvel",
    tipo: "fixo",
    valor: 1850.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 15,
    responsavel: "Administração",
  },
  {
    id: "cost-3",
    descricao: "Energia Elétrica (Enel / Ar Condicionados 6 Salas)",
    categoria: "Utilidades & Consumo",
    tipo: "fixo",
    valor: 2450.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 20,
    responsavel: "Manutenção",
    observacoes: "Consumo médio de 1.800 kWh/mês.",
  },
  {
    id: "cost-4",
    descricao: "Internet Fibra Dedicada 1 Gbps + Wi-Fi Mesh Alunos",
    categoria: "Utilidades & Consumo",
    tipo: "fixo",
    valor: 480.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 5,
    responsavel: "TI",
  },
  {
    id: "cost-5",
    descricao: "Salários: Equipe de Recepção & Atendimento (2 Colab.)",
    categoria: "Administrativo & Operacional",
    tipo: "fixo",
    valor: 5400.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 5,
    responsavel: "RH",
  },
  {
    id: "cost-6",
    descricao: "Salário: Coordenação Pedagógica Geral",
    categoria: "Administrativo & Operacional",
    tipo: "fixo",
    valor: 4800.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 5,
    responsavel: "Diretoria",
  },
  {
    id: "cost-7",
    descricao: "Serviço de Limpeza, Conservação & Copa",
    categoria: "Administrativo & Operacional",
    tipo: "fixo",
    valor: 2200.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 10,
    responsavel: "Apoio Operacional",
  },
  {
    id: "cost-8",
    descricao: "Tráfego Pago & Anúncios (Meta Ads & Google Ads)",
    categoria: "Marketing & Captação",
    tipo: "fixo",
    valor: 3500.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 1,
    responsavel: "Comercial / Marketing",
    observacoes: "Geração de leads para matrículas do próximo semestre.",
  },
  {
    id: "cost-9",
    descricao: "Licenças de Software, ERP Fluency AI & Google Workspace",
    categoria: "Sistemas, TI & Licenças",
    tipo: "fixo",
    valor: 1190.0,
    frequencia: "mensal",
    recorrente: true,
    diaVencimento: 15,
    responsavel: "TI",
  },
  {
    id: "cost-10",
    descricao: "Custo Médio de Aquisição de Livros Didáticos (Estoque)",
    categoria: "Materiais & Recursos Pedagógicos",
    tipo: "variavel",
    valor: 120.0, // Custo por livro
    frequencia: "por_aluno",
    recorrente: false,
    responsavel: "Coordenação",
    observacoes: "Comprado da editora a R$ 120 e repassado/incluso a R$ 280.",
  },
  {
    id: "cost-11",
    descricao: "Hora/Aula Professores Contratados (Média Horas Lecionadas)",
    categoria: "Folha Docente (Professores)",
    tipo: "variavel",
    valor: 45.0, // R$/hora
    frequencia: "por_hora_aula",
    recorrente: true,
    responsavel: "Coordenação Pedagógica",
    observacoes: "Valor base de R$ 45/h + DSR para corpo docente.",
  },
];

// --- LIVROS E TRILHAS DIDÁTICAS COMPARTILHADAS ---
export type BookTrailLesson = {
  id: string;
  aula: number;
  tema: string;
  descricao: string;
};

export type BookTrail = {
  id: string;
  titulo: string;
  nivel: string;
  aulas: BookTrailLesson[];
};

export const livrosTrilhas: BookTrail[] = [
  {
    id: "livro-1",
    titulo: "Kids Explorer - Stage 1",
    nivel: "A1",
    aulas: [
      { id: "l1-1", aula: 1, tema: "Welcome & Color Songs", descricao: "Apresentação e introdução de cores primárias com música." },
      { id: "l1-2", aula: 2, tema: "Vocabulary: Farm Animals", descricao: "Aprendizado dos nomes de animais de fazenda em inglês." },
      { id: "l1-3", aula: 3, tema: "Singing & Action Verbs", descricao: "Música interativa e ações (jump, run, clap)." },
      { id: "l1-4", aula: 4, tema: "Vocabulary: Fruit & Foods", descricao: "Introdução de nomes de frutas comuns e vocabulário de comida." },
      { id: "l1-5", aula: 5, tema: "Review & Games", descricao: "Atividades lúdicas de revisão de cores e animais." },
    ],
  },
  {
    id: "livro-2",
    titulo: "English File - Elementary & Pre-Int",
    nivel: "A2",
    aulas: [
      { id: "l2-1", aula: 1, tema: "Simple Past vs Past Continuous", descricao: "Revisão e exercícios de gramática com tempos verbais passados." },
      { id: "l2-2", aula: 2, tema: "Travel Vocabulary & Bookings", descricao: "Como fazer reservas e vocabulário útil para viagens." },
      { id: "l2-3", aula: 3, tema: "Conversational Drills", descricao: "Simulações práticas de diálogo em aeroportos e hotéis." },
      { id: "l2-4", aula: 4, tema: "Reading & Pronunciation", descricao: "Leitura de textos e foco em pronúncia e entonação." },
    ],
  },
  {
    id: "livro-3",
    titulo: "Oxford Grammar & Business English",
    nivel: "B1",
    aulas: [
      { id: "l3-1", aula: 1, tema: "Greetings & Self Introduction", descricao: "Como se apresentar profissionalmente em inglês." },
      { id: "l3-2", aula: 2, tema: "Writing Professional Emails", descricao: "Estruturas, formalidades e expressões de e-mail comercial." },
      { id: "l3-3", aula: 3, tema: "Meeting Phrasal Verbs", descricao: "Principais phrasal verbs usados em reuniões." },
      { id: "l3-4", aula: 4, tema: "Negotiation Tactics", descricao: "Vocabulário de negociação e expressão de opiniões." },
    ],
  },
  {
    id: "livro-4",
    titulo: "Cambridge - Conversation Mastery & C1",
    nivel: "B2",
    aulas: [
      { id: "l4-1", aula: 1, tema: "Welcome & Diagnostic Speaking", descricao: "Apresentação e avaliação inicial de fluência oral." },
      { id: "l4-2", aula: 2, tema: "Debating the Future of Work - AI Impact", descricao: "Debate estruturado sobre o impacto da Inteligência Artificial no mercado." },
      { id: "l4-3", aula: 3, tema: "Expressing Agreement & Disagreement", descricao: "Expressões e conectores para concordar e discordar educadamente." },
      { id: "l4-4", aula: 4, tema: "Idiomatic Expressions for Negotiation", descricao: "Expressões idiomáticas nativas usadas em acordos." },
      { id: "l4-5", aula: 5, tema: "Final Presentation - Persuasive Pitch", descricao: "Apresentações finais e feedbacks individuais detalhados." },
    ],
  },
];
