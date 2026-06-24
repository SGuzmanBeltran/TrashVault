<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import {
  Plus,
  Upload,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Check,
  FolderPlus,
  UploadCloud,
  FolderUp,
} from 'lucide-vue-next'
import { useFileStore } from '@/stores/files'
import { useUploadQueue } from '@/composables/useUploadQueue'
import { useExternalFolderUpload } from '@/composables/useExternalFolderUpload'
import { isExternalFileDrag, isInternalFileDrag, endFileDrag } from '@/lib/file-drag'
import { removeFileDragPreview } from '@/lib/file-drag-preview'
import FileCard from '@/components/FileCard.vue'
import FolderCard from '@/components/FolderCard.vue'
import FileListRow from '@/components/FileListRow.vue'
import FolderListRow from '@/components/FolderListRow.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import FilePreviewModal from '@/components/FilePreviewModal.vue'
import BulkActionBar from '@/components/BulkActionBar.vue'
import MoveToFolderModal from '@/components/MoveToFolderModal.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import { loadFileViewMode, saveFileViewMode } from '@/lib/file-view-mode'
import { useFileKeyboardShortcuts, isSelectAllShortcut, isTextEditingTarget } from '@/composables/useFileKeyboardShortcuts'
import type { FileViewMode, FileItem, SortField } from '@/domain/types'

const fileStore = useFileStore()
const uploadQueue = useUploadQueue()
const { uploadExternalDrop, processFolderUpload } = useExternalFolderUpload()

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
const sortButtonRef = ref<HTMLElement | null>(null)
const sortMenuPanelRef = ref<HTMLElement | null>(null)
const sortMenuPosition = ref({ top: 0, right: 0 })
const showMoveModal = ref(false)
const moveExcludeFolderIds = ref<string[]>([])
const filesRegionRef = ref<HTMLElement | null>(null)

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'size', label: 'Size' },
  { field: 'createdAt', label: 'Date' },
  { field: 'mimeType', label: 'Type' },
]

const listSortHeaders: { field: SortField; label: string }[] = [
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

const folderGridClass = computed(() =>
  viewMode.value === 'list'
    ? 'space-y-1'
    : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
)

const fileGridClass = computed(() =>
  viewMode.value === 'list'
    ? 'space-y-1'
    : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
)

const contentGridClass = computed(() =>
  viewMode.value === 'list'
    ? 'space-y-1'
    : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
)

function setViewMode(mode: FileViewMode) {
  viewMode.value = mode
  saveFileViewMode(mode)
  if (mode === 'list') {
    showSortMenu.value = false
  }
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

function updateSortMenuPosition() {
  const button = sortButtonRef.value
  if (!button) return

  const rect = button.getBoundingClientRect()
  sortMenuPosition.value = {
    top: rect.bottom + 6,
    right: window.innerWidth - rect.right,
  }
}

function toggleSortMenu() {
  if (!showSortMenu.value) {
    updateSortMenuPosition()
  }
  showSortMenu.value = !showSortMenu.value
}

function onClickDocument(event: MouseEvent) {
  const target = event.target as Node
  if (sortButtonRef.value?.contains(target)) return
  if (sortMenuPanelRef.value?.contains(target)) return
  showSortMenu.value = false
}

function clearSortMenuListeners() {
  window.removeEventListener('scroll', updateSortMenuPosition, true)
  window.removeEventListener('resize', updateSortMenuPosition)
}

watch(showSortMenu, (open) => {
  if (open) {
    updateSortMenuPosition()
    window.addEventListener('scroll', updateSortMenuPosition, true)
    window.addEventListener('resize', updateSortMenuPosition)
  } else {
    clearSortMenuListeners()
  }
})

onMounted(() => {
  fileStore.loadFolder(null)
  document.addEventListener('click', onClickDocument)
  document.addEventListener('drop', resetDragOverlay)
  document.addEventListener('dragend', resetDragOverlay)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickDocument)
  document.removeEventListener('drop', resetDragOverlay)
  document.removeEventListener('dragend', resetDragOverlay)
  clearSortMenuListeners()
})

function resetDragOverlay() {
  dragCounter.value = 0
  endFileDrag()
  removeFileDragPreview()
}

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

  await processFolderUpload(entries, fileStore.currentFolderId)
  target.value = ''
}

