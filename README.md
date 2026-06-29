# TrashVault

A self-hosted personal cloud vault with **zero-trust client-side encryption** — your files are encrypted in the browser before they ever leave your device. The server stores only ciphertext and never sees your plaintext data or encryption keys.

**Live demo:** [trashvault.dev](https://trashvault.dev) — log in with `demo@trashvault.dev` / `password123`

---

## Highlights

- **Zero-trust encryption** — Argon2id + AES-256-GCM, all in the browser. Password forgotten = data gone (by design).
- **Full-featured file browser** — nested folders, bulk operations, drag-and-drop, keyboard shortcuts, grid/list views, sort, search.
- **Trash with recovery** — soft-delete with restore and permanent deletion.
- **Image / video / PDF previews** — inline viewer with decryption.
- **Two-factor authentication** — TOTP via Better Auth.
- **Stripe billing** — tiered storage plans with Checkout and webhooks.
- **CI/CD pipeline** — lint → typecheck → unit tests → Docker build → self-hosted deploy.
- **Hexagonal architecture** — ports-and-adapters on both backend and frontend, manual DI container.
- **Self-hosted** — Docker Compose, Cloudflare R2, Caddy reverse proxy. No vendor lock-in.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh/) |
| Backend | [Elysia](https://elysiajs.com/) (TypeScript) |
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/) |
| Object storage | Cloudflare R2 (S3-compatible) / MinIO |
| Auth | [Better Auth](https://www.better-auth.com/) — sessions, 2FA |
| Billing | Stripe — Checkout, webhooks |
| Encryption | `hash-wasm` (Argon2id WASM) + Web Crypto API (AES-256-GCM) |
| Thumbnails | `sharp` (server-side) |
| Reverse proxy | Caddy 2 |
| Containers | Docker + GitHub Container Registry |
| Linting | oxlint + ESLint |
| Testing | Bun test (unit) + Vitest (frontend) |

---

## Architecture

### Backend — Hexagonal / Ports-and-Adapters

```
infrastructure/http/   ← Elysia route plugins, auth macro
        │
        ▼
    services/          ← Pure business logic (FileService, FolderService, …)
        │
        ▼
      ports/           ← Interfaces: IFileRepository, IStorageAdapter, IBillingAdapter
        │
        ▼
    adapters/          ← Drizzle (Postgres), S3/R2, Stripe
```

Manual DI container wires everything at startup — no Nest, no Inversify, no magic.

### Frontend — same pattern

```
Vue components / pages
        │
        ▼
    Pinia stores       ← auth, files, vault, trash, stats, theme
        │
        ▼
    services/          ← encryption orchestration, business logic
        │
        ▼
  Http*Adapters        ← thin wrappers around apiFetch / XHR
```

### Production topology

```
Browser
  └─► Caddy :80  (frontend container)
        ├── /api/*  → reverse_proxy → backend:3000
        └── /*      → SPA static files

backend:3000
  ├── PostgreSQL (external, via infra-network)
  ├── Cloudflare R2
  └── Stripe webhooks
```

---

## Zero-Trust Encryption

The password serves two completely separate purposes:

```
User Password
     │
     ├──► bcrypt (Better Auth, server-side) ──► session cookie
     │
     └──► Argon2id (browser, WASM) ──► KEK (256-bit)
                                           │
                                           └──► AES-256-GCM ──► DEK (256-bit)
                                                                     │
                                                                     └──► AES-256-GCM ──► encrypted file bytes
```

**What the server stores:**
- `bcrypt(password)` — for session auth
- `AES-GCM(DEK, KEK)` + salt + KDF params — the encrypted key blob
- File ciphertext in R2 (IV prepended, GCM tag appended; 28 bytes overhead per file)

**What the server never sees:** plaintext file contents, KEK, or DEK.

Forgetting your password means your data is permanently unrecoverable. This is the intended behaviour.

See [`docs/zero-trust-encryption.md`](./docs/zero-trust-encryption.md) for the full design spec.

---

## Features

### File management
- Upload with progress bar (multipart XHR), 50 MB per file
- Move / rename files and folders
- Nested folders with breadcrumb navigation
- Signed download URLs + proxy endpoint for client-side decryption
- Server-side thumbnails via `sharp`; client-side thumbnails for encrypted files
- Folder download as zip (`fflate`)
- Upload conflict detection and resolution modal
- External folder upload

### UX
- Grid and list views (persisted per user)
- Sort by name, size, date, type — ascending or descending
- Global search with folder path display
- Bulk select (Shift+click range), bulk delete, bulk move
- Keyboard shortcuts: Del, Enter, Esc, Ctrl+A, Ctrl+U
- Drag-and-drop upload (to page or to a specific folder)
- Drag files into folders to move them
- Loading skeletons, toast notifications, error boundaries
- Mobile-responsive layout
- Custom accent colour theming (dark-first design system)

### Auth & security
- Email + password registration and login
- TOTP two-factor authentication (setup / disable flow)
- Route guards for auth state and 2FA pending state
- Session cookies via Better Auth

### Storage & billing
- Storage usage stats displayed in sidebar
- Tiers: Free (500 MB), Plus (5 GB), Pro (10 GB), Whale (25 GB)
- Stripe Checkout for upgrades; webhook updates user tier
- Platform-wide storage cap (`GLOBAL_STORAGE_MAX_BYTES`) to protect R2 free quota

### Trash
- Soft-delete with `trashedAt` timestamp
- Restore files and folders
- Permanent delete (parallel S3 cleanup, concurrency 20)
- Empty trash

### Demo mode
- `seedDemoUser()` runs on every backend startup (idempotent)
- Optional `DemoPurgeService` scheduler — cleans up old demo data automatically

---

## CI/CD Pipeline

### CI (`.github/workflows/ci.yml`)

Triggers on push to `main` and on pull requests.

| Step | Tool | Scope |
|---|---|---|
| Lint | oxlint, ESLint | backend + frontend |
| Type-check | tsc, vue-tsc | backend + frontend |
| Unit tests | `bun test`, Vitest | backend services, libs |
| Build | Vite | frontend |

### CD (`.github/workflows/cd.yml`)

Triggers on CI success on `main` via `workflow_run` — only green builds deploy.

1. **Build & push** — Docker images built in parallel (matrix: backend, frontend), pushed to GHCR with branch / semver / SHA / `latest` tags and BuildKit layer caching.
2. **Deploy** — self-hosted runner pulls new images and runs `docker compose up -d`.

---

## Project Structure

```
trashvault/
├── .github/workflows/
│   ├── ci.yml                   # lint → typecheck → test → build
│   └── cd.yml                   # Docker build+push → self-hosted deploy
├── backend/
│   └── src/
│       ├── index.ts             # entrypoint, DI wiring, route mounting
│       ├── auth.ts              # Better Auth config + 2FA
│       ├── db/                  # Drizzle schema + seedDemoUser
│       ├── ports/               # IFileRepository, IStorageAdapter, IBillingAdapter, …
│       ├── adapters/            # DrizzleFile, S3Storage, StripeAdapter
│       ├── services/            # FileService, FolderService, TrashService, …
│       ├── infrastructure/
│       │   ├── di/container.ts  # manual DI
│       │   └── http/            # Elysia route plugins + auth macro
│       ├── errors/              # ServiceError hierarchy
│       ├── lib/                 # upload limits, storage tiers, crypto helpers
│       └── integration/         # HTTP + adapter integration tests
├── frontend/
│   └── src/
│       ├── pages/               # Landing, Login, Register, Files, Trash, Settings, TwoFactor
│       ├── layouts/             # AppLayout, sidebar, topbar
│       ├── components/          # FileCard, FolderCard, upload UI, modals, previews
│       ├── stores/              # auth, files, vault, trash, stats, theme, notification
│       ├── adapters/            # HttpFile, HttpFolder, HttpEncryption, …
│       ├── services/            # FileService (encryption orchestration)
│       ├── ports/               # port interfaces
│       ├── composables/         # uploads, keyboard shortcuts, drag-drop
│       ├── lib/                 # crypto.ts, api-fetch, xhr-upload, thumbnails
│       ├── router/              # route guards
│       ├── container.ts         # frontend DI
│       └── styles/              # main.css + DESIGN_SYSTEM.md
├── deploy/
│   ├── docker-compose.yml
│   └── .env.example
├── docs/
│   └── zero-trust-encryption.md
├── scripts/                     # ci-lint, ci-typecheck, ci-unit-tests, ci-build
└── frontend/Caddyfile           # production reverse proxy
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.1
- PostgreSQL database
- Cloudflare R2 account (or local MinIO)
- Stripe account (optional — for billing)

### Backend

```bash
cd backend
bun install
```

Create `backend/.env` from the example:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/trashvault"
FRONTEND_URL="http://localhost:5173"
BETTER_AUTH_SECRET="change-me"
BETTER_AUTH_URL="http://localhost:3000"

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=trashvault
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WHALE_PRICE_ID=price_...
```

Run migrations and start the dev server:

```bash
bunx drizzle-kit migrate
bun run dev
```

API available at `http://localhost:3000`.

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Dev server at `http://localhost:5173`.

### Local MinIO (alternative to R2)

```bash
brew install minio/stable/minio
minio server ./data --console-address ":9001"
```

Update `backend/.env`:

```env
R2_ENDPOINT=http://localhost:9000
R2_ACCESS_KEY_ID=minioadmin
R2_SECRET_ACCESS_KEY=minioadmin
R2_BUCKET=trashvault
```

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Backend dev server with hot reload |
| `bun run test` | Backend unit tests |
| `bun run test:integration` | Backend integration tests (needs DB + R2 env) |
| `bunx drizzle-kit generate` | Generate Drizzle migrations |
| `bunx drizzle-kit migrate` | Apply migrations |
| `cd frontend && bun run dev` | Frontend dev server |
| `cd frontend && bun run test:unit` | Frontend unit tests (Vitest) |
| `cd frontend && bun run build` | Production build |
| `cd frontend && bun run lint` | oxlint + ESLint |

---

## Deployment

Copy `deploy/.env.example` to `deploy/.env` and fill in your values, then:

```bash
cd deploy
docker compose up -d
```

The frontend container (Caddy) serves the SPA and reverse-proxies `/api/*` to the backend — single origin for cookies, no CORS issues.

The CD pipeline handles this automatically on every green push to `main`.

---

## License

MIT
