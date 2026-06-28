import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  isIntegrationEnabled,
  setupIntegrationContainer,
} from '../helpers/setup';
import { createIntegrationTestApp } from '../helpers/testApp';
import { integrationRequest, readJson } from '../helpers/http';

describe.skipIf(!isIntegrationEnabled())('integration: HTTP /api/stats and /api/user/encryption-key', () => {
  const app = createIntegrationTestApp();

  beforeAll(async () => {
    setupIntegrationContainer();
    await ensureIntegrationUser();
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
  });

  test('GET /api/stats returns user storage summary', async () => {
    const response = await integrationRequest(app, '/api/stats');
    expect(response.status).toBe(200);

    const stats = await readJson<{
      totalFiles: number;
      totalFolders: number;
      storageTier: string;
      maxBytes: number;
    }>(response);

    expect(stats.storageTier).toBe('free');
    expect(stats.maxBytes).toBeGreaterThan(0);
    expect(stats.totalFiles).toBeGreaterThanOrEqual(0);
    expect(stats.totalFolders).toBeGreaterThanOrEqual(0);
  });

  test('encryption key routes create and read key material', async () => {
    const createResponse = await integrationRequest(app, '/api/user/encryption-key', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        encryptedDek: 'dek',
        dekIv: 'iv',
        dekSalt: 'salt',
        kdfAlgorithm: 'argon2id',
        kdfParams: '{}',
      }),
    });

    expect(createResponse.status).toBe(200);

    const getResponse = await integrationRequest(app, '/api/user/encryption-key');
    expect(getResponse.status).toBe(200);

    const key = await readJson<{ encryptedDek: string }>(getResponse);
    expect(key.encryptedDek).toBe('dek');
  });
});
