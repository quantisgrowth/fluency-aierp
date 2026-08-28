import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Tv,
  Wind,
  Armchair,
  Coffee,
  BookOpen,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  QrCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Trash2,
  Edit,
  X,
  Sparkles,
  MapPin,
  Users,
  Check,
  Tag,
  DollarSign,
  Laptop,
  Wifi,
  Volume2,
  Maximize2,
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import {
  classrooms as initialClassrooms,
  inventoryItems as initialInventory,
  classes as initialClasses,
  type Classroom,
  type InventoryItem,
  type InventorySegment,
} from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário & Salas — Fluency AI" },
      { name: "description", content: "Controle de patrimônio, inventário de equipamentos e gestão de salas de aula." },
    ],
  }),
  component: InventarioPage,
});

const ALL_SEGMENTS: InventorySegment[] = [
  "Tecnologia & Audiovisual",
  "Climatização & Conforto",
  "Móveis & Mobiliário",
  "Eletrodomésticos & Copa",
  "Recursos Didáticos",
  "Segurança & Infraestrutura",
];

const SEGMENT_ICONS: Record<InventorySegment, any> = {
  "Tecnologia & Audiovisual": Tv,
  "Climatização & Conforto": Wind,
  "Móveis & Mobiliário": Armchair,
  "Eletrodomésticos & Copa": Coffee,
  "Recursos Didáticos": BookOpen,
  "Segurança & Infraestrutura": ShieldCheck,
};

