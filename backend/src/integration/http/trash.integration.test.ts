import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  isIntegrationEnabled,
  setupIntegrationContainer,
} from '../helpers/setup';
import { createIntegrationTestApp } from '../helpers/testApp';
import { integrationRequest, readJson } from '../helpers/http';

describe.skipIf(!isIntegrationEnabled())('integration: HTTP /api/trash', () => {
  const app = createIntegrationTestApp();

  beforeAll(async () => {
    setupIntegrationContainer();
    await ensureIntegrationUser();
    process.env.R2_BUCKET = process.env.R2_BUCKET ?? 'integration-test-bucket';
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
  });

  test('restores a trashed file', async () => {
    const form = new FormData();
    form.append('file', new File(['trash me'], 'trash-me.txt', { type: 'text/plain' }));

    const uploadResponse = await integrationRequest(app, '/api/files/upload', {
      method: 'POST',
      body: form,
    });
    const uploaded = await readJson<{ id: string }>(uploadResponse);

    await integrationRequest(app, `/api/files/${uploaded.id}`, { method: 'DELETE' });

    const restoreResponse = await integrationRequest(app, `/api/trash/files/${uploaded.id}/restore`, {
      method: 'POST',
    });
    expect(restoreResponse.status).toBe(200);

    const listResponse = await integrationRequest(app, '/api/files');
    const files = await readJson<Array<{ id: string }>>(listResponse);
    expect(files.some((file) => file.id === uploaded.id)).toBe(true);
  });

  test('permanently deletes a trashed file', async () => {
    const form = new FormData();
    form.append('file', new File(['gone'], 'gone.txt', { type: 'text/plain' }));

    const uploadResponse = await integrationRequest(app, '/api/files/upload', {
      method: 'POST',
      body: form,
    });
    const uploaded = await readJson<{ id: string }>(uploadResponse);

    await integrationRequest(app, `/api/files/${uploaded.id}`, { method: 'DELETE' });

    const purgeResponse = await integrationRequest(app, `/api/trash/files/${uploaded.id}`, {
      method: 'DELETE',
    });
    expect(purgeResponse.status).toBe(200);

    const trashResponse = await integrationRequest(app, '/api/trash');
    const trash = await readJson<{ files: Array<{ id: string }> }>(trashResponse);
    expect(trash.files.some((file) => file.id === uploaded.id)).toBe(false);
  });
});
