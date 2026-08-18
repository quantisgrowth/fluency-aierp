import { cn } from "@/lib/utils";

type Tone = "paid" | "due" | "overdue" | "churn" | "neutral";

const tones: Record<Tone, string> = {
  paid: "text-paid border-paid/30 bg-paid/10",
  due: "text-due border-due/30 bg-due/10",
  overdue: "text-overdue border-overdue/30 bg-overdue/10",
  churn: "text-churn border-churn/30 bg-churn/10",
  neutral: "text-muted-foreground border-border bg-muted/40",
};

export function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
