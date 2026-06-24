import type { FilePort, UploadProgressCallbacks } from '@/ports'
import type { FileItem } from '@/domain/types'
import { apiFetch, apiFetchJSON } from '@/lib/api-fetch'
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

  async moveFile(id: string, folderId: string | null): Promise<FileItem> {
    const item = await apiFetchJSON<BackendFileItem>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ folderId }),
    })
    return mapFile(item)
  }

  async downloadFile(id: string): Promise<{ blobUrl: string; filename: string; mimeType: string }> {
    const meta = await apiFetch<BackendFileItem>(`/files/${id}`)
    const vaultStore = useVaultStore()
    if (!vaultStore.dek) throw new Error('Vault is locked')

    const resp = await fetch(`/api/files/${id}/bytes`, { credentials: 'include' })
    if (!resp.ok) throw new Error('Failed to download file')
    const ciphertext = await resp.arrayBuffer()
    const plaintext = await decryptFile(ciphertext, vaultStore.dek)
    const blob = new Blob([plaintext], { type: meta.mimeType })
    return { blobUrl: URL.createObjectURL(blob), filename: meta.name, mimeType: meta.mimeType }
  }

  async getThumbnailUrl(id: string): Promise<string | null> {
    const vaultStore = useVaultStore()
    if (!vaultStore.dek) return null

    try {
      const resp = await fetch(`/api/files/${id}/thumbnail`, { credentials: 'include' })
      if (!resp.ok) return null
      const ciphertext = await resp.arrayBuffer()
      const plaintext = await decryptFile(ciphertext, vaultStore.dek)
      const blob = new Blob([plaintext], { type: 'image/jpeg' })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.warn('Failed to decrypt thumbnail:', error)
      return null
    }
  }

  async uploadFile(file: File, folderId: string | null): Promise<FileItem> {
    const vaultStore = useVaultStore()
    if (!vaultStore.dek) throw new Error('Vault is locked')

    let encryptedThumbnail: Blob | null = null
    if (canGenerateThumbnail(file.type)) {
      try {
        const thumbnail = await generateThumbnail(file)
        if (thumbnail) {
          const thumbBuffer = await thumbnail.arrayBuffer()
          const encryptedThumb = await encryptFile(thumbBuffer, vaultStore.dek)
          encryptedThumbnail = new Blob([encryptedThumb])
        }
      } catch { /* best-effort */ }
    }

    const plaintext = await file.arrayBuffer()
    const ciphertext = await encryptFile(plaintext, vaultStore.dek)
    const encryptedBlob = new Blob([ciphertext], { type: file.type })
    const encryptedFile = new File([encryptedBlob], file.name, { type: file.type })

    const formData = new FormData()
    formData.append('file', encryptedFile)
    if (folderId !== null) {
      formData.append('folderId', folderId)
    }
    if (encryptedThumbnail) {
      formData.append('thumbnail', new File([encryptedThumbnail], 'thumb.jpg', { type: 'application/octet-stream' }))
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

    let encryptedThumbnail: Blob | null = null
    if (canGenerateThumbnail(file.type)) {
      try {
        const thumbnail = await generateThumbnail(file)
        if (thumbnail) {
          const thumbBuffer = await thumbnail.arrayBuffer()
          const encryptedThumb = await encryptFile(thumbBuffer, vaultStore.dek)
          encryptedThumbnail = new Blob([encryptedThumb])
        }
      } catch { /* best-effort */ }
    }

    const plaintext = await file.arrayBuffer()
    const ciphertext = await encryptFile(plaintext, vaultStore.dek)
    const encryptedBlob = new Blob([ciphertext], { type: file.type })
    const encryptedFile = new File([encryptedBlob], file.name, { type: file.type })

    const thumbFile = encryptedThumbnail
      ? new File([encryptedThumbnail], 'thumb.jpg', { type: 'application/octet-stream' })
      : undefined
    const item = await uploadWithProgress(encryptedFile, folderId, callbacks, thumbFile)
    return mapFile(item)
  }
}
