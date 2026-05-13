import type { FilePort, UploadProgressCallbacks } from '@/ports'
import type { FileItem } from '@/domain/types'
import { apiFetch } from '@/lib/api-fetch'
import { uploadWithProgress } from '@/lib/xhr-upload'
import { encryptFile, decryptFile } from '@/lib/crypto'
import { generateThumbnail, canGenerateThumbnail } from '@/lib/thumbnail'
import { useVaultStore } from '@/stores/vault'

interface BackendFileItem {
  id: string
  name: string
  mimeType: string
  size: number
  folderId: string | null
  thumbnailKey: string | null
  isEncrypted: boolean
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

  async downloadFile(id: string): Promise<{ blobUrl: string; filename: string; mimeType: string }> {
    const meta = await apiFetch<BackendFileItem>(`/files/${id}`)

    const vaultStore = useVaultStore()
    if (meta.isEncrypted && vaultStore.dek) {
      const resp = await fetch(`/api/files/${id}/bytes`, { credentials: 'include' })
      if (!resp.ok) throw new Error('Failed to download file')
      const ciphertext = await resp.arrayBuffer()
      const plaintext = await decryptFile(ciphertext, vaultStore.dek)
      const blob = new Blob([plaintext], { type: meta.mimeType })
      return { blobUrl: URL.createObjectURL(blob), filename: meta.name, mimeType: meta.mimeType }
    }

    const { url } = await apiFetch<{ url: string }>(`/files/${id}/download`)
    return { blobUrl: url, filename: meta.name, mimeType: meta.mimeType }
  }

  async getThumbnailUrl(id: string): Promise<string | null> {
    try {
      const { url } = await apiFetch<{ url: string }>(`/files/${id}/thumbnail`)
      return url
    } catch {
      return null
    }
  }

  async uploadFile(file: File, folderId: string | null): Promise<FileItem> {
    const vaultStore = useVaultStore()
    if (!vaultStore.dek) throw new Error('Vault is locked')

    let thumbnail: Blob | null = null
    if (canGenerateThumbnail(file.type)) {
      try { thumbnail = await generateThumbnail(file) } catch { /* best-effort */ }
    }

    const plaintext = await file.arrayBuffer()
    const ciphertext = await encryptFile(plaintext, vaultStore.dek)
    const encryptedBlob = new Blob([ciphertext], { type: file.type })
    const encryptedFile = new File([encryptedBlob], file.name, { type: file.type })

    const formData = new FormData()
    formData.append('file', encryptedFile)
    formData.append('isEncrypted', 'true')
    if (folderId !== null) {
      formData.append('folderId', folderId)
    }
    if (thumbnail) {
      formData.append('thumbnail', new File([thumbnail], 'thumb.jpg', { type: 'image/jpeg' }))
    }

    const item = await apiFetch<BackendFileItem>('/files/upload', {
      method: 'POST',
      body: formData,
    })
    return mapFile(item)
  }

  async uploadFileWithProgress(
    file: File,
    folderId: string | null,
    callbacks: UploadProgressCallbacks,
  ): Promise<FileItem> {
    const vaultStore = useVaultStore()
    if (!vaultStore.dek) throw new Error('Vault is locked')

    let thumbnail: Blob | null = null
    if (canGenerateThumbnail(file.type)) {
      try { thumbnail = await generateThumbnail(file) } catch { /* best-effort */ }
    }

    const plaintext = await file.arrayBuffer()
    const ciphertext = await encryptFile(plaintext, vaultStore.dek)
    const encryptedBlob = new Blob([ciphertext], { type: file.type })
    const encryptedFile = new File([encryptedBlob], file.name, { type: file.type })

    const thumbFile = thumbnail ? new File([thumbnail], 'thumb.jpg', { type: 'image/jpeg' }) : undefined
    const item = await uploadWithProgress(encryptedFile, folderId, callbacks, true, thumbFile)
    return mapFile(item)
  }
}
