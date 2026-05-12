import type { TrashPort } from '@/ports'
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
}

interface BackendFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  trashedAt: string | null
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
  }
}

function mapFolder(item: BackendFolder): Folder {
  return {
    id: item.id,
    name: item.name,
    parentId: item.parentId,
    createdAt: new Date(item.createdAt).toISOString(),
    trashedAt: item.trashedAt ? new Date(item.trashedAt).toISOString() : null,
  }
}

export class HttpTrashAdapter implements TrashPort {
  async getTrash(): Promise<{ files: FileItem[]; folders: Folder[] }> {
    const data = await apiFetchJSON<{ files: BackendFileItem[]; folders: BackendFolder[] }>('/trash')
    return {
      files: data.files.map(mapFile),
      folders: data.folders.map(mapFolder),
    }
  }

  async restoreFile(id: string): Promise<void> {
    await apiFetchJSON(`/trash/files/${id}/restore`, { method: 'POST' })
  }

  async restoreFolder(id: string): Promise<void> {
    await apiFetchJSON(`/trash/folders/${id}/restore`, { method: 'POST' })
  }

  async permanentDeleteFile(id: string): Promise<void> {
    await apiFetchJSON(`/trash/files/${id}`, { method: 'DELETE' })
  }

  async permanentDeleteFolder(id: string): Promise<void> {
    await apiFetchJSON(`/trash/folders/${id}`, { method: 'DELETE' })
  }

  async emptyTrash(): Promise<void> {
    await apiFetchJSON('/trash', { method: 'DELETE' })
  }
}
