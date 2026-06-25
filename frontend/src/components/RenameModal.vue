<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  name: string
  itemLabel: string
  isLoading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [name: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const draftName = ref(props.name)

const canSubmit = computed(
  () => draftName.value.trim().length > 0 && !props.isLoading,
)

watch(
  () => props.name,
  (name) => {
    draftName.value = name
  },
)

watch(
  inputRef,
  async (el) => {
    if (!el) return
    await nextTick()
    el.focus()
    el.select()
  },
  { immediate: true },
)

function handleSubmit() {
  const trimmed = draftName.value.trim()
  if (!trimmed || props.isLoading) return
  emit('confirm', trimmed)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      @mousedown.self="emit('close')"
    >
      <form
        class="w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30"
        @submit.prevent="handleSubmit"
        @mousedown.stop
      >
        <div class="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <h3 class="text-sm font-medium text-surface-fg">Rename {{ itemLabel }}</h3>
            <p class="mt-0.5 text-xs text-surface-fg-subtle">Enter a new name</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="px-5 py-4">
          <input
            ref="inputRef"
            v-model="draftName"
            type="text"
            class="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-surface-fg outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            :disabled="isLoading"
            @keydown.enter.prevent="handleSubmit"
            @keydown.escape.prevent="emit('close')"
          />
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-surface-border px-5 py-4">
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:text-surface-fg"
            :disabled="isLoading"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            Rename
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
