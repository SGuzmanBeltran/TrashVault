import { Elysia, t } from 'elysia';
import { createSearchService } from '../di/container';
import { authMacro } from './auth.plugin';

export const searchRoutes = new Elysia({ prefix: '/search' })
  .use(authMacro)
  .get('/', async ({ user, query }) => {
    const searchService = createSearchService();
    return searchService.search(user!.id, query.q ?? '');
  }, {
    auth: true,
    query: t.Object({
      q: t.Optional(t.String()),
    }),
  });
