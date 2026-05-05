# TrashVault — Agent Notes

## Architecture

Hexagonal / Ports-and-Adapters. Entrypoint is `src/index.ts`, which wires the DI container and mounts Elysia route plugins (`infrastructure/http/`). All dependencies flow inward: routes → services → ports → adapters.

## Package Manager

**Always `bun`.** Never npm, yarn, or pnpm.

## Dev Server

```bash
cd backend && bun run dev
# Runs with --watch on src/index.ts, Elysia listens on :3000
```

## Tech Stack

- **Runtime**: Bun
- **Backend**: Elysia (TypeScript)
- **Storage**: Cloudflare R2 (S3-compatible, configured via `.env`)
- **DB**: Drizzle ORM + PostgreSQL (`pg` driver)
- **DI**: Manual container in `infrastructure/di/container.ts` (no framework)

## Important Code Patterns

- **Ports** = interfaces in `src/ports/`
- **Adapters** = implementations in `src/adapters/`
- **Services** = business logic in `src/services/`
- **DI container** = registers singletons eagerly in `src/index.ts`, lazy-getters throw if called before `register*()`
- **No auto-injection** — always use `createFileService()` / `createFolderService()` from container

## Environment

Backend expects `backend/.env` with:

```env
DATABASE_URL="postgresql://..."
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

> `backend/.env` is gitignored. Copy from root `.env.example` if needed.

## DB / Drizzle

- Schema: `src/db/schema.ts` (tables: `files`, `folders`)
- Connection: `src/db/index.ts` reads `DATABASE_URL` directly
- Migrations: `drizzle-kit` — `bunx drizzle-kit generate`, `bunx drizzle-kit migrate`
- Config: `drizzle.config.ts` uses `dialect: 'postgresql'`

## Storage Adapters

Two adapters coexist:

- **`MinioStorage.adapter.ts`** — uses `minio` SDK. Only works with local MinIO (hardcodes `useSSL: false`, parses `endpoint.split(':')[1]` for port).
- **`S3Storage.adapter.ts`** — uses `@aws-sdk/client-s3`. Works with R2, S3, or MinIO (uses `forcePathStyle: true`).

The DI container picks `provider: 's3'` when `process.env.R2_ENDPOINT` is set, otherwise falls back to `'minio'`.

## Known Gaps

- Auth is hardcoded as `'temp-user-id'` in routes (MVP placeholder)
- No tests configured (`package.json` scripts just echo error)
- `docker-compose.yml` at repo root is currently empty (no local services needed since storage moved to R2)
- No frontend package exists yet (stack says Vue 3, but no `frontend/` dir)
