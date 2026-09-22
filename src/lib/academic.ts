import { supabase } from "@/lib/supabase";

export type Course = {
  id: string;
  nome: string;
  codigo: string;
  nivel: string | null;
  valor_base: number;
  ativo: boolean;
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
};

export type Student = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  nivel_atual: string | null;
  status: string;
  responsavel_nome: string | null;
  turma_atual_id: string | null;
};

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
