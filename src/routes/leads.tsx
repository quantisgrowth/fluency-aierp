import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserPlus,
  Info,
  Tag,
  Phone,
  Mail,
  Building,
  MapPin,
  Notebook,
  Calendar,
  Eye,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  Check,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
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

type Question = {
  id: string;
  enunciado: string;
  nivel: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  correta: "A" | "B" | "C" | "D";
};

type Submission = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  score: number;
  total: number;
  level: string;
  date: string;
  respostas?: Record<string, string>;
};

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(DEFAULT_LEADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("");
  const [filterTeste, setFilterTeste] = useState<"todos" | "sim" | "nao">("todos");

  // Submissions and Questions for Test Review
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedLead, setSelectedLead] = useState<Submission | null>(null);

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
  const [origem, setOrigem] = useState(ORIGEM_IDEAS[0]!);
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

  // Load from local storage and sync across tabs
  useEffect(() => {
    const loadLeads = () => {
      try {
        const stored = window.localStorage.getItem(LEADS_STORAGE_KEY);
        if (stored) {
          setLeads(JSON.parse(stored));
        }
      } catch {
        /* ignore */
      }
    };

    loadLeads();

    // Load submissions and questions for CEFR test review
    try {
      const storedSubs = window.localStorage.getItem("fluency-ai:captacao:submissions");
      if (storedSubs) {
        setSubmissions(JSON.parse(storedSubs));
      }
      
      const storedQuestions = window.localStorage.getItem("fluency-ai:captacao:questions");
      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
      }
    } catch {
      /* ignore */
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LEADS_STORAGE_KEY) {
        loadLeads();
      }
      if (e.key === "fluency-ai:captacao:submissions") {
        try {
          if (e.newValue) setSubmissions(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === "fluency-ai:captacao:questions") {
        try {
          if (e.newValue) setQuestions(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveLeads = (nextLeads: Lead[]) => {
    setLeads(nextLeads);
    try {
      window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(nextLeads));
    } catch {
      /* ignore */
    }
  };

  // Lead Import Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<"file" | "paste">("file");
  const [importRawText, setImportRawText] = useState("");
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Parse raw delimited text (CSV, TSV, semicolon-separated) into Lead objects
  const parseDelimitedText = (text: string) => {
    if (!text.trim()) {
      setPreviewLeads([]);
      return;
    }

    const lines = text
      .split(/\r\n|\n|\r/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setPreviewLeads([]);
      return;
    }

    // Determine delimiter: comma, semicolon, tab or pipe
    const firstLine = lines[0]!;
    let delimiter = ",";
    if (firstLine.includes("\t")) delimiter = "\t";
    else if (firstLine.includes(";")) delimiter = ";";
    else if (firstLine.includes(",")) delimiter = ",";
    else if (firstLine.includes("|")) delimiter = "|";

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      return result;
    };

    const parsedRows = lines.map(parseLine);
    const headers = parsedRows[0]!.map((h) => h.toLowerCase());

    // Check if first row is a header
    const hasHeader =
      headers.some((h) =>
        ["nome", "name", "email", "e-mail", "telefone", "phone", "celular", "origem", "contato"].some((k) =>
          h.includes(k)
        )
      );

    const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;

    // Detect column indexes
    let nameIdx = hasHeader ? headers.findIndex((h) => h.includes("nom") || h.includes("name")) : 0;
    let phoneIdx = hasHeader ? headers.findIndex((h) => h.includes("tel") || h.includes("cel") || h.includes("phone") || h.includes("whats")) : 1;
    let emailIdx = hasHeader ? headers.findIndex((h) => h.includes("mail") || h.includes("e-mail")) : 2;
    let origemIdx = hasHeader ? headers.findIndex((h) => h.includes("orig") || h.includes("canal") || h.includes("fonte")) : 3;
    let tagsIdx = hasHeader ? headers.findIndex((h) => h.includes("tag") || h.includes("nivel") || h.includes("nível") || h.includes("curso")) : 4;
    let respIdx = hasHeader ? headers.findIndex((h) => h.includes("resp") || h.includes("pai") || h.includes("mãe") || h.includes("mae")) : 5;
    let cityIdx = hasHeader ? headers.findIndex((h) => h.includes("cid") || h.includes("city") || h.includes("uf") || h.includes("estado")) : 6;
    let docIdx = hasHeader ? headers.findIndex((h) => h.includes("doc") || h.includes("cpf") || h.includes("cnpj")) : 7;
    let notesIdx = hasHeader ? headers.findIndex((h) => h.includes("anot") || h.includes("obs") || h.includes("note")) : 8;

    if (nameIdx === -1) nameIdx = 0;
    if (phoneIdx === -1) phoneIdx = 1;
    if (emailIdx === -1) emailIdx = 2;

    const leadsGenerated: Lead[] = dataRows
      .filter((row) => row.length > 0 && row.some((cell) => cell.trim().length > 0))
      .map((row, idx) => {
        const leadNome = row[nameIdx] || `Lead Importado #${idx + 1}`;
        const leadPhone = row[phoneIdx] || "";
        const leadEmail = row[emailIdx] || "";
        const leadOrigem = row[origemIdx] || "Importação de Planilha";
        const leadTagsRaw = row[tagsIdx] || "Importado";
        const leadTags = leadTagsRaw.split(/[,\/|]/).map((t) => t.trim()).filter(Boolean);
        const leadResp = row[respIdx] || "Próprio Aluno / Autônomo";
        const leadCity = row[cityIdx] || "São Paulo";
        const leadDoc = row[docIdx] || "";
        const leadNotes = row[notesIdx] || "Importado via planilha em lote.";

        return {
          id: `lead-imp-${Date.now()}-${idx}`,
          nome: leadNome,
          tags: leadTags.length > 0 ? leadTags : ["Importado"],
          telefone: leadPhone || "+55 ",
          email: leadEmail || "",
          site: "",
          documento: leadDoc,
          empresa: "",
          origem: leadOrigem,
          dataNascimento: "",
          responsavel: leadResp,
          fezTesteNivel: false,
          pais: "Brasil",
          cep: "",
          endereco: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: leadCity,
          uf: "SP",
          anotacoes: leadNotes,
          createdAt: new Date().toISOString(),
        };
      });

    setPreviewLeads(leadsGenerated);
  };

  const handleFileUpload = (file: File) => {
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportRawText(text);
      parseDelimitedText(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "Nome,Telefone,Email,Origem,Tags / Nivel,Responsavel (Pai/Mae),Cidade,CPF/Documento,Anotacoes\n" +
      "Mariana Carvalho,+55 (11) 99123-4567,mariana@gmail.com,Tráfego Pago (Instagram Ad),Adulto/Iniciante,Próprio Aluno,São Paulo,123.456.789-00,Interesse em inglês para viagens\n" +
      "Enzo Gabriel Santos,+55 (11) 98774-1234,enzo.mae@outlook.com,Indicação de Aluno,Kids/Inglês,Luciana Santos (Mãe),São Paulo,987.654.321-11,Procurando turma após as 18h\n" +
      "Rodrigo Mendes,+55 (11) 97744-8899,rodrigo@empresa.com.br,Parceria Corporativa (B2B),Business/Avançado,Autônomo,São Paulo,456.789.123-22,Inglês para apresentações corporativas";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_leads_fluency_ai.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Modelo de planilha baixado com sucesso!");
  };

  const handleConfirmImport = () => {
    if (previewLeads.length === 0) {
      toast.error("Nenhum lead válido encontrado para importar.");
      return;
    }

    const nextLeads = [...previewLeads, ...leads];
    saveLeads(nextLeads);
    setIsImportModalOpen(false);
    setPreviewLeads([]);
    setImportRawText("");
    setImportFileName("");
    toast.success(`${previewLeads.length} leads importados com sucesso!`, {
      description: "Os novos contatos já estão disponíveis na sua base geral de leads.",
    });
  };

  const handleOpenCreateModal = () => {
    setNome("");
    setTagsInput("");
    setTelefone("+55 ");
    setEmail("");
    setSite("");
    setDocumento("");
    setEmpresa("");
    setOrigem(ORIGEM_IDEAS[0]!);
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
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setPreviewLeads([]);
              setImportRawText("");
              setImportFileName("");
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-elevated hover:border-primary transition-all cursor-pointer shadow-sm active:scale-[0.97]"
          >
            <FileSpreadsheet className="size-4 text-emerald-400" />
            <span>Importar Planilha</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer active:scale-[0.97]"
          >
            <Plus className="size-4" />
            <span>Cadastrar Lead</span>
          </button>
        </div>
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
                    {selectedDetails.fezTesteNivel && (() => {
                      const matchingSub = submissions.find(
                        (s) =>
                          s.email.toLowerCase() === selectedDetails.email.toLowerCase() ||
                          s.nome.toLowerCase() === selectedDetails.nome.toLowerCase()
                      );
                      if (!matchingSub) return null;
                      return (
                        <button
                          onClick={() => setSelectedLead(matchingSub)}
                          className="ml-2 inline-flex items-center gap-1 rounded bg-primary/20 hover:bg-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary cursor-pointer transition-all border-0 align-middle"
                        >
                          Visualizar Respostas
                        </button>
                      );
                    })()}
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
      {/* --- LEAD DETAIL / ANSWERS REVIEW MODAL --- */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-2xl p-6 space-y-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <XCircle className="size-4" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
              <div>
                <span className="rounded bg-primary/10 text-primary text-[8px] font-extrabold px-1.5 py-0.5 uppercase">Resultado Nivelamento</span>
                <h3 className="text-lg font-bold text-foreground mt-1">{selectedLead.nome}</h3>
                <p className="text-xs text-muted-foreground">Preenchido em {new Date(selectedLead.date).toLocaleString("pt-BR")}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-foreground">{selectedLead.level}</span>
                <p className="text-xs text-muted-foreground">Pontuação: <span className="font-bold text-primary">{selectedLead.score} / {selectedLead.total} acertos</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-hairline pb-4">
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">Dados de Contato</h4>
                <div className="space-y-1.5 text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Mail className="size-3.5 text-primary shrink-0" /> <strong>E-mail:</strong> {selectedLead.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="size-3.5 text-primary shrink-0" /> <strong>Telefone:</strong> {selectedLead.telefone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider border-b border-hairline pb-2">Gabarito de Respostas</h4>
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const leadAnswer = selectedLead.respostas?.[q.id];
                  const isCorrect = leadAnswer === q.correta;

                  return (
                    <div key={q.id} className="rounded-lg border border-hairline bg-white/[0.01] p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-muted-foreground">Questão #{idx + 1} ({q.nivel})</span>
                        {leadAnswer ? (
                          isCorrect ? (
                            <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5">Correto</span>
                          ) : (
                            <span className="rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5">Incorreto</span>
                          )
                        ) : (
                          <span className="rounded bg-zinc-500/10 text-zinc-400 text-[10px] font-bold px-2 py-0.5">Não Respondido</span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-foreground leading-relaxed">{q.enunciado}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: "A", val: q.opcaoA },
                          { key: "B", val: q.opcaoB },
                          { key: "C", val: q.opcaoC },
                          { key: "D", val: q.opcaoD },
                        ].map((opt) => {
                          const isChosen = leadAnswer === opt.key;
                          const isAnswerCorrect = q.correta === opt.key;

                          let optClass = "border-hairline text-muted-foreground bg-transparent";
                          if (isChosen) {
                            optClass = isCorrect 
                              ? "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold"
                              : "border-rose-500 bg-rose-500/10 text-foreground font-semibold";
                          } else if (isAnswerCorrect && !isCorrect && leadAnswer !== undefined) {
                            optClass = "border-emerald-500/50 bg-emerald-500/5 text-emerald-400 font-semibold";
                          }

                          return (
                            <div key={opt.key} className={`border rounded p-2 flex items-center justify-between ${optClass}`}>
                              <span>({opt.key}) {opt.val}</span>
                              {isChosen && (
                                isCorrect 
                                  ? <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                                  : <XCircle className="size-3.5 text-rose-400 shrink-0" />
                              )}
                              {!isChosen && isAnswerCorrect && !isCorrect && leadAnswer !== undefined && (
                                <span className="text-[9px] text-emerald-400 uppercase font-bold">Gabarito</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL: IMPORTAÇÃO DE LEADS VIA PLANILHA / GOOGLE SHEETS */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative border-primary/20">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileSpreadsheet className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Importação de Leads em Lote</h3>
                <p className="text-xs text-muted-foreground">
                  Suba arquivos CSV/Excel ou cole células copiadas do Google Planilhas.
                </p>
              </div>
            </div>

            {/* Tabs & Template Download */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode("file")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    importMode === "file"
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-surface/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="size-3.5" />
                  <span>Subir Arquivo (CSV/Excel)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode("paste")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    importMode === "paste"
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-surface/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>Colar do Google Sheets</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Baixar Modelo Padrão (.csv)</span>
              </button>
            </div>

            {/* Content Tab 1: File Upload */}
            {importMode === "file" && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={importFileRef}
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                <div
                  onClick={() => importFileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-hairline bg-surface/30 hover:border-primary hover:bg-surface/50"
                  }`}
                >
                  <span className="grid size-12 place-items-center rounded-full bg-surface-elevated border border-hairline text-primary">
                    <Upload className="size-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {importFileName ? (
                        <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                          <Check className="size-4" /> Arquivo selecionado: {importFileName}
                        </span>
                      ) : (
                        "Clique para selecionar ou arraste o arquivo aqui"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suporta arquivos .CSV, .TSV, .TXT delimitados por vírgula ou ponto-e-vírgula
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab 2: Paste Google Sheets Text */}
            {importMode === "paste" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Cole as linhas da sua planilha abaixo (Ctrl+V / Cmd+V):
                </label>
                <textarea
                  rows={6}
                  value={importRawText}
                  onChange={(e) => {
                    setImportRawText(e.target.value);
                    parseDelimitedText(e.target.value);
                  }}
                  placeholder="Nome	Telefone	Email	Origem	Nível&#10;Lucas Silva	(11) 99123-4567	lucas@gmail.com	Instagram	Iniciante&#10;Beatriz Santos	(11) 98774-1234	beatriz@outlook.com	Indicação	Intermediário"
                  className="w-full rounded-xl border border-hairline bg-surface/50 p-3 text-xs text-foreground font-mono outline-none focus:border-primary leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  * Você pode copiar células diretamente do Google Planilhas ou Excel e colar aqui.
                </p>
              </div>
            )}

            {/* Preview Section */}
            {previewLeads.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-hairline">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" />
                    Pré-visualização ({previewLeads.length} leads identificados)
                  </span>
                  <span className="text-[11px] text-muted-foreground">Mostrando os primeiros 4 registros</span>
                </div>

                <div className="rounded-xl border border-hairline overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-elevated/60 text-muted-foreground border-b border-hairline">
                        <th className="px-3 py-2 font-semibold">Nome</th>
                        <th className="px-3 py-2 font-semibold">Contato</th>
                        <th className="px-3 py-2 font-semibold">Origem</th>
                        <th className="px-3 py-2 font-semibold">Tags / Nível</th>
                        <th className="px-3 py-2 font-semibold">Responsável</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {previewLeads.slice(0, 4).map((l, idx) => (
                        <tr key={idx} className="hover:bg-surface/30">
                          <td className="px-3 py-2 font-medium text-foreground">{l.nome}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {l.telefone || l.email || "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{l.origem}</td>
                          <td className="px-3 py-2">
                            <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {l.tags.join(", ") || "Geral"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{l.responsavel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={previewLeads.length === 0}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Check className="size-4 stroke-[3]" />
                <span>Confirmar e Importar {previewLeads.length > 0 ? `(${previewLeads.length})` : ""}</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
