import 'dotenv/config';

import { authPlugin } from './infrastructure/http/auth.plugin';
import { fileRoutes, folderRoutes } from './infrastructure/http';
import { registerFileRepository, registerFolderRepository, registerStorage } from './infrastructure/di/container';

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

registerStorage({
    provider: 's3',
    endpoint: process.env.R2_ENDPOINT!,
    accessKey: process.env.R2_ACCESS_KEY_ID!,
    secretKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET!,
  });

registerFileRepository();
registerFolderRepository();

const app = new Elysia()
  .use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['content-type', 'cookie', 'authorization'],
  }))
  .use(authPlugin)
  .use(fileRoutes)
  .use(folderRoutes)
  .get('/', () => 'Hello Elysia')
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);