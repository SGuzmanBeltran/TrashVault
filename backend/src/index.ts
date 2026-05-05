import 'dotenv/config';
import { Elysia } from 'elysia';
import { fileRoutes, folderRoutes } from './infrastructure/http';
import { registerStorage, registerFileRepository, registerFolderRepository } from './infrastructure/di/container';

registerStorage({
  endpoint: process.env.MINIO_ENDPOINT!,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
  bucket: process.env.MINIO_BUCKET!,
});

registerFileRepository();
registerFolderRepository();

const app = new Elysia()
  .use(fileRoutes)
  .use(folderRoutes)
  .get('/', () => 'Hello Elysia')
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);