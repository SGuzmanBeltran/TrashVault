import type { FileApiPort, EncryptedUploadPayload } from '@/ports/http/FileApi.port'
import type { UploadProgressCallbacks } from '@/ports'
import { apiFetch, apiFetchJSON } from '@/lib/api-fetch'
import { uploadWithProgress } from '@/lib/xhr-upload'
import { mapFile, type BackendFileItem } from '@/adapters/mappers'

function buildUploadFormData(payload: EncryptedUploadPayload): FormData {
  const formData = new FormData()
  formData.append('file', payload.encryptedFile)
  if (payload.folderId !== null) {
    formData.append('folderId', payload.folderId)
  }
  if (payload.encryptedThumbnail) {
    formData.append('thumbnail', payload.encryptedThumbnail)
  }
  if (payload.replaceFileId) {
    formData.append('replaceFileId', payload.replaceFileId)
  }
  return formData
}

export class HttpFileAdapter implements FileApiPort {
  async listFiles(folderId: string | null) {
    const query = folderId !== null ? `?folderId=${folderId}` : ''
    const items = await apiFetch<BackendFileItem[]>(`/files${query}`)
    return items.map(mapFile)
  }

  async getFile(id: string) {
    const item = await apiFetch<BackendFileItem>(`/files/${id}`)
    return mapFile(item)
  }

  async deleteFile(id: string): Promise<void> {
    await apiFetch(`/files/${id}`, { method: 'DELETE' })
  }

  async moveFile(id: string, folderId: string | null) {
    const item = await apiFetchJSON<BackendFileItem>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ folderId }),
    })
    return mapFile(item)
  }

  async renameFile(id: string, name: string) {
    const item = await apiFetchJSON<BackendFileItem>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
    return mapFile(item)
  }

  async fetchFileBytes(id: string): Promise<ArrayBuffer> {
    const resp = await fetch(`/api/files/${id}/bytes`, { credentials: 'include' })
    if (!resp.ok) throw new Error('Failed to download file')
    return resp.arrayBuffer()
  }

  async fetchThumbnailBytes(id: string): Promise<ArrayBuffer | null> {
    const resp = await fetch(`/api/files/${id}/thumbnail`, { credentials: 'include' })
    if (!resp.ok) return null
    return resp.arrayBuffer()
  }

  async upload(payload: EncryptedUploadPayload) {
    const item = await apiFetch<BackendFileItem>('/files/upload', {
      method: 'POST',
      body: buildUploadFormData(payload),
    })
    return mapFile(item)
  }

  async uploadWithProgress(payload: EncryptedUploadPayload, callbacks: UploadProgressCallbacks) {
    const item = await uploadWithProgress(
      payload.encryptedFile,
      payload.folderId,
      callbacks,
      payload.encryptedThumbnail,
      payload.replaceFileId ? { replaceFileId: payload.replaceFileId } : undefined,
    )
    return mapFile(item)
  }
}
