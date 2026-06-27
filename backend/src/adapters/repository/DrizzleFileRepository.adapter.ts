import { FileEntity, FileRepositoryPort, NewFile } from '../../ports/repository/FileRepository.port';
import { and, eq, isNotNull, isNull, ilike, inArray, lt, sql } from 'drizzle-orm';

import { db } from '../../db/index';
import { files } from '../../db/schema';

export class DrizzleFileRepositoryAdapter implements FileRepositoryPort {
  async create(data: NewFile): Promise<FileEntity> {
    const result = await db.insert(files).values(data).returning();
    return result[0];
  }

  async findById(id: string, userId: string): Promise<FileEntity | null> {
    const result = await db.select().from(files).where(
      and(eq(files.id, id), eq(files.userId, userId))
    );
    return result[0] || null;
  }

  async findByUserId(userId: string, folderId?: string | null): Promise<FileEntity[]> {
    if (folderId === undefined || folderId === null) {
      return db.select().from(files).where(
        and(eq(files.userId, userId), isNull(files.folderId), isNull(files.trashedAt))
      );
    }
    return db.select().from(files).where(
      and(eq(files.userId, userId), eq(files.folderId, folderId), isNull(files.trashedAt))
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await db.delete(files).where(
      and(eq(files.id, id), eq(files.userId, userId))
    );
  }

  async updateFolderId(id: string, userId: string, folderId: string | null): Promise<FileEntity | null> {
    const result = await db.update(files)
      .set({ folderId })
      .where(
        and(eq(files.id, id), eq(files.userId, userId), isNull(files.trashedAt)),
      )
      .returning();
    return result[0] || null;
  }

  async updateName(id: string, userId: string, name: string): Promise<FileEntity | null> {
    const result = await db.update(files)
      .set({ name })
      .where(
        and(eq(files.id, id), eq(files.userId, userId), isNull(files.trashedAt)),
      )
      .returning();
    return result[0] || null;
  }

  async updateContent(
    id: string,
    userId: string,
    data: { size: number; mimeType: string; thumbnailKey: string | null },
  ): Promise<FileEntity | null> {
    const result = await db.update(files)
      .set(data)
      .where(
        and(eq(files.id, id), eq(files.userId, userId), isNull(files.trashedAt)),
      )
      .returning();
    return result[0] || null;
  }

  async moveToTrash(id: string, userId: string): Promise<void> {
    await db.update(files).set({ trashedAt: new Date() }).where(
      and(eq(files.id, id), eq(files.userId, userId))
    );
  }

  async restoreFromTrash(id: string, userId: string): Promise<void> {
    await db.update(files).set({ trashedAt: null }).where(
      and(eq(files.id, id), eq(files.userId, userId))
    );
  }

  async findTrashedByUserId(userId: string): Promise<FileEntity[]> {
    return db.select().from(files).where(
      and(eq(files.userId, userId), isNotNull(files.trashedAt))
    );
  }

  async findActiveByFolderIds(userId: string, folderIds: string[]): Promise<FileEntity[]> {
    if (folderIds.length === 0) return [];

    return db.select().from(files).where(
      and(
        eq(files.userId, userId),
        inArray(files.folderId, folderIds),
        isNull(files.trashedAt),
      ),
    );
  }

  async searchByName(userId: string, query: string): Promise<FileEntity[]> {
    return db.select().from(files).where(
      and(
        eq(files.userId, userId),
        isNull(files.trashedAt),
        ilike(files.name, `%${query}%`),
      )
    );
  }

  async permanentDelete(id: string, userId: string): Promise<void> {
    await db.delete(files).where(
      and(eq(files.id, id), eq(files.userId, userId))
    );
  }

  async permanentDeleteMany(ids: string[], userId: string): Promise<void> {
    if (ids.length === 0) return;

    await db.delete(files).where(
      and(eq(files.userId, userId), inArray(files.id, ids)),
    );
  }

  async emptyTrash(userId: string): Promise<void> {
    await db.delete(files).where(
      and(eq(files.userId, userId), isNotNull(files.trashedAt))
    );
  }

  async findAll(createdBefore?: Date | null): Promise<FileEntity[]> {
    if (createdBefore) {
      return db.select().from(files).where(lt(files.createdAt, createdBefore));
    }
    return db.select().from(files);
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await db.delete(files).where(inArray(files.id, ids));
  }

  async getTotalStorageBytes(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`coalesce(sum(${files.size}), 0)::int` })
      .from(files);
    return result[0]?.total ?? 0;
  }
}