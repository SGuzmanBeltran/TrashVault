<script setup lang="ts">
import { Folder, MoreVertical, Trash2, Pencil, Download, Loader2 } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import type { Folder as FolderType } from '@/domain/types'
import { formatDate } from '@/utils'
import { useFolderService } from '@/services'
import { useFileStore } from '@/stores/files'
import { useNotificationStore } from '@/stores/notification'
import { useFolderDropTarget } from '@/composables/useFolderDropTarget'
import { useExternalFolderUpload } from '@/composables/useExternalFolderUpload'
import ItemMenuDropdown from '@/components/ItemMenuDropdown.vue'
import { itemMenuKey } from '@/composables/useItemMenuRegistry'

const props = defineProps<{
  folder: FolderType
  selected?: boolean
  locationPath?: string
}>()

const emit = defineEmits<{
  open: [id: string]
  select: [id: string, event: MouseEvent]
  delete: [id: string]
  rename: [folder: FolderType]
}>()

const folderService = useFolderService()
const fileStore = useFileStore()
const notify = useNotificationStore()
const { uploadExternalDrop } = useExternalFolderUpload()
const isDownloading = ref(false)

const menuKey = computed(() => itemMenuKey('folder', props.folder.id))

const { isDropTarget, onDragEnter, onDragOver, onDragLeave, onDrop } = useFolderDropTarget({
  onMoveFiles: (fileIds) => fileStore.moveFilesToFolder(fileIds, props.folder.id),
  onExternalDrop: (event) => uploadExternalDrop(event, props.folder.id),
})

async function downloadFolder(close: () => void) {
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
    close()
  }
}
</script>

<template>
  <div
    class="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-surface-border bg-surface-raised px-3 py-2.5 transition-all duration-200 hover:border-surface-border/80 hover:bg-surface-overlay/40 sm:grid-cols-[auto_1fr_5rem_7rem_2.5rem] sm:px-4"
    :class="[
      selected ? 'border-accent ring-2 ring-accent/45' : '',
      isDropTarget ? 'border-accent bg-accent/10 ring-2 ring-accent/40' : '',
    ]"
    @dblclick="emit('open', folder.id)"
    @click="emit('select', folder.id, $event)"
    @dragenter="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
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

    <ItemMenuDropdown :menu-key="menuKey" class="justify-self-end">
      <template #trigger="{ toggle, open }">
        <button
          class="rounded-md p-1.5 text-surface-fg-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
          :class="open ? 'opacity-100' : ''"
          @click.stop="toggle"
        >
          <MoreVertical class="h-4 w-4" />
        </button>
      </template>
      <template #menu="{ close }">
        <button
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isDownloading"
          @click.stop="downloadFolder(close)"
        >
          <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
          <Download v-else class="h-4 w-4" />
          Download
        </button>
        <button
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
          @click.stop="emit('rename', folder); close()"
        >
          <Pencil class="h-4 w-4" />
          Rename
        </button>
        <button
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
          @click.stop="emit('delete', folder.id); close()"
        >
          <Trash2 class="h-4 w-4" />
          Delete
        </button>
      </template>
    </ItemMenuDropdown>
  </div>
</template>
