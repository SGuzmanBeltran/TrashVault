import type { FolderApiPort } from '@/ports/http/FolderApi.port'
import { apiFetchJSON } from '@/lib/api-fetch'
import { mapFolder, type BackendFolder } from '@/adapters/mappers'

export class HttpFolderAdapter implements FolderApiPort {
  async listFolders(parentId: string | null) {
    const query = parentId !== null ? `?parentId=${parentId}` : ''
    const items = await apiFetchJSON<BackendFolder[]>(`/folders${query}`)
    return items.map(mapFolder)
  }

  async getFolder(id: string) {
    const item = await apiFetchJSON<BackendFolder>(`/folders/${id}`)
    return mapFolder(item)
  }

  async createFolder(name: string, parentId: string | null) {
    const item = await apiFetchJSON<BackendFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    })
    return mapFolder(item)
  }

  async deleteFolder(id: string): Promise<void> {
    await apiFetchJSON(`/folders/${id}`, { method: 'DELETE' })
  }

  async moveFolder(id: string, parentId: string | null) {
    const item = await apiFetchJSON<BackendFolder>(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ parentId }),
    })
    return mapFolder(item)
  }

  async renameFolder(id: string, name: string) {
    const item = await apiFetchJSON<BackendFolder>(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
    return mapFolder(item)
  }

  async fetchFolderZipBytes(id: string): Promise<ArrayBuffer> {
    const resp = await fetch(`/api/folders/${id}/download`, { credentials: 'include' })
    if (!resp.ok) throw new Error('Failed to download folder')
    return resp.arrayBuffer()
  }
}
