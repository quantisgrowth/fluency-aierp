import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, UserPlus, MoveRight, Pencil, X, Search, Check, Copy } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { ModuleGate } from "@/components/module-gate";
import { crmStages as initialStages, brl } from "@/data/mock";
import { toast } from "sonner";
import { type Lead, ORIGEM_IDEAS, LEADS_STORAGE_KEY } from "./leads";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "CRM Comercial — Fluency AI" },
      { name: "description", content: "Funil Kanban de captação de leads." },
    ],
  }),
  component: CrmPage,
});

type LeadCard = {
  nome: string;
  origem: string;
  valor: number;
};

type Stage = {
  id: string;
  titulo: string;
  cards: LeadCard[];
};

function CrmPage() {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [leadsDb, setLeadsDb] = useState<Lead[]>([]);

  // Edit Lead Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadCard | null>(null);
  const [formName, setFormName] = useState("");
  const [formOrigem, setFormOrigem] = useState("");
  const [formValor, setFormValor] = useState(0);

  // New Deal / Add Card Modal States
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [dealName, setDealName] = useState("");
  const [dealOrigem, setDealOrigem] = useState(ORIGEM_IDEAS[0]);
  const [dealValor, setDealValor] = useState(3000);
  const [selectedLeadId, setSelectedLeadId] = useState("");

  // Sub-modal creation for creating a Lead inside CRM
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [leadActiveTab, setLeadActiveTab] = useState<"contato" | "pessoais" | "endereco" | "anotacoes">("contato");
  
  // Lead creation fields
  const [newLeadNome, setNewLeadNome] = useState("");
  const [newLeadTags, setNewLeadTags] = useState("");
  const [newLeadTelefone, setNewLeadTelefone] = useState("+55 ");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadSite, setNewLeadSite] = useState("");
  const [newLeadDoc, setNewLeadDoc] = useState("");
  const [newLeadEmpresa, setNewLeadEmpresa] = useState("");
  const [newLeadOrigem, setNewLeadOrigem] = useState(ORIGEM_IDEAS[0]);
  const [newLeadNasc, setNewLeadNasc] = useState("");
  const [newLeadResp, setNewLeadResp] = useState("");
  const [newLeadFezTeste, setNewLeadFezTeste] = useState(false);
  const [newLeadPais, setNewLeadPais] = useState("Brasil");
  const [newLeadCep, setNewLeadCep] = useState("");
  const [newLeadEnd, setNewLeadEnd] = useState("");
  const [newLeadNum, setNewLeadNum] = useState("");
  const [newLeadCompl, setNewLeadCompl] = useState("");
  const [newLeadBairro, setNewLeadBairro] = useState("");
  const [newLeadCidade, setNewLeadCidade] = useState("");
  const [newLeadUf, setNewLeadUf] = useState("");
  const [newLeadAnotacoes, setNewLeadAnotacoes] = useState("");

  // Load leads database and CRM stages from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LEADS_STORAGE_KEY);
      if (stored) {
        setLeadsDb(JSON.parse(stored));
      }

      const storedStages = window.localStorage.getItem("fluency-ai:crm:stages");
      if (storedStages) {
        setStages(JSON.parse(storedStages));
      }
    } catch {
      /* ignore */
    }
  }, [isNewDealOpen, isCreateLeadOpen]);

  const saveLeadsDb = (nextLeads: Lead[]) => {
    setLeadsDb(nextLeads);
    try {
      window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(nextLeads));
    } catch {
      /* ignore */
    }
  };

  const saveStages = (nextStages: Stage[]) => {
    setStages(nextStages);
    try {
      window.localStorage.setItem("fluency-ai:crm:stages", JSON.stringify(nextStages));
    } catch {
      /* ignore */
    }
  };

  const handleOpenNewDeal = () => {
    setDealName("");
    setDealOrigem(ORIGEM_IDEAS[0]);
    setDealValor(3000);
    setSelectedLeadId("");
    setIsNewDealOpen(true);
  };

  const handlePullLeadData = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) {
      setDealName("");
      setDealOrigem(ORIGEM_IDEAS[0]);
      return;
    }
    const found = leadsDb.find(l => l.id === leadId);
    if (found) {
      setDealName(found.nome);
      setDealOrigem(found.origem);
      toast.info(`Dados puxados do Lead "${found.nome}"!`);
    }
  };

  // Submit Deal Creation Form
  const handleNewDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) {
      toast.error("Informe o nome do Lead ou selecione um cadastrado!");
      return;
    }

    // If they typed a name and didn't select an existing lead from database,
    // let's auto-create it in the database so both stay perfectly synchronized!
    if (!selectedLeadId) {
      const newLead: Lead = {
        id: "lead-" + Date.now(),
        nome: dealName,
        tags: ["CRM Auto"],
        telefone: "",
        email: "",
        site: "",
        documento: "",
        empresa: "",
        origem: dealOrigem,
        dataNascimento: "",
        responsavel: "Não informado",
        fezTesteNivel: false,
        pais: "Brasil",
        cep: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
        anotacoes: "Criado automaticamente via formulário do CRM.",
        createdAt: new Date().toISOString(),
      };
      saveLeadsDb([newLead, ...leadsDb]);
    }

    // Add deal to the first stage "lead"
    const nextStages = stages.map((s) => {
      if (s.id === "lead") {
        return {
          ...s,
          cards: [...s.cards, { nome: dealName, origem: dealOrigem, valor: Number(dealValor) }],
        };
      }
      return s;
    });

    saveStages(nextStages);
    setIsNewDealOpen(false);
    toast.success(`Negócio criado: ${dealName}!`);
  };

  // Open multi-tab Lead Creation from inside CRM Modal
  const handleOpenCreateLeadSubModal = () => {
    setNewLeadNome("");
    setNewLeadTags("");
    setNewLeadTelefone("+55 ");
    setNewLeadEmail("");
    setNewLeadSite("");
    setNewLeadDoc("");
    setNewLeadEmpresa("");
    setNewLeadOrigem(ORIGEM_IDEAS[0]);
    setNewLeadNasc("");
    setNewLeadResp("");
    setNewLeadFezTeste(false);
    setNewLeadPais("Brasil");
    setNewLeadCep("");
    setNewLeadEnd("");
    setNewLeadNum("");
    setNewLeadCompl("");
    setNewLeadBairro("");
    setNewLeadCidade("");
    setNewLeadUf("");
    setNewLeadAnotacoes("");
    setLeadActiveTab("contato");
    setIsCreateLeadOpen(true);
  };

  // Submit Lead Creation from inside CRM Modal
  const handleCreateLeadSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadNome.trim()) {
      toast.error("Informe o nome do Lead!");
      return;
    }

    const nextId = "lead-" + Date.now();
    const newLead: Lead = {
      id: nextId,
      nome: newLeadNome,
      tags: newLeadTags.split(",").map(t => t.trim()).filter(Boolean),
      telefone: newLeadTelefone,
      email: newLeadEmail,
      site: newLeadSite,
      documento: newLeadDoc,
      empresa: newLeadEmpresa,
      origem: newLeadOrigem,
      dataNascimento: newLeadNasc,
      responsavel: newLeadResp || "Não informado",
      fezTesteNivel: newLeadFezTeste,
      pais: newLeadPais,
      cep: newLeadCep,
      endereco: newLeadEnd,
      numero: newLeadNum,
      complemento: newLeadCompl,
      bairro: newLeadBairro,
      cidade: newLeadCidade,
      uf: newLeadUf,
      anotacoes: newLeadAnotacoes,
      createdAt: new Date().toISOString(),
    };

    const nextLeads = [newLead, ...leadsDb];
    saveLeadsDb(nextLeads);

    // Auto-select this newly created lead in the CRM modal
    setSelectedLeadId(nextId);
    setDealName(newLeadNome);
    setDealOrigem(newLeadOrigem);

    setIsCreateLeadOpen(false);
    toast.success(`Lead "${newLeadNome}" cadastrado e selecionado!`);
  };

  const simulateMoveCard = (stageId: string, cardName: string) => {
    const currentStageIdx = stages.findIndex((s) => s.id === stageId);
    if (currentStageIdx === -1 || currentStageIdx === stages.length - 1) {
      toast.info(`${cardName} já está no estágio final!`);
      return;
    }

    const nextStage = stages[currentStageIdx + 1];
    
    const nextStages = stages.map((s) => {
      if (s.id === stageId) {
        return {
          ...s,
          cards: s.cards.filter((c) => c.nome !== cardName),
        };
      }
      if (s.id === nextStage.id) {
        const cardToMove = stages[currentStageIdx].cards.find((c) => c.nome === cardName);
        return {
          ...s,
          cards: cardToMove ? [...s.cards, cardToMove] : s.cards,
        };
      }
      return s;
    });

    saveStages(nextStages);
    toast.success(`${cardName} avançou para ${nextStage.titulo}!`);
  };

  const handleOpenEditLead = (stageId: string, lead: LeadCard) => {
    setSelectedStageId(stageId);
    setSelectedLead(lead);
    setFormName(lead.nome);
    setFormOrigem(lead.origem);
    setFormValor(lead.valor);
    setIsEditOpen(true);
  };

  const handleEditLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !formName) return;

    const nextStages = stages.map((s) => {
      if (s.id === selectedStageId) {
        return {
          ...s,
          cards: s.cards.map((c) =>
            c.nome === selectedLead.nome
              ? { ...c, nome: formName, origem: formOrigem, valor: Number(formValor) }
              : c
          ),
        };
      }
      return s;
    });

    saveStages(nextStages);
    toast.success(`Lead "${formName}" atualizado com sucesso!`);
    setIsEditOpen(false);
    setSelectedLead(null);
  };

  return (
    <ModuleGate module="crm">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
        <SectionHeader
          eyebrow="Operação"
          title="CRM Comercial & Funil"
          description="Acompanhe oportunidades de matrícula em um funil Kanban interativo, gerencie e edite os dados dos leads."
          action={
            <button
              onClick={handleOpenNewDeal}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="size-4" /> Novo Negócio
            </button>
          }
        />

        {/* Kanban Board */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => {
            const totalValue = stage.cards.reduce((sum, c) => sum + c.valor, 0);
            return (
              <GlassCard key={stage.id} className="p-4 flex flex-col h-[520px] bg-surface/20 border-hairline/60">
                {/* Column header */}
                <div className="pb-3 border-b border-hairline flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{stage.titulo}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Estágio de vendas</p>
                  </div>
                  <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-bold">
                    {stage.cards.length}
                  </span>
                </div>

                {/* Column value summary */}
                <div className="py-2.5 flex items-center justify-between text-xs text-muted-foreground border-b border-hairline/30 mb-4 bg-surface-elevated/20 px-2 rounded">
                  <span>Volume projetado:</span>
                  <span className="font-semibold text-foreground">{brl(totalValue)}</span>
                </div>

                {/* Cards stack */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {stage.cards.length > 0 ? (
                    stage.cards.map((card) => (
                      <div
                        key={card.nome}
                        className="group rounded-xl border border-hairline bg-surface-elevated/50 p-4 hover:border-white/10 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Edit Action trigger overlay */}
                        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditLead(stage.id, card)}
                            title="Editar Lead"
                            className="p-1 rounded bg-surface border border-hairline hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          >
                            <Pencil className="size-3" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="pr-6">
                            <p className="text-sm font-semibold text-foreground">{card.nome}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Origem: {card.origem}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-foreground">{brl(card.valor)}</span>
                            {stage.id !== "fechada" && (
                              <button
                                onClick={() => simulateMoveCard(stage.id, card.nome)}
                                aria-label="Avançar lead"
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer font-medium"
                              >
                                Avançar <MoveRight className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-muted-foreground border border-dashed border-hairline rounded-xl">
                      Nenhum lead nesta etapa
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* --- INLINE GLASSMORPHIC MODAL FOR NEW DEAL --- */}
      {isNewDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl relative text-foreground">
            <button
              onClick={() => setIsNewDealOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Criar Novo Negócio</h3>
              <p className="text-xs text-muted-foreground">Puxe informações de um lead existente ou crie um novo na hora.</p>
            </div>

            <form onSubmit={handleNewDealSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vincular Lead Cadastrado</label>
                  <button
                    type="button"
                    onClick={handleOpenCreateLeadSubModal}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Cadastrar Novo Lead
                  </button>
                </div>
                
                <select
                  value={selectedLeadId}
                  onChange={(e) => handlePullLeadData(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="">Selecione um Lead da Base (Opcional)</option>
                  {leadsDb.map(l => (
                    <option key={l.id} value={l.id}>{l.nome} ({l.origem})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Oportunidade</label>
                <input
                  placeholder="Nome do cliente/aluno"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem do Negócio</label>
                <select
                  value={dealOrigem}
                  onChange={(e) => setDealOrigem(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                >
                  {ORIGEM_IDEAS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Estimado (Curso Anual)</label>
                <input
                  type="number"
                  value={dealValor}
                  onChange={(e) => setDealValor(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
              >
                Confirmar e Adicionar Negócio
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* --- INLINE GLASSMORPHIC MODAL FOR SUB LEAD CREATION --- */}
      {isCreateLeadOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-foreground">
            
            <button
              onClick={() => setIsCreateLeadOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4.5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-foreground">Criar novo Lead</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Preencha os dados do prospect para cadastrá-lo na base.</p>
            </div>

            <form onSubmit={handleCreateLeadSubSubmit} className="space-y-4">
              
              {/* Global Fields: Nome & Tags */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                  <input
                    placeholder="Informe o nome do lead"
                    value={newLeadNome}
                    onChange={(e) => setNewLeadNome(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags (Separadas por vírgula)</label>
                  <input
                    placeholder="Ex: Teen, Inglês, Matutino"
                    value={newLeadTags}
                    onChange={(e) => setNewLeadTags(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Tabs selector */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-lg border border-hairline bg-surface/50">
                {(["contato", "pessoais", "endereco", "anotacoes"] as const).map((t) => {
                  const labels = {
                    contato: "Contato",
                    pessoais: "Pessoais",
                    endereco: "Endereço",
                    anotacoes: "Anotações",
                  };
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeadActiveTab(t)}
                      className={`py-1.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                        leadActiveTab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panel */}
              <div className="min-h-[160px] py-1">
                
                {leadActiveTab === "contato" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                      <input
                        placeholder="+55 (11) 99999-9999"
                        value={newLeadTelefone}
                        onChange={(e) => setNewLeadTelefone(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
                      <input
                        type="email"
                        placeholder="Exemplo: meulead@gmail.com"
                        value={newLeadEmail}
                        onChange={(e) => setNewLeadEmail(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Site</label>
                      <input
                        placeholder="Exemplo: www.meulead.com.br"
                        value={newLeadSite}
                        onChange={(e) => setNewLeadSite(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {leadActiveTab === "pessoais" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Documento (CPF/CNPJ)</label>
                        <input
                          placeholder="Informe o documento"
                          value={newLeadDoc}
                          onChange={(e) => setNewLeadDoc(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Empresa</label>
                        <input
                          placeholder="Informe a empresa"
                          value={newLeadEmpresa}
                          onChange={(e) => setNewLeadEmpresa(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Origem do Lead</label>
                      <select
                        value={newLeadOrigem}
                        onChange={(e) => setNewLeadOrigem(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      >
                        {ORIGEM_IDEAS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pai, Mãe ou Responsável</label>
                        <input
                          placeholder="Ex: Mariana Santos (Mãe)"
                          value={newLeadResp}
                          onChange={(e) => setNewLeadResp(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Data de Nascimento</label>
                        <input
                          type="date"
                          value={newLeadNasc}
                          onChange={(e) => setNewLeadNasc(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary text-foreground"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground pt-1.5">
                      <input
                        type="checkbox"
                        checked={newLeadFezTeste}
                        onChange={(e) => setNewLeadFezTeste(e.target.checked)}
                        className="size-4 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                      />
                      <span>Já realizou teste de nivelamento?</span>
                    </label>
                  </div>
                )}

                {leadActiveTab === "endereco" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">País</label>
                        <input
                          value={newLeadPais}
                          onChange={(e) => setNewLeadPais(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CEP</label>
                        <input
                          placeholder="ex: 12345-678"
                          value={newLeadCep}
                          onChange={(e) => setNewLeadCep(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Endereço</label>
                        <input
                          placeholder="ex: Av. Paulista"
                          value={newLeadEnd}
                          onChange={(e) => setNewLeadEnd(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Número</label>
                        <input
                          placeholder="ex: 123"
                          value={newLeadNum}
                          onChange={(e) => setNewLeadNum(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Complemento</label>
                        <input
                          placeholder="ex: Apto 101"
                          value={newLeadCompl}
                          onChange={(e) => setNewLeadCompl(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bairro</label>
                        <input
                          placeholder="ex: Centro"
                          value={newLeadBairro}
                          onChange={(e) => setNewLeadBairro(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">UF</label>
                        <input
                          placeholder="ex: SP"
                          value={newLeadUf}
                          onChange={(e) => setNewLeadUf(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cidade</label>
                      <input
                        placeholder="ex: São Paulo"
                        value={newLeadCidade}
                        onChange={(e) => setNewLeadCidade(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {leadActiveTab === "anotacoes" && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Anotações do Lead</label>
                    <textarea
                      placeholder="Histórico comercial, particularidades, nível, objetivos e etc."
                      value={newLeadAnotacoes}
                      onChange={(e) => setNewLeadAnotacoes(e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-hairline bg-surface/50 p-3 text-xs text-foreground outline-none focus:border-primary resize-none"
                    />
                  </div>
                )}

              </div>

              {/* Form Footer */}
              <div className="border-t border-hairline pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateLeadOpen(false)}
                  className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 cursor-pointer"
                >
                  Salvar Lead
                </button>
              </div>

            </form>
          </GlassCard>
        </div>
      )}

      {/* --- INLINE GLASSMORPHIC MODAL FOR LEAD EDIT --- */}
      {isEditOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm p-6 space-y-4 shadow-2xl relative text-foreground">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div>
              <h3 className="text-base font-bold text-foreground">Editar Lead</h3>
              <p className="text-xs text-muted-foreground">Modifique o nome, origem ou valor projetado da oportunidade.</p>
            </div>

            <form onSubmit={handleEditLeadSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Oportunidade</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem do Lead</label>
                <select
                  value={formOrigem}
                  onChange={(e) => setFormOrigem(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                >
                  {ORIGEM_IDEAS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor do Curso (Anual/Semestral)</label>
                <input
                  type="number"
                  value={formValor}
                  onChange={(e) => setFormValor(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer text-center"
              >
                Salvar Alterações
              </button>
            </form>
          </GlassCard>
        </div>
      )}
    </ModuleGate>
  );
}
