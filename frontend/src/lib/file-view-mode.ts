import type { FileViewMode } from '@/domain/types'

const VIEW_MODE_KEY = 'tv-files-view-mode'

export function loadFileViewMode(): FileViewMode {
  const saved = localStorage.getItem(VIEW_MODE_KEY)
  return saved === 'list' || saved === 'grid' ? saved : 'grid'
}

export function saveFileViewMode(mode: FileViewMode): void {
  localStorage.setItem(VIEW_MODE_KEY, mode)
}
