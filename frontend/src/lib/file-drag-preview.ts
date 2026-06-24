let dragPreviewEl: HTMLElement | null = null

function dragPreviewLabel(fileCount: number): string {
  return fileCount === 1 ? 'Move 1 file' : `Move ${fileCount} files`
}

export function setFileDragPreview(event: DragEvent, fileCount: number): void {
  if (!event.dataTransfer) return

  removeFileDragPreview()

  const ghost = document.createElement('div')
  ghost.textContent = dragPreviewLabel(fileCount)
  Object.assign(ghost.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    color: 'var(--color-surface-fg)',
    background: 'var(--color-surface-raised)',
    border: '1px solid var(--color-accent-muted)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: '9999',
  })

  document.body.appendChild(ghost)
  dragPreviewEl = ghost

  event.dataTransfer.setDragImage(
    ghost,
    Math.round(ghost.offsetWidth / 2),
    Math.round(ghost.offsetHeight / 2),
  )
}

export function removeFileDragPreview(): void {
  dragPreviewEl?.remove()
  dragPreviewEl = null
}
