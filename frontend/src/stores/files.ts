import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileItem, Folder, Breadcrumb, SortConfig } from '@/domain/types'
import { useFileService, useFolderService } from '@/services'

export const useFileStore = defineStore('files', () => {
  const files = ref<FileItem[]>([])
  const folders = ref<Folder[]>([])
  const currentFolderId = ref<string | null>(null)
  const breadcrumbs = ref<Breadcrumb[]>([{ id: null, name: 'My Files' }])
  const isLoading = ref(false)
  const selectedFiles = ref<Set<string>>(new Set())
  const selectedFolders = ref<Set<string>>(new Set())
  const sort = ref<SortConfig>({ field: 'name', direction: 'asc' })
  const searchQuery = ref('')

  const fileService = useFileService()
  const folderService = useFolderService()

  const allItems = computed(() => {
    const q = searchQuery.value.toLowerCase()
    const filteredFolders = q
      ? folders.value.filter((f) => f.name.toLowerCase().includes(q))
      : folders.value
    const filteredFiles = q
      ? files.value.filter((f) => f.name.toLowerCase().includes(q))
      : files.value
    return { folders: filteredFolders, files: filteredFiles }
  })

  async function loadFolder(folderId: string | null) {
    isLoading.value = true
    try {
      currentFolderId.value = folderId
      const [f, fi] = await Promise.all([
        folderService.listFolders(folderId),
        fileService.listFiles(folderId),
      ])
      folders.value = f
      files.value = fi
    } finally {
      isLoading.value = false
    }
  }

  async function navigateToFolder(folderId: string | null, name: string) {
    if (folderId === null) {
      breadcrumbs.value = [{ id: null, name: 'My Files' }]
    } else {
      const existing = breadcrumbs.value.findIndex((b) => b.id === folderId)
      if (existing >= 0) {
        breadcrumbs.value = breadcrumbs.value.slice(0, existing + 1)
      } else {
        breadcrumbs.value.push({ id: folderId, name })
      }
    }
    await loadFolder(folderId)
  }

  async function createFolder(name: string) {
    const newFolder = await folderService.createFolder(name, currentFolderId.value)
    folders.value.push(newFolder)
    return newFolder
  }

  async function deleteFile(id: string) {
    await fileService.deleteFile(id)
    files.value = files.value.filter((f) => f.id !== id)
    selectedFiles.value.delete(id)
  }

  async function deleteFolder(id: string) {
    await folderService.deleteFolder(id)
    folders.value = folders.value.filter((f) => f.id !== id)
    selectedFolders.value.delete(id)
  }

  function toggleFileSelection(id: string) {
    if (selectedFiles.value.has(id)) {
      selectedFiles.value.delete(id)
    } else {
      selectedFiles.value.add(id)
    }
  }

  function toggleFolderSelection(id: string) {
    if (selectedFolders.value.has(id)) {
      selectedFolders.value.delete(id)
    } else {
      selectedFolders.value.add(id)
    }
  }

  function clearSelection() {
    selectedFiles.value.clear()
    selectedFolders.value.clear()
  }

  return {
    files,
    folders,
    currentFolderId,
    breadcrumbs,
    isLoading,
    selectedFiles,
    selectedFolders,
    sort,
    searchQuery,
    allItems,
    loadFolder,
    navigateToFolder,
    createFolder,
    deleteFile,
    deleteFolder,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
  }
})
