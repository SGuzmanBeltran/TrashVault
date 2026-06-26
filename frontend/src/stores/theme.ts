import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AccentColor } from '@/domain/types'
import { isValidHex } from '@/config/accentColors'
import { applyAccentVariables, clearAccentVariables } from '@/utils/accent'

const VALID_ACCENTS: AccentColor[] = ['cyan', 'violet', 'orange', 'emerald', 'rose', 'custom']

function readAccent(): AccentColor {
  const saved = localStorage.getItem('tv-accent') as AccentColor | null
  return saved && VALID_ACCENTS.includes(saved) ? saved : 'cyan'
}

export const useThemeStore = defineStore('theme', () => {
  const accent = ref<AccentColor>(readAccent())
  const customHex = ref(localStorage.getItem('tv-accent-custom') || '#22d3ee')

  function applyAccent() {
    if (accent.value === 'custom') {
      document.documentElement.className = ''
      applyAccentVariables(customHex.value)
      return
    }

    clearAccentVariables()
    document.documentElement.className = `accent-${accent.value}`
  }

  function setAccent(color: AccentColor) {
    accent.value = color
    localStorage.setItem('tv-accent', color)
    applyAccent()
  }

  function setCustomAccent(hex: string) {
    if (!isValidHex(hex)) return

    customHex.value = hex
    localStorage.setItem('tv-accent-custom', hex)
    setAccent('custom')
  }

  function init() {
    applyAccent()
  }

  return { accent, customHex, setAccent, setCustomAccent, init }
})
