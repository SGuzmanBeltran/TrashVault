import { Elysia } from 'elysia';
import { createStatsService } from '../di/container';
import { authMacro } from './auth.plugin';

export const statsRoutes = new Elysia({ prefix: '/stats' })
  .use(authMacro)
  .get('/', async ({ user }) => {
    const statsService = createStatsService();
    return statsService.getStats(user!.id);
  }, {
    auth: true,
  });
