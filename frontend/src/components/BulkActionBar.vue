<script setup lang="ts">
import { FolderInput, Trash2, X, Loader2 } from 'lucide-vue-next'

defineProps<{
  count: number
  isLoading?: boolean
}>()

const emit = defineEmits<{
  move: []
  delete: []
  clear: []
}>()
</script>

<template>
  <div
    class="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-surface-border bg-surface-raised/95 px-2 py-2 shadow-xl shadow-black/30 backdrop-blur-sm"
  >
    <span class="px-3 text-sm text-surface-fg-muted">
      <Loader2 v-if="isLoading" class="mr-1.5 inline h-4 w-4 animate-spin" />
      {{ count }} selected
    </span>

    <div class="h-5 w-px bg-surface-border" />

    <button
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg disabled:opacity-50"
      :disabled="isLoading"
      @click="emit('move')"
    >
      <FolderInput class="h-4 w-4" />
      Move
    </button>

    <button
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
      :disabled="isLoading"
      @click="emit('delete')"
    >
      <Trash2 class="h-4 w-4" />
      Delete
    </button>

    <div class="h-5 w-px bg-surface-border" />

    <button
      class="rounded-lg p-2 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg disabled:opacity-50"
      :disabled="isLoading"
      title="Clear selection"
      @click="emit('clear')"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
