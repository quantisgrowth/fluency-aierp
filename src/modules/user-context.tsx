import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { activeMemberships, activeSchoolStorageKey } from "@/lib/organization";
import { MODULES, type ModuleId } from "@/modules/registry";

export type UserRole = "admin" | "operador" | "professor" | "coordenador";

export type UserPermissions = Record<ModuleId, boolean>;

const emptyModulePermissions = (): UserPermissions =>
  Object.fromEntries(MODULES.map((module) => [module.id, false])) as UserPermissions;

export const defaultModulePermissions = (role: UserRole): UserPermissions => {
  const permissions = emptyModulePermissions();
  const defaults: Record<UserRole, ModuleId[]> = {
    admin: MODULES.map((module) => module.id),
    operador: ["core", "financeiro", "crm", "captacao", "portal_aluno"],
    coordenador: ["core", "success", "captacao", "portal_aluno"],
    professor: ["core", "portal_aluno"],
  };
  defaults[role].forEach((moduleId) => {
    permissions[moduleId] = true;
  });
  return permissions;
};

const normalizeModulePermissions = (value: unknown, role: UserRole): UserPermissions => {
  const defaults = defaultModulePermissions(role);
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const saved = value as Record<string, unknown>;
  MODULES.forEach((module) => {
    if (typeof saved[module.id] === "boolean") defaults[module.id] = saved[module.id] as boolean;
  });
  return defaults;
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
  avatarImage?: string | undefined;
};

export type SchoolOption = { id: string; name: string; role: string };
export type UnitOption = { id: string; name: string };

