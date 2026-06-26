import type { AccentColor } from '@/domain/types'

export interface AccentPreset {
  name: Exclude<AccentColor, 'custom'>
  label: string
  hex: string
  description: string
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'cyan', label: 'Cyan', hex: '#22d3ee', description: 'Clean and modern' },
  { name: 'violet', label: 'Violet', hex: '#a78bfa', description: 'Creative and bold' },
  { name: 'orange', label: 'Orange', hex: '#fb923c', description: 'Warm and energetic' },
  { name: 'emerald', label: 'Emerald', hex: '#2dd4bf', description: 'Fresh and calm' },
  { name: 'rose', label: 'Rose', hex: '#f472b6', description: 'Soft and playful' },
]

export function getPresetHex(name: AccentColor, customHex?: string): string {
  if (name === 'custom') return customHex ?? '#22d3ee'
  return ACCENT_PRESETS.find((p) => p.name === name)?.hex ?? '#22d3ee'
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}
