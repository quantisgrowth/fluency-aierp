import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl transition-all duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
