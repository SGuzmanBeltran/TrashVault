# TrashVault Backend — Agent Notes

## Architecture

Hexagonal / Ports-and-Adapters. Entrypoint is `src/index.ts`, which wires the DI container and mounts Elysia route plugins.

```
infrastructure/http/   ← Elysia route plugins + auth macro
        │
        ▼
    services/          ← Business logic (FileService, FolderService, TrashService, …)
        │
        ▼
      ports/           ← Interfaces: IFileRepository, IStorageAdapter, IBillingAdapter, …
        │
        ▼
    adapters/          ← DrizzleFileRepository, S3StorageAdapter, StripeAdapter
```

Manual DI container in `infrastructure/di/container.ts` — no Nest, no Inversify.

## Package Manager

**Always `bun`.** Never npm, yarn, or pnpm.

## Dev Server

```bash
cd backend && bun run dev
# --watch on src/index.ts, Elysia listens on :3000
```

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia (TypeScript)
- **DB**: Drizzle ORM + PostgreSQL (`pg` driver)
- **Storage**: Cloudflare R2 / MinIO via `@aws-sdk/client-s3`
- **Auth**: Better Auth — sessions, email/password, TOTP 2FA
- **Billing**: Stripe — Checkout Sessions, webhooks
- **Images**: `sharp` for server-side thumbnails
- **DI**: Manual container (no framework)

## Auth Pattern

`auth.plugin.ts` defines an Elysia macro that resolves the session and returns 401 if missing. Integration tests bypass real auth via `x-test-user-id` header when `ENABLE_INTEGRATION_TEST_AUTH=true`.

## DB / Drizzle

- Schema: `src/db/schema.ts` — tables: `files`, `folders`, `user_encryption_keys`, plus Better Auth tables in `src/db/auth-schema.ts`
- Connection: `src/db/index.ts`
- Config: `drizzle.config.ts` (`dialect: 'postgresql'`)
- Migrations: `bunx drizzle-kit generate` then `bunx drizzle-kit migrate`

## Storage Adapters

- **`S3Storage.adapter.ts`** — `@aws-sdk/client-s3`, `forcePathStyle: true`. Works with R2, S3, and MinIO. This is the production adapter.
- **`MinioStorage.adapter.ts`** — legacy `minio` SDK, only for local MinIO. Not used in production.

DI container registers `S3StorageAdapter` when `R2_ENDPOINT` is set.

## Testing

- **Unit tests**: `bun test` — covers services, lib, errors (~15 test files in `src/`)
- **Integration tests**: `bun run test:integration` — HTTP + adapter tests in `src/integration/`; require real `DATABASE_URL` and R2 env vars

## Environment

Required in `backend/.env`:

```env
DATABASE_URL="postgresql://..."
FRONTEND_URL="http://localhost:5173"
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=trashvault
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Optional
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WHALE_PRICE_ID=price_...
GLOBAL_STORAGE_MAX_BYTES=1073741824
DEMO_AUTO_PURGE=true
```
