// utils/export-utils.ts

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
  pages?: Page[]
}

interface Area {
  id: number
  name: string
  description?: string
}

export const handleExport = (bis: BiItem[], areas: Area[]) => {
  const exportData = {
    bis: bis,
    areas: areas,
    exportDate: new Date().toISOString(),
    version: "1.0",
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

  const exportFileDefaultName = `bis_backup_${new Date().toISOString().split("T")[0]}.json`

  const linkElement = document.createElement("a")
  linkElement.setAttribute("href", dataUri)
  linkElement.setAttribute("download", exportFileDefaultName)
  linkElement.click()
}
