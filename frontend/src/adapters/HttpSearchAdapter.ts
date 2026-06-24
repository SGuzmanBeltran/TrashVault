import type { SearchPort } from '@/ports'
import type { FileItem, Folder } from '@/domain/types'
import { apiFetchJSON } from '@/lib/api-fetch'

interface BackendFileItem {
  id: string
  name: string
  mimeType: string
  size: number
  folderId: string | null
  thumbnailKey: string | null
  createdAt: string
  trashedAt: string | null
  path: string
}

interface BackendFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  trashedAt: string | null
  path: string
}

function mapFile(item: BackendFileItem): FileItem {
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
    path: item.path,
  }
}

function mapFolder(item: BackendFolder): Folder {
  return {
    id: item.id,
    name: item.name,
    parentId: item.parentId,
    createdAt: new Date(item.createdAt).toISOString(),
    trashedAt: item.trashedAt ? new Date(item.trashedAt).toISOString() : null,
    path: item.path,
  }
}

export class HttpSearchAdapter implements SearchPort {
  async search(query: string): Promise<{ files: FileItem[]; folders: Folder[] }> {
    const params = new URLSearchParams({ q: query })
    const result = await apiFetchJSON<{ files: BackendFileItem[]; folders: BackendFolder[] }>(
      `/search?${params.toString()}`,
    )
    return {
      files: result.files.map(mapFile),
      folders: result.folders.map(mapFolder),
    }
  }
}
