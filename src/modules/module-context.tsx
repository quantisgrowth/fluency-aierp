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
      const membership = await currentMembership().catch(() => null);
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
