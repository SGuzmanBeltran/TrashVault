import type { FileItem } from '@/domain/types'
import type { UploadProgressCallbacks } from '@/ports'

export interface EncryptedUploadPayload {
  encryptedFile: File
  encryptedThumbnail?: File
  folderId: string | null
  replaceFileId?: string
}

export interface FileApiPort {
  listFiles(folderId: string | null): Promise<FileItem[]>
  getFile(id: string): Promise<FileItem>
  deleteFile(id: string): Promise<void>
  moveFile(id: string, folderId: string | null): Promise<FileItem>
  renameFile(id: string, name: string): Promise<FileItem>
  fetchFileBytes(id: string): Promise<ArrayBuffer>
  fetchThumbnailBytes(id: string): Promise<ArrayBuffer | null>
  upload(payload: EncryptedUploadPayload): Promise<FileItem>
  uploadWithProgress(
    payload: EncryptedUploadPayload,
    callbacks: UploadProgressCallbacks,
  ): Promise<FileItem>
}
