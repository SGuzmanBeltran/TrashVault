export function applyAccentVariables(hex: string) {
  const root = document.documentElement
  root.style.setProperty('--color-accent', hex)
  root.style.setProperty('--color-accent-soft', `${hex}18`)
  root.style.setProperty('--color-accent-muted', `${hex}40`)
  root.style.setProperty('--color-accent-fg', '#0a0a0f')
}

export function clearAccentVariables() {
  const root = document.documentElement
  root.style.removeProperty('--color-accent')
  root.style.removeProperty('--color-accent-soft')
  root.style.removeProperty('--color-accent-muted')
  root.style.removeProperty('--color-accent-fg')
}
