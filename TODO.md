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
- [x] Add `isEncrypted` column to `files` table
- [x] `EncryptionKeyRepository` port + Drizzle adapter
- [x] `EncryptionKeyService` (create, get, update)
- [x] `EncryptionKeyRoutes` (POST/GET/PUT `/api/user/encryption-key`)
- [x] Read `isEncrypted` from form data in upload route, store in DB

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

**Frontend — UI**

- [ ] Unlock vault prompt (shown when sessionStorage has no cached password)
- [ ] Password change flow (re-encrypt DEK with new KEK)
- [ ] Registration page (wire authStore.register + vault init)

## Semana 2 — Polish

- [ ] Preview de imágenes
- [x] Carpetas (crear, navegar, eliminar)
- [x] Descargar archivos
- [x] Manejo de errores con UI copada
- [ ] Responsive mobile

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
