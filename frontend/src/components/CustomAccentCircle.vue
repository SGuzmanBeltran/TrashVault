<script setup lang="ts">
defineProps<{
  selected?: boolean
  ringOffsetClass?: string
}>()

const emit = defineEmits<{
  open: []
}>()
</script>

<template>
  <button
    type="button"
    class="group relative block h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110"
    :class="selected ? `ring-2 ring-accent ring-offset-2 ${ringOffsetClass ?? 'ring-offset-surface-raised'}` : ''"
    title="Custom color"
    @click.stop="emit('open')"
  >
    <span
      class="block h-full w-full rounded-full border border-surface-border/40 bg-accent-rainbow shadow-inner"
    />
    <span
      v-if="selected"
      class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/25"
    >
      <svg class="h-3.5 w-3.5 text-white drop-shadow" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    </span>
  </button>
</template>
