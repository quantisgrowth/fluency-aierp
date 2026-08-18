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
  Shield,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useModules } from "@/modules/module-context";
import type { ModuleId } from "@/modules/registry";
import { useTenant } from "@/modules/tenant-context";
import { useUser } from "@/modules/user-context";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  module?: ModuleId;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/portal/aluno", label: "Portal do Aluno", icon: GraduationCap },
    ],
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
    items: [
      { to: "/admin/modulos", label: "Módulos & Planos", icon: SlidersHorizontal },
      { to: "/admin/usuarios", label: "Usuários & Permissões", icon: Shield },
      { to: "/admin/perfil", label: "Meu Perfil", icon: UserCog },
    ],
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
  const { tenant } = useTenant();
  return (
    <Link to="/" className="flex items-center gap-3 px-3 py-1">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-hairline bg-surface-elevated">
        <GraduationCap className="size-4.5 text-primary" />
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-foreground">
            {tenant.name}
          </span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {tenant.tagline}
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
  const { activeRole, setActiveRole, adminProfile } = useUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/login") {
    return <div className="min-h-screen w-full bg-background">{children}</div>;
  }

  // Permission gating by role
  const isRoleAllowed = (role: string, path: string) => {
    if (role === "admin") return true;
    if (role === "operador") {
      // Operador: has access to turmas (view), financeiro (view, emit slips), crm (sales). Cannot access admin modulos/usuarios/perfil.
      return !["/admin/modulos", "/admin/usuarios", "/retencao"].includes(path);
    }
    if (role === "coordenador") {
      // Coordenador: has access to all turmas, creating/deleting turmas, transferring students. Cannot access financeiro, crm, retencao, admin modulos.
      return !["/financeiro", "/crm", "/retencao", "/admin/modulos"].includes(path);
    }
    if (role === "professor") {
      // Professor: has access only to their turmas. Cannot access financeiro, crm, retencao, admin.
      return ["/", "/portal/aluno", "/turmas", "/admin/perfil"].includes(path);
    }
    return true;
  };

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
                const allowedByRole = isRoleAllowed(activeRole, item.to);
                const enabled = allowedByRole && (!item.module || isActive(item.module));
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
                      !enabled && "opacity-40 pointer-events-none",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && !allowedByRole && <Lock className="ml-auto size-3" />}
                    {!collapsed && allowedByRole && !enabled && <Lock className="ml-auto size-3" />}
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
          
          {/* Simulated role switcher in header */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Cargo:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="rounded-lg border border-hairline bg-surface/60 px-2 py-1 text-xs font-semibold text-foreground outline-none cursor-pointer focus:border-primary hover:bg-surface transition-all"
            >
              <option value="admin">Administrador</option>
              <option value="operador">Operador</option>
              <option value="professor">Professor</option>
              <option value="coordenador">Coordenador</option>
            </select>
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
          
          <Link
            to="/admin/perfil"
            title="Meu Perfil"
            className="grid size-9 place-items-center rounded-full border border-hairline bg-surface-elevated text-xs font-semibold text-foreground hover:border-primary transition-all cursor-pointer"
          >
            {adminProfile.avatar}
          </Link>
        </header>
        <main className="flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
