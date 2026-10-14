import { supabase } from "@/lib/supabase";

export const activeSchoolStorageKey = (userId: string) => `fluency-ai:active-school:${userId}`;

export type ActiveMembership = {
  escola_id: string;
  papel: string;
};

export async function activeMemberships(): Promise<{
  userId: string;
  memberships: ActiveMembership[];
}> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Entre na sua conta para continuar.");

  const { data, error } = await supabase
    .from("escola_membros")
    .select("escola_id,papel")
    .eq("user_id", authData.user.id)
    .eq("status", "ativo")
    .order("created_at");
  if (error) throw error;

  return { userId: authData.user.id, memberships: data ?? [] };
}

export async function currentMembership(): Promise<ActiveMembership> {
  const { userId, memberships } = await activeMemberships();
  if (!memberships.length) throw new Error("Nenhuma escola ativa foi encontrada.");

  let preferredSchoolId = "";
  try {
    preferredSchoolId = window.localStorage.getItem(activeSchoolStorageKey(userId)) || "";
  } catch {
    /* ignore */
  }

  const selected = memberships.find((item) => item.escola_id === preferredSchoolId);
  if (selected) return selected;
  if (memberships.length > 1) {
    throw new Error("Selecione a escola que deseja acessar no topo da plataforma.");
  }

  const onlyMembership = memberships[0]!;
  try {
    window.localStorage.setItem(activeSchoolStorageKey(userId), onlyMembership.escola_id);
  } catch {
    /* ignore */
  }
  return onlyMembership;
}
