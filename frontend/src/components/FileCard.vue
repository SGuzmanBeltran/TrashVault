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
  Download,
  Trash2,
  Eye,
  Play,
  Loader2,
} from 'lucide-vue-next'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
  menuChange: [open: boolean]
}>()

const fileService = useFileService()
const fileStore = useFileStore()
const vaultStore = useVaultStore()
const notify = useNotificationStore()
const cardRef = ref<HTMLElement | null>(null)
const showMenu = ref(false)

watch(showMenu, (open) => emit('menuChange', open))

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function onClickDocument(e: MouseEvent) {
  if (!cardRef.value) return
  const target = e.target as Node
  if (!cardRef.value.contains(target)) {
    showMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickDocument))
onUnmounted(() => document.removeEventListener('click', onClickDocument))

const thumbnailUrl = ref<string | null>(null)
const thumbnailError = ref(false)
const isDragging = ref(false)
const isDownloading = ref(false)
const isImageLike = computed(() => props.file.mimeType.startsWith('image/'))
const isVideoLike = computed(() => props.file.mimeType.startsWith('video/'))
const showThumbnail = computed(
  () => !!thumbnailUrl.value && !thumbnailError.value,
)
const useVisualLayout = computed(
  () =>
    !!props.file.thumbnailKey &&
    vaultStore.isUnlocked &&
    (isImageLike.value || isVideoLike.value),
)
const isThumbnailLoading = computed(
  () => useVisualLayout.value && !showThumbnail.value && !thumbnailError.value,
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

const iconComponent = computed(() => iconMap[getFileIcon(props.file.mimeType)] ?? File)

const iconColorMap: Record<string, string> = {
  'file-text': 'text-blue-400',
  image: 'text-pink-400',
  video: 'text-purple-400',
  music: 'text-amber-400',
  table: 'text-emerald-400',
  presentation: 'text-orange-400',
  database: 'text-cyan-400',
  file: 'text-surface-fg-muted',
}

const iconColor = computed(() => iconColorMap[getFileIcon(props.file.mimeType)] ?? 'text-surface-fg-muted')

const iconBgMap: Record<string, string> = {
  'file-text': 'bg-blue-400/10',
  image: 'bg-pink-400/10',
  video: 'bg-purple-400/10',
  music: 'bg-amber-400/10',
  table: 'bg-emerald-400/10',
  presentation: 'bg-orange-400/10',
  database: 'bg-cyan-400/10',
  file: 'bg-surface-overlay',
}

const iconBg = computed(() => iconBgMap[getFileIcon(props.file.mimeType)] ?? 'bg-surface-overlay')
</script>

<template>
  <!-- Visual poster card for images/videos with thumbnails -->
  <div
    v-if="useVisualLayout"
    ref="cardRef"
    class="group relative aspect-square cursor-pointer rounded-xl border border-surface-border bg-surface-overlay transition-all duration-200 hover:border-surface-border/80 hover:shadow-lg hover:shadow-black/20"
    :class="[
      selected ? 'border-accent ring-2 ring-accent/45' : '',
      isDragging ? 'opacity-50 ring-1 ring-accent/40' : '',
      showMenu ? 'z-20 overflow-visible' : 'overflow-hidden',
    ]"
    draggable="true"
    @click="emit('select', file.id, $event)"
    @dblclick.stop="emit('preview', file)"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div
      v-if="showThumbnail && thumbnailUrl"
      class="absolute inset-0 overflow-hidden rounded-xl"
    >
      <img
        :src="thumbnailUrl"
        :alt="file.name"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="lazy"
        @error="thumbnailError = true"
        @load="thumbnailError = false"
      />
    </div>

    <div
      v-else-if="isThumbnailLoading"
      class="absolute inset-0 flex items-center justify-center bg-surface-overlay"
    >
      <div class="h-7 w-7 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
    </div>

    <div
      v-else
      class="absolute inset-0 flex items-center justify-center"
      :class="iconBg"
    >
      <component :is="iconComponent" class="h-10 w-10" :class="iconColor" />
    </div>

    <div
      v-if="showThumbnail && isVideoLike"
      class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10"
    >
      <div class="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
        <Play class="h-5 w-5 text-white" fill="currentColor" />
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10">
      <div class="truncate text-sm font-medium text-white">
        {{ file.name }}
      </div>
      <div class="mt-0.5 truncate text-xs text-white/70">
        <template v-if="locationPath">{{ locationPath }}</template>
        <template v-else>{{ formatBytes(file.size) }} · {{ formatDate(file.createdAt) }}</template>
      </div>
    </div>

    <div class="absolute right-2 top-2">
      <button
        class="rounded-lg bg-black/45 p-1.5 text-white/90 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-black/60"
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
              @click.stop="emit('preview', file); showMenu = false"
            >
              <Eye class="h-4 w-4" />
              Preview
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
              :disabled="isDownloading"
              @click.stop="downloadFile(); showMenu = false"
            >
              <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
              <Download v-else class="h-4 w-4" />
              {{ isDownloading ? 'Decrypting...' : 'Download' }}
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
              @click.stop="emit('delete', file.id); showMenu = false"
            >
              <Trash2 class="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>

  <!-- Square tile for other file types -->
  <div
    v-else
    ref="cardRef"
    class="group relative flex aspect-square cursor-pointer flex-col rounded-xl border border-surface-border bg-surface-raised transition-all duration-200 hover:border-surface-border/80 hover:shadow-lg hover:shadow-black/10"
    :class="[
      selected ? 'border-accent ring-2 ring-accent/45' : '',
      isDragging ? 'opacity-50 ring-1 ring-accent/40' : '',
      showMenu ? 'z-20 overflow-visible' : 'overflow-hidden',
    ]"
    draggable="true"
    @click="emit('select', file.id, $event)"
    @dblclick.stop="emit('preview', file)"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div
      class="flex flex-1 items-center justify-center"
      :class="iconBg"
    >
      <component :is="iconComponent" class="h-12 w-12" :class="iconColor" />
    </div>

    <div class="border-t border-surface-border bg-surface-raised px-3 py-2.5">
      <div class="truncate text-sm font-medium text-surface-fg">
        {{ file.name }}
      </div>
      <div class="mt-0.5 truncate text-xs text-surface-fg-subtle">
        <template v-if="locationPath">{{ locationPath }}</template>
        <template v-else>{{ formatBytes(file.size) }} · {{ formatDate(file.createdAt) }}</template>
      </div>
    </div>

    <div class="absolute right-2 top-2">
      <button
        class="rounded-lg bg-surface-raised/80 p-1.5 text-surface-fg-muted opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
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
              @click.stop="emit('preview', file); showMenu = false"
            >
              <Eye class="h-4 w-4" />
              Preview
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
              :disabled="isDownloading"
              @click.stop="downloadFile(); showMenu = false"
            >
              <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
              <Download v-else class="h-4 w-4" />
              {{ isDownloading ? 'Decrypting...' : 'Download' }}
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
              @click.stop="emit('delete', file.id); showMenu = false"
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
