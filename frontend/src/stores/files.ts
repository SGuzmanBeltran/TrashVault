import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileItem, Folder, Breadcrumb, SortConfig, SortField } from '@/domain/types'
import { useFileService, useFolderService, useSearchService } from '@/services'
import { useNotificationStore } from '@/stores/notification'

const SEARCH_DEBOUNCE_MS = 300

export const useFileStore = defineStore('files', () => {
  const files = ref<FileItem[]>([])
  const folders = ref<Folder[]>([])
  const searchResults = ref<{ files: FileItem[]; folders: Folder[] } | null>(null)
  const currentFolderId = ref<string | null>(null)
  const breadcrumbs = ref<Breadcrumb[]>([{ id: null, name: 'My Files' }])
  const isLoading = ref(false)
  const isSearching = ref(false)
  const selectedFiles = ref<Set<string>>(new Set())
  const selectedFolders = ref<Set<string>>(new Set())
  const sort = ref<SortConfig>({ field: 'name', direction: 'asc' })
  const searchQuery = ref('')

  const fileService = useFileService()
  const folderService = useFolderService()
  const searchService = useSearchService()
  const notify = useNotificationStore()

  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  let searchRequestId = 0

  const isSearchActive = computed(() => searchQuery.value.trim().length > 0)

  function sortItems<T extends Folder | FileItem>(
    items: T[],
    field: SortField,
    direction: SortConfig['direction'],
    kind: 'folder' | 'file',
  ): T[] {
    const mult = direction === 'asc' ? 1 : -1

    return [...items].sort((a, b) => {
      let cmp = 0

      switch (field) {
        case 'name':
          cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          break
        case 'size':
          cmp =
            kind === 'file'
              ? (a as FileItem).size - (b as FileItem).size
              : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          break
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'mimeType':
          cmp =
            kind === 'file'
              ? (a as FileItem).mimeType.localeCompare((b as FileItem).mimeType)
              : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          break
      }

      return cmp * mult
    })
  }

  const allItems = computed(() => {
    const { field, direction } = sort.value
    const source = isSearchActive.value && searchResults.value
      ? searchResults.value
      : { folders: folders.value, files: files.value }

    return {
      folders: sortItems(source.folders, field, direction, 'folder'),
      files: sortItems(source.files, field, direction, 'file'),
    }
  })

  function setSort(field: SortField) {
    if (sort.value.field === field) {
      sort.value = {
        field,
        direction: sort.value.direction === 'asc' ? 'desc' : 'asc',
      }
    } else {
      sort.value = {
        field,
        direction: field === 'createdAt' ? 'desc' : 'asc',
      }
    }
  }

  function scheduleSearch() {
    if (searchTimeout) clearTimeout(searchTimeout)

    const query = searchQuery.value.trim()
    if (!query) {
      searchResults.value = null
      isSearching.value = false
      return
    }

    isSearching.value = true
    searchTimeout = setTimeout(() => {
      void performSearch()
    }, SEARCH_DEBOUNCE_MS)
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
    scheduleSearch()
  }

  function clearSearch() {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchQuery.value = ''
    searchResults.value = null
    isSearching.value = false
    searchRequestId++
  }

  async function performSearch() {
    const query = searchQuery.value.trim()
    if (!query) {
      searchResults.value = null
      isSearching.value = false
      return
    }

    const requestId = ++searchRequestId
    isSearching.value = true

    try {
      const result = await searchService.search(query)
      if (requestId !== searchRequestId) return
      searchResults.value = result
    } catch (error) {
      if (requestId !== searchRequestId) return
      const message = error instanceof Error ? error.message : 'Search failed'
      notify.error(message)
      searchResults.value = { files: [], folders: [] }
    } finally {
      if (requestId === searchRequestId) {
        isSearching.value = false
      }
    }
  }

  function removeFromSearchResults(fileId?: string, folderId?: string) {
    if (!searchResults.value) return
    if (fileId) {
      searchResults.value.files = searchResults.value.files.filter((file) => file.id !== fileId)
    }
    if (folderId) {
      searchResults.value.folders = searchResults.value.folders.filter((folder) => folder.id !== folderId)
    }
  }

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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load folder'
      notify.error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function navigateToFolder(folderId: string | null, name: string) {
    clearSearch()

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

  async function openFolderFromSearch(folderId: string) {
    clearSearch()

    const chain: Breadcrumb[] = []
    let currentId: string | null = folderId
    const visited = new Set<string>()

    while (currentId) {
      if (visited.has(currentId)) break
      visited.add(currentId)

      const folder = await folderService.getFolder(currentId)
      chain.unshift({ id: folder.id, name: folder.name })
      currentId = folder.parentId
    }

    breadcrumbs.value = [{ id: null, name: 'My Files' }, ...chain]
    await loadFolder(folderId)
  }

  async function createFolder(name: string) {
    try {
      const newFolder = await folderService.createFolder(name, currentFolderId.value)
      folders.value.push(newFolder)
      return newFolder
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder'
      notify.error(message)
      throw error
    }
  }

  async function uploadFile(file: File) {
    try {
      await fileService.uploadFile(file, currentFolderId.value)
      await loadFolder(currentFolderId.value)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      throw new Error(message)
    }
  }

  async function deleteFile(id: string) {
    try {
      await fileService.deleteFile(id)
      files.value = files.value.filter((f) => f.id !== id)
      removeFromSearchResults(id)
      selectedFiles.value.delete(id)
      notify.success('File moved to trash')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file'
      notify.error(message)
    }
  }

  async function deleteFolder(id: string) {
    try {
      await folderService.deleteFolder(id)
      folders.value = folders.value.filter((f) => f.id !== id)
      removeFromSearchResults(undefined, id)
      selectedFolders.value.delete(id)
      notify.success('Folder moved to trash')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete folder'
      notify.error(message)
    }
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
    searchResults,
    currentFolderId,
    breadcrumbs,
    isLoading,
    isSearching,
    isSearchActive,
    selectedFiles,
    selectedFolders,
    sort,
    searchQuery,
    allItems,
    loadFolder,
    navigateToFolder,
    openFolderFromSearch,
    createFolder,
    uploadFile,
    deleteFile,
    deleteFolder,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    setSort,
    setSearchQuery,
    clearSearch,
    performSearch,
  }
})
