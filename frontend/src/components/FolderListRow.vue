<script setup lang="ts">
import { Folder, MoreVertical, Trash2, Download, Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
import type { Folder as FolderType } from '@/domain/types'
import { formatDate } from '@/utils'
import { useFolderService } from '@/services'
import { useNotificationStore } from '@/stores/notification'

const props = defineProps<{
  folder: FolderType
  selected?: boolean
  locationPath?: string
}>()

const emit = defineEmits<{
  open: [id: string]
  select: [id: string, event: MouseEvent]
  delete: [id: string]
}>()

const folderService = useFolderService()
const notify = useNotificationStore()
const showMenu = ref(false)
const isDownloading = ref(false)

async function downloadFolder() {
  isDownloading.value = true
  try {
    const result = await folderService.downloadFolder(props.folder.id)
    const a = document.createElement('a')
    a.href = result.blobUrl
    a.download = result.filename
    a.click()
    if (result.blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(result.blobUrl)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to download folder'
    notify.error(message)
  } finally {
    isDownloading.value = false
    showMenu.value = false
  }
}
</script>

<template>
  <div
    class="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-surface-border bg-surface-raised px-3 py-2.5 transition-all duration-200 hover:border-surface-border/80 hover:bg-surface-overlay/40 sm:grid-cols-[auto_1fr_5rem_7rem_2.5rem] sm:px-4"
    :class="selected ? 'border-accent/40 ring-1 ring-accent/20' : ''"
    @dblclick="emit('open', folder.id)"
    @click="emit('select', folder.id, $event)"
  >
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
      <Folder class="h-4 w-4 text-accent" />
    </div>

    <div class="min-w-0">
      <div class="truncate text-sm font-medium text-surface-fg">
        {{ folder.name }}
      </div>
      <div v-if="locationPath" class="mt-0.5 truncate text-xs text-surface-fg-subtle">
        {{ locationPath }}
      </div>
      <div v-else class="mt-0.5 text-xs text-surface-fg-subtle sm:hidden">
        {{ formatDate(folder.createdAt) }}
      </div>
    </div>

    <span class="hidden text-sm text-surface-fg-muted sm:block">—</span>

    <span class="hidden text-sm text-surface-fg-muted sm:block">
      {{ formatDate(folder.createdAt) }}
    </span>

    <div class="relative justify-self-end">
      <button
        class="rounded-md p-1.5 text-surface-fg-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
        :class="showMenu ? 'opacity-100' : ''"
        @click.stop="showMenu = !showMenu"
      >
        <MoreVertical class="h-4 w-4" />
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
          v-if="showMenu"
          class="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
        >
          <div class="p-1">
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isDownloading"
              @click.stop="downloadFolder"
            >
              <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
              <Download v-else class="h-4 w-4" />
              Download
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
              @click.stop="emit('delete', folder.id); showMenu = false"
            >
              <Trash2 class="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
