import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index';
import { files, folders } from '../../db/schema';
import { user } from '../../db/auth-schema';
import {
  RecentFileSummary,
  StatsRepositoryPort,
} from '../../ports/repository/StatsRepository.port';

export class DrizzleStatsRepositoryAdapter implements StatsRepositoryPort {
  async countFilesByUserId(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(files)
      .where(eq(files.userId, userId));
    return result[0].count;
  }

  async countFoldersByUserId(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(folders)
      .where(eq(folders.userId, userId));
    return result[0].count;
  }

  async sumFileBytesByUserId(userId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`coalesce(sum(${files.size}), 0)::int` })
      .from(files)
      .where(eq(files.userId, userId));
    return result[0].total;
  }

  async findRecentFilesByUserId(userId: string, limit: number): Promise<RecentFileSummary[]> {
    return db
      .select({
        id: files.id,
        name: files.name,
        mimeType: files.mimeType,
        size: files.size,
        folderId: files.folderId,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt))
      .limit(limit);
  }

  async getUserStorageTier(userId: string): Promise<string | null> {
    const result = await db
      .select({ storageTier: user.storageTier })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return result[0]?.storageTier ?? null;
  }

  async updateUserStorageTier(userId: string, tierId: string): Promise<void> {
    await db.update(user).set({ storageTier: tierId }).where(eq(user.id, userId));
  }
}
