import { ref } from 'vue'

export type UploadConflictAction = 'replace' | 'keepBoth' | 'skip'

export interface UploadConflictPrompt {
  fileName: string
  remainingCount: number
}

export interface UploadConflictResult {
  action: UploadConflictAction
  applyToAll: boolean
}

const visible = ref(false)
const prompt = ref<UploadConflictPrompt | null>(null)

let resolvePrompt: ((result: UploadConflictResult) => void) | null = null

export function useUploadConflict() {
  function askConflict(conflict: UploadConflictPrompt): Promise<UploadConflictResult> {
    prompt.value = conflict
    visible.value = true
    return new Promise((resolve) => {
      resolvePrompt = resolve
    })
  }

  function respond(action: UploadConflictAction, applyToAll: boolean) {
    visible.value = false
    prompt.value = null
    resolvePrompt?.({ action, applyToAll })
    resolvePrompt = null
  }

  return {
    visible,
    prompt,
    askConflict,
    respond,
  }
}
