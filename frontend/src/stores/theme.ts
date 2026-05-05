import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AccentColor } from '@/domain/types'

export const useThemeStore = defineStore('theme', () => {
  const accent = ref<AccentColor>(
    (localStorage.getItem('tv-accent') as AccentColor) || 'cyan'
  )

  function setAccent(color: AccentColor) {
    accent.value = color
    localStorage.setItem('tv-accent', color)
    document.documentElement.className = `accent-${color}`
  }

  function init() {
    const saved = localStorage.getItem('tv-accent') as AccentColor | null
    if (saved) {
      accent.value = saved
      document.documentElement.className = `accent-${saved}`
    }
  }

  return { accent, setAccent, init }
})
