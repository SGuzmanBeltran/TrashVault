import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  cleanupIntegrationUserData,
  ensureIntegrationUser,
  isIntegrationEnabled,
  setupIntegrationContainer,
} from '../helpers/setup';
import { createIntegrationTestApp } from '../helpers/testApp';
import { integrationRequest, readJson } from '../helpers/http';

describe.skipIf(!isIntegrationEnabled())('integration: HTTP /api/folders', () => {
  const app = createIntegrationTestApp();

  beforeAll(async () => {
    setupIntegrationContainer();
    await ensureIntegrationUser();
  });

  afterEach(async () => {
    await cleanupIntegrationUserData();
  });

  test('POST / creates a folder and GET / lists it', async () => {
    const createResponse = await integrationRequest(app, '/api/folders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '  Reports  ' }),
    });

    expect(createResponse.status).toBe(200);
    const created = await readJson<{ id: string; name: string }>(createResponse);
    expect(created.name).toBe('  Reports  ');

    const listResponse = await integrationRequest(app, '/api/folders');
    expect(listResponse.status).toBe(200);
    const folders = await readJson<Array<{ id: string; name: string }>>(listResponse);
    expect(folders.some((folder) => folder.id === created.id)).toBe(true);
  });

  test('PATCH /:id renames a folder', async () => {
    const createResponse = await integrationRequest(app, '/api/folders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Drafts' }),
    });
    const created = await readJson<{ id: string }>(createResponse);

    const renameResponse = await integrationRequest(app, `/api/folders/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Archive' }),
    });

    expect(renameResponse.status).toBe(200);
    const renamed = await readJson<{ name: string }>(renameResponse);
    expect(renamed.name).toBe('Archive');
  });

  test('DELETE /:id moves folder to trash', async () => {
    const createResponse = await integrationRequest(app, '/api/folders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Temporary' }),
    });
    const created = await readJson<{ id: string }>(createResponse);

    const deleteResponse = await integrationRequest(app, `/api/folders/${created.id}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(200);

    const trashResponse = await integrationRequest(app, '/api/trash');
    const trash = await readJson<{ folders: Array<{ id: string }> }>(trashResponse);
    expect(trash.folders.some((folder) => folder.id === created.id)).toBe(true);
  });

  test('returns 401 without test auth header', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/folders', {
        method: 'GET',
      }),
    );

    expect(response.status).toBe(401);
  });
});
