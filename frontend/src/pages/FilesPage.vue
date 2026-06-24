<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import {
  ChevronRight,
  Plus,
  Upload,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Check,
  FolderPlus,
  Home,
  UploadCloud,
  FolderUp,
} from 'lucide-vue-next'
import { useFileStore } from '@/stores/files'
import { useUploadQueue } from '@/composables/useUploadQueue'
import { useFolderService } from '@/services'
import { useNotificationStore } from '@/stores/notification'
import FileCard from '@/components/FileCard.vue'
import FolderCard from '@/components/FolderCard.vue'
import FileListRow from '@/components/FileListRow.vue'
import FolderListRow from '@/components/FolderListRow.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import FilePreviewModal from '@/components/FilePreviewModal.vue'
import { loadFileViewMode, saveFileViewMode } from '@/lib/file-view-mode'
import type { FileViewMode, FileItem, SortField } from '@/domain/types'

const fileStore = useFileStore()
const uploadQueue = useUploadQueue()
const folderService = useFolderService()
const notify = useNotificationStore()

const viewMode = ref<FileViewMode>(loadFileViewMode())
const showNewFolder = ref(false)
const newFolderName = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const dragCounter = ref(0)
const isDragging = computed(() => dragCounter.value > 0)
const previewFile = ref<FileItem | null>(null)
const openMenuFileId = ref<string | null>(null)
const showSortMenu = ref(false)
const sortMenuRef = ref<HTMLElement | null>(null)

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'size', label: 'Size' },
  { field: 'createdAt', label: 'Date' },
  { field: 'mimeType', label: 'Type' },
]

const sortLabel = computed(() => {
  const option = sortOptions.find((o) => o.field === fileStore.sort.field)
  return option?.label ?? 'Sort'
})

const isEmptyFolder = computed(
  () =>
    !fileStore.isSearchActive &&
    fileStore.folders.length === 0 &&
    fileStore.files.length === 0,
)

const hasNoSearchResults = computed(
  () =>
    fileStore.isSearchActive &&
    !fileStore.isSearching &&
    fileStore.allItems.folders.length === 0 &&
    fileStore.allItems.files.length === 0,
)

const showContentLoading = computed(
  () => fileStore.isLoading || (fileStore.isSearchActive && fileStore.isSearching),
)

const hasVisibleItems = computed(
  () =>
    fileStore.allItems.folders.length > 0 ||
    fileStore.allItems.files.length > 0,
)

function setViewMode(mode: FileViewMode) {
  viewMode.value = mode
  saveFileViewMode(mode)
}

function sortDirectionLabel(field: SortField): string {
  const { field: activeField, direction } = fileStore.sort
  if (field !== activeField) return ''

  if (field === 'name' || field === 'mimeType') {
    return direction === 'asc' ? 'A → Z' : 'Z → A'
  }
  if (field === 'size') {
    return direction === 'asc' ? 'Smallest first' : 'Largest first'
  }
  return direction === 'asc' ? 'Oldest first' : 'Newest first'
}

function onClickDocument(event: MouseEvent) {
  if (!sortMenuRef.value) return
  if (!sortMenuRef.value.contains(event.target as Node)) {
    showSortMenu.value = false
  }
}

onMounted(() => {
  fileStore.loadFolder(null)
  document.addEventListener('click', onClickDocument)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickDocument)
})

function triggerFileSelect() {
  fileInput.value?.click()
}

function triggerFolderSelect() {
  folderInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFiles = target.files
  if (!selectedFiles) return

  for (const file of selectedFiles) {
    uploadQueue.addUpload(file)
  }

  target.value = ''
}

async function handleFolderSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFiles = target.files
  if (!selectedFiles || selectedFiles.length === 0) return

  const entries = Array.from(selectedFiles)
    .filter((file) => !isHiddenPath(file.webkitRelativePath))
    .map((file) => ({ file, path: file.webkitRelativePath }))

  await processFolderUpload(entries)
  target.value = ''
}

function isHiddenPath(path: string): boolean {
  return path.split('/').some((segment) => segment.startsWith('.'))
}

