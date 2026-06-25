import { Elysia, t } from 'elysia';
import { createFileService } from '../di/container';
import { randomUUID } from 'crypto';
import { authMacro } from './auth.plugin';

export const fileRoutes = new Elysia({ prefix: '/files' })
  .use(authMacro)
  .post('/upload', async ({ user, body }) => {
    const fileService = createFileService();
    const uploadedFile = body.file;
    const buffer = await uploadedFile.arrayBuffer();
    const key = `files/${randomUUID()}-${uploadedFile.name}`;

    return fileService.createFile({
      id: randomUUID(),
      userId: user!.id,
      name: uploadedFile.name,
      mimeType: uploadedFile.type,
      size: buffer.byteLength,
      bucket: process.env.R2_BUCKET!,
      key,
      folderId: body.folderId || null,
      buffer,
      thumbnail: body.thumbnail ? await body.thumbnail.arrayBuffer() : null,
    });
  }, {
    type: 'multipart',
    body: t.Object({
      file: t.File(),
      folderId: t.Optional(t.String()),
      thumbnail: t.Optional(t.File()),
    }),
    auth: true,
  })
  .get('/', async ({ user, query }) => {
    const fileService = createFileService();
    return fileService.getFilesByUser(user!.id, query.folderId);
  }, {
    auth: true,
  })
  .get('/:id', async ({ user, params }) => {
    const fileService = createFileService();
    return fileService.getFile(params.id, user!.id);
  }, {
    auth: true,
  })
  .patch('/:id', async ({ user, params, body, set }) => {
    const fileService = createFileService();
    if (body.name !== undefined) {
      return fileService.renameFile(params.id, user!.id, body.name);
    }
    if (body.folderId !== undefined) {
      return fileService.moveFile(params.id, user!.id, body.folderId);
    }
    set.status = 400;
    return { error: 'No updates provided' };
  }, {
    auth: true,
    body: t.Object({
      folderId: t.Optional(t.Union([t.String(), t.Null()])),
      name: t.Optional(t.String()),
    }),
  })
  .get('/:id/download', async ({ user, params }) => {
    const fileService = createFileService();
    const url = await fileService.getDownloadUrl(params.id, user!.id);
    if (!url) return new Response('File not found', { status: 404 });
    return { url };
  }, {
    auth: true,
  })
  .get('/:id/bytes', async ({ user, params, set }) => {
    const fileService = createFileService();
    const result = await fileService.getFileBytes(params.id, user!.id);
    if (!result) {
      set.status = 404;
      return { error: 'File not found' };
    }
    set.headers['content-type'] = result.mimeType;
    return new Response(result.buffer);
  }, {
    auth: true,
  })
  .get('/:id/thumbnail', async ({ user, params, set }) => {
    const fileService = createFileService();
    const buffer = await fileService.getThumbnailBytes(params.id, user!.id);
    if (!buffer) {
      set.status = 404;
      return { error: 'No thumbnail available' };
    }
    set.headers['content-type'] = 'application/octet-stream';
    return new Response(buffer);
  }, {
    auth: true,
  })
  .delete('/:id', async ({ user, params }) => {
    const fileService = createFileService();
    await fileService.deleteFile(params.id, user!.id);
    return { success: true };
  }, {
    auth: true,
  });
