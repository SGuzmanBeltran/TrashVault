# TrashVault

Google Drive-like, self-hosted.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Bun |
| Backend | Elysia (TypeScript) |
| Storage | Cloudflare R2 (S3-compatible) |
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| DB | Drizzle + SQLite |
| Styling | Tailwind CSS 4 |

## Estructura

```
trashvault/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── infrastructure/
│   │   │   ├── storage/       # S3/R2 adapter
│   │   │   └── http/          # Elysia routes
│   │   └── db/                # Drizzle schema
│   ├── package.json
│   └── drizzle.config.ts
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API REST

```
POST   /files/upload          # Upload file
GET    /files                # List files
GET    /files/:id            # Get file metadata
GET    /files/:id/download   # Get signed download URL
DELETE /files/:id            # Delete file
POST   /folders              # Create folder
GET    /folders              # List folders
DELETE /folders/:id          # Delete folder
```

## DB Schema

```ts
files {
  id: text (uuid)
  userId: text
  name: text
  mimeType: text
  size: integer
  bucket: text
  key: text (S3 object key)
  folderId: text | null
  createdAt: integer
}

folders {
  id: text (uuid)
  userId: text
  name: text
  parentId: text | null
  createdAt: integer
}
```

## Semana 1 — MVP

- [x] API upload/download/list/delete
- [x] Autenticación simple (Better Auth)
- [x] Frontend: login + navegador de archivos
- [x] Upload de archivos (drag & drop)

### Zero-Trust Encryption

> Full spec: [`docs/zero-trust-encryption.md`](docs/zero-trust-encryption.md)

**Backend**

- [x] Add `user_encryption_keys` table (schema + relations)
- [x] `EncryptionKeyRepository` port + Drizzle adapter
- [x] `EncryptionKeyService` (create, get, update)
- [x] `EncryptionKeyRoutes` (POST/GET/PUT `/api/user/encryption-key`)
- [x] `/files/:id/bytes` endpoint (proxy file from R2, avoids CORS)
- [x] Accept thumbnail in upload form data

**Frontend — Crypto Layer**

- [x] Install `hash-wasm` (Argon2id WASM)
- [x] `lib/crypto.ts` — deriveKek, generateDek, encryptDek, decryptDek, encryptFile, decryptFile

**Frontend — Vault Store**

- [x] `stores/vault.ts` — DEK in memory, unlock/lock/initOnRegistration/tryAutoUnlock
- [x] `HttpEncryptionAdapter.ts` — API calls for encryption key CRUD
- [x] Add `EncryptionPort` to ports + container

**Frontend — Auth Integration**

- [x] Wire vault.unlock() into login flow
- [x] Wire vault.initOnRegistration() into registration flow
- [x] Wire vault.lock() into logout flow
- [x] Wire vault.tryAutoUnlock() into checkSession (app mount)

**Frontend — File Operations**

- [x] Encrypt files before upload (HttpFileAdapter)
- [x] Decrypt files on download (fetch + decrypt + Blob URL)
- [x] Skip thumbnail generation for encrypted files (backend)
- [x] Client-side thumbnail generation for encrypted files (canvas API)

**Frontend — UI**

- [x] Unlock vault prompt (shown when sessionStorage has no cached password)
- [x] Password change flow (re-encrypt DEK with new KEK)
- [x] Registration page (wire authStore.register + vault init)

## Semana 2 — Polish

- [x] Preview de imágenes
- [x] Carpetas (crear, navegar, eliminar)
- [x] Descargar archivos
- [x] Manejo de errores con UI copada
- [x] Responsive mobile

## Semana 3 — UX & Features

### Slice 0: Loading & Feedback

- [x] Error handling — try/catch + notify on file delete, folder delete, folder create, trash ops
- [x] Download loading state — disable button + show spinner during fetch+decrypt
- [x] Trash item loading — disable restore/delete buttons during operation
- [x] App mount skeleton — show full-screen skeleton while checkSession resolves

### Slice 1: Sorting & Search

- [x] 1a. Sorting — wire `sort` ref in store `allItems`, dropdown UI on Sort button (name/size/date/type, asc/desc)
- [x] 1b. Search — global backend search (`GET /api/search?q=`), debounced, shows all matches with path

### Slice 2: List View & Bulk Operations

- [x] 2a. List view — compact row template (icon, name, size, date), persist viewMode to localStorage
- [x] 2b. Bulk operations — action bar (delete, move, clear), `PATCH /files/:id` backend endpoint, Shift+click range select

### Slice 3: Keyboard Shortcuts & Folder Download

- [x] 3a. Keyboard shortcuts — Del (delete), Enter (preview), Esc (clear/close), Ctrl+A (select all), Ctrl+U (upload)
- [x] 3b. Folder download — `GET /folders/:id/download` backend zip endpoint, frontend "Download" on FolderCard menu

### Slice 4: Drag Features

- [ ] 4a. Drag files to folders — dragstart on FileCard, dragover/drop on FolderCard, move via API, visual highlight
- [ ] 4b. Drag-to-upload to folder — detect external drops on FolderCard, upload directly to that folder

## Commands

```bash
# Backend
bun run dev

# Frontend
bun run dev

# R2 Console
# https://dash.cloudflare.com > R2

## Variables de entorno

```env
# backend/.env
DATABASE_URL="postgresql://..."
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=trashvault
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

## MinIO Setup (sin Docker)

```bash
# Instalar
brew install minio/stable/minio

# Correr
minio server ./data --console-address ":9001"
```

## Variables de entorno

```env
# backend/.env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=trashvault
```
