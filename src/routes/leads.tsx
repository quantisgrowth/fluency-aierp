import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Plus, Filter, CheckCircle2, XCircle, ArrowRight, UserPlus, Info, Tag, Phone, Mail, Building, MapPin, Notebook, Calendar, Eye } from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Base de Leads — Fluency AI" },
      { name: "description", content: "Cadastro centralizado de leads, origens e histórico pedagógico." },
    ],
  }),
  component: LeadsPage,
});

export type Lead = {
  id: string;
  nome: string;
  tags: string[];
  // Contato
  telefone: string;
  email: string;
  site: string;
  // Dados Pessoais
  documento: string; // CPF/CNPJ
  empresa: string;
  origem: string;
  dataNascimento: string;
  responsavel: string; // Pai/Mãe/Responsável
  fezTesteNivel: boolean; // Se já fez o teste de nível
  // Endereço
  pais: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  // Anotações
  anotacoes: string;
  createdAt: string;
};

export const ORIGEM_IDEAS = [
  "Tráfego Pago (Instagram Ad)",
  "Tráfego Pago (Facebook Ad)",
  "Tráfego Pago (Google Ads)",
  "Indicação de Aluno",
  "WhatsApp Comercial (Inbound)",
  "Prospecção Ativa (Outbound)",
  "Panfletagem / Evento Local",
  "Parceria Corporativa (B2B)",
  "Parceria Escolar (B2B2C)",
  "Busca Orgânica (SEO)",
  "Instagram Orgânico",
  "TikTok Orgânico",
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: "lead-1",
    nome: "Lucas Oliveira Ramos",
    tags: ["Adulto", "Inglês", "Iniciante"],
    telefone: "+55 (11) 99123-4567",
    email: "lucas.ramos@gmail.com",
    site: "www.lucasramos.dev",
    documento: "421.321.448-90",
    empresa: "Ramos Tech Solutions",
    origem: "Tráfego Pago (Instagram Ad)",
    dataNascimento: "1995-08-14",
    responsavel: "Autônomo",
    fezTesteNivel: true,
    pais: "Brasil",
    cep: "01310-100",
    endereco: "Av. Paulista",
    numero: "1000",
    complemento: "Apto 152",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
    anotacoes: "Tem interesse em inglês para negócios. Já fez o teste e foi classificado como Beginner A2.",
    createdAt: "2026-08-15T10:00:00.000Z",
  },
  {
    id: "lead-2",
    nome: "Beatriz M. Santos",
    tags: ["Teen", "Espanhol", "Intermediário"],
    telefone: "+55 (11) 98774-1234",
    email: "beatriz.santos@outlook.com",
    site: "",
    documento: "",
    empresa: "Colégio Santa Maria",
    origem: "Indicação de Aluno",
    dataNascimento: "2010-04-20",
    responsavel: "Mariana Mendes Santos (Mãe)",
    fezTesteNivel: false,
    pais: "Brasil",
    cep: "04533-010",
    endereco: "Rua Joaquim Floriano",
    numero: "450",
    complemento: "",
    bairro: "Itaim Bibi",
    cidade: "São Paulo",
    uf: "SP",
    anotacoes: "Filha do aluno Marcos Santos do Avançado. Nunca estudou espanhol formalmente.",
    createdAt: "2026-08-18T14:30:00.000Z",
  },
  {
    id: "lead-3",
    nome: "Gustavo Lima de Sousa",
    tags: ["Kids", "Inglês", "Alfabetização"],
    telefone: "+55 (11) 97744-8899",
    email: "claudio.sousa@bol.com.br",
    site: "",
    documento: "452.122.908-12",
    empresa: "",
    origem: "Prospecção Ativa (Outbound)",
    dataNascimento: "2018-11-02",
    responsavel: "Claudio de Sousa (Pai)",
    fezTesteNivel: true,
    pais: "Brasil",
    cep: "03102-040",
    endereco: "Rua Juventus",
    numero: "88",
    complemento: "Bloco B",
    bairro: "Mooca",
    cidade: "São Paulo",
    uf: "SP",
    anotacoes: "Pai ligou procurando inglês lúdico. Fez o teste de nivelamento kids e foi bem.",
    createdAt: "2026-08-19T09:15:00.000Z",
  },
];

