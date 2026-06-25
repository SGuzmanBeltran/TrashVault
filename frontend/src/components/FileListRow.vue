<script setup lang="ts">
import {
  FileText,
  Image,
  Video,
  Music,
  Table,
  Presentation,
  Database,
  File,
  MoreVertical,
  Pencil,
  Download,
  Trash2,
  Eye,
  Play,
  Loader2,
} from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
import type { FileItem } from '@/domain/types'
import { formatBytes, formatDate, getFileIcon } from '@/utils'
import { useFileService } from '@/services'
import { useFileStore } from '@/stores/files'
import { useVaultStore } from '@/stores/vault'
import { useNotificationStore } from '@/stores/notification'
import { setFileDragData, endFileDrag } from '@/lib/file-drag'
import { setFileDragPreview, removeFileDragPreview } from '@/lib/file-drag-preview'

const props = defineProps<{
  file: FileItem
  selected?: boolean
  locationPath?: string
}>()

const emit = defineEmits<{
  select: [id: string, event: MouseEvent]
  delete: [id: string]
  preview: [file: FileItem]
  rename: [file: FileItem]
  menuChange: [open: boolean]
}>()

const fileService = useFileService()
const fileStore = useFileStore()
const vaultStore = useVaultStore()
const notify = useNotificationStore()
const showMenu = ref(false)
const isDownloading = ref(false)
const isDragging = ref(false)
const thumbnailUrl = ref<string | null>(null)
const thumbnailError = ref(false)

const isVideoLike = computed(() => props.file.mimeType.startsWith('video/'))
const showThumbnail = computed(
  () => !!thumbnailUrl.value && !thumbnailError.value,
)

async function loadThumbnail() {
  if (!props.file.thumbnailKey || !vaultStore.isUnlocked) return
  try {
    thumbnailUrl.value = await fileService.getThumbnailUrl(props.file.id)
  } catch {
    thumbnailError.value = true
  }
}

watch(
  () => [props.file.thumbnailKey, props.file.id, vaultStore.isUnlocked],
  ([key, , unlocked]) => {
    thumbnailUrl.value = null
    thumbnailError.value = false
    if (key && unlocked) {
      loadThumbnail()
    }
  },
  { immediate: true },
)

const iconMap: Record<string, typeof File> = {
  'file-text': FileText,
  image: Image,
  video: Video,
  music: Music,
  table: Table,
  presentation: Presentation,
  database: Database,
  file: File,
}

const iconColorMap: Record<string, string> = {
  'file-text': 'text-blue-400 bg-blue-400/10',
  image: 'text-pink-400 bg-pink-400/10',
  video: 'text-purple-400 bg-purple-400/10',
  music: 'text-amber-400 bg-amber-400/10',
  table: 'text-emerald-400 bg-emerald-400/10',
  presentation: 'text-orange-400 bg-orange-400/10',
  database: 'text-cyan-400 bg-cyan-400/10',
  file: 'text-surface-fg-muted bg-surface-overlay',
}

const iconType = computed(() => getFileIcon(props.file.mimeType))
const iconComponent = computed(() => iconMap[iconType.value] ?? File)
const iconClasses = computed(() => iconColorMap[iconType.value] ?? 'text-surface-fg-muted bg-surface-overlay')

function toggleMenu() {
  showMenu.value = !showMenu.value
  emit('menuChange', showMenu.value)
}

async function downloadFile() {
  isDownloading.value = true
  try {
    const result = await fileService.downloadFile(props.file.id)
    const a = document.createElement('a')
    a.href = result.blobUrl
    a.download = result.filename
    a.click()
    if (result.blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(result.blobUrl)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to download file'
    notify.error(message)
  } finally {
    isDownloading.value = false
    showMenu.value = false
    emit('menuChange', false)
  }
}

function onDragStart(event: DragEvent) {
  if (!event.dataTransfer) return
  const fileIds = fileStore.selectedFileIds.includes(props.file.id)
    ? fileStore.selectedFileIds
    : [props.file.id]
  setFileDragData(event.dataTransfer, fileIds)
  setFileDragPreview(event, fileIds.length)
  isDragging.value = true
}

function onDragEnd() {
  isDragging.value = false
  endFileDrag()
  removeFileDragPreview()
}
</script>

<template>
  <div
    class="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-surface-border bg-surface-raised px-3 py-2.5 transition-all duration-200 hover:border-surface-border/80 hover:bg-surface-overlay/40 sm:grid-cols-[auto_1fr_5rem_7rem_2.5rem] sm:px-4"
    :class="[
      selected ? 'border-accent ring-2 ring-accent/45' : '',
      isDragging ? 'opacity-50 ring-1 ring-accent/40' : '',
    ]"
    draggable="true"
    @click="emit('select', file.id, $event)"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div
      class="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
      :class="showThumbnail ? '' : iconClasses"
    >
      <img
        v-if="showThumbnail && thumbnailUrl"
        :src="thumbnailUrl"
        :alt="file.name"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="thumbnailError = true"
        @load="thumbnailError = false"
      />
      <component v-else :is="iconComponent" class="h-4 w-4" />
      <div
        v-if="showThumbnail && isVideoLike"
        class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20"
      >
        <Play class="h-3 w-3 text-white" fill="currentColor" />
      </div>
    </div>

    <div class="min-w-0">
      <div class="truncate text-sm font-medium text-surface-fg">
        {{ file.name }}
      </div>
      <div v-if="locationPath" class="mt-0.5 truncate text-xs text-surface-fg-subtle">
        {{ locationPath }}
      </div>
      <div v-else class="mt-0.5 flex items-center gap-2 text-xs text-surface-fg-subtle sm:hidden">
        <span>{{ formatBytes(file.size) }}</span>
        <span class="h-0.5 w-0.5 rounded-full bg-surface-fg-subtle" />
        <span>{{ formatDate(file.createdAt) }}</span>
      </div>
    </div>

    <span class="hidden truncate text-sm text-surface-fg-muted sm:block">
      {{ formatBytes(file.size) }}
    </span>

    <span class="hidden text-sm text-surface-fg-muted sm:block">
      {{ formatDate(file.createdAt) }}
    </span>

    <div class="relative justify-self-end">
      <button
        class="rounded-md p-1.5 text-surface-fg-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
        :class="showMenu ? 'opacity-100' : ''"
        @click.stop="toggleMenu"
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
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
              @click.stop="emit('preview', file); showMenu = false; emit('menuChange', false)"
            >
              <Eye class="h-4 w-4" />
              Preview
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
              :disabled="isDownloading"
              @click.stop="downloadFile"
            >
              <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
              <Download v-else class="h-4 w-4" />
              {{ isDownloading ? 'Decrypting...' : 'Download' }}
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
              @click.stop="emit('rename', file); showMenu = false; emit('menuChange', false)"
            >
              <Pencil class="h-4 w-4" />
              Rename
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
              @click.stop="emit('delete', file.id); showMenu = false; emit('menuChange', false)"
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
