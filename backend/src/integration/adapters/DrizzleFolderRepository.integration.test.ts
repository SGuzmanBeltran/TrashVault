import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'crypto';
import { DrizzleFolderRepositoryAdapter } from '../../adapters/repository/DrizzleFolderRepository.adapter';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  INTEGRATION_TEST_USER_ID,
  isIntegrationEnabled,
} from '../helpers/setup';

describe.skipIf(!isIntegrationEnabled())('integration: DrizzleFolderRepositoryAdapter', () => {
  const repository = new DrizzleFolderRepositoryAdapter();

  beforeAll(async () => {
    await ensureIntegrationUser();
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
  });

  test('creates nested folders and supports rename, move, trash, and restore', async () => {
    const parentId = randomUUID();
    const childId = randomUUID();

    await repository.create({
      id: parentId,
      userId: INTEGRATION_TEST_USER_ID,
      name: 'Parent',
      parentId: null,
      createdAt: new Date(),
      trashedAt: null,
    });

    await repository.create({
      id: childId,
      userId: INTEGRATION_TEST_USER_ID,
      name: 'Child',
      parentId: parentId,
      createdAt: new Date(),
      trashedAt: null,
    });

    const children = await repository.findByUserId(INTEGRATION_TEST_USER_ID, parentId);
    expect(children).toHaveLength(1);
    expect(children[0]?.id).toBe(childId);

    const renamed = await repository.updateName(childId, INTEGRATION_TEST_USER_ID, 'Child Renamed');
    expect(renamed?.name).toBe('Child Renamed');

    const moved = await repository.updateParentId(childId, INTEGRATION_TEST_USER_ID, null);
    expect(moved?.parentId).toBeNull();

    const searchResults = await repository.searchByName(INTEGRATION_TEST_USER_ID, 'Parent');
    expect(searchResults.some((folder) => folder.id === parentId)).toBe(true);

    await repository.moveToTrash(parentId, INTEGRATION_TEST_USER_ID);
    const trashed = await repository.findTrashedByUserId(INTEGRATION_TEST_USER_ID);
    expect(trashed.some((folder) => folder.id === parentId)).toBe(true);

    await repository.restoreManyFromTrash([parentId], INTEGRATION_TEST_USER_ID);
    const active = await repository.findById(parentId, INTEGRATION_TEST_USER_ID);
    expect(active?.trashedAt).toBeNull();
  });
});
