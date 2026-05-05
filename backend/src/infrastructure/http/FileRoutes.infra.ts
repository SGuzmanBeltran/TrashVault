import { Elysia } from 'elysia';
import { createFileService } from '../di/container';
import { randomUUID } from 'crypto';

export const fileRoutes = new Elysia({ prefix: '/files' })
  .post('/upload', async ({ file, body }) => {
    const fileService = createFileService();
    const buffer = await file.arrayBuffer();
    const key = `files/${randomUUID()}-${file.name}`;

    return fileService.createFile({
      id: randomUUID(),
      userId: 'temp-user-id',
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
  .get('/', async ({ query }) => {
    const fileService = createFileService();
    return fileService.getFilesByUser('temp-user-id', query.folderId);
  })
  .get('/:id', async ({ params }) => {
    const fileService = createFileService();
    return fileService.getFile(params.id);
  })
  .get('/:id/download', async ({ params }) => {
    const fileService = createFileService();
    const url = await fileService.getDownloadUrl(params.id);
    if (!url) return new Response('File not found', { status: 404 });
    return { url };
  })
  .delete('/:id', async ({ params }) => {
    const fileService = createFileService();
    await fileService.deleteFile(params.id);
    return { success: true };
  });