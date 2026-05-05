<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
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

const route = useRoute()
const router = useRouter()
const fileService = useFileService()

const file = ref<FileItem | null>(null)
const isLoading = ref(true)

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

onMounted(async () => {
  try {
    file.value = await fileService.getFile(route.params.id as string)
  } finally {
    isLoading.value = false
  }
})

const iconType = computed(() => (file.value ? getFileIcon(file.value.mimeType) : 'file'))
const iconClasses = computed(() => iconColorMap[iconType.value] ?? 'text-surface-fg-muted bg-surface-overlay')
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
      <div class="animate-in rounded-2xl border border-surface-border bg-surface-raised p-8">
        <div class="flex flex-col items-center text-center">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-2xl"
            :class="iconClasses"
          >
            <component
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
            <button class="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]">
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
