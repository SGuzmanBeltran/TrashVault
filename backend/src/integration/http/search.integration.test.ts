import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  isIntegrationEnabled,
  setupIntegrationContainer,
} from '../helpers/setup';
import { createIntegrationTestApp } from '../helpers/testApp';
import { integrationRequest, readJson } from '../helpers/http';

describe.skipIf(!isIntegrationEnabled())('integration: HTTP /api/search', () => {
  const app = createIntegrationTestApp();

  beforeAll(async () => {
    setupIntegrationContainer();
    await ensureIntegrationUser();
    process.env.R2_BUCKET = process.env.R2_BUCKET ?? 'integration-test-bucket';
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
  });

  test('GET / returns matches with folder paths', async () => {
    const folderResponse = await integrationRequest(app, '/api/folders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Finance' }),
    });
    const folder = await readJson<{ id: string }>(folderResponse);

    const form = new FormData();
    form.append('file', new File(['invoice'], 'invoice-q1.pdf', { type: 'application/pdf' }));
    form.append('folderId', folder.id);

    await integrationRequest(app, '/api/files/upload', {
      method: 'POST',
      body: form,
    });

    const searchResponse = await integrationRequest(app, '/api/search?q=invoice');
    expect(searchResponse.status).toBe(200);

    const results = await readJson<{
      files: Array<{ name: string; path: string }>;
      folders: Array<{ name: string; path: string }>;
    }>(searchResponse);

    expect(results.files[0]?.name).toBe('invoice-q1.pdf');
    expect(results.files[0]?.path).toBe('My Files / Finance');
  });
});
