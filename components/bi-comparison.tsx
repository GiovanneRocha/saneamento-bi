"use client"

import React from "react"
import { useState, useMemo } from "react"
import {
  GitCompare,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { SaveData, BiItem } from "@/types/bi-types"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface BiComparisonProps {
  saves: SaveData[]
  currentBis: BiItem[]
  currentSaveName: string | null
}

interface BiComparison {
  biName: string
  biId: number
  save1Data?: BiItem
  save2Data?: BiItem
  statusChange: "improved" | "declined" | "unchanged" | "new" | "removed"
  criticalityChange: "increased" | "decreased" | "unchanged" | "added" | "removed"
  pagesChange: number
  ownerChange: boolean
  hasChanges: boolean
}

interface ComparisonStats {
  totalBis: number
  improved: number
  declined: number
  unchanged: number
  newBis: number
  removedBis: number
  statusChanges: number
  criticalityChanges: number
  ownerChanges: number
}

const BiComparison: React.FC<BiComparisonProps> = ({ saves, currentBis, currentSaveName }) => {
  const [save1Id, setSave1Id] = useState<string>("")
  const [save2Id, setSave2Id] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterChange, setFilterChange] = useState<string>("all")
  const [expandedBis, setExpandedBis] = useState<Set<number>>(new Set())

  // Prepare save options including current session
  const saveOptions = useMemo(() => {
    const options = [
      {
        id: "current",
        name: currentSaveName || "Sessão Atual",
        bis: currentBis,
      },
      ...saves.map((save) => ({
        id: save.id,
        name: save.name,
        bis: save.bis,
      })),
    ]
    return options
  }, [saves, currentBis, currentSaveName])

  // Get selected saves data
  const save1Data = useMemo(() => {
    return saveOptions.find((s) => s.id === save1Id)
  }, [saveOptions, save1Id])

  const save2Data = useMemo(() => {
    return saveOptions.find((s) => s.id === save2Id)
  }, [saveOptions, save2Id])

  // Compare BIs between two saves
  const comparison = useMemo<BiComparison[]>(() => {
    if (!save1Data || !save2Data) return []

    const allBiNames = new Set<string>()
    const biMap1 = new Map<string, BiItem>()
    const biMap2 = new Map<string, BiItem>()

    save1Data.bis.forEach((bi) => {
      allBiNames.add(bi.name)
      biMap1.set(bi.name, bi)
    })

    save2Data.bis.forEach((bi) => {
      allBiNames.add(bi.name)
      biMap2.set(bi.name, bi)
    })

    const comparisons: BiComparison[] = []

    allBiNames.forEach((biName) => {
      const bi1 = biMap1.get(biName)
      const bi2 = biMap2.get(biName)

      if (!bi1 && !bi2) return

      let statusChange: BiComparison["statusChange"] = "unchanged"
      let criticalityChange: BiComparison["criticalityChange"] = "unchanged"
      let pagesChange = 0
      let ownerChange = false
      let hasChanges = false

      if (!bi1 && bi2) {
        statusChange = "new"
        hasChanges = true
      } else if (bi1 && !bi2) {
        statusChange = "removed"
        hasChanges = true
      } else if (bi1 && bi2) {
        // Status comparison
        const status1 = bi1.status
        const status2 = bi2.status

        if (status1 !== status2) {
          hasChanges = true
          if (status2 === "Atualizado" && status1 !== "Atualizado") {
            statusChange = "improved"
          } else if (status1 === "Atualizado" && status2 !== "Atualizado") {
            statusChange = "declined"
          } else {
            statusChange = "unchanged"
          }
        }

        // Criticality comparison
        const crit1 = bi1.criticality || ""
        const crit2 = bi2.criticality || ""

        if (crit1 !== crit2) {
          hasChanges = true
          const critOrder = { Alta: 3, Média: 2, Baixa: 1, "": 0 }
          const order1 = critOrder[crit1 as keyof typeof critOrder] || 0
          const order2 = critOrder[crit2 as keyof typeof critOrder] || 0

          if (!crit1 && crit2) {
            criticalityChange = "added"
          } else if (crit1 && !crit2) {
            criticalityChange = "removed"
          } else if (order2 > order1) {
            criticalityChange = "increased"
          } else if (order2 < order1) {
            criticalityChange = "decreased"
          }
        }

        // Pages comparison
        const pages1 = bi1.pages?.length || 0
        const pages2 = bi2.pages?.length || 0
        pagesChange = pages2 - pages1
        if (pagesChange !== 0) hasChanges = true

        // Owner comparison
        if (bi1.owner !== bi2.owner) {
          ownerChange = true
          hasChanges = true
        }
      }

      comparisons.push({
        biName,
        biId: bi1?.id || bi2?.id || 0,
        save1Data: bi1,
        save2Data: bi2,
        statusChange,
        criticalityChange,
        pagesChange,
        ownerChange,
        hasChanges,
      })
    })

    return comparisons
  }, [save1Data, save2Data])

  // Filter comparisons
  const filteredComparison = useMemo(() => {
    let filtered = [...comparison]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((comp) => comp.biName.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Apply change filter
    if (filterChange !== "all") {
      if (filterChange === "changed") {
        filtered = filtered.filter((comp) => comp.hasChanges)
      } else if (filterChange === "improved") {
        filtered = filtered.filter((comp) => comp.statusChange === "improved")
      } else if (filterChange === "declined") {
        filtered = filtered.filter((comp) => comp.statusChange === "declined")
      } else if (filterChange === "new") {
        filtered = filtered.filter((comp) => comp.statusChange === "new")
      } else if (filterChange === "removed") {
        filtered = filtered.filter((comp) => comp.statusChange === "removed")
      }
    }

    return filtered
  }, [comparison, searchTerm, filterChange])

  // Calculate comparison stats
  const stats = useMemo<ComparisonStats>(() => {
    return {
      totalBis: comparison.length,
      improved: comparison.filter((c) => c.statusChange === "improved").length,
      declined: comparison.filter((c) => c.statusChange === "declined").length,
      unchanged: comparison.filter((c) => !c.hasChanges).length,
      newBis: comparison.filter((c) => c.statusChange === "new").length,
      removedBis: comparison.filter((c) => c.statusChange === "removed").length,
      statusChanges: comparison.filter(
        (c) => c.statusChange !== "unchanged" && c.statusChange !== "new" && c.statusChange !== "removed",
      ).length,
      criticalityChanges: comparison.filter((c) => c.criticalityChange !== "unchanged").length,
      ownerChanges: comparison.filter((c) => c.ownerChange).length,
    }
  }, [comparison])

  // Chart data
  const chartData = useMemo(() => {
    return [
      { name: "Melhorados", value: stats.improved, fill: "#10b981" },
      { name: "Piorados", value: stats.declined, fill: "#ef4444" },
      { name: "Sem Mudanças", value: stats.unchanged, fill: "#6b7280" },
      { name: "Novos", value: stats.newBis, fill: "#3b82f6" },
      { name: "Removidos", value: stats.removedBis, fill: "#f59e0b" },
    ]
  }, [stats])

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

  const getStatusColor = (status: string) => {
    if (status === "Atualizado") return "bg-green-100 text-green-800"
    if (status.includes("Desatualizado")) return "bg-red-100 text-red-800"
    if (status === "Sem permissão" || status === "Não encontrado") return "bg-gray-100 text-gray-800"
    return "bg-yellow-100 text-yellow-800"
  }

  const getCriticalityColor = (criticality: string) => {
    if (criticality === "Alta") return "bg-red-100 text-red-800"
    if (criticality === "Média") return "bg-yellow-100 text-yellow-800"
    if (criticality === "Baixa") return "bg-green-100 text-green-800"
    return "bg-gray-100 text-gray-800"
  }

  const getChangeIcon = (change: BiComparison["statusChange"]) => {
    switch (change) {
      case "improved":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "declined":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "new":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "removed":
        return <XCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const exportComparison = () => {
    const dataToExport = {
      comparisonDate: new Date().toISOString(),
      save1: save1Data?.name,
      save2: save2Data?.name,
      stats,
      comparisons: filteredComparison.map((comp) => ({
        biName: comp.biName,
        statusChange: comp.statusChange,
        criticalityChange: comp.criticalityChange,
        pagesChange: comp.pagesChange,
        ownerChange: comp.ownerChange,
        save1Status: comp.save1Data?.status,
        save2Status: comp.save2Data?.status,
        save1Criticality: comp.save1Data?.criticality,
        save2Criticality: comp.save2Data?.criticality,
      })),
    }

    const json = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bi-comparison-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const canCompare = save1Id && save2Id && save1Id !== save2Id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <GitCompare className="h-8 w-8 mr-3" />
              Comparação de BIs
            </h1>
            <p className="text-indigo-100 mt-2">Compare BIs entre diferentes saves e identifique mudanças</p>
          </div>
          <Button
            onClick={exportComparison}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
            disabled={!canCompare}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Comparação
          </Button>
        </div>
      </div>

      {/* Save Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2 text-indigo-600" />
            Selecionar Saves para Comparar
          </CardTitle>
          <CardDescription>Escolha dois saves para comparar seus BIs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Save Base (Antigo)</label>
              <Select value={save1Id} onValueChange={setSave1Id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o save base..." />
                </SelectTrigger>
                <SelectContent>
                  {saveOptions.map((save) => (
                    <SelectItem key={save.id} value={save.id} disabled={save.id === save2Id}>
                      {save.name} ({save.bis.length} BIs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Save Comparação (Novo)</label>
              <Select value={save2Id} onValueChange={setSave2Id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o save para comparar..." />
                </SelectTrigger>
                <SelectContent>
                  {saveOptions.map((save) => (
                    <SelectItem key={save.id} value={save.id} disabled={save.id === save1Id}>
                      {save.name} ({save.bis.length} BIs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {save1Id && save2Id && save1Id === save2Id && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Selecione saves diferentes</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Você precisa selecionar dois saves diferentes para comparar
                </p>
              </div>
            </div>
          )}

          {canCompare && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Comparando: {save1Data?.name} → {save2Data?.name}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {save1Data?.bis.length} BIs → {save2Data?.bis.length} BIs
                  </p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </CardContent>
      </Card>

      {!canCompare ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitCompare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Selecione dois saves diferentes para começar a comparação</p>
            <p className="text-gray-500 text-sm mt-2">
              Escolha um save base e um save para comparar nos seletores acima
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Melhorados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.improved}</div>
                <p className="text-xs text-gray-500 mt-1">Status atualizado</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Piorados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
                <p className="text-xs text-gray-500 mt-1">Status degradado</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Minus className="h-4 w-4 mr-1" />
                  Sem Mudanças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.unchanged}</div>
                <p className="text-xs text-gray-500 mt-1">Mantidos iguais</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Novos BIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.newBis}</div>
                <p className="text-xs text-gray-500 mt-1">Adicionados</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  Removidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.removedBis}</div>
                <p className="text-xs text-gray-500 mt-1">Excluídos</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart and Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Distribuição de Mudanças</CardTitle>
                <CardDescription>Visualização geral das alterações entre os saves</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Quantidade",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" name="Quantidade">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Mudança</CardTitle>
                <CardDescription>Detalhes das alterações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total de BIs</span>
                  <span className="text-lg font-bold text-purple-600">{stats.totalBis}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Mudanças de Status</span>
                  <span className="text-lg font-bold text-indigo-600">{stats.statusChanges}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Mudanças de Criticidade</span>
                  <span className="text-lg font-bold text-pink-600">{stats.criticalityChanges}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Mudanças de Responsável</span>
                  <span className="text-lg font-bold text-teal-600">{stats.ownerChanges}</span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Taxa de Mudança</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalBis > 0
                        ? (((stats.improved + stats.declined + stats.statusChanges) / stats.totalBis) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome do BI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <Select value={filterChange} onValueChange={setFilterChange}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filtrar por mudança" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as mudanças</SelectItem>
                    <SelectItem value="changed">Apenas com mudanças</SelectItem>
                    <SelectItem value="improved">Melhorados</SelectItem>
                    <SelectItem value="declined">Piorados</SelectItem>
                    <SelectItem value="new">Novos BIs</SelectItem>
                    <SelectItem value="removed">Removidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Comparação Detalhada</CardTitle>
              <CardDescription>
                Mostrando {filteredComparison.length} de {comparison.length} BIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome do BI</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {save1Data?.name}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mudança</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {save2Data?.name}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Páginas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredComparison.map((comp) => (
                      <React.Fragment key={comp.biId}>
                        <tr className={`hover:bg-gray-50 ${comp.hasChanges ? "bg-yellow-50" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleBiExpansion(comp.biId)}
                                className="mr-2 p-1 hover:bg-gray-200 rounded"
                              >
                                {expandedBis.has(comp.biId) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{comp.biName}</div>
                                {comp.hasChanges && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    Modificado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {comp.save1Data ? (
                              <div className="text-center space-y-1">
                                <Badge className={getStatusColor(comp.save1Data.status)}>{comp.save1Data.status}</Badge>
                                {comp.save1Data.criticality && (
                                  <div>
                                    <Badge className={getCriticalityColor(comp.save1Data.criticality)}>
                                      {comp.save1Data.criticality}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm">-</div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center space-y-1">
                              {getChangeIcon(comp.statusChange)}
                              {comp.criticalityChange !== "unchanged" && (
                                <span className="text-xs text-gray-500 capitalize">{comp.criticalityChange}</span>
                              )}
                              {comp.ownerChange && (
                                <Badge variant="outline" className="text-xs">
                                  Responsável
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {comp.save2Data ? (
                              <div className="text-center space-y-1">
                                <Badge className={getStatusColor(comp.save2Data.status)}>{comp.save2Data.status}</Badge>
                                {comp.save2Data.criticality && (
                                  <div>
                                    <Badge className={getCriticalityColor(comp.save2Data.criticality)}>
                                      {comp.save2Data.criticality}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm">-</div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <span className="text-sm text-gray-600">{comp.save1Data?.pages?.length || 0}</span>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {comp.save2Data?.pages?.length || 0}
                              </span>
                              {comp.pagesChange !== 0 && (
                                <Badge variant={comp.pagesChange > 0 ? "default" : "destructive"} className="text-xs">
                                  {comp.pagesChange > 0 ? "+" : ""}
                                  {comp.pagesChange}
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>

                        {expandedBis.has(comp.biId) && (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 bg-gray-50">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">{save1Data?.name}</h4>
                                  {comp.save1Data ? (
                                    <div className="space-y-1 text-gray-600">
                                      <p>
                                        <span className="font-medium">Responsável:</span>{" "}
                                        {comp.save1Data.owner || "Sem responsável"}
                                      </p>
                                      <p>
                                        <span className="font-medium">Área:</span> {comp.save1Data.area.join(", ")}
                                      </p>
                                      <p>
                                        <span className="font-medium">Uso:</span> {comp.save1Data.usage || "-"}
                                      </p>
                                      {comp.save1Data.description && (
                                        <p>
                                          <span className="font-medium">Descrição:</span> {comp.save1Data.description}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 italic">BI não existia neste save</p>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">{save2Data?.name}</h4>
                                  {comp.save2Data ? (
                                    <div className="space-y-1 text-gray-600">
                                      <p>
                                        <span className="font-medium">Responsável:</span>{" "}
                                        {comp.save2Data.owner || "Sem responsável"}
                                      </p>
                                      <p>
                                        <span className="font-medium">Área:</span> {comp.save2Data.area.join(", ")}
                                      </p>
                                      <p>
                                        <span className="font-medium">Uso:</span> {comp.save2Data.usage || "-"}
                                      </p>
                                      {comp.save2Data.description && (
                                        <p>
                                          <span className="font-medium">Descrição:</span> {comp.save2Data.description}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 italic">BI foi removido neste save</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {filteredComparison.length === 0 && (
                  <div className="text-center py-12">
                    <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum BI encontrado com os filtros aplicados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default BiComparison
