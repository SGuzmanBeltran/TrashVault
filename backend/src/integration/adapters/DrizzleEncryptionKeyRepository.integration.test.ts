import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { DrizzleEncryptionKeyRepositoryAdapter } from '../../adapters/repository/DrizzleEncryptionKeyRepository.adapter';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  INTEGRATION_TEST_USER_ID,
  isIntegrationEnabled,
} from '../helpers/setup';

describe.skipIf(!isIntegrationEnabled())('integration: DrizzleEncryptionKeyRepositoryAdapter', () => {
  const repository = new DrizzleEncryptionKeyRepositoryAdapter();

  beforeAll(async () => {
    await ensureIntegrationUser();
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
  });

  test('creates, reads, and updates encryption key material', async () => {
    const created = await repository.create({
      userId: INTEGRATION_TEST_USER_ID,
      encryptedDek: 'encrypted-dek',
      dekIv: 'dek-iv',
      dekSalt: 'dek-salt',
      kdfAlgorithm: 'argon2id',
      kdfParams: '{"iterations":3}',
    });

    expect(created.userId).toBe(INTEGRATION_TEST_USER_ID);

    const found = await repository.findByUserId(INTEGRATION_TEST_USER_ID);
    expect(found?.encryptedDek).toBe('encrypted-dek');

    const updated = await repository.update(INTEGRATION_TEST_USER_ID, {
      encryptedDek: 'rotated-dek',
      dekIv: 'new-iv',
      dekSalt: 'new-salt',
      kdfAlgorithm: 'argon2id',
      kdfParams: '{"iterations":4}',
    });

    expect(updated.encryptedDek).toBe('rotated-dek');
    expect(updated.dekIv).toBe('new-iv');
  });
});
