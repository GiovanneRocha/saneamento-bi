"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BiItem, Area, Page } from "@/types/bi-types"

interface BiFormProps {
  bi?: BiItem | null
  onSave: (bi: BiItem | Omit<BiItem, "id">) => void
  onCancel: () => void
  areas: Area[]
}

const BiForm: React.FC<BiFormProps> = ({ bi, onSave, onCancel, areas }) => {
  const [formData, setFormData] = useState<BiItem | Omit<BiItem, "id">>(
    bi || {
      name: "",
      owner: "",
      area: [],
      status: "",
      lastUpdate: "",
      observations: "",
      usage: "",
      criticality: "",
      description: "",
      link: "",
      pages: [],
    },
  )
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showPageForm, setShowPageForm] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)

  useEffect(() => {
    if (bi) {
      setFormData(bi)
    } else {
      setFormData({
        name: "",
        owner: "",
        area: [],
        status: "",
        lastUpdate: "",
        observations: "",
        usage: "",
        criticality: "",
        description: "",
        link: "",
        pages: [],
      })
    }
    setErrors({}) // Clear errors on form open/reset
  }, [bi])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleAreaMultiSelect = (selectedArea: string) => {
    setFormData((prev) => {
      const currentAreas = Array.isArray(prev.area) ? prev.area : []
      const newAreas = currentAreas.includes(selectedArea)
        ? currentAreas.filter((area) => area !== selectedArea)
        : [...currentAreas, selectedArea]
      if (errors.area) {
        setErrors((prevErrors) => ({ ...prevErrors, area: "" }))
      }
      return { ...prev, area: newAreas }
    })
  }

  const handleAddPage = (newPage: Omit<Page, "id"> | Page) => {
    let pageWithId: Page
    if ("id" in newPage) {
      pageWithId = newPage as Page
    } else {
      pageWithId = { ...newPage, id: Date.now() }
    }
    setFormData((prev) => ({
      ...prev,
      pages: prev.pages ? [...prev.pages, pageWithId] : [pageWithId],
    }))
    setShowPageForm(false)
  }

  const handleEditPage = (updatedPage: Page) => {
    setFormData((prev) => ({
      ...prev,
      pages: prev.pages?.map((page) => (page.id === updatedPage.id ? updatedPage : page)),
    }))
    setEditingPage(null)
    setShowPageForm(false)
  }

  const handleDeletePage = (pageId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta página?")) {
      setFormData((prev) => ({
        ...prev,
        pages: prev.pages?.filter((page) => page.id !== pageId),
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Validate lastUpdate format (still important for date parsing)
    const lastUpdateValue = formData.lastUpdate.trim()
    if (lastUpdateValue && !/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.test(lastUpdateValue)) {
      newErrors.lastUpdate = "Formato de data inválido. Use YYYY-MM-DD, YYYY-MM ou YYYY."
    }

    if (formData.link && !/^https?:\/\/\S+$/.test(formData.link)) {
      newErrors.link = "Link inválido. Deve ser uma URL válida (ex: https://exemplo.com)."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      let normalizedLastUpdate = formData.lastUpdate.trim()
      const parts = normalizedLastUpdate.split("-")
      if (parts.length === 1) {
        // Only year
        normalizedLastUpdate = `${parts[0]}-01-01`
      } else if (parts.length === 2) {
        // Year and month
        normalizedLastUpdate = `${parts[0]}-${parts[1]}-01`
      }
      // If parts.length === 3, it's already YYYY-MM-DD, no change needed.

      onSave({ ...formData, lastUpdate: normalizedLastUpdate })
    }
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {bi ? "Editar BI" : "Adicionar Novo BI"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Nome do BI */}
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do BI
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={cn("w-full shadow-sm", errors.name && "border-red-500")}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Responsável */}
            <div>
              <Label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">
                Responsável
              </Label>
              <Input
                id="owner"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                className={cn("w-full shadow-sm", errors.owner && "border-red-500")}
              />
              {errors.owner && <p className="text-red-500 text-xs mt-1">{errors.owner}</p>}
            </div>

            {/* Área */}
            <div>
              <Label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Área
              </Label>
              <Select onValueChange={(value) => handleAreaMultiSelect(value)}>
                <SelectTrigger className={cn("w-full shadow-sm", errors.area && "border-red-500")}>
                  <SelectValue placeholder="Selecione as áreas" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.name}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
              {formData.area.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.area.map((areaName, index) => (
                    <span
                      key={index}
                      className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      {areaName}
                      <button
                        type="button"
                        onClick={() => handleAreaMultiSelect(areaName)}
                        className="ml-1 text-blue-600 hover:text-blue-900"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className={cn("w-full shadow-sm", errors.status && "border-red-500")}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Selecione o status</SelectItem>
                  <SelectItem value="Atualizado">Atualizado</SelectItem>
                  <SelectItem value="Desatualizado">Desatualizado</SelectItem>
                  <SelectItem value="Em revisão">Em revisão</SelectItem>
                  <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                  <SelectItem value="Sem responsável">Sem responsável</SelectItem>
                  <SelectItem value="Sem permissão">Sem permissão</SelectItem>
                  <SelectItem value="Não encontrado">Não encontrado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>

            {/* Última Atualização */}
            <div>
              <Label htmlFor="lastUpdate" className="block text-sm font-medium text-gray-700 mb-1">
                Última Atualização
              </Label>
              <Input
                id="lastUpdate"
                name="lastUpdate"
                type="text"
                value={formData.lastUpdate}
                onChange={handleChange}
                className={cn("w-full shadow-sm", errors.lastUpdate && "border-red-500")}
                placeholder="YYYY-MM-DD, YYYY-MM ou YYYY"
              />
              {errors.lastUpdate && <p className="text-red-500 text-xs mt-1">{errors.lastUpdate}</p>}
            </div>

            {/* Uso */}
            <div>
              <Label htmlFor="usage" className="block text-sm font-medium text-gray-700 mb-1">
                Uso
              </Label>
              <Select name="usage" value={formData.usage} onValueChange={(value) => handleSelectChange("usage", value)}>
                <SelectTrigger className="w-full shadow-sm">
                  <SelectValue placeholder="Selecione a frequência de uso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Selecione a frequência de uso</SelectItem>
                  <SelectItem value="Diário">Diário</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Criticidade */}
            <div>
              <Label htmlFor="criticality" className="block text-sm font-medium text-gray-700 mb-1">
                Criticidade
              </Label>
              <Select
                name="criticality"
                value={formData.criticality}
                onValueChange={(value) => handleSelectChange("criticality", value)}
              >
                <SelectTrigger className="w-full shadow-sm">
                  <SelectValue placeholder="Selecione a criticidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="default">Não Aplicável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Link */}
            <div>
              <Label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                Link
              </Label>
              <Input
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className={cn("w-full shadow-sm", errors.link && "border-red-500")}
                placeholder="https://exemplo.com"
              />
              {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full shadow-sm"
              />
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <Label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </Label>
              <Textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                className="w-full shadow-sm"
              />
            </div>
          </div>

          <div className="border-t pt-6 mt-6 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Páginas do BI</h3>
            {formData.pages && formData.pages.length > 0 ? (
              <div className="space-y-3">
                {formData.pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{page.name}</p>
                      {page.status && <p className="text-sm text-gray-600">Status: {page.status}</p>}
                      {page.criticality && <p className="text-sm text-gray-600">Criticidade: {page.criticality}</p>}
                      {page.observations && <p className="text-sm text-gray-500">{page.observations}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPage(page)
                          setShowPageForm(true)
                        }}
                      >
                        Editar
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleDeletePage(page.id)}>
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma página adicionada.</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="mt-4 bg-transparent border-dashed border-gray-300 text-gray-600 hover:bg-gray-100"
              onClick={() => setShowPageForm(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Página
            </Button>
          </div>

          <DialogFooter className="mt-6 md:col-span-2 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar BI</Button>
          </DialogFooter>
        </form>

        {showPageForm && (
          <PageForm
            page={editingPage}
            onSave={editingPage ? handleEditPage : handleAddPage}
            onCancel={() => {
              setShowPageForm(false)
              setEditingPage(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BiForm

interface PageFormProps {
  page?: Page | null
  onSave: (page: Page | Omit<Page, "id">) => void
  onCancel: () => void
}

const PageForm: React.FC<PageFormProps> = ({ page, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Page | Omit<Page, "id">>(
    page || {
      name: "",
      status: "",
      criticality: "",
      observations: "",
    },
  )
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (page) {
      setFormData(page)
    } else {
      setFormData({
        name: "",
        status: "",
        criticality: "",
        observations: "",
      })
    }
    setErrors({})
  }, [page])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {page ? "Editar Página" : "Adicionar Nova Página"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Nome da Página */}
            <div className="md:col-span-2">
              <Label htmlFor="pageName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Página
              </Label>
              <Input
                id="pageName"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={cn("w-full shadow-sm", errors.name && "border-red-500")}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="pageStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className={cn("w-full shadow-sm", errors.status && "border-red-500")}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Selecione o status</SelectItem>
                  <SelectItem value="Atualizado">Atualizado</SelectItem>
                  <SelectItem value="Desatualizado">Desatualizado</SelectItem>
                  <SelectItem value="Em revisão">Em revisão</SelectItem>
                  <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                  <SelectItem value="Sem responsável">Sem responsável</SelectItem>
                  <SelectItem value="Sem permissão">Sem permissão</SelectItem>
                  <SelectItem value="Não encontrado">Não encontrado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>

            {/* Criticidade */}
            <div>
              <Label htmlFor="pageCriticality" className="block text-sm font-medium text-gray-700 mb-1">
                Criticidade
              </Label>
              <Select
                name="criticality"
                value={formData.criticality}
                onValueChange={(value) => handleSelectChange("criticality", value)}
              >
                <SelectTrigger className="w-full shadow-sm">
                  <SelectValue placeholder="Selecione a criticidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="default">Não Aplicável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <Label htmlFor="pageObservations" className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </Label>
              <Textarea
                id="pageObservations"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                className="w-full shadow-sm"
              />
            </div>
          </div>
          <DialogFooter className="mt-6 md:col-span-2 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Página</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
