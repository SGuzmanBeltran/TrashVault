import { wrapRepositoryError, ServiceError } from '../errors';
import type { StatsRepositoryPort } from '../ports/repository/StatsRepository.port';
import {
  getStorageTier,
  listUpgradeableTiers,
  type StorageTier,
  type StorageTierId,
} from '../lib/storageTiers';

export interface StatsData {
  totalFiles: number;
  totalFolders: number;
  usedBytes: number;
  maxBytes: number;
  storageTier: StorageTierId;
  recentFiles: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
    folderId: string | null;
    createdAt: Date;
  }>;
}

export class StatsService {
  constructor(private statsRepository: StatsRepositoryPort) {}

  async getStats(userId: string): Promise<StatsData> {
    try {
      const [totalFiles, totalFolders, usedBytes, recentFiles, storageTierRaw] = await Promise.all([
        this.statsRepository.countFilesByUserId(userId),
        this.statsRepository.countFoldersByUserId(userId),
        this.statsRepository.sumFileBytesByUserId(userId),
        this.statsRepository.findRecentFilesByUserId(userId, 5),
        this.statsRepository.getUserStorageTier(userId),
      ]);

      const storageTier = getStorageTier(storageTierRaw ?? 'free');

      return {
        totalFiles,
        totalFolders,
        usedBytes,
        maxBytes: storageTier.maxBytes,
        storageTier: storageTier.id,
        recentFiles,
      };
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  listStorageTiers(): StorageTier[] {
    return listUpgradeableTiers();
  }

  async upgradeStorage(userId: string, tierId: StorageTierId): Promise<StatsData> {
    const nextTier = getStorageTier(tierId);
    if (nextTier.id === 'free') {
      throw new ServiceError(400, 'Choose a paid storage plan to upgrade.');
    }

    try {
      const currentTierRaw = await this.statsRepository.getUserStorageTier(userId);
      const currentTier = getStorageTier(currentTierRaw ?? 'free');

      if (nextTier.id === currentTier.id) {
        return this.getStats(userId);
      }
      if (nextTier.maxBytes <= currentTier.maxBytes) {
        throw new ServiceError(400, 'You can only upgrade to a larger plan.');
      }

      await this.statsRepository.updateUserStorageTier(userId, nextTier.id);
      return this.getStats(userId);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw wrapRepositoryError(error);
    }
  }
}
