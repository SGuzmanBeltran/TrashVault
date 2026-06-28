import 'dotenv/config';

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { files, folders, userEncryptionKeys } from '../../db/schema';
import { user } from '../../db/auth-schema';
import {
  registerEncryptionKeyRepository,
  registerFileRepository,
  registerFolderRepository,
  registerStatsRepository,
  registerStorageInstance,
  resetContainerForTests,
} from '../../infrastructure/di/container';
import { InMemoryStorageAdapter } from './InMemoryStorage.adapter';

export const INTEGRATION_TEST_USER_ID = 'integration-test-user';

export function isIntegrationEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function isStorageIntegrationEnabled(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY &&
      process.env.R2_SECRET_KEY &&
      process.env.R2_BUCKET,
  );
}

export function setupIntegrationContainer(): void {
  resetContainerForTests();
  registerStorageInstance(new InMemoryStorageAdapter());
  registerFileRepository();
  registerFolderRepository();
  registerEncryptionKeyRepository();
  registerStatsRepository();
}

export async function ensureIntegrationUser(): Promise<void> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, INTEGRATION_TEST_USER_ID))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(user).values({
    id: INTEGRATION_TEST_USER_ID,
    name: 'Integration Test User',
    email: 'integration-test@trashvault.local',
    emailVerified: true,
  });
}

export async function cleanupIntegrationUserData(): Promise<void> {
  await db.delete(files).where(eq(files.userId, INTEGRATION_TEST_USER_ID));
  await db.delete(folders).where(eq(folders.userId, INTEGRATION_TEST_USER_ID));
  await db.delete(userEncryptionKeys).where(eq(userEncryptionKeys.userId, INTEGRATION_TEST_USER_ID));
}
