import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  isIntegrationEnabled,
  setupIntegrationContainer,
} from '../helpers/setup';
import { createIntegrationTestApp } from '../helpers/testApp';
import { integrationRequest, readJson } from '../helpers/http';

describe.skipIf(!isIntegrationEnabled())('integration: HTTP /api/files', () => {
  const app = createIntegrationTestApp();

  beforeAll(async () => {
    setupIntegrationContainer();
    await ensureIntegrationUser();
    process.env.R2_BUCKET = process.env.R2_BUCKET ?? 'integration-test-bucket';
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
  });

  test('POST /upload stores a file and GET / lists it', async () => {
    const form = new FormData();
    form.append('file', new File(['hello integration'], 'hello.txt', { type: 'text/plain' }));

    const uploadResponse = await integrationRequest(app, '/api/files/upload', {
      method: 'POST',
      body: form,
    });

    expect(uploadResponse.status).toBe(200);
    const uploaded = await readJson<{ id: string; name: string; size: number }>(uploadResponse);
    expect(uploaded.name).toBe('hello.txt');
    expect(uploaded.size).toBeGreaterThan(0);

    const listResponse = await integrationRequest(app, '/api/files');
    const files = await readJson<Array<{ id: string }>>(listResponse);
    expect(files.some((file) => file.id === uploaded.id)).toBe(true);
  });

  test('GET /:id/bytes returns uploaded content', async () => {
    const form = new FormData();
    form.append('file', new File(['byte check'], 'bytes.txt', { type: 'text/plain' }));

    const uploadResponse = await integrationRequest(app, '/api/files/upload', {
      method: 'POST',
      body: form,
    });
    const uploaded = await readJson<{ id: string }>(uploadResponse);

    const bytesResponse = await integrationRequest(app, `/api/files/${uploaded.id}/bytes`);
    expect(bytesResponse.status).toBe(200);
    expect(await bytesResponse.text()).toBe('byte check');
  });

  test('PATCH /:id renames a file', async () => {
    const form = new FormData();
    form.append('file', new File(['rename me'], 'old-name.txt', { type: 'text/plain' }));

    const uploadResponse = await integrationRequest(app, '/api/files/upload', {
      method: 'POST',
      body: form,
    });
    const uploaded = await readJson<{ id: string }>(uploadResponse);

    const renameResponse = await integrationRequest(app, `/api/files/${uploaded.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new-name.txt' }),
    });

    expect(renameResponse.status).toBe(200);
    const renamed = await readJson<{ name: string }>(renameResponse);
    expect(renamed.name).toBe('new-name.txt');
  });
});
