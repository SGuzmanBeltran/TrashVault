<script setup lang="ts">
import { ref } from 'vue'
import { Palette } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import type { AccentColor } from '@/domain/types'

const themeStore = useThemeStore()
const isOpen = ref(false)

const accents: { name: AccentColor; label: string; hex: string }[] = [
  { name: 'cyan', label: 'Cyan', hex: '#22d3ee' },
  { name: 'violet', label: 'Violet', hex: '#a78bfa' },
  { name: 'orange', label: 'Orange', hex: '#fb923c' },
]
</script>

<template>
  <div class="relative">
    <button
      class="rounded-lg p-2 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg"
      @click="isOpen = !isOpen"
    >
      <Palette class="h-4 w-4" />
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
        v-if="isOpen"
        class="absolute right-0 top-full z-50 mt-1.5 rounded-xl border border-surface-border bg-surface-raised p-2 shadow-xl shadow-black/30"
      >
        <div class="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-surface-fg-subtle">
          Accent Color
        </div>
        <div class="mt-1.5 flex gap-1.5">
          <button
            v-for="a in accents"
            :key="a.name"
            class="group relative h-8 w-8 rounded-full transition-transform hover:scale-110"
            :class="themeStore.accent === a.name ? 'ring-2 ring-offset-2 ring-offset-surface-raised' : ''"
            :style="{ backgroundColor: a.hex }"
            :title="a.label"
            @click="themeStore.setAccent(a.name); isOpen = false"
          >
            <span
              v-if="themeStore.accent === a.name"
              class="absolute inset-0 flex items-center justify-center text-accent-fg"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
