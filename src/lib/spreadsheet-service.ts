import * as XLSX from "xlsx";
import { supabase } from "./supabase";

export interface StudentSpreadsheetRow {
  // 1. Dados do Aluno
  nome: string;
  dataNascimento?: string;
  rg?: string;
  cpf?: string;
  genero?: string;
  endereco?: string;
  telefone?: string;
  email?: string;

  // 2. Dados do Responsável
  responsavelNome?: string;
  responsavelDataNascimento?: string;
  responsavelRg?: string;
  responsavelCpf?: string;
  responsavelEndereco?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;

  // 3. Dados Pedagógicos
  idiomaCurso?: string;
  turma?: string;
  dataInicio?: string;
  fezTesteNivel?: boolean | string;
  resultadoTesteNivel?: string;
  status?: string;

  // 4. Dados Financeiros e Comerciais
  diaVencimento?: number | string;
  formaPagamento?: string;
  valorMensalidade?: number | string;
  descontoAplicado?: number | string;
  canalAquisicao?: string;

  // Status de Validação do Parser
  _isValid?: boolean;
  _errors?: string[];
}

export const OFFICIAL_COLUMNS = [
  { header: "Nome Completo do Aluno", key: "nome", required: true, example: "Ana Clara Silva" },
  { header: "Data de Nascimento", key: "dataNascimento", required: false, example: "14/05/2006" },
  { header: "RG", key: "rg", required: false, example: "12.345.678-9" },
  { header: "CPF", key: "cpf", required: false, example: "123.456.789-00" },
  { header: "Gênero / Pronome", key: "genero", required: false, example: "Feminino (Ela/Dela)" },
  { header: "Endereço", key: "endereco", required: false, example: "Av. Paulista, 1000 - Apto 42" },
  { header: "Telefone", key: "telefone", required: false, example: "(11) 98765-4321" },
  { header: "E-mail", key: "email", required: false, example: "ana.clara@email.com" },

  {
    header: "Nome Completo do Responsável",
    key: "responsavelNome",
    required: false,
    example: "Carlos Roberto Silva",
  },
  {
    header: "Data de Nascimento do Responsável",
    key: "responsavelDataNascimento",
    required: false,
    example: "20/08/1978",
  },
  { header: "RG do Responsável", key: "responsavelRg", required: false, example: "98.765.432-1" },
  {
    header: "CPF do Responsável",
    key: "responsavelCpf",
    required: false,
    example: "987.654.321-00",
  },
  {
    header: "Endereço do Responsável",
    key: "responsavelEndereco",
    required: false,
    example: "Av. Paulista, 1000 - Apto 42",
  },
  {
    header: "Telefone do Responsável",
    key: "responsavelTelefone",
    required: false,
    example: "(11) 99888-7766",
  },
  {
    header: "E-mail do Responsável",
    key: "responsavelEmail",
    required: false,
    example: "carlos.silva@email.com",
  },

  { header: "Idioma / Curso", key: "idiomaCurso", required: false, example: "Inglês Regular" },
  { header: "Turma", key: "turma", required: false, example: "B1 · Intermediário Noite" },
  { header: "Data de Início", key: "dataInicio", required: false, example: "01/08/2026" },
  {
    header: "Fez ou não teste de nível? (Sim/Não)",
    key: "fezTesteNivel",
    required: false,
    example: "Sim",
  },
  {
    header: "Resultado do Teste de Nível",
    key: "resultadoTesteNivel",
    required: false,
    example: "B1",
  },
  {
    header: "Status do Aluno (Ativo, Inativo, Bolsista, etc.)",
    key: "status",
    required: false,
    example: "Ativo",
  },

  {
    header: "Data de Pagamento / Vencimento",
    key: "diaVencimento",
    required: false,
    example: "Dia 10",
  },
  {
    header: "Forma de Pagamento Preferencial (Ex: Boleto, Cartão, PIX)",
    key: "formaPagamento",
    required: false,
    example: "PIX",
  },
  { header: "Valor da Mensalidade", key: "valorMensalidade", required: false, example: "450.00" },
  { header: "Desconto Aplicado", key: "descontoAplicado", required: false, example: "50.00" },
  {
    header: "Canal de Aquisição (Como nos conheceu)",
    key: "canalAquisicao",
    required: false,
    example: "Indicação de Amigo",
  },
];