function InventarioPage() {
  const [activeTab, setActiveTab] = useState<"inventario" | "salas" | "ocupacao">("inventario");

  // LocalStorage state for Inventory Items
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:inventory:items");
      return stored ? JSON.parse(stored) : initialInventory;
    } catch {
      return initialInventory;
    }
  });

  // LocalStorage state for Classrooms
  const [rooms, setRooms] = useState<Classroom[]>(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:inventory:rooms");
      return stored ? JSON.parse(stored) : initialClassrooms;
    } catch {
      return initialClassrooms;
    }
  });

  // LocalStorage state for Classes (for mapping occupancy)
  const [classesList, setClassesList] = useState(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:classes:list");
      return stored ? JSON.parse(stored) : initialClasses;
    } catch {
      return initialClasses;
    }
  });

  // Sync to local storage
  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:inventory:items", JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      window.localStorage.setItem("fluency-ai:inventory:rooms", JSON.stringify(rooms));
    } catch {}
  }, [rooms]);

  // Filters state
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("todos");
  const [roomFilter, setRoomFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Classroom | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);

  // Item Form Fields
  const [formNome, setFormNome] = useState("");
  const [formCodigo, setFormCodigo] = useState("");
  const [formSegmento, setFormSegmento] = useState<InventorySegment>("Tecnologia & Audiovisual");
  const [formMarca, setFormMarca] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formSalaId, setFormSalaId] = useState("sala-1");
  const [formConservacao, setFormConservacao] = useState<InventoryItem["estadoConservacao"]>("Excelente");
  const [formDataAquisicao, setFormDataAquisicao] = useState("15/01/2026");
  const [formValor, setFormValor] = useState(2500);
  const [formGarantia, setFormGarantia] = useState("15/01/2027");
  const [formResponsavel, setFormResponsavel] = useState("Coordenação");
  const [formNotas, setFormNotas] = useState("");

  // Room Form Fields & Dynamic Equipment Allocation
  const [roomNome, setRoomNome] = useState("");
  const [roomCapacidade, setRoomCapacidade] = useState(14);
  const [roomBloco, setRoomBloco] = useState("1º Andar - Bloco A");
  const [roomStatus, setRoomStatus] = useState<Classroom["status"]>("Disponível");
  const [roomResponsavel, setRoomResponsavel] = useState("Marcos Vidal");
  const [roomAllocatedItemIds, setRoomAllocatedItemIds] = useState<string[]>([]);
  const [selectedEquipIdToAllocate, setSelectedEquipIdToAllocate] = useState("");
  const [roomFacilities, setRoomFacilities] = useState<string[]>([]);
  const [newFacilityInput, setNewFacilityInput] = useState("");

  // Metrics
  const totalValue = items.reduce((acc, item) => acc + (item.valorCompra || 0), 0);
  const itemsInMaintenance = items.filter((i) => i.estadoConservacao === "Em Manutenção" || i.estadoConservacao === "Necessita Reparo").length;
  const totalItemsCount = items.length;
  const totalRoomsCount = rooms.length;

  // Filtered Inventory Items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.patrimonioCodigo.toLowerCase().includes(search.toLowerCase()) ||
      item.marcaModelo.toLowerCase().includes(search.toLowerCase()) ||
      item.numeroSerie.toLowerCase().includes(search.toLowerCase());

    const matchesSegment = segmentFilter === "todos" ? true : item.segmento === segmentFilter;
    const matchesRoom = roomFilter === "todos" ? true : item.salaId === roomFilter;
    const matchesStatus = statusFilter === "todos" ? true : item.estadoConservacao === statusFilter;

    return matchesSearch && matchesSegment && matchesRoom && matchesStatus;
  });

  // Handlers for Inventory
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setFormNome("");
    setFormCodigo(`PAT-2026-${String(items.length + 1).padStart(3, "0")}`);
    setFormSegmento("Tecnologia & Audiovisual");
    setFormMarca("");
    setFormSerial("");
    setFormSalaId(rooms[0]?.id || "sala-1");
    setFormConservacao("Excelente");
    setFormDataAquisicao(new Date().toLocaleDateString("pt-BR"));
    setFormValor(1500);
    setFormGarantia("01/01/2028");
    setFormResponsavel("Coordenação");
    setFormNotas("");
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormCodigo(item.patrimonioCodigo);
    setFormSegmento(item.segmento);
    setFormMarca(item.marcaModelo);
    setFormSerial(item.numeroSerie);
    setFormSalaId(item.salaId);
    setFormConservacao(item.estadoConservacao);
    setFormDataAquisicao(item.dataAquisicao);
    setFormValor(item.valorCompra);
    setFormGarantia(item.garantiaAte);
    setFormResponsavel(item.responsavel);
    setFormNotas(item.notas || "");
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      toast.error("Informe o nome do equipamento.");
      return;
    }

    const roomObj = rooms.find((r) => r.id === formSalaId);
    const salaNome = roomObj ? roomObj.nome : "Almoxarifado / Estoque";

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                nome: formNome,
                patrimonioCodigo: formCodigo,
                segmento: formSegmento,
                marcaModelo: formMarca,
                numeroSerie: formSerial,
                salaId: formSalaId,
                salaNome,
                estadoConservacao: formConservacao,
                dataAquisicao: formDataAquisicao,
                valorCompra: Number(formValor),
                garantiaAte: formGarantia,
                responsavel: formResponsavel,
                notas: formNotas,
              }
            : i
        )
      );
      toast.success(`Item "${formNome}" atualizado com sucesso!`);
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        patrimonioCodigo: formCodigo,
        nome: formNome,
        segmento: formSegmento,
        marcaModelo: formMarca || "Genérico",
        numeroSerie: formSerial || "N/A",
        salaId: formSalaId,
        salaNome,
        estadoConservacao: formConservacao,
        dataAquisicao: formDataAquisicao,
        valorCompra: Number(formValor),
        garantiaAte: formGarantia,
        responsavel: formResponsavel,
        notas: formNotas,
      };
      setItems((prev) => [newItem, ...prev]);
      toast.success(`Item "${formNome}" cadastrado no patrimônio!`);
    }
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (id: string, nome: string) => {
    if (confirm(`Deseja realmente excluir o item "${nome}" do inventário?`)) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removido do inventário.");
    }
  };

  // Handlers for Rooms
  const handleOpenCreateRoom = () => {
    setEditingRoom(null);
    setRoomNome("");
    setRoomCapacidade(14);
    setRoomBloco("1º Andar - Bloco A");
    setRoomStatus("Disponível");
    setRoomResponsavel("Marcos Vidal");
    setRoomAllocatedItemIds([]);
    setRoomFacilities(["Wi-Fi Fluency-5G", "Quadro Magnético"]);
    setSelectedEquipIdToAllocate("");
    setNewFacilityInput("");
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Classroom) => {
    setEditingRoom(room);
    setRoomNome(room.nome);
    setRoomCapacidade(room.capacidade);
    setRoomBloco(room.blocoOuAndar);
    setRoomStatus(room.status);
    setRoomResponsavel(room.responsavel || "Coordenação");
    
    // Get all items in inventory currently allocated to this room
    const currentAllocated = items.filter((i) => i.salaId === room.id).map((i) => i.id);
    setRoomAllocatedItemIds(currentAllocated);

    // Get non-equipment facilities from room.recursos
    const itemNamesLower = items.filter((i) => i.salaId === room.id).map((i) => i.nome.toLowerCase());
    const extraFacilities = room.recursos.filter((r) => !itemNamesLower.some((name) => r.toLowerCase().includes(name) || name.includes(r.toLowerCase())));
    setRoomFacilities(extraFacilities.length > 0 ? extraFacilities : ["Wi-Fi Fluency-5G", "Quadro Magnético"]);
    
    setSelectedEquipIdToAllocate("");
    setNewFacilityInput("");
    setIsRoomModalOpen(true);
  };

  const handleAllocateEquipment = (itemId: string) => {
    if (!itemId) return;
    if (!roomAllocatedItemIds.includes(itemId)) {
      setRoomAllocatedItemIds([...roomAllocatedItemIds, itemId]);
      toast.success("Equipamento adicionado à sala!");
    }
    setSelectedEquipIdToAllocate("");
  };

  const handleDeallocateEquipment = (itemId: string) => {
    setRoomAllocatedItemIds(roomAllocatedItemIds.filter((id) => id !== itemId));
    toast.info("Equipamento desvinculado da sala.");
  };

  const handleAddFacility = () => {
    if (!newFacilityInput.trim()) return;
    if (!roomFacilities.includes(newFacilityInput.trim())) {
      setRoomFacilities([...roomFacilities, newFacilityInput.trim()]);
    }
    setNewFacilityInput("");
  };

  const handleRemoveFacility = (fac: string) => {
    setRoomFacilities(roomFacilities.filter((f) => f !== fac));
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNome.trim()) {
      toast.error("Informe o nome da sala.");
      return;
    }

    // Build resources list from allocated items + facilities
    const allocatedItemsObjects = items.filter((i) => roomAllocatedItemIds.includes(i.id));
    const allocatedNames = allocatedItemsObjects.map((i) => i.nome);
    const finalRecursos = Array.from(new Set([...allocatedNames, ...roomFacilities])).filter(Boolean);

    const targetRoomId = editingRoom ? editingRoom.id : `sala-${Date.now()}`;

    if (editingRoom) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === editingRoom.id
            ? {
                ...r,
                nome: roomNome,
                capacidade: Number(roomCapacidade),
                blocoOuAndar: roomBloco,
                recursos: finalRecursos,
                status: roomStatus,
                responsavel: roomResponsavel,
              }
            : r
        )
      );

      // Update items inventory
      setItems((prev) =>
        prev.map((item) => {
          if (roomAllocatedItemIds.includes(item.id)) {
            return { ...item, salaId: editingRoom.id, salaNome: roomNome };
          }
          if (item.salaId === editingRoom.id && !roomAllocatedItemIds.includes(item.id)) {
            return { ...item, salaId: "estoque", salaNome: "Almoxarifado / Estoque Central" };
          }
          return item;
        })
      );

      toast.success(`Sala "${roomNome}" atualizada com ${allocatedItemsObjects.length} equipamentos!`);
    } else {
      const newRoom: Classroom = {
        id: targetRoomId,
        nome: roomNome,
        capacidade: Number(roomCapacidade),
        blocoOuAndar: roomBloco,
        recursos: finalRecursos,
        status: roomStatus,
        responsavel: roomResponsavel,
        corIdentificadora: "from-blue-500/20 to-indigo-500/20",
      };
      setRooms((prev) => [...prev, newRoom]);

      // Update allocated items
      setItems((prev) =>
        prev.map((item) => {
          if (roomAllocatedItemIds.includes(item.id)) {
            return { ...item, salaId: targetRoomId, salaNome: roomNome };
          }
          return item;
        })
      );

      toast.success(`Sala "${roomNome}" criada com ${allocatedItemsObjects.length} equipamentos!`);
    }
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = (id: string, nome: string) => {
    if (confirm(`Deseja realmente remover a sala "${nome}"?`)) {
      setRooms((prev) => prev.filter((r) => r.id !== id));
      toast.success("Sala removida com sucesso.");
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const header = "Codigo;Equipamento;Segmento;Marca/Modelo;Numero Serie;Sala/Local;Estado;Data Compra;Valor (R$);Garantia;Responsavel\n";
    const rows = items.map((i) =>
      `"${i.patrimonioCodigo}";"${i.nome}";"${i.segmento}";"${i.marcaModelo}";"${i.numeroSerie}";"${i.salaNome}";"${i.estadoConservacao}";"${i.dataAquisicao}";"${i.valorCompra.toFixed(2)}";"${i.garantiaAte}";"${i.responsavel}"`
    ).join("\n");

    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_patrimonio_escola_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de patrimônio exportado com sucesso!");
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          eyebrow="Infraestrutura & Operações"
          title="Gestão de Salas de Aula & Inventário"
          description="Controle de patrimônio escolar, equipamentos de tecnologia/climatização e mapeamento físico de ambientes."
        />
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {activeTab === "inventario" && (
            <>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-all cursor-pointer shadow-sm active:scale-[0.97]"
              >
                <Download className="size-4 text-emerald-400" />
                <span>Exportar Relatório</span>
              </button>
              <button
                onClick={handleOpenCreateItem}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer active:scale-[0.97]"
              >
                <Plus className="size-4" />
                <span>Novo Equipamento</span>
              </button>
            </>
          )}

          {activeTab === "salas" && (
            <button
              onClick={handleOpenCreateRoom}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer active:scale-[0.97]"
            >
              <Plus className="size-4" />
              <span>Nova Sala de Aula</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-hairline pb-2">
        <button
          onClick={() => setActiveTab("inventario")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "inventario"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface"
          }`}
        >
          <Boxes className="size-4" />
          <span>Inventário de Equipamentos ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("salas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "salas"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface"
          }`}
        >
          <Building2 className="size-4" />
          <span>Salas de Aula Físicas ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ocupacao")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ocupacao"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-surface/50 text-muted-foreground hover:text-foreground hover:bg-surface"
          }`}
        >
          <Calendar className="size-4" />
          <span>Mapa de Ocupação das Salas</span>
        </button>
      </div>

      {/* TAB 1: INVENTÁRIO DE EQUIPAMENTOS */}
      {activeTab === "inventario" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4 space-y-1.5 border-l-4 border-l-primary">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor Total do Patrimônio</span>
              <p className="text-2xl font-bold text-foreground">
                {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-[11px] text-muted-foreground">Ativos imobilizados da escola</p>
            </GlassCard>

            <GlassCard className="p-4 space-y-1.5 border-l-4 border-l-blue-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total de Equipamentos</span>
              <p className="text-2xl font-bold text-foreground">{totalItemsCount} itens</p>
              <p className="text-[11px] text-muted-foreground">Distribuídos em {totalRoomsCount} salas e setores</p>
            </GlassCard>

            <GlassCard className="p-4 space-y-1.5 border-l-4 border-l-amber-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Em Manutenção / Reparo</span>
              <p className="text-2xl font-bold text-amber-400">{itemsInMaintenance} itens</p>
              <p className="text-[11px] text-muted-foreground">Necessitam de revisão técnica</p>
            </GlassCard>

            <GlassCard className="p-4 space-y-1.5 border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Salas de Aula Ativas</span>
              <p className="text-2xl font-bold text-emerald-400">{totalRoomsCount} ambientes</p>
              <p className="text-[11px] text-muted-foreground">100% climatizadas e equipadas</p>
            </GlassCard>
          </div>

          {/* Filters Bar */}
          <GlassCard className="p-4 grid gap-3 md:grid-cols-4 items-center">
            <div className="relative">
              <input
                placeholder="Buscar por código, nome, marca ou serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-hairline bg-surface/50 pl-10 pr-3 text-xs text-foreground outline-none focus:border-primary"
              />
              <Search className="size-4 text-muted-foreground absolute left-3 top-3" />
            </div>

            <div>
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
              >
                <option value="todos">Segmento: Todos</option>
                {ALL_SEGMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
              >
                <option value="todos">Localização: Todas as Salas</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
                <option value="estoque">Almoxarifado / Copa / Geral</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
              >
                <option value="todos">Estado: Todos</option>
                <option value="Novo">Novo</option>
                <option value="Excelente">Excelente</option>
                <option value="Bom">Bom</option>
                <option value="Necessita Reparo">Necessita Reparo</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </GlassCard>

          {/* Table */}
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-surface-elevated/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-3.5">Código / Tag</th>
                    <th className="px-5 py-3.5">Equipamento / Modelo</th>
                    <th className="px-5 py-3.5">Segmento</th>
                    <th className="px-5 py-3.5">Localização / Sala</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5">Valor (R$)</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredItems.map((item) => {
                    const IconComp = SEGMENT_ICONS[item.segmento] || Boxes;
                    const isMaint = item.estadoConservacao === "Em Manutenção" || item.estadoConservacao === "Necessita Reparo";

                    return (
                      <tr key={item.id} className="hover:bg-surface/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                          <span className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 text-[11px] text-primary">
                            {item.patrimonioCodigo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-bold text-foreground">{item.nome}</p>
                            <p className="text-[11px] text-muted-foreground">{item.marcaModelo} · S/N: {item.numeroSerie}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                            <IconComp className="size-3.5 text-primary" />
                            {item.segmento}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-foreground font-semibold">
                            <MapPin className="size-3 text-primary shrink-0" />
                            {item.salaNome}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isMaint
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : item.estadoConservacao === "Novo"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {item.estadoConservacao}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-foreground">
                          {item.valorCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setQrItem(item);
                              setIsQrModalOpen(true);
                            }}
                            title="Ver Etiqueta e QR Code"
                            className="p-1.5 rounded-lg border border-hairline hover:bg-surface-elevated text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <QrCode className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            title="Editar Equipamento"
                            className="p-1.5 rounded-lg border border-hairline hover:bg-surface-elevated text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.nome)}
                            title="Excluir do Patrimônio"
                            className="p-1.5 rounded-lg border border-hairline hover:bg-rose-500/10 text-rose-400 hover:border-rose-500/30 cursor-pointer transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  Nenhum equipamento encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: GESTÃO DE SALAS DE AULA */}
      {activeTab === "salas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              // Find active classes in this room
              const roomClasses = classesList.filter(
                (c: any) => c.salaId === room.id || c.salaNome?.toLowerCase().includes(room.nome.toLowerCase())
              );

              // Find items located in this room
              const roomItems = items.filter((i) => i.salaId === room.id);

              return (
                <GlassCard
                  key={room.id}
                  className="p-5 space-y-4 relative flex flex-col justify-between border-primary/20 hover:border-primary/50 transition-all shadow-md group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{room.blocoOuAndar}</span>
                        <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{room.nome}</h4>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                        {room.status}
                      </span>
                    </div>

                    {/* Capacity & Items Stats */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-hairline bg-surface/40 text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Capacidade</p>
                          <p className="font-bold text-foreground">{room.capacidade} lugares</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Boxes className="size-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Equipamentos</p>
                          <p className="font-bold text-foreground">{roomItems.length} ativos</p>
                        </div>
                      </div>
                    </div>

                    {/* Features / Resources */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recursos Instalados:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {room.recursos.map((rec, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] font-semibold text-foreground"
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Classes assigned */}
                    <div className="space-y-1.5 pt-2 border-t border-hairline">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Turmas Vinculadas ({roomClasses.length}):
                      </p>
                      {roomClasses.length > 0 ? (
                        <div className="space-y-1">
                          {roomClasses.map((c: any) => (
                            <div
                              key={c.nome}
                              className="flex items-center justify-between text-[11px] p-1.5 rounded bg-surface/50 border border-hairline"
                            >
                              <span className="font-semibold text-foreground">{c.nome} ({c.nivel})</span>
                              <span className="text-muted-foreground font-mono text-[10px]">{c.horario}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">Nenhuma turma alocada no momento.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
                    <button
                      onClick={() => handleOpenEditRoom(room)}
                      className="px-3 py-1.5 rounded-lg border border-hairline text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                    >
                      Editar Sala
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id, room.nome)}
                      className="px-3 py-1.5 rounded-lg border border-hairline text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MAPA DE OCUPAÇÃO */}
      {activeTab === "ocupacao" && (
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Grade de Agendamento e Ocupação por Sala</h3>
              <p className="text-xs text-muted-foreground">
                Acompanhe o uso físico das salas em cada dia e horário para evitar choque de horários e planejar novas turmas.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-elevated/60 text-muted-foreground border-b border-hairline">
                    <th className="px-4 py-3 font-semibold">Sala de Aula</th>
                    <th className="px-4 py-3 font-semibold">Segunda</th>
                    <th className="px-4 py-3 font-semibold">Terça</th>
                    <th className="px-4 py-3 font-semibold">Quarta</th>
                    <th className="px-4 py-3 font-semibold">Quinta</th>
                    <th className="px-4 py-3 font-semibold">Sexta</th>
                    <th className="px-4 py-3 font-semibold">Sábado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {rooms.map((room) => {
                    const roomClasses = classesList.filter(
                      (c: any) => c.salaId === room.id || c.salaNome?.toLowerCase().includes(room.nome.toLowerCase())
                    );

                    const getClassesForDay = (dayKey: string) => {
                      return roomClasses.filter((c: any) => {
                        const h = (c.horario || "").toLowerCase();
                        const dias = (c.diasSelecionados || []).map((d: string) => d.toLowerCase());
                        const matchShort = dayKey.toLowerCase();
                        return dias.some((d: string) => d.includes(matchShort)) || h.includes(matchShort);
                      });
                    };

                    return (
                      <tr key={room.id} className="hover:bg-surface/20">
                        <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap bg-surface-elevated/20">
                          <div>
                            <p>{room.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-normal">{room.capacidade} lugares · {room.blocoOuAndar}</p>
                          </div>
                        </td>

                        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => {
                          const dailyClasses = getClassesForDay(day);

                          return (
                            <td key={day} className="px-4 py-3 align-top min-w-[150px]">
                              {dailyClasses.length > 0 ? (
                                <div className="space-y-1.5">
                                  {dailyClasses.map((c: any) => (
                                    <div
                                      key={c.nome}
                                      className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-[11px] space-y-0.5"
                                    >
                                      <p className="font-bold text-primary">{c.nome}</p>
                                      <p className="text-[10px] text-foreground/80">{c.professor}</p>
                                      <p className="text-[9px] text-muted-foreground font-mono">{c.horario?.split(" ")[1] || "19:00"}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/60 italic">Livre</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL: CADASTRAR / EDITAR EQUIPAMENTO */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 shadow-2xl relative border-primary/20">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-hairline pb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Boxes className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingItem ? "Editar Equipamento / Ativo" : "Cadastrar Novo Equipamento no Patrimônio"}
                </h3>
                <p className="text-xs text-muted-foreground">Preencha os detalhes fiscais, localização e estado de conservação.</p>
              </div>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código de Patrimônio (Tag)</label>
                  <input
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs font-mono text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Segmento do Ativo</label>
                  <select
                    value={formSegmento}
                    onChange={(e) => setFormSegmento(e.target.value as InventorySegment)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    {ALL_SEGMENTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome do Equipamento</label>
                <input
                  placeholder={'Ex: Smart TV 65" Crystal UHD 4K'}
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marca & Modelo</label>
                  <input
                    placeholder="Ex: Samsung UN65CU7700"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Número de Série (S/N)</label>
                  <input
                    placeholder="Ex: SAM-65CU-99881"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs font-mono text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sala / Localização Físico</label>
                  <select
                    value={formSalaId}
                    onChange={(e) => setFormSalaId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.nome} ({r.blocoOuAndar})</option>
                    ))}
                    <option value="estoque">Almoxarifado / Estoque Central</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado de Conservação</label>
                  <select
                    value={formConservacao}
                    onChange={(e) => setFormConservacao(e.target.value as any)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Novo">Novo (Recém adquirido)</option>
                    <option value="Excelente">Excelente (Sem marcas de uso)</option>
                    <option value="Bom">Bom (Uso regular normal)</option>
                    <option value="Necessita Reparo">Necessita Reparo Técnico</option>
                    <option value="Em Manutenção">Em Manutenção / Oficina</option>
                    <option value="Inativo">Inativo / Descarte</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor de Compra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValor}
                    onChange={(e) => setFormValor(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data de Aquisição</label>
                  <input
                    value={formDataAquisicao}
                    onChange={(e) => setFormDataAquisicao(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Garantia Até</label>
                  <input
                    value={formGarantia}
                    onChange={(e) => setFormGarantia(e.target.value)}
                    className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações / Histórico de Manutenção</label>
                <textarea
                  rows={2}
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  placeholder="Ex: Suporte articulado instalado na parede. Última higienização de filtros em 01/08/2026."
                  className="w-full rounded-lg border border-hairline bg-surface/50 p-2.5 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* MODAL: CADASTRAR / EDITAR SALA DE AULA (LAYOUT AMPLO & VÍNCULO DIRETO COM BANCO DE EQUIPAMENTOS) */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative border-primary/20">
            <button
              onClick={() => setIsRoomModalOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-hairline pb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingRoom ? `Editar Sala: ${editingRoom.nome}` : "Nova Sala de Aula Física"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configure o ambiente físico, capacidade máxima e vincule diretamente os equipamentos de tecnologia e mobília do banco de dados.
                </p>
              </div>
            </div>

            {(() => {
              // Objects of currently allocated equipment
              const allocatedItems = items.filter((i) => roomAllocatedItemIds.includes(i.id));
              const totalRoomAssetsValue = allocatedItems.reduce((acc, i) => acc + (i.valorCompra || 0), 0);

              // Available items from database to allocate (not in this room currently)
              const availableItemsToAllocate = items.filter((i) => !roomAllocatedItemIds.includes(i.id));

              return (
                <form onSubmit={handleSaveRoom} className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-8 items-start">
                    
                    {/* COLUMN 1: BASIC ROOM ATTRIBUTES */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-hairline pb-2">
                        <Building2 className="size-3.5" /> Informações do Espaço Físico
                      </h4>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome do Ambiente / Sala</label>
                        <input
                          placeholder="Ex: Sala 01 - London"
                          value={roomNome}
                          onChange={(e) => setRoomNome(e.target.value)}
                          className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacidade (Lugares)</label>
                          <input
                            type="number"
                            min={1}
                            value={roomCapacidade}
                            onChange={(e) => setRoomCapacidade(Number(e.target.value))}
                            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Andar / Bloco</label>
                          <input
                            placeholder="Ex: 1º Andar - Bloco A"
                            value={roomBloco}
                            onChange={(e) => setRoomBloco(e.target.value)}
                            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-sm text-foreground outline-none focus:border-primary"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Operacional</label>
                          <select
                            value={roomStatus}
                            onChange={(e) => setRoomStatus(e.target.value as any)}
                            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="Disponível">Disponível / Ativa</option>
                            <option value="Em Manutenção">Em Manutenção / Obras</option>
                            <option value="Reservada">Reservada para Eventos</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável do Espaço</label>
                          <input
                            placeholder="Ex: Marcos Vidal"
                            value={roomResponsavel}
                            onChange={(e) => setRoomResponsavel(e.target.value)}
                            className="h-10 w-full rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Extra Facilities / Infrastucture */}
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                          <span>Facilidades & Infraestrutura da Sala</span>
                          <span className="text-[10px] text-muted-foreground font-normal">Ex: Wi-Fi, Tomadas, Quadro</span>
                        </label>

                        {/* Badges of current facilities */}
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-hairline bg-surface/30">
                          {roomFacilities.map((fac) => (
                            <span
                              key={fac}
                              className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {fac}
                              <button
                                type="button"
                                onClick={() => handleRemoveFacility(fac)}
                                className="text-primary hover:text-foreground cursor-pointer bg-transparent border-0 p-0"
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          ))}
                          {roomFacilities.length === 0 && (
                            <span className="text-[11px] text-muted-foreground italic py-0.5">Nenhuma facilidade extra cadastrada.</span>
                          )}
                        </div>

                        {/* Input to add facility */}
                        <div className="flex gap-2">
                          <input
                            placeholder="Adicionar facilidade (ex: Tomadas 220V, Iluminação Cênica)..."
                            value={newFacilityInput}
                            onChange={(e) => setNewFacilityInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddFacility();
                              }
                            }}
                            className="h-9 flex-1 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={handleAddFacility}
                            className="rounded-lg bg-surface-elevated border border-hairline px-3 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer transition-colors"
                          >
                            + Adicionar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 2: INVENTORY ASSETS / DATABASE EQUIPMENT ALLOCATION */}
                    <div className="space-y-4 rounded-xl border border-hairline bg-surface/20 p-5">
                      <div className="flex items-center justify-between border-b border-hairline pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <Boxes className="size-3.5" /> Equipamentos Alocados ({allocatedItems.length})
                        </h4>
                        <span className="text-xs font-bold text-foreground">
                          Total: {totalRoomAssetsValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>

                      {/* Equipment Allocation Dropdown from Database */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Vincular Equipamento do Banco de Dados
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={selectedEquipIdToAllocate}
                            onChange={(e) => setSelectedEquipIdToAllocate(e.target.value)}
                            className="h-10 flex-1 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                          >
                            <option value="">Selecione um equipamento cadastrado no inventário...</option>
                            {availableItemsToAllocate.map((item) => (
                              <option key={item.id} value={item.id}>
                                [{item.patrimonioCodigo}] {item.nome} ({item.marcaModelo}) · {item.segmento} (Atual: {item.salaNome})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!selectedEquipIdToAllocate}
                            onClick={() => handleAllocateEquipment(selectedEquipIdToAllocate)}
                            className="rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow shrink-0"
                          >
                            + Alocar
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          * Ao alocar, o equipamento será transferido automaticamente para esta sala no inventário geral.
                        </p>
                      </div>

                      {/* List of currently allocated equipment items */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {allocatedItems.length > 0 ? (
                          allocatedItems.map((item) => {
                            const IconComp = SEGMENT_ICONS[item.segmento] || Boxes;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-surface-elevated/40 hover:bg-surface-elevated transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                                    <IconComp className="size-4" />
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] font-bold text-primary bg-surface border border-hairline px-1.5 py-0.5 rounded">
                                        {item.patrimonioCodigo}
                                      </span>
                                      <p className="text-xs font-bold text-foreground">{item.nome}</p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                      {item.marcaModelo} · S/N: {item.numeroSerie} · {item.valorCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                      item.estadoConservacao === "Novo"
                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                        : item.estadoConservacao === "Excelente"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}
                                  >
                                    {item.estadoConservacao}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeallocateEquipment(item.id)}
                                    title="Desvincular e mover para Almoxarifado"
                                    className="p-1.5 rounded bg-surface border border-hairline hover:bg-overdue/10 text-muted-foreground hover:text-overdue transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-8 text-center border border-dashed border-hairline rounded-lg text-muted-foreground space-y-1">
                            <Boxes className="size-6 mx-auto text-muted-foreground opacity-50" />
                            <p className="text-xs font-semibold">Nenhum equipamento de patrimônio alocado.</p>
                            <p className="text-[11px]">Selecione um equipamento no dropdown acima para instalá-lo nesta sala.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                    <button
                      type="button"
                      onClick={() => setIsRoomModalOpen(false)}
                      className="rounded-lg border border-hairline px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Salvar Configurações da Sala
                    </button>
                  </div>
                </form>
              );
            })()}
          </GlassCard>
        </div>
      )}

      {/* MODAL: FICHA DE PATRIMÔNIO & ETIQUETA COM QR CODE */}
      {isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm p-6 space-y-5 shadow-2xl relative text-center border-primary/20">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            >
              <X className="size-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Etiqueta de Patrimônio Escolar</span>
              <h3 className="text-base font-bold text-foreground">{qrItem.nome}</h3>
              <p className="text-xs text-muted-foreground font-mono">{qrItem.patrimonioCodigo}</p>
            </div>

            {/* Simulated QR Code Card */}
            <div className="mx-auto grid size-44 place-items-center rounded-2xl bg-white p-4 shadow-inner">
              <QrCode className="size-36 text-zinc-900" />
            </div>

            <div className="rounded-xl border border-hairline bg-surface/50 p-3 text-left text-xs space-y-1.5">
              <p><strong>Local:</strong> {qrItem.salaNome}</p>
              <p><strong>Segmento:</strong> {qrItem.segmento}</p>
              <p><strong>S/N:</strong> <span className="font-mono">{qrItem.numeroSerie}</span></p>
              <p><strong>Garantia:</strong> {qrItem.garantiaAte}</p>
              <p><strong>Valor:</strong> {qrItem.valorCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </div>

            <button
              onClick={() => {
                window.print();
                toast.success("Enviado para impressão!");
              }}
              className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 transition-all cursor-pointer border-0"
            >
              Imprimir Etiqueta Física
            </button>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
