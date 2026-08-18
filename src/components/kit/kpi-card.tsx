import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "paid" | "overdue";
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span className="rounded-lg border border-hairline bg-surface-elevated/60 p-1.5 text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p
        className={cn(
          "tabular mt-4 text-3xl font-semibold",
          tone === "overdue" ? "text-overdue" : "text-foreground",
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span
            className={cn(
              "tabular inline-flex items-center gap-0.5 font-medium",
              positive ? "text-paid" : "text-overdue",
            )}
          >
            {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </GlassCard>
  );
}
