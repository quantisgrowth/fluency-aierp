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

const DEFAULT_ACTIVE: ModuleId[] = [];

type ModuleContextValue = {
  active: ModuleId[];
  isActive: (id: ModuleId) => boolean;
  toggle: (id: ModuleId) => void;
  monthlyTotal: number;
};

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ModuleId[]>(DEFAULT_ACTIVE);

  useEffect(() => {
    let mounted = true;
    const loadContractedModules = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: membership } = await supabase
        .from("escola_membros")
        .select("escola_id")
        .eq("user_id", authData.user.id)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle();
      if (!membership) return;
      const { data: modules, error } = await supabase
        .from("escola_modulos")
        .select("modulo_id,status,fim_em")
        .eq("escola_id", membership.escola_id)
        .in("status", ["trial", "ativo", "cortesia"]);
      if (error || !mounted) return;
      const now = Date.now();
      const enabled = (modules ?? [])
        .filter((item) => !item.fim_em || new Date(item.fim_em).getTime() > now)
        .map((item) => item.modulo_id)
        .filter((id): id is ModuleId => MODULES.some((module) => module.id === id));
      setActive([...new Set(enabled)]);
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
    const monthlyTotal = MODULES.filter((m) => active.includes(m.id)).reduce(
      (sum, m) => sum + m.price,
      0,
    );
    return { active, isActive, toggle, monthlyTotal };
  }, [active, toggle]);

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModules must be used within ModuleProvider");
  return ctx;
}
