<script setup lang="ts">
import { computed } from 'vue'
import { X, Check, AlertCircle, Loader2 } from 'lucide-vue-next'
import { formatBytes } from '@/utils'
import type { FileItem } from '@/domain/types'

export interface UploadItem {
  id: string
  file: File
  status: 'uploading' | 'completed' | 'failed'
  progress: number
  result?: FileItem
  error?: string
}

const props = defineProps<{
  item: UploadItem
}>()

const emit = defineEmits<{
  cancel: [id: string]
  dismiss: [id: string]
  retry: [id: string]
}>()

const statusIcon = computed(() => {
  if (props.item.status === 'uploading') return Loader2
  if (props.item.status === 'completed') return Check
  return AlertCircle
})

const statusColor = computed(() => {
  if (props.item.status === 'completed') return 'text-success'
  if (props.item.status === 'failed') return 'text-danger'
  return 'text-accent'
})

const statusBg = computed(() => {
  if (props.item.status === 'completed') return 'bg-success/10'
  if (props.item.status === 'failed') return 'bg-danger/10'
  return 'bg-accent/10'
})
</script>

<template>
  <div
    class="group relative flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised/90 p-3 backdrop-blur-sm transition-colors hover:bg-surface-raised"
  >
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      :class="statusBg"
    >
      <component
        :is="statusIcon"
        class="h-4 w-4"
        :class="[statusColor, item.status === 'uploading' ? 'animate-spin' : '']"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <span class="truncate text-[13px] font-medium leading-snug text-surface-fg">
          {{ item.file.name }}
        </span>
        <span class="shrink-0 text-[11px] tabular-nums text-surface-fg-subtle">
          {{ formatBytes(item.file.size) }}
        </span>
      </div>

      <div class="mt-1.5 flex items-center gap-2">
        <div class="h-1 flex-1 overflow-hidden rounded-full bg-surface-overlay">
          <div
            class="h-full rounded-full transition-all duration-300 ease-out"
            :class="[
              item.status === 'failed' ? 'bg-danger' : 'bg-accent',
            ]"
            :style="{ width: `${item.progress}%` }"
          />
        </div>

        <span
          v-if="item.status === 'uploading'"
          class="text-[11px] tabular-nums text-surface-fg-subtle"
        >
          {{ item.progress }}%
        </span>
        <span
          v-else-if="item.status === 'failed'"
          class="truncate text-[11px] text-danger"
        >
          {{ item.error }}
        </span>
      </div>
    </div>

    <button
      v-if="item.status === 'uploading'"
      class="shrink-0 rounded-lg p-1.5 text-surface-fg-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
      @click="emit('cancel', item.id)"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <button
      v-if="item.status === 'failed'"
      class="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
      @click="emit('retry', item.id)"
    >
      Retry
    </button>

    <button
      v-if="item.status === 'completed' || item.status === 'failed'"
      class="shrink-0 rounded-lg p-1.5 text-surface-fg-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-overlay hover:text-surface-fg"
      @click="emit('dismiss', item.id)"
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>
</template>
