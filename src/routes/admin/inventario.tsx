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
  ArrowLeft,
} from "lucide-react";
import { GlassCard } from "@/components/kit/glass-card";
import { SectionHeader } from "@/components/kit/section-header";
import {
  classrooms as initialClassrooms,
  inventoryItems as initialInventory,
  classes as initialClasses,
  students as initialStudents,
  CLASS_COLOR_THEMES,
  type Classroom,
  type InventoryItem,
  type InventorySegment,
  type ClassColorTheme,
} from "@/data/mock";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

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

  // LocalStorage state for Students (for displaying students inside class detail modal)
  const [studentsList, setStudentsList] = useState(() => {
    try {
      const stored = window.localStorage.getItem("fluency-ai:students:list");
      return stored ? JSON.parse(stored) : initialStudents;
    } catch {
      return initialStudents;
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

  // Occupancy Map Filters & Modal State
  const [mapShiftFilter, setMapShiftFilter] = useState<string>("todos");
  const [mapTeacherFilter, setMapTeacherFilter] = useState<string>("todos");
  const [selectedMapClass, setSelectedMapClass] = useState<any | null>(null);
  const [isMapClassDetailOpen, setIsMapClassDetailOpen] = useState(false);

  // View State: "dashboard" (Standard tabbed inventory) | "sala-detail" (Full Page Dedicated Room Manager)
  const [currentView, setCurrentView] = useState<"dashboard" | "sala-detail">("dashboard");

  // Room Equipment Search and Segment Filters inside Full Page View
  const [equipSearchTerm, setEquipSearchTerm] = useState("");
  const [equipSegmentFilter, setEquipSegmentFilter] = useState<string>("todos");

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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
    setRoomFacilities(["Wi-Fi Fluency-5G", "Quadro Magnético", "Ar Condicionado 18k BTUs"]);
    setSelectedEquipIdToAllocate("");
    setNewFacilityInput("");
    setEquipSearchTerm("");
    setEquipSegmentFilter("todos");
    setCurrentView("sala-detail");
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
    setEquipSearchTerm("");
    setEquipSegmentFilter("todos");
    setCurrentView("sala-detail");
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
    setCurrentView("dashboard");
    setActiveTab("salas");
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

  // FULL PAGE VIEW: GESTÃO DA SALA DE AULA DEDICADA
  if (currentView === "sala-detail") {
    const allocatedItems = items.filter((i) => roomAllocatedItemIds.includes(i.id));
    const totalRoomAssetsValue = allocatedItems.reduce((acc, i) => acc + (i.valorCompra || 0), 0);

    // Filter available equipment from inventory (excluding items already allocated to this room)
    const availableItemsToAllocate = items.filter((i) => {
      const isAlreadyAllocated = roomAllocatedItemIds.includes(i.id);
      if (isAlreadyAllocated) return false;

      const matchesSearch =
        equipSearchTerm === "" ||
        i.nome.toLowerCase().includes(equipSearchTerm.toLowerCase()) ||
        i.patrimonioCodigo.toLowerCase().includes(equipSearchTerm.toLowerCase()) ||
        i.marcaModelo.toLowerCase().includes(equipSearchTerm.toLowerCase()) ||
        i.numeroSerie.toLowerCase().includes(equipSearchTerm.toLowerCase());

      const matchesSegment = equipSegmentFilter === "todos" || i.segmento === equipSegmentFilter;

      return matchesSearch && matchesSegment;
    });

    // Room classes linked to this room
    const targetRoomId = editingRoom?.id || "";
    const linkedClasses = classesList.filter((c: any) =>
      c.salaId === targetRoomId || (editingRoom && c.salaNome?.toLowerCase().includes(editingRoom.nome.toLowerCase()))
    );

    return (
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-300 pb-12">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setCurrentView("dashboard")}
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="size-4" /> Voltar para Inventário & Salas
            </button>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {editingRoom ? `Gestão da Sala: ${roomNome || editingRoom.nome}` : "Cadastro de Nova Sala de Aula Física"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ambiente físico, capacidade máxima, facilidades e catálogo completo de equipamentos instalados.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges on Top */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                roomStatus === "Disponível"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : roomStatus === "Em Manutenção"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
              }`}
            >
              Status: {roomStatus}
            </span>
            <span className="rounded-full bg-surface border border-hairline px-3 py-1 text-xs font-semibold text-foreground">
              Capacidade: <strong>{roomCapacidade} lugares</strong>
            </span>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              Patrimônio: {totalRoomAssetsValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>

        {/* Full Page Main Form */}
        <form onSubmit={handleSaveRoom} className="space-y-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: PHYSICAL ROOM ATTRIBUTES & CLASSES (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card 1: Informações Gerais do Ambiente */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-hairline pb-3">
                  <Building2 className="size-4" /> Informações do Espaço Físico
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nome da Sala / Ambiente
                  </label>
                  <input
                    placeholder="Ex: Sala 01 - London"
                    value={roomNome}
                    onChange={(e) => setRoomNome(e.target.value)}
                    className="h-11 w-full rounded-xl border border-hairline bg-surface/50 px-3.5 text-sm text-foreground font-medium outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Capacidade (Lugares)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={roomCapacidade}
                      onChange={(e) => setRoomCapacidade(Number(e.target.value))}
                      className="h-11 w-full rounded-xl border border-hairline bg-surface/50 px-3.5 text-sm text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Andar / Bloco
                    </label>
                    <input
                      placeholder="Ex: 1º Andar - Bloco A"
                      value={roomBloco}
                      onChange={(e) => setRoomBloco(e.target.value)}
                      className="h-11 w-full rounded-xl border border-hairline bg-surface/50 px-3.5 text-sm text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status Operacional
                    </label>
                    <select
                      value={roomStatus}
                      onChange={(e) => setRoomStatus(e.target.value as any)}
                      className="h-11 w-full rounded-xl border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="Disponível">Disponível / Ativa</option>
                      <option value="Em Manutenção">Em Manutenção / Obras</option>
                      <option value="Reservada">Reservada para Eventos</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Responsável do Espaço
                    </label>
                    <input
                      placeholder="Ex: Marcos Vidal"
                      value={roomResponsavel}
                      onChange={(e) => setRoomResponsavel(e.target.value)}
                      className="h-11 w-full rounded-xl border border-hairline bg-surface/50 px-3.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Card 2: Facilidades & Infraestrutura */}
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Wifi className="size-4" /> Facilidades & Infraestrutura
                  </h3>
                  <span className="text-[11px] text-muted-foreground">Ex: Wi-Fi, Tomadas, Quadro</span>
                </div>

                {/* Badges of current facilities */}
                <div className="flex flex-wrap gap-2 min-h-[44px] p-2.5 rounded-xl border border-hairline bg-surface/30">
                  {roomFacilities.map((fac) => (
                    <span
                      key={fac}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      {fac}
                      <button
                        type="button"
                        onClick={() => handleRemoveFacility(fac)}
                        className="text-primary hover:text-foreground cursor-pointer bg-transparent border-0 p-0 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                  {roomFacilities.length === 0 && (
                    <span className="text-xs text-muted-foreground italic py-1">Nenhuma facilidade extra cadastrada.</span>
                  )}
                </div>

                {/* Input to add facility */}
                <div className="flex gap-2">
                  <input
                    placeholder="Adicionar facilidade (ex: Tomadas 220V, Iluminação Dimerizável)..."
                    value={newFacilityInput}
                    onChange={(e) => setNewFacilityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFacility();
                      }
                    }}
                    className="h-10 flex-1 rounded-xl border border-hairline bg-surface/50 px-3.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddFacility}
                    className="rounded-xl bg-surface-elevated border border-hairline px-4 text-xs font-bold text-foreground hover:bg-accent cursor-pointer transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>
              </GlassCard>

              {/* Card 3: Turmas que utilizam este Espaço */}
              {editingRoom && (
                <GlassCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-hairline pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <BookOpen className="size-4" /> Turmas Vinculadas nesta Sala ({linkedClasses.length})
                    </h3>
                    <Link to="/turmas" className="text-[11px] text-primary hover:underline font-semibold">
                      Ver no Módulo de Turmas ➜
                    </Link>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {linkedClasses.length > 0 ? (
                      linkedClasses.map((c: any) => {
                        const themeObj = CLASS_COLOR_THEMES.find((t) => t.id === c.corTheme) || CLASS_COLOR_THEMES[0];
                        return (
                          <div
                            key={c.nome}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${themeObj.badgeBg} ${themeObj.border}`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${themeObj.text}`}>{c.nome}</span>
                                <span className="rounded bg-surface/80 border border-hairline px-1.5 py-0.2 text-[9px] font-bold text-foreground">
                                  CEFR {c.nivel}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">Prof. {c.professor}</p>
                            </div>
                            <span className="font-mono text-[10px] font-semibold text-foreground bg-surface/60 px-2 py-1 rounded-md border border-hairline">
                              {c.horario}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed border-hairline rounded-xl">
                        Nenhuma turma agendada para esta sala no momento.
                      </p>
                    )}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* COLUMN 2: INVENTORY ASSETS & EQUIPMENT ALLOCATION (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card 1: Painel Visual de Alocação de Equipamentos */}
              <GlassCard className="p-6 space-y-5 border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-hairline pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Boxes className="size-4 text-primary" /> Vincular Equipamento do Inventário
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Pesquise e vincule ativos de tecnologia, climatização e mobília diretamente para esta sala.
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary self-start sm:self-auto">
                    {availableItemsToAllocate.length} disponíveis
                  </span>
                </div>

                {/* Search Bar & Segment Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl border border-hairline bg-surface/50 px-3.5 py-2.5">
                    <Search className="size-4 text-muted-foreground shrink-0" />
                    <input
                      placeholder="Buscar por nome do equipamento, código PAT, marca ou modelo..."
                      value={equipSearchTerm}
                      onChange={(e) => setEquipSearchTerm(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    {equipSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setEquipSearchTerm("")}
                        className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Segment Filter Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEquipSegmentFilter("todos")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        equipSegmentFilter === "todos"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-surface/50 border border-hairline text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todos os Segmentos
                    </button>
                    {ALL_SEGMENTS.map((seg) => (
                      <button
                        key={seg}
                        type="button"
                        onClick={() => setEquipSegmentFilter(seg)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          equipSegmentFilter === seg
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-surface/50 border border-hairline text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {seg.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Items List in Cards (Clean & High Visibility) */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {availableItemsToAllocate.length > 0 ? (
                    availableItemsToAllocate.map((item) => {
                      const IconComp = SEGMENT_ICONS[item.segmento] || Boxes;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-hairline bg-surface-elevated/30 hover:bg-surface-elevated/70 transition-all text-xs"
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                              <IconComp className="size-4" />
                            </span>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-primary bg-surface border border-hairline px-1.5 py-0.5 rounded">
                                  {item.patrimonioCodigo}
                                </span>
                                <h4 className="font-bold text-foreground text-xs">{item.nome}</h4>
                                <span className="text-[10px] rounded bg-surface border border-hairline px-1.5 py-0.2 text-muted-foreground">
                                  {item.segmento}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {item.marcaModelo} · S/N: <span className="font-mono">{item.numeroSerie}</span> · {item.valorCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                              <p className="text-[10px] text-primary/80 font-medium">
                                Local Atual: <strong>{item.salaNome}</strong>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAllocateEquipment(item.id)}
                            className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow-sm cursor-pointer transition-all active:scale-[0.97] self-end sm:self-center shrink-0"
                          >
                            + Vincular à Sala
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center border border-dashed border-hairline rounded-xl text-muted-foreground space-y-1">
                      <Boxes className="size-8 mx-auto text-muted-foreground opacity-40" />
                      <p className="text-xs font-semibold">Nenhum equipamento disponível encontrado.</p>
                      <p className="text-[11px]">Tente alterar os termos de busca ou o filtro de segmento acima.</p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Card 2: Lista dos Equipamentos Atualmente Instalados nesta Sala */}
              <GlassCard className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-400" /> Equipamentos Instalados nesta Sala ({allocatedItems.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Lista de ativos de patrimônio atribuídos fisicamente a este ambiente.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">
                      Total: {totalRoomAssetsValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {allocatedItems.length > 0 ? (
                    allocatedItems.map((item) => {
                      const IconComp = SEGMENT_ICONS[item.segmento] || Boxes;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-hairline bg-surface/50 hover:bg-surface-elevated transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                              <IconComp className="size-4" />
                            </span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-primary bg-surface border border-hairline px-1.5 py-0.5 rounded">
                                  {item.patrimonioCodigo}
                                </span>
                                <h4 className="font-bold text-foreground text-xs">{item.nome}</h4>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {item.marcaModelo} · S/N: <span className="font-mono">{item.numeroSerie}</span> · {item.valorCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
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
                              className="p-2 rounded-lg bg-surface border border-hairline hover:bg-overdue/10 text-muted-foreground hover:text-overdue transition-colors cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center border border-dashed border-hairline rounded-xl text-muted-foreground space-y-2">
                      <Boxes className="size-8 mx-auto text-muted-foreground opacity-40" />
                      <p className="text-xs font-semibold">Nenhum equipamento de patrimônio alocado nesta sala.</p>
                      <p className="text-[11px]">Selecione e vincule equipamentos no catálogo acima para equipar esta sala de aula.</p>
                    </div>
                  )}
                </div>
              </GlassCard>

            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-hairline bg-surface/80 backdrop-blur-md sticky bottom-4 shadow-xl z-20">
            <button
              type="button"
              onClick={() => setCurrentView("dashboard")}
              className="rounded-xl border border-hairline px-6 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Cancelar e Voltar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-8 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
            >
              Salvar Configurações da Sala
            </button>
          </div>
        </form>
      </div>
    );
  }

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Grade de Agendamento e Ocupação por Sala</h3>
                <p className="text-xs text-muted-foreground">
                  Acompanhe o uso físico das salas em cada dia e clique na turma para abrir seus detalhes pedagógicos.
                </p>
              </div>

              {/* Map Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={mapShiftFilter}
                  onChange={(e) => setMapShiftFilter(e.target.value)}
                  className="h-9 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  <option value="todos">Turno: Todos</option>
                  <option value="manha">Manhã (07:00 - 12:00)</option>
                  <option value="tarde">Tarde (12:00 - 18:00)</option>
                  <option value="noite">Noite (18:00 - 22:00)</option>
                </select>

                <select
                  value={mapTeacherFilter}
                  onChange={(e) => setMapTeacherFilter(e.target.value)}
                  className="h-9 rounded-lg border border-hairline bg-surface/50 px-3 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  <option value="todos">Professor: Todos</option>
                  {Array.from(new Set(classesList.map((c: any) => c.professor))).map((prof: any) => (
                    <option key={prof} value={prof}>
                      {prof}
                    </option>
                  ))}
                </select>
              </div>
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
                    const roomClasses = classesList.filter((c: any) => {
                      const matchesRoom =
                        c.salaId === room.id ||
                        c.salaNome?.toLowerCase().includes(room.nome.toLowerCase());
                      const matchesTeacher =
                        mapTeacherFilter === "todos" || c.professor === mapTeacherFilter;

                      // Shift filtering
                      let matchesShift = true;
                      if (mapShiftFilter !== "todos") {
                        const startH = parseInt(c.horaSelecionada || c.horario?.split(" ")[1] || "19", 10);
                        if (mapShiftFilter === "manha") matchesShift = startH < 12;
                        else if (mapShiftFilter === "tarde") matchesShift = startH >= 12 && startH < 18;
                        else if (mapShiftFilter === "noite") matchesShift = startH >= 18;
                      }

                      return matchesRoom && matchesTeacher && matchesShift;
                    });

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
                            <p className="flex items-center gap-1.5">
                              <Building2 className="size-3.5 text-primary shrink-0" />
                              {room.nome}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-normal">
                              {room.capacidade} lugares · {room.blocoOuAndar}
                            </p>
                          </div>
                        </td>

                        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => {
                          const dailyClasses = getClassesForDay(day);

                          return (
                            <td key={day} className="px-4 py-3 align-top min-w-[160px]">
                              {dailyClasses.length > 0 ? (
                                <div className="space-y-2">
                                  {dailyClasses.map((c: any) => {
                                    const themeObj =
                                      CLASS_COLOR_THEMES.find((t) => t.id === c.corTheme) ||
                                      CLASS_COLOR_THEMES[0];

                                    return (
                                      <button
                                        key={c.nome}
                                        type="button"
                                        onClick={() => {
                                          setSelectedMapClass(c);
                                          setIsMapClassDetailOpen(true);
                                        }}
                                        className={`w-full text-left p-2.5 rounded-lg border text-[11px] space-y-1 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${themeObj.badgeBg} ${themeObj.border} ${themeObj.bgHover}`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className={`font-bold ${themeObj.text}`}>{c.nome}</span>
                                          <span className={`size-2 rounded-full ${themeObj.dot}`} />
                                        </div>
                                        <p className="text-[10px] text-foreground/80 font-medium truncate">
                                          Prof. {c.professor}
                                        </p>
                                        <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                                          <span>{c.horario?.split(" ")[1] || "19:00"}</span>
                                          <span className="font-semibold text-foreground/70">
                                            {c.alunos || 0}/{c.vagas || 12} vagas
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/50 italic">Livre</span>
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

      {/* MODAL: DETALHES RÁPIDOS DA TURMA NO MAPA DE OCUPAÇÃO */}
      {isMapClassDetailOpen && selectedMapClass && (() => {
        const themeObj = CLASS_COLOR_THEMES.find((t) => t.id === selectedMapClass.corTheme) || CLASS_COLOR_THEMES[0];
        const assignedRoom = rooms.find((r) => r.id === selectedMapClass.salaId || r.nome === selectedMapClass.salaNome);
        const enrolledStudents = studentsList.filter((s: any) => {
          const sTurma = (s.turma || "").toLowerCase();
          const cNome = (selectedMapClass.nome || "").toLowerCase();
          return sTurma === cNome || sTurma.includes(cNome) || cNome.includes(sTurma);
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative border-primary/20">
              <button
                onClick={() => setIsMapClassDetailOpen(false)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 transition-colors"
              >
                <X className="size-5" />
              </button>

              {/* Header */}
              <div className="flex items-start gap-4 border-b border-hairline pb-4">
                <span className={`grid size-12 place-items-center rounded-2xl ${themeObj.badgeBg} ${themeObj.border} border text-foreground shrink-0`}>
                  <BookOpen className={`size-6 ${themeObj.text}`} />
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{selectedMapClass.nome}</h3>
                    <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${themeObj.badgeBg} ${themeObj.border} ${themeObj.text}`}>
                      CEFR {selectedMapClass.nivel}
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-surface-elevated border border-hairline px-2 py-0.5 text-xs font-medium text-foreground">
                      <span className={`size-2 rounded-full ${themeObj.dot}`} />
                      {themeObj.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Informações pedagógicas, ocupação da sala física e quadro de alunos matriculados.
                  </p>
                </div>
              </div>

              {/* 4 Info Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-hairline bg-surface/40 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Users className="size-3 text-primary" /> Professor Responsável
                  </span>
                  <p className="text-sm font-bold text-foreground">{selectedMapClass.professor}</p>
                </div>

                <div className="p-3 rounded-xl border border-hairline bg-surface/40 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="size-3 text-primary" /> Horários & Frequência
                  </span>
                  <p className="text-sm font-bold text-foreground">{selectedMapClass.horario}</p>
                </div>

                <div className="p-3 rounded-xl border border-hairline bg-surface/40 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="size-3 text-primary" /> Sala Física Alocada
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {selectedMapClass.salaNome || assignedRoom?.nome || "Sala 01 - London"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Capacidade: {assignedRoom?.capacidade || 14} lugares · {assignedRoom?.blocoOuAndar || "Térreo"}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-hairline bg-surface/40 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="size-3 text-primary" /> Livro & Trilha Didática
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {selectedMapClass.livroId === "livro-1"
                      ? "Fluency Starter (A1)"
                      : selectedMapClass.livroId === "livro-2"
                      ? "Global Communicator (A2)"
                      : selectedMapClass.livroId === "livro-3"
                      ? "Business Immersion (B1)"
                      : "Mastery Express (C1)"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Aula Atual: {selectedMapClass.aulaAtual || 1}</p>
                </div>
              </div>

              {/* Room Equipment List */}
              {assignedRoom && assignedRoom.recursos && assignedRoom.recursos.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-xl border border-hairline bg-surface/20">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Recursos Disponíveis nesta Sala:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedRoom.recursos.map((rec, i) => (
                      <span key={i} className="rounded bg-surface-elevated border border-hairline px-2 py-0.5 text-[10px] text-foreground font-medium">
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Enrolled Students Roster */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users className="size-3.5 text-primary" /> Alunos Matriculados ({enrolledStudents.length} de {selectedMapClass.vagas || 12} vagas)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Taxa: {Math.round((enrolledStudents.length / (selectedMapClass.vagas || 12)) * 100)}%
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {enrolledStudents.length > 0 ? (
                    enrolledStudents.map((st: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-hairline bg-surface/40 hover:bg-surface-elevated transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                            {st.nome.substring(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-bold text-foreground">{st.nome}</p>
                            <p className="text-[10px] text-muted-foreground">Nível Aluno: {st.nivel} · Pacote: {st.horasContratadas || 4}h/sem</p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            st.status === "Ativo"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed border-hairline rounded-lg">
                      Nenhum aluno matriculado diretamente nesta turma ainda.
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsMapClassDetailOpen(false)}
                  className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  Fechar
                </button>
                <Link
                  to="/turmas"
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow cursor-pointer transition-all flex items-center gap-1.5"
                >
                  Gerenciar no Módulo de Turmas ➜
                </Link>
              </div>
            </GlassCard>
          </div>
        );
      })()}

    </div>
  );
}
