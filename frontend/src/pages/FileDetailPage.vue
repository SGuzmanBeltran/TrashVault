<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  Trash2,
  FileText,
  Image,
  Video,
  Music,
  Table,
  Presentation,
  Database,
  File,
  Calendar,
  HardDrive,
  FileType,
} from 'lucide-vue-next'
import { useFileService } from '@/services'
import { formatBytes, formatDate, getFileIcon } from '@/utils'
import type { FileItem } from '@/domain/types'
import type { Component } from 'vue'
import { useVaultStore } from '@/stores/vault'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const fileService = useFileService()
const vaultStore = useVaultStore()

const file = ref<FileItem | null>(null)
const isLoading = ref(true)
const thumbnailUrl = ref<string | null>(null)
const thumbnailError = ref(false)
const downloadUrl = ref<string | null>(null)
const isDragging = ref(false)

const isImageLike = computed(() => file.value?.mimeType.startsWith('image/') ?? false)
const isVideoLike = computed(() => file.value?.mimeType.startsWith('video/') ?? false)
const showThumbnail = computed(
  () => !!thumbnailUrl.value && !thumbnailError.value,
)

async function loadThumbnail() {
  if (!file.value?.thumbnailKey || !vaultStore.isUnlocked) return
  try {
    thumbnailUrl.value = await fileService.getThumbnailUrl(file.value.id)
  } catch {
    thumbnailError.value = true
  }
}

watch(
  () => vaultStore.isUnlocked,
  (unlocked) => {
    if (unlocked && file.value?.thumbnailKey) {
      loadThumbnail()
    }
  },
)

onMounted(async () => {
  try {
    file.value = await fileService.getFile(route.params.id as string)
    if (file.value?.thumbnailKey && vaultStore.isUnlocked) {
      await loadThumbnail()
    }
  } finally {
    isLoading.value = false
  }
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

const iconType = computed(() => (file.value ? getFileIcon(file.value.mimeType) : 'file'))
const iconClasses = computed(() => iconColorMap[iconType.value] ?? 'text-surface-fg-muted bg-surface-overlay')

async function downloadFile() {
  if (!file.value) return
  try {
    const result = await fileService.downloadFile(file.value.id)
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
  // Preload download URL only on drag, not on regular click
}

function onDragStart(event: DragEvent) {
  if (!file.value || !downloadUrl.value || !event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'copy'
  const downloadData = `${file.value.mimeType}:${file.value.name}:${downloadUrl.value}`
  event.dataTransfer.setData('DownloadURL', downloadData)
  isDragging.value = true
}

function onDragEnd() {
  isDragging.value = false
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <button
      class="animate-in flex items-center gap-2 text-sm text-surface-fg-muted transition-colors hover:text-surface-fg"
      @click="router.back()"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to files
    </button>

    <div v-if="isLoading" class="space-y-4">
      <div class="skeleton h-32 w-full rounded-xl" />
      <div class="skeleton h-6 w-48" />
      <div class="skeleton h-4 w-32" />
    </div>

    <template v-else-if="file">
      <div
        class="animate-in rounded-2xl border border-surface-border bg-surface-raised p-8 transition-all duration-200"
        :class="isDragging ? 'opacity-50 ring-1 ring-accent/40' : ''"
        draggable="true"
        @mousedown="onMouseDown"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      >
        <div class="flex flex-col items-center text-center">
          <div
            class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl"
            :class="showThumbnail ? '' : iconClasses"
          >
            <img
              v-if="showThumbnail && thumbnailUrl"
              :src="thumbnailUrl"
              :alt="file.name"
              class="h-full w-full object-cover"
              @error="thumbnailError = true"
              @load="thumbnailError = false"
            />
            <component
              v-else
              :is="iconMap[iconType] ?? File"
              class="h-7 w-7"
            />
          </div>

          <h1 class="mt-5 text-xl font-semibold tracking-tight text-surface-fg">
            {{ file.name }}
          </h1>

          <div class="mt-2 flex items-center gap-3 text-sm text-surface-fg-muted">
            <span class="flex items-center gap-1">
              <HardDrive class="h-3.5 w-3.5" />
              {{ formatBytes(file.size) }}
            </span>
            <span class="h-0.5 w-0.5 rounded-full bg-surface-fg-subtle" />
            <span class="flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5" />
              {{ formatDate(file.createdAt) }}
            </span>
            <span class="h-0.5 w-0.5 rounded-full bg-surface-fg-subtle" />
            <span class="flex items-center gap-1">
              <FileType class="h-3.5 w-3.5" />
              {{ file.mimeType }}
            </span>
          </div>

          <div class="mt-8 flex items-center gap-3">
            <button
              class="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]"
              @click="downloadFile"
            >
              <Download class="h-4 w-4" />
              Download
            </button>
            <button class="flex items-center gap-2 rounded-lg border border-surface-border px-5 py-2.5 text-sm text-surface-fg-muted transition-colors hover:border-danger/40 hover:bg-danger-soft hover:text-danger">
              <Trash2 class="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div class="animate-in animate-stagger-1 rounded-2xl border border-surface-border bg-surface-raised">
        <div class="border-b border-surface-border px-6 py-4">
          <h2 class="text-sm font-medium text-surface-fg">Details</h2>
        </div>
        <div class="divide-y divide-surface-border">
          <div class="flex items-center justify-between px-6 py-3.5">
            <span class="text-sm text-surface-fg-muted">File name</span>
            <span class="text-sm text-surface-fg">{{ file.name }}</span>
          </div>
          <div class="flex items-center justify-between px-6 py-3.5">
            <span class="text-sm text-surface-fg-muted">Type</span>
            <span class="text-sm text-surface-fg">{{ file.mimeType }}</span>
          </div>
          <div class="flex items-center justify-between px-6 py-3.5">
            <span class="text-sm text-surface-fg-muted">Size</span>
            <span class="text-sm text-surface-fg">{{ formatBytes(file.size) }}</span>
          </div>
          <div class="flex items-center justify-between px-6 py-3.5">
            <span class="text-sm text-surface-fg-muted">Created</span>
            <span class="text-sm text-surface-fg">{{ new Date(file.createdAt).toLocaleString() }}</span>
          </div>
          <div class="flex items-center justify-between px-6 py-3.5">
            <span class="text-sm text-surface-fg-muted">Modified</span>
            <span class="text-sm text-surface-fg">{{ new Date(file.updatedAt).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
