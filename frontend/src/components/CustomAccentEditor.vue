<script setup lang="ts">
import { ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { isValidHex } from '@/config/accentColors'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  apply: []
  cancel: []
}>()

const themeStore = useThemeStore()
const draftHex = ref(themeStore.customHex)

watch(
  () => props.open,
  (open) => {
    if (open) draftHex.value = themeStore.customHex
  },
)

function normalizeHex(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

function onColorInput(event: Event) {
  draftHex.value = (event.target as HTMLInputElement).value
}

function onHexBlur() {
  const normalized = normalizeHex(draftHex.value)
  if (isValidHex(normalized)) draftHex.value = normalized
}

function cancel() {
  draftHex.value = themeStore.customHex
  emit('cancel')
}

function apply() {
  const normalized = normalizeHex(draftHex.value)
  if (!isValidHex(normalized)) return

  themeStore.setCustomAccent(normalized)
  draftHex.value = normalized
  emit('apply')
}

const previewHex = () =>
  isValidHex(normalizeHex(draftHex.value)) ? normalizeHex(draftHex.value) : themeStore.customHex
</script>

<template>
  <div v-if="open" class="space-y-4">
    <p class="text-sm text-surface-fg-muted">
      Choose a color, then press Apply to use it across the app.
    </p>

    <div class="flex flex-wrap items-center gap-4">
      <label class="flex shrink-0 cursor-pointer flex-col items-center gap-1.5">
        <span class="text-xs font-medium text-surface-fg-subtle">Picker</span>
        <input
          type="color"
          :value="previewHex()"
          class="h-14 w-14 cursor-pointer rounded-xl border-2 border-surface-border bg-surface p-1"
          @input="onColorInput"
        />
      </label>

      <div class="min-w-0 flex-1">
        <label class="text-xs font-medium text-surface-fg-subtle">Hex code</label>
        <input
          v-model="draftHex"
          type="text"
          maxlength="7"
          placeholder="#22d3ee"
          class="mt-1.5 w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 font-mono text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
          @blur="onHexBlur"
          @keydown.enter="apply"
        />
      </div>

      <div class="flex shrink-0 flex-col items-center gap-1.5">
        <span class="text-xs font-medium text-surface-fg-subtle">Preview</span>
        <div
          class="h-14 w-14 rounded-xl border-2 border-surface-border"
          :style="{ backgroundColor: previewHex() }"
        />
      </div>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-lg border border-surface-border px-4 py-2.5 text-sm font-medium text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
        @click="cancel"
      >
        Cancel
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!isValidHex(normalizeHex(draftHex))"
        @click="apply"
      >
        Apply
      </button>
    </div>
  </div>
</template>