/**
 * Downloads the official Excel (.xlsx) template for ERP migration.
 */
export function downloadStudentTemplateXLSX() {
  const headers = OFFICIAL_COLUMNS.map((c) => c.header);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  worksheet["!cols"] = OFFICIAL_COLUMNS.map(() => ({ wch: 26 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo Alunos ERP");
  const instructions = XLSX.utils.json_to_sheet(
    OFFICIAL_COLUMNS.map((column) => ({
      Campo: column.header,
      Obrigatorio: column.required ? "Sim" : "Não",
      Exemplo: column.example,
    })),
  );
  XLSX.utils.book_append_sheet(workbook, instructions, "Instruções");

  XLSX.writeFile(workbook, "modelo_importacao_alunos_fluency.xlsx");
}

/**
 * Downloads the official CSV template.
 */
export function downloadStudentTemplateCSV() {
  const headers = OFFICIAL_COLUMNS.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(";");
  const csvContent = "\uFEFF" + headers;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "modelo_importacao_alunos_fluency.csv";
  link.click();
}

/**
 * Normalizes header strings for tolerant matching.
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Parses an uploaded file (XLSX, XLS, CSV) and validates each row.
 */
export async function parseStudentSpreadsheet(file: File): Promise<{
  rows: StudentSpreadsheetRow[];
  totalValid: number;
  totalErrors: number;
  fileName: string;
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON array of objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

  const parsedRows: StudentSpreadsheetRow[] = [];
  let totalValid = 0;
  let totalErrors = 0;

  for (const raw of rawRows) {
    // Match headers dynamically
    const rowNormalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(raw)) {
      rowNormalized[normalizeHeader(key)] = val;
    }

    const getValue = (candidates: string[]): string => {
      for (const cand of candidates) {
        const norm = normalizeHeader(cand);
        if (rowNormalized[norm] !== undefined && String(rowNormalized[norm]).trim() !== "") {
          return String(rowNormalized[norm]).trim();
        }
      }
      return "";
    };

    const nome = getValue(["Nome Completo do Aluno", "Nome", "Aluno", "Nome Completo"]);
    const dataNascimento = getValue(["Data de Nascimento", "Nascimento", "Data Nasc"]);
    const rg = getValue(["RG", "Registro Geral"]);
    const cpf = getValue(["CPF", "Documento CPF"]);
    const genero = getValue(["Gênero / Pronome", "Genero", "Pronome", "Sexo"]);
    const endereco = getValue(["Endereço", "Endereco", "Logradouro"]);
    const telefone = getValue(["Telefone", "Celular", "WhatsApp", "Contato"]);
    const email = getValue(["E-mail", "Email", "Correio Eletrônico"]);

    const responsavelNome = getValue([
      "Nome Completo do Responsável",
      "Responsável",
      "Nome Responsavel",
      "Responsavel",
    ]);
    const responsavelDataNascimento = getValue([
      "Data de Nascimento do Responsável",
      "Nasc Responsavel",
      "Data Nasc Responsável",
    ]);
    const responsavelRg = getValue(["RG do Responsável", "RG Responsável"]);
    const responsavelCpf = getValue(["CPF do Responsável", "CPF Responsável"]);
    const responsavelEndereco = getValue(["Endereço do Responsável", "Endereco Responsável"]);
    const responsavelTelefone = getValue(["Telefone do Responsável", "Celular Responsável"]);
    const responsavelEmail = getValue(["E-mail do Responsável", "Email Responsável"]);

    const idiomaCurso = getValue(["Idioma / Curso", "Idioma", "Curso"]);
    const turma = getValue(["Turma", "Turma Atual"]);
    const dataInicio = getValue(["Data de Início", "Data Inicio", "Início", "Matrícula"]);
    const fezTesteRaw = getValue([
      "Fez ou não teste de nível? (Sim/Não)",
      "Fez Teste de Nível",
      "Teste de Nível",
    ]);
    const fezTesteNivel = /sim|s|yes|y|true|1/i.test(fezTesteRaw);
    const resultadoTesteNivel = getValue([
      "Resultado do Teste de Nível",
      "Resultado Teste",
      "Nível Teste",
      "Nivel",
    ]);
    const status =
      getValue(["Status do Aluno (Ativo, Inativo, Bolsista, etc.)", "Status", "Situação"]) ||
      "Ativo";

    const diaVencRaw = getValue([
      "Data de Pagamento / Vencimento",
      "Vencimento",
      "Dia Vencimento",
      "Dia",
    ]);
    const diaVencimento = parseInt(diaVencRaw.replace(/\D/g, ""), 10) || 10;

    const formaPagamento =
      getValue([
        "Forma de Pagamento Preferencial (Ex: Boleto, Cartão, PIX)",
        "Forma de Pagamento",
        "Pagamento",
      ]) || "PIX";
    const valorMensalidade =
      parseFloat(
        getValue(["Valor da Mensalidade", "Mensalidade", "Valor"])
          .replace(/[^0-9.,]/g, "")
          .replace(",", "."),
      ) || 0;
    const descontoAplicado =
      parseFloat(
        getValue(["Desconto Aplicado", "Desconto"])
          .replace(/[^0-9.,]/g, "")
          .replace(",", "."),
      ) || 0;
    const canalAquisicao = getValue([
      "Canal de Aquisição (Como nos conheceu)",
      "Canal de Aquisição",
      "Origem",
      "Como nos conheceu",
    ]);

    const errors: string[] = [];
    if (!nome) {
      errors.push("Nome do aluno é obrigatório.");
    }

    const isValid = errors.length === 0;
    if (isValid) totalValid++;
    else totalErrors++;

    parsedRows.push({
      nome,
      dataNascimento,
      rg,
      cpf,
      genero,
      endereco,
      telefone,
      email,
      responsavelNome,
      responsavelDataNascimento,
      responsavelRg,
      responsavelCpf,
      responsavelEndereco,
      responsavelTelefone,
      responsavelEmail,
      idiomaCurso,
      turma,
      dataInicio,
      fezTesteNivel,
      resultadoTesteNivel,
      status,
      diaVencimento,
      formaPagamento,
      valorMensalidade,
      descontoAplicado,
      canalAquisicao,
      _isValid: isValid,
      _errors: errors,
    });
  }

  return {
    rows: parsedRows,
    totalValid,
    totalErrors,
    fileName: file.name,
  };
}

/**
 * Exports current list of students to an Excel workbook.
 */
export function exportStudentsToXLSX(students: any[]) {
  const rows = students.map((s) => ({
    "Nome Completo do Aluno": s.nome || "",
    "Data de Nascimento": s.dataNascimento || "",
    RG: s.rg || "",
    CPF: s.cpf || "",
    "Gênero / Pronome": s.genero || "",
    Endereço: s.endereco || "",
    Telefone: s.telefone || "",
    "E-mail": s.email || "",
    "Nome Completo do Responsável": s.responsavelNome || s.responsavel || "",
    "Data de Nascimento do Responsável": s.responsavelDataNascimento || "",
    "RG do Responsável": s.responsavelRg || "",
    "CPF do Responsável": s.responsavelCpf || "",
    "Endereço do Responsável": s.responsavelEndereco || "",
    "Telefone do Responsável": s.responsavelTelefone || "",
    "E-mail do Responsável": s.responsavelEmail || "",
    "Idioma / Curso": s.idiomaCurso || s.produtoNome || "Inglês Regular",
    Turma: s.turma || "",
    "Data de Início": s.inicio || s.dataInicio || "",
    "Fez ou não teste de nível? (Sim/Não)": s.fezTesteNivel ? "Sim" : "Não",
    "Resultado do Teste de Nível": s.nivel || s.resultadoTesteNivel || "A1",
    "Status do Aluno (Ativo, Inativo, Bolsista, etc.)": s.status || "Ativo",
    "Data de Pagamento / Vencimento": s.diaVencimento ? `Dia ${s.diaVencimento}` : "Dia 10",
    "Forma de Pagamento Preferencial (Ex: Boleto, Cartão, PIX)": s.formaPagamento || "PIX",
    "Valor da Mensalidade": s.valorMensalidade || 0,
    "Desconto Aplicado": s.descontoAplicado || 0,
    "Canal de Aquisição (Como nos conheceu)": s.canalAquisicao || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = OFFICIAL_COLUMNS.map(() => ({ wch: 24 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Alunos Exportados");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `alunos_fluency_erp_${today}.xlsx`);
}

/**
 * Saves a batch of parsed students to Supabase (and falls back gracefully).
 */
export async function saveBatchStudentsToSupabase(
  students: StudentSpreadsheetRow[],
  schoolId?: string,
): Promise<{
  savedCount: number;
  errorCount: number;
  errorMessage?: string;
}> {
  const validStudents = students.filter((s) => s._isValid !== false);
  if (validStudents.length === 0) {
    return { savedCount: 0, errorCount: 0 };
  }

  try {
    let resolvedSchoolId = schoolId;
    if (!resolvedSchoolId) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: membership } = await supabase
          .from("escola_membros")
          .select("escola_id")
          .eq("user_id", authData.user.id)
          .eq("status", "ativo")
          .limit(1)
          .maybeSingle();
        resolvedSchoolId = membership?.escola_id;
      }
    }
    if (!resolvedSchoolId)
      return {
        savedCount: 0,
        errorCount: validStudents.length,
        errorMessage: "Escola atual não identificada.",
      };
    const payload = validStudents.map((s) => ({
      escola_id: resolvedSchoolId,
      nome: s.nome,
      data_nascimento: normalizeDate(s.dataNascimento),
      rg: s.rg || null,
      cpf: s.cpf || null,
      genero: s.genero || null,
      endereco: s.endereco || null,
      telefone: s.telefone || null,
      email: s.email || null,
      responsavel_nome: s.responsavelNome || null,
      responsavel_rg: s.responsavelRg || null,
      responsavel_cpf: s.responsavelCpf || null,
      responsavel_endereco: s.responsavelEndereco || null,
      responsavel_telefone: s.responsavelTelefone || null,
      responsavel_email: s.responsavelEmail || null,
      idioma_curso: s.idiomaCurso || null,
      turma_nome: s.turma || null,
      nivel_atual: s.resultadoTesteNivel || null,
      fez_teste_nivel: Boolean(s.fezTesteNivel),
      resultado_teste_nivel: s.resultadoTesteNivel || null,
      status: normalizeStatus(s.status),
      dia_vencimento: typeof s.diaVencimento === "number" ? s.diaVencimento : 10,
      forma_pagamento_preferencial: s.formaPagamento || "PIX",
      valor_mensalidade: typeof s.valorMensalidade === "number" ? s.valorMensalidade : 0,
      desconto_aplicado: typeof s.descontoAplicado === "number" ? s.descontoAplicado : 0,
      canal_aquisicao: s.canalAquisicao || null,
    }));

    const { error } = await supabase.from("alunos").insert(payload);

    if (error) {
      return { savedCount: 0, errorCount: validStudents.length, errorMessage: error.message };
    }

    return {
      savedCount: validStudents.length,
      errorCount: 0,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error saving batch to Supabase:", errorMsg);
    return {
      savedCount: 0,
      errorCount: validStudents.length,
      errorMessage: errorMsg,
    };
  }
}

function normalizeDate(value?: string): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeStatus(value?: string): string {
  const normalized = (value || "ativo").trim().toLowerCase();
  if (["ativo", "inativo", "trancado", "concluido", "concluído", "cancelado"].includes(normalized))
    return normalized.replace("concluído", "concluido");
  return "ativo";
}
