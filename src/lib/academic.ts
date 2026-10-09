import { supabase } from "@/lib/supabase";

export type Course = {
  id: string;
  nome: string;
  codigo: string;
  nivel: string | null;
  valor_base: number;
  ativo: boolean;
  categoria: "idioma" | "profissionalizante" | "livre" | "preparatorio" | "outro";
  exige_nivelamento: boolean;
  exige_avaliacao_pratica: boolean;
  exige_estagio: boolean;
  exige_projeto_final: boolean;
  emite_certificado: boolean;
  frequencia_minima: number;
};

export type SchoolClass = {
  id: string;
  curso_id: string | null;
  nome: string;
  nivel: string | null;
  status: string;
  capacidade_maxima: number;
  professor_nome: string | null;
  dias_semana: string[] | null;
  horario_inicio: string | null;
  modalidade: string | null;
  coordenador_nome: string | null;
  faixa_etaria: string | null;
  criterio_entrada: string | null;
  ementa: string | null;
  objetivos: string | null;
  frequencia_minima: number | null;
};

export type Student = {
  id: string;
  created_at: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  nivel_atual: string | null;
  status: string;
  responsavel_nome: string | null;
  turma_atual_id: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  endereco: string | null;
  nome_social: string | null;
  profissao_ou_escola: string | null;
  idioma_principal: string | null;
  necessidades_acessibilidade: string | null;
  contato_emergencia_nome: string | null;
  contato_emergencia_telefone: string | null;
  objetivo_aprendizagem: string | null;
  meta_academica: string | null;
  observacoes: string | null;
  foto_url: string | null;
  responsavel_email?: string | null;
  responsavel_telefone?: string | null;
  responsavel_contato?: string | null;
};

export type StudentHistory = { id: string; tipo: string; titulo: string; descricao: string | null; created_at: string };

export type Enrollment = {
  id: string;
  aluno_id: string;
  turma_id: string;
  status: string;
};

export async function currentSchoolId(): Promise<string> {
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user.user) throw new Error("Entre na sua conta para continuar.");
  const { data, error } = await supabase
    .from("escola_membros")
    .select("escola_id")
    .eq("user_id", user.user.id)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.escola_id) throw new Error("Nenhuma escola ativa foi encontrada.");
  return data.escola_id;
}

export function readableError(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
