import type { UploadProgressCallbacks } from '@/ports'
import type { BackendFileItem } from '@/adapters/mappers'

interface UploadOptions {
  replaceFileId?: string
}

export function uploadWithProgress(
  file: File,
  folderId: string | null,
  { onProgress, signal }: UploadProgressCallbacks,
  thumbnail?: File,
  options?: UploadOptions,
): Promise<BackendFileItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('POST', '/api/files/upload')
    xhr.withCredentials = true

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }
      signal.addEventListener('abort', () => xhr.abort())
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new Error('Invalid server response'))
        }
      } else {
        let message = xhr.statusText || 'Upload failed'
        try {
          const json = JSON.parse(xhr.responseText) as { error?: string }
          if (json.error) message = json.error
        } catch {
          // keep status text
        }
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))

    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      formData.append('folderId', folderId)
    }
    if (thumbnail) {
      formData.append('thumbnail', thumbnail)
    }
    if (options?.replaceFileId) {
      formData.append('replaceFileId', options.replaceFileId)
    }

    xhr.send(formData)
  })
}
