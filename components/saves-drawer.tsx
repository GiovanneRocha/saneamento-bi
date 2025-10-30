"use client"

import type React from "react"
import { useState } from "react"
import {
  X,
  Save,
  Download,
  Upload,
  Trash2,
  Calendar,
  BarChart3,
  Building2,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SaveData } from "@/types/bi-types"

interface SavesDrawerProps {
  saves: SaveData[]
  currentSaveName: string | null
  onClose: () => void
  onLoad: (save: SaveData) => void
  onDelete: (saveId: string) => void
  onExport: (save: SaveData) => void
  onImport: (file: File) => void
  onSaveCurrent: (name: string, description?: string) => void
}

const SavesDrawer: React.FC<SavesDrawerProps> = ({
  saves,
  currentSaveName,
  onClose,
  onLoad,
  onDelete,
  onExport,
  onImport,
  onSaveCurrent,
}) => {
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [saveDescription, setSaveDescription] = useState("")

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (saveName.trim()) {
      onSaveCurrent(saveName.trim(), saveDescription.trim() || undefined)
      setSaveName("")
      setSaveDescription("")
      setShowSaveForm(false)
    }
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImport(file)
      event.target.value = ""
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Central de Saves</h2>
              <p className="text-sm text-orange-100">Gerencie seus saves em Excel</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-white hover:bg-orange-500">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current State Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar Saves</h3>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-orange-900">
                  {currentSaveName ? `Save Atual: ${currentSaveName}` : "Sessão Atual"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowSaveForm(true)}
                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Salvar Estado Atual
                </Button>
                <label className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer text-xs">
                  <Upload className="h-3 w-3 mr-1" />
                  Importar Save Excel
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Save Form */}
          {showSaveForm && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Criar Novo Save</h4>
              <form onSubmit={handleSaveSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Save *</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    placeholder="Ex: BIs Financeiro, BIs Críticos..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    placeholder="Descrição do contexto ou propósito deste save..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowSaveForm(false)
                      setSaveName("")
                      setSaveDescription("")
                    }}
                    className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Saves List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Saves Salvos ({saves.length})</h3>
            {saves.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum save criado ainda</p>
                <p className="text-sm">Salve o estado atual para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {saves
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((save) => (
                    <div
                      key={save.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <FileSpreadsheet className="h-4 w-4 text-green-600 mr-2" />
                            <h4 className="font-semibold text-gray-900 text-sm">{save.name}</h4>
                          </div>
                          {save.description && <p className="text-xs text-gray-600 mt-1 ml-6">{save.description}</p>}
                          <div className="flex items-center mt-2 text-xs text-gray-500 ml-6">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(save.createdAt)}
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-3">
                          <Button
                            onClick={() => onExport(save)}
                            className="text-green-600 hover:text-green-900"
                            title="Exportar Save Excel"
                            variant="ghost"
                            size="icon"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => onDelete(save.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir Save"
                            variant="ghost"
                            size="icon"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs ml-6">
                        <div className="flex items-center">
                          <BarChart3 className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="text-blue-700">{save.stats.total} BIs</span>
                        </div>
                        <div className="flex items-center">
                          <Building2 className="h-3 w-3 text-purple-600 mr-1" />
                          <span className="text-purple-700">{save.areas.length} Áreas</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-green-700">{save.stats.updated} Atualizados</span>
                        </div>
                        <div className="flex items-center">
                          <XCircle className="h-3 w-3 text-red-600 mr-1" />
                          <span className="text-red-700">{save.stats.outdated} Desatualizados</span>
                        </div>
                      </div>

                      {/* Load Button */}
                      <Button
                        onClick={() => onLoad(save)}
                        className="w-full flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-xs ml-6"
                        style={{ width: "calc(100% - 1.5rem)" }}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Carregar Save
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SavesDrawer
