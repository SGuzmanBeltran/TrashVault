import { afterEach, describe, expect, test } from 'bun:test';
import {
  assertGlobalStorageAvailable,
  getGlobalStorageMaxBytes,
} from './globalStorageConfig';
import { ServiceError } from '../errors';
import { createMockFileRepository } from '../test/helpers/mocks';

describe('globalStorageConfig', () => {
  let previousValue: string | undefined;

  afterEach(() => {
    if (previousValue === undefined) {
      delete process.env.GLOBAL_STORAGE_MAX_BYTES;
    } else {
      process.env.GLOBAL_STORAGE_MAX_BYTES = previousValue;
    }
  });

  test('getGlobalStorageMaxBytes defaults to 1 GB', () => {
    previousValue = process.env.GLOBAL_STORAGE_MAX_BYTES;
    delete process.env.GLOBAL_STORAGE_MAX_BYTES;

    expect(getGlobalStorageMaxBytes()).toBe(1024 * 1024 * 1024);
  });

  test('getGlobalStorageMaxBytes returns null when disabled', () => {
    previousValue = process.env.GLOBAL_STORAGE_MAX_BYTES;
    process.env.GLOBAL_STORAGE_MAX_BYTES = '0';

    expect(getGlobalStorageMaxBytes()).toBeNull();
  });

  test('assertGlobalStorageAvailable skips check when unlimited', async () => {
    previousValue = process.env.GLOBAL_STORAGE_MAX_BYTES;
    process.env.GLOBAL_STORAGE_MAX_BYTES = '0';

    const repo = createMockFileRepository({
      getTotalStorageBytes: async () => Number.MAX_SAFE_INTEGER,
    });

    await expect(assertGlobalStorageAvailable(repo, 1_000_000)).resolves.toBeUndefined();
  });

  test('assertGlobalStorageAvailable throws when limit exceeded', async () => {
    previousValue = process.env.GLOBAL_STORAGE_MAX_BYTES;
    process.env.GLOBAL_STORAGE_MAX_BYTES = String(1000);

    const repo = createMockFileRepository({
      getTotalStorageBytes: async () => 900,
    });

    await expect(assertGlobalStorageAvailable(repo, 200)).rejects.toThrow(ServiceError);
    await expect(assertGlobalStorageAvailable(repo, 200)).rejects.toThrow('Platform storage limit');
  });
});
