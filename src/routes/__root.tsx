import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ModuleProvider } from "@/modules/module-context";
import { AppShell } from "@/components/app-shell";
import { TenantProvider } from "@/modules/tenant-context";
import { UserProvider } from "@/modules/user-context";
import { AuthGuard } from "@/components/auth-guard";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fluency AI — Gestão para escolas de idiomas" },
      {
        name: "description",
        content:
          "ERP modular para escolas de idiomas: turmas por proficiência, financeiro recorrente, CRM e retenção.",
      },
      { property: "og:title", content: "Fluency AI — Gestão para escolas de idiomas" },
      {
        property: "og:description",
        content:
          "ERP modular para escolas de idiomas: turmas por proficiência, financeiro recorrente, CRM e retenção.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function allowedSchoolRoles(pathname: string): string[] {
  if (pathname.startsWith("/portal/")) return ["aluno", "responsavel"];
  if (pathname === "/admin/usuarios" || pathname === "/admin/modulos") return ["gestor"];
  if (pathname === "/financeiro") return ["gestor", "financeiro"];
  if (pathname === "/admin/inventario") return ["gestor", "secretaria", "financeiro"];
  if (["/crm", "/leads", "/captacao"].includes(pathname))
    return ["gestor", "secretaria", "comercial"];
  if (pathname === "/retencao") return ["gestor", "pedagogico"];
  if (pathname === "/alunos" || pathname === "/turmas")
    return ["gestor", "secretaria", "pedagogico", "professor"];
  return ["gestor", "secretaria", "financeiro", "pedagogico", "comercial", "professor"];
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPublic =
    pathname === "/login" || pathname === "/cadastro" || pathname === "/manager" || pathname.startsWith("/public/");
  const isPlatform = pathname === "/super-admin";
  const roles = allowedSchoolRoles(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <UserProvider>
          <ModuleProvider>
            {isPublic ? (
              <AppShell>
                <Outlet />
              </AppShell>
            ) : (
              <AuthGuard platformAdmin={isPlatform} allowedRoles={isPlatform ? undefined : roles}>
                <AppShell>
                  <Outlet />
                </AppShell>
              </AuthGuard>
            )}
          </ModuleProvider>
        </UserProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}