export const LEADS_STORAGE_KEY = "fluency-ai:leads-db";

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(DEFAULT_LEADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("");
  const [filterTeste, setFilterTeste] = useState<"todos" | "sim" | "nao">("todos");

  // Modal creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"contato" | "pessoais" | "endereco" | "anotacoes">("contato");

  // View details drawer
  const [selectedDetails, setSelectedDetails] = useState<Lead | null>(null);

  // Form local states
  const [nome, setNome] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [telefone, setTelefone] = useState("+55 ");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [documento, setDocumento] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [origem, setOrigem] = useState(ORIGEM_IDEAS[0]);
  const [dataNascimento, setDataNascimento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [fezTesteNivel, setFezTesteNivel] = useState(false);
  const [pais, setPais] = useState("Brasil");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [anotacoes, setAnotacoes] = useState("");

  // Load from local storage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LEADS_STORAGE_KEY);
      if (stored) {
        setLeads(JSON.parse(stored));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveLeads = (nextLeads: Lead[]) => {
    setLeads(nextLeads);
    try {
      window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(nextLeads));
    } catch {
      /* ignore */
    }
  };

  const handleOpenCreateModal = () => {
    // Reset form fields
    setNome("");
    setTagsInput("");
    setTelefone("+55 ");
    setEmail("");
    setSite("");
    setDocumento("");
    setEmpresa("");
    setOrigem(ORIGEM_IDEAS[0]);
    setDataNascimento("");
    setResponsavel("");
    setFezTesteNivel(false);
    setPais("Brasil");
    setCep("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setUf("");
    setAnotacoes("");
    setActiveTab("contato");
    setIsModalOpen(true);
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Por favor, informe o Nome do Lead!");
      return;
    }

    const newLead: Lead = {
      id: "lead-" + Date.now(),
      nome,
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      telefone,
      email,
      site,
      documento,
      empresa,
      origem,
      dataNascimento,
      responsavel: responsavel || "Não informado",
      fezTesteNivel,
      pais,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      anotacoes,
      createdAt: new Date().toISOString(),
    };

    const nextLeads = [newLead, ...leads];
    saveLeads(nextLeads);
    setIsModalOpen(false);
    toast.success("Lead cadastrado com sucesso!", {
      description: `${nome} foi adicionado à base central de leads.`,
    });
  };

  const handleDeleteLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este Lead?")) {
      const nextLeads = leads.filter(l => l.id !== id);
      saveLeads(nextLeads);
      toast.success("Lead removido com sucesso.");
      if (selectedDetails?.id === id) {
        setSelectedDetails(null);
      }
    }
  };

  // Filters logic
  const filteredLeads = leads.filter((l) => {
    const matchesSearch = l.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrigem = filterOrigem ? l.origem === filterOrigem : true;
    
    const matchesTeste = filterTeste === "todos" ? true :
                         filterTeste === "sim" ? l.fezTesteNivel : !l.fezTesteNivel;

    return matchesSearch && matchesOrigem && matchesTeste;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          eyebrow="Base Comercial"
          title="Base Geral de Leads"
          description="Acompanhe o funil inicial de prospects, origens de tráfego, contatos e testes de proficiência realizados."
        />
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer self-start sm:self-auto active:scale-[0.97]"
        >
          <Plus className="size-4" /> Cadastrar Lead
        </button>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 grid gap-4 md:grid-cols-4 items-center">
        <div className="relative">
          <input
            placeholder="Buscar por nome, e-mail ou pai/mãe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 pl-10 pr-3 text-xs text-foreground outline-none focus:border-primary"
          />
          <Search className="size-4 text-muted-foreground absolute left-3 top-3" />
        </div>

        <div>
          <select
            value={filterOrigem}
            onChange={(e) => setFilterOrigem(e.target.value)}
            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            <option value="">Origem: Todas</option>
            {ORIGEM_IDEAS.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterTeste}
            onChange={(e) => setFilterTeste(e.target.value as any)}
            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            <option value="todos">Teste de Nível: Todos</option>
            <option value="sim">Já realizou teste</option>
            <option value="nao">Não realizou teste</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground text-right font-medium">
          Exibindo {filteredLeads.length} de {leads.length} leads
        </div>
      </GlassCard>

      {/* Main Grid View: Table list on left, details on right if selected */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        
        {/* Table/List */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-surface-elevated/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Nome do Lead</th>
                    <th className="px-6 py-4">Responsável (Pai/Mãe)</th>
                    <th className="px-6 py-4">Origem</th>
                    <th className="px-6 py-4 text-center">Teste Nível</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredLeads.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedDetails(l)}
                      className={`cursor-pointer transition-colors hover:bg-surface/30 ${
                        selectedDetails?.id === l.id ? "bg-primary/[0.03] border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{l.nome}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {l.tags.map((t) => (
                            <span key={t} className="rounded bg-accent/60 px-1.5 py-0.5 text-[9px] font-medium text-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{l.responsavel}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-primary/5 border border-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {l.origem}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          l.fezTesteNivel ? "text-paid" : "text-muted-foreground"
                        }`}>
                          {l.fezTesteNivel ? (
                            <><CheckCircle2 className="size-3.5" /> Sim</>
                          ) : (
                            <><XCircle className="size-3.5" /> Não</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => handleDeleteLead(l.id, e)}
                          className="rounded p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-xs">
                        Nenhum lead encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Selected Details Drawer */}
        <div>
          {selectedDetails ? (
            <GlassCard className="p-6 space-y-6 sticky top-24 border-primary/20">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedDetails.nome}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Criado em: {new Date(selectedDetails.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <button
                  onClick={() => setSelectedDetails(null)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40"
                >
                  <XCircle className="size-4.5" />
                </button>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags do Lead</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDetails.tags.map(t => (
                    <span key={t} className="rounded bg-primary/10 border border-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                      {t}
                    </span>
                  ))}
                  {selectedDetails.tags.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma tag cadastrada.</span>}
                </div>
              </div>

              {/* Contatos */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-hairline pb-1">Contato</p>
                <div className="grid gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <span>Telefone: <strong>{selectedDetails.telefone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span>E-mail: <strong>{selectedDetails.email}</strong></span>
                  </div>
                  {selectedDetails.site && (
                    <div className="flex items-center gap-2">
                      <Eye className="size-3.5 text-muted-foreground" />
                      <span>Site: <a href={`https://${selectedDetails.site}`} target="_blank" className="text-primary hover:underline">{selectedDetails.site}</a></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-hairline pb-1">Dados Pessoais</p>
                <div className="grid gap-2.5 text-xs">
                  <div>Responsável (Pai/Mãe): <strong>{selectedDetails.responsavel}</strong></div>
                  <div>Origem de Captação: <strong className="text-primary">{selectedDetails.origem}</strong></div>
                  {selectedDetails.documento && <div>Documento: <strong>{selectedDetails.documento}</strong></div>}
                  {selectedDetails.empresa && <div>Empresa: <strong>{selectedDetails.empresa}</strong></div>}
                  {selectedDetails.dataNascimento && <div>Data Nasc.: <strong>{new Date(selectedDetails.dataNascimento).toLocaleDateString("pt-BR")}</strong></div>}
                  <div>
                    Fez Teste de Nivelamento:{" "}
                    <strong className={selectedDetails.fezTesteNivel ? "text-paid" : "text-muted-foreground"}>
                      {selectedDetails.fezTesteNivel ? "Sim (Classificado)" : "Não"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-hairline pb-1">Endereço</p>
                <div className="grid gap-1 text-xs leading-relaxed">
                  <p>CEP: <strong>{selectedDetails.cep || "Não informado"}</strong></p>
                  <p>{selectedDetails.endereco}, {selectedDetails.numero} {selectedDetails.complemento && `(${selectedDetails.complemento})`}</p>
                  <p>{selectedDetails.bairro} — {selectedDetails.cidade}/{selectedDetails.uf}</p>
                </div>
              </div>

              {/* Anotações */}
              {selectedDetails.anotacoes && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-hairline pb-1">Anotações Comerciais</p>
                  <p className="text-xs text-muted-foreground italic leading-relaxed bg-accent/30 p-2.5 rounded-lg border border-hairline">
                    "{selectedDetails.anotacoes}"
                  </p>
                </div>
              )}

            </GlassCard>
          ) : (
            <GlassCard className="p-8 text-center sticky top-24 border-dashed border-hairline flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
              <Info className="size-7 mb-3 text-muted-foreground/60" />
              <p className="text-sm font-semibold">Detalhes do Lead</p>
              <p className="text-xs max-w-[200px] mt-1 leading-relaxed">Selecione um lead da tabela para carregar a ficha completa.</p>
            </GlassCard>
          )}
        </div>

      </div>

      {/* --- MOCK MULTI-TAB LEAD CREATION DIALOG --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-foreground">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <XCircle className="size-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-foreground">Criar novo Lead</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Preencha os dados do prospect para cadastrá-lo na base.</p>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
              
              {/* Global Fields: Nome & Tags */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                  <input
                    placeholder="Informe o nome do lead"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags (Separadas por vírgula)</label>
                  <input
                    placeholder="Ex: Teen, Inglês, Matutino"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
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
                      onClick={() => setActiveTab(t)}
                      className={`py-1.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                        activeTab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panel */}
              <div className="min-h-[160px] py-1">
                
                {activeTab === "contato" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                      <input
                        placeholder="+55 (11) 99999-9999"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
                      <input
                        type="email"
                        placeholder="Exemplo: meulead@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Site</label>
                      <input
                        placeholder="Exemplo: www.meulead.com.br"
                        value={site}
                        onChange={(e) => setSite(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "pessoais" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Documento (CPF/CNPJ)</label>
                        <input
                          placeholder="Informe o documento"
                          value={documento}
                          onChange={(e) => setDocumento(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Empresa</label>
                        <input
                          placeholder="Informe a empresa"
                          value={empresa}
                          onChange={(e) => setEmpresa(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Origem do Lead</label>
                      <select
                        value={origem}
                        onChange={(e) => setOrigem(e.target.value)}
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
                          value={responsavel}
                          onChange={(e) => setResponsavel(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Data de Nascimento</label>
                        <input
                          type="date"
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary text-foreground"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground pt-1.5">
                      <input
                        type="checkbox"
                        checked={fezTesteNivel}
                        onChange={(e) => setFezTesteNivel(e.target.checked)}
                        className="size-4 rounded border-hairline text-primary focus:ring-primary cursor-pointer"
                      />
                      <span>Já realizou teste de nivelamento?</span>
                    </label>
                  </div>
                )}

                {activeTab === "endereco" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">País</label>
                        <input
                          value={pais}
                          onChange={(e) => setPais(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CEP</label>
                        <input
                          placeholder="ex: 12345-678"
                          value={cep}
                          onChange={(e) => setCep(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Endereço</label>
                        <input
                          placeholder="ex: Av. Paulista"
                          value={endereco}
                          onChange={(e) => setEndereco(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Número</label>
                        <input
                          placeholder="ex: 123"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Complemento</label>
                        <input
                          placeholder="ex: Apto 101"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bairro</label>
                        <input
                          placeholder="ex: Centro"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">UF</label>
                        <input
                          placeholder="ex: SP"
                          value={uf}
                          onChange={(e) => setUf(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cidade</label>
                      <input
                        placeholder="ex: São Paulo"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "anotacoes" && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Anotações do Lead</label>
                    <textarea
                      placeholder="Histórico comercial, particularidades, nível, objetivos e etc."
                      value={anotacoes}
                      onChange={(e) => setAnotacoes(e.target.value)}
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>

            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
