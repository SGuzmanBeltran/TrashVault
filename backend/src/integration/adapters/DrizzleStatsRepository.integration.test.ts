import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { files } from '../../db/schema';
import { user } from '../../db/auth-schema';
import { DrizzleStatsRepositoryAdapter } from '../../adapters/repository/DrizzleStatsRepository.adapter';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  INTEGRATION_TEST_USER_ID,
  isIntegrationEnabled,
} from '../helpers/setup';

describe.skipIf(!isIntegrationEnabled())('integration: DrizzleStatsRepositoryAdapter', () => {
  const repository = new DrizzleStatsRepositoryAdapter();

  beforeAll(async () => {
    await ensureIntegrationUser();
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
    await db
      .update(user)
      .set({ storageTier: 'free' })
      .where(eq(user.id, INTEGRATION_TEST_USER_ID));
  });

  test('aggregates file and folder counts with recent files', async () => {
    const fileId = randomUUID();

    await db.insert(files).values({
      id: fileId,
      userId: INTEGRATION_TEST_USER_ID,
      name: 'stats.txt',
      mimeType: 'text/plain',
      size: 128,
      bucket: 'integration-bucket',
      key: `integration-test/files/${fileId}`,
      folderId: null,
      thumbnailKey: null,
      createdAt: new Date(),
      trashedAt: null,
    });

    expect(await repository.countFilesByUserId(INTEGRATION_TEST_USER_ID)).toBe(1);
    expect(await repository.countFoldersByUserId(INTEGRATION_TEST_USER_ID)).toBe(0);
    expect(await repository.sumFileBytesByUserId(INTEGRATION_TEST_USER_ID)).toBe(128);

    const recent = await repository.findRecentFilesByUserId(INTEGRATION_TEST_USER_ID, 5);
    expect(recent[0]?.name).toBe('stats.txt');
  });

  test('reads and updates user storage tier', async () => {
    expect(await repository.getUserStorageTier(INTEGRATION_TEST_USER_ID)).toBe('free');

    await repository.updateUserStorageTier(INTEGRATION_TEST_USER_ID, 'plus');
    expect(await repository.getUserStorageTier(INTEGRATION_TEST_USER_ID)).toBe('plus');
  });
});
