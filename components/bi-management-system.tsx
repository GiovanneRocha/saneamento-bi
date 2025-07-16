"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  Plus,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Building2,
  ArrowUp,
  ChevronDown,
} from "lucide-react"
import AreaManagement from "./area-management"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu" // Importar componentes do DropdownMenu

interface BiItem {
  id: number
  name: string
  owner: string
  area: string[] // Alterado para array de strings
  status: string
  lastUpdate: string
  observations: string
  usage: string
  criticality: string
}

interface Stats {
  total: number
  updated: number
  outdated: number
  noOwner: number
}

interface Area {
  id: number
  name: string
  description?: string
}

interface BiFormProps {
  bi?: BiItem
  onSave: (bi: BiItem) => void
  onCancel: () => void
  areas: Area[] // Passar as áreas disponíveis para o formulário
}

interface AreaFormProps {
  area?: Area
  onSave: (area: Area | Omit<Area, "id">) => void
  onCancel: () => void
}

// Funções de persistência
const STORAGE_KEY_BIS = "bi-management-bis"
const STORAGE_KEY_AREAS = "bi-management-areas"

const saveToLocalStorage = (bis: BiItem[], areas: Area[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_BIS, JSON.stringify(bis))
    localStorage.setItem(STORAGE_KEY_AREAS, JSON.stringify(areas))
  } catch (error) {
    console.warn("Erro ao salvar no localStorage:", error)
  }
}

const loadFromLocalStorage = (): { bis: BiItem[]; areas: Area[] } => {
  try {
    const savedBis = localStorage.getItem(STORAGE_KEY_BIS)
    const savedAreas = localStorage.getItem(STORAGE_KEY_AREAS)

    return {
      bis: savedBis ? JSON.parse(savedBis) : [],
      areas: savedAreas ? JSON.parse(savedAreas) : [],
    }
  } catch (error) {
    console.warn("Erro ao carregar do localStorage:", error)
    return { bis: [], areas: [] }
  }
}

