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
- [ ] Frontend: login + navegador de archivos
- [ ] Upload de archivos (drag & drop)

### Zero-Trust Encryption

- [ ] Auth con password (Better Auth) — misma password para login y KEK
- [ ] Client-side encryption: derivar KEK de la password (PBKDF2/Argon2)
- [ ] Arquitectura KEK + DEK: password descifra la DEK, la DEK encripta los archivos
- [ ] Encriptar archivos en el browser antes de subir
- [ ] Almacenar solo bytes cifrados en MinIO/R2
- [ ] Descifrar en el cliente al descargar
- [ ] Re-encriptar DEK al cambiar password (sin tocar los archivos)
- [ ] Nota: la misma password hace auth (server) y crypto (cliente), pero de formas distintas (hash vs PBKDF2). Si olvida la password, pierde los datos.

## Semana 2 — Polish

- [ ] Preview de imágenes
- [ ] Carpetas (crear, navegar, eliminar)
- [ ] Descargar archivos
- [ ] Manejo de errores con UI copada
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
