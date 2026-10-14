import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MODULES, type ModuleId } from "./registry";
import { supabase } from "@/lib/supabase";
import { currentMembership } from "@/lib/organization";

const DEFAULT_ACTIVE: ModuleId[] = [];

export type SchoolModuleAccess = {
  id: ModuleId;
  status: "disponivel" | "trial" | "ativo" | "cortesia" | "suspenso" | "cancelado";
  origin: string;
  contractedPrice: number;
  includedInPlan: boolean;
  requiresConfiguration: boolean;
};

export type SchoolSubscription = {
  planId: string;
  planName: string;
  cycle: "mensal" | "anual";
  status: "trial" | "ativo" | "inadimplente" | "suspenso" | "cancelado";
  baseValue: number;
  additionalValue: number;
  totalValue: number;
  monthlyValue: number;
  nextBillingDate: string | null;
  paymentMethod: string | null;
  paymentSummary: string | null;
};

type ModuleContextValue = {
  active: ModuleId[];
  access: SchoolModuleAccess[];
  subscription: SchoolSubscription | null;
  loading: boolean;
  isActive: (id: ModuleId) => boolean;
  toggle: (id: ModuleId) => void;
  monthlyTotal: number;
};

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ModuleId[]>(DEFAULT_ACTIVE);
  const [access, setAccess] = useState<SchoolModuleAccess[]>([]);
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadContractedModules = async () => {
      setLoading(true);
      const membership = await currentMembership().catch(() => null);
      if (!membership) {
        if (mounted) setLoading(false);
        return;
      }
      const [modulesResult, contractResult] = await Promise.all([
        supabase
          .from("escola_modulos")
          .select("modulo_id,status,fim_em,origem,preco_contratado")
          .eq("escola_id", membership.escola_id),
        supabase
          .from("contratos_escola")
          .select(
            "plano_id,ciclo,status,valor_base,valor_adicionais,valor_total,mrr,proxima_cobranca,forma_pagamento,pagamento_resumo",
          )
          .eq("escola_id", membership.escola_id)
          .maybeSingle(),
      ]);
      let contract = contractResult.data;
      if (contractResult.error?.code === "42703") {
        const fallback = await supabase
          .from("contratos_escola")
          .select(
            "plano_id,ciclo,status,valor_base,valor_adicionais,valor_total,mrr,proxima_cobranca",
          )
          .eq("escola_id", membership.escola_id)
          .maybeSingle();
        contract = fallback.data
          ? { ...fallback.data, forma_pagamento: null, pagamento_resumo: null }
          : null;
      }
      if (modulesResult.error || !mounted) {
        if (mounted) setLoading(false);
        return;
      }

      const planId = contract?.plano_id;
      const [planResult, planModulesResult, catalogResult] = await Promise.all([
        planId
          ? supabase.from("planos_catalogo").select("id,nome").eq("id", planId).maybeSingle()
          : Promise.resolve({ data: null }),
        planId
          ? supabase.from("plano_modulos").select("modulo_id,incluido").eq("plano_id", planId)
          : Promise.resolve({ data: [] }),
        supabase.from("modulos_catalogo").select("id,requer_configuracao"),
      ]);
      const now = Date.now();
      const modules = modulesResult.data ?? [];
      const enabled = modules
        .filter((item) => !item.fim_em || new Date(item.fim_em).getTime() > now)
        .filter((item) => ["trial", "ativo", "cortesia"].includes(item.status))
        .map((item) => item.modulo_id)
        .filter((id): id is ModuleId => MODULES.some((module) => module.id === id));
      setActive([...new Set(enabled)]);
      setAccess(
        modules
          .filter((item) => MODULES.some((module) => module.id === item.modulo_id))
          .map((item) => ({
            id: item.modulo_id as ModuleId,
            status: item.status as SchoolModuleAccess["status"],
            origin: item.origem,
            contractedPrice: Number(item.preco_contratado || 0),
            includedInPlan: Boolean(
              planModulesResult.data?.find((planModule) => planModule.modulo_id === item.modulo_id)
                ?.incluido,
            ),
            requiresConfiguration: Boolean(
              catalogResult.data?.find((catalog) => catalog.id === item.modulo_id)
                ?.requer_configuracao,
            ),
          })),
      );
      setSubscription(
        contract
          ? {
              planId: contract.plano_id,
              planName: planResult.data?.nome || contract.plano_id,
              cycle: contract.ciclo,
              status: contract.status,
              baseValue: Number(contract.valor_base || 0),
              additionalValue: Number(contract.valor_adicionais || 0),
              totalValue: Number(contract.valor_total || 0),
              monthlyValue: Number(contract.mrr || 0),
              nextBillingDate: contract.proxima_cobranca,
              paymentMethod: contract.forma_pagamento || null,
              paymentSummary: contract.pagamento_resumo || null,
            }
          : null,
      );
      setLoading(false);
    };
    void loadContractedModules();
    const refresh = () => void loadContractedModules();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const toggle = useCallback((_id: ModuleId) => {}, []);

  const value = useMemo<ModuleContextValue>(() => {
    const isActive = (id: ModuleId) => active.includes(id);
    const monthlyTotal = subscription?.monthlyValue ?? 0;
    return { active, access, subscription, loading, isActive, toggle, monthlyTotal };
  }, [access, active, loading, subscription, toggle]);

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModules must be used within ModuleProvider");
  return ctx;
}
