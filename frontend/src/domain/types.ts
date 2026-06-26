export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: string
}

export interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  folderId: string | null
  thumbnailKey: string | null
  createdAt: string
  updatedAt: string
  trashedAt: string | null
  path?: string
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  trashedAt: string | null
  path?: string
}

export interface StorageStats {
  totalFiles: number
  totalFolders: number
  usedBytes: number
  maxBytes: number
  recentFiles: FileItem[]
}

export type FileViewMode = 'grid' | 'list'
export type AccentColor = 'cyan' | 'violet' | 'orange' | 'emerald' | 'rose' | 'custom'
export type SortField = 'name' | 'size' | 'createdAt' | 'mimeType'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
}

export interface Breadcrumb {
  id: string | null
  name: string
}
