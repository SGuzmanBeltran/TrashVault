import { ref, computed } from 'vue'
import { useFileService } from '@/services'
import { useFileStore } from '@/stores/files'
import { useNotificationStore } from '@/stores/notification'
import { useUploadConflict, type UploadConflictAction } from '@/composables/useUploadConflict'
import { uniqueFileName } from '@/lib/unique-file-name'
import {
  isFileWithinSizeLimit,
  fileSizeLimitMessage,
  MAX_UPLOAD_FILE_COUNT,
  uploadCountLimitMessage,
} from '@/lib/upload-limits'
import type { FileItem } from '@/domain/types'
import type { UploadOptions } from '@/ports'

interface UploadItem {
  id: string
  file: File
  status: 'uploading' | 'completed' | 'failed'
  progress: number
  result?: FileItem
  error?: string
  aborter?: AbortController
}

interface UploadEntry {
  file: File
  folderId: string | null
}

const uploads = ref<UploadItem[]>([])
let idCounter = 0

export function useUploadQueue() {
  const fileService = useFileService()
  const fileStore = useFileStore()
  const notify = useNotificationStore()
  const conflict = useUploadConflict()

  const activeCount = computed(() =>
    uploads.value.filter((u) => u.status === 'uploading').length,
  )

  const hasUploads = computed(() => uploads.value.length > 0)

  async function getFolderFiles(
    folderId: string | null,
    cache: Map<string | null, FileItem[]>,
  ): Promise<FileItem[]> {
    if (!cache.has(folderId)) {
      if (folderId === fileStore.currentFolderId && !fileStore.isSearchActive) {
        cache.set(folderId, [...fileStore.files])
      } else {
        cache.set(folderId, await fileService.listFiles(folderId))
      }
    }
    return cache.get(folderId)!
  }

  function startUpload(
    file: File,
    folderId: string | null,
    options?: UploadOptions,
    cache?: Map<string | null, FileItem[]>,
    replaceExisting?: FileItem,
  ): string {
    const id = `upload-${++idCounter}`
    const aborter = new AbortController()

    const item: UploadItem = {
      id,
      file,
      status: 'uploading',
      progress: 0,
      aborter,
    }

    uploads.value.push(item)

    fileService
      .uploadFileWithProgress(file, folderId, {
        onProgress: (progress) => {
          const found = uploads.value.find((u) => u.id === id)
          if (found) found.progress = progress
        },
        signal: aborter.signal,
      }, options)
      .then((result) => {
        const found = uploads.value.find((u) => u.id === id)
        if (found) {
          found.status = 'completed'
          found.result = result
          found.progress = 100
        }

        if (cache) {
          const list = cache.get(folderId)
          if (list) {
            if (replaceExisting) {
              const idx = list.findIndex((f) => f.id === replaceExisting.id)
              if (idx >= 0) list[idx] = result
            } else {
              list.push(result)
            }
          }
        }

        fileStore.upsertUploadedFile(result, folderId)
        setTimeout(() => {
          uploads.value = uploads.value.filter((u) => u.id !== id)
        }, 5000)
      })
      .catch((error) => {
        const found = uploads.value.find((u) => u.id === id)
        if (!found) return
        if (error instanceof Error && error.message === 'Upload cancelled') {
          uploads.value = uploads.value.filter((u) => u.id !== id)
        } else {
          found.status = 'failed'
          found.error = error instanceof Error ? error.message : 'Upload failed'
        }
      })

    return id
  }

  function filterUploadEntries(entries: UploadEntry[]): UploadEntry[] {
    let accepted = entries

    if (entries.length > MAX_UPLOAD_FILE_COUNT) {
      notify.error(uploadCountLimitMessage())
      accepted = entries.slice(0, MAX_UPLOAD_FILE_COUNT)
    }

    const valid: UploadEntry[] = []
    for (const entry of accepted) {
      if (!isFileWithinSizeLimit(entry.file)) {
        notify.error(fileSizeLimitMessage(entry.file.name))
      } else {
        valid.push(entry)
      }
    }

    return valid
  }

  async function addUploads(entries: UploadEntry[]) {
    if (entries.length === 0) return

    const validEntries = filterUploadEntries(entries)
    if (validEntries.length === 0) return

    const cache = new Map<string | null, FileItem[]>()
    let batchPolicy: UploadConflictAction | null = null

    const conflictIndices: number[] = []
    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i]!
      const folderFiles = await getFolderFiles(entry.folderId, cache)
      if (folderFiles.some((f) => f.name === entry.file.name)) {
        conflictIndices.push(i)
      }
    }

    let conflictHandled = 0

    for (const entry of validEntries) {
      let { file, folderId } = entry
      const folderFiles = await getFolderFiles(folderId, cache)
      const existing = folderFiles.find((f) => f.name === file.name)

      if (existing) {
        let action: UploadConflictAction
        if (batchPolicy) {
          action = batchPolicy
        } else {
          const result = await conflict.askConflict({
            fileName: file.name,
            remainingCount: conflictIndices.length - conflictHandled - 1,
          })
          action = result.action
          if (result.applyToAll) batchPolicy = action
        }
        conflictHandled++

        if (action === 'skip') continue

        if (action === 'keepBoth') {
          const names = folderFiles.map((f) => f.name)
          const newName = uniqueFileName(file.name, names)
          file = new File([file], newName, { type: file.type, lastModified: file.lastModified })
          folderFiles.push({
            id: `pending-${file.name}`,
            name: newName,
            mimeType: file.type,
            size: file.size,
            folderId,
            thumbnailKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            trashedAt: null,
          })
          startUpload(file, folderId, undefined, cache)
          continue
        }

        if (action === 'replace') {
          startUpload(file, folderId, { replaceFileId: existing.id }, cache, existing)
          continue
        }
      }

      startUpload(file, folderId, undefined, cache)
      folderFiles.push({
        id: `pending-${file.name}-${Date.now()}`,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        folderId,
        thumbnailKey: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trashedAt: null,
      })
    }
  }

  async function addUpload(file: File, folderId?: string | null) {
    await addUploads([{ file, folderId: folderId ?? fileStore.currentFolderId }])
  }

  function cancelUpload(id: string) {
    const item = uploads.value.find((u) => u.id === id)
    if (item && item.status === 'uploading') {
      item.aborter?.abort()
      uploads.value = uploads.value.filter((u) => u.id !== id)
    } else {
      uploads.value = uploads.value.filter((u) => u.id !== id)
    }
  }

  function retryUpload(id: string) {
    const item = uploads.value.find((u) => u.id === id)
    if (item && item.status === 'failed') {
      uploads.value = uploads.value.filter((u) => u.id !== id)
      void addUpload(item.file)
    }
  }

  function clearCompleted() {
    uploads.value = uploads.value.filter((u) => u.status !== 'completed')
  }

  function dismiss(id: string) {
    uploads.value = uploads.value.filter((u) => u.id !== id)
  }

  return {
    uploads,
    activeCount,
    hasUploads,
    addUpload,
    addUploads,
    cancelUpload,
    retryUpload,
    clearCompleted,
    dismiss,
  }
}
