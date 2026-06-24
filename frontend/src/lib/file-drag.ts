export const FILE_DRAG_MIME = 'application/x-trashvault-files'

export interface FileDragPayload {
  fileIds: string[]
}

export function setFileDragData(dataTransfer: DataTransfer, fileIds: string[]): void {
  dataTransfer.effectAllowed = 'move'
  dataTransfer.setData(FILE_DRAG_MIME, JSON.stringify({ fileIds }))
}

export function getFileDragData(dataTransfer: DataTransfer): FileDragPayload | null {
  const raw = dataTransfer.getData(FILE_DRAG_MIME)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as FileDragPayload
    if (!Array.isArray(parsed.fileIds) || parsed.fileIds.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

export function isInternalFileDrag(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  if (!types) return false
  return Array.from(types).includes(FILE_DRAG_MIME)
}

export function isExternalFileDrag(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  if (!types) return false
  const typeList = Array.from(types)
  return typeList.includes('Files') && !typeList.includes(FILE_DRAG_MIME)
}

export function acceptsFolderDrop(event: DragEvent): boolean {
  return isInternalFileDrag(event) || isExternalFileDrag(event)
}
