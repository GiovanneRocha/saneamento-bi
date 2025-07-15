"use client"

import type React from "react"
import { useState } from "react"
import { Edit2, Trash2, Plus, Building2 } from "lucide-react"

interface Area {
  id: number
  name: string
  description?: string
}

interface AreaManagementProps {
  areas: Area[]
  onAddArea: (area: Omit<Area, "id">) => void
  onEditArea: (area: Area) => void
  onDeleteArea: (id: number) => void
  onClose: () => void
}

const AreaManagement: React.FC<AreaManagementProps> = ({ areas, onAddArea, onEditArea, onDeleteArea, onClose }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)

  const AreaForm: React.FC<{
    area?: Area
    onSave: (area: Area | Omit<Area, "id">) => void
    onCancel: () => void
  }> = ({ area, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
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
        onCancel()
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gerenciar Áreas/Sistemas</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Área
              </button>
              <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                Fechar
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {areas.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma área cadastrada</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {areas.map((area) => (
                <div key={area.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">{area.name}</h3>
                      </div>
                      {area.description && <p className="text-sm text-gray-600">{area.description}</p>}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setEditingArea(area)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar área"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteArea(area.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir área"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showForm && <AreaForm onSave={onAddArea} onCancel={() => setShowForm(false)} />}

      {editingArea && <AreaForm area={editingArea} onSave={onEditArea} onCancel={() => setEditingArea(null)} />}
    </div>
  )
}

export default AreaManagement