type UserContextValue = {
  users: SchoolUser[];
  companies: string[];
  schools: SchoolOption[];
  units: UnitOption[];
  activeSchoolId: string;
  activeUnitId: string;
  adminProfile: AdminProfile;
  activeRole: UserRole;
  activePermissions: UserPermissions;
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
  setActiveSchoolId: (schoolId: string) => void;
  setActiveUnitId: (unitId: string) => void;
  resetPassword: (id: string) => void;
  resendInvite: (id: string) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_USERS_KEY = "fluency-ai:users";
const STORAGE_PROFILE_KEY = "fluency-ai:profile";
const STORAGE_ROLE_KEY = "fluency-ai:active-role";
const STORAGE_COMPANY_KEY = "fluency-ai:active-company";
const activeUnitStorageKey = (userId: string, schoolId: string) =>
  `fluency-ai:active-unit:${userId}:${schoolId}`;

const DEFAULT_PROFILE: AdminProfile = {
  name: "",
  email: "",
  phone: "",
  avatar: "—",
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [authenticatedUserId, setAuthenticatedUserId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [activeUnitId, setActiveUnitIdState] = useState("");
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [activeRole, setActiveRoleState] = useState<UserRole>("admin");
  const [activePermissions, setActivePermissions] = useState<UserPermissions>(
    defaultModulePermissions("admin"),
  );
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

      const { memberships } = await activeMemberships();
      const schoolIds = memberships.map((item) => item.escola_id);
      const { data: schoolRows } = schoolIds.length
        ? await supabase.from("escolas").select("id,nome").in("id", schoolIds).order("nome")
        : { data: [] };
      const schoolOptions = (schoolRows ?? []).map((school) => ({
        id: school.id,
        name: school.nome,
        role: memberships.find((item) => item.escola_id === school.id)?.papel || "",
      }));
      setSchools(schoolOptions);

      let preferredSchoolId = "";
      try {
        preferredSchoolId = window.localStorage.getItem(activeSchoolStorageKey(authUser.id)) || "";
      } catch {
        /* ignore */
      }
      const selectedSchoolId = schoolOptions.some((school) => school.id === preferredSchoolId)
        ? preferredSchoolId
        : schoolOptions.length === 1
          ? schoolOptions[0]!.id
          : "";
      const membership = memberships.find((item) => item.escola_id === selectedSchoolId);
      if (selectedSchoolId) {
        try {
          window.localStorage.setItem(activeSchoolStorageKey(authUser.id), selectedSchoolId);
        } catch {
          /* ignore */
        }
      }

      const [profileResult, unitsResult] = await Promise.all([
        supabase
          .from("usuarios")
          .select("nome,email,role,permissoes_modulos")
          .eq("auth_user_id", authUser.id)
          .eq("escola_id", selectedSchoolId || "00000000-0000-0000-0000-000000000000")
          .maybeSingle(),
        membership
          ? supabase
              .from("unidades")
              .select("id,nome")
              .eq("escola_id", membership.escola_id)
              .eq("status", "ativa")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!mounted) return;
      setSchoolId(selectedSchoolId);

      const name =
        profileResult.data?.nome?.trim() ||
        String(
          authUser.user_metadata?.["name"] || authUser.user_metadata?.["full_name"] || "",
        ).trim() ||
        authUser.email?.split("@")[0] ||
        "Usuário";
      const email = profileResult.data?.email || authUser.email || "";
      const avatar = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part: string) => part[0])
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
      setAdminProfile({ name, phone: "", avatar: avatar || "U", ...local, email });

      const unitOptions = (unitsResult.data ?? []).map((unit) => ({
        id: unit.id,
        name: unit.nome,
      }));
      const unitNames = unitOptions.map((unit) => unit.name);
      setUnits(unitOptions);
      setCompanies(unitNames);
      let storedUnitId = "";
      try {
        storedUnitId = selectedSchoolId
          ? window.localStorage.getItem(activeUnitStorageKey(authUser.id, selectedSchoolId)) || ""
          : "";
      } catch {
        /* ignore */
      }
      const selectedUnitId = unitOptions.some((unit) => unit.id === storedUnitId)
        ? storedUnitId
        : unitOptions.length === 1
          ? unitOptions[0]!.id
          : unitOptions.length > 1
            ? "all"
            : "";
      setActiveUnitIdState(selectedUnitId);
      setActiveCompanyState(
        selectedUnitId === "all"
          ? "Todas as Unidades"
          : unitOptions.find((unit) => unit.id === selectedUnitId)?.name || "",
      );
      const roleMap: Partial<Record<string, UserRole>> = {
        gestor: "admin",
        secretaria: "operador",
        financeiro: "operador",
        comercial: "operador",
        pedagogico: "coordenador",
        professor: "professor",
      };
      const currentRole = roleMap[membership?.papel || profileResult.data?.role || ""] || "admin";
      setActiveRoleState(currentRole);
      setActivePermissions(
        currentRole === "admin"
          ? defaultModulePermissions("admin")
          : normalizeModulePermissions(profileResult.data?.permissoes_modulos, currentRole),
      );
      if (selectedSchoolId) {
        const { data: directory } = await supabase
          .from("usuarios")
          .select("id,nome,email,role,permissoes_modulos")
          .eq("escola_id", selectedSchoolId)
          .eq("status", "ativo")
          .order("nome");
        if (mounted) {
          setUsers(
            (directory ?? []).map((item) => {
              const mappedRole: UserRole =
                item.role === "professor"
                  ? "professor"
                  : item.role === "pedagogico"
                    ? "coordenador"
                    : item.role === "gestor"
                      ? "admin"
                      : "operador";
              return {
                id: item.id,
                name: item.nome,
                email: item.email,
                role: mappedRole,
                permissions: normalizeModulePermissions(item.permissoes_modulos, mappedRole),
                companies: unitNames,
              };
            }),
          );
        }
      }
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
    const temporaryId = crypto.randomUUID();
    const newUser: SchoolUser = {
      id: temporaryId,
      name,
      email,
      role,
      permissions,
      companies,
    };
    saveUsers([...users, newUser]);
    if (schoolId) {
      const roleMap: Record<UserRole, string> = {
        admin: "gestor",
        operador: "secretaria",
        professor: "professor",
        coordenador: "pedagogico",
      };
      void supabase
        .from("usuarios")
        .insert({
          escola_id: schoolId,
          nome: name.trim(),
          email: email.trim().toLowerCase(),
          role: roleMap[role],
          permissoes_modulos: permissions,
          cargo: role === "coordenador" ? "Coordenador" : role === "professor" ? "Professor" : null,
          status: "ativo",
        })
        .select("id")
        .single()
        .then(({ data, error }) => {
          if (error) {
            setUsers((current) => current.filter((item) => item.id !== temporaryId));
            toast.error(`Não foi possível salvar o usuário: ${error.message}`);
            return;
          }
          setUsers((current) =>
            current.map((item) => (item.id === temporaryId ? { ...item, id: data.id } : item)),
          );
        });
    }
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
    if (schoolId) {
      const roleMap: Record<UserRole, string> = {
        admin: "gestor",
        operador: "secretaria",
        professor: "professor",
        coordenador: "pedagogico",
      };
      void supabase
        .from("usuarios")
        .update({
          nome: name.trim(),
          email: email.trim().toLowerCase(),
          role: roleMap[role],
          cargo: role === "coordenador" ? "Coordenador" : role === "professor" ? "Professor" : null,
        })
        .eq("id", id)
        .eq("escola_id", schoolId)
        .then(({ error }) => {
          if (error) toast.error(`Não foi possível atualizar o usuário: ${error.message}`);
        });
      void supabase
        .rpc("school_set_user_module_permissions", {
          _school_id: schoolId,
          _user_id: id,
          _permissions: permissions,
        })
        .then(({ error }) => {
          if (error) toast.error(`Não foi possível atualizar as permissões: ${error.message}`);
        });
    }
  };

  const deleteUser = (id: string) => {
    saveUsers(users.filter((u) => u.id !== id));
    if (schoolId) {
      void supabase
        .from("usuarios")
        .delete()
        .eq("id", id)
        .eq("escola_id", schoolId)
        .then(({ error }) => {
          if (error) toast.error(`Não foi possível remover o usuário: ${error.message}`);
        });
    }
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

  const setActiveSchoolId = (nextSchoolId: string) => {
    if (!authenticatedUserId || !schools.some((school) => school.id === nextSchoolId)) return;
    window.localStorage.setItem(activeSchoolStorageKey(authenticatedUserId), nextSchoolId);
    window.location.assign("/");
  };

  const setActiveUnitId = (nextUnitId: string) => {
    if (!authenticatedUserId || !schoolId) return;
    if (nextUnitId !== "all" && !units.some((unit) => unit.id === nextUnitId)) return;
    window.localStorage.setItem(activeUnitStorageKey(authenticatedUserId, schoolId), nextUnitId);
    setActiveUnitIdState(nextUnitId);
    setActiveCompanyState(
      nextUnitId === "all"
        ? "Todas as Unidades"
        : units.find((unit) => unit.id === nextUnitId)?.name || "",
    );
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
        schools,
        units,
        activeSchoolId: schoolId,
        activeUnitId,
        adminProfile,
        activeRole,
        activePermissions,
        activeCompany,
        addUser,
        updateUser,
        deleteUser,
        updateProfile,
        setActiveRole,
        setActiveCompany,
        setActiveSchoolId,
        setActiveUnitId,
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
