"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Page } from "@/types/bi-types"

interface PageFormProps {
  page?: Page
  onSave: (page: Omit<Page, "id"> | Page) => void
  onCancel: () => void
}

const PageForm: React.FC<PageFormProps> = ({ page, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Page, "id">>({
    name: "",
    status: "",
    observations: "",
    criticality: "",
  })

  useEffect(() => {
    if (page) {
      setFormData({
        name: page.name,
        status: page.status || "",
        observations: page.observations || "",
        criticality: page.criticality || "",
      })
    }
  }, [page])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (page) {
      onSave({ ...formData, id: page.id })
    } else {
      onSave(formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{page ? "Editar Página" : "Adicionar Página"}</h2>
          <Button onClick={onCancel} variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Página *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o nome da página"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione o status</option>
              <option value="Atualizado">Atualizado</option>
              <option value="Desatualizado">Desatualizado</option>
              <option value="Em revisão">Em revisão</option>
              <option value="Sem permissão">Sem permissão</option>
              <option value="Não encontrado">Não encontrado</option>
            </select>
          </div>

          <div>
            <label htmlFor="criticality" className="block text-sm font-medium text-gray-700 mb-2">
              Criticidade
            </label>
            <select
              id="criticality"
              name="criticality"
              value={formData.criticality}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Não Aplicável</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>

          <div>
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              id="observations"
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observações sobre a página"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" onClick={onCancel} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {page ? "Salvar Alterações" : "Adicionar Página"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PageForm
