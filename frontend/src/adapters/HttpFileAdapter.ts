import type { FilePort } from '@/ports'
import type { FileItem } from '@/domain/types'
import { apiFetch } from '@/lib/api-fetch'

interface BackendFileItem {
  id: string
  name: string
  mimeType: string
  size: number
  folderId: string | null
  createdAt: number
}

function mapFile(item: BackendFileItem): FileItem {
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

export class HttpFileAdapter implements FilePort {
  async listFiles(folderId: string | null): Promise<FileItem[]> {
    const query = folderId !== null ? `?folderId=${folderId}` : ''
    const items = await apiFetch<BackendFileItem[]>(`/files${query}`)
    return items.map(mapFile)
  }

  async getFile(id: string): Promise<FileItem> {
    const item = await apiFetch<BackendFileItem>(`/files/${id}`)
    return mapFile(item)
  }

  async deleteFile(id: string): Promise<void> {
    await apiFetch(`/files/${id}`, { method: 'DELETE' })
  }

  async getDownloadUrl(id: string): Promise<string> {
    const { url } = await apiFetch<{ url: string }>(`/files/${id}/download`)
    return url
  }

  async uploadFile(file: File, folderId: string | null): Promise<FileItem> {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId !== null) {
      formData.append('folderId', folderId)
    }

    const item = await apiFetch<BackendFileItem>('/files/upload', {
      method: 'POST',
      body: formData,
    })

    return mapFile(item)
  }
}
