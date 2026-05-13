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
} from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
import type { FileItem } from '@/domain/types'
import { formatBytes, formatDate, getFileIcon } from '@/utils'
import { useFileService } from '@/services'
import { useVaultStore } from '@/stores/vault'
import { toast } from 'vue-sonner'

const props = defineProps<{
  file: FileItem
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  preview: [file: FileItem]
}>()

const fileService = useFileService()
const vaultStore = useVaultStore()
const showMenu = ref(false)
const thumbnailUrl = ref<string | null>(null)
const thumbnailError = ref(false)
const downloadUrl = ref<string | null>(null)
const isDragging = ref(false)
const isImageLike = computed(() => props.file.mimeType.startsWith('image/'))
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
  () => [props.file.thumbnailKey, vaultStore.isUnlocked],
  ([key, unlocked]) => {
    if (key && unlocked) {
      loadThumbnail()
    }
  },
  { immediate: true },
)

async function downloadFile() {
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
    toast.error(message)
  }
}

async function onMouseDown() {
  if (!downloadUrl.value) {
    try {
      const result = await fileService.downloadFile(props.file.id)
      downloadUrl.value = result.blobUrl
    } catch {
      downloadUrl.value = null
    }
  }
}

function onDragStart(event: DragEvent) {
  if (!downloadUrl.value || !event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'copy'
  const downloadData = `${props.file.mimeType}:${props.file.name}:${downloadUrl.value}`
  event.dataTransfer.setData('DownloadURL', downloadData)
  isDragging.value = true
}

function onDragEnd() {
  isDragging.value = false
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
  <div
    class="group relative flex flex-col rounded-xl border border-surface-border bg-surface-raised p-4 transition-all duration-200 hover:border-surface-border/80 hover:shadow-lg hover:shadow-black/10"
    :class="[
      selected ? 'border-accent/40 ring-1 ring-accent/20' : '',
      isDragging ? 'opacity-50 ring-1 ring-accent/40' : '',
    ]" draggable="true"
    @click="emit('select', file.id)"
@mousedown="onMouseDown" @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="flex items-start justify-between">
      <div
class="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg transition-colors"
        :class="showThumbnail ? '' : iconBg">
        <img v-if="showThumbnail && thumbnailUrl" :src="thumbnailUrl" :alt="file.name"
          class="h-full w-full object-cover" loading="lazy" @error="thumbnailError = true"
          @load="thumbnailError = false" />
        <component v-else :is="iconComponent" class="h-5 w-5" :class="iconColor" />
        <div v-if="showThumbnail && isVideoLike"
          class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
          <Play class="h-4 w-4 text-white" fill="currentColor" />
        </div>
      </div>

      <div class="relative">
        <button
          class="rounded-md p-1 text-surface-fg-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
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
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
                @click.stop="emit('preview', file); showMenu = false"
              >
                <Eye class="h-4 w-4" />
                Preview
              </button>
              <button
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
                @click.stop="downloadFile(); showMenu = false"
              >
                <Download class="h-4 w-4" />
                Download
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

    <div class="mt-3.5 min-w-0 flex-1">
      <div class="truncate text-sm font-medium text-surface-fg">
        {{ file.name }}
      </div>
      <div class="mt-1 flex items-center gap-2 text-xs text-surface-fg-subtle">
        <span>{{ formatBytes(file.size) }}</span>
        <span class="h-0.5 w-0.5 rounded-full bg-surface-fg-subtle" />
        <span>{{ formatDate(file.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>