function isHiddenPath(path: string): boolean {
  return path.split('/').some((segment) => segment.startsWith('.'))
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

function handleItemSelect(kind: 'file' | 'folder', id: string, event: MouseEvent) {
  fileStore.selectItem(kind, id, event.shiftKey)
}

async function openMoveModal() {
  moveExcludeFolderIds.value = await fileStore.collectExcludedMoveFolderIds()
  showMoveModal.value = true
}

async function handleMoveConfirm(destinationFolderId: string | null) {
  showMoveModal.value = false
  await fileStore.bulkMove(destinationFolderId)
}

async function handleBulkDelete() {
  await fileStore.bulkDelete()
}

function handleKeyboardDelete() {
  if (!fileStore.hasSelection || fileStore.isBulkOperating) return false
  void handleBulkDelete()
  return true
}

function handleKeyboardEnter() {
  const fileIds = fileStore.selectedFileIds
  const folderIds = fileStore.selectedFolderIds

  if (fileIds.length === 1 && folderIds.length === 0) {
    const file = fileStore.allItems.files.find((f) => f.id === fileIds[0])
    if (file) {
      handlePreviewFile(file)
      return true
    }
    return false
  }

  if (folderIds.length === 1 && fileIds.length === 0) {
    handleOpenFolder(folderIds[0]!)
    return true
  }

  return false
}

function handleKeyboardEscape() {
  if (previewFile.value) {
    previewFile.value = null
    return
  }
  if (showMoveModal.value) {
    showMoveModal.value = false
    return
  }
  if (showNewFolder.value) {
    showNewFolder.value = false
    return
  }
  if (showSortMenu.value) {
    showSortMenu.value = false
    return
  }
  if (fileStore.hasSelection) {
    fileStore.clearSelection()
  }
}

function handleKeyboardSelectAll() {
  if (fileStore.isBulkOperating) return
  fileStore.selectAll()
}

function focusFilesRegion(event: MouseEvent) {
  const target = event.target
  if (target instanceof HTMLElement) {
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
      return
    }
  }
  filesRegionRef.value?.focus({ preventScroll: true })
}

function onFilesRegionKeydown(event: KeyboardEvent) {
  if (!isSelectAllShortcut(event)) return
  if (isTextEditingTarget(event.target)) return

  event.preventDefault()
  event.stopPropagation()
  if (!fileStore.isBulkOperating) fileStore.selectAll()
}

useFileKeyboardShortcuts({
  onDelete: handleKeyboardDelete,
  onEnter: handleKeyboardEnter,
  onEscape: handleKeyboardEscape,
  onSelectAll: handleKeyboardSelectAll,
  onUpload: triggerFileSelect,
  isDisabled: () => fileStore.isBulkOperating,
})

async function handleCreateFolder() {
  if (!newFolderName.value.trim()) return
  await fileStore.createFolder(newFolderName.value.trim())
  newFolderName.value = ''
  showNewFolder.value = false
}

function onDragEnter(event: DragEvent) {
  if (!isExternalFileDrag(event)) return
  event.preventDefault()
  dragCounter.value++
}

