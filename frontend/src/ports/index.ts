import type { FileItem, Folder, StorageStats } from '@/domain/types'

export interface UploadProgressCallbacks {
  onProgress: (progress: number) => void
  signal?: AbortSignal
}

export interface UploadOptions {
  replaceFileId?: string
}

export interface FilePort {
  listFiles(folderId: string | null): Promise<FileItem[]>
  getFile(id: string): Promise<FileItem>
  deleteFile(id: string): Promise<void>
  moveFile(id: string, folderId: string | null): Promise<FileItem>
  renameFile(id: string, name: string): Promise<FileItem>
  downloadFile(id: string): Promise<{ blobUrl: string; filename: string; mimeType: string }>
  getThumbnailUrl(id: string): Promise<string | null>
  uploadFile(file: File, folderId: string | null, options?: UploadOptions): Promise<FileItem>
  uploadFileWithProgress(
    file: File,
    folderId: string | null,
    callbacks: UploadProgressCallbacks,
    options?: UploadOptions,
  ): Promise<FileItem>
}

export interface FolderPort {
  listFolders(parentId: string | null): Promise<Folder[]>
  getFolder(id: string): Promise<Folder>
  createFolder(name: string, parentId: string | null): Promise<Folder>
  deleteFolder(id: string): Promise<void>
  moveFolder(id: string, parentId: string | null): Promise<Folder>
  renameFolder(id: string, name: string): Promise<Folder>
  downloadFolder(id: string): Promise<{ blobUrl: string; filename: string }>
}

export interface AuthPort {
  login(email: string, password: string): Promise<void>
  register(email: string, password: string, name: string): Promise<void>
  logout(): Promise<void>
  changePassword(oldPassword: string, newPassword: string): Promise<void>
  getCurrentUser(): Promise<import('@/domain/types').User | null>
}

export interface StatsPort {
  getStats(): Promise<StorageStats>
}

export interface TrashPort {
  getTrash(): Promise<{ files: FileItem[]; folders: Folder[] }>
  restoreFile(id: string): Promise<void>
  restoreFolder(id: string): Promise<void>
  permanentDeleteFile(id: string): Promise<void>
  permanentDeleteFolder(id: string): Promise<void>
  emptyTrash(): Promise<void>
}

export interface EncryptionKeyData {
  userId: string
  encryptedDek: string
  dekIv: string
  dekSalt: string
  kdfAlgorithm: string
  kdfParams: string
  createdAt: string
  updatedAt: string
}

export interface EncryptionPort {
  getKey(): Promise<EncryptionKeyData>
  createKey(params: {
    encryptedDek: string
    dekIv: string
    dekSalt: string
    kdfAlgorithm: string
    kdfParams: string
  }): Promise<EncryptionKeyData>
  updateKey(params: {
    encryptedDek: string
    dekIv: string
    dekSalt: string
    kdfAlgorithm: string
    kdfParams: string
  }): Promise<EncryptionKeyData>
}

export interface SearchPort {
  search(query: string): Promise<{ files: FileItem[]; folders: Folder[] }>
}
