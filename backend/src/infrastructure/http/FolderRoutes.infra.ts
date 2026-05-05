import { Elysia } from 'elysia';
import { createFolderService } from '../di/container';
import { randomUUID } from 'crypto';

export const folderRoutes = new Elysia({ prefix: '/folders' })
  .post('/', async ({ body }) => {
    const folderService = createFolderService();

    return folderService.createFolder({
      id: randomUUID(),
      userId: 'temp-user-id',
      name: body.name,
      parentId: body.parentId || null,
    });
  })
  .get('/', async ({ query }) => {
    const folderService = createFolderService();
    return folderService.getFoldersByUser('temp-user-id', query.parentId);
  })
  .get('/:id', async ({ params }) => {
    const folderService = createFolderService();
    return folderService.getFolder(params.id);
  })
  .delete('/:id', async ({ params }) => {
    const folderService = createFolderService();
    await folderService.deleteFolder(params.id);
    return { success: true };
  });