import type { FolderPort } from '@/ports'
import type { Folder } from '@/domain/types'

const MOCK_DELAY = 500

const MOCK_FOLDERS: Folder[] = [
  {
    id: 'folder-1',
    name: 'Work',
    parentId: null,
    createdAt: '2026-03-01T10:00:00Z',
    fileCount: 3,
    size: 3_465_000,
  },
  {
    id: 'folder-2',
    name: 'Design Assets',
    parentId: null,
    createdAt: '2026-03-10T14:00:00Z',
    fileCount: 3,
    size: 17_345_000,
  },
  {
    id: 'folder-3',
    name: 'Backups',
    parentId: null,
    createdAt: '2026-02-15T08:00:00Z',
    fileCount: 1,
    size: 34_500_000,
  },
  {
    id: 'folder-4',
    name: 'Archive',
    parentId: 'folder-1',
    createdAt: '2026-04-01T10:00:00Z',
    fileCount: 0,
    size: 0,
  },
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockFolderAdapter implements FolderPort {
  private folders = [...MOCK_FOLDERS]

  async listFolders(parentId: string | null): Promise<Folder[]> {
    await delay(MOCK_DELAY)
    return this.folders.filter((f) => f.parentId === parentId)
  }

  async getFolder(id: string): Promise<Folder> {
    await delay(MOCK_DELAY / 2)
    const folder = this.folders.find((f) => f.id === id)
    if (!folder) throw new Error('Folder not found')
    return folder
  }

  async createFolder(name: string, parentId: string | null): Promise<Folder> {
    await delay(MOCK_DELAY)
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
      createdAt: new Date().toISOString(),
      fileCount: 0,
      size: 0,
    }
    this.folders.push(newFolder)
    return newFolder
  }

  async deleteFolder(id: string): Promise<void> {
    await delay(MOCK_DELAY)
    this.folders = this.folders.filter((f) => f.id !== id)
  }
}
