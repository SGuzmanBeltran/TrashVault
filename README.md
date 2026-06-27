# TrashVault

A self-hosted, Google Drive-like file storage application built with modern web technologies.

## Overview

TrashVault is a personal cloud storage solution that lets you upload, organize, and download files through a clean web interface. Files are stored in S3-compatible object storage (Cloudflare R2 or MinIO) while metadata lives in PostgreSQL.

## Tech Stack


| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Runtime  | Bun                                    |
| Backend  | Elysia (TypeScript)                    |
| Frontend | Vue 3 + Vite + Pinia + Vue Router      |
| Database | PostgreSQL + Drizzle ORM               |
| Storage  | Cloudflare R2 (S3-compatible) or MinIO |
| Auth     | Better Auth                            |




## Project Structure

```
trashvault/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # App entrypoint
│   │   ├── infrastructure/
│   │   │   ├── di/container.ts      # Dependency injection container
│   │   │   └── http/                # Elysia routes & auth plugin
│   │   ├── services/                # Business logic
│   │   ├── ports/                   # Repository & storage interfaces
│   │   ├── adapters/                # Repository & storage implementations
│   │   └── db/                      # Drizzle schema & connection
│   ├── package.json
│   ├── drizzle.config.ts
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.vue
│   │   ├── router/
│   │   └── stores/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── TODO.md
└── README.md
```



## Backend Architecture

The backend follows **Hexagonal / Ports-and-Adapters** architecture:

- **Ports** (`src/ports/`) — define interfaces for repositories and storage
- **Adapters** (`src/adapters/`) — implement those interfaces (Drizzle repositories, S3/MinIO storage)
- **Services** (`src/services/`) — contain pure business logic
- **Infrastructure** (`src/infrastructure/`) — wires everything together via a manual DI container and exposes HTTP routes



## API Endpoints


| Method | Path                  | Description             |
| ------ | --------------------- | ----------------------- |
| POST   | `/files/upload`       | Upload a file           |
| GET    | `/files`              | List files              |
| GET    | `/files/:id`          | Get file metadata       |
| GET    | `/files/:id/download` | Get signed download URL |
| DELETE | `/files/:id`          | Delete a file           |
| POST   | `/folders`            | Create a folder         |
| GET    | `/folders`            | List folders            |
| DELETE | `/folders/:id`        | Delete a folder         |




## Database Schema



### files


| Column    | Type        | Notes          |
| --------- | ----------- | -------------- |
| id        | text (uuid) | Primary key    |
| userId    | text        | Owner          |
| name      | text        | File name      |
| mimeType  | text        | MIME type      |
| size      | integer     | Size in bytes  |
| bucket    | text        | Storage bucket |
| key       | text        | S3 object key  |
| folderId  | text        | null           |
| createdAt | integer     | Unix timestamp |




### folders


| Column    | Type        | Notes          |
| --------- | ----------- | -------------- |
| id        | text (uuid) | Primary key    |
| userId    | text        | Owner          |
| name      | text        | Folder name    |
| parentId  | text        | null           |
| createdAt | integer     | Unix timestamp |




## Getting Started



### Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL database
- Cloudflare R2 account (or local MinIO)



### Backend

```bash
cd backend
bun install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/trashvault"
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=trashvault
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

Run migrations:

```bash
bunx drizzle-kit migrate
```

Start the dev server:

```bash
bun run dev
```

The API will be available at `http://localhost:3000`.

### Frontend

```bash
cd frontend
bun install
bun run dev
```

The dev server will start (default Vite port `5173`).

### Local MinIO (Alternative Storage)

If you prefer local object storage instead of R2:

```bash
brew install minio/stable/minio
minio server ./data --console-address ":9001"
```

Update `backend/.env`:

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=trashvault
```



## Scripts


| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `bun run dev`               | Start backend dev server with hot reload |
| `bunx drizzle-kit generate` | Generate Drizzle migrations              |
| `bunx drizzle-kit migrate`  | Run Drizzle migrations                   |
| `bun run test:unit`         | Run frontend unit tests (Vitest)         |
| `bun run lint`              | Run frontend linting (oxlint + eslint)   |
| `bun run build`             | Build frontend for production            |




## Roadmap

See [TODO.md](./TODO.md) for the full backlog. Highlights:

- [x] File upload / download / list / delete API
- [x] Folder management API
- [x] Authentication (Better Auth)
- [x] Frontend login & file browser
- [x] Drag & drop uploads
- [x] Client-side zero-trust encryption
- [x] Image/video/PDF previews
- [x] Mobile responsive UI
- [x] Loading & feedback improvements (spinners, error handling, skeletons)
- [x] Sorting & search
- [x] List view & bulk operations (multi-select, move, delete)
- [x] Keyboard shortcuts
- [x] Folder download (zip)
- [x] Drag files to folders (move) & drag-to-upload to specific folder



## License

MIT