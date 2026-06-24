import { onMounted, onUnmounted } from 'vue'

export function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLInputElement) {
    return target.type === 'text' || target.type === 'password' || target.type === 'email'
  }
  return target.isContentEditable
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

const isMac = navigator.platform.toUpperCase().includes('MAC')

export interface FileKeyboardShortcutHandlers {
  onDelete: () => boolean | void
  onEnter: () => boolean | void
  onEscape: () => void
  onSelectAll: () => void
  onUpload: () => void
  isDisabled?: () => boolean
}

export function isSelectAllShortcut(event: KeyboardEvent): boolean {
  const mod = event.ctrlKey || event.metaKey
  return mod && (event.code === 'KeyA' || event.key.toLowerCase() === 'a')
}

export function useFileKeyboardShortcuts(handlers: FileKeyboardShortcutHandlers) {
  function onKeydown(event: KeyboardEvent) {
    if (isSelectAllShortcut(event)) {
      if (!isTextEditingTarget(event.target)) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        if (!handlers.isDisabled?.()) handlers.onSelectAll()
      }
      return
    }

    if (isEditableTarget(event.target)) return

    const mod = event.ctrlKey || event.metaKey

    if (event.key === 'Escape') {
      handlers.onEscape()
      return
    }

    if (handlers.isDisabled?.()) return

    if (mod && (event.code === 'KeyU' || event.key.toLowerCase() === 'u')) {
      event.preventDefault()
      handlers.onUpload()
      return
    }

    if (event.key === 'Delete' || (isMac && event.key === 'Backspace')) {
      if (handlers.onDelete()) event.preventDefault()
      return
    }

    if (event.key === 'Enter') {
      if (handlers.onEnter()) event.preventDefault()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown, true))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown, true))
}
