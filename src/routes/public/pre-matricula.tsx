import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Mail,
  Phone,
  User,
  AlertCircle,
  MapPin,
  CreditCard,
  Check
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { toast } from "sonner";

export const Route = createFileRoute("/public/pre-matricula")({
  head: () => ({
    meta: [
      { title: "Pré-Matrícula Online — Fluency AI" },
      { name: "description", content: "Faça sua pré-matrícula de forma rápida e segura e garanta sua vaga na nossa escola de idiomas." },
    ],
  }),
  component: PublicPreMatriculaPage,
});

function PublicPreMatriculaPage() {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  
  // Form Steps: 0 = Welcome, 1 = Personal, 2 = Address, 3 = Billing/Payment, 4 = Success
  const [step, setStep] = useState(0);

  // Form Fields
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("+55 ");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const [isRespFinanceiro, setIsRespFinanceiro] = useState(true);
  const [respNome, setRespNome] = useState("");
  const [respCpf, setRespCpf] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "boleto" | "cartao">("pix");

  // Load configuration
  useEffect(() => {
    try {
      const unlocked = window.localStorage.getItem("fluency-ai:captacao:premium-unlocked");
      const isUnlockedVal = unlocked !== null ? JSON.parse(unlocked) : false;
      setIsUnlocked(isUnlockedVal);

      const activeStatus = window.localStorage.getItem("fluency-ai:captacao:formStatus:matricula");
      const isActiveVal = activeStatus !== null ? JSON.parse(activeStatus) : false;
      setIsActive(isActiveVal);
    } catch {
      setIsUnlocked(false);
      setIsActive(false);
    }
  }, []);

  // Simulating CEP Autocomplete
  useEffect(() => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length === 8) {
      toast.info("Buscando CEP...");
      setTimeout(() => {
        setRua("Avenida Paulista");
        setBairro("Bela Vista");
        setCidade("São Paulo");
        setUf("SP");
        toast.success("CEP encontrado!");
      }, 800);
    }
  }, [cep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!nome.trim() || !email.trim() || telefone.trim().length < 10 || !cpf.trim() || !dataNascimento) {
        toast.error("Por favor, preencha todos os dados pessoais.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!cep.trim() || !rua.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !uf.trim()) {
        toast.error("Por favor, preencha todo o endereço residencial.");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!isRespFinanceiro && (!respNome.trim() || !respCpf.trim())) {
        toast.error("Por favor, preencha os dados do responsável financeiro.");
        return;
      }

      try {
        // 1. Save new student in students list database
        const storedList = window.localStorage.getItem("fluency-ai:students:list");
        let currentList = [];
        if (storedList) {
          currentList = JSON.parse(storedList);
        }
        
        const newStudent = {
          nome: nome,
          nivel: "Pendente",
          turma: "Pendente (Pré-Matrícula)",
          inicio: new Date().toLocaleDateString("pt-BR"),
          status: "Pré-Matrícula"
        };

        window.localStorage.setItem("fluency-ai:students:list", JSON.stringify([newStudent, ...currentList]));

        // 2. Save student details
        const storedDetails = window.localStorage.getItem("fluency-ai:students:details");
        let currentDetails = {};
        if (storedDetails) {
          currentDetails = JSON.parse(storedDetails);
        }

        const newDetails = {
          presenca: 100,
          tarefas: 100,
          streak: 0,
          coins: 0,
          xp: 0,
          liga: "Bronze",
          whats: telefone.replace(/\D/g, ""),
          historico: [
            { data: new Date().toLocaleDateString("pt-BR"), texto: `Pré-Matrícula enviada online. Método de Pagamento preferido: ${metodoPagamento.toUpperCase()}.`, autor: "Portal de Matrícula" }
          ],
          financeiro: [
            { descricao: "Fatura Pré-Matrícula", valor: 199, vencimento: new Date().toLocaleDateString("pt-BR"), situacao: "aberto" }
          ]
        };

        const extendedDetails = {
          ...currentDetails,
          [nome]: newDetails
        };

        window.localStorage.setItem("fluency-ai:students:details", JSON.stringify(extendedDetails));

        // 3. Inject into CRM Stages
        const rawStages = window.localStorage.getItem("fluency-ai:crm:stages");
        if (rawStages) {
          const currentStages = JSON.parse(rawStages);
          const nextStages = currentStages.map((stage: any) => {
            if (stage.id === "lead") {
              return {
                ...stage,
                cards: [
                  ...stage.cards,
                  { nome: nome, origem: "Pré-Matrícula Online", valor: 3800 },
                ],
              };
            }
            return stage;
          });
          window.localStorage.setItem("fluency-ai:crm:stages", JSON.stringify(nextStages));
        }

        toast.success("Pré-Matrícula registrada com sucesso!");
        setStep(4);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao registrar matrícula. Tente novamente.");
      }
    }
  };

  // If premium is locked OR inactive, show inactive screen
  if (isUnlocked === false || isActive === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <GlassCard className="w-full max-w-md p-8 text-center space-y-6 border-rose-500/20">
          <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Matrícula Indisponível</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O formulário de pré-matrícula online não está ativo no momento ou o módulo não foi configurado. Por favor, entre em contato diretamente com a secretaria para realizar sua matrícula.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Loading state
  if (isUnlocked === null || isActive === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-xs text-muted-foreground animate-pulse">Carregando formulário de matrícula...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Brand header */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">FLUENCY AI</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] font-semibold">Language Schools Integration</p>
        </div>

        <GlassCard className="p-8 shadow-2xl relative border-white/5 overflow-hidden">
          {step === 0 ? (
            /* Welcome Slide */
            <div className="text-center py-6 space-y-6 animate-in zoom-in duration-200">
              <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <FileText className="size-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-extrabold text-foreground tracking-tight">Ficha de Pré-Matrícula</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Garanta sua vaga na nossa escola de idiomas de forma simplificada. Preencha seus dados residenciais e escolha sua forma de faturamento inicial.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer border-0"
              >
                Iniciar Pré-Matrícula <ArrowRight className="size-3.5" />
              </button>
            </div>
          ) : step === 1 ? (
            /* Step 1: Personal Data */
            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-bold text-primary">Passo 1 de 3</span>
                  <span>Dados Pessoais</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/3" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo do Aluno</label>
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <input
                      placeholder="Ex: Mariana Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CPF do Aluno</label>
                    <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <input
                        placeholder="Ex: 000.000.000-00"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        className="w-full bg-transparent text-xs text-foreground outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Data de Nascimento</label>
                    <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                      <input
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full bg-transparent text-xs text-foreground outline-none text-muted-foreground"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">E-mail para Contato</label>
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <input
                      type="email"
                      placeholder="Ex: mariana.silva@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Celular / WhatsApp</label>
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
                    <Phone className="size-4 text-muted-foreground shrink-0" />
                    <input
                      placeholder="Ex: +55 (11) 97777-7777"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary hover:bg-primary/95 py-2.5 text-xs font-bold text-primary-foreground transition-all cursor-pointer border-0 shadow"
              >
                Prosseguir para Endereço <ArrowRight className="size-3.5 inline ml-1" />
              </button>
            </form>
          ) : step === 2 ? (
            /* Step 2: Address Data */
            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-bold text-primary">Passo 2 de 3</span>
                  <span>Endereço Residencial</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-2/3" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CEP</label>
                    <input
                      placeholder="01310-100"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rua / Logradouro</label>
                    <input
                      placeholder="Ex: Avenida Paulista"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Número</label>
                    <input
                      placeholder="Ex: 1000"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bairro</label>
                    <input
                      placeholder="Ex: Bela Vista"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cidade</label>
                    <input
                      placeholder="Ex: São Paulo"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">UF</label>
                    <input
                      placeholder="SP"
                      maxLength={2}
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary uppercase text-center"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 rounded-lg border border-hairline bg-transparent hover:bg-surface py-2.5 text-xs font-semibold text-foreground cursor-pointer transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-2/3 rounded-lg bg-primary hover:bg-primary/95 py-2.5 text-xs font-bold text-primary-foreground transition-all cursor-pointer border-0 shadow"
                >
                  Faturamento & Pagamento <ArrowRight className="size-3.5 inline ml-1" />
                </button>
              </div>
            </form>
          ) : step === 3 ? (
            /* Step 3: Billing & Payment Choice */
            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-bold text-primary">Passo 3 de 3</span>
                  <span>Faturamento & Pagamento</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface/50 p-4 text-xs">
                  <div>
                    <h5 className="font-bold text-foreground">Responsável Financeiro</h5>
                    <p className="text-muted-foreground mt-0.5">O próprio aluno efetuará o pagamento?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRespFinanceiro(!isRespFinanceiro)}
                    className={`rounded-lg px-3 py-1.5 font-bold transition-all border-0 cursor-pointer ${
                      isRespFinanceiro 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-surface text-muted-foreground border border-hairline"
                    }`}
                  >
                    {isRespFinanceiro ? "Sim" : "Não, outro"}
                  </button>
                </div>

                {!isRespFinanceiro && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome do Responsável</label>
                      <input
                        placeholder="Ex: João da Silva"
                        value={respNome}
                        onChange={(e) => setRespNome(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CPF do Responsável</label>
                      <input
                        placeholder="Ex: 000.000.000-00"
                        value={respCpf}
                        onChange={(e) => setRespCpf(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Método de Faturamento Preferido</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "pix", label: "Pix", desc: "Aprovação imediata" },
                      { key: "boleto", label: "Boleto", desc: "Vence em 3 dias" },
                      { key: "cartao", label: "Cartão", desc: "Recorrência mensal" }
                    ].map((m) => {
                      const isSelected = metodoPagamento === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setMetodoPagamento(m.key as any)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between h-20 ${
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-hairline bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                          }`}
                        >
                          <span className="text-xs font-bold flex items-center justify-between w-full">
                            {m.label}
                            {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                          </span>
                          <span className="text-[9px] opacity-80 mt-1">{m.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 rounded-lg border border-hairline bg-transparent hover:bg-surface py-2.5 text-xs font-semibold text-foreground cursor-pointer transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-2/3 rounded-lg bg-emerald-500 hover:bg-emerald-600 py-2.5 text-xs font-bold text-white transition-all cursor-pointer border-0 shadow"
                >
                  Enviar Pré-Matrícula <Check className="size-3.5 inline ml-1" />
                </button>
              </div>
            </form>
          ) : (
            /* Success Slide */
            <div className="text-center py-4 space-y-6 animate-in zoom-in duration-200">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="size-7" />
              </span>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-foreground">Matrícula Registrada!</h4>
                <p className="text-xs text-muted-foreground">Sua solicitação de pré-matrícula foi enviada com sucesso para a secretaria acadêmica.</p>
              </div>

              <div className="rounded-xl border border-hairline bg-surface/30 p-5 space-y-3 max-w-sm mx-auto text-xs text-left">
                <h5 className="font-bold text-foreground">Resumo do Envio:</h5>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li><strong>Nome:</strong> {nome}</li>
                  <li><strong>Responsável:</strong> {isRespFinanceiro ? nome : respNome}</li>
                  <li><strong>Faturamento:</strong> {metodoPagamento.toUpperCase()}</li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 text-xs text-primary max-w-sm mx-auto leading-relaxed text-left">
                <Sparkles className="size-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">O que acontece agora?</h5>
                  <p className="mt-0.5 opacity-90">
                    Nossa secretaria revisará suas informações acadêmicas e financeiras. O contrato de prestação de serviços educacionais será enviado em breve para o e-mail cadastrado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
