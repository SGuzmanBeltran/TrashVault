import 'dotenv/config';

import { getDemoPurgeConfig } from './lib/demoConfig';
import { startDemoPurgeScheduler } from './infrastructure/demoPurgeScheduler';
import { seedDemoUser } from './db/seedDemoUser';
import { authPlugin } from './infrastructure/http/auth.plugin';
import { fileRoutes, folderRoutes, statsRoutes, billingRoutes, trashRoutes, encryptionKeyRoutes, searchRoutes } from './infrastructure/http';
import { registerFileRepository, registerFolderRepository, registerEncryptionKeyRepository, registerStatsRepository, registerBilling, registerStorage } from './infrastructure/di/container';
import { ServiceError } from './errors';

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

registerStorage({
    provider: 's3',
    endpoint: process.env.R2_ENDPOINT!,
    accessKey: process.env.R2_ACCESS_KEY!,
    secretKey: process.env.R2_SECRET_KEY!,
    bucket: process.env.R2_BUCKET!,
  });

registerFileRepository();
registerFolderRepository();
registerEncryptionKeyRepository();
registerStatsRepository();
registerBilling();

const apiRoutes = new Elysia({ prefix: '/api' })
  .use(authPlugin)
  .use(fileRoutes)
  .use(folderRoutes)
  .use(statsRoutes)
  .use(billingRoutes)
  .use(trashRoutes)
  .use(encryptionKeyRoutes)
  .use(searchRoutes);

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const port = Number(process.env.BACKEND_PORT ?? 3000);

const app = new Elysia()
  .use(cors({
    origin: frontendUrl,
    credentials: true,
    allowedHeaders: ['content-type', 'cookie', 'authorization'],
  }))
  .onError(({ error, set }) => {
    if (error instanceof ServiceError) {
      set.status = error.statusCode;
      return { error: error.message };
    }

    console.error('Unhandled error:', error);
    set.status = 500;
    return { error: 'Internal server error' };
  })
  .use(apiRoutes)
  .get('/', () => 'Hello Elysia')
  .listen({ port, hostname: '0.0.0.0' });

void seedDemoUser().catch((error) => {
  console.error('seedDemoUser failed:', error);
});
startDemoPurgeScheduler(getDemoPurgeConfig());

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);