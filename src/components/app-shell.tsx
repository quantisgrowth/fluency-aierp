import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  GraduationCap,
  HeartPulse,
  Kanban,
  LayoutDashboard,
  Lock,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  Users,
  Wallet,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useModules } from "@/modules/module-context";
import type { ModuleId } from "@/modules/registry";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  module?: ModuleId;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Pedagógico",
    items: [
      { to: "/alunos", label: "Alunos", icon: Users, module: "core" },
      { to: "/turmas", label: "Turmas", icon: BookOpen, module: "core" },
    ],
  },
  {
    label: "Operação",
    items: [
      { to: "/financeiro", label: "Financeiro", icon: Wallet, module: "financeiro" },
      { to: "/crm", label: "CRM", icon: Kanban, module: "crm" },
      { to: "/retencao", label: "Retenção", icon: HeartPulse, module: "success" },
    ],
  },
  {
    label: "Administração",
    items: [{ to: "/admin/modulos", label: "Módulos & Planos", icon: SlidersHorizontal }],
  },
];

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const stored = window.localStorage.getItem("lumen-erp:theme");
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("lumen-erp:theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 px-3 py-1">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-hairline bg-surface-elevated">
        <GraduationCap className="size-4.5 text-primary" />
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-foreground">
            Lumen ERP
          </span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Language Schools
          </span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { dark, toggle } = useTheme();
  const { isActive } = useModules();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-surface/60 backdrop-blur-xl transition-[width] duration-300 md:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex h-16 items-center justify-between pr-3">
          <Brand collapsed={collapsed} />
          <button
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "grid size-7 place-items-center rounded-md border border-hairline text-muted-foreground transition-colors hover:text-foreground",
              collapsed && "absolute right-[-14px] top-5 z-20 bg-surface",
            )}
          >
            <ChevronLeft className={cn("size-3.5 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const enabled = !item.module || isActive(item.module);
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      !enabled && "opacity-45",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && !enabled && <Lock className="ml-auto size-3" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-xl border border-hairline bg-surface-elevated/60 p-3">
            <p className="text-xs font-medium text-foreground">Plano modular</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Ative ou desative módulos a qualquer momento no simulador de planos.
            </p>
            <Link
              to="/admin/modulos"
              className="mt-3 inline-flex text-[11px] font-medium text-primary hover:underline"
            >
              Gerenciar módulos →
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-hairline bg-background/70 px-5 backdrop-blur-xl">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-hairline bg-surface/60 px-3 py-1.5 md:max-w-sm">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              placeholder="Buscar aluno, turma ou fatura"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <span className="hidden rounded-lg border border-hairline px-3 py-1.5 text-xs text-muted-foreground lg:inline">
            Unidade · Pinheiros
          </span>
          <button
            aria-label="Alternar tema"
            onClick={toggle}
            className="grid size-9 place-items-center rounded-lg border border-hairline text-muted-foreground transition-colors hover:text-foreground"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <span className="grid size-9 place-items-center rounded-full border border-hairline bg-surface-elevated text-xs font-medium text-foreground">
            FM
          </span>
        </header>
        <main className="flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
