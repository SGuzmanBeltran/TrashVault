import type { Folder } from '@/domain/types'

export interface FolderApiPort {
  listFolders(parentId: string | null): Promise<Folder[]>
  getFolder(id: string): Promise<Folder>
  createFolder(name: string, parentId: string | null): Promise<Folder>
  deleteFolder(id: string): Promise<void>
  moveFolder(id: string, parentId: string | null): Promise<Folder>
  renameFolder(id: string, name: string): Promise<Folder>
  fetchFolderZipBytes(id: string): Promise<ArrayBuffer>
}
