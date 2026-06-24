<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, ChevronRight, Folder, Home, Loader2 } from 'lucide-vue-next'
import type { Folder as FolderType, Breadcrumb } from '@/domain/types'
import { useFolderService } from '@/services'

const props = defineProps<{
  excludeFolderIds?: string[]
}>()

const emit = defineEmits<{
  close: []
  confirm: [folderId: string | null]
}>()

const folderService = useFolderService()
const browseFolderId = ref<string | null>(null)
const breadcrumbs = ref<Breadcrumb[]>([{ id: null, name: 'My Files' }])
const folders = ref<FolderType[]>([])
const isLoading = ref(false)

const excluded = computed(() => new Set(props.excludeFolderIds ?? []))

const visibleFolders = computed(() =>
  folders.value.filter((folder) => !excluded.value.has(folder.id)),
)

onMounted(() => {
  void loadFolders(null)
})

async function loadFolders(folderId: string | null) {
  isLoading.value = true
  try {
    browseFolderId.value = folderId
    folders.value = await folderService.listFolders(folderId)
  } finally {
    isLoading.value = false
  }
}

async function openFolder(folder: FolderType) {
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  await loadFolders(folder.id)
}

async function goToBreadcrumb(index: number) {
  const crumb = breadcrumbs.value[index]
  if (!crumb) return
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  await loadFolders(crumb.id)
}

function canMoveHere(): boolean {
  if (browseFolderId.value && excluded.value.has(browseFolderId.value)) {
    return false
  }
  return true
}

function handleConfirm() {
  if (!canMoveHere()) return
  emit('confirm', browseFolderId.value)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30">
      <div class="flex items-center justify-between border-b border-surface-border px-5 py-4">
        <div>
          <h3 class="text-sm font-medium text-surface-fg">Move to folder</h3>
          <p class="mt-0.5 text-xs text-surface-fg-subtle">Choose a destination</p>
        </div>
        <button
          class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 border-b border-surface-border px-5 py-3 text-sm">
        <button
          v-for="(crumb, index) in breadcrumbs"
          :key="crumb.id ?? 'root'"
          class="flex items-center gap-1 text-surface-fg-muted transition-colors hover:text-surface-fg"
          :class="index === breadcrumbs.length - 1 ? 'font-medium text-surface-fg' : ''"
          @click="goToBreadcrumb(index)"
        >
          <Home v-if="index === 0" class="h-3.5 w-3.5" />
          <span>{{ crumb.name }}</span>
          <ChevronRight
            v-if="index < breadcrumbs.length - 1"
            class="h-3.5 w-3.5 text-surface-fg-subtle"
          />
        </button>
      </div>

      <div class="max-h-64 overflow-y-auto p-2">
        <div v-if="isLoading" class="flex items-center justify-center py-10">
          <Loader2 class="h-6 w-6 animate-spin text-surface-fg-muted" />
        </div>

        <div v-else-if="visibleFolders.length === 0" class="py-10 text-center text-sm text-surface-fg-subtle">
          No subfolders here
        </div>

        <button
          v-for="folder in visibleFolders"
          :key="folder.id"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-overlay"
          @click="openFolder(folder)"
        >
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Folder class="h-4 w-4 text-accent" />
          </div>
          <span class="truncate text-sm text-surface-fg">{{ folder.name }}</span>
          <ChevronRight class="ml-auto h-4 w-4 text-surface-fg-subtle" />
        </button>
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-surface-border px-5 py-4">
        <button
          class="rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:text-surface-fg"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canMoveHere()"
          @click="handleConfirm"
        >
          Move here
        </button>
      </div>
    </div>
  </div>
</template>
