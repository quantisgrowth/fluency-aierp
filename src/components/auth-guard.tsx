import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

type Props = {
  children: ReactNode;
  platformAdmin?: boolean;
  allowedRoles?: string[] | undefined;
};

export function AuthGuard({ children, platformAdmin = false, allowedRoles }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "allowed" | "login" | "denied">("loading");
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

      const result = platformAdmin
        ? await supabase
            .from("platform_admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle()
        : await supabase
            .from("escola_membros")
            .select("papel")
            .eq("user_id", user.id)
            .eq("status", "ativo");

      if (!active) return;
      if (result.error) {
        setStatus("denied");
        return;
      }
      if (platformAdmin) {
        setStatus(result.data ? "allowed" : "denied");
        return;
      }
      const memberships = Array.isArray(result.data) ? result.data : [];
      const roles = allowedRolesKey ? allowedRolesKey.split(",") : null;
      setStatus(
        memberships.some(({ papel }) => !roles || roles.includes(papel)) ? "allowed" : "denied",
      );
    }

    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) setStatus("login");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [platformAdmin, allowedRolesKey]);

  useEffect(() => {
    if (status === "login") void navigate({ to: "/login" });
  }, [status, navigate]);

  if (status === "loading" || status === "login") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Verificando acesso…
      </div>
    );
  }
  if (status === "denied") {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center text-sm">
        Acesso não autorizado. Solicite um convite à escola ou à equipe da plataforma.
      </div>
    );
  }
  return <>{children}</>;
}
