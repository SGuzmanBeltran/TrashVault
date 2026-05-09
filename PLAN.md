# TrashVault Enhancement Plan

## Phase 1: Upload Progress Panel (Google Drive-style)

Replace per-file toast notifications with a persistent, collapsible panel in the bottom-right
that shows all active and completed uploads.

**Backend:** No changes needed.

### Tasks

- [ ] Create `frontend/src/lib/xhr-upload.ts`
  - `uploadWithProgress(file, folderId, onProgress)` — XMLHttpRequest wrapper with `upload.onprogress`, sends FormData, `withCredentials: true`
- [ ] Create `frontend/src/composables/useUploadQueue.ts`
  - Reactive `UploadItem[]` state: `{ id, file, status, progress, error }`
  - Methods: `addUpload()`, `cancelUpload()`, `retryUpload()`, `clearCompleted()`
- [ ] Create `frontend/src/components/UploadProgressItem.vue`
  - File icon/name, animated progress bar, cancel button, status (uploading/complete/failed)
- [ ] Create `frontend/src/components/UploadPanel.vue`
  - Fixed bottom-right collapsible drawer; header shows active count; auto-expands on new upload; completed items auto-dismiss after 5s
- [ ] Update `frontend/src/ports/index.ts` — add `uploadFileWithProgress` to `FilePort`
- [ ] Update `frontend/src/adapters/HttpFileAdapter.ts` — add `uploadFileWithProgress(file, folderId, onProgress)` method
- [ ] Update `frontend/src/stores/files.ts` — remove direct toast calls from `uploadFile()`, delegate to UploadQueue
- [ ] Update `frontend/src/pages/FilesPage.vue` — use `uploadQueue.addUpload()` instead of `fileStore.uploadFile()`
- [ ] Update `frontend/src/App.vue` — mount `<UploadPanel />` alongside `<Toaster />`

---

## Phase 2: Image and Video Thumbnails

Replace generic file-type icons with real thumbnail images for image/video files in
FileCard and FileDetailPage.

**Backend dependencies:** `sharp`, system `ffmpeg`.  
**DB migration:** add `thumbnail_key` column to `files` table.

### Tasks

- [ ] Install backend dependencies: `bun add sharp`, `bun add -d @types/sharp`
- [ ] Update `backend/src/db/schema.ts` — add `thumbnailKey: text('thumbnail_key')` (nullable) to `files` table
- [ ] Update `backend/src/ports/repository/FileRepository.port.ts` — add `thumbnailKey?` to create params
- [ ] Update `backend/src/adapters/repository/DrizzleFileRepository.adapter.ts` — persist `thumbnailKey`
- [ ] Create `backend/src/services/ThumbnailService.service.ts`
  - `generateImageThumbnail(buffer, mimeType)` — Sharp resize to 300px max, JPEG q80, strip EXIF
  - `generateVideoThumbnail(buffer)` — spawn `ffmpeg -i pipe:0 -ss 00:00:01 -vframes 1 -f image2pipe pipe:1`
  - `getThumbnailKey(fileKey)` — convention: `files/` → `thumbnails/`, extension → `.jpg`
- [ ] Update `backend/src/services/FileService.service.ts`
  - Add `getThumbnailUrl(id, userId)` — returns signed URL for thumbnail
  - `createFile()` — generate thumbnail synchronously during upload; log warning on failure, don't block
- [ ] Update `backend/src/infrastructure/http/FileRoutes.infra.ts`
  - Update `POST /files/upload` — trigger thumbnail generation
  - Add `GET /files/:id/thumbnail` — returns `{ url }` or 404
- [ ] Run DB migration: `bunx drizzle-kit generate && bunx drizzle-kit migrate`
- [ ] Update `frontend/src/ports/index.ts` — add `getThumbnailUrl(id)` to `FilePort`
- [ ] Update `frontend/src/adapters/HttpFileAdapter.ts` — implement `getThumbnailUrl(id)`
- [ ] Update `frontend/src/domain/types.ts` — add `thumbnailKey?: string | null` to `FileItem`
- [ ] Update `frontend/src/components/FileCard.vue` — replace icon with `<img>` for image/video; lazy loading; fallback to icon on error; video play-icon overlay
- [ ] Update `frontend/src/pages/FileDetailPage.vue` — show thumbnail for image/video files in preview area

---

## Phase 3: Drag-and-Drop Download

Users drag FileCards out of the browser to desktop/Finder to download.

**Backend:** No changes needed.

### Tasks

- [ ] Update `frontend/src/components/FileCard.vue`
  - Add `draggable="true"` to root element
  - Cache `downloadUrl` ref (prefetched on `mousedown`, which fires before `dragstart`)
  - `@dragstart`: `effectAllowed='copy'`, `setData('DownloadURL', 'mimeType:name:url')`
  - `@dragend`: reset visual state
  - Subtle drag indicator (opacity reduction, accent ring)
- [ ] Update `frontend/src/pages/FileDetailPage.vue` — make preview area draggable

---

## Dependencies Between Phases

None — all three phases are independent.

| Phase | Complexity | Backend | Frontend |
|-------|-----------|---------|----------|
| 1. Upload Progress Panel | Medium | None | 9 tasks |
| 2. Thumbnails | High | 7 tasks | 5 tasks |
| 3. Drag-and-Drop Download | Low | None | 2 tasks |
