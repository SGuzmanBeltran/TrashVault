import type { StatsPort } from '@/ports'
import type { StorageStats, StorageTier, StorageTierId } from '@/domain/types'
import { apiFetch, apiFetchJSON } from '@/lib/api-fetch'
import { mapFile, type BackendFileItem } from '@/adapters/mappers'

interface BackendStats {
  totalFiles: number
  totalFolders: number
  usedBytes: number
  maxBytes: number
  storageTier: StorageTierId
  recentFiles: BackendFileItem[]
}

function mapStats(data: BackendStats): StorageStats {
  return {
    totalFiles: Number(data.totalFiles),
    totalFolders: Number(data.totalFolders),
    usedBytes: Number(data.usedBytes),
    maxBytes: Number(data.maxBytes),
    storageTier: data.storageTier,
    recentFiles: data.recentFiles.map(mapFile),
  }
}

export class HttpStatsAdapter implements StatsPort {
  async getStats(): Promise<StorageStats> {
    const data = await apiFetch<BackendStats>('/stats')
    return mapStats(data)
  }

  async listStorageTiers(): Promise<StorageTier[]> {
    return apiFetch<StorageTier[]>('/stats/tiers')
  }

  async createStorageCheckout(tier: StorageTierId): Promise<{ checkoutUrl: string }> {
    return apiFetchJSON<{ checkoutUrl: string }>('/billing/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    })
  }
}
