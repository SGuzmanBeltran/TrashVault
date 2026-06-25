import { FolderEntity, FolderRepositoryPort, NewFolder } from '../../ports/repository/FolderRepository.port';
import { and, eq, isNotNull, isNull, ilike, inArray } from 'drizzle-orm';

import { db } from '../../db/index';
import { folders } from '../../db/schema';

export class DrizzleFolderRepositoryAdapter implements FolderRepositoryPort {
  async create(data: NewFolder): Promise<FolderEntity> {
    const result = await db.insert(folders).values(data).returning();
    return result[0];
  }

  async findById(id: string, userId: string): Promise<FolderEntity | null> {
    const result = await db.select().from(folders).where(
      and(eq(folders.id, id), eq(folders.userId, userId))
    );
    return result[0] || null;
  }

  async findByUserId(userId: string, parentId?: string | null): Promise<FolderEntity[]> {
    if (parentId === undefined || parentId === null) {
      return db.select().from(folders).where(
        and(eq(folders.userId, userId), isNull(folders.parentId), isNull(folders.trashedAt))
      );
    }
    return db.select().from(folders).where(
      and(eq(folders.userId, userId), eq(folders.parentId, parentId), isNull(folders.trashedAt))
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await db.delete(folders).where(
      and(eq(folders.id, id), eq(folders.userId, userId))
    );
  }

  async updateParentId(id: string, userId: string, parentId: string | null): Promise<FolderEntity | null> {
    const result = await db.update(folders)
      .set({ parentId })
      .where(
        and(eq(folders.id, id), eq(folders.userId, userId), isNull(folders.trashedAt)),
      )
      .returning();
    return result[0] || null;
  }

  async updateName(id: string, userId: string, name: string): Promise<FolderEntity | null> {
    const result = await db.update(folders)
      .set({ name })
      .where(
        and(eq(folders.id, id), eq(folders.userId, userId), isNull(folders.trashedAt)),
      )
      .returning();
    return result[0] || null;
  }

  async moveToTrash(id: string, userId: string): Promise<void> {
    await db.update(folders).set({ trashedAt: new Date() }).where(
      and(eq(folders.id, id), eq(folders.userId, userId))
    );
  }

  async restoreFromTrash(id: string, userId: string): Promise<void> {
    await db.update(folders).set({ trashedAt: null }).where(
      and(eq(folders.id, id), eq(folders.userId, userId))
    );
  }

  async findTrashedByUserId(userId: string): Promise<FolderEntity[]> {
    return db.select().from(folders).where(
      and(eq(folders.userId, userId), isNotNull(folders.trashedAt))
    );
  }

  async findAllActiveByUserId(userId: string): Promise<FolderEntity[]> {
    return db.select().from(folders).where(
      and(eq(folders.userId, userId), isNull(folders.trashedAt))
    );
  }

  async searchByName(userId: string, query: string): Promise<FolderEntity[]> {
    return db.select().from(folders).where(
      and(
        eq(folders.userId, userId),
        isNull(folders.trashedAt),
        ilike(folders.name, `%${query}%`),
      )
    );
  }

  async permanentDelete(id: string, userId: string): Promise<void> {
    await db.delete(folders).where(
      and(eq(folders.id, id), eq(folders.userId, userId))
    );
  }

  async permanentDeleteMany(ids: string[], userId: string): Promise<void> {
    if (ids.length === 0) return;

    await db.delete(folders).where(
      and(eq(folders.userId, userId), inArray(folders.id, ids)),
    );
  }

  async restoreManyFromTrash(ids: string[], userId: string): Promise<void> {
    if (ids.length === 0) return;

    await db.update(folders).set({ trashedAt: null }).where(
      and(eq(folders.userId, userId), inArray(folders.id, ids)),
    );
  }

  async emptyTrash(userId: string): Promise<void> {
    await db.delete(folders).where(
      and(eq(folders.userId, userId), isNotNull(folders.trashedAt))
    );
  }
}