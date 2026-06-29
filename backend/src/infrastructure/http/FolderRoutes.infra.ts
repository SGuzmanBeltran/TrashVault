import { Elysia, t } from 'elysia';
import { createFolderService } from '../di/container';
import { randomUUID } from 'crypto';
import { authMacro } from './auth.plugin';

export const folderRoutes = new Elysia({ prefix: '/folders' })
  .use(authMacro)
  .post('/', async ({ user, body }) => {
    const folderService = createFolderService();

    return folderService.createFolder({
      id: randomUUID(),
      userId: user!.id,
      name: body.name,
      parentId: body.parentId || null,
    });
  }, {
    auth: true,
    body: t.Object({
      name: t.String(),
      parentId: t.Optional(t.Union([t.String(), t.Null()])),
    }),
  })
  .get('/', async ({ user, query }) => {
    const folderService = createFolderService();
    return folderService.getFoldersByUser(user!.id, query.parentId);
  }, {
    auth: true,
  })
  .get('/:id/download', async ({ user, params, set }) => {
    const folderService = createFolderService();
    const result = await folderService.buildFolderZipBuffer(params.id, user!.id);
    set.headers['content-type'] = 'application/zip';
    set.headers['content-disposition'] = `attachment; filename="${result.filename}"`;
    return new Response(Uint8Array.from(result.buffer));
  }, {
    auth: true,
  })
  .get('/:id', async ({ user, params }) => {
    const folderService = createFolderService();
    return folderService.getFolder(params.id, user!.id);
  }, {
    auth: true,
  })
  .patch('/:id', async ({ user, params, body, set }) => {
    const folderService = createFolderService();
    if (body.name !== undefined) {
      return folderService.renameFolder(params.id, user!.id, body.name);
    }
    if (body.parentId !== undefined) {
      return folderService.moveFolder(params.id, user!.id, body.parentId);
    }
    set.status = 400;
    return { error: 'No updates provided' };
  }, {
    auth: true,
    body: t.Object({
      parentId: t.Optional(t.Union([t.String(), t.Null()])),
      name: t.Optional(t.String()),
    }),
  })
  .delete('/:id', async ({ user, params }) => {
    const folderService = createFolderService();
    await folderService.deleteFolder(params.id, user!.id);
    return { success: true };
  }, {
    auth: true,
  });
