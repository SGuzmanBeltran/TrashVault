<script setup lang="ts">
import { Folder, MoreVertical, Trash2, Pencil } from 'lucide-vue-next'
import { ref } from 'vue'
import type { Folder as FolderType } from '@/domain/types'
import { formatDate } from '@/utils'

defineProps<{
  folder: FolderType
  selected?: boolean
}>()

const emit = defineEmits<{
  open: [id: string]
  select: [id: string]
  delete: [id: string]
}>()

const showMenu = ref(false)
</script>

<template>
  <div
    class="group relative flex items-center gap-3.5 rounded-xl border border-surface-border bg-surface-raised p-4 transition-all duration-200 hover:border-accent/20 hover:shadow-lg hover:shadow-black/10 cursor-pointer"
    :class="selected ? 'border-accent/40 ring-1 ring-accent/20' : ''"
    @dblclick="emit('open', folder.id)"
    @click="emit('select', folder.id)"
  >
    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
      <Folder class="h-5 w-5 text-accent" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="truncate text-sm font-medium text-surface-fg">
        {{ folder.name }}
      </div>
      <div class="mt-0.5 flex items-center gap-2 text-xs text-surface-fg-subtle">
        <span>{{ folder.fileCount }} files</span>
        <span class="h-0.5 w-0.5 rounded-full bg-surface-fg-subtle" />
        <span>{{ formatDate(folder.createdAt) }}</span>
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
              @click.stop="showMenu = false"
            >
              <Pencil class="h-4 w-4" />
              Rename
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
              @click.stop="emit('delete', folder.id); showMenu = false"
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
