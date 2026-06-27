import { Elysia, t } from 'elysia';
import { createStatsService } from '../di/container';
import { authMacro } from './auth.plugin';

export const statsRoutes = new Elysia({ prefix: '/stats' })
  .use(authMacro)
  .get('/', async ({ user }) => {
    const statsService = createStatsService();
    return statsService.getStats(user!.id);
  }, {
    auth: true,
  })
  .get('/tiers', async () => {
    const statsService = createStatsService();
    return statsService.listStorageTiers();
  }, {
    auth: true,
  })
  .post('/upgrade', async ({ user, body }) => {
    const statsService = createStatsService();
    return statsService.upgradeStorage(user!.id, body.tier);
  }, {
    auth: true,
    body: t.Object({
      tier: t.Union([
        t.Literal('plus'),
        t.Literal('pro'),
        t.Literal('whale'),
      ]),
    }),
  });