function onDragOver(event: DragEvent) {
  if (!isExternalFileDrag(event)) return
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function onDragLeave(event: DragEvent) {
  if (dragCounter.value === 0) return
  event.preventDefault()
  dragCounter.value--
  if (dragCounter.value < 0) dragCounter.value = 0
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  dragCounter.value = 0
  if (isInternalFileDrag(event)) return
  await uploadExternalDrop(event, fileStore.currentFolderId)
}
</script>

<template>
  <MoveToFolderModal
    v-if="showMoveModal"
    :exclude-folder-ids="moveExcludeFolderIds"
    @close="showMoveModal = false"
    @confirm="handleMoveConfirm"
  />

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <BulkActionBar
      v-if="fileStore.hasSelection"
      :count="fileStore.selectionCount"
      :is-loading="fileStore.isBulkOperating"
      @move="openMoveModal"
      @delete="handleBulkDelete"
      @clear="fileStore.clearSelection()"
    />
  </Transition>

  <FilePreviewModal
    v-if="previewFile"
    :file="previewFile"
    @close="previewFile = null"
  />
  <div
    ref="filesRegionRef"
    tabindex="-1"
    class="relative mx-auto min-h-full max-w-5xl space-y-6 outline-none"
    @mousedown="focusFilesRegion"
    @keydown="onFilesRegionKeydown"
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

    <BreadcrumbNav
      v-else
      :breadcrumbs="fileStore.breadcrumbs"
      @navigate="handleBreadcrumb"
    />

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

      <div v-if="viewMode !== 'list'" class="relative">
        <button
          ref="sortButtonRef"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
          @click.stop="toggleSortMenu"
        >
          <component
            :is="fileStore.sort.direction === 'asc' ? SortAsc : SortDesc"
            class="h-4 w-4"
          />
          {{ sortLabel }}
        </button>

        <Teleport to="body">
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
              ref="sortMenuPanelRef"
              class="fixed z-50 w-52 overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
              :style="{ top: `${sortMenuPosition.top}px`, right: `${sortMenuPosition.right}px` }"
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
        </Teleport>
      </div>
    </div>

    <div
      v-if="viewMode === 'list'"
      class="mb-2 hidden grid-cols-[auto_1fr_5rem_7rem_2.5rem] gap-3 px-4 pb-2 text-xs font-medium uppercase tracking-wider sm:grid"
    >
      <span />
      <button
        v-for="header in listSortHeaders"
        :key="header.field"
        type="button"
        class="flex items-center gap-1 text-left transition-colors hover:text-surface-fg"
        :class="[
          header.field === 'mimeType' ? 'justify-self-end' : '',
          fileStore.sort.field === header.field ? 'text-surface-fg' : 'text-surface-fg-subtle',
        ]"
        @click="fileStore.setSort(header.field)"
      >
        {{ header.label }}
        <component
          :is="fileStore.sort.direction === 'asc' ? SortAsc : SortDesc"
          v-if="fileStore.sort.field === header.field"
          class="h-3 w-3"
        />
      </button>
    </div>

    <div
      v-if="showContentLoading"
      :class="viewMode === 'list' ? 'space-y-1' : contentGridClass"
    >
      <LoadingSkeleton :variant="viewMode === 'list' ? 'row' : 'card'" :count="6" />
    </div>

    <template v-else>
      <div
        v-if="fileStore.allItems.folders.length > 0"
        class="space-y-3"
      >
        <h3 class="text-xs font-medium uppercase tracking-wider text-surface-fg-subtle">
          Folders
        </h3>
        <div
          :class="folderGridClass"
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
              :selected="fileStore.selectedFolderIds.includes(folder.id)"
              :location-path="fileStore.isSearchActive ? folder.path : undefined"
              @open="handleOpenFolder"
              @select="(id, event) => handleItemSelect('folder', id, event)"
              @delete="fileStore.deleteFolder"
            />
            <FolderCard
              v-else
              :folder="folder"
              :selected="fileStore.selectedFolderIds.includes(folder.id)"
              :location-path="fileStore.isSearchActive ? folder.path : undefined"
              @open="handleOpenFolder"
              @select="(id, event) => handleItemSelect('folder', id, event)"
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
          :class="fileGridClass"
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
              :selected="fileStore.selectedFileIds.includes(file.id)"
              :location-path="fileStore.isSearchActive ? file.path : undefined"
              @select="(id, event) => handleItemSelect('file', id, event)"
              @delete="fileStore.deleteFile"
              @preview="handlePreviewFile"
              @menu-change="(open) => openMenuFileId = open ? file.id : null"
            />
            <FileCard
              v-else
              :file="file"
              :selected="fileStore.selectedFileIds.includes(file.id)"
              :location-path="fileStore.isSearchActive ? file.path : undefined"
              @select="(id, event) => handleItemSelect('file', id, event)"
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
