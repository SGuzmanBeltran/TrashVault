import { Elysia } from 'elysia';
import { createTrashService } from '../di/container';
import { authMacro } from './auth.plugin';

export const trashRoutes = new Elysia({ prefix: '/trash' })
  .use(authMacro)
  .get('/', async ({ user }) => {
    const trashService = createTrashService();
    return trashService.getTrash(user!.id);
  }, {
    auth: true,
  })
  .post('/files/:id/restore', async ({ user, params }) => {
    const trashService = createTrashService();
    await trashService.restoreFile(params.id, user!.id);
    return { success: true };
  }, {
    auth: true,
  })
  .post('/folders/:id/restore', async ({ user, params }) => {
    const trashService = createTrashService();
    await trashService.restoreFolder(params.id, user!.id);
    return { success: true };
  }, {
    auth: true,
  })
  .delete('/files/:id', async ({ user, params }) => {
    const trashService = createTrashService();
    await trashService.permanentDeleteFile(params.id, user!.id);
    return { success: true };
  }, {
    auth: true,
  })
  .delete('/folders/:id', async ({ user, params }) => {
    const trashService = createTrashService();
    await trashService.permanentDeleteFolder(params.id, user!.id);
    return { success: true };
  }, {
    auth: true,
  })
  .delete('/', async ({ user }) => {
    const trashService = createTrashService();
    await trashService.emptyTrash(user!.id);
    return { success: true };
  }, {
    auth: true,
  });