async function processFolderUpload(entries: { file: File; path: string }[]) {
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
    const parentId = parentPath ? pathToId.get(parentPath) ?? null : fileStore.currentFolderId

    try {
      const folder = await folderService.createFolder(name, parentId)
      pathToId.set(path, folder.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to create folder "${name}"`
      notify.error(message)
      return
    }
  }

  fileStore.loadFolder(fileStore.currentFolderId)

  for (const { file, path } of entries) {
    const parts = path.split('/')
    const folderPath = parts.slice(0, -1).join('/')
    const folderId = pathToId.get(folderPath) ?? fileStore.currentFolderId
    uploadQueue.addUpload(file, folderId)
  }
}

function handleOpenFolder(id: string) {
  if (fileStore.isSearchActive) {
    fileStore.openFolderFromSearch(id)
    return
  }

  const folder = fileStore.folders.find((f) => f.id === id)
  fileStore.navigateToFolder(id, folder?.name ?? 'Folder')
}

function handleBreadcrumb(id: string | null, name: string) {
  fileStore.navigateToFolder(id, name)
}

function handlePreviewFile(file: FileItem) {
  previewFile.value = file
}

async function handleCreateFolder() {
  if (!newFolderName.value.trim()) return
  await fileStore.createFolder(newFolderName.value.trim())
  newFolderName.value = ''
  showNewFolder.value = false
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

function onDragEnter(event: DragEvent) {
  event.preventDefault()
  dragCounter.value++
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function onDragLeave(event: DragEvent) {
  event.preventDefault()
  dragCounter.value--
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  dragCounter.value = 0

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
    await processFolderUpload(allEntries)
  } else {
    const droppedFiles = event.dataTransfer?.files
    if (!droppedFiles) return
    for (const file of droppedFiles) {
      uploadQueue.addUpload(file)
    }
  }
}
</script>

<template>
  <FilePreviewModal
    v-if="previewFile"
    :file="previewFile"
    @close="previewFile = null"
  />
  <div
    class="relative mx-auto min-h-full max-w-5xl space-y-6"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <Transition name="fade">
      <div
        v-if="isDragging"
        class="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-accent/50 bg-surface-raised/80 px-16 py-12">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
            <UploadCloud class="h-8 w-8 text-accent" />
          </div>
          <div class="text-center">
            <p class="text-lg font-medium text-surface-fg">
              Drop files or folders to upload
            </p>
            <p class="mt-1 text-sm text-surface-fg-muted">
              Files will be uploaded to the current folder
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <div class="animate-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-surface-fg">Files</h1>
        <p class="mt-1 text-sm text-surface-fg-muted">
          Manage your files and folders
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
          @click="showNewFolder = !showNewFolder"
        >
          <FolderPlus class="h-4 w-4" />
          <span class="hidden sm:inline">New Folder</span>
        </button>
        <button
          class="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
          @click="triggerFolderSelect"
        >
          <FolderUp class="h-4 w-4" />
          <span class="hidden sm:inline">Folder</span>
        </button>
        <button
          class="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
          @click="triggerFileSelect"
        >
          <Upload class="h-4 w-4" />
          <span class="hidden sm:inline">Upload</span>
        </button>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />
        <input
          ref="folderInput"
          type="file"
          multiple
          webkitdirectory
          mozdirectory
          class="hidden"
          @change="handleFolderSelect"
        />
      </div>
    </div>

    <div
      v-if="showNewFolder"
      class="animate-in flex items-center gap-2 rounded-xl border border-surface-border bg-surface-raised p-3"
    >
      <Plus class="h-4 w-4 text-accent" />
      <input
        v-model="newFolderName"
        type="text"
        placeholder="Folder name..."
        class="flex-1 bg-transparent text-sm text-surface-fg placeholder-surface-fg-subtle outline-none"
        autofocus
        @keyup.enter="handleCreateFolder"
        @keyup.escape="showNewFolder = false"
      />
      <button
        class="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-all hover:brightness-110"
        @click="handleCreateFolder"
      >
        Create
      </button>
      <button
        class="rounded-lg px-3 py-1.5 text-xs text-surface-fg-subtle transition-colors hover:text-surface-fg"
        @click="showNewFolder = false"
      >
        Cancel
      </button>
    </div>

    <div
      v-if="fileStore.isSearchActive"
      class="animate-in animate-stagger-1 flex items-center justify-between gap-3 text-sm"
    >
      <div>
        <p class="font-medium text-surface-fg">
          Search results
        </p>
        <p class="mt-0.5 text-surface-fg-muted">
          Showing matches for "{{ fileStore.searchQuery.trim() }}" across all files and folders
        </p>
      </div>
      <button
        class="shrink-0 rounded-lg px-2.5 py-1.5 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
        @click="fileStore.clearSearch()"
      >
        Clear
      </button>
    </div>

    <div
      v-else
      class="animate-in animate-stagger-1 flex items-center gap-1.5 text-sm"
    >
      <button
        v-for="(crumb, index) in fileStore.breadcrumbs"
        :key="crumb.id ?? 'root'"
        class="flex items-center gap-1.5 transition-colors"
        :class="index === fileStore.breadcrumbs.length - 1 ? 'text-surface-fg font-medium' : 'text-surface-fg-muted hover:text-surface-fg cursor-pointer'"
        @click="index < fileStore.breadcrumbs.length - 1 && handleBreadcrumb(crumb.id, crumb.name)"
      >
        <Home v-if="index === 0" class="h-3.5 w-3.5" />
        <span>{{ crumb.name }}</span>
        <ChevronRight
          v-if="index < fileStore.breadcrumbs.length - 1"
          class="h-3.5 w-3.5 text-surface-fg-subtle"
        />
      </button>
    </div>

    <div class="animate-in animate-stagger-2 flex items-center justify-between">
      <div class="flex items-center gap-1 rounded-lg border border-surface-border p-0.5">
        <button
          class="rounded-md p-1.5 transition-colors"
          :class="viewMode === 'grid' ? 'bg-surface-overlay text-surface-fg' : 'text-surface-fg-subtle hover:text-surface-fg'"
          @click="setViewMode('grid')"
        >
          <Grid3X3 class="h-4 w-4" />
        </button>
        <button
          class="rounded-md p-1.5 transition-colors"
          :class="viewMode === 'list' ? 'bg-surface-overlay text-surface-fg' : 'text-surface-fg-subtle hover:text-surface-fg'"
          @click="setViewMode('list')"
        >
          <List class="h-4 w-4" />
        </button>
      </div>

      <div ref="sortMenuRef" class="relative">
        <button
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
          @click.stop="showSortMenu = !showSortMenu"
        >
          <component
            :is="fileStore.sort.direction === 'asc' ? SortAsc : SortDesc"
            class="h-4 w-4"
          />
          {{ sortLabel }}
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <div
            v-if="showSortMenu"
            class="absolute right-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
          >
            <div class="border-b border-surface-border px-3 py-2.5">
              <div class="text-sm font-medium text-surface-fg">Sort by</div>
              <div class="text-xs text-surface-fg-subtle">Click again to reverse order</div>
            </div>
            <div class="p-1">
              <button
                v-for="option in sortOptions"
                :key="option.field"
                class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-overlay"
                :class="fileStore.sort.field === option.field ? 'text-surface-fg' : 'text-surface-fg-muted'"
                @click.stop="fileStore.setSort(option.field)"
              >
                <span class="flex items-center gap-2">
                  <Check
                    class="h-4 w-4"
                    :class="fileStore.sort.field === option.field ? 'opacity-100' : 'opacity-0'"
                  />
                  {{ option.label }}
                </span>
                <span
                  v-if="fileStore.sort.field === option.field"
                  class="text-xs text-surface-fg-subtle"
                >
                  {{ sortDirectionLabel(option.field) }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div
      v-if="showContentLoading"
      :class="viewMode === 'list' ? 'space-y-1' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'"
    >
      <LoadingSkeleton :variant="viewMode === 'list' ? 'row' : 'card'" :count="6" />
    </div>

    <template v-else>
      <div
        v-if="viewMode === 'list' && hasVisibleItems"
        class="mb-1 hidden grid-cols-[auto_1fr_5rem_7rem_2.5rem] gap-3 px-4 text-xs font-medium uppercase tracking-wider text-surface-fg-subtle sm:grid"
      >
        <span />
        <span>Name</span>
        <span>Size</span>
        <span>Date</span>
        <span />
      </div>

      <div
        v-if="fileStore.allItems.folders.length > 0"
        class="space-y-3"
      >
        <h3 class="text-xs font-medium uppercase tracking-wider text-surface-fg-subtle">
          Folders
        </h3>
        <div
          :class="viewMode === 'list' ? 'space-y-1' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'"
        >
          <div
            v-for="(folder, i) in fileStore.allItems.folders"
            :key="folder.id"
            class="animate-in"
            :class="viewMode === 'grid' ? `animate-stagger-${Math.min(i + 1, 6)}` : ''"
          >
            <FolderListRow
              v-if="viewMode === 'list'"
              :folder="folder"
              :selected="fileStore.selectedFolders.has(folder.id)"
              :location-path="fileStore.isSearchActive ? folder.path : undefined"
              @open="handleOpenFolder"
              @select="fileStore.toggleFolderSelection"
              @delete="fileStore.deleteFolder"
            />
            <FolderCard
              v-else
              :folder="folder"
              :selected="fileStore.selectedFolders.has(folder.id)"
              :location-path="fileStore.isSearchActive ? folder.path : undefined"
              @open="handleOpenFolder"
              @select="fileStore.toggleFolderSelection"
              @delete="fileStore.deleteFolder"
            />
          </div>
        </div>
      </div>

      <div
        v-if="fileStore.allItems.files.length > 0"
        class="space-y-3"
      >
        <h3 class="text-xs font-medium uppercase tracking-wider text-surface-fg-subtle">
          Files
        </h3>
        <div
          :class="viewMode === 'list' ? 'space-y-1' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'"
        >
          <div
            v-for="(file, i) in fileStore.allItems.files"
            :key="file.id"
            class="animate-in"
            :class="[
              viewMode === 'grid' ? `animate-stagger-${Math.min(i + 1, 6)}` : '',
              openMenuFileId === file.id ? 'relative z-20' : '',
            ]"
          >
            <FileListRow
              v-if="viewMode === 'list'"
              :file="file"
              :selected="fileStore.selectedFiles.has(file.id)"
              :location-path="fileStore.isSearchActive ? file.path : undefined"
              @select="fileStore.toggleFileSelection"
              @delete="fileStore.deleteFile"
              @preview="handlePreviewFile"
              @menu-change="(open) => openMenuFileId = open ? file.id : null"
            />
            <FileCard
              v-else
              :file="file"
              :selected="fileStore.selectedFiles.has(file.id)"
              :location-path="fileStore.isSearchActive ? file.path : undefined"
              @select="fileStore.toggleFileSelection"
              @delete="fileStore.deleteFile"
              @preview="handlePreviewFile"
              @menu-change="(open) => openMenuFileId = open ? file.id : null"
            />
          </div>
        </div>
      </div>

      <div
        v-if="hasNoSearchResults"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border py-16"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-overlay">
          <Upload class="h-5 w-5 text-surface-fg-subtle" />
        </div>
        <h3 class="mt-4 text-sm font-medium text-surface-fg">No results found</h3>
        <p class="mt-1 text-sm text-surface-fg-subtle">
          Nothing matches "{{ fileStore.searchQuery.trim() }}"
        </p>
      </div>

      <div
        v-else-if="isEmptyFolder"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border py-16"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-overlay">
          <Upload class="h-5 w-5 text-surface-fg-subtle" />
        </div>
        <h3 class="mt-4 text-sm font-medium text-surface-fg">No files here</h3>
        <p class="mt-1 text-sm text-surface-fg-subtle">
          Upload files or create a folder to get started
        </p>
      </div>
    </template>
  </div>
</template>
