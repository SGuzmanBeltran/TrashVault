<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronRight,
  Plus,
  Upload,
  Grid3X3,
  List,
  SortAsc,
  FolderPlus,
  Home,
} from 'lucide-vue-next'
import { useFileStore } from '@/stores/files'
import { useUploadQueue } from '@/composables/useUploadQueue'
import FileCard from '@/components/FileCard.vue'
import FolderCard from '@/components/FolderCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { FileViewMode } from '@/domain/types'

const router = useRouter()
const fileStore = useFileStore()
const uploadQueue = useUploadQueue()

const viewMode = ref<FileViewMode>('grid')
const showNewFolder = ref(false)
const newFolderName = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  fileStore.loadFolder(null)
})

function triggerFileSelect() {
  fileInput.value?.click()
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

function handleOpenFolder(id: string) {
  const folder = fileStore.folders.find((f) => f.id === id)
  fileStore.navigateToFolder(id, folder?.name ?? 'Folder')
}

function handleBreadcrumb(id: string | null, name: string) {
  fileStore.navigateToFolder(id, name)
}

function handlePreviewFile(file: { id: string }) {
  router.push(`/files/${file.id}`)
}

async function handleCreateFolder() {
  if (!newFolderName.value.trim()) return
  await fileStore.createFolder(newFolderName.value.trim())
  newFolderName.value = ''
  showNewFolder.value = false
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <div class="animate-in flex items-center justify-between">
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
          New Folder
        </button>
        <button
          class="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
          @click="triggerFileSelect"
        >
          <Upload class="h-4 w-4" />
          Upload
        </button>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="handleFileSelect"
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

    <div class="animate-in animate-stagger-1 flex items-center gap-1.5 text-sm">
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
          @click="viewMode = 'grid'"
        >
          <Grid3X3 class="h-4 w-4" />
        </button>
        <button
          class="rounded-md p-1.5 transition-colors"
          :class="viewMode === 'list' ? 'bg-surface-overlay text-surface-fg' : 'text-surface-fg-subtle hover:text-surface-fg'"
          @click="viewMode = 'list'"
        >
          <List class="h-4 w-4" />
        </button>
      </div>

      <button class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg">
        <SortAsc class="h-4 w-4" />
        Sort
      </button>
    </div>

    <div v-if="fileStore.isLoading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <LoadingSkeleton variant="card" :count="6" />
    </div>

    <template v-else>
      <div
        v-if="fileStore.allItems.folders.length > 0"
        class="space-y-3"
      >
        <h3 class="text-xs font-medium uppercase tracking-wider text-surface-fg-subtle">
          Folders
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(folder, i) in fileStore.allItems.folders"
            :key="folder.id"
            class="animate-in"
            :class="`animate-stagger-${Math.min(i + 1, 6)}`"
          >
            <FolderCard
              :folder="folder"
              :selected="fileStore.selectedFolders.has(folder.id)"
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
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(file, i) in fileStore.allItems.files"
            :key="file.id"
            class="animate-in"
            :class="`animate-stagger-${Math.min(i + 1, 6)}`"
          >
            <FileCard
              :file="file"
              :selected="fileStore.selectedFiles.has(file.id)"
              @select="fileStore.toggleFileSelection"
              @delete="fileStore.deleteFile"
              @preview="handlePreviewFile"
            />
          </div>
        </div>
      </div>

      <div
        v-if="fileStore.allItems.folders.length === 0 && fileStore.allItems.files.length === 0"
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
