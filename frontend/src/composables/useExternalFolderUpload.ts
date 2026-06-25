import { useUploadQueue } from '@/composables/useUploadQueue'
import { useFolderService } from '@/services'
import { useFileStore } from '@/stores/files'
import { useNotificationStore } from '@/stores/notification'
import { isInternalFileDrag } from '@/lib/file-drag'

function isHiddenPath(path: string): boolean {
  return path.split('/').some((segment) => segment.startsWith('.'))
}

async function readDirectoryEntries(
  entry: FileSystemDirectoryEntry,
): Promise<{ file: File; path: string }[]> {
  const reader = entry.createReader()
  const allEntries: { file: File; path: string }[] = []

  async function readBatch(): Promise<void> {
    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject)
    })

    if (entries.length === 0) return

    for (const e of entries) {
      if (e.name.startsWith('.')) continue

      if (e.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
          (e as FileSystemFileEntry).file(resolve, reject)
        })
        const path = e.fullPath.replace(/^\//, '')
        allEntries.push({ file, path })
      } else if (e.isDirectory) {
        const nested = await readDirectoryEntries(e as FileSystemDirectoryEntry)
        allEntries.push(...nested)
      }
    }

    await readBatch()
  }

  await readBatch()
  return allEntries
}

export function useExternalFolderUpload() {
  const uploadQueue = useUploadQueue()
  const folderService = useFolderService()
  const fileStore = useFileStore()
  const notify = useNotificationStore()

  async function processFolderUpload(
    entries: { file: File; path: string }[],
    parentFolderId: string | null,
  ) {
    const folderPaths = new Set<string>()

    for (const { path } of entries) {
      const parts = path.split('/')
      for (let i = 1; i < parts.length; i++) {
        folderPaths.add(parts.slice(0, i).join('/'))
      }
    }

    const sorted = Array.from(folderPaths).sort(
      (a, b) => a.split('/').length - b.split('/').length,
    )

    const pathToId = new Map<string, string>()

    for (const path of sorted) {
      const parts = path.split('/')
      const name = parts[parts.length - 1]!
      const parentPath = parts.slice(0, -1).join('/')
      const parentId = parentPath ? pathToId.get(parentPath) ?? parentFolderId : parentFolderId

      try {
        const folder = await folderService.createFolder(name, parentId)
        pathToId.set(path, folder.id)
        fileStore.addCreatedFolder(folder)
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to create folder "${name}"`
        notify.error(message)
        return
      }
    }

    const uploadEntries = entries.map(({ file, path }) => {
      const parts = path.split('/')
      const folderPath = parts.slice(0, -1).join('/')
      const folderId = pathToId.get(folderPath) ?? parentFolderId
      return { file, folderId }
    })
    await uploadQueue.addUploads(uploadEntries)
  }

  async function uploadExternalDrop(event: DragEvent, targetFolderId: string | null) {
    if (isInternalFileDrag(event)) return

    const items = event.dataTransfer?.items
    if (!items || items.length === 0) return

    const entries: FileSystemEntry[] = []
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) entries.push(entry)
    }

    const hasDirectories = entries.some((e) => e.isDirectory)

    if (hasDirectories) {
      const allEntries: { file: File; path: string }[] = []
      for (const entry of entries) {
        if (entry.isDirectory) {
          const files = await readDirectoryEntries(entry as FileSystemDirectoryEntry)
          allEntries.push(...files)
        } else if (entry.isFile) {
          const file = await new Promise<File>((resolve, reject) => {
            (entry as FileSystemFileEntry).file(resolve, reject)
          })
          allEntries.push({ file, path: file.name })
        }
      }
      await processFolderUpload(
        allEntries.filter(({ path }) => !isHiddenPath(path)),
        targetFolderId,
      )
      return
    }

    const droppedFiles = event.dataTransfer?.files
    if (!droppedFiles) return

    const uploadEntries = Array.from(droppedFiles).map((file) => ({
      file,
      folderId: targetFolderId,
    }))
    await uploadQueue.addUploads(uploadEntries)
  }

  return {
    uploadExternalDrop,
    processFolderUpload,
  }
}
