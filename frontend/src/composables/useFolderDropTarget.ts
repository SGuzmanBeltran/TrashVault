import { ref } from 'vue'
import {
  acceptsFolderDrop,
  getFileDragData,
  isExternalFileDrag,
  isInternalFileDrag,
} from '@/lib/file-drag'

interface FolderDropHandlers {
  onMoveFiles: (fileIds: string[]) => void | Promise<void>
  onExternalDrop: (event: DragEvent) => void | Promise<void>
}

interface FolderDropTargetOptions {
  canDrop?: () => boolean
}

export function useFolderDropTarget(
  handlers: FolderDropHandlers,
  options?: FolderDropTargetOptions,
) {
  const isDropTarget = ref(false)

  function canAccept(event: DragEvent) {
    if (options?.canDrop && !options.canDrop()) return false
    return acceptsFolderDrop(event)
  }

  function onDragEnter(event: DragEvent) {
    if (!canAccept(event)) return
    event.preventDefault()
    event.stopPropagation()
    isDropTarget.value = true
  }

  function onDragOver(event: DragEvent) {
    if (!canAccept(event)) return
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = isInternalFileDrag(event) ? 'move' : 'copy'
    }
    isDropTarget.value = true
  }

  function onDragLeave(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    const related = event.relatedTarget as Node | null
    const current = event.currentTarget as HTMLElement
    if (related && current.contains(related)) return
    isDropTarget.value = false
  }

  async function onDrop(event: DragEvent) {
    if (options?.canDrop && !options.canDrop()) return
    event.preventDefault()
    event.stopPropagation()
    isDropTarget.value = false

    const payload = event.dataTransfer ? getFileDragData(event.dataTransfer) : null
    if (payload) {
      await handlers.onMoveFiles(payload.fileIds)
      return
    }

    if (isExternalFileDrag(event)) {
      await handlers.onExternalDrop(event)
    }
  }

  return {
    isDropTarget,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}
