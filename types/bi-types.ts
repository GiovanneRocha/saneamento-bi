export interface Page {
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

export interface BiItem {
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

export interface Area {
  id: number
  name: string
  description?: string
}

export interface Stats {
  total: number
  updated: number
  outdated: number
  discontinued: number
  totalPages: number
  updatedPages: number
  outdatedPages: number
  noOwnerPages: number
  updatedPercentage: number
  outdatedPercentage: number
  discontinuedPercentage: number
}

export interface SaveData {
  id: string
  name: string
  description?: string
  createdAt: string
  bis: BiItem[]
  areas: Area[]
  stats: {
    total: number
    updated: number
    outdated: number
    discontinued: number
  }
}
