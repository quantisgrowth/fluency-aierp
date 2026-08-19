import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

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
  company: string;
};

export type AdminProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
};

type UserContextValue = {
  users: SchoolUser[];
  companies: string[];
  adminProfile: AdminProfile;
  activeRole: UserRole;
  activeCompany: string;
  addUser: (name: string, email: string, role: UserRole, permissions: UserPermissions, company: string) => void;
  updateUser: (id: string, name: string, email: string, role: UserRole, permissions: UserPermissions, company: string) => void;
  deleteUser: (id: string) => void;
  updateProfile: (profile: Partial<AdminProfile>) => void;
  setActiveRole: (role: UserRole) => void;
  setActiveCompany: (company: string) => void;
  resetPassword: (id: string) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_USERS_KEY = "fluency-ai:users";
const STORAGE_PROFILE_KEY = "fluency-ai:profile";
const STORAGE_ROLE_KEY = "fluency-ai:active-role";
const STORAGE_COMPANY_KEY = "fluency-ai:active-company";

export const COMPANIES = ["Unidade Pinheiros", "Unidade Jardins", "Unidade Paulista"];

const DEFAULT_USERS: SchoolUser[] = [
  {
    id: "1",
    name: "Julia Kern",
    email: "julia.kern@fluency.ai",
    role: "professor",
    permissions: { crm: false, financeiro: false, pedagogico: true, success: false },
    company: "Unidade Pinheiros",
  },
  {
    id: "2",
    name: "Marcos Vidal",
    email: "marcos.vidal@fluency.ai",
    role: "professor",
    permissions: { crm: false, financeiro: false, pedagogico: true, success: false },
    company: "Unidade Pinheiros",
  },
  {
    id: "3",
    name: "Ana Beatriz",
    email: "ana.beatriz@fluency.ai",
    role: "professor",
    permissions: { crm: false, financeiro: false, pedagogico: true, success: false },
    company: "Unidade Jardins",
  },
  {
    id: "4",
    name: "Peter Hall",
    email: "peter.hall@fluency.ai",
    role: "professor",
    permissions: { crm: false, financeiro: false, pedagogico: true, success: false },
    company: "Unidade Paulista",
  },
  {
    id: "5",
    name: "Rodrigo Silva",
    email: "rodrigo.silva@fluency.ai",
    role: "operador",
    permissions: { crm: true, financeiro: true, pedagogico: true, success: false },
    company: "Unidade Pinheiros",
  },
  {
    id: "6",
    name: "Clara Albuquerque",
    email: "clara.albuquerque@fluency.ai",
    role: "coordenador",
    permissions: { crm: false, financeiro: false, pedagogico: true, success: true },
    company: "Unidade Pinheiros",
  },
];

const DEFAULT_PROFILE: AdminProfile = {
  name: "Felipe Medeiros",
  email: "gestor@fluency.ai",
  phone: "(11) 98765-4321",
  avatar: "FM",
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SchoolUser[]>(DEFAULT_USERS);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [activeRole, setActiveRoleState] = useState<UserRole>("admin");
  const [activeCompany, setActiveCompanyState] = useState<string>("Unidade Pinheiros");

  // Load from local storage
  useEffect(() => {
    try {
      const storedUsers = window.localStorage.getItem(STORAGE_USERS_KEY);
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }

      const storedProfile = window.localStorage.getItem(STORAGE_PROFILE_KEY);
      if (storedProfile) {
        setAdminProfile(JSON.parse(storedProfile));
      }

      const storedRole = window.localStorage.getItem(STORAGE_ROLE_KEY);
      if (storedRole) {
        setActiveRoleState(storedRole as UserRole);
      }

      const storedCompany = window.localStorage.getItem(STORAGE_COMPANY_KEY);
      if (storedCompany) {
        setActiveCompanyState(storedCompany);
      }
    } catch {
      /* ignore */
    }
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
    company: string
  ) => {
    const newUser: SchoolUser = {
      id: Date.now().toString(),
      name,
      email,
      role,
      permissions,
      company,
    };
    saveUsers([...users, newUser]);
  };

  const updateUser = (
    id: string,
    name: string,
    email: string,
    role: UserRole,
    permissions: UserPermissions,
    company: string
  ) => {
    saveUsers(
      users.map((u) =>
        u.id === id ? { ...u, name, email, role, permissions, company } : u
      )
    );
  };

  const deleteUser = (id: string) => {
    saveUsers(users.filter((u) => u.id !== id));
  };

  const updateProfile = (profile: Partial<AdminProfile>) => {
    setAdminProfile((prev) => {
      const next = { ...prev, ...profile };
      try {
        window.localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(next));
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

  return (
    <UserContext.Provider
      value={{
        users,
        companies: COMPANIES,
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
