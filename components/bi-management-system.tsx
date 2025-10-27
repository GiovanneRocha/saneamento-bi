"use client"

import React from "react"
import { ChevronUp, Lock, LogOut, Archive, BarChart2, Home, GitCompare } from "lucide-react"

import type { ReactElement } from "react"
import { useState, useEffect } from "react"
import {
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
import BiComparison from "./bi-comparison"
import { Button } from "@/components/ui/button"
import BiForm from "./bi-form"
import { handleExport } from "@/utils/export-utils"
import SavesDrawer from "./saves-drawer"
import AnalysisPage from "./analysis-page"
import type { BiItem, Stats, Area, SaveData } from "@/types/bi-types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import * as XLSX from "xlsx"

// Funções de persistência
const STORAGE_KEY_BIS = "bi-management-bis"
const STORAGE_KEY_AREAS = "bi-management-areas"
const STORAGE_KEY_SAVES = "bi-management-saves"

// Constantes para autenticação
const AUTH_KEY = "bi-management-auth"
const CORRECT_PASSWORD = "VillaresM"

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

// Funções para gerenciar saves
const savesToLocalStorage = (saves: SaveData[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_SAVES, JSON.stringify(saves))
  } catch (error) {
    console.warn("Erro ao salvar saves no localStorage:", error)
  }
}

const loadSavesFromLocalStorage = (): SaveData[] => {
  try {
    const savedSaves = localStorage.getItem(STORAGE_KEY_SAVES)
    return savedSaves ? JSON.parse(savedSaves) : []
  } catch (error) {
    console.warn("Erro ao carregar saves do localStorage:", error)
    return []
  }
}

