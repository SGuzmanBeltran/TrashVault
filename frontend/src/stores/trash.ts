import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FileItem, Folder } from '@/domain/types'
import { useTrashService } from '@/services'
import { toast } from 'vue-sonner'

export const useTrashStore = defineStore('trash', () => {
  const files = ref<FileItem[]>([])
  const folders = ref<Folder[]>([])
  const isLoading = ref(false)

  const trashService = useTrashService()

  async function loadTrash() {
    isLoading.value = true
    try {
      const data = await trashService.getTrash()
      files.value = data.files
      folders.value = data.folders
    } finally {
      isLoading.value = false
    }
  }

  async function restoreFile(id: string) {
    await trashService.restoreFile(id)
    files.value = files.value.filter((f) => f.id !== id)
    toast.success('File restored')
  }

  async function restoreFolder(id: string) {
    await trashService.restoreFolder(id)
    folders.value = folders.value.filter((f) => f.id !== id)
    toast.success('Folder restored')
  }

  async function permanentDeleteFile(id: string) {
    await trashService.permanentDeleteFile(id)
    files.value = files.value.filter((f) => f.id !== id)
    toast.success('File permanently deleted')
  }

  async function permanentDeleteFolder(id: string) {
    await trashService.permanentDeleteFolder(id)
    folders.value = folders.value.filter((f) => f.id !== id)
    toast.success('Folder permanently deleted')
  }

  async function emptyTrash() {
    await trashService.emptyTrash()
    files.value = []
    folders.value = []
    toast.success('Trash emptied')
  }

  return {
    files,
    folders,
    isLoading,
    loadTrash,
    restoreFile,
    restoreFolder,
    permanentDeleteFile,
    permanentDeleteFolder,
    emptyTrash,
  }
})
