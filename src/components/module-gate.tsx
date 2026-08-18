import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/kit/glass-card";
import { useModules } from "@/modules/module-context";
import { moduleById, type ModuleId } from "@/modules/registry";

export function ModuleGate({ module, children }: { module: ModuleId; children: ReactNode }) {
  const { isActive } = useModules();
  if (isActive(module)) return <>{children}</>;

  const def = moduleById(module);
  return (
    <div className="mx-auto max-w-xl py-16">
      <GlassCard className="p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl border border-hairline bg-surface-elevated">
          <Lock className="size-5 text-muted-foreground" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          {def.name} não está no seu plano
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{def.description}</p>
        <Link
          to="/admin/modulos"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ativar módulo
        </Link>
      </GlassCard>
    </div>
  );
}
