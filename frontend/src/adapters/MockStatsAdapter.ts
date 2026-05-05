import type { StatsPort } from '@/ports'
import type { StorageStats } from '@/domain/types'

const MOCK_DELAY = 400

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockStatsAdapter implements StatsPort {
  async getStats(): Promise<StorageStats> {
    await delay(MOCK_DELAY)
    return {
      totalFiles: 12,
      totalFolders: 4,
      usedBytes: 107_555_000,
      maxBytes: 5_368_709_120,
      recentFiles: [
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
          id: 'f9',
          name: 'presentation.pptx',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 5_600_000,
          folderId: null,
          createdAt: '2026-04-05T16:20:00Z',
          updatedAt: '2026-04-06T09:10:00Z',
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
      ],
    }
  }
}
