import type { AccentColor } from '@/domain/types'

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]!}`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'music'
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text'
  if (mimeType.includes('sql') || mimeType.includes('json') || mimeType.includes('xml')) return 'database'
  return 'file'
}

export function getFileColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'text-pink-400'
  if (mimeType.startsWith('video/')) return 'text-purple-400'
  if (mimeType.startsWith('audio/')) return 'text-amber-400'
  if (mimeType.includes('pdf')) return 'text-red-400'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-emerald-400'
  if (mimeType.includes('presentation')) return 'text-orange-400'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-400'
  return 'text-surface-fg-muted'
}

export function getAccentClasses(accent: AccentColor) {
  const map = {
    cyan: 'accent-cyan',
    violet: 'accent-violet',
    orange: 'accent-orange',
  }
  return map[accent]
}
