interface BackendFileItem {
  id: string
  name: string
  mimeType: string
  size: number
  folderId: string | null
  createdAt: string
}

interface UploadProgressCallbacks {
  onProgress: (progress: number) => void
  signal?: AbortSignal
}

export function uploadWithProgress(
  file: File,
  folderId: string | null,
  { onProgress, signal }: UploadProgressCallbacks,
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
        reject(new Error(xhr.statusText || 'Upload failed'))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))

    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      formData.append('folderId', folderId)
    }

    xhr.send(formData)
  })
}
