import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, UserPlus, Trash2, Mail, ShieldAlert, Check } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { useUser, type UserRole } from "@/modules/user-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários & Permissões — Lumen ERP" },
      { name: "description", content: "Gerencie permissões e usuários da escola." },
    ],
  }),
  component: UsuariosPage,
});

const userSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["admin", "operador", "professor", "coordenador"] as const),
});

type UserFormValues = z.infer<typeof userSchema>;

function UsuariosPage() {
  const { users, addUser, deleteUser } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "professor",
    },
  });

  const onSubmit = (data: UserFormValues) => {
    addUser(data.name, data.email, data.role);
    toast.success(`Usuário ${data.name} criado com sucesso!`);
    reset();
    setShowAddForm(false);
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
        description="Gerencie os membros da equipe da escola e configure o controle de acesso baseado em cargos."
        action={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <UserPlus className="size-4" /> {showAddForm ? "Cancelar" : "Novo Usuário"}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Form to add user */}
        {showAddForm && (
          <div className="lg:col-span-3">
            <GlassCard className="p-6 max-w-xl mx-auto space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Adicionar Novo Membro</h3>
                <p className="text-xs text-muted-foreground">Cadastre um e-mail institucional e atribua um cargo de acesso.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <input
                    id="name"
                    placeholder="Ex: Amanda Lima"
                    className={`h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary ${
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
                    placeholder="amanda@lumen.edu"
                    className={`h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary ${
                      errors.email ? "border-rose-500" : ""
                    }`}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="role" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Cargo / Nível de Acesso
                  </label>
                  <select
                    id="role"
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                    {...register("role")}
                  >
                    <option value="professor">Professor</option>
                    <option value="operador">Operador</option>
                    <option value="coordenador">Coordenador</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
                >
                  Cadastrar Usuário
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
                    <th className="px-6 py-4">E-mail</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-surface/30">
                      <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${roleColors[u.role]}`}>
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            deleteUser(u.id);
                            toast.success(`Usuário ${u.name} removido.`);
                          }}
                          className="p-1.5 rounded-lg border border-hairline hover:bg-overdue/10 text-muted-foreground hover:text-overdue transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
