// utils/export-utils.ts
import * as XLSX from "xlsx"

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
  description?: string
  link?: string
  pages?: Page[]
}

interface Area {
  id: number
  name: string
  description?: string
}

export const handleExport = (bis: BiItem[], areas: Area[]) => {
  const workbook = XLSX.utils.book_new()

  // Criar planilha de BIs
  const bisData = bis.map((bi) => ({
    ID: bi.id,
    Nome: bi.name,
    Responsável: bi.owner,
    Área: bi.area.join(", "),
    Status: bi.status,
    "Última Atualização": bi.lastUpdate,
    Observações: bi.observations,
    Uso: bi.usage,
    Criticidade: bi.criticality,
    Descrição: bi.description || "",
    Link: bi.link || "",
  }))
  const bisSheet = XLSX.utils.json_to_sheet(bisData)
  XLSX.utils.book_append_sheet(workbook, bisSheet, "BIs")

  // Criar planilha de Áreas
  const areasData = areas.map((area) => ({
    ID: area.id,
    Nome: area.name,
    Descrição: area.description || "",
  }))
  const areasSheet = XLSX.utils.json_to_sheet(areasData)
  XLSX.utils.book_append_sheet(workbook, areasSheet, "Áreas")

  // Criar planilha de Metadados
  const metaData = [
    {
      "Data de Exportação": new Date().toLocaleString("pt-BR"),
      "Total de BIs": bis.length,
      "Total de Áreas": areas.length,
      Versão: "1.0",
    },
  ]
  const metaSheet = XLSX.utils.json_to_sheet(metaData)
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Metadados")

  // Exportar arquivo Excel
  const fileName = `bis_backup_${new Date().toISOString().split("T")[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
