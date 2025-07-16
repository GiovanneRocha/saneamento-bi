"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

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
}

interface Area {
  id: number
  name: string
  description?: string
}

interface BiFormProps {
  bi?: BiItem
  onSave: (bi: BiItem) => void
  onCancel: () => void
  areas: Area[]
}

const BiForm: React.FC<BiFormProps> = ({ bi, onSave, onCancel, areas }) => {
  const [formData, setFormData] = useState<Omit<BiItem, "id">>({
    name: bi?.name || "",
    owner: bi?.owner || "",
    area: bi?.area || [],
    status: bi?.status || "Atualizado",
    lastUpdate: bi?.lastUpdate || "",
    observations: bi?.observations || "",
    usage: bi?.usage || "Mensal",
    criticality: bi?.criticality || "Média",
  })

  const handleSubmit = () => {
    if (formData.name && formData.area.length > 0) {
      if (bi) {
        onSave({ ...formData, id: bi.id })
      } else {
        onSave(formData as BiItem)
      }
    } else {
      alert("Por favor, preencha o nome do BI e selecione pelo menos uma área.")
    }
  }

  const toggleAreaSelection = (areaName: string) => {
    setFormData((prev) => {
      const currentAreas = prev.area || []
      if (currentAreas.includes(areaName)) {
        return { ...prev, area: currentAreas.filter((a) => a !== areaName) }
      } else {
        return { ...prev, area: [...currentAreas, areaName] }
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{bi ? "Editar BI" : "Adicionar Novo BI"}</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do BI *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável/Dono</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área/Sistema *</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    <span className="truncate max-w-[calc(100%-1.5rem)]">
                      {" "}
                      {/* Added truncate and max-width */}
                      {formData.area.length > 0 ? formData.area.join(", ") : "Selecione a(s) área(s)"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuLabel>Selecione as Áreas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {areas.map((area) => (
                    <DropdownMenuCheckboxItem
                      key={area.id}
                      checked={formData.area.includes(area.name)}
                      onCheckedChange={() => toggleAreaSelection(area.name)}
                    >
                      {area.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Atualizado">Atualizado</option>
                <option value="Desatualizado">Desatualizado</option>
                <option value="Em revisão">Em revisão</option>
                <option value="Descontinuado">Descontinuado</option>
                <option value="Sem responsável">Sem responsável</option>
                <option value="Sem acesso">Sem acesso</option> {/* New status */}
                <option value="Não encontrado">Não encontrado</option> {/* New status */}
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
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
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
              {bi ? "Salvar Alterações" : "Adicionar BI"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BiForm
