import { FileEntity, FileRepositoryPort, NewFile } from '../../ports/repository/FileRepository.port';
import { and, eq } from 'drizzle-orm';

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
      return db.select().from(files).where(eq(files.userId, userId));
    }
    return db.select().from(files).where(
      and(eq(files.userId, userId), eq(files.folderId, folderId))
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await db.delete(files).where(
      and(eq(files.id, id), eq(files.userId, userId))
    );
  }
}