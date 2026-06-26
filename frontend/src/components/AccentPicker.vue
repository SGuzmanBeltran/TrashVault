<script setup lang="ts">
import { ref } from 'vue'
import { Palette } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import { ACCENT_PRESETS } from '@/config/accentColors'
import CustomAccentCircle from '@/components/CustomAccentCircle.vue'
import CustomAccentEditor from '@/components/CustomAccentEditor.vue'

const themeStore = useThemeStore()
const isOpen = ref(false)
const customEditorOpen = ref(false)

function isSelected(name: typeof ACCENT_PRESETS[number]['name']) {
  return themeStore.accent === name
}

function selectPreset(name: typeof ACCENT_PRESETS[number]['name']) {
  themeStore.setAccent(name)
  isOpen.value = false
  customEditorOpen.value = false
}

function openCustomEditor() {
  customEditorOpen.value = true
  isOpen.value = false
}

function closeCustomEditor() {
  customEditorOpen.value = false
}
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
        class="absolute right-0 top-full z-50 mt-1.5 w-[9.5rem] rounded-xl border border-surface-border bg-surface-raised p-3 shadow-xl shadow-black/30"
      >
        <div class="text-[11px] font-medium uppercase tracking-wider text-surface-fg-subtle">
          Accent Color
        </div>
        <div class="mt-2.5 grid grid-cols-3 gap-x-3 gap-y-2.5 place-items-center">
          <button
            v-for="a in ACCENT_PRESETS"
            :key="a.name"
            class="group relative h-8 w-8 rounded-full transition-transform hover:scale-110"
            :class="isSelected(a.name) ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-raised' : ''"
            :style="{ backgroundColor: a.hex }"
            :title="a.label"
            @click="selectPreset(a.name)"
          >
            <span
              v-if="isSelected(a.name)"
              class="absolute inset-0 flex items-center justify-center text-accent-fg"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </span>
          </button>

          <CustomAccentCircle
            :selected="themeStore.accent === 'custom'"
            @open="openCustomEditor"
          />
        </div>
      </div>
    </Transition>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="customEditorOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          @click.self="closeCustomEditor"
        >
          <div
            class="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-xl shadow-black/30"
            @click.stop
          >
            <h3 class="text-base font-medium text-surface-fg">Custom accent color</h3>
            <div class="mt-4">
              <CustomAccentEditor
                :open="customEditorOpen"
                @apply="closeCustomEditor"
                @cancel="closeCustomEditor"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
