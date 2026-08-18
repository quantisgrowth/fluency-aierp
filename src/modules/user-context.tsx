import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "admin" | "operador" | "professor" | "coordenador";

export type SchoolUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AdminProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
};

type UserContextValue = {
  users: SchoolUser[];
  adminProfile: AdminProfile;
  activeRole: UserRole;
  addUser: (name: string, email: string, role: UserRole) => void;
  updateUser: (id: string, name: string, email: string, role: UserRole) => void;
  deleteUser: (id: string) => void;
  updateProfile: (profile: Partial<AdminProfile>) => void;
  setActiveRole: (role: UserRole) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_USERS_KEY = "lumen-erp:users";
const STORAGE_PROFILE_KEY = "lumen-erp:profile";
const STORAGE_ROLE_KEY = "lumen-erp:active-role";

const DEFAULT_USERS: SchoolUser[] = [
  { id: "1", name: "Julia Kern", email: "julia.kern@lumen.edu", role: "professor" },
  { id: "2", name: "Marcos Vidal", email: "marcos.vidal@lumen.edu", role: "professor" },
  { id: "3", name: "Ana Beatriz", email: "ana.beatriz@lumen.edu", role: "professor" },
  { id: "4", name: "Peter Hall", email: "peter.hall@lumen.edu", role: "professor" },
  { id: "5", name: "Rodrigo Silva", email: "rodrigo.silva@lumen.edu", role: "operador" },
  { id: "6", name: "Clara Albuquerque", email: "clara.albuquerque@lumen.edu", role: "coordenador" },
];

const DEFAULT_PROFILE: AdminProfile = {
  name: "Felipe Medeiros",
  email: "gestor@lumen.edu",
  phone: "(11) 98765-4321",
  avatar: "FM",
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SchoolUser[]>(DEFAULT_USERS);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [activeRole, setActiveRoleState] = useState<UserRole>("admin");

  // Load from local storage
  useEffect(() => {
    try {
      const storedUsers = window.localStorage.getItem(STORAGE_USERS_KEY);
      if (storedUsers) setUsers(JSON.parse(storedUsers));

      const storedProfile = window.localStorage.getItem(STORAGE_PROFILE_KEY);
      if (storedProfile) setAdminProfile(JSON.parse(storedProfile));

      const storedRole = window.localStorage.getItem(STORAGE_ROLE_KEY);
      if (storedRole) setActiveRoleState(storedRole as UserRole);
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

  const addUser = (name: string, email: string, role: UserRole) => {
    const newUser: SchoolUser = {
      id: Date.now().toString(),
      name,
      email,
      role,
    };
    saveUsers([...users, newUser]);
  };

  const updateUser = (id: string, name: string, email: string, role: UserRole) => {
    saveUsers(
      users.map((u) => (u.id === id ? { ...u, name, email, role } : u))
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

  return (
    <UserContext.Provider
      value={{
        users,
        adminProfile,
        activeRole,
        addUser,
        updateUser,
        deleteUser,
        updateProfile,
        setActiveRole,
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
