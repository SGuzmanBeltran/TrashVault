import type { FilePort } from '@/ports'
import type { FileItem } from '@/domain/types'

const MOCK_DELAY = 600

const MOCK_FILES: FileItem[] = [
  {
    id: 'f1',
    name: 'project-proposal.pdf',
    mimeType: 'application/pdf',
    size: 2_450_000,
    folderId: null,
    createdAt: '2026-04-28T10:30:00Z',
    updatedAt: '2026-04-28T10:30:00Z',
  },
  {
    id: 'f2',
    name: 'vacation-photo.jpg',
    mimeType: 'image/jpeg',
    size: 4_800_000,
    folderId: null,
    createdAt: '2026-04-25T14:20:00Z',
    updatedAt: '2026-04-25T14:20:00Z',
  },
  {
    id: 'f3',
    name: 'quarterly-report.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 890_000,
    folderId: 'folder-1',
    createdAt: '2026-04-20T09:15:00Z',
    updatedAt: '2026-04-22T16:45:00Z',
  },
  {
    id: 'f4',
    name: 'meeting-notes.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 125_000,
    folderId: 'folder-1',
    createdAt: '2026-04-18T11:00:00Z',
    updatedAt: '2026-04-18T11:00:00Z',
  },
  {
    id: 'f5',
    name: 'brand-guidelines.pdf',
    mimeType: 'application/pdf',
    size: 15_200_000,
    folderId: 'folder-2',
    createdAt: '2026-04-15T08:00:00Z',
    updatedAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 'f6',
    name: 'logo-final.svg',
    mimeType: 'image/svg+xml',
    size: 45_000,
    folderId: 'folder-2',
    createdAt: '2026-04-14T17:30:00Z',
    updatedAt: '2026-04-14T17:30:00Z',
  },
  {
    id: 'f7',
    name: 'demo-video.mp4',
    mimeType: 'video/mp4',
    size: 128_000_000,
    folderId: null,
    createdAt: '2026-04-10T13:00:00Z',
    updatedAt: '2026-04-10T13:00:00Z',
  },
  {
    id: 'f8',
    name: 'database-backup.sql',
    mimeType: 'application/sql',
    size: 34_500_000,
    folderId: 'folder-3',
    createdAt: '2026-04-08T02:00:00Z',
    updatedAt: '2026-04-08T02:00:00Z',
  },
  {
    id: 'f9',
    name: 'presentation.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 5_600_000,
    folderId: null,
    createdAt: '2026-04-05T16:20:00Z',
    updatedAt: '2026-04-06T09:10:00Z',
  },
  {
    id: 'f10',
    name: 'contract-scan.pdf',
    mimeType: 'application/pdf',
    size: 1_200_000,
    folderId: 'folder-1',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'f11',
    name: 'app-screenshot.png',
    mimeType: 'image/png',
    size: 2_100_000,
    folderId: 'folder-2',
    createdAt: '2026-03-28T15:45:00Z',
    updatedAt: '2026-03-28T15:45:00Z',
  },
  {
    id: 'f12',
    name: 'song-idea.mp3',
    mimeType: 'audio/mpeg',
    size: 8_900_000,
    folderId: null,
    createdAt: '2026-03-25T20:30:00Z',
    updatedAt: '2026-03-25T20:30:00Z',
  },
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockFileAdapter implements FilePort {
  private files = [...MOCK_FILES]

  async listFiles(folderId: string | null): Promise<FileItem[]> {
    await delay(MOCK_DELAY)
    return this.files.filter((f) => f.folderId === folderId)
  }

  async getFile(id: string): Promise<FileItem> {
    await delay(MOCK_DELAY / 2)
    const file = this.files.find((f) => f.id === id)
    if (!file) throw new Error('File not found')
    return file
  }

  async deleteFile(id: string): Promise<void> {
    await delay(MOCK_DELAY)
    this.files = this.files.filter((f) => f.id !== id)
  }

  async getDownloadUrl(_id: string): Promise<string> {
    await delay(MOCK_DELAY / 3)
    return 'https://example.com/download/mock-url'
  }
}
