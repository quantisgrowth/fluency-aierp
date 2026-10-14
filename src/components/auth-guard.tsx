import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { clearAccessSnapshot, readAccessSnapshot } from "@/lib/auth-access-cache";
import {
  activeMemberships,
  activeSchoolStorageKey,
  type ActiveMembership,
} from "@/lib/organization";

type Props = {
  children: ReactNode;
  platformAdmin?: boolean;
  allowedRoles?: string[] | undefined;
};

type SchoolChoice = ActiveMembership & { nome: string };
type GuardStatus = "loading" | "allowed" | "login" | "denied" | "select-school";

export function AuthGuard({ children, platformAdmin = false, allowedRoles }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GuardStatus>("loading");
  const [schoolChoices, setSchoolChoices] = useState<SchoolChoice[]>([]);
  const allowedRolesKey = allowedRoles?.join(",") ?? "";

  useEffect(() => {
    let active = true;
    async function check() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !user) {
        setStatus("login");
        return;
      }

      if (platformAdmin) {
        const cached = readAccessSnapshot();
        if (cached?.userId === user.id && cached.platformAdmin !== undefined) {
          setStatus(cached.platformAdmin ? "allowed" : "denied");
          return;
        }
        const result = await supabase
          .from("platform_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!active) return;
        setStatus(!result.error && result.data ? "allowed" : "denied");
        return;
      }

      try {
        const { memberships } = await activeMemberships();
        if (!active) return;
        if (!memberships.length) {
          setStatus("denied");
          return;
        }

        let selectedSchoolId = "";
        try {
          selectedSchoolId = window.localStorage.getItem(activeSchoolStorageKey(user.id)) || "";
        } catch {
          /* ignore */
        }
        let membership = memberships.find((item) => item.escola_id === selectedSchoolId);
        if (!membership && memberships.length === 1) {
          membership = memberships[0];
          try {
            window.localStorage.setItem(activeSchoolStorageKey(user.id), membership!.escola_id);
          } catch {
            /* ignore */
          }
        }
        if (!membership) {
          const { data: schools } = await supabase
            .from("escolas")
            .select("id,nome")
            .in(
              "id",
              memberships.map((item) => item.escola_id),
            )
            .order("nome");
          if (!active) return;
          setSchoolChoices(
            memberships.map((item) => ({
              ...item,
              nome: schools?.find((school) => school.id === item.escola_id)?.nome || "Escola",
            })),
          );
          setStatus("select-school");
          return;
        }

        const roles = allowedRolesKey ? allowedRolesKey.split(",") : null;
        setStatus(!roles || roles.includes(membership.papel) ? "allowed" : "denied");
      } catch {
        if (active) setStatus("denied");
      }
    }

    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) {
        clearAccessSnapshot();
        setStatus("login");
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [platformAdmin, allowedRolesKey]);

  useEffect(() => {
    if (status === "login") void navigate({ to: "/login" });
    if (status === "denied") {
      clearAccessSnapshot();
      void navigate({ to: platformAdmin ? "/manager" : "/login" });
    }
  }, [status, navigate, platformAdmin]);

  const selectSchool = (schoolId: string) => {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !schoolChoices.some((school) => school.escola_id === schoolId)) return;
      window.localStorage.setItem(activeSchoolStorageKey(data.user.id), schoolId);
      window.location.reload();
    });
  };

  if (status === "select-school") {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
          <h1 className="text-xl font-semibold">Selecione a escola</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha qual ambiente deseja acessar. As permissões serão aplicadas somente a essa
            escola.
          </p>
          <div className="mt-5 grid gap-2">
            {schoolChoices.map((school) => (
              <button
                className="rounded-xl border px-4 py-3 text-left transition hover:border-primary hover:bg-muted"
                key={school.escola_id}
                onClick={() => selectSchool(school.escola_id)}
                type="button"
              >
                <span className="block font-medium">{school.nome}</span>
                <span className="text-xs capitalize text-muted-foreground">{school.papel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading" || status === "login" || status === "denied") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {status === "denied" ? "Redirecionando para o login…" : "Verificando acesso…"}
      </div>
    );
  }
  return <>{children}</>;
}
