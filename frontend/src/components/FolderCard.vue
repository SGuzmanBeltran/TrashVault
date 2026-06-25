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
    class="group relative flex aspect-square cursor-pointer flex-col overflow-hidden rounded-xl border border-surface-border bg-surface-raised transition-all duration-200 hover:border-accent/20 hover:shadow-lg hover:shadow-black/10"
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
    <div class="flex flex-1 items-center justify-center bg-accent/10">
      <Folder class="h-12 w-12 text-accent" />
    </div>

    <div class="border-t border-surface-border bg-surface-raised px-3 py-2.5">
      <div class="truncate text-sm font-medium text-surface-fg">
        {{ folder.name }}
      </div>
      <div class="mt-0.5 truncate text-xs text-surface-fg-subtle">
        <span v-if="locationPath">{{ locationPath }}</span>
        <span v-else>{{ formatDate(folder.createdAt) }}</span>
      </div>
    </div>

    <ItemMenuDropdown :menu-key="menuKey" class="absolute right-2 top-2">
      <template #trigger="{ toggle, open }">
        <button
          class="rounded-lg bg-surface-raised/80 p-1.5 text-surface-fg-muted opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
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
