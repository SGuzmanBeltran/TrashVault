import { Elysia } from 'elysia';
import { createFolderService } from '../di/container';
import { randomUUID } from 'crypto';

export const folderRoutes = new Elysia({ prefix: '/folders' })
  .post('/', async ({ user, body }) => {
    const folderService = createFolderService();

    return folderService.createFolder({
      id: randomUUID(),
      userId: user.id,
      name: body.name,
      parentId: body.parentId || null,
    });
  }, {
    auth: true,
  })
  .get('/', async ({ user, query }) => {
    const folderService = createFolderService();
    return folderService.getFoldersByUser(user.id, query.parentId);
  }, {
    auth: true,
  })
  .get('/:id', async ({ user, params }) => {
    const folderService = createFolderService();
    return folderService.getFolder(params.id, user.id);
  }, {
    auth: true,
  })
  .delete('/:id', async ({ user, params }) => {
    const folderService = createFolderService();
    await folderService.deleteFolder(params.id, user.id);
    return { success: true };
  }, {
    auth: true,
  });
