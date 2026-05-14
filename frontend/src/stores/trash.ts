import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FileItem, Folder } from '@/domain/types'
import { useTrashService } from '@/services'
import { useNotificationStore } from '@/stores/notification'

export const useTrashStore = defineStore('trash', () => {
  const files = ref<FileItem[]>([])
  const folders = ref<Folder[]>([])
  const isLoading = ref(false)
  const loadingIds = ref<Set<string>>(new Set())
  const isEmptying = ref(false)

  const trashService = useTrashService()
  const notify = useNotificationStore()

  async function loadTrash() {
    isLoading.value = true
    try {
      const data = await trashService.getTrash()
      files.value = data.files
      folders.value = data.folders
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load trash'
      notify.error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function restoreFile(id: string) {
    loadingIds.value.add(id)
    try {
      await trashService.restoreFile(id)
      files.value = files.value.filter((f) => f.id !== id)
      notify.success('File restored')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore file'
      notify.error(message)
    } finally {
      loadingIds.value.delete(id)
    }
  }

  async function restoreFolder(id: string) {
    loadingIds.value.add(id)
    try {
      await trashService.restoreFolder(id)
      folders.value = folders.value.filter((f) => f.id !== id)
      notify.success('Folder restored')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore folder'
      notify.error(message)
    } finally {
      loadingIds.value.delete(id)
    }
  }

  async function permanentDeleteFile(id: string) {
    loadingIds.value.add(id)
    try {
      await trashService.permanentDeleteFile(id)
      files.value = files.value.filter((f) => f.id !== id)
      notify.success('File permanently deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file'
      notify.error(message)
    } finally {
      loadingIds.value.delete(id)
    }
  }

  async function permanentDeleteFolder(id: string) {
    loadingIds.value.add(id)
    try {
      await trashService.permanentDeleteFolder(id)
      folders.value = folders.value.filter((f) => f.id !== id)
      notify.success('Folder permanently deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete folder'
      notify.error(message)
    } finally {
      loadingIds.value.delete(id)
    }
  }

  async function emptyTrash() {
    isEmptying.value = true
    try {
      await trashService.emptyTrash()
      files.value = []
      folders.value = []
      notify.success('Trash emptied')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to empty trash'
      notify.error(message)
    } finally {
      isEmptying.value = false
    }
  }

  return {
    files,
    folders,
    isLoading,
    loadingIds,
    isEmptying,
    loadTrash,
    restoreFile,
    restoreFolder,
    permanentDeleteFile,
    permanentDeleteFolder,
    emptyTrash,
  }
})
