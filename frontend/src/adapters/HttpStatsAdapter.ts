import type { StatsPort } from '@/ports'
import type { StorageStats, FileItem } from '@/domain/types'
import { apiFetch } from '@/lib/api-fetch'

interface BackendFile {
  id: string
  name: string
  mimeType: string
  size: number
  folderId: string | null
  thumbnailKey: string | null
  createdAt: string
  trashedAt: string | null
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
    thumbnailKey: item.thumbnailKey ?? null,
    createdAt,
    updatedAt: createdAt,
    trashedAt: item.trashedAt ? new Date(item.trashedAt).toISOString() : null,
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
