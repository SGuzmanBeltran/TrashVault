import { ref, computed } from 'vue'
import { useFileService } from '@/services'
import { useFileStore } from '@/stores/files'
import type { FileItem } from '@/domain/types'

interface UploadItem {
  id: string
  file: File
  status: 'uploading' | 'completed' | 'failed'
  progress: number
  result?: FileItem
  error?: string
  aborter?: AbortController
}

const uploads = ref<UploadItem[]>([])
let idCounter = 0

export function useUploadQueue() {
  const fileService = useFileService()
  const fileStore = useFileStore()

  const activeCount = computed(() =>
    uploads.value.filter((u) => u.status === 'uploading').length,
  )

  const hasUploads = computed(() => uploads.value.length > 0)

  function addUpload(file: File): string {
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
      .uploadFileWithProgress(file, fileStore.currentFolderId, {
        onProgress: (progress) => {
          const found = uploads.value.find((u) => u.id === id)
          if (found) found.progress = progress
        },
        signal: aborter.signal,
      })
      .then((result) => {
        const found = uploads.value.find((u) => u.id === id)
        if (found) {
          found.status = 'completed'
          found.result = result
          found.progress = 100
        }
        fileStore.loadFolder(fileStore.currentFolderId)
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
      addUpload(item.file)
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
    cancelUpload,
    retryUpload,
    clearCompleted,
    dismiss,
  }
}