const BiManagementSystem = (): ReactElement => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [currentPage, setCurrentPage] = useState<"dashboard" | "analysis" | "comparison">("dashboard")

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
    discontinued: 0,
    totalPages: 0,
    updatedPages: 0,
    outdatedPages: 0,
    noOwnerPages: 0,
    updatedPercentage: 0,
    outdatedPercentage: 0,
    discontinuedPercentage: 0,
  })
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false)
  const [showFloatingBar, setShowFloatingBar] = useState(false)

  const [areas, setAreas] = useState<Area[]>([])
  const [showAreaManagement, setShowAreaManagement] = useState(false)
  const [expandedBis, setExpandedBis] = useState<Set<number>>(new Set())

  // Estados para ordenação
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "none">("none")

  // Estados para saves
  const [saves, setSaves] = useState<SaveData[]>([])
  const [showSavesDrawer, setShowSavesDrawer] = useState(false)

  // States for hover effect on status cards
  const [isUpdatedHovered, setIsUpdatedHovered] = useState(false)
  const [isOutdatedHovered, setIsOutdatedHovered] = useState(false)
  const [isDiscontinuedHovered, setIsDiscontinuedHovered] = useState(false)

  const [currentSaveName, setCurrentSaveName] = useState<string | null>(null)

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
      link: "https://app.powerbi.com/view?r=eyJrIjoiYWJjZGVmZ2hpaiIsInQiOiJjIn0%3D",
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
      area: ["BW", "Controladoria"],
      status: "Atualizado",
      lastUpdate: "2024-01-10",
      observations: "Formatação do layout",
      usage: "Diário",
      criticality: "Alta",
      link: "https://app.powerbi.com/view?r=eyJrIjoiZGVmZ2hpamtsIiwidCI6ImNkIn0%3D",
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
      area: ["BW", "Vendas"],
      status: "Sem responsável",
      lastUpdate: "2024-05-20",
      observations: "BI órfão, necessita definir responsável",
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
      criticality: "",
      pages: [
        {
          id: 1,
          name: "Visão de Turnos",
          owner: "Carlos Mendes",
          description: "Desempenho por turno",
          status: "Atualizado",
          lastUpdate: "2024-07-10",
          usage: "Diário",
          criticality: "",
        },
      ],
    },
    {
      id: 7,
      name: "BI Descontinuado Exemplo",
      owner: "João Ninguém",
      area: ["TI"],
      status: "Descontinuado",
      lastUpdate: "2023-01-01",
      observations: "BI não mais utilizado pela empresa.",
      usage: "Inativo",
      criticality: "Baixa",
    },
  ]

  const initialAreas: Area[] = [
    { id: 1, name: "BW", description: "Business Warehouse" },
    { id: 2, name: "2368_Controladoria_ABUB", description: "Controladoria ABUB" },
    { id: 3, name: "2423_Apresentação de Custos e R", description: "Apresentação de Custos e Resultados" },
    { id: 4, name: "2423_Controladoria_Corporate", description: "Controladoria Corporate" },
    { id: 5, name: "2423_Controladoria_Custos", description: "Controladoria de Custos" },
    { id: 6, name: "2423_Controladoria_Estoque", description: "Controladoria de Estoque" },
    { id: 7, name: "Vendas", description: "Área de Vendas" },
    { id: 8, name: "Controladoria", description: "Área de Controladoria Geral" },
  ]

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
    let filtered = [...dataToFilter]

    if (search) {
      const lowerCaseSearch = search.toLowerCase()
      filtered = filtered.filter((bi) => {
        if (
          bi.name.toLowerCase().includes(lowerCaseSearch) ||
          bi.owner.toLowerCase().includes(lowerCaseSearch) ||
          (bi.observations && bi.observations.toLowerCase().includes(lowerCaseSearch)) ||
          (bi.description && bi.description.toLowerCase().includes(lowerCaseSearch))
        ) {
          return true
        }

        if (bi.pages) {
          return bi.pages.some(
            (page) =>
              page.name.toLowerCase().includes(lowerCaseSearch) ||
              (page.owner && page.owner.toLowerCase().includes(lowerCaseSearch)) ||
              (page.description && page.description.toLowerCase().includes(lowerCaseSearch)) ||
              (page.observations && page.observations.toLowerCase().includes(lowerCaseSearch)),
          )
        }
        return false
      })
    }

    if (status !== "all") {
      if (status === "updated") {
        filtered = filtered.filter((bi) => bi.status === "Atualizado")
      } else if (status === "outdated") {
        filtered = filtered.filter((bi) => bi.status.includes("Desatualizado"))
      } else if (status === "discontinued") {
        filtered = filtered.filter((bi) => bi.status === "Descontinuado")
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

    setFilteredBis(filtered)
  }

  useEffect(() => {
    const authStatus = localStorage.getItem(AUTH_KEY)
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }

    const savedData = loadFromLocalStorage()
    const savedSaves = loadSavesFromLocalStorage()

    const initialBis = savedData.bis.length > 0 ? savedData.bis : sampleData
    const initialAreasData = savedData.areas.length > 0 ? savedData.areas : initialAreas

    setBis(initialBis)
    setAreas(initialAreasData)
    setSaves(savedSaves)
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
  }, [])

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      setShowFloatingBar(scrollY > 100)
      setShowScrollToTopButton(scrollY > 200)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleBiExpansion = (biId: number) => {
    setExpandedBis((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(biId)) {
        newExpanded.delete(biId)
      } else {
        newExpanded.add(biId)
      }
      return newExpanded
    })
  }

  const calculateStats = (data: BiItem[]) => {
    const totalBis = data.length
    const updatedBis = data.filter((bi) => bi.status === "Atualizado").length
    const outdatedBis = data.filter((bi) => bi.status.includes("Desatualizado")).length
    const discontinuedBis = data.filter((bi) => bi.status === "Descontinuado").length

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
      total: totalBis,
      updated: updatedBis,
      outdated: outdatedBis,
      discontinued: discontinuedBis,
      totalPages,
      updatedPages,
      outdatedPages,
      noOwnerPages,
      updatedPercentage: totalBis > 0 ? (updatedBis / totalBis) * 100 : 0,
      outdatedPercentage: totalBis > 0 ? (outdatedBis / totalBis) * 100 : 0,
      discontinuedPercentage: totalBis > 0 ? (discontinuedBis / totalBis) * 100 : 0,
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
    if (status.includes("Desatualizado") || status === "Descontinuado") return "text-red-600 bg-red-50"
    if (status === "Sem permissão" || status === "Não encontrado") return "text-gray-600 bg-gray-100"
    return "text-yellow-600 bg-yellow-50"
  }

  const getStatusIcon = (status: string) => {
    if (status === "Atualizado") return <CheckCircle className="h-4 w-4" />
    if (status.includes("Desatualizado") || status === "Descontinuado") return <XCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  const getCriticalityColor = (criticality: string) => {
    if (criticality === "Alta") return "bg-red-100 text-red-800"
    if (criticality === "Média") return "bg-yellow-100 text-yellow-800"
    if (criticality === "Baixa") return "bg-green-100 text-green-800"
    return "bg-gray-100 text-gray-800"
  }

  const handleAddBi = (newBi: Omit<BiItem, "id"> | BiItem) => {
    let biWithId: BiItem
    if ("id" in newBi) {
      biWithId = newBi as BiItem
    } else {
      biWithId = { ...newBi, id: Date.now() }
    }

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
    setShowAreaManagement(false)
  }

  const handleEditArea = (updatedArea: Area) => {
    const updatedAreas = areas.map((area) => (area.id === updatedArea.id ? updatedArea : area))
    setAreas(updatedAreas)
    saveToLocalStorage(bis, updatedAreas)
    setShowAreaManagement(false)
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
        setCurrentSaveName(null)

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
    if (
      window.confirm("Tem certeza que deseja limpar os dados da sessão atual? Esta ação não afetará os saves salvos.")
    ) {
      setBis([])
      setAreas([])
      setFilteredBis([])
      calculateStats([])
      localStorage.removeItem(STORAGE_KEY_BIS)
      localStorage.removeItem(STORAGE_KEY_AREAS)
      setCurrentSaveName(null)
      alert("Dados da sessão atual limpos com sucesso! Os saves permanecem intactos.")
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
        setSortColumn(null)
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem(AUTH_KEY, "true")
      setAuthError("")
      setPassword("")
    } else {
      setAuthError("Senha incorreta. Tente novamente.")
      setPassword("")
    }
  }

  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja sair do sistema?")) {
      setIsAuthenticated(false)
      localStorage.removeItem(AUTH_KEY)
      setPassword("")
      setAuthError("")
    }
  }

  const handleSaveCurrent = (name: string, description?: string) => {
    const newSave: SaveData = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      bis: [...bis],
      areas: [...areas],
      stats: {
        total: stats.total,
        updated: stats.updated,
        outdated: stats.outdated,
        discontinued: stats.discontinued,
      },
    }

    const updatedSaves = [...saves, newSave]
    setSaves(updatedSaves)
    savesToLocalStorage(updatedSaves)
    setCurrentSaveName(name)
    alert(`Save "${name}" criado com sucesso!`)
  }

  const handleLoadSave = (saveData: SaveData) => {
    if (window.confirm(`Carregar o save "${saveData.name}"? Os dados atuais serão substituídos.`)) {
      setBis(saveData.bis)
      setAreas(saveData.areas)
      calculateStats(saveData.bis)
      saveToLocalStorage(saveData.bis, saveData.areas)
      setCurrentSaveName(saveData.name)
      setShowSavesDrawer(false)
      alert(`Save "${saveData.name}" carregado com sucesso!`)
    }
  }

  const handleDeleteSave = (saveId: string) => {
    const saveToDelete = saves.find((s) => s.id === saveId)
    if (!saveToDelete) return

    if (window.confirm(`Tem certeza que deseja excluir o save "${saveToDelete.name}"?`)) {
      const updatedSaves = saves.filter((s) => s.id !== saveId)
      setSaves(updatedSaves)
      savesToLocalStorage(updatedSaves)

      if (currentSaveName === saveToDelete.name) {
        setCurrentSaveName(null)
      }

      alert(`Save "${saveToDelete.name}" excluído com sucesso!`)
    }
  }

  const handleImportSave = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Ler BIs
        const bisSheet = workbook.Sheets["BIs"]
        if (!bisSheet) {
          alert("Arquivo Excel inválido. Planilha 'BIs' não encontrada.")
          return
        }

        const bisData = XLSX.utils.sheet_to_json<any>(bisSheet)
        const importedBis: BiItem[] = bisData.map((row, index) => ({
          id: row.ID || Date.now() + index,
          name: row.Nome || "",
          owner: row.Responsável || "",
          area: row.Área ? row.Área.split(",").map((a: string) => a.trim()) : [],
          status: row.Status || "",
          lastUpdate: row["Última Atualização"] || "",
          observations: row.Observações || "",
          usage: row.Uso || "",
          criticality: row.Criticidade || "",
          description: row.Descrição || "",
          link: row.Link || "",
        }))

        // Ler Áreas
        const areasSheet = workbook.Sheets["Áreas"]
        let importedAreas: Area[] = []
        if (areasSheet) {
          const areasData = XLSX.utils.sheet_to_json<any>(areasSheet)
          importedAreas = areasData.map((row, index) => ({
            id: row.ID || Date.now() + index,
            name: row.Nome || "",
            description: row.Descrição || "",
          }))
        }

        // Ler Metadados
        const metaSheet = workbook.Sheets["Metadados"]
        let saveName = "Save Importado"
        let saveDescription = ""
        if (metaSheet) {
          const metaData = XLSX.utils.sheet_to_json<any>(metaSheet)
          if (metaData.length > 0) {
            saveName = metaData[0]["Nome do Save"] || saveName
            saveDescription = metaData[0].Descrição || ""
          }
        }

        const newSave: SaveData = {
          id: Date.now().toString(),
          name: saveName,
          description: saveDescription,
          createdAt: new Date().toISOString(),
          bis: importedBis,
          areas: importedAreas,
          stats: {
            total: importedBis.length,
            updated: importedBis.filter((bi) => bi.status === "Atualizado").length,
            outdated: importedBis.filter((bi) => bi.status.includes("Desatualizado")).length,
            discontinued: importedBis.filter((bi) => bi.status === "Descontinuado").length,
          },
        }

        const updatedSaves = [...saves, newSave]
        setSaves(updatedSaves)
        savesToLocalStorage(updatedSaves)
        alert(`Save "${newSave.name}" importado com sucesso!`)
      } catch (error) {
        console.error("Erro ao importar save:", error)
        alert("Erro ao importar save. Verifique se o arquivo está correto.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExportSave = (saveData: SaveData) => {
    const workbook = XLSX.utils.book_new()

    // Criar planilha de BIs
    const bisData = saveData.bis.map((bi) => ({
      ID: bi.id,
      Nome: bi.name,
      Responsável: bi.owner,
      Área: bi.area.join(", "),
      Status: bi.status,
      "Última Atualização": bi.lastUpdate,
      Observações: bi.observations,
      Uso: bi.usage,
      Criticidade: bi.criticality,
      Descrição: bi.description || "",
      Link: bi.link || "",
    }))
    const bisSheet = XLSX.utils.json_to_sheet(bisData)
    XLSX.utils.book_append_sheet(workbook, bisSheet, "BIs")

    // Criar planilha de Áreas
    const areasData = saveData.areas.map((area) => ({
      ID: area.id,
      Nome: area.name,
      Descrição: area.description || "",
    }))
    const areasSheet = XLSX.utils.json_to_sheet(areasData)
    XLSX.utils.book_append_sheet(workbook, areasSheet, "Áreas")

    // Criar planilha de Metadados
    const metaData = [
      {
        "Nome do Save": saveData.name,
        Descrição: saveData.description || "",
        "Data de Criação": new Date(saveData.createdAt).toLocaleString("pt-BR"),
        "Total de BIs": saveData.stats.total,
        Atualizados: saveData.stats.updated,
        Desatualizados: saveData.stats.outdated,
        Descontinuados: saveData.stats.discontinued || 0,
      },
    ]
    const metaSheet = XLSX.utils.json_to_sheet(metaData)
    XLSX.utils.book_append_sheet(workbook, metaSheet, "Metadados")

    // Exportar arquivo
    XLSX.writeFile(workbook, `save-${saveData.name.replace(/ /g, "_")}.xlsx`)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString + "T00:00:00")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()
      return `${month}/${year}`
    } catch (error) {
      console.error("Error formatting date:", dateString, error)
      return dateString
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
            <p className="text-gray-600">Sistema de Gestão e Saneamento de BIs</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha de Acesso
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setAuthError("")
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Digite a senha de acesso"
                required
                autoFocus
              />
              {authError && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Acessar Sistema
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">Sistema protegido por senha para garantir a segurança dos dados</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Gestão de BIs</h2>
                {currentSaveName && <p className="text-xs text-blue-100">Save: {currentSaveName}</p>}
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage("dashboard")}
                      className={`w-full ${
                        currentPage === "dashboard"
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                      } border border-blue-200 rounded-lg transition-all duration-200 hover:shadow-md`}
                      tooltip="Ir para Dashboard Principal"
                    >
                      <Home className="h-4 w-4" />
                      <span className="font-medium">Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage("analysis")}
                      className={`w-full ${
                        currentPage === "analysis"
                          ? "bg-purple-100 text-purple-700 border-purple-300"
                          : "bg-purple-50 hover:bg-purple-100 text-purple-700"
                      } border border-purple-200 rounded-lg transition-all duration-200 hover:shadow-md`}
                      tooltip="Ir para Análise e Comparação"
                    >
                      <BarChart2 className="h-4 w-4" />
                      <span className="font-medium">Análise</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage("comparison")}
                      className={`w-full ${
                        currentPage === "comparison"
                          ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                      } border border-indigo-200 rounded-lg transition-all duration-200 hover:shadow-md`}
                      tooltip="Comparar BIs entre Saves"
                    >
                      <GitCompare className="h-4 w-4" />
                      <span className="font-medium">Comparar BIs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarSeparator className="my-2" />

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowAddForm(true)}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all duration-200 hover:shadow-md"
                      tooltip="Adicionar novo BI"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">Adicionar BI</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleExport(bis, areas)}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
                      tooltip="Exportar todos os dados"
                    >
                      <Download className="h-4 w-4" />
                      <span className="font-medium">Exportar Dados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowAreaManagement(true)}
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-all duration-200 hover:shadow-md"
                      tooltip="Gerenciar áreas/sistemas"
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Gerenciar Áreas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowSavesDrawer(true)}
                      className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg transition-all duration-200 hover:shadow-md"
                      tooltip="Central de saves e backups"
                    >
                      <Archive className="h-4 w-4" />
                      <span className="font-medium">Central de Saves</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleClearData}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-all duration-200 hover:shadow-md"
                      tooltip="Limpar dados da sessão atual"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="font-medium">Limpar Sessão</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
                  tooltip="Sair do sistema"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="bg-gray-50 min-h-screen">
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <SidebarTrigger className="hover:bg-gray-100 rounded-md p-2 transition-colors" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {currentPage === "dashboard"
                    ? "Gestão e Saneamento de BIs"
                    : currentPage === "analysis"
                      ? "Análise e Comparação de Dados"
                      : "Comparação de BIs"}
                </h1>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {currentPage === "dashboard" ? (
                <div className="max-w-full mx-auto">
                  <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                      <div className="bg-blue-50 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <BarChart3 className="h-7 w-7 text-blue-600 mr-2" />
                          <div>
                            <p className="text-xs font-medium text-blue-600">Total de BIs</p>
                            <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <FileText className="h-7 w-7 text-purple-600 mr-2" />
                          <div>
                            <p className="text-xs font-medium text-purple-600">Total de Páginas</p>
                            <p className="text-xl font-bold text-purple-900">{stats.totalPages}</p>
                          </div>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-green-50 p-3 rounded-lg cursor-help relative overflow-hidden shadow-sm"
                              onMouseEnter={() => setIsUpdatedHovered(true)}
                              onMouseLeave={() => setIsUpdatedHovered(false)}
                            >
                              <div className="flex items-center">
                                <CheckCircle className="h-7 w-7 text-green-600 mr-2" />
                                <div>
                                  <p className="text-xs font-medium text-green-600">Atualizados</p>
                                  <div className="relative h-6">
                                    <p
                                      className={`absolute inset-0 text-xl font-bold text-green-900 transition-all duration-300 ease-in-out ${
                                        isUpdatedHovered ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
                                      }`}
                                    >
                                      {stats.updated}
                                    </p>
                                    <p
                                      className={`absolute inset-0 text-xl font-bold text-green-900 transition-all duration-300 ease-in-out ${
                                        isUpdatedHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
                                      }`}
                                    >
                                      {stats.updatedPercentage.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{stats.updatedPercentage.toFixed(1)}% do total de BIs</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-red-50 p-3 rounded-lg cursor-help relative overflow-hidden shadow-sm"
                              onMouseEnter={() => setIsOutdatedHovered(true)}
                              onMouseLeave={() => setIsOutdatedHovered(false)}
                            >
                              <div className="flex items-center">
                                <XCircle className="h-7 w-7 text-red-600 mr-2" />
                                <div>
                                  <p className="text-xs font-medium text-red-600">Desatualizados</p>
                                  <div className="relative h-6">
                                    <p
                                      className={`absolute inset-0 text-xl font-bold text-red-900 transition-all duration-300 ease-in-out ${
                                        isOutdatedHovered ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
                                      }`}
                                    >
                                      {stats.outdated}
                                    </p>
                                    <p
                                      className={`absolute inset-0 text-xl font-bold text-red-900 transition-all duration-300 ease-in-out ${
                                        isOutdatedHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
                                      }`}
                                    >
                                      {stats.outdatedPercentage.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{stats.outdatedPercentage.toFixed(1)}% do total de BIs</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-orange-50 p-3 rounded-lg cursor-help relative overflow-hidden shadow-sm"
                              onMouseEnter={() => setIsDiscontinuedHovered(true)}
                              onMouseLeave={() => setIsDiscontinuedHovered(false)}
                            >
                              <div className="flex items-center">
                                <AlertCircle className="h-7 w-7 text-orange-600 mr-2" />
                                <div>
                                  <p className="text-xs font-medium text-orange-600">Descontinuados</p>
                                  <div className="relative h-6">
                                    <p
                                      className={`absolute inset-0 text-xl font-bold text-orange-900 transition-all duration-300 ease-in-out ${
                                        isDiscontinuedHovered
                                          ? "opacity-0 -translate-y-full"
                                          : "opacity-100 translate-y-0"
                                      }`}
                                    >
                                      {stats.discontinued}
                                    </p>
                                    <p
                                      className={`absolute inset-0 text-xl font-bold text-orange-900 transition-all duration-300 ease-in-out ${
                                        isDiscontinuedHovered
                                          ? "opacity-100 translate-y-0"
                                          : "opacity-0 translate-y-full"
                                      }`}
                                    >
                                      {stats.discontinuedPercentage.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{stats.discontinuedPercentage.toFixed(1)}% do total de BIs</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex-1 min-w-64">
                        <div className="relative">
                          <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nome, responsável, descrições ou observações..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          />
                        </div>
                      </div>

                      <select
                        value={filterArea}
                        onChange={(e) => handleAreaFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
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
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="updated">Atualizados</option>
                        <option value="outdated">Desatualizados</option>
                        <option value="discontinued">Descontinuados</option>
                        <option value="Sem permissão">Sem permissão</option>
                        <option value="Não encontrado">Não encontrado</option>
                      </select>

                      <select
                        value={filterMonth}
                        onChange={(e) => handleMonthFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
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
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
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
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="all">Todas as Criticidades</option>
                        <option value="">Não Aplicável</option>
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                              <div className="flex items-center">Área {getSortIcon("area")}</div>
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
                              <tr
                                className={`hover:bg-gray-50 ${expandedBis.has(bi.id) ? "border-l-4 border-l-blue-500 bg-blue-50" : ""}`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => toggleBiExpansion(bi.id)}
                                      className="mr-2 p-1 hover:bg-gray-200 rounded"
                                    >
                                      {expandedBis.has(bi.id) ? (
                                        <ChevronDown className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900">{bi.name}</div>
                                      {bi.description && <div className="text-sm text-gray-500">{bi.description}</div>}
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
                                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(bi.lastUpdate)}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{bi.usage}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(bi.criticality)}`}
                                  >
                                    {bi.criticality || "Não Aplicável"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
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

                              {expandedBis.has(bi.id) && (
                                <tr className="bg-blue-50">
                                  <td colSpan={8} className="p-0">
                                    <div className="px-6 py-3">
                                      <div className="space-y-2 text-sm">
                                        {bi.pages && bi.pages.length > 0 && (
                                          <div>
                                            <span className="font-medium text-gray-700">Páginas:</span>
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                              {bi.pages.length} {bi.pages.length === 1 ? "página" : "páginas"}
                                            </span>
                                          </div>
                                        )}
                                        {bi.observations && (
                                          <div>
                                            <span className="font-medium text-gray-700">Observações:</span>
                                            <p className="text-gray-600 mt-1">{bi.observations}</p>
                                          </div>
                                        )}
                                        {bi.link && (
                                          <div>
                                            <span className="font-medium text-gray-700">Link:</span>
                                            <a
                                              href={bi.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
                                            >
                                              🔗 Acessar BI
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {expandedBis.has(bi.id) &&
                                bi.pages?.map((page) => (
                                  <tr key={`${bi.id}-${page.id}`} className="bg-gray-25 hover:bg-gray-50">
                                    <td className="px-6 py-3">
                                      <div className="flex items-center pl-8">
                                        <div className="w-4 h-4 mr-2"></div>
                                        <FileText className="h-4 w-4 text-gray-300 mr-2" />
                                        <div>
                                          <div className="text-sm text-gray-700">{page.name}</div>
                                          {page.observations && (
                                            <div className="text-xs text-gray-400">{page.observations}</div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="text-sm text-gray-500">-</span>
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
                                    <td className="px-6 py-3">
                                      <span className="text-sm text-gray-500">-</span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="text-sm text-gray-500">-</span>
                                    </td>
                                    <td className="px-6 py-3">
                                      {page.criticality !== undefined && (
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(page.criticality)}`}
                                        >
                                          {page.criticality || "Não Aplicável"}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium">
                                      <div className="flex space-x-2"></div>
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

                    <div className="p-4 text-sm text-gray-600 border-t border-gray-200 text-center">
                      <span>
                        Mostrando {filteredBis.length} de {bis.length} BIs
                      </span>
                    </div>
                  </div>

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
              ) : currentPage === "analysis" ? (
                <AnalysisPage saves={saves} currentBis={bis} currentAreas={areas} currentSaveName={currentSaveName} />
              ) : (
                <BiComparison saves={saves} currentBis={bis} currentSaveName={currentSaveName} />
              )}
            </div>
          </div>
        </SidebarInset>

        <SavesDrawer
          isOpen={showSavesDrawer}
          onClose={() => setShowSavesDrawer(false)}
          currentBis={bis}
          currentAreas={areas}
          onLoadSave={handleLoadSave}
          saves={saves}
          onSaveCurrent={handleSaveCurrent}
          onDeleteSave={handleDeleteSave}
          onImportSave={handleImportSave}
          onExportSave={handleExportSave}
        />

        {showAddForm && <BiForm onSave={handleAddBi} onCancel={() => setShowAddForm(false)} areas={areas} />}

        {editingBi && <BiForm bi={editingBi} onSave={handleEditBi} onCancel={() => setEditingBi(null)} areas={areas} />}

        {showAreaManagement && (
          <AreaManagement
            areas={areas}
            onAddArea={handleAddArea}
            onEditArea={handleEditArea}
            onDeleteArea={handleDeleteArea}
            onClose={() => setShowAreaManagement(false)}
          />
        )}
      </div>
    </SidebarProvider>
  )
}

export default BiManagementSystem
