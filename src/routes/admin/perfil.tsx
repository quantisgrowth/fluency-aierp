import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { useUser } from "@/modules/user-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — Fluency AI" },
      { name: "description", content: "Gerencie suas informações de conta." },
    ],
  }),
  component: PerfilPage,
});

const profileSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  avatar: z.string().min(1, "A sigla é obrigatória").max(3, "Máximo de 3 letras"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function PerfilPage() {
  const { adminProfile, updateProfile } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password inputs state for real-time strength meter
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: adminProfile.name,
      email: adminProfile.email,
      phone: adminProfile.phone,
      avatar: adminProfile.avatar,
    },
  });

  // Reset form values once adminProfile is loaded from localStorage
  useEffect(() => {
    reset({
      name: adminProfile.name,
      email: adminProfile.email,
      phone: adminProfile.phone,
      avatar: adminProfile.avatar,
    });
  }, [adminProfile, reset]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateProfile({ avatarImage: base64 });
      toast.success("Foto de perfil atualizada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateProfile({ avatarImage: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Foto removida. Suas iniciais serão exibidas como avatar.");
  };

  const onSubmit = (data: ProfileFormValues) => {
    setIsSaving(true);
    setTimeout(() => {
      updateProfile(data);
      setIsSaving(false);
      toast.success("Perfil atualizado com sucesso!", {
        description: "Seu nome e iniciais foram sincronizados no sistema.",
      });
    }, 800);
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: "Fraca", color: "bg-rose-500 text-rose-400" };
    if (score <= 3) return { score: 2, label: "Média", color: "bg-amber-500 text-amber-400" };
    return { score: 3, label: "Forte", color: "bg-emerald-500 text-emerald-400" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos de senha.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A confirmação de senha não coincide com a nova senha.");
      return;
    }

    toast.success("Senha atualizada com sucesso!", {
      description: "Utilize sua nova senha no seu próximo login.",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        eyebrow="Administração"
        title="Meu Perfil"
        description="Atualize seus dados cadastrais como Gestor da Escola."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Avatar preview */}
        <div className="md:col-span-1">
          <GlassCard className="p-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="relative group">
              {adminProfile.avatarImage ? (
                <img
                  src={adminProfile.avatarImage}
                  alt={adminProfile.name}
                  className="size-24 rounded-full object-cover border-2 border-primary shadow-xl ring-4 ring-primary/10"
                />
              ) : (
                <span className="grid size-24 place-items-center rounded-full border-2 border-primary bg-primary/10 text-3xl font-bold text-primary shadow-xl">
                  {adminProfile.avatar}
                </span>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleImageChange}
              />

              {/* Upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border border-hairline bg-surface text-muted-foreground hover:text-foreground shadow-lg hover:border-primary cursor-pointer transition-all hover:scale-105"
                title="Trocar foto de perfil"
                aria-label="Upload de foto"
              >
                <Camera className="size-4 text-primary" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">{adminProfile.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{adminProfile.email}</p>
              <span className="mt-2.5 inline-flex rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                Gestor da Escola
              </span>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-hairline bg-surface/80 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated hover:border-primary transition-all cursor-pointer shadow-sm"
              >
                <Camera className="size-3.5 text-primary" />
                <span>{adminProfile.avatarImage ? "Alterar Foto" : "Fazer Upload de Foto"}</span>
              </button>

              {adminProfile.avatarImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-hairline bg-surface/40 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Remover Foto</span>
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right column: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Informações Pessoais</h3>
              <p className="text-xs text-muted-foreground">Altere suas credenciais e iniciais de exibição do cabeçalho.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3.5" /> Nome Completo
                  </label>
                  <input
                    id="name"
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
                  <label htmlFor="avatar" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sigla / Iniciais (Cabeçalho)
                  </label>
                  <input
                    id="avatar"
                    maxLength={3}
                    className={`h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary transition-colors ${
                      errors.avatar ? "border-rose-500" : ""
                    }`}
                    {...register("avatar")}
                  />
                  {errors.avatar && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.avatar.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="size-3.5" /> E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary transition-colors ${
                      errors.email ? "border-rose-500" : ""
                    }`}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="size-3.5" /> Celular / WhatsApp
                  </label>
                  <input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    className={`h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary transition-colors ${
                      errors.phone ? "border-rose-500" : ""
                    }`}
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Salvar Perfil
                  </>
                )}
              </button>
            </form>
          </GlassCard>

          {/* SECURITY / CHANGE PASSWORD CARD */}
          <GlassCard className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="size-4 text-primary" /> Segurança & Senha
              </h3>
              <p className="text-xs text-muted-foreground">Altere sua senha de acesso à plataforma de gestão.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Senha Atual */}
              <div className="space-y-1.5">
                <label htmlFor="currentPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 pr-10 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title={showCurrentPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Nova Senha e Confirmar Senha */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 pr-10 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title={showNewPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua senha"
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 pr-10 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength feedback */}
              {newPassword && (
                <div className="rounded-lg border border-hairline bg-surface-elevated/20 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Força da nova senha:</span>
                    <span className={`font-semibold ${passwordStrength.color.split(" ")[1]}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1.5 h-1.5 w-full">
                    <div
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 1 ? passwordStrength.color.split(" ")[0] : "bg-white/10"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 2 ? passwordStrength.color.split(" ")[0] : "bg-white/10"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 3 ? passwordStrength.color.split(" ")[0] : "bg-white/10"
                      }`}
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="size-3.5" /> As senhas digitadas não coincidem.
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Senhas conferem!
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <ShieldCheck className="size-4" /> Alterar Senha de Gestor
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
