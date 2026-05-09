import { FolderEntity, FolderRepositoryPort, NewFolder } from '../../ports/repository/FolderRepository.port';
import { and, eq, isNull } from 'drizzle-orm';

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
        and(eq(folders.userId, userId), isNull(folders.parentId))
      );
    }
    return db.select().from(folders).where(
      and(eq(folders.userId, userId), eq(folders.parentId, parentId))
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await db.delete(folders).where(
      and(eq(folders.id, id), eq(folders.userId, userId))
    );
  }
}