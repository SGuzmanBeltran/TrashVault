import { db } from '../db/index';
import { files, folders } from '../db/schema';
import { user } from '../db/auth-schema';
import { eq, desc, sql } from 'drizzle-orm';
import { wrapRepositoryError, ServiceError } from '../errors';
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
  async getStats(userId: string): Promise<StatsData> {
    try {
      const [fileCount, folderCount, sizeResult, recent, userRow] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(files).where(eq(files.userId, userId)),
        db.select({ count: sql<number>`count(*)::int` }).from(folders).where(eq(folders.userId, userId)),
        db.select({ total: sql<number>`coalesce(sum(${files.size}), 0)` }).from(files).where(eq(files.userId, userId)),
        db.select().from(files).where(eq(files.userId, userId)).orderBy(desc(files.createdAt)).limit(5),
        db.select({ storageTier: user.storageTier }).from(user).where(eq(user.id, userId)).limit(1),
      ]);

      const storageTier = getStorageTier(userRow[0]?.storageTier ?? 'free');

      return {
        totalFiles: fileCount[0].count,
        totalFolders: folderCount[0].count,
        usedBytes: sizeResult[0].total,
        maxBytes: storageTier.maxBytes,
        storageTier: storageTier.id,
        recentFiles: recent,
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
      const [userRow] = await db
        .select({ storageTier: user.storageTier })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      const currentTier = getStorageTier(userRow?.storageTier ?? 'free');
      if (nextTier.maxBytes <= currentTier.maxBytes) {
        throw new ServiceError(400, 'You can only upgrade to a larger plan.');
      }

      await db
        .update(user)
        .set({ storageTier: nextTier.id })
        .where(eq(user.id, userId));

      return this.getStats(userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }
}
