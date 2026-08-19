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

const STORAGE_KEY = "fluency-ai:modules";
const DEFAULT_ACTIVE: ModuleId[] = ["core", "financeiro", "crm", "success"];

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
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ModuleId[];
        if (Array.isArray(parsed)) setActive([...new Set([...parsed, "core" as ModuleId])]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback((id: ModuleId) => {
    setActive((prev) => {
      const def = MODULES.find((m) => m.id === id);
      if (def?.locked) return prev;
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

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
