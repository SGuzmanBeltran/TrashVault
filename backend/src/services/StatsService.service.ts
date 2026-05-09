import { db } from '../db/index';
import { files, folders } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface StatsData {
  totalFiles: number;
  totalFolders: number;
  usedBytes: number;
  maxBytes: number;
  recentFiles: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
    folderId: string | null;
    createdAt: number;
  }>;
}

export class StatsService {
  async getStats(userId: string): Promise<StatsData> {
    const [fileCount, folderCount, sizeResult, recent] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(files).where(eq(files.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(folders).where(eq(folders.userId, userId)),
      db.select({ total: sql<number>`coalesce(sum(${files.size}), 0)::bigint` }).from(files).where(eq(files.userId, userId)),
      db.select().from(files).where(eq(files.userId, userId)).orderBy(desc(files.createdAt)).limit(5),
    ]);

    return {
      totalFiles: fileCount[0].count,
      totalFolders: folderCount[0].count,
      usedBytes: sizeResult[0].total,
      maxBytes: 5 * 1024 * 1024 * 1024,
      recentFiles: recent,
    };
  }
}
