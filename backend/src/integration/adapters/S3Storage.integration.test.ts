import { afterAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'crypto';
import { S3StorageAdapter } from '../../adapters/storage/S3Storage.adapter';
import { isStorageIntegrationEnabled } from '../helpers/setup';

describe.skipIf(!isStorageIntegrationEnabled())('integration: S3StorageAdapter', () => {
  const adapter = new S3StorageAdapter({
    provider: 's3',
    endpoint: process.env.R2_ENDPOINT!,
    accessKey: process.env.R2_ACCESS_KEY!,
    secretKey: process.env.R2_SECRET_KEY!,
    bucket: process.env.R2_BUCKET!,
  });

  const testKey = `integration-test/${randomUUID()}.txt`;
  const payload = new TextEncoder().encode('integration storage payload').buffer;

  afterAll(async () => {
    await adapter.delete(testKey).catch(() => {});
  });

  test('uploads, downloads, signs, and deletes objects', async () => {
    await adapter.upload(payload, testKey, 'text/plain');

    const downloaded = await adapter.download(testKey);
    expect(new TextDecoder().decode(downloaded)).toBe('integration storage payload');

    const signedUrl = await adapter.getSignedUrl(testKey, 300);
    expect(signedUrl).toContain(testKey.split('/').pop()!);

    await adapter.delete(testKey);
    await expect(adapter.download(testKey)).rejects.toThrow();
  });
});
