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
  Lock,
  HelpCircle,
} from "lucide-react"
import AreaManagement from "./area-management"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import BiForm from "./bi-form" // Importar BiForm do novo arquivo
import { handleExport } from "@/utils/export-utils" // Importar handleExport do novo arquivo

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

  // Refatorar applyFilters para aceitar os dados como argumento
  const applyFilters = (
    dataToFilter: BiItem[], // Novo parâmetro
    search: string,
    status: string,
    area: string,
    month: string,
    year: string,
    criticality: string,
  ) => {
    let filtered = dataToFilter

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
      } else if (status === "Sem acesso") {
        // New status filter
        filtered = filtered.filter((bi) => bi.status === "Sem acesso")
      } else if (status === "Não encontrado") {
        // New status filter
        filtered = filtered.filter((bi) => bi.status === "Não encontrado")
      }
    }

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

  useEffect(() => {
    const savedData = loadFromLocalStorage()

    const initialBis = savedData.bis.length > 0 ? savedData.bis : sampleData
    const initialAreasData = savedData.areas.length > 0 ? savedData.areas : initialAreas

    setBis(initialBis)
    setAreas(initialAreasData)
    // Chamar applyFilters com os dados iniciais carregados
    applyFilters(initialBis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality)
    calculateStats(initialBis)
  }, []) // Este useEffect só roda na montagem inicial

  // Efeito para controlar a visibilidade do botão "Voltar ao Topo"
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
    applyFilters(bis, term, filterStatus, filterArea, filterMonth, filterYear, filterCriticality) // Passar 'bis' atual
  }

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status)
    applyFilters(bis, searchTerm, status, filterArea, filterMonth, filterYear, filterCriticality) // Passar 'bis' atual
  }

  const handleAreaFilter = (area: string) => {
    setFilterArea(area)
    applyFilters(bis, searchTerm, filterStatus, area, filterMonth, filterYear, filterCriticality) // Passar 'bis' atual
  }

  const handleMonthFilter = (month: string) => {
    setFilterMonth(month)
    applyFilters(bis, searchTerm, filterStatus, filterArea, month, filterYear, filterCriticality) // Passar 'bis' atual
  }

  const handleYearFilter = (year: string) => {
    setFilterYear(year)
    applyFilters(bis, searchTerm, filterStatus, filterArea, filterMonth, year, filterCriticality) // Passar 'bis' atual
  }

  const handleCriticalityFilter = (criticality: string) => {
    setFilterCriticality(criticality)
    applyFilters(bis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, criticality) // Passar 'bis' atual
  }

  const getStatusColor = (status: string) => {
    if (status === "Atualizado") return "text-green-600 bg-green-50"
    if (status.includes("Desatualizado")) return "text-red-600 bg-red-50"
    if (status === "Sem acesso" || status === "Não encontrado") return "text-gray-600 bg-gray-100" // New status colors
    return "text-yellow-600 bg-yellow-50"
  }

  const getStatusIcon = (status: string) => {
    if (status === "Atualizado") return <CheckCircle className="h-4 w-4" />
    if (status.includes("Desatualizado")) return <XCircle className="h-4 w-4" />
    if (status === "Sem acesso") return <Lock className="h-4 w-4" /> // Novo ícone para "Sem acesso"
    if (status === "Não encontrado") return <HelpCircle className="h-4 w-4" /> // Novo ícone para "Não encontrado"
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
    applyFilters(updatedBis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality) // Passar 'updatedBis'
    calculateStats(updatedBis)
    setShowAddForm(false)
  }

  const handleEditBi = (updatedBi: BiItem) => {
    const updatedBis = bis.map((bi) => (bi.id === updatedBi.id ? updatedBi : bi))
    setBis(updatedBis)
    saveToLocalStorage(updatedBis, areas)
    applyFilters(updatedBis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality) // Passar 'updatedBis'
    calculateStats(updatedBis)
    setEditingBi(null)
  }

  const handleDeleteBi = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este BI?")) {
      const updatedBis = bis.filter((bi) => bi.id !== id)
      setBis(updatedBis)
      saveToLocalStorage(updatedBis, areas)
      applyFilters(updatedBis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality) // Passar 'updatedBis'
      calculateStats(updatedBis)
    }
  }

  const handleAddArea = (newArea: Omit<Area, "id">) => {
    const areaWithId: Area = { ...newArea, id: Date.now() }
    const updatedAreas = [...areas, areaWithId]
    setAreas(updatedAreas)
    saveToLocalStorage(bis, updatedAreas)
    setShowAreaManagement(false) // Fechar o formulário de área após adicionar
  }

  const handleEditArea = (updatedArea: Area) => {
    const updatedAreas = areas.map((area) => (area.id === updatedArea.id ? updatedArea : area))
    setAreas(updatedAreas)
    saveToLocalStorage(bis, updatedAreas)
    applyFilters(bis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality)
    setShowAreaManagement(false) // Fechar o formulário de área após editar
  }

  const handleDeleteArea = (id: number) => {
    const areaToDelete = areas.find((a) => a.id === id)
    if (!areaToDelete) return

    const areaInUse = bis.some((bi) => bi.area.includes(areaToDelete.name))

    if (areaInUse) {
      alert("Esta área não pode ser excluída pois está sendo utilizada por um ou mais BIs.")
      return
    }

    if (window.confirm("Tem certeza que deseja excluir esta área?")) {
      const updatedAreas = areas.filter((area) => area.id !== id)
      setAreas(updatedAreas)
      saveToLocalStorage(bis, updatedAreas)
      applyFilters(bis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality)
    }
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
        applyFilters(mergedBis, searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality) // Passar 'mergedBis'
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
      setFilteredBis([]) // Limpar filteredBis também
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
                onClick={() => handleExport(bis, areas)} // Chamar handleExport com os dados atuais
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
              <option value="Sem acesso">Sem acesso</option> {/* New status filter option */}
              <option value="Não encontrado">Não encontrado</option> {/* New status filter option */}
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
