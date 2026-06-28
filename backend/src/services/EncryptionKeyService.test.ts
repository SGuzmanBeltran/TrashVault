import { describe, expect, test } from 'bun:test';
import { EncryptionKeyService } from './EncryptionKeyService.service';
import { createMockEncryptionKeyRepository } from '../test/helpers/mocks';
import { NotFoundError } from '../errors';

describe('EncryptionKeyService', () => {
  test('getKey throws when key is missing', async () => {
    const service = new EncryptionKeyService(createMockEncryptionKeyRepository());
    await expect(service.getKey('user-1')).rejects.toThrow(NotFoundError);
  });

  test('createKey delegates to repository', async () => {
    const payload = {
      userId: 'user-1',
      encryptedDek: 'dek',
      dekIv: 'iv',
      dekSalt: 'salt',
      kdfAlgorithm: 'argon2id',
      kdfParams: '{}',
    };

    const service = new EncryptionKeyService(
      createMockEncryptionKeyRepository({
        create: async (data) => ({
          ...data,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        }),
      }),
    );

    const key = await service.createKey(payload);
    expect(key.userId).toBe('user-1');
    expect(key.encryptedDek).toBe('dek');
  });
});
