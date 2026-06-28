import { Elysia } from 'elysia';
import { ServiceError } from '../../errors';
import {
  encryptionKeyRoutes,
  fileRoutes,
  folderRoutes,
  searchRoutes,
  statsRoutes,
  trashRoutes,
} from '../../infrastructure/http';

export function createIntegrationTestApp() {
  return new Elysia({ prefix: '/api' })
    .onError(({ error, set }) => {
      if (error instanceof ServiceError) {
        set.status = error.statusCode;
        return { error: error.message };
      }

      console.error('Unhandled integration test error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    })
    .use(fileRoutes)
    .use(folderRoutes)
    .use(searchRoutes)
    .use(trashRoutes)
    .use(statsRoutes)
    .use(encryptionKeyRoutes);
}
