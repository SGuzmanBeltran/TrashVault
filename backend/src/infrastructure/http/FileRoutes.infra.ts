import { Elysia } from 'elysia';
import { createFileService } from '../di/container';
import { authPlugin } from './auth.plugin';
import { randomUUID } from 'crypto';

export const fileRoutes = new Elysia({ prefix: '/files' })
  .use(authPlugin)
  .onBeforeHandle(({ user }) => {
    if (!user) return new Response('Unauthorized', { status: 401 });
  })
  .post('/upload', async ({ user, file, body }) => {
    const fileService = createFileService();
    const buffer = await file.arrayBuffer();
    const key = `files/${randomUUID()}-${file.name}`;

    return fileService.createFile({
      id: randomUUID(),
      userId: user!.id,
      name: file.name,
      mimeType: file.type,
      size: buffer.byteLength,
      bucket: process.env.R2_BUCKET,
      key,
      folderId: body.folderId || null,
      buffer,
    });
  }, {
    type: 'multipart'
  })
  .get('/', async ({ user, query }) => {
    const fileService = createFileService();
    return fileService.getFilesByUser(user!.id, query.folderId);
  })
  .get('/:id', async ({ user, params }) => {
    const fileService = createFileService();
    return fileService.getFile(params.id, user!.id);
  })
  .get('/:id/download', async ({ user, params }) => {
    const fileService = createFileService();
    const url = await fileService.getDownloadUrl(params.id, user!.id);
    if (!url) return new Response('File not found', { status: 404 });
    return { url };
  })
  .delete('/:id', async ({ user, params }) => {
    const fileService = createFileService();
    await fileService.deleteFile(params.id, user!.id);
    return { success: true };
  });