const BiManagementSystem = () => {
  const [bis, setBis] = useState<BiItem[]>([])
  const [filteredBis, setFilteredBis] = useState<BiItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterArea, setFilterArea] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBi, setEditingBi] = useState<BiItem | null>(null)
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const [filterCriticality, setFilterCriticality] = useState("all")
  const [stats, setStats] = useState<Stats>({
    total: 0,
    updated: 0,
    outdated: 0,
    noOwner: 0,
  })
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false)

  const [areas, setAreas] = useState<Area[]>([])
  const [showAreaForm, setShowAreaForm] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [showAreaManagement, setShowAreaManagement] = useState(false)

  // Dados de exemplo baseados na planilha
  const sampleData: BiItem[] = [
    {
      id: 1,
      name: "Visão Gerencial - Estoques VMSA",
      owner: "Gabriel Lauer Oliveira",
      area: ["BW"], // Alterado para array
      status: "Atualizado",
      lastUpdate: "2024-01-15",
      observations: "Formatação do layout",
      usage: "Mensal",
      criticality: "Alta",
    },
    {
      id: 2,
      name: "Estoque Matéria Prima",
      owner: "Bruno Filgueiras Alves",
      area: ["BW", "Controladoria"], // Exemplo com múltiplas áreas
      status: "Atualizado",
      lastUpdate: "2024-01-10",
      observations: "Formatação do layout",
      usage: "Diário",
      criticality: "Alta",
    },
    {
      id: 3,
      name: "Dashboard Preços Entrada de Pedidos",
      owner: "Marcio Tagata Motitsuki",
      area: ["2368_Controladoria_ABUB"],
      status: "Desatualizado desde 06/08/24",
      lastUpdate: "2024-08-06",
      observations: "Corrigir da grafico pagina 6",
      usage: "Semanal",
      criticality: "Média",
    },
    {
      id: 4,
      name: "EBIT",
      owner: "Anna Vitoria Santos",
      area: ["2423_Apresentação de Custos e R"],
      status: "Desatualizado desde 06/11/24",
      lastUpdate: "2024-11-06",
      observations: "Necessita revisão",
      usage: "Mensal",
      criticality: "Alta",
    },
    {
      id: 5,
      name: "Relatório Vendas Regional",
      owner: "",
      area: ["BW", "Vendas"], // Exemplo com múltiplas áreas
      status: "Sem responsável",
      lastUpdate: "2024-05-20",
      observations: "BI órfão, necessita definir responsável",
      usage: "Semanal",
      criticality: "Média",
    },
  ]

  const initialAreas: Area[] = [
    { id: 1, name: "BW", description: "Business Warehouse" },
    { id: 2, name: "2368_Controladoria_ABUB", description: "Controladoria ABUB" },
    { id: 3, name: "2423_Apresentação de Custos e R", description: "Apresentação de Custos e Resultados" },
    { id: 4, name: "2423_Controladoria_Corporate", description: "Controladoria Corporate" },
    { id: 5, name: "2423_Controladoria_Custos", description: "Controladoria de Custos" },
    { id: 6, name: "2423_Controladoria_Estoque", description: "Controladoria de Estoque" },
    { id: 7, name: "Vendas", description: "Área de Vendas" }, // Adicionado para exemplo
    { id: 8, name: "Controladoria", description: "Área de Controladoria Geral" }, // Adicionado para exemplo
  ]

  useEffect(() => {
    const savedData = loadFromLocalStorage()

    if (savedData.bis.length > 0 || savedData.areas.length > 0) {
      setBis(savedData.bis.length > 0 ? savedData.bis : sampleData)
      setAreas(savedData.areas.length > 0 ? savedData.areas : initialAreas)
      setFilteredBis(savedData.bis.length > 0 ? savedData.bis : sampleData)
      calculateStats(savedData.bis.length > 0 ? savedData.bis : sampleData)
    } else {
      setBis(sampleData)
      setFilteredBis(sampleData)
      setAreas(initialAreas)
      calculateStats(sampleData)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollToTopButton(true)
      } else {
        setShowScrollToTopButton(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const calculateStats = (data: BiItem[]) => {
    const newStats: Stats = {
      total: data.length,
      updated: data.filter((bi) => bi.status === "Atualizado").length,
      outdated: data.filter((bi) => bi.status.includes("Desatualizado")).length,
      noOwner: data.filter((bi) => !bi.owner || bi.owner === "").length,
    }
    setStats(newStats)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    applyFilters(term, filterStatus, filterArea, filterMonth, filterYear, filterCriticality)
  }

  const applyFilters = (
    search: string,
    status: string,
    area: string,
    month: string,
    year: string,
    criticality: string,
  ) => {
    let filtered = bis

    if (search) {
      filtered = filtered.filter(
        (bi) =>
          bi.name.toLowerCase().includes(search.toLowerCase()) ||
          bi.owner.toLowerCase().includes(search.toLowerCase()) ||
          bi.observations.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (status !== "all") {
      if (status === "updated") {
        filtered = filtered.filter((bi) => bi.status === "Atualizado")
      } else if (status === "outdated") {
        filtered = filtered.filter((bi) => bi.status.includes("Desatualizado"))
      } else if (status === "no_owner") {
        filtered = filtered.filter((bi) => !bi.owner || bi.owner === "")
      }
    }

    // Lógica de filtro para múltiplas áreas
    if (area !== "all") {
      filtered = filtered.filter((bi) => bi.area.includes(area))
    }

    if (month !== "all" || year !== "all") {
      filtered = filtered.filter((bi) => {
        if (!bi.lastUpdate) return false
        const biDate = new Date(bi.lastUpdate + "T00:00:00")
        const biMonth = (biDate.getMonth() + 1).toString().padStart(2, "0")
        const biYear = biDate.getFullYear().toString()

        const matchesMonth = month === "all" || biMonth === month
        const matchesYear = year === "all" || biYear === year

        return matchesMonth && matchesYear
      })
    }

    if (criticality !== "all") {
      filtered = filtered.filter((bi) => bi.criticality === criticality)
    }

    setFilteredBis(filtered)
  }

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status)
    applyFilters(searchTerm, status, filterArea, filterMonth, filterYear, filterCriticality)
  }

  const handleAreaFilter = (area: string) => {
    setFilterArea(area)
    applyFilters(searchTerm, filterStatus, area, filterMonth, filterYear, filterCriticality)
  }

  const handleMonthFilter = (month: string) => {
    setFilterMonth(month)
    applyFilters(searchTerm, filterStatus, filterArea, month, filterYear, filterCriticality)
  }

  const handleYearFilter = (year: string) => {
    setFilterYear(year)
    applyFilters(searchTerm, filterStatus, filterArea, filterMonth, year, filterCriticality)
  }

  const handleCriticalityFilter = (criticality: string) => {
    setFilterCriticality(criticality)
    applyFilters(searchTerm, filterStatus, filterArea, filterMonth, filterYear, criticality)
  }

  const getStatusColor = (status: string) => {
    if (status === "Atualizado") return "text-green-600 bg-green-50"
    if (status.includes("Desatualizado")) return "text-red-600 bg-red-50"
    return "text-yellow-600 bg-yellow-50"
  }

  const getStatusIcon = (status: string) => {
    if (status === "Atualizado") return <CheckCircle className="h-4 w-4" />
    if (status.includes("Desatualizado")) return <XCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  const getCriticalityColor = (criticality: string) => {
    if (criticality === "Alta") return "bg-red-100 text-red-800"
    if (criticality === "Média") return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const handleAddBi = (newBi: Omit<BiItem, "id">) => {
    const biWithId: BiItem = { ...newBi, id: Date.now() }
    const updatedBis = [...bis, biWithId]
    setBis(updatedBis)
    saveToLocalStorage(updatedBis, areas)
    applyFilters(searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality)
    calculateStats(updatedBis)
    setShowAddForm(false)
  }

  const handleEditBi = (updatedBi: BiItem) => {
    const updatedBis = bis.map((bi) => (bi.id === updatedBi.id ? updatedBi : bi))
    setBis(updatedBis)
    saveToLocalStorage(updatedBis, areas)
    applyFilters(searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality)
    calculateStats(updatedBis)
    setEditingBi(null)
  }

  const handleDeleteBi = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este BI?")) {
      const updatedBis = bis.filter((bi) => bi.id !== id)
      setBis(updatedBis)
      saveToLocalStorage(updatedBis, areas)
      applyFilters(searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality)
      calculateStats(updatedBis)
    }
  }

  const handleAddArea = (newArea: Omit<Area, "id">) => {
    const areaWithId: Area = { ...newArea, id: Date.now() }
    const updatedAreas = [...areas, areaWithId]
    setAreas(updatedAreas)
    saveToLocalStorage(bis, updatedAreas)
    setShowAreaForm(false)
  }

  const handleEditArea = (updatedArea: Area) => {
    const updatedAreas = areas.map((area) => (area.id === updatedArea.id ? updatedArea : area))
    setAreas(updatedAreas)
    saveToLocalStorage(bis, updatedAreas)
    setEditingArea(null)
  }

  const handleDeleteArea = (id: number) => {
    const areaToDelete = areas.find((a) => a.id === id)
    if (!areaToDelete) return

    // Verificar se a área está sendo usada por algum BI (agora verifica em arrays)
    const areaInUse = bis.some((bi) => bi.area.includes(areaToDelete.name))

    if (areaInUse) {
      alert("Esta área não pode ser excluída pois está sendo utilizada por um ou mais BIs.")
      return
    }

    if (window.confirm("Tem certeza que deseja excluir esta área?")) {
      const updatedAreas = areas.filter((area) => area.id !== id)
      setAreas(updatedAreas)
      saveToLocalStorage(bis, updatedAreas)
    }
  }

  const handleExport = () => {
    const exportData = {
      bis: bis,
      areas: areas,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `bis_backup_${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const AreaForm: React.FC<AreaFormProps> = ({ area, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Area, "id">>({
      name: area?.name || "",
      description: area?.description || "",
    })

    const handleSubmit = () => {
      if (formData.name.trim()) {
        if (area) {
          onSave({ ...formData, id: area.id })
        } else {
          onSave(formData)
        }
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">{area ? "Editar Área" : "Adicionar Nova Área"}</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Área/Sistema *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: BW, Controladoria, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrição da área ou sistema"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {area ? "Salvar Alterações" : "Adicionar Área"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const BiForm: React.FC<BiFormProps> = ({ bi, onSave, onCancel, areas }) => {
    const [formData, setFormData] = useState<Omit<BiItem, "id">>({
      name: bi?.name || "",
      owner: bi?.owner || "",
      area: bi?.area || [], // Inicializa como array vazio
      status: bi?.status || "Atualizado",
      lastUpdate: bi?.lastUpdate || "",
      observations: bi?.observations || "",
      usage: bi?.usage || "Mensal",
      criticality: bi?.criticality || "Média",
    })

    const handleSubmit = () => {
      if (formData.name && formData.area.length > 0) {
        // Valida se pelo menos uma área foi selecionada
        if (bi) {
          onSave({ ...formData, id: bi.id })
        } else {
          onSave(formData as BiItem)
        }
      } else {
        alert("Por favor, preencha o nome do BI e selecione pelo menos uma área.")
      }
    }

    const toggleAreaSelection = (areaName: string) => {
      setFormData((prev) => {
        const currentAreas = prev.area || []
        if (currentAreas.includes(areaName)) {
          return { ...prev, area: currentAreas.filter((a) => a !== areaName) }
        } else {
          return { ...prev, area: [...currentAreas, areaName] }
        }
      })
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">{bi ? "Editar BI" : "Adicionar Novo BI"}</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do BI *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável/Dono</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área/Sistema *</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-transparent">
                      {formData.area.length > 0 ? formData.area.join(", ") : "Selecione a(s) área(s)"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuLabel>Selecione as Áreas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {areas.map((area) => (
                      <DropdownMenuCheckboxItem
                        key={area.id}
                        checked={formData.area.includes(area.name)}
                        onCheckedChange={() => toggleAreaSelection(area.name)}
                      >
                        {area.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Atualizado">Atualizado</option>
                  <option value="Desatualizado">Desatualizado</option>
                  <option value="Em revisão">Em revisão</option>
                  <option value="Descontinuado">Descontinuado</option>
                  <option value="Sem responsável">Sem responsável</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Última Atualização</label>
                <input
                  type="date"
                  value={formData.lastUpdate}
                  onChange={(e) => setFormData({ ...formData, lastUpdate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de Uso</label>
                <select
                  value={formData.usage}
                  onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Diário">Diário</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Anual">Anual</option>
                  <option value="Sob demanda">Sob demanda</option>
                  <option value="Não utilizado">Não utilizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Criticidade</label>
                <select
                  value={formData.criticality}
                  onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observações, problemas identificados, melhorias necessárias..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {bi ? "Salvar Alterações" : "Adicionar BI"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedData = JSON.parse(content)

        if (!importedData || !Array.isArray(importedData.bis) || !Array.isArray(importedData.areas)) {
          alert("Arquivo inválido. Por favor, use um arquivo exportado pelo sistema com a estrutura correta.")
          return
        }

        const currentBisMap = new Map<number, BiItem>(bis.map((bi) => [bi.id, bi]))
        importedData.bis.forEach((importedBi: BiItem) => {
          // Ensure area is an array, even if imported as string (for backward compatibility)
          if (typeof importedBi.area === "string") {
            importedBi.area = [importedBi.area]
          }
          currentBisMap.set(importedBi.id, importedBi)
        })
        const mergedBis = Array.from(currentBisMap.values())

        const currentAreasMap = new Map<number, Area>(areas.map((area) => [area.id, area]))
        importedData.areas.forEach((importedArea: Area) => {
          currentAreasMap.set(importedArea.id, importedArea)
        })
        const mergedAreas = Array.from(currentAreasMap.values())

        setBis(mergedBis)
        setAreas(mergedAreas)
        setFilteredBis(mergedBis)
        calculateStats(mergedBis)
        saveToLocalStorage(mergedBis, mergedAreas)

        alert(
          `Dados importados e mesclados com sucesso!\n${importedData.bis.length} BIs e ${importedData.areas.length} áreas do arquivo foram processados.`,
        )
      } catch (error) {
        console.error("Erro durante a importação:", error)
        alert("Erro ao importar arquivo. Verifique se o formato está correto e tente novamente.")
      }
    }
    reader.readAsText(file)

    event.target.value = ""
  }

  const handleClearData = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      setBis([])
      setAreas([])
      setFilteredBis([])
      calculateStats([])
      localStorage.removeItem(STORAGE_KEY_BIS)
      localStorage.removeItem(STORAGE_KEY_AREAS)
      alert("Dados limpos com sucesso!")
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <div className="max-w-full mx-auto flex-grow w-full px-4 md:px-6">
        {" "}
        {/* Ajustado para max-w-full e padding */}
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
            <div className="flex items-center space-x-3">
              <Image src="/favicon.ico" alt="BI Management Icon" width={40} height={40} className="rounded-lg" />
              <h1 className="text-3xl font-bold text-gray-900 whitespace-nowrap">Gestão e Saneamento de BIs</h1>
            </div>
            <div className="flex flex-wrap gap-3 justify-end md:ml-auto">
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar BI
              </Button>

              <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer text-xs">
                <Upload className="h-4 w-4 mr-2" />
                Importar Dados
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <Button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>

              <Button
                onClick={() => setShowAreaManagement(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-xs"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Gerenciar Áreas
              </Button>

              <Button
                onClick={handleClearData}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
                title="Limpar todos os dados"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Dados
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de BIs</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-600">Atualizados</p>
                  <p className="text-2xl font-bold text-green-900">{stats.updated}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-600">Desatualizados</p>
                  <p className="text-2xl font-bold text-red-900">{stats.outdated}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Sem Responsável</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.noOwner}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, responsável ou observações..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={filterArea}
              onChange={(e) => handleAreaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas as Áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.name}>
                  {area.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="updated">Atualizados</option>
              <option value="outdated">Desatualizados</option>
              <option value="no_owner">Sem Responsável</option>
            </select>

            <select
              value={filterMonth}
              onChange={(e) => handleMonthFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Meses</option>
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>

            <select
              value={filterYear}
              onChange={(e) => handleYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Anos</option>
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={filterCriticality}
              onChange={(e) => handleCriticalityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas as Criticidades</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
        </div>
        {/* BIs List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do BI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Atualização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criticidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBis.map((bi) => (
                  <tr key={bi.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bi.name}</div>
                          {bi.observations && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{bi.observations}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{bi.owner || "Sem responsável"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{bi.area.join(", ")}</span> {/* Exibe múltiplas áreas */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bi.status)}`}
                      >
                        {getStatusIcon(bi.status)}
                        <span className="ml-1">{bi.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bi.lastUpdate ? new Date(bi.lastUpdate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bi.usage}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(bi.criticality)}`}
                      >
                        {bi.criticality}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setEditingBi(bi)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                          variant="ghost"
                          size="icon"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteBi(bi.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBis.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum BI encontrado com os filtros aplicados</p>
            </div>
          )}

          {/* BI Counter and Scroll to Top Button */}
          <div className="flex justify-between items-center p-4 text-sm text-gray-600 border-t border-gray-200">
            <span>
              Mostrando {filteredBis.length} de {bis.length} BIs
            </span>
            {showScrollToTopButton && (
              <Button
                onClick={scrollToTop}
                className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs"
                variant="outline"
                size="sm"
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Voltar ao Topo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Forms */}
      {showAddForm && <BiForm onSave={handleAddBi} onCancel={() => setShowAddForm(false)} areas={areas} />}

      {editingBi && <BiForm bi={editingBi} onSave={handleEditBi} onCancel={() => setEditingBi(null)} areas={areas} />}

      {/* Area Management */}
      {showAreaManagement && (
        <AreaManagement
          areas={areas}
          onAddArea={handleAddArea}
          onEditArea={handleEditArea}
          onDeleteArea={handleDeleteArea}
          onClose={() => setShowAreaManagement(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-gray-500 text-xs">
        <p>
          Desenvolvido por{" "}
          <a
            href="https://github.com/GiovanneRocha"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Giovanne Rocha
          </a>
        </p>
      </footer>
    </div>
  )
}

export default BiManagementSystem
