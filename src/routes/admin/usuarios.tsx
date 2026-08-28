import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Shield,
  UserPlus,
  Trash2,
  Mail,
  ShieldAlert,
  Key,
  Pencil,
  X,
  Building,
  CheckSquare,
  Square,
  Globe,
  Check,
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { useUser, type UserRole, type UserPermissions, type SchoolUser } from "@/modules/user-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários & Permissões — Fluency AI" },
      { name: "description", content: "Gerencie permissões e usuários da escola." },
    ],
  }),
  component: UsuariosPage,
});

const userSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["admin", "operador", "professor", "coordenador"] as const),
  companies: z.array(z.string()).default([]),
  permissions: z.object({
    crm: z.boolean(),
    financeiro: z.boolean(),
    pedagogico: z.boolean(),
    success: z.boolean(),
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

function UsuariosPage() {
  const { users, companies, addUser, updateUser, deleteUser, resetPassword } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "professor",
      companies: ["Unidade Pinheiros"],
      permissions: {
        crm: false,
        financeiro: false,
        pedagogico: true,
        success: false,
      },
    },
  });

  const selectedRole = watch("role");
  const selectedCompanies = watch("companies") || [];

  // Auto-fill default permissions when role changes
  useEffect(() => {
    if (editingUser) return; // Don't overwrite when editing
    
    if (selectedRole === "admin") {
      setValue("permissions", { crm: true, financeiro: true, pedagogico: true, success: true });
    } else if (selectedRole === "operador") {
      setValue("permissions", { crm: true, financeiro: true, pedagogico: true, success: false });
    } else if (selectedRole === "coordenador") {
      setValue("permissions", { crm: false, financeiro: false, pedagogico: true, success: true });
    } else if (selectedRole === "professor") {
      setValue("permissions", { crm: false, financeiro: false, pedagogico: true, success: false });
    }
  }, [selectedRole, setValue, editingUser]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset({
      name: "",
      email: "",
      role: "professor",
      companies: ["Unidade Pinheiros"],
      permissions: {
        crm: false,
        financeiro: false,
        pedagogico: true,
        success: false,
      },
    });
    setShowForm(true);
  };

  const handleOpenEdit = (user: SchoolUser) => {
    setEditingUser(user);
    const userCompanies = Array.isArray(user.companies)
      ? user.companies
      : user.company
        ? [user.company]
        : [];

    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      companies: userCompanies,
      permissions: { ...user.permissions },
    });
    setShowForm(true);
  };

  const toggleCompany = (companyName: string) => {
    const current = selectedCompanies;
    if (current.includes(companyName)) {
      setValue("companies", current.filter((c) => c !== companyName));
    } else {
      setValue("companies", [...current, companyName]);
    }
  };

  const selectAllCompanies = () => {
    setValue("companies", [...companies]);
  };

  const clearAllCompanies = () => {
    setValue("companies", []);
  };

  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      updateUser(editingUser.id, data.name, data.email, data.role, data.permissions, data.companies);
      toast.success(`Usuário ${data.name} atualizado com sucesso!`);
    } else {
      addUser(data.name, data.email, data.role, data.permissions, data.companies);
      toast.success(`Usuário ${data.name} criado com sucesso!`);
    }
    setShowForm(false);
    setEditingUser(null);
  };

  const roleLabels: Record<UserRole, string> = {
    admin: "Administrador",
    operador: "Operador",
    professor: "Professor",
    coordenador: "Coordenador",
  };

  const roleColors: Record<UserRole, string> = {
    admin: "bg-red-500/10 border-red-500/20 text-red-400",
    operador: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    professor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    coordenador: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };

  const roleDescriptions: Record<UserRole, string> = {
    admin: "Visão e gestão completa de todos os dados operacionais, pedagógicos e financeiros da escola.",
    operador: "Visão das turmas e indicadores, emissão de cobranças Pix/Boleto (sem poder de cancelamento), atendimento de leads e fechamento de matrículas.",
    professor: "Visão restrita às suas próprias turmas, lançamento de presenças e acompanhamento dos indicadores de risco dos seus alunos.",
    coordenador: "Visão de todas as turmas da unidade. Pode criar turmas, excluir turmas e efetuar transferências de alunos entre turmas.",
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Administração"
        title="Usuários & Permissões"
        description="Gerencie os membros da equipe da escola, associe-os a uma, várias ou nenhuma unidade específica e configure o controle de acesso por flags pedagógicas e comerciais."
        action={
          <button
            onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <UserPlus className="size-4" /> {showForm ? "Cancelar" : "Novo Usuário"}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Form Drawer Modal to Add/Edit User */}
        {showForm && (
          <div className="lg:col-span-3">
            <GlassCard className="p-6 max-w-2xl mx-auto space-y-5 relative shadow-xl border-primary/20">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="size-4.5" />
              </button>
              
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {editingUser ? "Editar Colaborador" : "Adicionar Novo Membro"}
                </h3>
                <p className="text-xs text-muted-foreground">Configure as credenciais, unidades de atuação e as flags de permissão de acesso.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* User Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Nome Completo
                    </label>
                    <input
                      id="name"
                      placeholder="Ex: Taiane Andrade"
                      className={`h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary transition-colors ${
                        errors.name ? "border-rose-500" : ""
                      }`}
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-[11px] font-medium text-rose-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      E-mail Institucional
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="taiane@fluency.ai"
                      className={`h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary transition-colors ${
                        errors.email ? "border-rose-500" : ""
                      }`}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-[11px] font-medium text-rose-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Role and Multi-Unit Assignment */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="role" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Cargo / Nível Base
                    </label>
                    <select
                      id="role"
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                      {...register("role")}
                    >
                      <option value="professor">Professor</option>
                      <option value="operador">Operador</option>
                      <option value="coordenador">Coordenador</option>
                      <option value="admin">Administrador Geral</option>
                    </select>
                  </div>

                  {/* Multi-Unit Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="size-3.5 text-primary" /> Unidades Vinculadas ({selectedCompanies.length === 0 ? "Global / Sem Vínculo" : `${selectedCompanies.length} selecionada(s)`})
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllCompanies}
                          className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                        >
                          Selecionar Todas
                        </button>
                        <span className="text-[11px] text-muted-foreground">•</span>
                        <button
                          type="button"
                          onClick={clearAllCompanies}
                          className="text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                        >
                          Nenhuma (Acesso Global)
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 p-3 rounded-xl border border-hairline bg-surface-elevated/20">
                      {companies.map((c) => {
                        const isChecked = selectedCompanies.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCompany(c)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                              isChecked
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-hairline bg-surface/40 text-muted-foreground hover:text-foreground hover:bg-surface"
                            }`}
                          >
                            <span>{c}</span>
                            <span
                              className={`size-4 rounded flex items-center justify-center border transition-colors ${
                                isChecked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-surface/80"
                              }`}
                            >
                              {isChecked && <Check className="size-3 stroke-[3]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      * Caso nenhuma unidade seja marcada, o colaborador terá <strong>Acesso Geral / Global</strong> em toda a instituição.
                    </p>
                  </div>
                </div>

                {/* Granular Permissions Checklist */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Flags de Permissões Granulares (Acesso aos Módulos)
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 rounded-xl border border-hairline bg-surface-elevated/20">
                    
                    {/* CRM flag */}
                    <Controller
                      name="permissions.crm"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground font-semibold">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="size-4.5 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                          />
                          <span>CRM / Captação</span>
                        </label>
                      )}
                    />

                    {/* Financeiro flag */}
                    <Controller
                      name="permissions.financeiro"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground font-semibold">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="size-4.5 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                          />
                          <span>Motor Financeiro</span>
                        </label>
                      )}
                    />

                    {/* Pedagógico flag */}
                    <Controller
                      name="permissions.pedagogico"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground font-semibold">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="size-4.5 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                          />
                          <span>Core Pedagógico</span>
                        </label>
                      )}
                    />

                    {/* Retenção/Success flag */}
                    <Controller
                      name="permissions.success"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground font-semibold">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="size-4.5 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                          />
                          <span>Retenção & Portais</span>
                        </label>
                      )}
                    />

                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
                >
                  {editingUser ? "Salvar Alterações" : "Cadastrar Usuário"}
                </button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Users List */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-surface-elevated/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Membro da Equipe</th>
                    <th className="px-6 py-4">Acesso / Cargo</th>
                    <th className="px-6 py-4">Unidade(s) Vinculada(s)</th>
                    <th className="px-6 py-4">E-mail</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {users.map((u) => {
                    const userCompanies = Array.isArray(u.companies)
                      ? u.companies
                      : u.company
                        ? [u.company]
                        : [];

                    return (
                      <tr key={u.id} className="transition-colors hover:bg-surface/30">
                        <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${roleColors[u.role]}`}>
                            {roleLabels[u.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {userCompanies.length === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated border border-hairline px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              <Globe className="size-3 text-primary" /> Global (Sem Restrição)
                            </span>
                          ) : userCompanies.length === companies.length ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                              Todas as Unidades ({userCompanies.length})
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {userCompanies.map((c) => (
                                <span
                                  key={c}
                                  className="rounded-md bg-surface/80 border border-hairline px-2 py-0.5 text-[11px] font-medium text-foreground"
                                >
                                  {c.replace("Unidade ", "")}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">{u.email}</td>
                        <td className="px-6 py-4 text-right flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Editar Usuário"
                            className="p-1.5 rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => resetPassword(u.id)}
                            title="Redefinir Senha por E-mail"
                            className="p-1.5 rounded-lg border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Key className="size-4" />
                          </button>
                          <button
                            onClick={() => {
                              deleteUser(u.id);
                              toast.success(`Usuário ${u.name} removido.`);
                            }}
                            title="Excluir Usuário"
                            className="p-1.5 rounded-lg border border-hairline hover:bg-overdue/10 text-muted-foreground hover:text-overdue transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Roles details sidebar */}
        <div className="space-y-4">
          <GlassCard className="p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="size-4 text-primary" /> Matriz de Permissões
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Entenda as diretrizes de acesso para cada cargo</p>
            </div>

            <div className="space-y-4">
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <div key={r} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      r === "admin" ? "bg-red-400" : r === "operador" ? "bg-orange-400" : r === "professor" ? "bg-blue-400" : "bg-purple-400"
                    }`} />
                    <p className="text-xs font-semibold text-foreground">{roleLabels[r]}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-3.5 leading-relaxed">
                    {roleDescriptions[r]}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
