import { ref } from 'vue'

const openMenuKey = ref<string | null>(null)
const position = ref({ top: 0, right: 0 })

function updatePosition(button: HTMLElement) {
  const rect = button.getBoundingClientRect()
  position.value = {
    top: rect.bottom + 4,
    right: window.innerWidth - rect.right,
  }
}

export function itemMenuKey(kind: 'file' | 'folder', id: string) {
  return `${kind}:${id}`
}

export function useItemMenuRegistry() {
  function open(key: string, button: HTMLElement) {
    updatePosition(button)
    openMenuKey.value = key
  }

  function close() {
    openMenuKey.value = null
  }

  function closeIf(key: string) {
    if (openMenuKey.value === key) close()
  }

  return {
    openMenuKey,
    position,
    open,
    close,
    closeIf,
    updatePosition,
  }
}
