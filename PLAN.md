# TrashVault — Backend-Frontend Connection Plan

## Context

- **Backend**: Elysia (Bun) with PostgreSQL + Drizzle, file/folder CRUD, auth via Better Auth, R2 storage.
- **Frontend**: Vue 3 + Vite + Pinia + Tailwind, ports-and-adapters DI pattern.
- **Current Gap**: Auth is live. Files, folders, and stats are still mocked.

## Design Decisions

1. **Upload is the highest priority** — Phase 1.
2. **Backend owns UTC timestamps** (integers). Frontend adapters convert them to ISO strings.
3. **`maxBytes` is hardcoded to 5GB** for now.
4. **Folder `fileCount` and `size` are removed** from the `Folder` type — they are unnecessary.
5. **`thumbnailUrl` is removed** from the `FileItem` type — backend does not support it.
6. **Backend routes are mounted under `/api`** to match the Vite proxy.
7. **`apiFetch` utility** is built in Phase 1 (not Phase 4) since all HTTP adapters need it.
8. **Notifications** use `vue-sonner` toast library.

---

## Phase 1: Upload End-to-End (In Progress)

**Goal**: A user can select files from the Files page and upload them to the real backend.

### Backend Tasks

| File | Change |
|---|---|
| `backend/src/index.ts` | Mount `fileRoutes` under `/api/files` and `folderRoutes` under `/api/folders` |
| `backend/src/infrastructure/http/FileRoutes.infra.ts` | Fix Elysia multipart handler — verify `body.file` extraction works correctly |
| `backend/src/db/schema.ts` | Ensure `thumbnailUrl` is removed from `files` table |

### Frontend Tasks

| File | Change |
|---|---|
| `frontend/src/domain/types.ts` | Remove `thumbnailUrl` from `FileItem`; remove `fileCount` and `size` from `Folder` |
| `frontend/src/ports/index.ts` | Add `uploadFile(file: File, folderId: string \| null): Promise<FileItem>` to `FilePort` |
| `frontend/src/lib/api-fetch.ts` | Create shared `fetch` wrapper with `/api` base, `credentials: 'include'`, JSON helpers, 401 redirect |
| `frontend/src/adapters/HttpFileAdapter.ts` | Create adapter implementing `FilePort` with real HTTP calls |
| `frontend/src/stores/files.ts` | Add `uploadFile(file: File)` action with loading state and toast notification on error |
| `frontend/src/pages/FilesPage.vue` | Add hidden file input, wire Upload button, call `fileStore.uploadFile(file)` per selected file |
| `frontend/src/container.ts` | Swap `MockFileAdapter` → `HttpFileAdapter` |

### Dependencies

- Install `vue-sonner` for toast notifications.

### Testing Checklist

1. Log in → navigate to Files.
2. Click Upload → select file(s).
3. Loading state appears during upload.
4. Files appear in current folder after success.
5. Backend has new rows with correct `folderId` (`null` for root).
6. Upload error shows toast notification.
7. No console errors or 401s.

---

## Phase 2: Files & Folders CRUD + Listing

**Goal**: Browse, create, delete files and folders with real data.

### Backend Tasks

| File | Change |
|---|---|
| `backend/src/adapters/repository/DrizzleFileRepository.adapter.ts` | Fix `findByUserId` to return only root-level files when `folderId` is `null` / absent |
| `backend/src/adapters/repository/DrizzleFolderRepository.adapter.ts` | Fix `findByUserId` to return only root-level folders when `parentId` is `null` / absent |

### Frontend Tasks

| File | Change |
|---|---|
| `frontend/src/adapters/HttpFileAdapter.ts` | Add `listFiles`, `getFile`, `deleteFile`, `getDownloadUrl` |
| `frontend/src/adapters/HttpFolderAdapter.ts` | Create adapter: `listFolders`, `getFolder`, `createFolder`, `deleteFolder` |
| `frontend/src/container.ts` | Swap `MockFolderAdapter` → `HttpFolderAdapter` |
| `frontend/src/components/FolderCard.vue` | Remove file count / size display since fields are gone |

### Testing Checklist

1. Root folder shows only root-level files and folders.
2. Navigate into folders shows correct nested items.
3. Create folder works and refreshes list.
4. Delete file / folder works and refreshes list.

---

## Phase 3: Stats & Dashboard

**Goal**: Dashboard and sidebar show real aggregated data.

### Backend Tasks

| File | Change |
|---|---|
| `backend/src/index.ts` | Add `GET /api/stats` route |
| `backend/src/services/StatsService.service.ts` | Create service: count files/folders, sum sizes, return recent files |

### Frontend Tasks

| File | Change |
|---|---|
| `frontend/src/adapters/HttpStatsAdapter.ts` | Create adapter: `getStats()` → `GET /api/stats` |
| `frontend/src/container.ts` | Swap `MockStatsAdapter` → `HttpStatsAdapter` |
| `frontend/src/layouts/AppSidebar.vue` | Wire reactive storage stats from `statsStore` |
| `frontend/src/pages/DashboardPage.vue` | Wire real stats and recent files |

### Testing Checklist

1. Sidebar storage bar reflects actual usage vs 5 GB cap.
2. Dashboard shows correct totals.
3. Recent files list is accurate.

---

## Phase 4: Download & Polish

**Goal**: Users can download files via signed URLs.

### Frontend Tasks

| File | Change |
|---|---|
| `frontend/src/components/FileCard.vue` | Wire Download menu: call `getDownloadUrl`, open in new tab |
| `frontend/src/pages/FileDetailPage.vue` | Wire Download button: same pattern |
| `frontend/src/adapters/*.ts` | Ensure all adapters use `apiFetch` consistently |
| `frontend/src/adapters/Mock*.ts` | Delete mock adapters once all phases are verified |

### Testing Checklist

1. Click Download on a file card → signed URL opens in new tab.
2. Click Download on file detail page → same behavior.
3. Expired URLs are handled gracefully.

---

## Notes

- The Vite proxy is already configured: `/api` proxies to `http://localhost:3000`.
- CORS is configured on the backend for `http://localhost:5173` with credentials.
- Auth cookies flow automatically via `credentials: 'include'`.
- No changes to the existing Pinia store structure or Vue component patterns beyond what is listed.
- `formatBytes(bytes)` in `frontend/src/utils/index.ts` already handles file size display.
