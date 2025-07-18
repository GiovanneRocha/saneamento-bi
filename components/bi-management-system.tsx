"use client"

import React from "react"
import { ChevronUp } from "lucide-react" // Import ChevronUp

import type { ReactElement } from "react"
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
  ArrowDown,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import AreaManagement from "./area-management"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import BiForm from "./bi-form" // Importar BiForm do novo arquivo
import { handleExport } from "@/utils/export-utils" // Importar handleExport do novo arquivo
import PageForm from "./page-form"

interface Page {
  id: number
  name: string
  owner?: string
  description?: string
  status?: string
  lastUpdate?: string
  observations?: string
  usage?: string
  criticality?: string
}

interface BiItem {
  id: number
  name: string
  owner: string
  area: string[]
  status: string
  lastUpdate: string
  observations: string
  usage: string
  criticality: string
  description?: string
  pages?: Page[]
}

interface Stats {
  total: number
  updated: number
  outdated: number
  noOwner: number
  totalPages: number
  updatedPages: number
  outdatedPages: number
  noOwnerPages: number
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

const BiManagementSystem = (): ReactElement => {
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
    totalPages: 0,
    updatedPages: 0,
    outdatedPages: 0,
  })
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false)
  const [showFloatingBar, setShowFloatingBar] = useState(false)

  const [areas, setAreas] = useState<Area[]>([])
  const [showAreaManagement, setShowAreaManagement] = useState(false)
  const [expandedBis, setExpandedBis] = useState<Set<number>>(new Set())
  const [showAddPageForm, setShowAddPageForm] = useState(false)
  const [editingPage, setEditingPage] = useState<{ biId: number; page: Page } | null>(null)
  const [selectedBiForPage, setSelectedBiForPage] = useState<number | null>(null)

  // Estados para ordenação
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "none">("none")

  // Dados de exemplo baseados na planilha
  const sampleData: BiItem[] = [
    {
      id: 1,
      name: "Visão Gerencial - Estoques VMSA",
      owner: "Gabriel Lauer Oliveira",
      area: ["BW"],
      status: "Atualizado",
      lastUpdate: "2024-01-15",
      observations: "Formatação do layout",
      usage: "Mensal",
      criticality: "Alta",
      description: "Dashboard principal para análise de estoques da VMSA",
      pages: [
        {
          id: 1,
          name: "Visão Geral",
          owner: "Gabriel Lauer Oliveira",
          description: "Página principal com métricas gerais",
          status: "Atualizado",
          lastUpdate: "2024-01-15",
          usage: "Diário",
          criticality: "Alta",
        },
        {
          id: 2,
          name: "Detalhamento por Produto",
          owner: "Maria Silva",
          description: "Análise detalhada por categoria de produto",
          status: "Em revisão",
          lastUpdate: "2024-01-10",
          usage: "Semanal",
          criticality: "Média",
        },
      ],
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
      owner: "",
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
      criticality: "", // Exemplo de BI sem criticidade
    },
    {
      id: 6,
      name: "Relatório de Produção Diária",
      owner: "Carlos Mendes",
      area: ["Produção"],
      status: "Atualizado",
      lastUpdate: "2024-07-10",
      observations: "Monitoramento de linha de produção",
      usage: "Diário",
      criticality: "", // Exemplo de BI sem criticidade
      pages: [
        {
          id: 1,
          name: "Visão de Turnos",
          owner: "Carlos Mendes",
          description: "Desempenho por turno",
          status: "Atualizado",
          lastUpdate: "2024-07-10",
          usage: "Diário",
          criticality: "", // Exemplo de página sem criticidade
        },
      ],
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
    dataToFilter: BiItem[],
    search: string,
    status: string,
    area: string,
    month: string,
    year: string,
    criticality: string,
    sortCol: string | null,
    sortDir: "asc" | "desc" | "none",
  ) => {
    // Sempre comece com uma cópia fresca dos dados originais para filtragem
    let filtered = [...dataToFilter] // <--- CORREÇÃO AQUI: Cria uma cópia do array

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
      } else if (status === "Sem permissão") {
        filtered = filtered.filter((bi) => bi.status === "Sem permissão")
      } else if (status === "Não encontrado") {
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
      filtered = filtered.filter((bi) => {
        if (criticality === "Não Aplicável") {
          return !bi.criticality || bi.criticality === ""
        }
        return bi.criticality === criticality
      })
    }

    // Lógica de ordenação
    if (sortCol && sortDir !== "none") {
      filtered.sort((a, b) => {
        let valA: any
        let valB: any

        if (sortCol === "area") {
          valA = a.area.join(", ").toLowerCase()
          valB = b.area.join(", ").toLowerCase()
        } else if (sortCol === "lastUpdate") {
          valA = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0
          valB = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0
        } else {
          valA = (a as any)[sortCol]?.toString().toLowerCase() || ""
          valB = (b as any)[sortCol]?.toString().toLowerCase() || ""
        }

        if (valA < valB) return sortDir === "asc" ? -1 : 1
        if (valA > valB) return sortDir === "asc" ? 1 : -1
        return 0
      })
    }
    // Se sortDir for "none", nenhuma ordenação explícita é aplicada,
    // então a ordem será a ordem original de `bis` após a filtragem.

    setFilteredBis(filtered)
  }

  useEffect(() => {
    const savedData = loadFromLocalStorage()

    const initialBis = savedData.bis.length > 0 ? savedData.bis : sampleData
    const initialAreasData = savedData.areas.length > 0 ? savedData.areas : initialAreas

    setBis(initialBis)
    setAreas(initialAreasData)
    // Chamar applyFilters com os dados iniciais carregados
    applyFilters(
      initialBis,
      searchTerm,
      filterStatus,
      filterArea,
      filterMonth,
      filterYear,
      filterCriticality,
      sortColumn,
      sortDirection,
    )
    calculateStats(initialBis)
  }, []) // Este useEffect só roda na montagem inicial

  // Efeito para re-aplicar filtros e ordenação quando os estados de filtro/ordenação mudam
  useEffect(() => {
    applyFilters(
      bis,
      searchTerm,
      filterStatus,
      filterArea,
      filterMonth,
      filterYear,
      filterCriticality,
      sortColumn,
      sortDirection,
    )
  }, [searchTerm, filterStatus, filterArea, filterMonth, filterYear, filterCriticality, sortColumn, sortDirection, bis])

  // Efeito para controlar a visibilidade do botão "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Mostrar barra flutuante quando não estiver no topo
      setShowFloatingBar(scrollY > 100)

      // Mostrar botão "Voltar ao Topo" quando rolar mais de 200px
      setShowScrollToTopButton(scrollY > 200)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleBiExpansion = (biId: number) => {
    const newExpanded = new Set(expandedBis)
    if (newExpanded.has(biId)) {
      newExpanded.delete(biId)
    } else {
      newExpanded.add(biId)
    }
    setExpandedBis(newExpanded)
  }

  const handleAddPage = (biId: number, newPage: Omit<Page, "id">) => {
    const pageWithId: Page = { ...newPage, id: Date.now() }
    const updatedBis = bis.map((bi) => (bi.id === biId ? { ...bi, pages: [...(bi.pages || []), pageWithId] } : bi))
    setBis(updatedBis)
    saveToLocalStorage(updatedBis, areas)
    calculateStats(updatedBis)
    setShowAddPageForm(false)
    setSelectedBiForPage(null)
  }

  const handleEditPage = (biId: number, updatedPage: Page) => {
    const updatedBis = bis.map((bi) =>
      bi.id === biId
        ? {
            ...bi,
            pages: bi.pages?.map((page) => (page.id === updatedPage.id ? updatedPage : page)) || [],
          }
        : bi,
    )
    setBis(updatedBis)
    saveToLocalStorage(updatedBis, areas)
    calculateStats(updatedBis)
    setEditingPage(null)
  }

  const handleDeletePage = (biId: number, pageId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta página?")) {
      const updatedBis = bis.map((bi) =>
        bi.id === biId ? { ...bi, pages: bi.pages?.filter((page) => page.id !== pageId) || [] } : bi,
      )
      setBis(updatedBis)
      saveToLocalStorage(updatedBis, areas)
      calculateStats(updatedBis)
    }
  }

  const calculateStats = (data: BiItem[]) => {
    const totalPages = data.reduce((sum, bi) => sum + (bi.pages?.length || 0), 0)
    const updatedPages = data.reduce(
      (sum, bi) => sum + (bi.pages?.filter((page) => page.status === "Atualizado").length || 0),
      0,
    )
    const outdatedPages = data.reduce(
      (sum, bi) => sum + (bi.pages?.filter((page) => page.status?.includes("Desatualizado")).length || 0),
      0,
    )
    const noOwnerPages = data.reduce(
      (sum, bi) => sum + (bi.pages?.filter((page) => !page.owner || page.owner === "").length || 0),
      0,
    )

    const newStats: Stats = {
      total: data.length,
      updated: data.filter((bi) => bi.status === "Atualizado").length,
      outdated: data.filter((bi) => bi.status.includes("Desatualizado")).length,
      noOwner: data.filter((bi) => !bi.owner || bi.owner === "").length,
      totalPages,
      updatedPages,
      outdatedPages,
      noOwnerPages,
    }
    setStats(newStats)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status)
  }

  const handleAreaFilter = (area: string) => {
    setFilterArea(area)
  }

  const handleMonthFilter = (month: string) => {
    setFilterMonth(month)
  }

  const handleYearFilter = (year: string) => {
    setFilterYear(year)
  }

  const handleCriticalityFilter = (criticality: string) => {
    setFilterCriticality(criticality)
  }

  const getStatusColor = (status: string) => {
    if (status === "Atualizado") return "text-green-600 bg-green-50"
    if (status.includes("Desatualizado")) return "text-red-600 bg-red-50"
    if (status === "Sem permissão" || status === "Não encontrado") return "text-gray-600 bg-gray-100" // New status colors
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
    if (criticality === "Baixa") return "bg-green-100 text-green-800"
    return "bg-gray-100 text-gray-800" // Cor para "Não Aplicável" ou vazio
  }

  const handleAddBi = (newBi: Omit<BiItem, "id">) => {
    const biWithId: BiItem = { ...newBi, id: Date.now() }
    const updatedBis = [...bis, biWithId]
    setBis(updatedBis)
    saveToLocalStorage(updatedBis, areas)
    calculateStats(updatedBis)
    setShowAddForm(false)
  }

  const handleEditBi = (updatedBi: BiItem) => {
    const updatedBis = bis.map((bi) => (bi.id === updatedBi.id ? updatedBi : bi))
    setBis(updatedBis)
    saveToLocalStorage(updatedBis, areas)
    calculateStats(updatedBis)
    setEditingBi(null)
  }

  const handleDeleteBi = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este BI?")) {
      const updatedBis = bis.filter((bi) => bi.id !== id)
      setBis(updatedBis)
      saveToLocalStorage(updatedBis, areas)
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

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    })
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortDirection("none")
        setSortColumn(null) // Reset column when returning to original order
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        return <ChevronUp className="ml-1 h-3 w-3" />
      } else if (sortDirection === "desc") {
        return <ChevronDown className="ml-1 h-3 w-3" />
      }
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="h-7 w-7 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-blue-600">Total de BIs</p>
                  <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-7 w-7 text-purple-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-purple-600">Total de Páginas</p>
                  <p className="text-xl font-bold text-purple-900">{stats.totalPages}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-7 w-7 text-green-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-green-600">Atualizados</p>
                  <p className="text-xl font-bold text-green-900">{stats.updated}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-7 w-7 text-red-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-red-600">Desatualizados</p>
                  <p className="text-xl font-bold text-red-900">{stats.outdated}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center">
                <Users className="h-7 w-7 text-yellow-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-yellow-600">Sem Responsável</p>
                  <p className="text-xl font-bold text-yellow-900">{stats.noOwner}</p>
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
              <option value="Sem permissão">Sem permissão</option> {/* New status filter option */}
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
              <option value="">Não Aplicável</option> {/* Nova opção de filtro */}
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
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">Nome do BI {getSortIcon("name")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("owner")}
                  >
                    <div className="flex items-center">Responsável {getSortIcon("owner")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("area")}
                  >
                    <div className="flex items-center">Área(s) {getSortIcon("area")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">Status {getSortIcon("status")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("lastUpdate")}
                  >
                    <div className="flex items-center">Última Atualização {getSortIcon("lastUpdate")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("usage")}
                  >
                    <div className="flex items-center">Uso {getSortIcon("usage")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("criticality")}
                  >
                    <div className="flex items-center">Criticidade {getSortIcon("criticality")}</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBis.map((bi) => (
                  <React.Fragment key={bi.id}>
                    {/* Linha do BI principal */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleBiExpansion(bi.id)}
                            className="mr-2 p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedBis.has(bi.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bi.name}</div>
                            {bi.description && <div className="text-sm text-gray-500">{bi.description}</div>}
                            {bi.observations && <div className="text-xs text-gray-400">{bi.observations}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{bi.owner || "Sem responsável"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{bi.area.join(", ")}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bi.status)}`}
                        >
                          {getStatusIcon(bi.status)}
                          <span className="ml-1">{bi.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {bi.lastUpdate ? new Date(bi.lastUpdate + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{bi.usage}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(bi.criticality)}`}
                        >
                          {bi.criticality || "Não Aplicável"} {/* Exibe "Não Aplicável" se vazio */}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => {
                              setSelectedBiForPage(bi.id)
                              setShowAddPageForm(true)
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Adicionar Página"
                            variant="ghost"
                            size="icon"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
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

                    {/* Linhas das páginas (quando expandido) */}
                    {expandedBis.has(bi.id) &&
                      bi.pages?.map((page) => (
                        <tr key={`${bi.id}-${page.id}`} className="bg-gray-25 hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <div className="flex items-center pl-8">
                              <div className="w-4 h-4 mr-2"></div>
                              <FileText className="h-4 w-4 text-gray-300 mr-2" />
                              <div>
                                <div className="text-sm text-gray-700">{page.name}</div>
                                {page.description && <div className="text-xs text-gray-500">{page.description}</div>}
                                {page.observations && <div className="text-xs text-gray-400">{page.observations}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-700">{page.owner || "Sem responsável"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-sm text-gray-500">-</span>
                          </td>
                          <td className="px-6 py-3">
                            {page.status && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(page.status)}`}
                              >
                                {getStatusIcon(page.status)}
                                <span className="ml-1">{page.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {page.lastUpdate
                              ? new Date(page.lastUpdate + "T00:00:00").toLocaleDateString("pt-BR")
                              : "-"}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">{page.usage || "-"}</td>
                          <td className="px-6 py-3">
                            {page.criticality !== undefined && ( // Verifica se a propriedade existe
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(page.criticality)}`}
                              >
                                {page.criticality || "Não Aplicável"} {/* Exibe "Não Aplicável" se vazio */}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => setEditingPage({ biId: bi.id, page })}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar Página"
                                variant="ghost"
                                size="icon"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleDeletePage(bi.id, page.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir Página"
                                variant="ghost"
                                size="icon"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
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

          {/* BI Counter - versão simplificada no final da tabela */}
          <div className="p-4 text-sm text-gray-600 border-t border-gray-200 text-center">
            <span>
              Mostrando {filteredBis.length} de {bis.length} BIs
            </span>
          </div>
        </div>
      </div>

      {/* Barra Flutuante de Navegação */}
      {showFloatingBar && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center space-x-4 border border-gray-200 flex-row text-left">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {filteredBis.length} de {bis.length} BIs
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={scrollToTop}
                className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 text-xs"
                variant="ghost"
                size="sm"
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                Início
              </Button>
              <Button
                onClick={scrollToBottom}
                className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 text-xs"
                variant="ghost"
                size="sm"
              >
                <ArrowDown className="h-3 w-3 mr-1" />
                Fim
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Page Forms */}
      {showAddPageForm && selectedBiForPage && (
        <PageForm
          biId={selectedBiForPage}
          onSave={handleAddPage}
          onCancel={() => {
            setShowAddPageForm(false)
            setSelectedBiForPage(null)
          }}
        />
      )}

      {editingPage && (
        <PageForm
          biId={editingPage.biId}
          page={editingPage.page}
          onSave={handleEditPage}
          onCancel={() => setEditingPage(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-gray-500 text-xs">
        <p className="text-left">
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
