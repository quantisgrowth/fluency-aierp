import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant>(PRESETS.lumen);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Tenant;
        setTenant(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Sync primary color to CSS variable
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--primary", tenant.primaryColor);
      
      // Let's also adjust --ring or check if we should update it
      // For simple white label, changing --primary overrides almost all action buttons
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
