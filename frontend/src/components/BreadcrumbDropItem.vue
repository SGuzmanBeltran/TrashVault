<script setup lang="ts">
import { Home, ChevronRight } from 'lucide-vue-next'
import { useFileStore } from '@/stores/files'
import { useFolderDropTarget } from '@/composables/useFolderDropTarget'
import { useExternalFolderUpload } from '@/composables/useExternalFolderUpload'

const props = defineProps<{
  folderId: string | null
  name: string
  showSeparator: boolean
  isCurrent: boolean
}>()

const emit = defineEmits<{
  navigate: []
}>()

const fileStore = useFileStore()
const { uploadExternalDrop } = useExternalFolderUpload()

const { isDropTarget, onDragEnter, onDragOver, onDragLeave, onDrop } = useFolderDropTarget(
  {
    onMoveFiles: (fileIds) => fileStore.moveFilesToFolder(fileIds, props.folderId),
    onExternalDrop: (event) => uploadExternalDrop(event, props.folderId),
  },
  { canDrop: () => !props.isCurrent },
)
</script>

<template>
  <div class="flex items-center">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all duration-150"
      :class="[
        isCurrent
          ? 'border-transparent font-medium text-surface-fg'
          : 'cursor-pointer border-transparent text-surface-fg-muted hover:bg-surface-overlay hover:text-surface-fg',
        isDropTarget
          ? 'relative z-10 scale-[1.03] border-accent bg-accent/20 font-medium text-accent shadow-lg shadow-accent/15 ring-2 ring-accent/50'
          : '',
      ]"
      @click="!isCurrent && emit('navigate')"
      @dragenter="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <Home v-if="folderId === null" class="h-3.5 w-3.5 shrink-0" />
      <span class="whitespace-nowrap">{{ name }}</span>
    </button>

    <ChevronRight
      v-if="showSeparator"
      class="mx-1.5 h-3.5 w-3.5 shrink-0 text-surface-fg-subtle"
    />
  </div>
</template>
