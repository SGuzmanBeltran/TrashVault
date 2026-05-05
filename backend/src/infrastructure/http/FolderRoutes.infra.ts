import { Elysia } from 'elysia';
import { createFolderService } from '../di/container';
import { authPlugin } from './auth.plugin';
import { randomUUID } from 'crypto';

export const folderRoutes = new Elysia({ prefix: '/folders' })
  .use(authPlugin)
  .onBeforeHandle(({ user }) => {
    if (!user) return new Response('Unauthorized', { status: 401 });
  })
  .post('/', async ({ user, body }) => {
    const folderService = createFolderService();

    return folderService.createFolder({
      id: randomUUID(),
      userId: user!.id,
      name: body.name,
      parentId: body.parentId || null,
    });
  })
  .get('/', async ({ user, query }) => {
    const folderService = createFolderService();
    return folderService.getFoldersByUser(user!.id, query.parentId);
  })
  .get('/:id', async ({ user, params }) => {
    const folderService = createFolderService();
    return folderService.getFolder(params.id, user!.id);
  })
  .delete('/:id', async ({ user, params }) => {
    const folderService = createFolderService();
    await folderService.deleteFolder(params.id, user!.id);
    return { success: true };
  });
