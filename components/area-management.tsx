"use client"

import type React from "react"
import { useState, useRef } from "react" // Importar useRef
import { Edit2, Trash2, Plus, X, ArrowUp, ArrowDown } from "lucide-react" // Adicionar ArrowUp e ArrowDown

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

interface AreaFormProps {
  area?: Area
  onSave: (area: Area | Omit<Area, "id">) => void
  onCancel: () => void
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

const AreaManagement: React.FC<AreaManagementProps> = ({ areas, onAddArea, onEditArea, onDeleteArea, onClose }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null) // Ref para o container de rolagem

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={scrollContainerRef} className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Gerenciar Áreas/Sistemas</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Nova Área
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Total de Áreas: {areas.length}</span>
            <button
              onClick={scrollToTop}
              className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
              title="Subir para o topo"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Subir Tudo
            </button>
            <button
              onClick={scrollToBottom}
              className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
              title="Descer para o final"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              Descer Tudo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome da Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {areas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma área cadastrada.
                  </td>
                </tr>
              ) : (
                areas.map((area) => (
                  <tr key={area.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{area.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingArea(area)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar Área"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteArea(area.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir Área"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showAddForm && <AreaForm onSave={onAddArea} onCancel={() => setShowAddForm(false)} />}
        {editingArea && <AreaForm area={editingArea} onSave={onEditArea} onCancel={() => setEditingArea(null)} />}
      </div>
    </div>
  )
}

export default AreaManagement
