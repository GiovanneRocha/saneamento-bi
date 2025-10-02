"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  BarChart3,
  TrendingUp,
  Filter,
  X,
  Download,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Calendar,
  ArrowUpDown,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SaveData, BiItem, Area } from "@/types/bi-types"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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
  noOwner: number
  totalPages: number
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ saves, currentBis, currentAreas, currentSaveName }) => {
  const [selectedSaves, setSelectedSaves] = useState<string[]>([])
  const [filterArea, setFilterArea] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCriticality, setFilterCriticality] = useState<string>("all")
  const [includeCurrentSession, setIncludeCurrentSession] = useState(true)

  // Prepare comparison data
  const comparisonData = useMemo<ComparisonData[]>(() => {
    const data: ComparisonData[] = []

    // Add current session if selected
    if (includeCurrentSession) {
      let filteredBis = [...currentBis]

      // Apply filters
      if (filterArea !== "all") {
        filteredBis = filteredBis.filter((bi) => bi.area.includes(filterArea))
      }

      if (filterStatus !== "all") {
        if (filterStatus === "updated") {
          filteredBis = filteredBis.filter((bi) => bi.status === "Atualizado")
        } else if (filterStatus === "outdated") {
          filteredBis = filteredBis.filter((bi) => bi.status.includes("Desatualizado"))
        } else if (filterStatus === "no_owner") {
          filteredBis = filteredBis.filter((bi) => !bi.owner || bi.owner === "")
        }
      }

      if (filterCriticality !== "all") {
        if (filterCriticality === "none") {
          filteredBis = filteredBis.filter((bi) => !bi.criticality || bi.criticality === "")
        } else {
          filteredBis = filteredBis.filter((bi) => bi.criticality === filterCriticality)
        }
      }

      data.push({
        name: currentSaveName || "Sessão Atual",
        total: filteredBis.length,
        updated: filteredBis.filter((bi) => bi.status === "Atualizado").length,
        outdated: filteredBis.filter((bi) => bi.status.includes("Desatualizado")).length,
        noOwner: filteredBis.filter((bi) => !bi.owner || bi.owner === "").length,
        totalPages: filteredBis.reduce((sum, bi) => sum + (bi.pages?.length || 0), 0),
      })
    }

    // Add selected saves
    selectedSaves.forEach((saveId) => {
      const save = saves.find((s) => s.id === saveId)
      if (save) {
        let filteredBis = [...save.bis]

        // Apply filters
        if (filterArea !== "all") {
          filteredBis = filteredBis.filter((bi) => bi.area.includes(filterArea))
        }

        if (filterStatus !== "all") {
          if (filterStatus === "updated") {
            filteredBis = filteredBis.filter((bi) => bi.status === "Atualizado")
          } else if (filterStatus === "outdated") {
            filteredBis = filteredBis.filter((bi) => bi.status.includes("Desatualizado"))
          } else if (filterStatus === "no_owner") {
            filteredBis = filteredBis.filter((bi) => !bi.owner || bi.owner === "")
          }
        }

        if (filterCriticality !== "all") {
          if (filterCriticality === "none") {
            filteredBis = filteredBis.filter((bi) => !bi.criticality || bi.criticality === "")
          } else {
            filteredBis = filteredBis.filter((bi) => bi.criticality === filterCriticality)
          }
        }

        data.push({
          name: save.name,
          total: filteredBis.length,
          updated: filteredBis.filter((bi) => bi.status === "Atualizado").length,
          outdated: filteredBis.filter((bi) => bi.status.includes("Desatualizado")).length,
          noOwner: filteredBis.filter((bi) => !bi.owner || bi.owner === "").length,
          totalPages: filteredBis.reduce((sum, bi) => sum + (bi.pages?.length || 0), 0),
        })
      }
    })

    return data
  }, [
    selectedSaves,
    saves,
    currentBis,
    includeCurrentSession,
    filterArea,
    filterStatus,
    filterCriticality,
    currentSaveName,
  ])

  // Calculate percentage data
  const percentageData = useMemo(() => {
    return comparisonData.map((item) => ({
      name: item.name,
      updatedPercent: item.total > 0 ? ((item.updated / item.total) * 100).toFixed(1) : 0,
      outdatedPercent: item.total > 0 ? ((item.outdated / item.total) * 100).toFixed(1) : 0,
      noOwnerPercent: item.total > 0 ? ((item.noOwner / item.total) * 100).toFixed(1) : 0,
    }))
  }, [comparisonData])

  // Get all unique areas from saves and current session
  const allAreas = useMemo(() => {
    const areaSet = new Set<string>()
    currentAreas.forEach((area) => areaSet.add(area.name))
    saves.forEach((save) => {
      save.areas.forEach((area) => areaSet.add(area.name))
    })
    return Array.from(areaSet).sort()
  }, [currentAreas, saves])

  const toggleSaveSelection = (saveId: string) => {
    setSelectedSaves((prev) => (prev.includes(saveId) ? prev.filter((id) => id !== saveId) : [...prev, saveId]))
  }

  const clearFilters = () => {
    setFilterArea("all")
    setFilterStatus("all")
    setFilterCriticality("all")
  }

  const exportComparison = () => {
    const dataToExport = {
      comparisonDate: new Date().toISOString(),
      filters: {
        area: filterArea,
        status: filterStatus,
        criticality: filterCriticality,
      },
      data: comparisonData,
    }

    const json = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `comparison-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="h-8 w-8 mr-3" />
              Análise e Comparação de Dados
            </h1>
            <p className="text-purple-100 mt-2">Compare diferentes versões e analise a evolução dos seus BIs</p>
          </div>
          <Button
            onClick={exportComparison}
            className="bg-white text-purple-600 hover:bg-purple-50"
            disabled={comparisonData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Análise
          </Button>
        </div>
      </div>

      {/* Selection and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Save Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Selecionar Saves
            </CardTitle>
            <CardDescription>Escolha os saves para comparar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="current-session"
                checked={includeCurrentSession}
                onCheckedChange={(checked) => setIncludeCurrentSession(checked as boolean)}
              />
              <label htmlFor="current-session" className="text-sm font-medium text-blue-900 cursor-pointer flex-1">
                {currentSaveName || "Sessão Atual"}
              </label>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {saves.map((save) => (
                <div
                  key={save.id}
                  className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <Checkbox
                    id={save.id}
                    checked={selectedSaves.includes(save.id)}
                    onCheckedChange={() => toggleSaveSelection(save.id)}
                  />
                  <label htmlFor={save.id} className="text-sm cursor-pointer flex-1">
                    <div className="font-medium text-gray-900">{save.name}</div>
                    <div className="text-xs text-gray-500">{new Date(save.createdAt).toLocaleDateString("pt-BR")}</div>
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-lg">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Filtros Dinâmicos
                </CardTitle>
                <CardDescription>Refine a análise aplicando filtros</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Área</label>
                <Select value={filterArea} onValueChange={setFilterArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as áreas</SelectItem>
                    {allAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="updated">Atualizados</SelectItem>
                    <SelectItem value="outdated">Desatualizados</SelectItem>
                    <SelectItem value="no_owner">Sem Responsável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Criticidade</label>
                <Select value={filterCriticality} onValueChange={setFilterCriticality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as criticidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as criticidades</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="none">Não Aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filterArea !== "all" || filterStatus !== "all" || filterCriticality !== "all") && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900 font-medium">Filtros ativos:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filterArea !== "all" && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Área: {filterArea}
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Status: {filterStatus}
                    </span>
                  )}
                  {filterCriticality !== "all" && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Criticidade: {filterCriticality}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {comparisonData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Nenhum dado selecionado para análise</p>
            <p className="text-gray-500 text-sm mt-2">Selecione a sessão atual ou saves para começar a comparação</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total de BIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {comparisonData.reduce((sum, item) => sum + item.total, 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Média:{" "}
                  {(comparisonData.reduce((sum, item) => sum + item.total, 0) / comparisonData.length).toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Atualizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {comparisonData.reduce((sum, item) => sum + item.updated, 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Média:{" "}
                  {(comparisonData.reduce((sum, item) => sum + item.updated, 0) / comparisonData.length).toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Desatualizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {comparisonData.reduce((sum, item) => sum + item.outdated, 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Média:{" "}
                  {(comparisonData.reduce((sum, item) => sum + item.outdated, 0) / comparisonData.length).toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Sem Responsável</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {comparisonData.reduce((sum, item) => sum + item.noOwner, 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Média:{" "}
                  {(comparisonData.reduce((sum, item) => sum + item.noOwner, 0) / comparisonData.length).toFixed(1)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Absolute Numbers Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Comparação de Números Absolutos
                </CardTitle>
                <CardDescription>Quantidade de BIs por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    updated: {
                      label: "Atualizados",
                      color: "hsl(142, 76%, 36%)",
                    },
                    outdated: {
                      label: "Desatualizados",
                      color: "hsl(0, 84%, 60%)",
                    },
                    noOwner: {
                      label: "Sem Responsável",
                      color: "hsl(45, 93%, 47%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="updated" fill="var(--color-updated)" name="Atualizados" />
                      <Bar dataKey="outdated" fill="var(--color-outdated)" name="Desatualizados" />
                      <Bar dataKey="noOwner" fill="var(--color-noOwner)" name="Sem Responsável" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Percentage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                  Comparação de Percentuais
                </CardTitle>
                <CardDescription>Distribuição percentual por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    updatedPercent: {
                      label: "% Atualizados",
                      color: "hsl(142, 76%, 36%)",
                    },
                    outdatedPercent: {
                      label: "% Desatualizados",
                      color: "hsl(0, 84%, 60%)",
                    },
                    noOwnerPercent: {
                      label: "% Sem Responsável",
                      color: "hsl(45, 93%, 47%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={percentageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="updatedPercent"
                        stroke="var(--color-updatedPercent)"
                        strokeWidth={2}
                        name="% Atualizados"
                      />
                      <Line
                        type="monotone"
                        dataKey="outdatedPercent"
                        stroke="var(--color-outdatedPercent)"
                        strokeWidth={2}
                        name="% Desatualizados"
                      />
                      <Line
                        type="monotone"
                        dataKey="noOwnerPercent"
                        stroke="var(--color-noOwnerPercent)"
                        strokeWidth={2}
                        name="% Sem Responsável"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Total BIs Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                  Evolução Total de BIs
                </CardTitle>
                <CardDescription>Quantidade total ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Total de BIs",
                      color: "hsl(239, 84%, 67%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--color-total)"
                        strokeWidth={3}
                        name="Total de BIs"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pages Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                  Total de Páginas
                </CardTitle>
                <CardDescription>Comparação do número de páginas</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    totalPages: {
                      label: "Total de Páginas",
                      color: "hsl(173, 80%, 40%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="totalPages" fill="var(--color-totalPages)" name="Total de Páginas" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpDown className="h-5 w-5 mr-2 text-gray-600" />
                Tabela de Comparação Detalhada
              </CardTitle>
              <CardDescription>Visão completa de todas as métricas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
                        Atualizados
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <XCircle className="h-4 w-4 inline mr-1 text-red-600" />
                        Desatualizados
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <Users className="h-4 w-4 inline mr-1 text-yellow-600" />
                        Sem Responsável
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <FileText className="h-4 w-4 inline mr-1 text-purple-600" />
                        Páginas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisonData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-blue-600">{item.total}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-semibold text-green-600">{item.updated}</div>
                          <div className="text-xs text-gray-500">
                            {item.total > 0 ? ((item.updated / item.total) * 100).toFixed(1) : 0}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-semibold text-red-600">{item.outdated}</div>
                          <div className="text-xs text-gray-500">
                            {item.total > 0 ? ((item.outdated / item.total) * 100).toFixed(1) : 0}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-semibold text-yellow-600">{item.noOwner}</div>
                          <div className="text-xs text-gray-500">
                            {item.total > 0 ? ((item.noOwner / item.total) * 100).toFixed(1) : 0}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-purple-600">
                          {item.totalPages}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default AnalysisPage
