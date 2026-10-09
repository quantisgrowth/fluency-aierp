import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "operador" | "professor" | "coordenador";

export type UserPermissions = {
  crm: boolean;
  financeiro: boolean;
  pedagogico: boolean;
  success: boolean;
};

export type SchoolUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  companies: string[];
  company?: string;
};

export type AdminProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  avatarImage?: string;
};

type UserContextValue = {
  users: SchoolUser[];
  companies: string[];
  adminProfile: AdminProfile;
  activeRole: UserRole;
  activeCompany: string;
  addUser: (
    name: string,
    email: string,
    role: UserRole,
    permissions: UserPermissions,
    companies: string[],
  ) => void;
  updateUser: (
    id: string,
    name: string,
    email: string,
    role: UserRole,
    permissions: UserPermissions,
    companies: string[],
  ) => void;
  deleteUser: (id: string) => void;
  updateProfile: (profile: Partial<AdminProfile>) => void;
  setActiveRole: (role: UserRole) => void;
  setActiveCompany: (company: string) => void;
  resetPassword: (id: string) => void;
  resendInvite: (id: string) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_USERS_KEY = "fluency-ai:users";
const STORAGE_PROFILE_KEY = "fluency-ai:profile";
const STORAGE_ROLE_KEY = "fluency-ai:active-role";
const STORAGE_COMPANY_KEY = "fluency-ai:active-company";

const DEFAULT_PROFILE: AdminProfile = {
  name: "",
  email: "",
  phone: "",
  avatar: "—",
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [authenticatedUserId, setAuthenticatedUserId] = useState("");
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [activeRole, setActiveRoleState] = useState<UserRole>("admin");
  const [activeCompany, setActiveCompanyState] = useState<string>("");

  // Load the authenticated user's real school identity. Legacy prototype data
  // must never cross from one school/account to another through localStorage.
  useEffect(() => {
    let mounted = true;
    async function loadIdentity() {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      if (!authUser || !mounted) return;
      setAuthenticatedUserId(authUser.id);

      const { data: membership } = await supabase
        .from("escola_membros")
        .select("escola_id,papel")
        .eq("user_id", authUser.id)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle();

      const [profileResult, unitsResult] = await Promise.all([
        supabase
          .from("usuarios")
          .select("nome,email,role")
          .eq("auth_user_id", authUser.id)
          .maybeSingle(),
        membership
          ? supabase
              .from("unidades")
              .select("nome")
              .eq("escola_id", membership.escola_id)
              .eq("status", "ativa")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!mounted) return;

      const name =
        profileResult.data?.nome?.trim() ||
        String(authUser.user_metadata?.name || authUser.user_metadata?.full_name || "").trim() ||
        authUser.email?.split("@")[0] ||
        "Usuário";
      const email = profileResult.data?.email || authUser.email || "";
      const avatar = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
      const scopedProfileKey = `${STORAGE_PROFILE_KEY}:${authUser.id}`;
      let local: Partial<AdminProfile> = {};
      try {
        local = JSON.parse(window.localStorage.getItem(scopedProfileKey) || "{}");
        window.localStorage.removeItem(STORAGE_PROFILE_KEY);
        window.localStorage.removeItem(STORAGE_USERS_KEY);
      } catch {
        /* ignore */
      }
      setAdminProfile({ name, email, phone: "", avatar: avatar || "U", ...local, email });

      const unitNames = (unitsResult.data ?? []).map((unit) => unit.nome);
      setCompanies(unitNames);
      setActiveCompanyState((current) =>
        unitNames.includes(current) ? current : unitNames[0] || "",
      );
      const roleMap: Partial<Record<string, UserRole>> = {
        gestor: "admin",
        secretaria: "operador",
        financeiro: "operador",
        comercial: "operador",
        pedagogico: "coordenador",
        professor: "professor",
      };
      setActiveRoleState(roleMap[membership?.papel || profileResult.data?.role || ""] || "admin");
      try {
        window.localStorage.removeItem(STORAGE_ROLE_KEY);
        window.localStorage.removeItem(STORAGE_COMPANY_KEY);
      } catch {
        /* ignore */
      }
    }
    void loadIdentity();
    return () => {
      mounted = false;
    };
  }, []);

  const saveUsers = (nextUsers: SchoolUser[]) => {
    setUsers(nextUsers);
    try {
      window.localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(nextUsers));
    } catch {
      /* ignore */
    }
  };

  const addUser = (
    name: string,
    email: string,
    role: UserRole,
    permissions: UserPermissions,
    companies: string[],
  ) => {
    const newUser: SchoolUser = {
      id: Date.now().toString(),
      name,
      email,
      role,
      permissions,
      companies,
    };
    saveUsers([...users, newUser]);
  };

  const updateUser = (
    id: string,
    name: string,
    email: string,
    role: UserRole,
    permissions: UserPermissions,
    companies: string[],
  ) => {
    saveUsers(
      users.map((u) => (u.id === id ? { ...u, name, email, role, permissions, companies } : u)),
    );
  };

  const deleteUser = (id: string) => {
    saveUsers(users.filter((u) => u.id !== id));
  };

  const updateProfile = (profile: Partial<AdminProfile>) => {
    setAdminProfile((prev) => {
      const next = { ...prev, ...profile };
      try {
        if (authenticatedUserId) {
          window.localStorage.setItem(
            `${STORAGE_PROFILE_KEY}:${authenticatedUserId}`,
            JSON.stringify(next),
          );
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    try {
      window.localStorage.setItem(STORAGE_ROLE_KEY, role);
    } catch {
      /* ignore */
    }
  };

  const setActiveCompany = (company: string) => {
    setActiveCompanyState(company);
    try {
      window.localStorage.setItem(STORAGE_COMPANY_KEY, company);
    } catch {
      /* ignore */
    }
  };

  const resetPassword = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    toast.success(`E-mail de redefinição de senha enviado para ${user.email}!`, {
      description: "O colaborador receberá um link temporário para criar uma nova senha.",
    });
  };

  const resendInvite = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    toast.success(`Convite reenviado para ${user.email}!`, {
      description:
        "O colaborador receberá um e-mail com o link para criar sua conta na plataforma.",
    });
  };

  return (
    <UserContext.Provider
      value={{
        users,
        companies,
        adminProfile,
        activeRole,
        activeCompany,
        addUser,
        updateUser,
        deleteUser,
        updateProfile,
        setActiveRole,
        setActiveCompany,
        resetPassword,
        resendInvite,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
