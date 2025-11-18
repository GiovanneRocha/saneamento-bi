"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { BarChart3, Filter, X, Download, CheckCircle, XCircle, FileText, AlertCircle, GitCompare, Layers, Target, Link } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { SaveData, BiItem, Area } from "@/types/bi-types"
import {
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { ChartTooltip } from "@/components/ui/chart"

interface AnalysisPageProps {
  saves: SaveData[]
  currentBis: BiItem[]
  currentAreas: Area[]
  currentSaveName: string | null
}

interface ComparisonData {
  name: string
  total: number
  updated: number
  outdated: number
  discontinued: number
  totalPages: number
}

interface BiComparisonData {
  biName: string
  area: string
  status: string
  criticality: string
  pages: number
  lastUpdate: string
  owner: string
  saveName: string
  biId: number
  saveId: string
  link?: string
}

// Enhanced color palette
const COLORS = {
  status: {
    updated: "#10b981", // Emerald 500
    outdated: "#ef4444", // Red 500
    discontinued: "#f97316", // Orange 500
  },
  criticality: {
    Alta: "#dc2626", // Red 600
    Média: "#f59e0b", // Amber 500
    Baixa: "#10b981", // Emerald 500
    "Não Aplicável": "#94a3b8", // Slate 400
  },
  primary: {
    blue: "#3b82f6", // Blue 500
    indigo: "#6366f1", // Indigo 500
    purple: "#a855f7", // Purple 500
    pink: "#ec4899", // Pink 500
    teal: "#14b8a6", // Teal 500
    cyan: "#06b6d4", // Cyan 500
  },
  chart: [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#06b6d4", // Cyan
  ],
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({
  saves = [],
  currentBis = [],
  currentAreas = [],
  currentSaveName,
}) => {
  const [activeTab, setActiveTab] = useState<"saves" | "bis">("saves")

  // Saves comparison states
  const [selectedSaves, setSelectedSaves] = useState<string[]>([])
  const [filterAreas, setFilterAreas] = useState<string[]>([])
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])
  const [filterCriticalities, setFilterCriticalities] = useState<string[]>([])
  const [includeCurrentSession, setIncludeCurrentSession] = useState(true)

  // BIs comparison states
  const [selectedBis, setSelectedBis] = useState<string[]>([])
  const [biFilterArea, setBiFilterArea] = useState<string>("all")
  const [biFilterSave, setBiFilterSave] = useState<string>("all")
  const [biSearchTerm, setBiSearchTerm] = useState("")

  // Get all available BIs from all saves and current session
  const allAvailableBis = useMemo<BiComparisonData[]>(() => {
    const bis: BiComparisonData[] = []

    // Add current session BIs - with safety check
    if (Array.isArray(currentBis)) {
      currentBis.forEach((bi) => {
        bis.push({
          biName: bi.name,
          area: Array.isArray(bi.area) ? bi.area.join(", ") : "",
          status: bi.status || "",
          criticality: bi.criticality || "Não Aplicável",
          pages: Array.isArray(bi.pages) ? bi.pages.length : 0,
          lastUpdate: bi.lastUpdate || "",
          owner: bi.owner || "",
          saveName: currentSaveName || "Sessão Atual",
          biId: bi.id,
          saveId: "current",
          link: bi.link,
        })
      })
    }

    // Add saves BIs - with safety check
    if (Array.isArray(saves)) {
      saves.forEach((save) => {
        if (save && Array.isArray(save.bis)) {
          save.bis.forEach((bi) => {
            bis.push({
              biName: bi.name,
              area: Array.isArray(bi.area) ? bi.area.join(", ") : "",
              status: bi.status || "",
              criticality: bi.criticality || "Não Aplicável",
              pages: Array.isArray(bi.pages) ? bi.pages.length : 0,
              lastUpdate: bi.lastUpdate || "",
              owner: bi.owner || "",
              saveName: save.name || "",
              biId: bi.id,
              saveId: save.id,
              link: bi.link,
            })
          })
        }
      })
    }

    return bis
  }, [currentBis, saves, currentSaveName])

  // Filter BIs for selection
  const filteredAvailableBis = useMemo(() => {
    let filtered = [...allAvailableBis]

    if (biFilterArea !== "all") {
      filtered = filtered.filter((bi) => bi.area.includes(biFilterArea))
    }

    if (biFilterSave !== "all") {
      filtered = filtered.filter((bi) => bi.saveId === biFilterSave)
    }

    if (biSearchTerm) {
      const search = biSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (bi) =>
          bi.biName.toLowerCase().includes(search) ||
          bi.area.toLowerCase().includes(search) ||
          bi.owner.toLowerCase().includes(search),
      )
    }

    return filtered
  }, [allAvailableBis, biFilterArea, biFilterSave, biSearchTerm])

  // Get selected BIs data
  const selectedBisData = useMemo(() => {
    return allAvailableBis.filter((bi) => selectedBis.includes(`${bi.saveId}-${bi.biId}`))
  }, [allAvailableBis, selectedBis])

  // Prepare comparison data for saves
  const comparisonData = useMemo<ComparisonData[]>(() => {
    const data: ComparisonData[] = []

    if (includeCurrentSession && Array.isArray(currentBis)) {
      let filteredBis = [...currentBis]

      if (filterAreas.length > 0) {
        filteredBis = filteredBis.filter(
          (bi) => Array.isArray(bi.area) && bi.area.some((area) => filterAreas.includes(area)),
        )
      }

      if (filterStatuses.length > 0) {
        filteredBis = filteredBis.filter((bi) => {
          if (filterStatuses.includes("updated") && bi.status === "Atualizado") return true
          if (filterStatuses.includes("outdated") && bi.status?.includes("Desatualizado")) return true
          if (filterStatuses.includes("discontinued") && bi.status === "Descontinuado") return true
          return false
        })
      }

      if (filterCriticalities.length > 0) {
        filteredBis = filteredBis.filter((bi) => {
          if (filterCriticalities.includes("none") && (!bi.criticality || bi.criticality === "")) return true
          return filterCriticalities.includes(bi.criticality)
        })
      }

      data.push({
        name: currentSaveName || "Sessão Atual",
        total: filteredBis.length,
        updated: filteredBis.filter((bi) => bi.status === "Atualizado").length,
        outdated: filteredBis.filter((bi) => bi.status?.includes("Desatualizado")).length,
        discontinued: filteredBis.filter((bi) => bi.status === "Descontinuado").length,
        totalPages: filteredBis.reduce((sum, bi) => sum + (Array.isArray(bi.pages) ? bi.pages.length : 0), 0),
      })
    }

    if (Array.isArray(selectedSaves) && Array.isArray(saves)) {
      selectedSaves.forEach((saveId) => {
        const save = saves.find((s) => s.id === saveId)
        if (save && Array.isArray(save.bis)) {
          let filteredBis = [...save.bis]

          if (filterAreas.length > 0) {
            filteredBis = filteredBis.filter(
              (bi) => Array.isArray(bi.area) && bi.area.some((area) => filterAreas.includes(area)),
            )
          }

          if (filterStatuses.length > 0) {
            filteredBis = filteredBis.filter((bi) => {
              if (filterStatuses.includes("updated") && bi.status === "Atualizado") return true
              if (filterStatuses.includes("outdated") && bi.status?.includes("Desatualizado")) return true
              if (filterStatuses.includes("discontinued") && bi.status === "Descontinuado") return true
              return false
            })
          }

          if (filterCriticalities.length > 0) {
            filteredBis = filteredBis.filter((bi) => {
              if (filterCriticalities.includes("none") && (!bi.criticality || bi.criticality === "")) return true
              return filterCriticalities.includes(bi.criticality)
            })
          }

          data.push({
            name: save.name,
            total: filteredBis.length,
            updated: filteredBis.filter((bi) => bi.status === "Atualizado").length,
            outdated: filteredBis.filter((bi) => bi.status?.includes("Desatualizado")).length,
            discontinued: filteredBis.filter((bi) => bi.status === "Descontinuado").length,
            totalPages: filteredBis.reduce((sum, bi) => sum + (Array.isArray(bi.pages) ? bi.pages.length : 0), 0),
          })
        }
      })
    }

    return data
  }, [
    selectedSaves,
    saves,
    currentBis,
    includeCurrentSession,
    filterAreas,
    filterStatuses,
    filterCriticalities,
    currentSaveName,
  ])

  // Calculate percentage data
  const percentageData = useMemo(() => {
    return comparisonData.map((item) => ({
      name: item.name,
      updatedPercent: item.total > 0 ? Number.parseFloat(((item.updated / item.total) * 100).toFixed(1)) : 0,
      outdatedPercent: item.total > 0 ? Number.parseFloat(((item.outdated / item.total) * 100).toFixed(1)) : 0,
      discontinuedPercent: item.total > 0 ? Number.parseFloat(((item.discontinued / item.total) * 100).toFixed(1)) : 0,
    }))
  }, [comparisonData])

  // Calculate status distribution (for donut chart)
  const statusDistributionData = useMemo(() => {
    const totals = comparisonData.reduce(
      (acc, item) => ({
        updated: acc.updated + item.updated,
        outdated: acc.outdated + item.outdated,
        discontinued: acc.discontinued + item.discontinued,
      }),
      { updated: 0, outdated: 0, discontinued: 0 },
    )

    return [
      { name: "Atualizados", value: totals.updated, color: COLORS.status.updated },
      { name: "Desatualizados", value: totals.outdated, color: COLORS.status.outdated },
      { name: "Descontinuados", value: totals.discontinued, color: COLORS.status.discontinued },
    ].filter((item) => item.value > 0)
  }, [comparisonData])

  // Calculate criticality distribution (for horizontal bar chart)
  const criticalityDistributionData = useMemo(() => {
    let allBis: BiItem[] = []

    if (includeCurrentSession && Array.isArray(currentBis)) {
      allBis = [...currentBis]
    }

    if (Array.isArray(selectedSaves) && Array.isArray(saves)) {
      selectedSaves.forEach((saveId) => {
        const save = saves.find((s) => s.id === saveId)
        if (save && Array.isArray(save.bis)) {
          allBis = [...allBis, ...save.bis]
        }
      })
    }

    if (filterAreas.length > 0) {
      allBis = allBis.filter((bi) => Array.isArray(bi.area) && bi.area.some((area) => filterAreas.includes(area)))
    }

    if (filterStatuses.length > 0) {
      allBis = allBis.filter((bi) => {
        if (filterStatuses.includes("updated") && bi.status === "Atualizado") return true
        if (filterStatuses.includes("outdated") && bi.status?.includes("Desatualizado")) return true
        if (filterStatuses.includes("discontinued") && bi.status === "Descontinuado") return true
        return false
      })
    }

    if (filterCriticalities.length > 0) {
      allBis = allBis.filter((bi) => {
        if (filterCriticalities.includes("none") && (!bi.criticality || bi.criticality === "")) return true
        return filterCriticalities.includes(bi.criticality)
      })
    }

    const counts = {
      Alta: 0,
      Média: 0,
      Baixa: 0,
      "Não Aplicável": 0,
    }

    allBis.forEach((bi) => {
      if (!bi.criticality || bi.criticality === "") {
        counts["Não Aplicável"]++
      } else if (bi.criticality in counts) {
        counts[bi.criticality as keyof typeof counts]++
      }
    })

    return [
      { name: "Alta", value: counts.Alta, color: COLORS.criticality.Alta },
      { name: "Média", value: counts.Média, color: COLORS.criticality.Média },
      { name: "Baixa", value: counts.Baixa, color: COLORS.criticality.Baixa },
      { name: "Não Aplicável", value: counts["Não Aplicável"], color: COLORS.criticality["Não Aplicável"] },
    ].filter((item) => item.value > 0)
  }, [
    comparisonData,
    currentBis,
    saves,
    selectedSaves,
    includeCurrentSession,
    filterAreas,
    filterStatuses,
    filterCriticalities,
  ])

  // Prepare BIs comparison chart data
  const bisComparisonChartData = useMemo(() => {
    return selectedBisData.map((bi) => ({
      name: bi.biName,
      pages: bi.pages,
      status: bi.status === "Atualizado" ? 100 : bi.status.includes("Desatualizado") ? 50 : 0,
      criticality:
        bi.criticality === "Alta" ? 100 : bi.criticality === "Média" ? 66 : bi.criticality === "Baixa" ? 33 : 0,
    }))
  }, [selectedBisData])

  // Radar chart data for BIs comparison
  const radarChartData = useMemo(() => {
    if (selectedBisData.length === 0) return []

    const metrics = ["Páginas", "Atualização", "Criticidade", "Complexidade"]

    return metrics.map((metric) => {
      const dataPoint: any = { metric }

      selectedBisData.forEach((bi, index) => {
        let value = 0

        switch (metric) {
          case "Páginas":
            value = Math.min(bi.pages * 10, 100) // Normalize to 100
            break
          case "Atualização":
            value = bi.status === "Atualizado" ? 100 : bi.status.includes("Desatualizado") ? 50 : 25
            break
          case "Criticidade":
            value =
              bi.criticality === "Alta" ? 100 : bi.criticality === "Média" ? 66 : bi.criticality === "Baixa" ? 33 : 0
            break
          case "Complexidade":
            value = bi.pages > 10 ? 100 : bi.pages > 5 ? 66 : bi.pages > 2 ? 33 : 10
            break
        }

        dataPoint[bi.biName] = value
      })

      return dataPoint
    })
  }, [selectedBisData])

  // Get all unique areas from saves and current session
  const allAreas = useMemo(() => {
    const areaSet = new Set<string>()

    if (Array.isArray(currentAreas)) {
      currentAreas.forEach((area) => {
        if (area && area.name) {
          areaSet.add(area.name)
        }
      })
    }

    if (Array.isArray(saves)) {
      saves.forEach((save) => {
        if (save && Array.isArray(save.areas)) {
          save.areas.forEach((area) => {
            if (area && area.name) {
              areaSet.add(area.name)
            }
          })
        }
      })
    }

    return Array.from(areaSet).sort()
  }, [currentAreas, saves])

  const toggleSaveSelection = (saveId: string) => {
    setSelectedSaves((prev) => (prev.includes(saveId) ? prev.filter((id) => id !== saveId) : [...prev, saveId]))
  }

  const toggleBiSelection = (biKey: string) => {
    setSelectedBis((prev) => (prev.includes(biKey) ? prev.filter((key) => key !== biKey) : [...prev, biKey]))
  }

  const handleAreaToggle = (area: string, shiftKey: boolean) => {
    if (shiftKey && filterAreas.length > 0) {
      const lastSelected = filterAreas[filterAreas.length - 1]
      const lastIndex = allAreas.indexOf(lastSelected)
      const currentIndex = allAreas.indexOf(area)

      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)
      const range = allAreas.slice(start, end + 1)

      setFilterAreas((prev) => {
        const newSelection = new Set([...prev, ...range])
        return Array.from(newSelection)
      })
    } else {
      setFilterAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
    }
  }

  const handleStatusToggle = (status: string, shiftKey: boolean) => {
    const statuses = ["updated", "outdated", "discontinued"]

    if (shiftKey && filterStatuses.length > 0) {
      const lastSelected = filterStatuses[filterStatuses.length - 1]
      const lastIndex = statuses.indexOf(lastSelected)
      const currentIndex = statuses.indexOf(status)

      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)
      const range = statuses.slice(start, end + 1)

      setFilterStatuses((prev) => {
        const newSelection = new Set([...prev, ...range])
        return Array.from(newSelection)
      })
    } else {
      setFilterStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
    }
  }

  const handleCriticalityToggle = (criticality: string, shiftKey: boolean) => {
    const criticalities = ["Alta", "Média", "Baixa", "none"]

    if (shiftKey && filterCriticalities.length > 0) {
      const lastSelected = filterCriticalities[filterCriticalities.length - 1]
      const lastIndex = criticalities.indexOf(lastSelected)
      const currentIndex = criticalities.indexOf(criticality)

      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)
      const range = criticalities.slice(start, end + 1)

      setFilterCriticalities((prev) => {
        const newSelection = new Set([...prev, ...range])
        return Array.from(newSelection)
      })
    } else {
      setFilterCriticalities((prev) =>
        prev.includes(criticality) ? prev.filter((c) => c !== criticality) : [...prev, criticality],
      )
    }
  }

  const clearFilters = () => {
    setFilterAreas([])
    setFilterStatuses([])
    setFilterCriticalities([])
  }

  const clearBiFilters = () => {
    setBiFilterArea("all")
    setBiFilterSave("all")
    setBiSearchTerm("")
    setSelectedBis([])
  }

  const exportComparison = () => {
    const dataToExport =
      activeTab === "saves"
        ? {
            type: "saves-comparison",
            comparisonDate: new Date().toISOString(),
            filters: {
              areas: filterAreas,
              statuses: filterStatuses,
              criticalities: filterCriticalities,
            },
            data: comparisonData,
            statusDistribution: statusDistributionData,
            criticalityDistribution: criticalityDistributionData,
          }
        : {
            type: "bis-comparison",
            comparisonDate: new Date().toISOString(),
            selectedBis: selectedBisData,
            chartData: bisComparisonChartData,
            radarData: radarChartData,
          }

    const json = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeTab}-comparison-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    if (status === "Atualizado") return "bg-green-100 text-green-800 border-green-300"
    if (status.includes("Desatualizado")) return "bg-red-100 text-red-800 border-red-300"
    if (status === "Descontinuado") return "bg-orange-100 text-orange-800 border-orange-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getCriticalityColor = (criticality: string) => {
    if (criticality === "Alta") return "bg-red-100 text-red-800 border-red-300"
    if (criticality === "Média") return "bg-amber-100 text-amber-800 border-amber-300"
    if (criticality === "Baixa") return "bg-green-100 text-green-800 border-green-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  const CustomStatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = statusDistributionData.reduce((sum, item) => sum + item.value, 0)
      const percentage = ((data.value / total) * 100).toFixed(1)

      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-gray-200">
          <p className="font-bold text-gray-900 text-base">{data.name}</p>
          <p className="text-sm text-gray-700 font-medium mt-1">
            <span className="font-bold text-lg">{data.value}</span> BIs
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{percentage}% do total</p>
        </div>
      )
    }
    return null
  }

  const CustomCriticalityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = criticalityDistributionData.reduce((sum, item) => sum + item.value, 0)
      const percentage = ((data.payload.value / total) * 100).toFixed(1)

      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-gray-200">
          <p className="font-bold text-gray-900 text-base">{data.payload.name}</p>
          <p className="text-sm text-gray-700 font-medium mt-1">
            <span className="font-bold text-lg">{data.value}</span> BIs
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{percentage}% do total</p>
        </div>
      )
    }
    return null
  }

  const renderColorfulLegend = (value: string, entry: any) => {
    return (
      <span className="inline-flex items-center gap-2 font-medium text-sm">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
        <span style={{ color: entry.color }}>{value}</span>
        <span className="text-gray-600">({entry.payload.value})</span>
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="h-8 w-8 mr-3" />
              Análise e Comparação de Dados
            </h1>
            <p className="text-purple-100 mt-2">
              Compare saves, BIs de diferentes áreas e analise a evolução dos seus dados
              <br />
              <span className="text-xs opacity-75">💡 Dica: Use Shift + Clique para seleção múltipla nos filtros</span>
            </p>
          </div>
          <Button
            onClick={exportComparison}
            className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-lg"
            disabled={activeTab === "saves" ? comparisonData.length === 0 : selectedBisData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Análise
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "saves" | "bis")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-gradient-to-r from-purple-100 to-indigo-100 p-1 rounded-lg">
          <TabsTrigger
            value="saves"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md text-base font-semibold transition-all"
          >
            <Layers className="h-5 w-5 mr-2" />
            Comparação de Saves
          </TabsTrigger>
          <TabsTrigger
            value="bis"
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md text-base font-semibold transition-all"
          >
            <GitCompare className="h-5 w-5 mr-2" />
            Comparação de BIs
          </TabsTrigger>
        </TabsList>

        {/* SAVES COMPARISON TAB */}
        <TabsContent value="saves" className="space-y-6 mt-6">
          {/* Selection and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Save Selection */}
            <Card className="lg:col-span-1 border-2 border-blue-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Selecionar Saves
                </CardTitle>
                <CardDescription>Escolha os saves para comparar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 shadow-sm">
                  <Checkbox
                    id="current-session"
                    checked={includeCurrentSession}
                    onCheckedChange={(checked) => setIncludeCurrentSession(checked as boolean)}
                    className="border-blue-400"
                  />
                  <label
                    htmlFor="current-session"
                    className="text-sm font-semibold text-blue-900 cursor-pointer flex-1"
                  >
                    {currentSaveName || "Sessão Atual"}
                  </label>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {saves.map((save) => (
                    <div
                      key={save.id}
                      className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 rounded-lg border-2 border-gray-200 transition-all cursor-pointer"
                      onClick={() => toggleSaveSelection(save.id)}
                    >
                      <Checkbox
                        id={save.id}
                        checked={selectedSaves.includes(save.id)}
                        onCheckedChange={() => toggleSaveSelection(save.id)}
                        className="border-gray-400"
                      />
                      <label htmlFor={save.id} className="text-sm cursor-pointer flex-1">
                        <div className="font-semibold text-gray-900">{save.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(save.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {saves.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">Nenhum save disponível para comparação</div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="lg:col-span-2 border-2 border-purple-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Filter className="h-5 w-5 mr-2 text-purple-600" />
                      Filtros Dinâmicos
                    </CardTitle>
                    <CardDescription>
                      Refine a análise aplicando filtros (Shift + Clique para múltipla seleção)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="border-2 border-gray-300 bg-transparent"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Area Filter */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Áreas</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border-2 border-gray-200 rounded-lg bg-gray-50">
                      {allAreas.map((area) => (
                        <div
                          key={area}
                          className="flex items-center space-x-2 p-2 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 rounded cursor-pointer border border-gray-200 transition-all"
                          onClick={(e) => handleAreaToggle(area, e.shiftKey)}
                        >
                          <Checkbox
                            id={`area-${area}`}
                            checked={filterAreas.includes(area)}
                            className="border-gray-400"
                          />
                          <label htmlFor={`area-${area}`} className="text-sm cursor-pointer flex-1 font-medium">
                            {area}
                          </label>
                        </div>
                      ))}
                    </div>
                    {filterAreas.length > 0 && (
                      <div className="mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                        {filterAreas.length} área(s) selecionada(s)
                      </div>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-lg cursor-pointer border-2 border-green-200 transition-all"
                        onClick={(e) => handleStatusToggle("updated", e.shiftKey)}
                      >
                        <Checkbox
                          id="status-updated"
                          checked={filterStatuses.includes("updated")}
                          className="border-green-400"
                        />
                        <label
                          htmlFor="status-updated"
                          className="text-sm cursor-pointer flex-1 flex items-center font-semibold"
                        >
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          <span className="text-green-700">Atualizados</span>
                        </label>
                      </div>
                      <div
                        className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg cursor-pointer border-2 border-red-200 transition-all"
                        onClick={(e) => handleStatusToggle("outdated", e.shiftKey)}
                      >
                        <Checkbox
                          id="status-outdated"
                          checked={filterStatuses.includes("outdated")}
                          className="border-red-400"
                        />
                        <label
                          htmlFor="status-outdated"
                          className="text-sm cursor-pointer flex-1 flex items-center font-semibold"
                        >
                          <XCircle className="h-4 w-4 mr-1 text-red-600" />
                          <span className="text-red-700">Desatualizados</span>
                        </label>
                      </div>
                      <div
                        className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 rounded-lg cursor-pointer border-2 border-orange-200 transition-all"
                        onClick={(e) => handleStatusToggle("discontinued", e.shiftKey)}
                      >
                        <Checkbox
                          id="status-discontinued"
                          checked={filterStatuses.includes("discontinued")}
                          className="border-orange-400"
                        />
                        <label
                          htmlFor="status-discontinued"
                          className="text-sm cursor-pointer flex-1 flex items-center font-semibold"
                        >
                          <AlertCircle className="h-4 w-4 mr-1 text-orange-600" />
                          <span className="text-orange-700">Descontinuados</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Criticality Filter */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Criticidade</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div
                        className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg cursor-pointer border-2 border-red-200 transition-all"
                        onClick={(e) => handleCriticalityToggle("Alta", e.shiftKey)}
                      >
                        <Checkbox
                          id="crit-alta"
                          checked={filterCriticalities.includes("Alta")}
                          className="border-red-400"
                        />
                        <label htmlFor="crit-alta" className="text-sm cursor-pointer flex-1 font-semibold text-red-700">
                          Alta
                        </label>
                      </div>
                      <div
                        className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 rounded-lg cursor-pointer border-2 border-amber-200 transition-all"
                        onClick={(e) => handleCriticalityToggle("Média", e.shiftKey)}
                      >
                        <Checkbox
                          id="crit-media"
                          checked={filterCriticalities.includes("Média")}
                          className="border-amber-400"
                        />
                        <label
                          htmlFor="crit-media"
                          className="text-sm cursor-pointer flex-1 font-semibold text-amber-700"
                        >
                          Média
                        </label>
                      </div>
                      <div
                        className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-lg cursor-pointer border-2 border-green-200 transition-all"
                        onClick={(e) => handleCriticalityToggle("Baixa", e.shiftKey)}
                      >
                        <Checkbox
                          id="crit-baixa"
                          checked={filterCriticalities.includes("Baixa")}
                          className="border-green-400"
                        />
                        <label
                          htmlFor="crit-baixa"
                          className="text-sm cursor-pointer flex-1 font-semibold text-green-700"
                        >
                          Baixa
                        </label>
                      </div>
                      <div
                        className="flex items-center space-x-2 p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 rounded-lg cursor-pointer border-2 border-gray-200 transition-all"
                        onClick={(e) => handleCriticalityToggle("none", e.shiftKey)}
                      >
                        <Checkbox
                          id="crit-none"
                          checked={filterCriticalities.includes("none")}
                          className="border-gray-400"
                        />
                        <label
                          htmlFor="crit-none"
                          className="text-sm cursor-pointer flex-1 font-semibold text-gray-700"
                        >
                          Não Aplicável
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {(filterAreas.length > 0 || filterStatuses.length > 0 || filterCriticalities.length > 0) && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 shadow-sm">
                    <p className="text-sm text-purple-900 font-bold">Filtros ativos:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filterAreas.length > 0 && (
                        <span className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-3 py-1 rounded-full font-semibold border border-purple-300">
                          {filterAreas.length} área(s)
                        </span>
                      )}
                      {filterStatuses.length > 0 && (
                        <span className="text-xs bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 px-3 py-1 rounded-full font-semibold border border-pink-300">
                          {filterStatuses.length} status
                        </span>
                      )}
                      {filterCriticalities.length > 0 && (
                        <span className="text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-300">
                          {filterCriticalities.length} criticidade(s)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BIS COMPARISON TAB */}
        <TabsContent value="bis" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* BI Selection */}
            <Card className="lg:col-span-2 border-2 border-indigo-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Target className="h-5 w-5 mr-2 text-indigo-600" />
                      Selecionar BIs para Comparar
                    </CardTitle>
                    <CardDescription>
                      Escolha BIs individuais de diferentes áreas e saves ({selectedBis.length} selecionados)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearBiFilters}
                    className="border-2 border-gray-300 bg-transparent"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar BI..."
                        value={biSearchTerm}
                        onChange={(e) => setBiSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <FileText className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    </div>

                    <select
                      value={biFilterArea}
                      onChange={(e) => setBiFilterArea(e.target.value)}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                    >
                      <option value="all">Todas as Áreas</option>
                      {allAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>

                    <select
                      value={biFilterSave}
                      onChange={(e) => setBiFilterSave(e.target.value)}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                    >
                      <option value="all">Todos os Saves</option>
                      <option value="current">{currentSaveName || "Sessão Atual"}</option>
                      {saves.map((save) => (
                        <option key={save.id} value={save.id}>
                          {save.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* BIs List */}
                  <div className="max-h-96 overflow-y-auto space-y-2 border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                    {filteredAvailableBis.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Nenhum BI encontrado com os filtros aplicados
                      </div>
                    ) : (
                      filteredAvailableBis.map((bi) => {
                        const biKey = `${bi.saveId}-${bi.biId}`
                        const isSelected = selectedBis.includes(biKey)

                        return (
                          <div
                            key={biKey}
                            className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-r from-indigo-100 to-blue-100 border-indigo-400 shadow-md"
                                : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                            }`}
                            onClick={() => toggleBiSelection(biKey)}
                          >
                            <Checkbox
                              id={biKey}
                              checked={isSelected}
                              onCheckedChange={() => toggleBiSelection(biKey)}
                              className={isSelected ? "border-indigo-600" : "border-gray-400"}
                            />
                            <label htmlFor={biKey} className="flex-1 cursor-pointer">
                              <div className="font-semibold text-gray-900 text-sm">{bi.biName}</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="outline" className="text-xs bg-white">
                                  {bi.saveName}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-white">
                                  {bi.area}
                                </Badge>
                                <Badge className={`text-xs ${getStatusColor(bi.status)}`}>{bi.status}</Badge>
                                {bi.criticality !== "Não Aplicável" && (
                                  <Badge className={`text-xs ${getCriticalityColor(bi.criticality)}`}>
                                    {bi.criticality}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs bg-white">
                                  {bi.pages} {bi.pages === 1 ? "página" : "páginas"}
                                </Badge>
                                {bi.link && (
                                  <a
                                    href={bi.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium hover:underline transition-colors"
                                  >
                                    <Link className="h-3 w-3 mr-1" />
                                    Link do BI
                                  </a>
                                )}
                              </div>
                            </label>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected BIs Summary */}
            <Card className="lg:col-span-1 border-2 border-purple-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center text-lg">
                  <GitCompare className="h-5 w-5 mr-2 text-purple-600" />
                  BIs Selecionados
                </CardTitle>
                <CardDescription>Resumo da seleção atual</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {selectedBisData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Nenhum BI selecionado
                    <br />
                    <span className="text-xs">Selecione BIs à esquerda para comparar</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-700">{selectedBisData.length}</div>
                        <div className="text-xs font-semibold text-purple-600 mt-1">
                          {selectedBisData.length === 1 ? "BI Selecionado" : "BIs Selecionados"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedBisData.map((bi, index) => (
                        <div
                          key={`${bi.saveId}-${bi.biId}`}
                          className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-xs text-gray-900 truncate">{bi.biName}</div>
                              <div className="text-xs text-gray-500 mt-1">{bi.saveName}</div>
                            </div>
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ml-2"
                              style={{ backgroundColor: COLORS.chart[index % COLORS.chart.length] }}
                            >
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-green-50 rounded text-center">
                          <div className="font-bold text-green-700">
                            {selectedBisData.filter((bi) => bi.status === "Atualizado").length}
                          </div>
                          <div className="text-green-600">Atualizados</div>
                        </div>
                        <div className="p-2 bg-red-50 rounded text-center">
                          <div className="font-bold text-red-700">
                            {selectedBisData.filter((bi) => bi.status.includes("Desatualizado")).length}
                          </div>
                          <div className="text-red-600">Desatualizados</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedBisData.length === 0 ? (
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="py-12 text-center">
                <GitCompare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Nenhum BI selecionado para comparação</p>
                <p className="text-gray-500 text-sm mt-2">
                  Selecione pelo menos um BI acima para visualizar comparações detalhadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Comparison Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pages Comparison Bar Chart */}
                <Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                        Comparação de Páginas
                      </span>
                    </CardTitle>
                    <CardDescription className="font-medium">Número de páginas por BI</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bisComparisonChartData} layout="vertical" margin={{ left: 150 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" />
                          <YAxis type="category" dataKey="name" width={140} stroke="#6b7280" tick={{ fontSize: 11 }} />
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-gray-200">
                                    <p className="font-bold text-gray-900 text-sm">{payload[0].payload.name}</p>
                                    <p className="text-sm text-gray-700 font-medium mt-1">
                                      <span className="font-bold text-lg">{payload[0].value}</span>{" "}
                                      {payload[0].value === 1 ? "página" : "páginas"}
                                    </p>
                                  </div>
                                )
                              }
                              return null
                            }}
                            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                          />
                          <Bar dataKey="pages" name="Páginas" radius={[0, 8, 8, 0]}>
                            {bisComparisonChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS.chart[index % COLORS.chart.length]}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Radar Chart for Multi-Metric Comparison */}
                <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                        Análise Multidimensional
                      </span>
                    </CardTitle>
                    <CardDescription className="font-medium">
                      Comparação de múltiplas métricas (valores normalizados)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarChartData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-gray-200">
                                    <p className="font-bold text-gray-900 text-sm mb-2">{payload[0].payload.metric}</p>
                                    {payload.map((entry, index) => (
                                      <div key={index} className="flex items-center justify-between gap-3 text-xs mt-1">
                                        <span style={{ color: entry.color }} className="font-medium">
                                          {entry.name}:
                                        </span>
                                        <span className="font-bold">{entry.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                          {selectedBisData.map((bi, index) => (
                            <Radar
                              key={`${bi.saveId}-${bi.biId}`}
                              name={bi.biName}
                              dataKey={bi.biName}
                              stroke={COLORS.chart[index % COLORS.chart.length]}
                              fill={COLORS.chart[index % COLORS.chart.length]}
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          ))}
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalysisPage
