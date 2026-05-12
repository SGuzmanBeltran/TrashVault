<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  Trash2,
  RotateCcw,
  X,
  FolderOpen,
  FileText,
  Image,
  Video,
  Music,
  Table,
  Presentation,
  Database,
  File,
  AlertTriangle,
} from 'lucide-vue-next'
import { useTrashStore } from '@/stores/trash'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { formatBytes, formatDate, getFileIcon, getFileColor } from '@/utils'
import type { Component } from 'vue'

const trashStore = useTrashStore()
const showEmptyConfirm = ref(false)

onMounted(() => {
  trashStore.loadTrash()
})

const iconMap: Record<string, Component> = {
  'file-text': FileText,
  image: Image,
  video: Video,
  music: Music,
  table: Table,
  presentation: Presentation,
  database: Database,
  file: File,
}

function getIcon(mimeType: string): Component {
  return iconMap[getFileIcon(mimeType)] ?? File
}

async function handleEmptyTrash() {
  await trashStore.emptyTrash()
  showEmptyConfirm.value = false
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <div class="animate-in flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-surface-fg">Trash</h1>
        <p class="mt-1 text-sm text-surface-fg-muted">
          Items in trash will stay here until permanently deleted
        </p>
      </div>
      <button
        v-if="trashStore.files.length > 0 || trashStore.folders.length > 0"
        class="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger transition-all hover:bg-danger/20 active:scale-[0.98]"
        @click="showEmptyConfirm = true"
      >
        <Trash2 class="h-4 w-4" />
        Empty Trash
      </button>
    </div>

    <Transition name="fade">
      <div
        v-if="showEmptyConfirm"
        class="flex items-center justify-between rounded-xl border border-danger/30 bg-danger-soft p-4"
      >
        <div class="flex items-center gap-3">
          <AlertTriangle class="h-5 w-5 text-danger" />
          <div>
            <p class="text-sm font-medium text-surface-fg">Permanently delete everything?</p>
            <p class="text-xs text-surface-fg-muted">This action cannot be undone.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg px-3 py-1.5 text-sm text-surface-fg-muted transition-colors hover:text-surface-fg"
            @click="showEmptyConfirm = false"
          >
            Cancel
          </button>
          <button
            class="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-[0.98]"
            @click="handleEmptyTrash"
          >
            Delete everything
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="trashStore.isLoading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <LoadingSkeleton variant="card" :count="6" />
    </div>

    <template v-else>
      <div
        v-if="trashStore.folders.length > 0"
        class="space-y-3"
      >
        <h3 class="text-xs font-medium uppercase tracking-wider text-surface-fg-subtle">
          Folders
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="folder in trashStore.folders"
            :key="folder.id"
            class="animate-in group flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised p-4 transition-colors hover:border-surface-border-subtle"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <FolderOpen class="h-5 w-5 text-accent" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-surface-fg">{{ folder.name }}</p>
              <p class="text-xs text-surface-fg-subtle">{{ formatDate(folder.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-accent"
                title="Restore"
                @click="trashStore.restoreFolder(folder.id)"
              >
                <RotateCcw class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                title="Delete permanently"
                @click="trashStore.permanentDeleteFolder(folder.id)"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="trashStore.files.length > 0"
        class="space-y-3"
      >
        <h3 class="text-xs font-medium uppercase tracking-wider text-surface-fg-subtle">
          Files
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="file in trashStore.files"
            :key="file.id"
            class="animate-in group flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised p-4 transition-colors hover:border-surface-border-subtle"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-overlay">
              <component
                :is="getIcon(file.mimeType)"
                class="h-5 w-5"
                :class="getFileColor(file.mimeType)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-surface-fg">{{ file.name }}</p>
              <p class="text-xs text-surface-fg-subtle">
                {{ formatBytes(file.size) }} &middot; {{ formatDate(file.createdAt) }}
              </p>
            </div>
            <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-accent"
                title="Restore"
                @click="trashStore.restoreFile(file.id)"
              >
                <RotateCcw class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                title="Delete permanently"
                @click="trashStore.permanentDeleteFile(file.id)"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="trashStore.files.length === 0 && trashStore.folders.length === 0"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border py-16"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-overlay">
          <Trash2 class="h-5 w-5 text-surface-fg-subtle" />
        </div>
        <h3 class="mt-4 text-sm font-medium text-surface-fg">Trash is empty</h3>
        <p class="mt-1 text-sm text-surface-fg-subtle">
          Deleted files and folders will appear here
        </p>
      </div>
    </template>
  </div>
</template>
