<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { X, Download, Loader2 } from 'lucide-vue-next'
import type { FileItem } from '@/domain/types'
import { useFileService } from '@/services'
import { formatBytes } from '@/utils'

const props = defineProps<{
  file: FileItem
}>()

const emit = defineEmits<{
  close: []
  download: []
}>()

const fileService = useFileService()
const blobUrl = ref<string | null>(null)
const isLoading = ref(true)
const isDownloading = ref(false)
const error = ref('')

const isImage = computed(() => {
  if (props.file.mimeType) return props.file.mimeType.startsWith('image/')
  return /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(props.file.name)
})

const isVideo = computed(() => {
  if (props.file.mimeType) return props.file.mimeType.startsWith('video/')
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(props.file.name)
})

const isPdf = computed(() => {
  if (props.file.mimeType) return props.file.mimeType === 'application/pdf'
  return /\.pdf$/i.test(props.file.name)
})

const canPreview = computed(() => isImage.value || isVideo.value || isPdf.value)

onMounted(async () => {
  try {
    const result = await fileService.downloadFile(props.file.id)
    blobUrl.value = result.blobUrl
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load preview'
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (blobUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl.value)
  }
})

function handleDownload() {
  if (!blobUrl.value) return
  isDownloading.value = true
  try {
    const a = document.createElement('a')
    a.href = blobUrl.value
    a.download = props.file.name
    a.click()
  } finally {
    isDownloading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    @click.self="emit('close')"
    @keydown="onKeydown"
  >
    <div class="animate-in relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border-0 bg-surface-raised sm:h-[90vh] sm:w-[90vw] sm:rounded-2xl sm:border sm:border-surface-border">
      <div class="flex items-center justify-between border-b border-surface-border px-5 py-3">
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-sm font-medium text-surface-fg">{{ file.name }}</h3>
          <p class="text-xs text-surface-fg-subtle">{{ formatBytes(file.size) }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg p-2 text-surface-fg-subtle transition-colors hover:bg-surface-overlay hover:text-surface-fg"
            :disabled="isDownloading"
            @click="handleDownload"
          >
            <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
            <Download v-else class="h-4 w-4" />
          </button>
          <button
            class="rounded-lg p-2 text-surface-fg-subtle transition-colors hover:bg-surface-overlay hover:text-surface-fg"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="flex flex-1 items-center justify-center overflow-auto p-4">
        <div v-if="isLoading" class="flex flex-col items-center gap-3">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
          <span class="text-sm text-surface-fg-muted">Decrypting...</span>
        </div>

        <div v-else-if="error" class="text-center">
          <p class="text-sm text-danger">{{ error }}</p>
        </div>

        <div v-else-if="!canPreview" class="text-center">
          <p class="text-sm text-surface-fg-muted">Preview not available for this file type</p>
        </div>

        <img
          v-else-if="isImage && blobUrl"
          :src="blobUrl"
          :alt="file.name"
          class="max-h-full max-w-full object-contain"
        />

        <video
          v-else-if="isVideo && blobUrl"
          :src="blobUrl"
          controls
          autoplay
          class="max-h-full max-w-full"
        />

        <iframe
          v-else-if="isPdf && blobUrl"
          :src="blobUrl"
          class="h-full w-full border-0"
        />
      </div>
    </div>
  </div>
</template>
