import type { FolderPort } from '@/ports'
import type { Folder } from '@/domain/types'
import { apiFetchJSON } from '@/lib/api-fetch'

interface BackendFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  trashedAt: string | null
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

export class HttpFolderAdapter implements FolderPort {
  async listFolders(parentId: string | null): Promise<Folder[]> {
    const query = parentId !== null ? `?parentId=${parentId}` : ''
    const items = await apiFetchJSON<BackendFolder[]>(`/folders${query}`)
    return items.map(mapFolder)
  }

  async getFolder(id: string): Promise<Folder> {
    const item = await apiFetchJSON<BackendFolder>(`/folders/${id}`)
    return mapFolder(item)
  }

  async createFolder(name: string, parentId: string | null): Promise<Folder> {
    const item = await apiFetchJSON<BackendFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    })
    return mapFolder(item)
  }

  async deleteFolder(id: string): Promise<void> {
    await apiFetchJSON(`/folders/${id}`, { method: 'DELETE' })
  }

  async moveFolder(id: string, parentId: string | null): Promise<Folder> {
    const item = await apiFetchJSON<BackendFolder>(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ parentId }),
    })
    return mapFolder(item)
  }
}
