# TrashVault

Google Drive-like, self-hosted.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Bun |
| Backend | Elysia (TypeScript) |
| Storage | MinIO (Docker) |
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
│   │   │   ├── storage/       # MinIO adapter
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
  key: text (MinIO object key)
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

- [ ] API upload/download/list/delete
- [ ] Autenticación simple (Better Auth)
- [ ] Frontend: login + navegador de archivos
- [ ] Upload de archivos (drag & drop)

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

# MinIO console
# http://localhost:9001
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
