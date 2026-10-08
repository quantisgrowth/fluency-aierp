import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type TenantPreset = "lumen" | "apex" | "british";

export type Tenant = {
  name: string;
  tagline: string;
  preset: TenantPreset;
  primaryColor: string; // CSS color string (HEX or OKLCH)
};

type TenantContextValue = {
  tenant: Tenant;
  setTenantName: (name: string) => void;
  setPrimaryColor: (color: string) => void;
  applyPreset: (preset: TenantPreset) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

const PRESETS: Record<TenantPreset, Tenant> = {
  lumen: {
    name: "Fluency AI",
    tagline: "Language Schools",
    preset: "lumen",
    primaryColor: "oklch(0.55 0.09 245)",
  },
  apex: {
    name: "Apex English",
    tagline: "High Performance",
    preset: "apex",
    primaryColor: "oklch(0.65 0.23 38)", // Vibrant Orange
  },
  british: {
    name: "British Academy",
    tagline: "Academic Excellence",
    preset: "british",
    primaryColor: "oklch(0.55 0.18 200)", // Teal/Cyan Blue
  },
};

const STORAGE_KEY = "fluency-ai:tenant";

function getContrastForeground(color: string): string {
  if (!color) return "oklch(0.99 0 0)";

  // Check if it's hex
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 145 ? "oklch(0.12 0.015 260)" : "oklch(0.99 0 0)";
  }

  // Check if it's oklch
  if (color.includes("oklch")) {
    const match = color.match(/oklch\(\s*([\d.]+)/);
    if (match) {
      const lightness = parseFloat(match[1]);
      return lightness >= 0.65 ? "oklch(0.12 0.015 260)" : "oklch(0.99 0 0)";
    }
  }

  // Check for bright color keywords (yellow, amber, gold, lime, etc.)
  const lower = color.toLowerCase();
  if (
    lower.includes("yellow") ||
    lower.includes("gold") ||
    lower.includes("amber") ||
    lower.includes("lime") ||
    lower.includes("cyan")
  ) {
    return "oklch(0.12 0.015 260)";
  }

  return "oklch(0.99 0 0)";
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant>(PRESETS.lumen);

  // Load from local storage
  useEffect(() => {
    let mounted = true;
    async function loadTenant() {
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
      const { data: school } = await supabase
        .from("escolas")
        .select("nome")
        .eq("id", membership.escola_id)
        .maybeSingle();
      if (mounted && school?.nome) {
        setTenant((current) => ({ ...current, name: school.nome, tagline: "Gestão escolar" }));
        try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      }
    }
    void loadTenant();
    return () => { mounted = false; };
  }, []);

  // Sync primary color and high-contrast foreground to CSS variables
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--primary", tenant.primaryColor);
      root.style.setProperty("--primary-foreground", getContrastForeground(tenant.primaryColor));
    }
  }, [tenant.primaryColor]);

  const saveTenant = (next: Tenant) => {
    setTenant(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const setTenantName = (name: string) => {
    saveTenant({ ...tenant, name });
  };

  const setPrimaryColor = (primaryColor: string) => {
    saveTenant({ ...tenant, primaryColor });
  };

  const applyPreset = (presetName: TenantPreset) => {
    saveTenant(PRESETS[presetName]);
  };

  return (
    <TenantContext.Provider value={{ tenant, setTenantName, setPrimaryColor, applyPreset }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
