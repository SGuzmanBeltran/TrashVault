import type { FilePort, UploadProgressCallbacks, UploadOptions } from '@/ports'
import type { FileApiPort, EncryptedUploadPayload } from '@/ports/http/FileApi.port'
import { encryptFile, decryptFile } from '@/lib/crypto'
import { generateThumbnail, canGenerateThumbnail } from '@/lib/thumbnail'

type DekProvider = () => CryptoKey | null

export class FileService implements FilePort {
  constructor(
    private fileApi: FileApiPort,
    private getDek: DekProvider,
  ) {}

  listFiles(folderId: string | null) {
    return this.fileApi.listFiles(folderId)
  }

  getFile(id: string) {
    return this.fileApi.getFile(id)
  }

  deleteFile(id: string) {
    return this.fileApi.deleteFile(id)
  }

  moveFile(id: string, folderId: string | null) {
    return this.fileApi.moveFile(id, folderId)
  }

  renameFile(id: string, name: string) {
    return this.fileApi.renameFile(id, name)
  }

  async downloadFile(id: string) {
    const meta = await this.fileApi.getFile(id)
    const dek = this.requireDek()
    const ciphertext = await this.fileApi.fetchFileBytes(id)
    const plaintext = await decryptFile(ciphertext, dek)
    const blob = new Blob([plaintext], { type: meta.mimeType })
    return { blobUrl: URL.createObjectURL(blob), filename: meta.name, mimeType: meta.mimeType }
  }

  async getThumbnailUrl(id: string): Promise<string | null> {
    const dek = this.getDek()
    if (!dek) return null

    try {
      const ciphertext = await this.fileApi.fetchThumbnailBytes(id)
      if (!ciphertext) return null
      const plaintext = await decryptFile(ciphertext, dek)
      const blob = new Blob([plaintext], { type: 'image/jpeg' })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.warn('Failed to decrypt thumbnail:', error)
      return null
    }
  }

  async uploadFile(file: File, folderId: string | null, options?: UploadOptions) {
    const payload = await this.buildEncryptedUploadPayload(file, folderId, options)
    return this.fileApi.upload(payload)
  }

  async uploadFileWithProgress(
    file: File,
    folderId: string | null,
    callbacks: UploadProgressCallbacks,
    options?: UploadOptions,
  ) {
    const payload = await this.buildEncryptedUploadPayload(file, folderId, options)
    return this.fileApi.uploadWithProgress(payload, callbacks)
  }

  private requireDek(): CryptoKey {
    const dek = this.getDek()
    if (!dek) throw new Error('Vault is locked')
    return dek
  }

  private async buildEncryptedUploadPayload(
    file: File,
    folderId: string | null,
    options?: UploadOptions,
  ): Promise<EncryptedUploadPayload> {
    const dek = this.requireDek()
    let encryptedThumbnail: File | undefined

    if (canGenerateThumbnail(file.type)) {
      try {
        const thumbnail = await generateThumbnail(file)
        if (thumbnail) {
          const thumbBuffer = await thumbnail.arrayBuffer()
          const encryptedThumb = await encryptFile(thumbBuffer, dek)
          encryptedThumbnail = new File([encryptedThumb], 'thumb.jpg', {
            type: 'application/octet-stream',
          })
        }
      } catch {
        /* best-effort */
      }
    }

    const plaintext = await file.arrayBuffer()
    const ciphertext = await encryptFile(plaintext, dek)
    const encryptedBlob = new Blob([ciphertext], { type: file.type })
    const encryptedFile = new File([encryptedBlob], file.name, { type: file.type })

    return {
      encryptedFile,
      encryptedThumbnail,
      folderId,
      replaceFileId: options?.replaceFileId,
    }
  }
}
