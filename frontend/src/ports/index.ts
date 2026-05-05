import type { FileItem, Folder, StorageStats } from '@/domain/types'

export interface FilePort {
  listFiles(folderId: string | null): Promise<FileItem[]>
  getFile(id: string): Promise<FileItem>
  deleteFile(id: string): Promise<void>
  getDownloadUrl(id: string): Promise<string>
}

export interface FolderPort {
  listFolders(parentId: string | null): Promise<Folder[]>
  getFolder(id: string): Promise<Folder>
  createFolder(name: string, parentId: string | null): Promise<Folder>
  deleteFolder(id: string): Promise<void>
}

export interface AuthPort {
  login(email: string, password: string): Promise<{ token: string }>
  logout(): Promise<void>
  getCurrentUser(): Promise<import('@/domain/types').User | null>
}

export interface StatsPort {
  getStats(): Promise<StorageStats>
}
