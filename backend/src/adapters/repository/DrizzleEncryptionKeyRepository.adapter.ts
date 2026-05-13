import {
  EncryptionKey,
  EncryptionKeyRepositoryPort,
  NewEncryptionKey,
  UpdateEncryptionKey,
} from '../../ports/repository/EncryptionKeyRepository.port';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { userEncryptionKeys } from '../../db/schema';

export class DrizzleEncryptionKeyRepositoryAdapter implements EncryptionKeyRepositoryPort {
  async create(data: NewEncryptionKey): Promise<EncryptionKey> {
    const result = await db.insert(userEncryptionKeys).values(data).returning();
    return result[0];
  }

  async findByUserId(userId: string): Promise<EncryptionKey | null> {
    const result = await db
      .select()
      .from(userEncryptionKeys)
      .where(eq(userEncryptionKeys.userId, userId));
    return result[0] || null;
  }

  async update(userId: string, data: UpdateEncryptionKey): Promise<EncryptionKey> {
    const result = await db
      .update(userEncryptionKeys)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userEncryptionKeys.userId, userId))
      .returning();
    return result[0];
  }
}
