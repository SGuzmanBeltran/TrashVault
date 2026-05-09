import type { StatsPort } from '@/ports'
import type { StorageStats, FileItem } from '@/domain/types'
import { apiFetch } from '@/lib/api-fetch'

interface BackendFile {
  id: string
  name: string
  mimeType: string
  size: number
  folderId: string | null
  createdAt: string
}

interface BackendStats {
  totalFiles: number
  totalFolders: number
  usedBytes: number
  maxBytes: number
  recentFiles: BackendFile[]
}

function mapFile(item: BackendFile): FileItem {
  const createdAt = new Date(item.createdAt).toISOString()
  return {
    id: item.id,
    name: item.name,
    mimeType: item.mimeType,
    size: item.size,
    folderId: item.folderId,
    createdAt,
    updatedAt: createdAt,
  }
}

export class HttpStatsAdapter implements StatsPort {
  async getStats(): Promise<StorageStats> {
    const data = await apiFetch<BackendStats>('/stats')
    return {
      totalFiles: Number(data.totalFiles),
      totalFolders: Number(data.totalFolders),
      usedBytes: Number(data.usedBytes),
      maxBytes: Number(data.maxBytes),
      recentFiles: data.recentFiles.map(mapFile),
    }
  }
}
