import type { TrashPort } from '@/ports'
import { apiFetchJSON } from '@/lib/api-fetch'
import { mapFile, mapFolder, type BackendFileItem, type BackendFolder } from '@/adapters/mappers'

export class HttpTrashAdapter implements TrashPort {
  async getTrash() {
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
