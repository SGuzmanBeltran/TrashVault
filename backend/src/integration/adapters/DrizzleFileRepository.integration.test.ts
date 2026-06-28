import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'crypto';
import { DrizzleFileRepositoryAdapter } from '../../adapters/repository/DrizzleFileRepository.adapter';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  INTEGRATION_TEST_USER_ID,
  isIntegrationEnabled,
} from '../helpers/setup';

describe.skipIf(!isIntegrationEnabled())('integration: DrizzleFileRepositoryAdapter', () => {
  const repository = new DrizzleFileRepositoryAdapter();
  const createdFileIds: string[] = [];

  beforeAll(async () => {
    await ensureIntegrationUser();
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
    createdFileIds.length = 0;
  });

  test('creates, finds, updates, trashes, and permanently deletes a file', async () => {
    const id = randomUUID();
    createdFileIds.push(id);

    const created = await repository.create({
      id,
      userId: INTEGRATION_TEST_USER_ID,
      name: 'notes.txt',
      mimeType: 'text/plain',
      size: 12,
      bucket: 'integration-bucket',
      key: `integration-test/files/${id}`,
      folderId: null,
      thumbnailKey: null,
      createdAt: new Date(),
      trashedAt: null,
    });

    expect(created.name).toBe('notes.txt');

    const found = await repository.findById(id, INTEGRATION_TEST_USER_ID);
    expect(found?.id).toBe(id);

    const rootFiles = await repository.findByUserId(INTEGRATION_TEST_USER_ID, null);
    expect(rootFiles.some((file) => file.id === id)).toBe(true);

    const renamed = await repository.updateName(id, INTEGRATION_TEST_USER_ID, 'renamed.txt');
    expect(renamed?.name).toBe('renamed.txt');

    const matches = await repository.searchByName(INTEGRATION_TEST_USER_ID, 'renamed');
    expect(matches).toHaveLength(1);

    await repository.moveToTrash(id, INTEGRATION_TEST_USER_ID);
    const trashed = await repository.findTrashedByUserId(INTEGRATION_TEST_USER_ID);
    expect(trashed.some((file) => file.id === id)).toBe(true);

    await repository.restoreFromTrash(id, INTEGRATION_TEST_USER_ID);
    const activeAgain = await repository.findById(id, INTEGRATION_TEST_USER_ID);
    expect(activeAgain?.trashedAt).toBeNull();

    await repository.permanentDelete(id, INTEGRATION_TEST_USER_ID);
    expect(await repository.findById(id, INTEGRATION_TEST_USER_ID)).toBeNull();
  });

  test('tracks total storage bytes', async () => {
    const firstId = randomUUID();
    const secondId = randomUUID();
    createdFileIds.push(firstId, secondId);

    await repository.create({
      id: firstId,
      userId: INTEGRATION_TEST_USER_ID,
      name: 'a.bin',
      mimeType: 'application/octet-stream',
      size: 100,
      bucket: 'integration-bucket',
      key: `integration-test/files/${firstId}`,
      folderId: null,
      thumbnailKey: null,
      createdAt: new Date(),
      trashedAt: null,
    });

    await repository.create({
      id: secondId,
      userId: INTEGRATION_TEST_USER_ID,
      name: 'b.bin',
      mimeType: 'application/octet-stream',
      size: 250,
      bucket: 'integration-bucket',
      key: `integration-test/files/${secondId}`,
      folderId: null,
      thumbnailKey: null,
      createdAt: new Date(),
      trashedAt: null,
    });

    const total = await repository.getTotalStorageBytes();
    expect(total).toBeGreaterThanOrEqual(350);
  });
});
