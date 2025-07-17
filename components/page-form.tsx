"use client"

import type React from "react"
import { useState } from "react"

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

interface PageFormProps {
  biId: number
  page?: Page
  onSave: (biId: number, page: Page | Omit<Page, "id">) => void
  onCancel: () => void
}

const PageForm: React.FC<PageFormProps> = ({ biId, page, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Page, "id">>({
    name: page?.name || "",
    owner: page?.owner || "",
    description: page?.description || "",
    status: page?.status || "Atualizado",
    lastUpdate: page?.lastUpdate || "",
    observations: page?.observations || "",
    usage: page?.usage || "Mensal",
    criticality: page?.criticality || "",
  })

  const handleSubmit = () => {
    if (formData.name.trim()) {
      if (page) {
        onSave(biId, { ...formData, id: page.id })
      } else {
        onSave(biId, formData)
      }
    } else {
      alert("Por favor, preencha o nome da página.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{page ? "Editar Página" : "Adicionar Nova Página"}</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Página *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Atualizado">Atualizado</option>
                <option value="Desatualizado">Desatualizado</option>
                <option value="Em revisão">Em revisão</option>
                <option value="Descontinuado">Descontinuado</option>
                <option value="Sem responsável">Sem responsável</option>
                <option value="Sem permissão">Sem permissão</option>
                <option value="Não encontrado">Não encontrado</option>
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
                <option value="">Não Aplicável</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descrição da página..."
            />
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
              {page ? "Salvar Alterações" : "Adicionar Página"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageForm
